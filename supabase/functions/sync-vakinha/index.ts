import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    // Verify token matches SERVICE_ROLE_KEY or user admin token
    const token = authHeader.replace(/^Bearer\s+/, '')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const dbServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YmFrZ2VvZnluaXp2dGFxbHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ4MjU5NCwiZXhwIjoyMDkzMDU4NTk0fQ.jaEdnXt2r-Xr2vvT1JKJVpU4wS7oz7_GWe9wfzxl854'
    
    let isAuthorized = token === serviceRoleKey || token === dbServiceRoleKey

    if (!isAuthorized) {
      // Check if user is an admin via the standard auth token
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_ANON_KEY') || '',
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: profile, error: profileError } = await userClient
        .from('profiles')
        .select('permissions')
        .eq('id', (await userClient.auth.getUser()).data.user?.id || '')
        .single()

      if (!profileError && profile?.permissions?.length) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Forbidden — not authorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      })
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || dbServiceRoleKey
    )
    console.log(`[Vakinha Sync] Has SUPABASE_SERVICE_ROLE_KEY: ${!!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`)

    // 1. Get vakinha_url from site_settings
    const { data: settingData, error: settingError } = await serviceClient
      .from('site_settings')
      .select('value')
      .eq('key', 'vakinha_url')
      .single()

    if (settingError || !settingData?.value) {
      throw new Error(settingError?.message || 'vakinha_url setting not found')
    }

    const url = settingData.value
    console.log(`[Vakinha Sync] Fetching url: ${url}`)

    let amount = 0
    let donorsCount = 0
    let netAmount = 0
    let withdrawableAmount = 0
    let pendingAmount = 0
    let lastUpdatedISO = new Date().toISOString()
    let isManual = false

    try {
      const body = await req.json()
      if (body && (body.net_amount !== undefined || body.gross_amount !== undefined)) {
        amount = parseFloat(body.gross_amount || '0')
        netAmount = parseFloat(body.net_amount || '0')
        donorsCount = parseInt(body.donors_count || '0', 10)
        withdrawableAmount = parseFloat(body.withdrawable_amount || '0')
        pendingAmount = parseFloat(body.pending_amount || '0')
        isManual = true
      }
    } catch (_) {
      // Body is not JSON or empty
    }

    if (!isManual) {
      // 2. Fetch page HTML
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch Vakinha page: ${res.statusText}`)
      }

      const html = await res.text()

      // 3. Parse HTML
      const regex = /"name":"Quanto a vaquinha já arrecadou\?","acceptedAnswer":\{"@type":"Answer","text":"([^"]+)"\}/
      const match = html.match(regex)
      if (!match) {
        throw new Error('Vakinha FAQ answer pattern not found in page HTML')
      }

      const text = match[1]
      const amountMatch = text.match(/Valor arrecadado:\s*R\$\s*([\d.,]+)/)
      const donorsMatch = text.match(/Número de doadores:\s*(\d+)/)

      if (!amountMatch || !donorsMatch) {
        throw new Error(`Failed to match individual metrics in text: ${text}`)
      }

      amount = parseFloat(amountMatch[1].replace(/\./g, '').replace(',', '.'))
      donorsCount = parseInt(donorsMatch[1], 10)
      
      // Calculate estimated net amount (6.4% + R$ 0.50 per donor) - withdrawal fee is only charged upon withdrawal
      const calculatedFee = (amount * 0.064) + (donorsCount * 0.50)
      netAmount = Math.max(0, amount - calculatedFee)

      // Fetch existing withdrawable and pending amounts to avoid overwriting them to 0 during auto sync
      const { data: existingSettings } = await serviceClient
        .from('site_settings')
        .select('key, value')
        .in('key', ['vakinha_withdrawable_amount', 'vakinha_pending_amount'])

      if (existingSettings) {
        const withdrawableSetting = existingSettings.find(s => s.key === 'vakinha_withdrawable_amount')
        const pendingSetting = existingSettings.find(s => s.key === 'vakinha_pending_amount')
        if (withdrawableSetting) withdrawableAmount = parseFloat(withdrawableSetting.value) || 0
        if (pendingSetting) pendingAmount = parseFloat(pendingSetting.value) || 0
      }
    }

    console.log(`[Vakinha Sync] Gross: ${amount}, Net: ${netAmount}, Donors: ${donorsCount}, Withdrawable: ${withdrawableAmount}, Pending: ${pendingAmount}, Updated: ${lastUpdatedISO}`)

    // 4. Update the financial record with description 'Vakinha' (with netAmount!)
    const { error: recordError } = await serviceClient
      .from('financial_records')
      .update({ amount: netAmount })
      .eq('description', 'Vakinha')

    if (recordError) {
      throw new Error(`Failed to update financial records: ${recordError.message}`)
    }

    // 5. Upsert settings
    const upserts = [
      { key: 'vakinha_gross_amount', value: amount.toString(), label: 'Bruto da Vakinha', category: 'donations', updated_at: lastUpdatedISO },
      { key: 'vakinha_net_amount', value: netAmount.toString(), label: 'Líquido da Vakinha', category: 'donations', updated_at: lastUpdatedISO },
      { key: 'vakinha_donors_count', value: donorsCount.toString(), label: 'Doadores da Vakinha', category: 'donations', updated_at: lastUpdatedISO },
      { key: 'vakinha_withdrawable_amount', value: withdrawableAmount.toString(), label: 'Liberado para Saque', category: 'donations', updated_at: lastUpdatedISO },
      { key: 'vakinha_pending_amount', value: pendingAmount.toString(), label: 'Aguardando Liberação', category: 'donations', updated_at: lastUpdatedISO },
      { key: 'vakinha_last_updated', value: lastUpdatedISO, label: 'Última atualização da Vakinha', category: 'donations', updated_at: lastUpdatedISO }
    ]

    for (const item of upserts) {
      const { error: updateError } = await serviceClient
        .from('site_settings')
        .update({ value: item.value, updated_at: item.updated_at })
        .eq('key', item.key)
      
      if (updateError) {
        throw new Error(`Failed to update setting ${item.key}: ${updateError.message}`)
      }
    }

    // 6. Force sync totals with site_settings (target_amount / current_amount)
    // First, calculate totals by querying all financial_records
    const { data: records, error: queryError } = await serviceClient
      .from('financial_records')
      .select('amount, type')

    if (!queryError && records) {
      let income = 0
      let expense = 0
      for (const rec of records) {
        const val = parseFloat(rec.amount)
        if (rec.type === 'income') {
          income += val
        } else {
          expense += val
        }
      }
      // Upsert target_amount (expense) and current_amount (income) in site_settings
      await serviceClient.from('site_settings').update({ value: expense.toString(), updated_at: lastUpdatedISO }).eq('key', 'target_amount')
      await serviceClient.from('site_settings').update({ value: income.toString(), updated_at: lastUpdatedISO }).eq('key', 'current_amount')
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: { amount, netAmount, donorsCount, withdrawableAmount, pendingAmount, lastUpdated: lastUpdatedISO } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[Vakinha Sync] Error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

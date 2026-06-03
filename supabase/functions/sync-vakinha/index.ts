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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

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
    const regex = /"Quanto a vaquinha já arrecadou\?","acceptedAnswer":\{"@type":"Answer","text":"([^"]+)"\}/
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

    const amount = parseFloat(amountMatch[1].replace(/\./g, '').replace(',', '.'))
    const donorsCount = parseInt(donorsMatch[1], 10)
    const lastUpdatedISO = new Date().toISOString()

    console.log(`[Vakinha Sync] Amount: ${amount}, Donors: ${donorsCount}, Updated: ${lastUpdatedISO}`)

    // 4. Update the financial record with description 'Vakinha'
    const { error: recordError } = await serviceClient
      .from('financial_records')
      .update({ amount })
      .eq('description', 'Vakinha')

    if (recordError) {
      throw new Error(`Failed to update financial records: ${recordError.message}`)
    }

    // 5. Upsert settings: vakinha_donors_count, vakinha_last_updated
    const upserts = [
      { key: 'vakinha_donors_count', value: donorsCount.toString(), label: 'Doadores da Vakinha', category: 'donations', updated_at: lastUpdatedISO },
      { key: 'vakinha_last_updated', value: lastUpdatedISO, label: 'Última atualização da Vakinha', category: 'donations', updated_at: lastUpdatedISO }
    ]

    for (const item of upserts) {
      const { error: upsertError } = await serviceClient
        .from('site_settings')
        .upsert(item, { onConflict: 'key' })
      
      if (upsertError) {
        throw new Error(`Failed to upsert setting ${item.key}: ${upsertError.message}`)
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
      await serviceClient.from('site_settings').upsert({ key: 'target_amount', value: expense.toString(), updated_at: lastUpdatedISO }, { onConflict: 'key' })
      await serviceClient.from('site_settings').upsert({ key: 'current_amount', value: income.toString(), updated_at: lastUpdatedISO }, { onConflict: 'key' })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: { amount, donorsCount, lastUpdated: lastUpdatedISO } 
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

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const { payment_id, order_id } = await req.json()

    if (!payment_id || !order_id) {
      return new Response(JSON.stringify({ error: 'Missing payment_id or order_id' }), { headers: corsHeaders, status: 400 })
    }

    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: 'MP_ACCESS_TOKEN not configured' }), { headers: corsHeaders, status: 500 })
    }

    // 1. Fetch payment from Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`
      }
    })

    if (!mpRes.ok) {
      const errorText = await mpRes.text()
      return new Response(JSON.stringify({ error: 'Failed to fetch from Mercado Pago', details: errorText }), { headers: corsHeaders, status: 400 })
    }

    const mpData = await mpRes.json()

    // 2. Check if approved
    if (mpData.status === 'approved') {
      const mpApprovedTimestamp = mpData.date_approved;
      const pollingTimestamp = new Date().toISOString();
      console.log(`[DIAGNÓSTICO MP POLLING] Pagamento Aprovado no MP às: ${mpApprovedTimestamp} | Polling detectou às: ${pollingTimestamp}`);

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // 3. Update the database order if it is not already paid
      const { data: order } = await supabase.from('raffle_orders').select('status').eq('id', order_id).single()

      if (order && order.status !== 'paid') {
        const { error: updateError } = await supabase
          .from('raffle_orders')
          .update({ 
            status: 'paid', 
            payment_origin: 'mercadopago', 
            mp_payment_id: String(payment_id), 
            updated_at: new Date().toISOString() 
          })
          .eq('id', order_id)

        if (updateError) {
          throw updateError
        }
      }

      return new Response(JSON.stringify({ status: 'approved' }), { headers: corsHeaders, status: 200 })
    }

    return new Response(JSON.stringify({ status: mpData.status }), { headers: corsHeaders, status: 200 })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 })
  }
})

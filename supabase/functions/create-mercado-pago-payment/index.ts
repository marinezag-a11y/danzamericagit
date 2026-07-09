import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
const MP_WEBHOOK_URL = Deno.env.get('MP_WEBHOOK_URL')

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { 
      order_id, 
      total_price, 
      customer_name, 
      customer_email, 
      customer_phone,
      campaign_name
    } = body

    if (!order_id || !total_price) {
      return new Response(JSON.stringify({ error: 'Order ID and Total Price are required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      })
    }

    if (!MP_ACCESS_TOKEN) {
      throw new Error("Mercado Pago Access Token not configured.");
    }

    console.log(`[MercadoPago] Generating PIX for Order: ${order_id}, Price: R$ ${total_price}`)

    // Use name as first_name for payer. If there's a space, split it.
    const nameParts = (customer_name || "Cliente").split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || "Danzamerica";

    const payload = {
      transaction_amount: Number(total_price),
      description: campaign_name ? `Rifa: ${campaign_name}` : "Apoiador Danzamerica",
      payment_method_id: "pix",
      payer: {
        email: customer_email || "test@test.com",
        first_name: firstName,
        last_name: lastName
      },
      external_reference: order_id,
      notification_url: MP_WEBHOOK_URL || `${SUPABASE_URL}/functions/v1/mercado-pago-webhook`
    }

    console.log(`[MercadoPago] POST to /v1/payments. Payload:`, JSON.stringify(payload))

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': order_id // Prevent duplicate charges
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`[MercadoPago] Error creating payment:`, data)
      return new Response(JSON.stringify({ 
        error: 'Failed to create payment with Mercado Pago',
        details: data
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    console.log(`[MercadoPago] PIX successfully generated. Payment ID: ${data.id}`)

    // Update the DB to store the MP payment ID
    const tableName = body.order_type === 'store' ? 'help_orders' : 'raffle_orders';
    await supabase
      .from(tableName)
      .update({ mp_payment_id: String(data.id) })
      .eq('id', order_id);

    const transactionData = data.point_of_interaction?.transaction_data;

    return new Response(JSON.stringify({ 
      success: true, 
      payment_id: data.id,
      qr_code: transactionData?.qr_code,
      qr_code_base64: transactionData?.qr_code_base64,
      ticket_url: transactionData?.ticket_url,
      order_id: order_id
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    console.error(`[MercadoPago Exception]`, err)
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500
    })
  }
})

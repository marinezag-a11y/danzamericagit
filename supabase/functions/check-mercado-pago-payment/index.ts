import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const responseHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payment_id, order_id } = await req.json()

    if (!payment_id || !order_id) {
      return new Response(JSON.stringify({ error: 'Missing payment_id or order_id' }), { headers: responseHeaders, status: 400 })
    }

    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: 'MP_ACCESS_TOKEN not configured' }), { headers: responseHeaders, status: 500 })
    }

    const pollingTimestamp = new Date().toISOString()

    // 1. Consulta o status do pagamento na API do Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
    })

    if (!mpRes.ok) {
      const errorText = await mpRes.text()
      console.error(`[MP Polling] Erro ao consultar payment ${payment_id}: ${mpRes.status} ${errorText}`)
      return new Response(JSON.stringify({ error: 'Failed to fetch from Mercado Pago', details: errorText }), { headers: responseHeaders, status: 400 })
    }

    const mpData = await mpRes.json()

    // Log com timestamps para evidência ao suporte do MP
    console.log(`[MP Polling] payment_id=${payment_id} order_id=${order_id} mp_status=${mpData.status} date_approved=${mpData.date_approved ?? 'N/A'} polling_at=${pollingTimestamp}`)

    // 2. Se aprovado: atualizar banco e retornar
    if (mpData.status === 'approved') {
      const approvedAt = mpData.date_approved
      const nowTs = new Date().toISOString()
      const delaySecs = approvedAt ? Math.round((Date.now() - new Date(approvedAt).getTime()) / 1000) : null

      console.log(`[MP Polling APROVADO] payment_id=${payment_id} aprovado_mp=${approvedAt} detectado=${nowTs} delay=${delaySecs !== null ? delaySecs + 's' : 'N/A'}`)

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // Atualiza somente se ainda não estiver pago (idempotente)
      const { data: order } = await supabase
        .from('raffle_orders')
        .select('id, status, selected_numbers, campaign_id')
        .eq('id', order_id)
        .single()

      if (order && order.status !== 'paid') {
        // Verificação de concorrência/conflito
        const { data: conflictingOrders } = await supabase
          .from('raffle_orders')
          .select('id, selected_numbers')
          .eq('campaign_id', order.campaign_id)
          .in('status', ['paid', 'sent'])
          .neq('id', order_id);

        const paidNumbers = new Set(
          (conflictingOrders || []).flatMap(o => o.selected_numbers || [])
        );

        const hasConflict = (order.selected_numbers || []).some(n => paidNumbers.has(n));

        if (hasConflict) {
          console.warn(`[MP Polling CONFLITO] Pedido ${order_id} pago após janela de 15min, mas o(s) número(s) #${(order.selected_numbers || []).join(', #')} já foram comprados.`);
          
          await supabase
            .from('raffle_orders')
            .update({
              status: 'unconfirmed',
              payment_origin: 'mercadopago',
              mp_payment_id: String(payment_id),
              reason: '⚠️ Recebido após janela: número(s) já comprado(s) por outro cliente. Solicitar contato para alocação manual.',
              updated_at: nowTs
            })
            .eq('id', order_id);

          return new Response(JSON.stringify({ 
            status: 'approved',
            conflict: true,
            status_detail: mpData.status_detail,
            payment_method_id: mpData.payment_method_id,
            date_created: mpData.date_created,
            date_approved: mpData.date_approved,
            transaction_amount: mpData.transaction_amount
          }), { headers: responseHeaders, status: 200 });
        } else {
          const { error: updateError } = await supabase
            .from('raffle_orders')
            .update({ 
              status: 'paid', 
              payment_origin: 'mercadopago', 
              mp_payment_id: String(payment_id), 
              updated_at: nowTs
            })
            .eq('id', order_id)

          if (updateError) throw updateError

          console.log(`[MP Polling] Banco atualizado para PAID via polling ativo. order_id=${order_id}`)
        }
      }

      return new Response(JSON.stringify({ 
        status: 'approved',
        status_detail: mpData.status_detail,
        payment_method_id: mpData.payment_method_id,
        date_created: mpData.date_created,
        date_approved: mpData.date_approved,
        transaction_amount: mpData.transaction_amount
      }), { headers: responseHeaders, status: 200 })
    }

    return new Response(JSON.stringify({ 
      status: mpData.status,
      status_detail: mpData.status_detail,
      payment_method_id: mpData.payment_method_id,
      date_created: mpData.date_created,
      date_approved: mpData.date_approved,
      transaction_amount: mpData.transaction_amount
    }), { headers: responseHeaders, status: 200 })

  } catch (error: any) {
    console.error('[MP Polling] Exceção:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { headers: responseHeaders, status: 500 })
  }
})

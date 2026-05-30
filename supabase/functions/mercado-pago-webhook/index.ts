import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const MAILERSEND_API_KEY = Deno.env.get('MAILERSEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '')

async function sendResendEmail(payload: any) {
  if (!RESEND_API_KEY) return { ok: false, error: 'No Resend API Key' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(payload),
    })
    
    const data = await res.json()
    if (!res.ok) {
      console.error(`[Webhook Email Resend Error]`, JSON.stringify(data))
      return { ok: false, status: res.status, error: data }
    }
    return { ok: true, data }
  } catch (err) {
    console.error(`[Webhook Email Resend Exception]`, err)
    return { ok: false, error: err }
  }
}

async function sendMailerSendEmail(payload: any) {
  if (!MAILERSEND_API_KEY) return { ok: false, error: 'No MailerSend API Key' }
  try {
    const mailerSendPayload = {
      from: {
        email: payload.from.match(/<(.+)>/)?.[1] || payload.from,
        name: payload.from.match(/^(.+?)\s*</)?.[1] || 'Danzamerica'
      },
      to: payload.to.map((email: string) => ({ email })),
      subject: payload.subject,
      html: payload.html
    }

    const res = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(mailerSendPayload),
    })
    
    if (!res.ok) {
      const errorData = await res.text()
      console.error(`[Webhook Email MailerSend Error]`, errorData)
      return { ok: false, status: res.status, error: errorData }
    }
    return { ok: true }
  } catch (err) {
    console.error(`[Webhook Email MailerSend Exception]`, err)
    return { ok: false, error: err }
  }
}

async function sendPaymentConfirmationEmail(order: any, campaign: any) {
  const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_price)

  const emailHtml = `
    <div style="font-family: sans-serif; background-color: #f4f4f4; padding: 40px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.12);">
        <div style="background-color: #25D366; padding: 60px 40px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 34px; font-weight: 900; line-height: 1;">Pagamento Confirmado!</h1>
          <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 13px; text-transform: uppercase; letter-spacing: 3px; font-weight: bold;">Sua participação está oficializada</p>
        </div>
        
        <div style="padding: 45px; color: #333;">
          <p style="font-size: 20px; margin-bottom: 25px; color: #1A1A1A;">Olá, <strong>${order.customer_name}</strong>!</p>
          <p style="font-size: 15px; line-height: 1.6; color: #666; margin-bottom: 30px;">
            Recebemos a confirmação instantânea do seu pagamento via Pix e sua participação na ação <strong>"${campaign?.name || 'Rifa'}"</strong> foi concluída com sucesso!
          </p>

          <div style="background: #FFF9F5; border: 1px solid #FF5A1F22; border-radius: 20px; padding: 30px; margin-bottom: 35px;">
            <h3 style="margin: 0 0 15px 0; color: #FF5A1F; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">RESUMO</h3>
            ${order.selected_numbers && order.selected_numbers.length > 0 ? `
              <div style="display: block; margin-bottom: 20px;">
                ${order.selected_numbers.sort((a: number, b: number) => a - b).map((n: number) => `
                  <span style="display: inline-block; background: #1A1A1A; color: #ffffff; font-family: monospace; font-size: 16px; font-weight: bold; padding: 8px 12px; border-radius: 8px; margin: 4px;">#${String(n).padStart(3, '0')}</span>
                `).join('')}
              </div>
            ` : ''}
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #666; border-top: 1px solid #f0f0f0; margin-top: 15px; padding-top: 15px;">
              <tr>
                <td style="padding: 10px 0;">Valor da Doação</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1A1A1A;">${formattedTotal}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">Método de Pagamento</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1A1A1A;">Pix (Mercado Pago)</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">Status do Pedido</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #25D366; text-transform: uppercase;">PAGO</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; border-top: 1px solid #eee; padding-top: 35px; margin-top: 15px;">
            <p style="font-size: 13px; color: #999; margin-bottom: 0;">Muito obrigado por apoiar o Núcleo de Dança Tatiana Figueiredo rumo à Argentina 2026!</p>
          </div>
        </div>
      </div>
    </div>
  `

  const emailPayload = {
    from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
    to: [order.customer_email],
    subject: `Confirmamos seu pagamento! - Danzamerica 2026`,
    html: emailHtml,
  }

  let result = await sendResendEmail(emailPayload)
  if (!result.ok) {
    result = await sendMailerSendEmail(emailPayload)
  }
  return !!result?.ok;
}

serve(async (req) => {
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'alive' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const rawBody = await req.text();
    let body: any = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch(e) {}
    }

    const receivedTimestamp = new Date().toISOString();
    console.log(`[DIAGNÓSTICO MP] 1. Webhook Recebido no Servidor às: ${receivedTimestamp}`);
    
    console.log(`[MercadoPago Webhook] Request received:`, {
      method: req.method,
      url: req.url,
      body: rawBody
    });

    // Mercado Pago pode enviar dados no body (topic e resource) ou na querystring (type e data.id)
    const topic = body.topic || url.searchParams.get('topic') || body.type || url.searchParams.get('type');
    const paymentId = body.resource ? body.resource.split('/').pop() : (body.data?.id || url.searchParams.get('data.id') || body.id);

    if (topic !== 'payment' || !paymentId) {
      return new Response(JSON.stringify({ message: 'Not a payment event or missing payment ID.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (!MP_ACCESS_TOKEN) {
      console.error("[MercadoPago Webhook] Missing MP_ACCESS_TOKEN");
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { headers: corsHeaders, status: 500 });
    }

    // Fetch full payment details from Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      }
    });

    if (!mpRes.ok) {
      console.error(`[MercadoPago Webhook] Failed to fetch payment info for ID ${paymentId}`);
      return new Response(JSON.stringify({ error: 'Failed to fetch payment info' }), { headers: corsHeaders, status: 500 });
    }

    const paymentInfo = await mpRes.json();
    const status = paymentInfo.status;
    const externalReference = paymentInfo.external_reference; // This is our order_id
    const mpApprovedTimestamp = paymentInfo.date_approved;

    console.log(`[DIAGNÓSTICO MP] 2. Pagamento ${paymentId} aprovado no painel MP às: ${mpApprovedTimestamp || 'N/A'}`);
    console.log(`[MercadoPago Webhook] Payment ${paymentId} status: ${status}, order_id: ${externalReference}`);

    if (status !== 'approved') {
      return new Response(JSON.stringify({ success: true, message: `Payment status is ${status}. Ignoring.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (!externalReference) {
      console.warn(`[MercadoPago Webhook] Payment ${paymentId} has no external_reference.`);
      return new Response(JSON.stringify({ warning: 'No external_reference found.' }), { headers: corsHeaders, status: 200 });
    }

    const orderId = externalReference;

    // Verificar e atualizar raffle_orders
    let raffleOrder: any = null;
    let fetchRaffleError: any = null;
    
    // Tenta buscar no banco até 3 vezes com um pequeno intervalo se não encontrar de primeira
    for (let i = 0; i < 3; i++) {
      const result = await supabase.from('raffle_orders').select('*').eq('id', orderId).maybeSingle();
      if (result.data) {
        raffleOrder = result.data;
        break;
      }
      if (i < 2) await new Promise(r => setTimeout(r, 400));
    }

    if (raffleOrder) {
      if (raffleOrder.status === 'paid') {
        return new Response(JSON.stringify({ success: true, message: 'Order already paid.' }), { headers: corsHeaders, status: 200 })
      }

      // Verificação de concorrência/conflito
      const { data: conflictingOrders } = await supabase
        .from('raffle_orders')
        .select('id, selected_numbers')
        .eq('campaign_id', raffleOrder.campaign_id)
        .in('status', ['paid', 'sent'])
        .neq('id', orderId);

      const paidNumbers = new Set(
        (conflictingOrders || []).flatMap(o => o.selected_numbers || [])
      );

      const hasConflict = (raffleOrder.selected_numbers || []).some(n => paidNumbers.has(n));

      if (hasConflict) {
        console.warn(`[MercadoPago Webhook CONFLITO] Pedido ${orderId} pago após janela, mas o(s) número(s) #${(raffleOrder.selected_numbers || []).join(', #')} já foram comprados.`);
        
        const { error: updateError } = await supabase
          .from('raffle_orders')
          .update({ 
            status: 'unconfirmed', 
            payment_origin: 'mercadopago', 
            mp_payment_id: String(paymentId), 
            reason: '⚠️ Recebido após janela: número(s) já comprado(s) por outro cliente. Solicitar contato para alocação manual.',
            updated_at: new Date().toISOString() 
          })
          .eq('id', orderId)

        if (updateError) {
          console.error(`[MercadoPago Webhook] Error updating raffle order conflict:`, updateError)
          return new Response(JSON.stringify({ error: 'DB Update error' }), { headers: corsHeaders, status: 500 })
        }

        return new Response(JSON.stringify({ success: true, conflict: true, message: 'Conflict detected. Order set to unconfirmed.' }), { headers: corsHeaders, status: 200 })
      } else {
        const { error: updateError } = await supabase
          .from('raffle_orders')
          .update({ status: 'paid', payment_origin: 'mercadopago', mp_payment_id: String(paymentId), updated_at: new Date().toISOString() })
          .eq('id', orderId)

        if (updateError) {
          console.error(`[MercadoPago Webhook] Error updating raffle order status:`, updateError)
          return new Response(JSON.stringify({ error: 'DB Update error' }), { headers: corsHeaders, status: 500 })
        }

        const pushedTimestamp = new Date().toISOString();
        console.log(`[DIAGNÓSTICO MP] 3. Status atualizado no banco de dados (push pro frontend) às: ${pushedTimestamp}`);
        console.log(`[MercadoPago Webhook] Raffle order ${orderId} successfully set to PAID!`)

        // Invoca a Edge Function centralizada de envio de e-mails (send-order)
        supabase.functions.invoke('send-order', {
          body: { order_id: orderId }
        }).then(({ data, error }) => {
          if (error) {
            console.error(`[MercadoPago Webhook] Failed to invoke send-order Edge Function:`, error)
          } else {
            console.log(`[MercadoPago Webhook] send-order invoked successfully:`, data)
          }
        });

        return new Response(JSON.stringify({ success: true, message: 'Raffle order successfully processed.' }), { headers: corsHeaders, status: 200 })
      }
    }

    // Se não encontrou em rifas, tenta em doações (help_orders)
    const { data: helpOrder } = await supabase.from('help_orders').select('*').eq('id', orderId).maybeSingle()
    if (helpOrder) {
      if (helpOrder.status === 'paid') {
        return new Response(JSON.stringify({ success: true, message: 'Help order already paid.' }), { headers: corsHeaders, status: 200 })
      }
      const { error: updateHelpError } = await supabase
        .from('help_orders')
        .update({ status: 'paid', payment_origin: 'mercadopago', mp_payment_id: String(paymentId), updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (updateHelpError) {
        console.error(`[MercadoPago Webhook] Error updating help order status:`, updateHelpError)
        return new Response(JSON.stringify({ error: 'DB Update error' }), { headers: corsHeaders, status: 500 })
      }

      // Invoca a Edge Function centralizada de envio de e-mails (send-order)
      supabase.functions.invoke('send-order', {
        body: { order_id: orderId }
      }).then(({ data, error }) => {
        if (error) {
          console.error(`[MercadoPago Webhook Help] Failed to invoke send-order Edge Function:`, error)
        } else {
          console.log(`[MercadoPago Webhook Help] send-order invoked successfully:`, data)
        }
      });

      return new Response(JSON.stringify({ success: true, message: 'Help order successfully processed.' }), { headers: corsHeaders, status: 200 })
    }

    return new Response(JSON.stringify({ warning: `Order ${orderId} not found.` }), { headers: corsHeaders, status: 200 })

  } catch (err: any) {
    console.error(`[MercadoPago Webhook Exception]`, err)
    return new Response(JSON.stringify({ error: err.message }), { headers: corsHeaders, status: 500 })
  }
})

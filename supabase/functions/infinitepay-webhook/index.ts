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

// Envia e-mail premium comemorando a confirmação do pagamento
async function sendPaymentConfirmationEmail(order: any, campaign: any) {
  const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_price)
  const numbersFormatted = order.selected_numbers.sort((a: number, b: number) => a - b).map((n: number) => `#${String(n).padStart(3, '0')}`).join(', ')

  const emailHtml = `
    <div style="font-family: sans-serif; background-color: #f4f4f4; padding: 40px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.12);">
        <div style="background-color: #25D366; padding: 60px 40px; text-align: center; color: white;">
          <div style="background: rgba(255, 255, 255, 0.2); width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <svg style="width: 40px; height: 40px; fill: none; stroke: currentColor; stroke-width: 4;" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 style="margin: 0; font-size: 34px; font-weight: 900; letter-spacing: -1px; line-height: 1;">Pagamento Confirmado!</h1>
          <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 13px; text-transform: uppercase; letter-spacing: 3px; font-weight: bold;">Sua participação está oficializada</p>
        </div>
        
        <div style="padding: 45px; color: #333;">
          <p style="font-size: 20px; margin-bottom: 25px; color: #1A1A1A;">Olá, <strong>${order.customer_name}</strong>!</p>
          <p style="font-size: 15px; line-height: 1.6; color: #666; margin-bottom: 30px;">
            Recebemos a confirmação instantânea do seu pagamento via Pix e sua participação na ação <strong>"${campaign?.name || 'Rifa'}"</strong> foi concluída com sucesso!
          </p>

          <div style="background: #FFF9F5; border: 1px solid #FF5A1F22; border-radius: 20px; padding: 30px; margin-bottom: 35px;">
            <h3 style="margin: 0 0 15px 0; color: #FF5A1F; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">RESUMO DOS NÚMEROS ADQUIRIDOS</h3>
            <div style="display: block; margin-bottom: 20px;">
              ${order.selected_numbers.sort((a: number, b: number) => a - b).map((n: number) => `
                <span style="display: inline-block; background: #1A1A1A; color: #ffffff; font-family: monospace; font-size: 16px; font-weight: bold; padding: 8px 12px; border-radius: 8px; margin: 4px;">#${String(n).padStart(3, '0')}</span>
              `).join('')}
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #666; border-t: 1px solid #f0f0f0; margin-top: 15px; padding-top: 15px;">
              <tr>
                <td style="padding: 10px 0;">Valor da Doação</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1A1A1A;">${formattedTotal}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">Dançarino Apoiado</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1A1A1A;">${order.dancer_name || 'Apoio Geral'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">Método de Pagamento</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #25D366;">Pix (InfinitePay)</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; border-top: 1px solid #eee; padding-top: 35px; margin-top: 15px;">
            <p style="font-size: 13px; color: #999; margin-bottom: 0;">Muito obrigado por apoiar o Núcleo de Dança Tatiana Figueiredo rumo à Argentina 2026! Boa sorte no sorteio!</p>
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

  console.log(`[Webhook Email] Attempting Resend...`)
  let result = await sendResendEmail(emailPayload)
  
  if (!result.ok) {
    console.warn(`[Webhook Email] Resend failed, trying MailerSend fallback...`)
    const mailerSendResult = await sendMailerSendEmail(emailPayload)
    if (mailerSendResult.ok) {
      console.log(`[Webhook Email] MailerSend success!`)
      result = { ok: true, data: 'sent_via_mailersend' }
    } else {
      console.error(`[Webhook Email] Both email providers failed.`)
    }
  } else {
    console.log(`[Webhook Email] Resend success!`)
  }
}

serve(async (req) => {
  // Tratar requisição CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // A InfinitePay bate com POST no webhook
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405 
    })
  }

  try {
    const rawBody = await req.text()
    console.log(`[InfinitePay Webhook] Raw body received:`, rawBody)

    let body;
    try {
      body = JSON.parse(rawBody)
    } catch (e) {
      console.error(`[InfinitePay Webhook] Failed to parse JSON:`, rawBody)
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // 1. Identificar o status do pagamento
    // A InfinitePay costuma enviar status como "approved", "paid", "captured" ou eventos como "payment.success"
    const status = (body.status || body.event || body.type || body.state || '').toLowerCase()
    
    // Verificamos se o status indica pagamento bem-sucedido
    const isSuccess = 
      status === 'paid' || 
      status === 'approved' || 
      status === 'captured' || 
      status === 'success' || 
      status === 'payment.success' ||
      status === 'payment.captured'

    console.log(`[InfinitePay Webhook] Normalized status: ${status}. Is Success: ${isSuccess}`)

    // 2. Extrair o ID do pedido (order_nsu ou merchant_order_id)
    // Para ser robusto a variações de payload
    const orderId = body.order_nsu || 
                    body.merchant_order_id || 
                    body.order_id || 
                    body.reference || 
                    body.client_reference ||
                    body.data?.order_nsu || 
                    body.data?.merchant_order_id || 
                    body.data?.id

    if (!orderId) {
      console.warn(`[InfinitePay Webhook] Could not find order reference in payload:`, body)
      // Respondemos com 200 OK para a InfinitePay parar de tentar reenviar, mas logamos como erro
      return new Response(JSON.stringify({ warning: 'Webhook ignored. No order reference found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    console.log(`[InfinitePay Webhook] Order reference identified: ${orderId}`)

    if (!isSuccess) {
      console.log(`[InfinitePay Webhook] Transaction not approved/paid. Status: ${status}. Skipping DB update.`)
      return new Response(JSON.stringify({ success: true, message: 'Status recognized but no action required (not paid).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 3. Processar a confirmação de pagamento (status = paid) no Supabase
    // Como a ordem pode ser de Rifas (raffle_orders) ou de Doações (help_orders - "Compre um Sonho"),
    // primeiro vamos tentar atualizar as rifas. Se der certo, notificamos.
    
    // Procuramos o pedido na tabela raffle_orders
    const { data: raffleOrder, error: fetchRaffleError } = await supabase
      .from('raffle_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (fetchRaffleError) {
      console.error(`[InfinitePay Webhook] Error fetching raffle order:`, fetchRaffleError)
      return new Response(JSON.stringify({ error: 'DB Fetch error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    if (raffleOrder) {
      console.log(`[InfinitePay Webhook] Raffle order found in DB:`, raffleOrder)

      if (raffleOrder.status === 'paid') {
        console.log(`[InfinitePay Webhook] Raffle order already paid. Skipping duplicate processing.`)
        return new Response(JSON.stringify({ success: true, message: 'Order already paid.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        })
      }

      // Atualiza o status do pedido para 'paid'
      const { error: updateError } = await supabase
        .from('raffle_orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (updateError) {
        console.error(`[InfinitePay Webhook] Error updating raffle order status:`, updateError)
        return new Response(JSON.stringify({ error: 'DB Update error' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        })
      }

      console.log(`[InfinitePay Webhook] Raffle order ${orderId} successfully set to PAID!`)

      // Buscar detalhes da campanha/rifa para montar o e-mail
      const { data: campaign } = await supabase
        .from('raffle_campaigns')
        .select('*')
        .eq('id', raffleOrder.campaign_id)
        .maybeSingle()

      // Envia o e-mail premium de pagamento confirmado em segundo plano
      try {
        await sendPaymentConfirmationEmail(raffleOrder, campaign)
      } catch (emailErr) {
        console.error(`[InfinitePay Webhook] Failed to send payment confirmation email:`, emailErr)
      }

      return new Response(JSON.stringify({ success: true, message: 'Raffle order successfully processed.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 4. Se não for rifa, procuramos em help_orders ("Compre um Sonho")
    const { data: helpOrder, error: fetchHelpError } = await supabase
      .from('help_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (fetchHelpError) {
      console.error(`[InfinitePay Webhook] Error fetching help order:`, fetchHelpError)
    }

    if (helpOrder) {
      console.log(`[InfinitePay Webhook] Help order found in DB:`, helpOrder)

      if (helpOrder.status === 'paid') {
        return new Response(JSON.stringify({ success: true, message: 'Help order already paid.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        })
      }

      const { error: updateHelpError } = await supabase
        .from('help_orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (updateHelpError) {
        console.error(`[InfinitePay Webhook] Error updating help order status:`, updateHelpError)
        return new Response(JSON.stringify({ error: 'DB Update error' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        })
      }

      console.log(`[InfinitePay Webhook] Help order ${orderId} successfully set to PAID!`)
      
      // Aqui poderíamos enviar e-mail de doação confirmada no futuro
      
      return new Response(JSON.stringify({ success: true, message: 'Help order successfully processed.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    console.warn(`[InfinitePay Webhook] Order reference ${orderId} was not found in any orders table.`)
    return new Response(JSON.stringify({ warning: `Order reference ${orderId} not found.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    console.error(`[InfinitePay Webhook Exception]`, err)
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500
    })
  }
})

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
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #666; border-top: 1px solid #f0f0f0; margin-top: 15px; padding-top: 15px;">
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
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1A1A1A;">Pix (InfinitePay)</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">Status do Pedido</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #25D366; text-transform: uppercase;">PAGO</td>
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
  return !!result?.ok;
}

// Envia e-mail de alerta para o administrador informando que ocorreu uma duplicidade/conflito de número reservado
async function sendPaymentConflictAdminEmail(order: any, campaign: any, conflictDetails: string) {
  let adminEmails = ['nucleodedanca@yahoo.com.br', 'marinezag@gmail.com']
  try {
    const { data: settingData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'notification_emails_general')
      .single()

    if (settingData?.value) {
      adminEmails = settingData.value
        .split(',')
        .map((e: string) => e.trim())
        .filter(Boolean)
    }
  } catch (err) {
    console.error(`[Webhook Email Conflict] Falha ao ler site_settings de e-mails de notificação:`, err)
  }

  const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_price)
  const numbersFormatted = order.selected_numbers
    .sort((a: number, b: number) => a - b)
    .map((n: number) => `#${String(n).padStart(3, '0')}`)
    .join(', ')

  const emailHtml = `
    <div style="font-family: sans-serif; background-color: #f4f4f4; padding: 40px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.12); border: 2px solid #FF3B30;">
        <div style="background-color: #FF3B30; padding: 40px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; line-height: 1;">⚠️ ALERTA DE CONFLITO!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Pagamento Pix Recebido para Números Já Ocupados</p>
        </div>
        
        <div style="padding: 45px; color: #333;">
          <p style="font-size: 16px; line-height: 1.6; color: #1A1A1A; margin-bottom: 25px;">
            Olá, Administrador.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #444; margin-bottom: 30px;">
            O sistema detectou um pagamento Pix verificado pela InfinitePay para um pedido que <strong>já havia expirado o tempo limite de 5 minutos</strong> e cujos números foram, nesse meio tempo, comprados ou reservados ativamente por outra pessoa.
          </p>

          <div style="background: #FFF5F5; border: 1px solid #FF3B3022; border-radius: 20px; padding: 30px; margin-bottom: 35px;">
            <h3 style="margin: 0 0 15px 0; color: #FF3B30; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">DADOS DO PEDIDO COM CONFLITO</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #666;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1A1A1A; width: 40%;">Nome do Cliente</td>
                <td style="padding: 8px 0; text-align: right; color: #333;">${order.customer_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1A1A1A;">E-mail do Cliente</td>
                <td style="padding: 8px 0; text-align: right; color: #333;">${order.customer_email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1A1A1A;">Telefone</td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace; color: #333;">${order.customer_phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1A1A1A;">Números Comprados</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #FF3B30;">${numbersFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1A1A1A;">Valor do Pix Pago</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1A1A1A;">${formattedTotal}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1A1A1A;">Ação (Rifa)</td>
                <td style="padding: 8px 0; text-align: right; font-style: italic; color: #333;">${campaign?.name || 'Rifa'}</td>
              </tr>
            </table>
          </div>

          <div style="background: #F9F9F9; border-radius: 12px; padding: 20px; margin-bottom: 35px; border-left: 4px solid #999;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #333;">Detalhes técnicos do bloqueio:</p>
            <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 12px; color: #666; word-break: break-all;">${conflictDetails}</p>
          </div>

          <div style="background: #E8F5E9; border-radius: 12px; padding: 20px; margin-bottom: 35px; border-left: 4px solid #4CAF50;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #2E7D32;">Ação Recomendada:</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #388E3C; line-height: 1.5;">
              O banco de dados <strong>bloqueou a venda dupla com sucesso</strong>, mantendo a integridade do sorteio.
              Por favor, entre em contato com o cliente para <strong>realizar o reembolso manual do valor de ${formattedTotal}</strong> ou alocar manualmente outros números livres para ele.
            </p>
          </div>
        </div>
      </div>
    </div>
  `

  const emailPayload = {
    from: 'Danzamerica Alerta <alertas@nucleotatianafigueiredo.com.br>',
    to: adminEmails,
    subject: `⚠️ URGENTE: Conflito de Pagamento Pix - ${order.customer_name}`,
    html: emailHtml,
  }

  console.log(`[Webhook Email Conflict] Sending conflict alert email to admins...`)
  let result = await sendResendEmail(emailPayload)
  
  if (!result.ok) {
    console.warn(`[Webhook Email Conflict] Resend failed, trying MailerSend fallback...`)
    await sendMailerSendEmail(emailPayload)
  }
}

serve(async (req) => {
  // Health check endpoint for debugging
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'alive' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  }

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
      ['paid','approved','captured','success','payment.success','payment.captured','completed','payment.completed'].some(s=>status.includes(s))


    console.log(`[InfinitePay Webhook] Normalized status: ${status}. Is Success: ${isSuccess}`)

    // 2. Extrair o ID do pedido (order_nsu ou merchant_order_id)
    // Para ser robusto a variações de payload
    const orderId =
      body.order_nsu ||
      body.merchant_order_id ||
      body.order_id ||
      body.reference ||
      body.client_reference ||
      body.id ||
      body.payment?.id ||
      body.data?.order_nsu ||
      body.data?.merchant_order_id ||
      body.data?.order_id ||
      body.data?.id ||
      body.transaction?.order_nsu ||
      // Busca genérica por campo que contenha "order" ou "nsu"
      Object.values(body).find((v) => typeof v === 'string' && (v.includes('order') || v.includes('nsu'))) ||
      null;
    // Pequena pausa para garantir que o registro do pedido já esteja persistido no banco
    await new Promise(r => setTimeout(r, 800));

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
    let raffleOrder: any = null;
      let fetchRaffleError: any = null;
      // Primeiro tente buscar o pedido
      const firstFetch = await supabase
        .from('raffle_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      raffleOrder = firstFetch.data;
      fetchRaffleError = firstFetch.error;
      // Se não encontrar (pedido ainda não foi inserido), aguarda 500 ms e tenta novamente
      if (!raffleOrder && !fetchRaffleError) {
        await new Promise(r => setTimeout(r, 1000));
        const retryFetch = await supabase
          .from('raffle_orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        raffleOrder = retryFetch.data;
        fetchRaffleError = retryFetch.error;
      }

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

      // Atualiza o status do pedido para 'paid' e define a origem como 'infinitepay'
      const { error: updateError } = await supabase
        .from('raffle_orders')
        .update({ status: 'paid', payment_origin: 'infinitepay', updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (updateError) {
        console.error(`[InfinitePay Webhook] Error updating raffle order status:`, updateError)

        // Se o erro for do trigger de conflito de números
        const isConflict = 
          updateError.message?.includes('conflict_detected') || 
          updateError.details?.includes('conflict_detected')

        if (isConflict) {
          console.warn(`[InfinitePay Webhook Conflict] Conflict detected for order ${orderId}. Cancelling order and alerting admins.`)

          // 1. Mudar o status do pedido para 'unconfirmed' para permitir revisão manual
          const { error: cancelError } = await supabase
            .from('raffle_orders')
            .update({ status: 'unconfirmed', updated_at: new Date().toISOString() })
            .eq('id', orderId)

          if (cancelError) {
            console.error(`[InfinitePay Webhook Conflict] Failed to cancel conflict order in DB:`, cancelError)
          }

          // 2. Buscar detalhes da campanha para compor o e-mail de alerta
          const { data: campaign } = await supabase
            .from('raffle_campaigns')
            .select('*')
            .eq('id', raffleOrder.campaign_id)
            .maybeSingle()

          // 3. Enviar o e-mail de alerta urgente para o administrador em segundo plano
          try {
            await sendPaymentConflictAdminEmail(
              raffleOrder,
              campaign,
              updateError.message || updateError.details || 'Conflito de número ativo (trigger de integridade).'
            )
          } catch (emailErr) {
            console.error(`[InfinitePay Webhook Conflict] Failed to send conflict email alert:`, emailErr)
          }

          // Retornamos 200 OK para que a InfinitePay entenda que o webhook foi processado com sucesso (tratado)
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'conflict_detected',
            message: 'Pagamento recebido mas os números já haviam sido ocupados. O pedido foi marcado como não confirmado e o administrador foi notificado para confirmação manual.'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          })
        }

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
        const sent = await sendPaymentConfirmationEmail(raffleOrder, campaign)
        console.log(`[InfinitePay Webhook] Email send result: ${sent}`)
        // Atualiza a coluna notification_sent no banco de dados se o envio tiver sucesso
        const { error: notifyError } = await supabase
          .from('raffle_orders')
          .update({ 
            notification_sent: sent,
            reason: sent ? null : 'Erro no envio automático via Webhook (Resend e MailerSend falharam)'
          })
          .eq('id', orderId)
        if (notifyError) {
          console.error(`[InfinitePay Webhook] Error updating notification_sent status:`, notifyError)
        } else {
          console.log(`[InfinitePay Webhook] notification_sent status successfully updated to: ${sent}`)
        }
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
        .update({ status: 'paid', payment_origin: 'infinitepay', updated_at: new Date().toISOString() })
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

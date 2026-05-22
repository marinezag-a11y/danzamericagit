import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const MAILERSEND_API_KEY = Deno.env.get('MAILERSEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '')

async function sendResendEmail(payload: any) {
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
      console.error(`[Resend Error]`, JSON.stringify(data))
      return { ok: false, status: res.status, error: data }
    }
    return { ok: true, data }
  } catch (err) {
    console.error(`[Resend Exception]`, err)
    return { ok: false, error: err }
  }
}

async function sendMailerSendEmail(payload: any) {
  if (!MAILERSEND_API_KEY) return { ok: false, error: 'No MailerSend API Key' }
  
  try {
    // Adapt payload to MailerSend format
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
      console.error(`[MailerSend Error]`, errorData)
      return { ok: false, status: res.status, error: errorData }
    }
    return { ok: true }
  } catch (err) {
    console.error(`[MailerSend Exception]`, err)
    return { ok: false, error: err }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { order_id, id } = body
    const finalOrderId = order_id || id

    if (!finalOrderId) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      })
    }

    // Buscar dados reais diretamente no banco de dados para segurança absoluta e integridade
    let dbOrder = null
    let isRaffle = true

    const { data: raffleOrder, error: raffleErr } = await supabase
      .from('raffle_orders')
      .select('*')
      .eq('id', finalOrderId)
      .maybeSingle()

    if (raffleErr) {
      console.error('[Send Order] Error querying raffle_orders:', raffleErr)
    }

    if (raffleOrder) {
      dbOrder = raffleOrder
      isRaffle = true
    } else {
      const { data: helpOrder, error: helpErr } = await supabase
        .from('help_orders')
        .select('*')
        .eq('id', finalOrderId)
        .maybeSingle()

      if (helpErr) {
        console.error('[Send Order] Error querying help_orders:', helpErr)
      }

      if (helpOrder) {
        dbOrder = helpOrder
        isRaffle = false
      }
    }

    if (!dbOrder) {
      console.error(`[Send Order] Order not found: ${finalOrderId}`)
      return new Response(JSON.stringify({ error: `Pedido ${finalOrderId} não encontrado no banco de dados.` }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      })
    }

    // Economizar cota: Bloquear envios se o pedido não estiver pago ('paid')
    if (dbOrder.status !== 'paid') {
      console.log(`[Send Order] Ignorando envio para pedido ${finalOrderId} com status '${dbOrder.status}' para economizar cota.`)
      return new Response(JSON.stringify({ 
        success: false, 
        ignored: true,
        message: `Envio ignorado: O e-mail automático é restrito a pedidos pagos. Status atual: ${dbOrder.status}` 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Garanta que não seja enviado em pagamentos feitos pela integração infinitepay
    if (dbOrder.payment_origin === 'infinitepay') {
      console.log(`[Send Order] Ignorando envio para pedido ${finalOrderId} pago via InfinitePay para economizar cota.`)
      return new Response(JSON.stringify({ 
        success: true, 
        ignored: true,
        message: `Envio ignorado: Pagamentos automáticos via InfinitePay não disparam e-mail do sistema.` 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Buscar detalhes adicionais para compor o HTML premium
    const [campaignRes, dancerRes] = await Promise.all([
      dbOrder.campaign_id ? supabase.from('raffle_campaigns').select('*').eq('id', dbOrder.campaign_id).single() : Promise.resolve({ data: null }),
      (dbOrder.dancer_name && dbOrder.dancer_name !== 'Geral') ? supabase.from('dancers').select('photo_url, name').eq('name', dbOrder.dancer_name).maybeSingle() : Promise.resolve({ data: null })
    ])

    const campaignDetails = campaignRes.data
    const dancerDetails = dancerRes.data

    const safeTotalPrice = Number(dbOrder.total_price || dbOrder.product_price || 0)
    const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeTotalPrice)
    const paymentOrigin = dbOrder.payment_origin === 'infinitepay' ? 'InfinitePay' : 'Avulso'
    
    // Montagem do Resumo do Pedido Premium
    let summaryHtml = ''
    if (isRaffle) {
      summaryHtml = `
        <h3 style="margin: 0 0 15px 0; color: #FF5A1F; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">RESUMO DOS NÚMEROS ADQUIRIDOS</h3>
        <div style="display: block; margin-bottom: 20px;">
          ${(dbOrder.selected_numbers || []).sort((a: number, b: number) => a - b).map((n: number) => `
            <span style="display: inline-block; background: #1A1A1A; color: #ffffff; font-family: monospace; font-size: 16px; font-weight: bold; padding: 8px 12px; border-radius: 8px; margin: 4px;">#${String(n).padStart(3, '0')}</span>
          `).join('')}
        </div>
      `
    } else {
      summaryHtml = `
        <h3 style="margin: 0 0 15px 0; color: #FF5A1F; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">ITENS ADQUIRIDOS</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${(dbOrder.items || []).map((item: any) => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; font-size: 14px; color: #1A1A1A; font-weight: bold;">${item.name || 'Doação'}</td>
              <td style="padding: 10px 0; font-size: 14px; text-align: right; color: #FF5A1F; font-weight: bold;">R$ ${Number(item.price || 0).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      `
    }

    const customerEmailHtml = `
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
            <p style="font-size: 20px; margin-bottom: 25px; color: #1A1A1A;">Olá, <strong>${dbOrder.customer_name}</strong>!</p>
            <p style="font-size: 15px; line-height: 1.6; color: #666; margin-bottom: 30px;">
              Recebemos a confirmação do seu pagamento e sua participação na ação <strong>"${campaignDetails?.name || 'Danzamerica 2026'}"</strong> foi concluída com sucesso!
            </p>

            <div style="background: #FFF9F5; border: 1px solid #FF5A1F22; border-radius: 20px; padding: 30px; margin-bottom: 35px;">
              ${summaryHtml}
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #666; border-top: 1px solid #f0f0f0; margin-top: 15px; padding-top: 15px;">
                <tr>
                  <td style="padding: 10px 0;">Valor Pago</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1A1A1A;">${formattedTotal}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">Dançarino Apoiado</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1A1A1A;">${dbOrder.dancer_name || 'Apoio Geral'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">Método de Pagamento</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1A1A1A;">Pix (${paymentOrigin})</td>
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

    // --- EMAIL SENDING FLOW (RESEND WITH MAILERSEND FAILOVER) ---
    const emailPayload = {
      from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
      to: [dbOrder.customer_email],
      subject: `Confirmamos seu pagamento! - Danzamerica 2026`,
      html: customerEmailHtml,
    }

    console.log(`[Send Order] Attempting Resend...`)
    let result = await sendResendEmail(emailPayload)
    let mailersendError = null

    // Failover se o Resend falhar
    if (!result.ok) {
      console.warn(`[Send Order] Resend failed, trying MailerSend fallback...`)
      const mailerSendResult = await sendMailerSendEmail(emailPayload)
      if (mailerSendResult.ok) {
        console.log(`[Send Order] MailerSend success!`)
        result = { ok: true, data: 'sent_via_mailersend' }
      } else {
        console.error(`[Send Order] Both email providers failed.`)
        mailersendError = mailerSendResult.error
      }
    } else {
      console.log(`[Send Order] Resend success!`)
    }

    const finalSuccess = result.ok
    const errorDetail = !finalSuccess ? `Resend: ${JSON.stringify(result.error || 'Timeout')}. MailerSend: ${JSON.stringify(mailersendError || 'Unknown')}` : null

    // --- DATABASE UPDATE ---
    const table = isRaffle ? 'raffle_orders' : 'help_orders'
    const { error: dbUpdateErr } = await supabase.from(table).update({ 
      notification_sent: finalSuccess,
      reason: finalSuccess ? null : `Erro no envio: ${errorDetail}`
    }).eq('id', finalOrderId)

    if (dbUpdateErr) {
      console.error(`[Send Order] Error updating database notification_sent state:`, dbUpdateErr)
    } else {
      console.log(`[Send Order] Database successfully updated with notification_sent = ${finalSuccess}`)
    }

    return new Response(JSON.stringify({ success: finalSuccess, error: errorDetail, providerData: result.data }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: finalSuccess ? 200 : 500
    })

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500
    })
  }
})

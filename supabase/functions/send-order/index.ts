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
    const { 
      customer_name = 'Cliente', 
      customer_email, 
      items = [], 
      selected_numbers = [], 
      total_price, 
      campaign_id,
      dancer_name,
      order_id,
      id,
      pix_key,
      pix_bank,
      pix_receiver,
    } = body

    const finalOrderId = order_id || id

    if (!customer_email) {
      return new Response(JSON.stringify({ error: 'Customer email is required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      })
    }

    // Fetch details for HTML
    const [campaignRes, dancerRes] = await Promise.all([
      campaign_id ? supabase.from('raffle_campaigns').select('*').eq('id', campaign_id).single() : Promise.resolve({ data: null }),
      (dancer_name && dancer_name !== 'Geral') ? supabase.from('dancers').select('photo_url, name').eq('name', dancer_name).maybeSingle() : Promise.resolve({ data: null })
    ])

    const campaignDetails = campaignRes.data
    const dancerDetails = dancerRes.data
    const isRaffle = (selected_numbers && selected_numbers.length > 0) || campaign_id

    const safeTotalPrice = Number(total_price || 0)
    const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeTotalPrice)
    
    // Build Customer Email HTML (Same professional look)
    let itemsHtml = ''
    if (isRaffle) {
      itemsHtml = `
        <tr>
          <td colspan="2" style="padding: 0;">
            <div style="background: #ffffff; border: 1px solid #FF5A1F22; border-radius: 20px; overflow: hidden; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              ${campaignDetails?.image_url ? `<img src="${campaignDetails.image_url}" style="width: 100%; height: auto; max-height: 240px; object-fit: cover; display: block;" />` : ''}
              <div style="padding: 30px;">
                <div style="color: #FF5A1F; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 3px; margin-bottom: 15px;">Ação Entre Amigos • Danzamerica 2026</div>
                <h2 style="margin: 0 0 25px 0; font-size: 28px; color: #1A1A1A; font-family: serif;">${campaignDetails?.name || 'Rifa Danzamerica'}</h2>
                <div style="padding: 20px; background: #FFF5F2; border-radius: 16px; border-left: 6px solid #FF5A1F; margin-bottom: 30px; display: table; width: 100%; box-sizing: border-box;">
                  <div style="display: table-row;">
                    ${dancerDetails?.photo_url ? `
                      <div style="display: table-cell; width: 80px; vertical-align: middle;">
                        <img src="${dancerDetails.photo_url}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 3px solid #ffffff;" />
                      </div>
                    ` : ''}
                    <div style="display: table-cell; vertical-align: middle; padding-left: 15px;">
                      <span style="font-size: 11px; color: #FF5A1F; text-transform: uppercase; font-weight: bold; letter-spacing: 2px; display: block; margin-bottom: 4px;">Bailarina(o) Apoiada(o):</span>
                      <strong style="font-size: 22px; color: #1A1A1A; display: block; font-family: serif; italic;">${dancer_name || 'Apoio Geral'}</strong>
                    </div>
                  </div>
                </div>
                <div style="margin-bottom: 30px;">
                  <span style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; display: block; margin-bottom: 15px;">Seus Números Reservados:</span>
                  <div style="display: block;">
                    ${selected_numbers.sort((a: number, b: number) => a - b).map(n => `
                      <span style="display: inline-block; background: #1A1A1A; color: #ffffff; font-family: monospace; font-size: 16px; font-weight: bold; padding: 10px 14px; border-radius: 8px; margin: 4px;">#${String(n).padStart(3, '0')}</span>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      `
    } else {
      itemsHtml = items.map((item: any) => `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 18px 0; color: #1A1A1A; font-size: 16px;">
            <div style="font-weight: bold;">${item.name || 'Item'}</div>
          </td>
          <td style="padding: 18px 0; text-align: right; color: #FF5A1F; font-weight: bold; font-size: 17px;">R$ ${Number(item.price || 0).toFixed(2)}</td>
        </tr>
      `).join('')
    }

    const customerEmailHtml = `
      <div style="font-family: sans-serif; background-color: #f4f4f4; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.12);">
          <div style="background-color: #FF5A1F; padding: 60px 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 36px; font-weight: 900; letter-spacing: -1.5px; line-height: 1;">Pedido Recebido!</h1>
            <p style="margin: 18px 0 0 0; opacity: 0.9; font-size: 14px; text-transform: uppercase; letter-spacing: 4px; font-weight: bold;">Danzamerica 2026 • Argentina</p>
          </div>
          <div style="padding: 45px; color: #333;">
            <p style="font-size: 22px; margin-bottom: 35px; color: #1A1A1A;">Olá, <strong>${customer_name}</strong>!</p>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
              <tr>
                <td style="padding: 30px 0 0 0; font-weight: bold; font-size: 20px; color: #1A1A1A;">VALOR TOTAL</td>
                <td style="padding: 30px 0 0 0; text-align: right; font-weight: bold; color: #FF5A1F; font-size: 32px; letter-spacing: -1.5px;">${formattedTotal}</td>
              </tr>
            </table>
            <div style="background-color: #1A1A1A; border-radius: 24px; padding: 45px; text-align: center; color: white; margin-top: 40px;">
              <h3 style="margin: 0 0 12px 0; color: #FF5A1F; font-size: 12px; text-transform: uppercase; letter-spacing: 4px;">PAGAMENTO VIA PIX</h3>
              <div style="font-family: monospace; font-size: 19px; font-weight: bold; color: #FF5A1F; margin: 15px 0; background: rgba(255,255,255,0.08); padding: 25px; border-radius: 16px; border: 1px dashed rgba(255,90,31,0.6); word-break: break-all;">
                ${pix_key || 'ballettatianafigueiredo@gmail.com'}
              </div>
              <p style="font-size: 12px; opacity: 0.6; margin-top: 20px;">Banco: ${pix_bank || 'SICOOB'} | Recebedor: ${pix_receiver || 'Tatiana Aparecida Figueiredo'}</p>
            </div>
            <div style="margin-top: 50px; text-align: center;">
              <a href="https://wa.me/5531992127292" style="display: inline-block; background-color: #25D366; color: white; padding: 25px 45px; border-radius: 20px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 14px; letter-spacing: 3px;">
                ENVIAR COMPROVANTE AGORA
              </a>
            </div>
          </div>
        </div>
      </div>
    `

    // --- EMAIL SENDING FLOW (RESEND WITH MAILERSEND FAILOVER) ---
    const emailPayload = {
      from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
      to: [customer_email],
      subject: `Confirmamos seu pedido! - Danzamerica 2026`,
      html: customerEmailHtml,
    }

    console.log(`[Flow] Attempting Resend...`)
    let result = await sendResendEmail(emailPayload)

    // Failover if Resend fails (especially 429 - too many requests or 403/400 quota)
    if (!result.ok) {
      console.warn(`[Flow] Resend failed, trying MailerSend fallback...`)
      const mailerSendResult = await sendMailerSendEmail(emailPayload)
      if (mailerSendResult.ok) {
        console.log(`[Flow] MailerSend success!`)
        result = { ok: true, data: 'sent_via_mailersend' }
      } else {
        console.error(`[Flow] Both email providers failed.`)
      }
    } else {
      console.log(`[Flow] Resend success!`)
    }

    const finalSuccess = result.ok

    // --- DATABASE UPDATE ---
    if (finalOrderId) {
      const table = isRaffle ? 'raffle_orders' : 'help_orders'
      await supabase.from(table).update({ 
        notification_sent: finalSuccess,
        reason: finalSuccess ? null : `Erro crítico nos dois provedores de e-mail.`
      }).eq('id', finalOrderId)
    }

    return new Response(JSON.stringify({ success: finalSuccess }), { 
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

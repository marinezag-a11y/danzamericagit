import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '')

async function sendResendEmail(payload: any) {
  console.log(`[Resend] Attempting send to: ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}`)
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
      console.error(`[Resend Error] Status ${res.status}:`, JSON.stringify(data))
    } else {
      console.log(`[Resend Success] ID: ${data.id}`)
    }
    return { ok: res.ok, data }
  } catch (err) {
    console.error(`[Resend Exception]`, err)
    return { ok: false, error: err }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('--- START SEND-ORDER (v19 - FULL INFO) ---')
    
    const { 
      type = 'new_order', 
      customer_name = 'Cliente', 
      customer_email, 
      customer_phone = 'Não informado', 
      items = [], 
      selected_numbers = [], 
      total_price, 
      campaign_name,
      dancer_name,
      order_id,
      id,
      reason,
      pix_key,
      pix_bank,
      pix_receiver
    } = body

    const finalOrderId = order_id || id

    if (!customer_email) {
      console.error('Error: customer_email is missing')
      return new Response(JSON.stringify({ error: 'Customer email is required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      })
    }

    // Fetch dynamic admin emails
    const settingKey = type === 'raffle_order' ? 'notification_emails_raffles' : 'notification_emails_general'
    const { data: settingData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', settingKey)
      .single()

    let adminEmails = settingData?.value 
      ? settingData.value.split(',').map((e: string) => e.trim()).filter(Boolean)
      : ['nucleodedanca@yahoo.com.br', 'marinezag@gmail.com']

    // Automatically include all MASTER users
    const { data: masterProfiles } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'master')
      
    if (masterProfiles) {
      const masterEmails = masterProfiles.map(p => p.email).filter(Boolean)
      adminEmails = Array.from(new Set([...adminEmails, ...masterEmails]))
    }

    console.log(`[Config] Using admin emails for ${type}:`, adminEmails)

    const safeTotalPrice = Number(total_price || 0)
    const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeTotalPrice)
    
    // Build Items Display
    let itemsHtml = ''
    if (items && items.length > 0) {
      itemsHtml = items.map((item: any) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; color: #333; font-size: 14px;">
            <div style="font-weight: bold;">${item.name || 'Item'}</div>
            ${item.option ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">Opção: ${item.option}</div>` : ''}
            ${item.description ? `<div style="font-size: 12px; color: #999; margin-top: 2px;">${item.description}</div>` : ''}
            ${item.quantity && item.quantity > 1 ? `<div style="font-size: 11px; color: #999; margin-top: 2px;">Quantidade: ${item.quantity}</div>` : ''}
          </td>
          <td style="padding: 12px 0; text-align: right; color: #FF5A1F; font-weight: bold; font-size: 14px;">R$ ${Number(item.price || 0).toFixed(2)}</td>
        </tr>
      `).join('')
    } else if (selected_numbers && selected_numbers.length > 0) {
      itemsHtml = `
        <tr>
          <td colspan="2" style="padding: 24px; background: #f9f9f9; border-radius: 16px; border: 1px solid #eee;">
            ${dancer_name ? `<div style="margin-bottom: 12px; color: #FF5A1F; font-weight: 900; text-transform: uppercase; font-size: 11px; letter-spacing: 2px;">Apoio ao Talento: ${dancer_name}</div>` : ''}
            ${campaign_name ? `<div style="margin-bottom: 16px; font-size: 14px; color: #333;">Campanha: <strong>${campaign_name}</strong></div>` : ''}
            <div style="font-size: 14px; color: #666; margin-bottom: 12px; border-top: 1px solid #eee; pt-12">
              <strong style="display: block; margin: 12px 0 8px 0; color: #333;">Números Escolhidos (${selected_numbers.length}):</strong>
              <div style="font-family: 'Courier New', monospace; font-size: 18px; color: #FF5A1F; font-weight: bold; letter-spacing: 2px; line-height: 1.8; background: white; padding: 15px; border-radius: 8px; border: 1px dashed #FF5A1F44;">
                ${selected_numbers.sort((a: number, b: number) => a - b).map(n => `#${String(n).padStart(3, '0')}`).join(', ')}
              </div>
            </div>
          </td>
        </tr>
      `
    } else {
      itemsHtml = `<tr><td colspan="2" style="padding: 12px 0; color: #666; font-style: italic;">Detalhes do pedido não especificados.</td></tr>`
    }

    if (type === 'status_update' || type === 'order_deletion') {
      const statusLabels: Record<string, string> = {
        pending: 'PENDENTE',
        paid: 'PAGO / CONFIRMADO',
        sent: 'ENVIADO / DISPONÍVEL',
        cancelled: 'CANCELADO',
        deleted: 'PEDIDO EXCLUÍDO'
      }

      const statusColors: Record<string, string> = {
        pending: '#EAB308',
        paid: '#22C55E',
        sent: '#3B82F6',
        cancelled: '#EF4444',
        deleted: '#64748B'
      }

      const finalStatus = type === 'order_deletion' ? 'deleted' : (new_status || 'pending')
      const currentColor = statusColors[finalStatus] || '#FF5A1F'

      // Status email template (Customer)
      const statusEmailHtml = `
        <div style="font-family: sans-serif; background-color: #f4f4f4; padding: 40px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="background-color: ${currentColor}; padding: 30px; text-align: center; color: white;">
              <h2 style="margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 14px; opacity: 0.9;">Aviso do Sistema</h2>
              <h1 style="margin: 10px 0 0 0; font-size: 28px; font-weight: 900;">${statusLabels[finalStatus]}</h1>
            </div>
            <div style="padding: 40px; color: #333;">
              <p style="font-size: 18px; margin-bottom: 25px;">Olá, <strong>${customer_name}</strong>,</p>
              <p style="line-height: 1.6; color: #666;">Houve uma atualização no seu pedido <strong>#${String(finalOrderId || '').slice(0, 8)}</strong>.</p>
              ${reason ? `
                <div style="margin: 25px 0; padding: 20px; background-color: #f9f9f9; border-left: 4px solid ${currentColor};">
                  <p style="margin: 0 0 5px 0; font-[10px] uppercase font-bold text-gray-400;">Motivo / Observação:</p>
                  <p style="margin: 0; font-style: italic; color: #333;">"${reason}"</p>
                </div>
              ` : ''}
              <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                <p style="margin: 5px 0;">📱 <strong>WhatsApp:</strong> (31) 99212-7292</p>
                <p style="margin: 5px 0;">📧 <strong>E-mail:</strong> nucleodedanca@yahoo.com.br</p>
              </div>
            </div>
          </div>
        </div>
      `

      // Send to Customer
      await sendResendEmail({
        from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
        to: [customer_email],
        subject: `ATENÇÃO: Pedido ${statusLabels[finalStatus]} - Danzamerica 2026`,
        html: statusEmailHtml,
      })

      // Send log to dynamic Admins
      await sendResendEmail({
        from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
        to: adminEmails,
        subject: `[LOG ADM] Status Alterado: ${customer_name} -> ${statusLabels[finalStatus]}`,
        html: `
          <p>O status do pedido de <b>${customer_name}</b> (${customer_email}) foi alterado para: <b>${statusLabels[finalStatus]}</b>.</p>
          ${reason ? `<p><b>Motivo:</b> ${reason}</p>` : ''}
        `,
      })

      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    } else {
      // New Order (Raffle or Help)
      const adminEmailHtml = `
        <div style="font-family: sans-serif; background-color: #1A1A1A; color: white; padding: 40px;">
          <div style="max-width: 600px; margin: 0 auto; border: 1px solid #FF5A1F; padding: 30px;">
            <h1 style="color: #FF5A1F; margin-top: 0; font-style: italic;">Novo Pedido: ${type === 'raffle_order' ? 'Rifa' : 'Compre um Sonho'}</h1>
            <p style="color: #999;">Um novo pedido foi realizado através do site:</p>
            <hr style="border-color: #333; margin: 20px 0;" />
            <p><strong>Cliente:</strong> ${customer_name}</p>
            <p><strong>Telefone:</strong> ${customer_phone}</p>
            <p><strong>E-mail:</strong> ${customer_email}</p>
            <hr style="border-color: #333; margin: 20px 0;" />
            <table style="width: 100%; color: white; border-collapse: collapse;">
              ${itemsHtml}
              <tr>
                <td style="padding: 20px 0; font-weight: bold; font-size: 18px;">TOTAL</td>
                <td style="padding: 20px 0; text-align: right; font-weight: bold; color: #FF5A1F; font-size: 24px;">${formattedTotal}</td>
              </tr>
            </table>
          </div>
        </div>
      `

      // Professional Customer Confirmation Email
      const customerEmailHtml = `
        <div style="font-family: sans-serif; background-color: #f4f4f4; padding: 40px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            <div style="background-color: #FF5A1F; padding: 40px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Pedido Recebido!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Danzamerica 2026 • Argentina</p>
            </div>
            
            <div style="padding: 40px; color: #333;">
              <p style="font-size: 18px; margin-bottom: 25px;">Olá, <strong>${customer_name}</strong>!</p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 25px; border: 1px solid #eee; font-size: 12px; color: #666;">
                <p style="margin: 0 0 5px 0;"><strong>Seus Dados de Contato:</strong></p>
                <p style="margin: 2px 0;">📞 WhatsApp: ${customer_phone}</p>
                <p style="margin: 2px 0;">📧 E-mail: ${customer_email}</p>
              </div>
              <p style="line-height: 1.6; color: #666; margin-bottom: 30px;">
                Recebemos seu pedido de apoio com sucesso. Sua contribuição é fundamental para realizarmos este sonho em Córdoba, na Argentina!
              </p>

              <div style="background-color: #f9f9f9; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 20px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; border-bottom: 1px solid #eee; padding-bottom: 10px;">Resumo do Pedido</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  ${itemsHtml}
                  <tr>
                    <td style="padding: 20px 0 0 0; font-weight: bold; font-size: 16px;">TOTAL</td>
                    <td style="padding: 20px 0 0 0; text-align: right; font-weight: bold; color: #FF5A1F; font-size: 20px;">${formattedTotal}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #FFF5F2; border: 1px solid #FF5A1F33; border-radius: 12px; padding: 30px; text-align: center;">
                <h3 style="margin: 0 0 15px 0; color: #FF5A1F; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Pagamento via PIX</h3>
                <p style="font-family: monospace; font-size: 18px; font-weight: bold; color: #333; margin: 15px 0; background: white; padding: 15px; border-radius: 8px; border: 1px dashed #FF5A1F;">
                  ${pix_key || 'ballettatianafigueiredo@gmail.com'}
                </p>
                <div style="font-size: 13px; color: #666; margin-top: 15px;">
                  <p style="margin: 5px 0;"><strong>Banco:</strong> ${pix_bank || 'SICOOB'}</p>
                  <p style="margin: 5px 0;"><strong>Recebedor:</strong> ${pix_receiver || 'Tatiana Aparecida Figueiredo'}</p>
                </div>
              </div>

              <div style="margin-top: 40px; text-align: center;">
                <p style="font-size: 13px; color: #999; margin-bottom: 20px;">Após realizar o pagamento, envie o comprovante clicando no botão abaixo:</p>
                <a href="https://wa.me/5531992127292" style="display: inline-block; background-color: #25D366; color: white; padding: 18px 35px; border-radius: 50px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(37,211,102,0.3);">
                  Enviar Comprovante via WhatsApp
                </a>
              </div>
            </div>

            <div style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">
                Núcleo de Dança Tatiana Figueiredo • Belo Horizonte / MG
              </p>
            </div>
          </div>
        </div>
      `

      // Send to dynamic Admins
      const adminRes = await sendResendEmail({
        from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
        to: adminEmails,
        reply_to: customer_email,
        subject: `NOVO PEDIDO: ${customer_name}`,
        html: adminEmailHtml,
      })

      // Send to Customer
      const customerRes = await sendResendEmail({
        from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
        to: [customer_email],
        subject: `Confirmamos seu pedido! - Danzamerica 2026`,
        html: customerEmailHtml,
      })

      // Update Database Status if at least one email was sent
      if ((adminRes.ok || customerRes.ok) && finalOrderId) {
        const table = type === 'raffle_order' ? 'raffle_orders' : 'help_orders'
        console.log(`[DB Update] Marking ${table}:${finalOrderId} as notified`)
        const { error: dbError } = await supabase
          .from(table)
          .update({ notification_sent: true })
          .eq('id', finalOrderId)
        
        if (dbError) console.error('[DB Error] Failed to update notification_sent:', dbError)
      } else {
        console.warn('[DB Skip] No emails sent successfully or no order_id provided', { 
          adminOk: adminRes.ok, 
          customerOk: customerRes.ok, 
          finalOrderId 
        })
      }

      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})

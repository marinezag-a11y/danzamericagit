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
    console.log('--- START SEND-ORDER (v18) ---')
    
    const { 
      type = 'new_order', 
      customer_name = 'Cliente', 
      customer_email, 
      customer_phone = 'Não informado', 
      items = [], 
      selected_numbers = [], 
      total_price, 
      new_status, 
      order_id 
    } = body

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
    
    let safeItems = items
    if ((!items || items.length === 0) && body.product_name) {
      safeItems = [{ name: body.product_name, price: Number(body.product_price || 0) }]
    }

    const itemsHtml = safeItems.length > 0 
      ? safeItems.map((item: any) => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 0; color: #333; font-size: 14px;">${item.name || item.title || 'Item'}</td>
            <td style="padding: 12px 0; text-align: right; color: #FF5A1F; font-weight: bold; font-size: 14px;">R$ ${Number(item.price || 0).toFixed(2)}</td>
          </tr>
        `).join('')
      : selected_numbers.length > 0 
        ? `<tr><td colspan="2" style="padding: 12px 0; color: #333; font-size: 14px;">Números Escolhidos: <strong>${selected_numbers.join(', ')}</strong></td></tr>`
        : `<tr><td colspan="2" style="padding: 12px 0; color: #333; font-size: 14px;">Pedido solidário recebido.</td></tr>`

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
              <p style="line-height: 1.6; color: #666;">Houve uma atualização no seu pedido <strong>#${String(order_id || '').slice(0, 8)}</strong>.</p>
              <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                <p style="margin: 5px 0;">📱 <strong>WhatsApp:</strong> (31) 99361-5488</p>
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
        html: `<p>O status do pedido de <b>${customer_name}</b> (${customer_email}) foi alterado para: <b>${statusLabels[finalStatus]}</b>.</p>`,
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

      // Send to dynamic Admins
      const adminRes = await sendResendEmail({
        from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
        to: adminEmails,
        reply_to: customer_email,
        subject: `NOVO PEDIDO: ${customer_name}`,
        html: adminEmailHtml,
      })

      // Send to Customer (Simplified for brevity)
      const customerRes = await sendResendEmail({
        from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
        to: [customer_email],
        subject: `Confirmamos seu pedido! - Danzamerica 2026`,
        html: `<p>Olá ${customer_name}, recebemos seu pedido com sucesso!</p>`,
      })

      // Update Database Status if at least one email was sent
      if ((adminRes.ok || customerRes.ok) && order_id) {
        const table = type === 'raffle_order' ? 'raffle_orders' : 'help_orders'
        console.log(`[DB Update] Marking ${table}:${order_id} as notified`)
        const { error: dbError } = await supabase
          .from(table)
          .update({ notification_sent: true })
          .eq('id', order_id)
        
        if (dbError) console.error('[DB Error] Failed to update notification_sent:', dbError)
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

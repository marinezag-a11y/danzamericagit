import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body))
    
    const { 
      type = 'new_order', 
      customer_name = 'Cliente', 
      customer_email, 
      customer_phone = 'Não informado', 
      items = [], 
      total_price, 
      new_status, 
      order_id 
    } = body

    const safeTotalPrice = Number(total_price || 0)
    const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeTotalPrice)
    
    // Fallback for items if empty but product_name/price exists (for manual orders)
    let safeItems = items
    if ((!items || items.length === 0) && body.product_name) {
      safeItems = [{ name: body.product_name, price: Number(body.product_price || 0) }]
    }

    const itemsHtml = safeItems.map((item: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0; color: #333; font-size: 14px;">${item.name || item.title || 'Item'}</td>
        <td style="padding: 12px 0; text-align: right; color: #FF5A1F; font-weight: bold; font-size: 14px;">R$ ${Number(item.price || 0).toFixed(2)}</td>
      </tr>
    `).join('')

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

      const statusDetails: Record<string, string> = {
        pending: 'Seu pedido está aguardando confirmação de pagamento.',
        paid: 'Seu pagamento foi confirmado! Estamos preparando seus itens.',
        sent: 'Seus itens solidários já foram enviados ou estão prontos para retirada!',
        cancelled: 'Este pedido foi CANCELADO no nosso sistema. Caso tenha dúvidas, entre em contato.',
        deleted: 'Este registro de pedido foi REMOVIDO do nosso sistema administrativo.'
      }

      const finalStatus = type === 'order_deletion' ? 'deleted' : (new_status || 'pending')
      const currentColor = statusColors[finalStatus] || '#FF5A1F'

      const statusEmailHtml = `
        <div style="font-family: sans-serif; background-color: #f4f4f4; padding: 40px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="background-color: ${currentColor}; padding: 30px; text-align: center; color: white;">
              <h2 style="margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 14px; opacity: 0.9;">Aviso do Sistema</h2>
              <h1 style="margin: 10px 0 0 0; font-size: 28px; font-weight: 900;">${statusLabels[finalStatus]}</h1>
            </div>
            <div style="padding: 40px; color: #333;">
              <p style="font-size: 18px; margin-bottom: 25px;">Olá, <strong>${customer_name}</strong>,</p>
              <p style="line-height: 1.6; color: #666;">Houve uma atualização no seu pedido <strong>#${String(order_id || '').slice(0, 8)}</strong>:</p>
              <div style="margin: 30px 0; padding: 25px; background-color: #f9f9f9; border-left: 5px solid ${currentColor};">
                <p style="margin: 0; font-size: 16px; color: #333; line-height: 1.6;">${statusDetails[finalStatus]}</p>
              </div>
              <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                <p style="margin: 5px 0;">📱 <strong>WhatsApp:</strong> (31) 99361-5488</p>
                <p style="margin: 5px 0;">📧 <strong>E-mail:</strong> nucleodedanca@yahoo.com.br</p>
              </div>
            </div>
          </div>
        </div>
      `

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
          to: [customer_email],
          subject: `ATENÇÃO: Pedido ${statusLabels[finalStatus]} - Danzamerica 2026`,
          html: statusEmailHtml,
        }),
      })

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // New Order Logic (Admin & Customer)
    const adminEmailHtml = `
      <div style="font-family: sans-serif; background-color: #1A1A1A; color: white; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #FF5A1F; padding: 30px;">
          <h1 style="color: #FF5A1F; margin-top: 0; font-style: italic;">Novo Pedido de Itens Solidários</h1>
          <p style="color: #999;">Um novo pedido foi realizado através do site:</p>
          <hr style="border-color: #333; margin: 20px 0;" />
          <p><strong>Cliente:</strong> ${customer_name}</p>
          <p><strong>Telefone:</strong> ${customer_phone}</p>
          <p><strong>E-mail:</strong> ${customer_email}</p>
          <hr style="border-color: #333; margin: 20px 0;" />
          <h4 style="color: #FF5A1F; text-transform: uppercase; font-size: 12px;">Itens do Pedido:</h4>
          <table style="width: 100%; color: white; border-collapse: collapse;">
            ${itemsHtml}
            <tr>
              <td style="padding: 20px 0; font-weight: bold; font-size: 18px;">TOTAL</td>
              <td style="padding: 20px 0; text-align: right; font-weight: bold; color: #FF5A1F; font-size: 24px;">${formattedTotal}</td>
            </tr>
          </table>
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://nucleotatianafigueiredo.com.br/admin/dashboard" style="display: inline-block; background-color: #FF5A1F; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Acessar Sistema de ADM</a>
          </div>
        </div>
      </div>
    `

    const customerEmailHtml = `
      <div style="font-family: sans-serif; background-color: #f4f4f4; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <div style="background-color: #1A1A1A; padding: 30px; text-align: center; color: white; border-bottom: 4px solid #FF5A1F;">
            <h2 style="margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 14px; color: #FF5A1F;">Sucesso!</h2>
            <h1 style="margin: 10px 0 0 0; font-size: 24px; font-weight: 900;">PEDIDO RECEBIDO</h1>
          </div>
          <div style="padding: 40px; color: #333;">
            <p style="font-size: 18px; margin-bottom: 20px;">Olá, <strong>${customer_name}</strong>,</p>
            <p style="line-height: 1.6; color: #666;">Seu pedido de itens solidários foi registrado com sucesso. Obrigado por apoiar nossa jornada!</p>
            <div style="margin: 30px 0; border: 1px solid #eee; padding: 25px; border-radius: 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
                <tr>
                  <td style="padding: 20px 0 0 0; font-weight: bold; font-size: 18px;">TOTAL</td>
                  <td style="padding: 20px 0 0 0; text-align: right; font-weight: bold; color: #FF5A1F; font-size: 22px;">${formattedTotal}</td>
                </tr>
              </table>
            </div>
            <div style="background-color: #FFF5F0; border-left: 4px solid #FF5A1F; padding: 20px; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #CC4818; line-height: 1.6;"><strong>IMPORTANTE:</strong> O frete e as taxas de envio são de responsabilidade integral do comprador.</p>
            </div>
            <p style="font-weight: bold;">O que acontece agora?</p>
            <p style="color: #666;">Nossa equipe entrará em contato via WhatsApp para combinar o pagamento e a entrega.</p>
          </div>
        </div>
      </div>
    `

    // Send Admin Email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
        to: ['nucleodedanca@yahoo.com.br', 'marinezag@gmail.com'],
        reply_to: customer_email,
        subject: `NOVO PEDIDO: ${customer_name}`,
        html: adminEmailHtml,
      }),
    })

    // Send Customer Email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
        to: [customer_email],
        subject: `Confirmamos seu pedido! - Danzamerica 2026`,
        html: customerEmailHtml,
      }),
    })

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})

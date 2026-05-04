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
    const { customer_name, customer_email, customer_phone, items, total_price } = await req.json()

    const itemsHtml = (items || []).map((item: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0;">${item.name}</td>
        <td style="padding: 10px 0; text-align: right;">R$ ${Number(item.price).toFixed(2)}</td>
      </tr>
    `).join('')

    // 1. Email for Admin
    const adminEmailHtml = `
      <div style="font-family: serif; background-color: #1A1A1A; color: white; padding: 40px; border: 1px solid #FF5A1F;">
        <h2 style="color: #FF5A1F; font-style: italic;">Novo Pedido de Itens Solidários</h2>
        <p>Um novo pedido foi realizado através do site:</p>
        <hr style="border-color: rgba(255,255,255,0.1);" />
        <p><strong>Cliente:</strong> ${customer_name}</p>
        <p><strong>Telefone:</strong> ${customer_phone}</p>
        <p><strong>E-mail:</strong> ${customer_email}</p>
        <hr style="border-color: rgba(255,255,255,0.1);" />
        <h4 style="color: #FF5A1F; margin-bottom: 10px;">Itens do Pedido:</h4>
        <table style="width: 100%; color: white; font-size: 14px;">
          ${itemsHtml}
          <tr>
            <td style="padding: 20px 0; font-weight: bold;">TOTAL</td>
            <td style="padding: 20px 0; text-align: right; font-weight: bold; color: #FF5A1F; font-size: 18px;">R$ ${Number(total_price).toFixed(2)}</td>
          </tr>
        </table>
        <hr style="border-color: rgba(255,255,255,0.1);" />
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://nucleotatianafigueiredo.com.br/admin/dashboard" style="background-color: #FF5A1F; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Acessar Sistema de Adm</a>
        </div>
        <p style="font-size: 10px; opacity: 0.5; text-transform: uppercase; margin-top: 30px; text-align: center;">Enviado via Sistema Danzamerica 2026</p>
      </div>
    `

    // 2. Email for Customer
    const customerEmailHtml = `
      <div style="font-family: serif; background-color: #f8f8f8; color: #1A1A1A; padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #FF5A1F; font-style: italic;">Danzamerica 2026</h1>
          <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 10px;">Confirmação de Pedido</p>
        </div>
        <div style="background-color: white; padding: 30px; border: 1px solid #eee;">
          <p>Olá, <strong>${customer_name}</strong>,</p>
          <p>Recebemos seu pedido de apoio solidário! Ficamos muito felizes com sua contribuição para nossa jornada rumo à Argentina.</p>
          
          <div style="margin: 30px 0; border: 1px solid #eee; padding: 20px;">
            <h4 style="color: #FF5A1F; margin-top: 0; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Resumo do Pedido:</h4>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
              <tr>
                <td style="padding: 15px 0; font-weight: bold;">TOTAL</td>
                <td style="padding: 15px 0; text-align: right; font-weight: bold; color: #FF5A1F;">R$ ${Number(total_price).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <p><strong>Próximos Passos:</strong></p>
          <p>Nossa equipe entrará em contato com você via WhatsApp para combinar o pagamento e a entrega dos itens.</p>
          
          <br />
          <p>Qualquer dúvida, fale conosco:</p>
          <p>📞 (31) 99361-5488</p>
          <p>📧 nucleodedanca@yahoo.com.br</p>
        </div>
        <div style="text-align: center; margin-top: 30px; font-size: 10px; opacity: 0.5;">
          <p>NÚCLEO DE DANÇA TATIANA FIGUEIREDO - TALENTOS DE MINAS</p>
        </div>
      </div>
    `

    // Send to Admin
    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
        to: ['nucleodedanca@yahoo.com.br', 'marinezag@gmail.com'],
        reply_to: customer_email,
        subject: `Novo Pedido Solidário: ${customer_name}`,
        html: adminEmailHtml,
      }),
    })
    
    const adminResData = await adminRes.json()
    console.log('Resend Admin Response Status:', adminRes.status)
    console.log('Resend Admin Response Data:', adminResData)

    if (!adminRes.ok) {
      throw new Error(`Resend Admin Error: ${JSON.stringify(adminResData)}`)
    }

    // Send to Customer
    const customerRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Danzamerica 2026 <pedidos@nucleotatianafigueiredo.com.br>',
        to: [customer_email],
        subject: `Confirmação de Pedido - Danzamerica 2026`,
        html: customerEmailHtml,
      }),
    })
    
    const customerResData = await customerRes.json()
    console.log('Resend Customer Response Status:', customerRes.status)
    console.log('Resend Customer Response Data:', customerResData)

    if (!customerRes.ok) {
      throw new Error(`Resend Customer Error: ${JSON.stringify(customerResData)}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Edge Function Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

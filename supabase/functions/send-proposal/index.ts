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
    const { name, company, phone, email, tier_name, tier_price, tier_benefits } = await req.json()

    const benefitsHtml = (tier_benefits || []).map(b => `<li style="margin-bottom: 8px;">${b}</li>`).join('')

    // 1. Email for Admins
    const adminEmailHtml = `
      <div style="font-family: serif; background-color: #1A1A1A; color: white; padding: 40px; border: 1px solid #FF5A1F;">
        <h2 style="color: #FF5A1F; font-style: italic;">Nova Solicitação de Proposta</h2>
        <p>Um novo interesse em cota de patrocínio foi registrado:</p>
        <hr style="border-color: rgba(255,255,255,0.1);" />
        <p><strong>Cota:</strong> ${tier_name} (R$ ${tier_price})</p>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Empresa/Pessoa:</strong> ${company || 'Não informado'}</p>
        <p><strong>Telefone:</strong> ${phone}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <hr style="border-color: rgba(255,255,255,0.1);" />
        <h4 style="color: #FF5A1F; margin-bottom: 10px;">Contrapartidas Selecionadas:</h4>
        <ul style="font-size: 13px; opacity: 0.8;">
          ${benefitsHtml}
        </ul>
        <hr style="border-color: rgba(255,255,255,0.1);" />
        <p style="font-size: 10px; opacity: 0.5; text-transform: uppercase;">Enviado via Sistema Danzamerica 2026</p>
      </div>
    `

    // 2. Confirmation Email for the User
    const userEmailHtml = `
      <div style="font-family: serif; background-color: #f8f8f8; color: #1A1A1A; padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #FF5A1F; font-style: italic;">Danzamerica 2026</h1>
          <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 10px;">Confirmação de Solicitação</p>
        </div>
        <div style="background-color: white; padding: 30px; border: 1px solid #eee;">
          <p>Olá, <strong>${name}</strong>,</p>
          <p>Recebemos sua solicitação de proposta para a cota <strong>${tier_name}</strong>, com investimento de <strong>R$ ${tier_price}</strong>. É uma honra ter seu interesse em apoiar nossos bailarinos rumo à Argentina.</p>
          
          <div style="background-color: #1A1A1A; color: white; padding: 20px; margin: 20px 0;">
            <h4 style="color: #FF5A1F; margin-top: 0;">Resumo das Contrapartidas:</h4>
            <ul style="font-size: 13px; margin-bottom: 0;">
              ${benefitsHtml}
            </ul>
          </div>

          <p>Nossa equipe administrativa já foi notificada e preparará um documento personalizado com todos os detalhes e o cronograma do projeto.</p>
          <p><strong>Você receberá um retorno em breve para darmos os próximos passos.</strong></p>
          <br />
          <p>Em caso de urgência, você pode nos contatar diretamente:</p>
          <p>📞 (31) 98765-4321 / (31) 3456-7890</p>
          <p>📧 nucleodedanca@yahoo.com.br</p>
        </div>
        <div style="text-align: center; margin-top: 30px; font-size: 10px; opacity: 0.5;">
          <p>NÚCLEO DE DANÇA TATIANA FIGUEIREDO - TALENTOS DE MINAS</p>
        </div>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Danzamerica 2026 <proposta@nucleotatianafigueiredo.com.br>',
        to: ['nucleodedanca@yahoo.com.br', 'marinezag@gmail.com'],
        reply_to: email,
        subject: `Solicitação de Proposta: ${tier_name} - ${name}`,
        html: adminEmailHtml,
      }),
    })

    // Send copy to user
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Danzamerica 2026 <proposta@nucleotatianafigueiredo.com.br>',
        to: [email],
        subject: `Recebemos sua solicitação - Danzamerica 2026`,
        html: userEmailHtml,
      }),
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

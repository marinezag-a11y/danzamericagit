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
    const { email, full_name, new_password } = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error('Resend API Key not configured')
    }

    const emailHtml = `
      <div style="font-family: serif; background-color: #1A1A1A; color: white; padding: 40px; border: 1px solid #FF5A1F; max-width: 600px; margin: auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #FF5A1F; font-style: italic; margin-bottom: 5px;">Danzamerica 2026</h2>
          <p style="text-transform: uppercase; letter-spacing: 3px; font-size: 10px; opacity: 0.5;">Segurança da Conta</p>
        </div>
        
        <h3 style="color: white; font-style: italic; border-bottom: 1px solid rgba(255,90,31,0.2); padding-bottom: 15px; margin-bottom: 25px;">Senha Alterada com Sucesso!</h3>
        
        <p>Olá, <strong>${full_name}</strong>,</p>
        <p>Este é um e-mail de confirmação informando que a sua senha de acesso ao painel administrativo foi alterada recentemente.</p>
        
        <div style="background-color: rgba(255,255,255,0.03); padding: 25px; border-left: 4px solid #FF5A1F; margin: 30px 0;">
          <p style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; tracking-spacing: 1px; color: #FF5A1F; font-weight: bold;">Seus Novos Dados de Acesso:</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Login:</strong> ${email}</p>
          <p style="margin: 0; font-size: 14px;"><strong>Nova Senha:</strong> ${new_password}</p>
        </div>

        <div style="text-align: center; margin: 40px 0;">
          <a href="https://danzamerica.vercel.app/admin" style="background-color: #FF5A1F; color: white; padding: 18px 35px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-size: 11px; display: inline-block; border-radius: 2px;">Acessar Painel ADM</a>
        </div>

        <p style="font-size: 12px; opacity: 0.5; text-align: center; margin-top: 30px;">
          Se você não realizou esta alteração, entre em contato com o suporte imediatamente.
        </p>
        
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 40px; margin-bottom: 20px;" />
        <p style="font-size: 9px; opacity: 0.4; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
          NÚCLEO DE DANÇA TATIANA FIGUEIREDO - TALENTOS DE MINAS<br/>
          Belo Horizonte - MG
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Danzamerica 2026 <admin@nucleotatianafigueiredo.com.br>',
        to: [email],
        subject: `Sua senha foi alterada - Danzamerica 2026`,
        html: emailHtml,
      }),
    })

    const result = await res.json()

    return new Response(JSON.stringify(result), {
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

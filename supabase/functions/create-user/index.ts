import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, full_name } = await req.json()

    const { data, error } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      email_confirm: true
    })

    if (error) throw error

    // 2. Send Welcome Email via Resend
    if (RESEND_API_KEY) {
      const welcomeEmailHtml = `
        <div style="font-family: serif; background-color: #1A1A1A; color: white; padding: 40px; border: 1px solid #FF5A1F; max-width: 600px; margin: auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #FF5A1F; font-style: italic; margin-bottom: 5px;">Danzamerica 2026</h2>
            <p style="text-transform: uppercase; letter-spacing: 3px; font-size: 10px; opacity: 0.5;">Acesso Administrativo</p>
          </div>
          
          <h3 style="color: white; font-style: italic; border-bottom: 1px solid rgba(255,90,31,0.2); padding-bottom: 15px; margin-bottom: 25px;">Bem-vindo ao Time!</h3>
          
          <p>Olá, <strong>${full_name}</strong>,</p>
          <p>Você acaba de ser adicionado como administrador do sistema Danzamerica 2026. Agora você tem acesso total para gerenciar conteúdos, patrocínios e pedidos.</p>
          
          <div style="background-color: rgba(255,255,255,0.03); padding: 25px; border-left: 4px solid #FF5A1F; margin: 30px 0;">
            <p style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; tracking-spacing: 1px; color: #FF5A1F; font-weight: bold;">Seus Dados de Acesso:</p>
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Login:</strong> ${email}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Senha Temporária:</strong> ${password}</p>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="https://danzamerica.vercel.app/admin" style="background-color: #FF5A1F; color: white; padding: 18px 35px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-size: 11px; display: inline-block; border-radius: 2px;">Acessar Painel Agora</a>
          </div>

          <p style="font-size: 12px; opacity: 0.5; font-style: italic; text-align: center; margin-top: 30px;">
            * Recomendamos que você altere sua senha na aba "Perfil" logo após o primeiro acesso para garantir sua segurança.
          </p>
          
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 40px; margin-bottom: 20px;" />
          <p style="font-size: 9px; opacity: 0.4; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
            NÚCLEO DE DANÇA TATIANA FIGUEIREDO - TALENTOS DE MINAS<br/>
            Belo Horizonte - MG
          </p>
        </div>
      `;

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Danzamerica 2026 <admin@nucleotatianafigueiredo.com.br>',
            to: [email],
            subject: `Bem-vindo ao Painel Danzamerica 2026 - ${full_name}`,
            html: welcomeEmailHtml,
          }),
        })
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError)
        // We don't throw here to avoid failing the user creation if only the email fails
      }
    }

    return new Response(JSON.stringify(data), {
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

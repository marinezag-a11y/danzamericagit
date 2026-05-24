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
    // 1. Initialize Supabase Client with service_role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Validate user auth token from authorization header
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      throw new Error(`Não autorizado. Detalhes: ${authError?.message || 'Usuário não logado'}`)
    }

    // 3. Verify user has administrative claims/roles
    const { data: callerProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !callerProfile || !['master', 'admin', 'operator'].includes(callerProfile.role)) {
      throw new Error('Acesso negado: Apenas administradores podem atualizar status de energia.')
    }

    // 4. Extract parameters
    const { leadId, status } = await req.json()

    if (!leadId || !status) {
      throw new Error('ID do lead e status são obrigatórios.')
    }

    // 5. Fetch Lead Details
    const { data: lead, error: leadError } = await supabaseClient
      .from('energy_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      throw new Error(`Lead não encontrado: ${leadError?.message || ''}`)
    }

    // If status is pending or not supported, return early
    if (status !== 'launched' && status !== 'approved') {
      return new Response(JSON.stringify({ 
        success: true, 
        sent: false, 
        message: `Nenhum e-mail configurado para o status ${status}.` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (!RESEND_API_KEY) {
      throw new Error('Chave de API do Resend não configurada no ambiente Deno.')
    }

    const averageBillFormatted = Number(lead.average_bill).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })

    let emailSubject = ''
    let emailHtml = ''

    if (status === 'launched') {
      emailSubject = `⚡ Seu Plano de Redução de Energia foi Lançado! - ${lead.name}`
      emailHtml = `
        <div style="font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0A0F1D; padding: 50px 20px; color: #F3F4F6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #121B2E; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #064E3B 0%, #022C22 100%); padding: 40px 30px; text-align: center; border-bottom: 1px solid rgba(16, 185, 129, 0.1);">
              <div style="display: inline-block; padding: 8px 16px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 30px; margin-bottom: 20px;">
                <span style="color: #10B981; font-size: 10px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;">Ação Sustentável</span>
              </div>
              <h1 style="color: #FFFFFF; font-size: 28px; font-weight: 800; font-family: serif; font-style: italic; margin: 0 0 10px 0; letter-spacing: -0.5px;">⚡ Proposta em Homologação!</h1>
              <p style="color: #9CA3AF; font-size: 13px; margin: 0; line-height: 1.5;">Seus dados de economia foram calculados e enviados para a concessionária local.</p>
            </div>

            <!-- Progress Tracker -->
            <div style="padding: 30px 40px 10px 40px;">
              <table style="width: 100%; border-collapse: collapse; text-align: center;">
                <tr>
                  <td style="width: 30%; font-size: 9px; font-weight: bold; color: #10B981; text-transform: uppercase; letter-spacing: 1px;">
                    <div style="height: 6px; border-radius: 3px; background-color: #10B981; margin-bottom: 8px; box-shadow: 0 0 8px rgba(16,185,129,0.5);"></div>
                    Adesão Feita
                  </td>
                  <td style="width: 5%;"></td>
                  <td style="width: 30%; font-size: 9px; font-weight: bold; color: #34D399; text-transform: uppercase; letter-spacing: 1px;">
                    <div style="height: 6px; border-radius: 3px; background-color: #34D399; margin-bottom: 8px; box-shadow: 0 0 8px rgba(52,211,153,0.5);"></div>
                    Lançado na Cia
                  </td>
                  <td style="width: 5%;"></td>
                  <td style="width: 30%; font-size: 9px; font-weight: bold; color: #4B5563; text-transform: uppercase; letter-spacing: 1px;">
                    <div style="height: 6px; border-radius: 3px; background-color: #1F2937; margin-bottom: 8px;"></div>
                    Desconto Ativo
                  </td>
                </tr>
              </table>
            </div>

            <!-- Main Body -->
            <div style="padding: 30px 40px; line-height: 1.6; font-size: 14px; color: #D1D5DB;">
              <p style="margin-top: 0;">Olá, <strong>${lead.name}</strong>,</p>
              
              <p>Temos o prazer de informar que o seu <strong>Plano de Injeção de Energia</strong> avançou para a próxima etapa importante!</p>
              
              <p>Nossa equipe técnica modelou a sua proposta com base na sua conta de luz média registrada e já realizou o <strong>lançamento técnico</strong> junto à concessionária de energia do seu estado.</p>
              
              <!-- Lead Details Box -->
              <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #10B981; font-weight: bold;">Resumo do seu Plano:</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; color: #9CA3AF;">Cidade:</td>
                    <td style="padding: 8px 0; text-align: right; color: #FFFFFF; font-weight: 600;">${lead.city}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; color: #9CA3AF;">Valor Médio da Conta:</td>
                    <td style="padding: 8px 0; text-align: right; color: #10B981; font-weight: 600;">${averageBillFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9CA3AF;">Status Técnico:</td>
                    <td style="padding: 8px 0; text-align: right; color: #34D399; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Lançado / Em Homologação</td>
                  </tr>
                </table>
              </div>

              <h3 style="color: #FFFFFF; font-size: 16px; margin: 30px 0 10px 0; font-family: serif; font-style: italic;">O que acontece a partir de agora?</h3>
              <ul style="padding-left: 20px; margin: 0 0 30px 0; space-y: 8px;">
                <li style="margin-bottom: 10px;"><strong>Análise da Concessionária:</strong> A distribuidora de energia revisará a homologação técnica para alocação dos créditos de energia solar limpa.</li>
                <li style="margin-bottom: 10px;"><strong>Contato do Especialista:</strong> Um de nossos especialistas entrará em contato via WhatsApp para alinhar os últimos detalhes do fechamento da sua injeção de créditos de forma rápida e segura.</li>
                <li style="margin-bottom: 10px;"><strong>Ativação Automática:</strong> Assim que concluído este prazo de análise, seu plano será ativado e você receberá uma confirmação oficial de desconto ativo.</li>
                <li><strong>Redução na Fatura:</strong> A partir da homologação técnica, sua economia começará a ser aplicada em até 90 dias de forma 100% digital e sem custos extras.</li>
              </ul>

              <p style="margin-bottom: 0; font-size: 13px; color: #9CA3AF; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 25px;">
                Agradecemos sua adesão ao plano! Além de reduzir sua conta de luz, você está colaborando de forma vital com o <strong>Núcleo de Dança Tatiana Figueiredo - Rumo ao Danzamerica 2026</strong>.
              </p>
            </div>

            <!-- Footer Section -->
            <div style="background-color: #0B111E; padding: 30px; text-align: center; border-t: 1px solid rgba(255,255,255,0.05);">
              <p style="color: #FF5A1F; font-family: serif; font-style: italic; font-size: 18px; margin: 0 0 5px 0;">Danzamerica 2026</p>
              <p style="color: #9CA3AF; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 15px 0;">Núcleo de Dança Tatiana Figueiredo - Talentos de Minas</p>
              <p style="color: #4B5563; font-size: 9px; margin: 0;">Belo Horizonte - MG | Contato: nucleodedanca@yahoo.com.br</p>
            </div>

          </div>
        </div>
      `
    } else if (status === 'approved') {
      emailSubject = `🎉 Parabéns! Seu Plano de Energia foi Aprovado! - ${lead.name}`
      emailHtml = `
        <div style="font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0A0F1D; padding: 50px 20px; color: #F3F4F6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #121B2E; border: 1px solid #10B981; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #047857 0%, #064E3B 100%); padding: 45px 30px; text-align: center; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
              <div style="display: inline-block; padding: 8px 16px; background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 30px; margin-bottom: 20px;">
                <span style="color: #FFFFFF; font-size: 10px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;">🎉 ATIVAÇÃO CONFIRMADA</span>
              </div>
              <h1 style="color: #FFFFFF; font-size: 32px; font-weight: 800; font-family: serif; font-style: italic; margin: 0 0 10px 0; letter-spacing: -0.5px;">Desconto Homologado!</h1>
              <p style="color: #A7F3D0; font-size: 14px; margin: 0; line-height: 1.5; font-weight: 500;">Seu plano de energia solar limpa está 100% ativo com economia garantida.</p>
            </div>

            <!-- Progress Tracker -->
            <div style="padding: 30px 40px 10px 40px;">
              <table style="width: 100%; border-collapse: collapse; text-align: center;">
                <tr>
                  <td style="width: 30%; font-size: 9px; font-weight: bold; color: #10B981; text-transform: uppercase; letter-spacing: 1px;">
                    <div style="height: 6px; border-radius: 3px; background-color: #10B981; margin-bottom: 8px; box-shadow: 0 0 8px rgba(16,185,129,0.5);"></div>
                    Adesão Feita
                  </td>
                  <td style="width: 5%;"></td>
                  <td style="width: 30%; font-size: 9px; font-weight: bold; color: #10B981; text-transform: uppercase; letter-spacing: 1px;">
                    <div style="height: 6px; border-radius: 3px; background-color: #10B981; margin-bottom: 8px; box-shadow: 0 0 8px rgba(16,185,129,0.5);"></div>
                    Lançado na Cia
                  </td>
                  <td style="width: 5%;"></td>
                  <td style="width: 30%; font-size: 9px; font-weight: bold; color: #10B981; text-transform: uppercase; letter-spacing: 1px;">
                    <div style="height: 6px; border-radius: 3px; background-color: #10B981; margin-bottom: 8px; box-shadow: 0 0 15px rgba(16,185,129,0.8);"></div>
                    Desconto Ativo! 🎉
                  </td>
                </tr>
              </table>
            </div>

            <!-- Main Body -->
            <div style="padding: 30px 40px; line-height: 1.6; font-size: 14px; color: #D1D5DB;">
              <p style="margin-top: 0; font-size: 16px; color: #FFFFFF;">Olá, <strong>${lead.name}</strong>!</p>
              
              <p>Temos a melhor notícia possível: a concessionária de energia <strong>homologou e aprovou</strong> com sucesso a sua adesão ao Plano de Injeção de Energia Solar!</p>
              
              <p>Isso significa que a injeção de créditos foi ativada na sua titularidade e você passará a economizar na sua conta de luz em até 90 dias.</p>
              
              <!-- Desconto Highlight Box -->
              <div style="background: linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(4,120,87,0.15) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 25px; margin: 30px 0; text-align: center;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #34D399; font-weight: bold; display: block; margin-bottom: 5px;">Seu Novo Desconto Estimado:</span>
                <span style="font-size: 40px; font-weight: 800; color: #FFFFFF; font-family: serif; font-style: italic; display: block; margin-bottom: 5px;">Até 15%</span>
                <span style="font-size: 12px; color: #A7F3D0; display: block;">Redução líquida real direto na sua conta de luz!</span>
              </div>

              <!-- Details Table -->
              <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #10B981; font-weight: bold;">Dados Técnicos da Homologação:</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; color: #9CA3AF;">Titular do Plano:</td>
                    <td style="padding: 8px 0; text-align: right; color: #FFFFFF; font-weight: 600;">${lead.name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; color: #9CA3AF;">Média Histórica:</td>
                    <td style="padding: 8px 0; text-align: right; color: #FFFFFF; font-weight: 600;">${averageBillFormatted} / mês</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9CA3AF;">Status Final:</td>
                    <td style="padding: 8px 0; text-align: right; color: #10B981; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 1.5px;">APROVADO E ATIVADO!</td>
                  </tr>
                </table>
              </div>

              <h3 style="color: #FFFFFF; font-size: 16px; margin: 30px 0 10px 0; font-family: serif; font-style: italic;">O que acontece a partir de agora?</h3>
              <p style="margin-top: 0; margin-bottom: 25px;">O processo é 100% digital, mas <strong>um especialista da nossa equipe entrará em contato com você via WhatsApp em breve</strong> para passar todas as orientações do fechamento e tirar qualquer dúvida sobre a homologação. Depois disso, basta conferir o desconto demonstrado diretamente na sua fatura de luz em até 90 dias!</p>

              <div style="background-color: rgba(255, 90, 31, 0.05); border-left: 4px solid #FF5A1F; padding: 15px; border-radius: 4px; margin-bottom: 30px; font-size: 13px;">
                <strong style="color: #FF5A1F;">Seu impacto positivo:</strong> Ao economizar na sua conta, você gerou uma cota de suporte essencial para o financiamento coletivo que levará nossa equipe mineira de dança para a Argentina em 2026. Obrigado por fazer a diferença no esporte, na cultura e no planeta! 💚
              </div>
            </div>

            <!-- Footer Section -->
            <div style="background-color: #0B111E; padding: 30px; text-align: center; border-t: 1px solid rgba(255,255,255,0.05);">
              <p style="color: #FF5A1F; font-family: serif; font-style: italic; font-size: 18px; margin: 0 0 5px 0;">Danzamerica 2026</p>
              <p style="color: #9CA3AF; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 15px 0;">Núcleo de Dança Tatiana Figueiredo - Talentos de Minas</p>
              <p style="color: #4B5563; font-size: 9px; margin: 0;">Belo Horizonte - MG | Contato: nucleodedanca@yahoo.com.br</p>
            </div>

          </div>
        </div>
      `
    }

    // 6. Send via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Injeção de Energia - Tatiana Figueiredo <energia@nucleotatianafigueiredo.com.br>',
        to: [lead.email],
        reply_to: 'nucleodedanca@yahoo.com.br',
        subject: emailSubject,
        html: emailHtml,
      }),
    })

    const emailResponseText = await res.text()
    let emailResponseJson = {}
    try {
      emailResponseJson = JSON.parse(emailResponseText)
    } catch {
      emailResponseJson = { message: emailResponseText }
    }

    if (!res.ok) {
      throw new Error(`Erro ao enviar e-mail via Resend: ${JSON.stringify(emailResponseJson)}`)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      sent: true,
      message: `E-mail de status '${status}' enviado com sucesso para ${lead.email}`,
      resend_data: emailResponseJson
    }), {
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

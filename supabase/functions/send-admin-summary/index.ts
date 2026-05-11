import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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
    return await res.json()
  } catch (err) {
    return { error: err }
  }
}

serve(async (req) => {
  try {
    console.log('--- START ENHANCED SUMMARY ---')
    
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()

    // 1. Fetch ALL Data for complete report
    const [latestRafflesRes, latestHelpRes, allPaidRafflesRes, campaignsRes, dancersRes] = await Promise.all([
      supabase.from('raffle_orders').select('*, raffle_campaigns(name)').gte('created_at', twelveHoursAgo).order('created_at', { ascending: false }),
      supabase.from('help_orders').select('*').gte('created_at', twelveHoursAgo).order('created_at', { ascending: false }),
      supabase.from('raffle_orders').select('selected_numbers, total_price, dancer_name, campaign_id').eq('status', 'paid'),
      supabase.from('raffle_campaigns').select('*').eq('is_active', true),
      supabase.from('dancers').select('name, photo_url').order('name', { ascending: true })
    ])

    const latestRaffles = latestRafflesRes.data || []
    const latestHelp = latestHelpRes.data || []
    const allPaidRaffles = allPaidRafflesRes.data || []
    const campaigns = campaignsRes.data || []
    const dancers = dancersRes.data || []

    // Calculate Global Progress
    const totalTicketsSold = allPaidRaffles.reduce((sum, o) => sum + (o.selected_numbers?.length || 0), 0)
    const totalCapacity = campaigns.reduce((sum, c) => sum + (c.total_numbers || 0), 0)
    const globalProgress = totalCapacity > 0 ? Math.round((totalTicketsSold / totalCapacity) * 100) : 0
    
    // Per-Dancer Metrics (Capturing dynamic goals)
    const dancerStats = dancers.map(d => {
      const dancerOrders = allPaidRaffles.filter(o => o.dancer_name === d.name)
      const sold = dancerOrders.reduce((sum, o) => sum + (o.selected_numbers?.length || 0), 0)
      const revenue = dancerOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0)
      
      // Get the goal from the campaign this dancer is associated with (or default)
      const firstCampaignId = dancerOrders[0]?.campaign_id
      const campaign = campaigns.find(c => c.id === firstCampaignId) || campaigns[0]
      const goal = campaign?.goal_per_dancer || 53
      
      const percent = Math.min(100, Math.round((sold / goal) * 100))
      return { ...d, sold, revenue, goal, percent }
    }).sort((a, b) => b.sold - a.sold)

    const revenueTotal = allPaidRaffles.reduce((sum, o) => sum + Number(o.total_price || 0), 0)
    const latestRevenue = latestRaffles.reduce((sum, o) => sum + Number(o.total_price || 0), 0) + 
                          latestHelp.reduce((sum, o) => sum + Number(o.total_price || 0), 0)

    // Fetch Admin Emails
    const { data: settingData } = await supabase.from('site_settings').select('value').eq('key', 'notification_emails_general').single()
    const adminEmails = settingData?.value 
      ? settingData.value.split(',').map((e: string) => e.trim()).filter(Boolean)
      : ['nucleodedanca@yahoo.com.br', 'marinezag@gmail.com']

    // Build Premium Email HTML (Dark Mode Style)
    const summaryHtml = `
      <div style="font-family: 'Inter', sans-serif; background-color: #0f0f0f; padding: 40px; color: #ffffff;">
        <div style="max-width: 700px; margin: 0 auto; background-color: #1a1a1a; border-radius: 40px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 50px 100px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <div style="padding: 60px 45px; background: linear-gradient(135deg, #1a1a1a 0%, #121212 100%); text-align: center;">
            <div style="color: #FF5A1F; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 5px; margin-bottom: 20px;">Intelligence Dashboard</div>
            <h1 style="margin: 0; font-size: 34px; font-weight: 300; letter-spacing: -1px;">Danzamerica <span style="color: #FF5A1F; font-weight: 800;">2026</span></h1>
            <p style="opacity: 0.4; font-size: 13px; margin-top: 15px; text-transform: uppercase; letter-spacing: 2px;">Relatório Consolidado de Performance</p>
          </div>

          <div style="padding: 0 45px 60px 45px;">
            
            <!-- Global Stats -->
            <div style="display: table; width: 100%; margin-bottom: 50px; background: rgba(255,255,255,0.03); border-radius: 30px; padding: 35px; border: 1px solid rgba(255,255,255,0.05);">
              <div style="display: table-cell; width: 50%; vertical-align: middle;">
                <span style="display: block; font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; font-weight: bold; margin-bottom: 10px;">Arrecadação Total</span>
                <strong style="font-size: 32px; color: #ffffff;">R$ ${revenueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style="display: table-cell; width: 50%; text-align: right; vertical-align: middle;">
                <span style="display: block; font-size: 10px; color: #FF5A1F; text-transform: uppercase; font-weight: bold; margin-bottom: 10px;">Status Global</span>
                <strong style="font-size: 32px; color: #FF5A1F;">${globalProgress}%</strong>
              </div>
            </div>

            <!-- Hall of Talents (Goal Tracking) -->
            <div style="margin-bottom: 60px;">
              <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 3px; color: #ffffff; margin-bottom: 35px; display: flex; align-items: center;">
                <span style="background: #FF5A1F; width: 15px; height: 15px; border-radius: 50%; display: inline-block; margin-right: 12px;"></span>
                Hall de Talentos (Metas Alunos)
              </h3>
              
              ${dancerStats.slice(0, 12).map((d, i) => `
                <div style="margin-bottom: 25px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: flex-end;">
                    <div style="flex-grow: 1;">
                      <span style="font-size: 10px; opacity: 0.3; margin-right: 8px;">#${i + 1}</span>
                      <strong style="font-size: 15px; color: #ffffff; opacity: 0.9;">${d.name}</strong>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 14px; color: #FF5A1F; font-weight: 800;">R$ ${d.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <div style="font-size: 10px; opacity: 0.4; text-transform: uppercase;">${d.sold} / ${d.goal} rifas</div>
                    </div>
                  </div>
                  <div style="background: rgba(255,255,255,0.05); height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, rgba(255,90,31,0.4), #FF5A1F); width: ${d.percent}%; height: 100%; border-radius: 3px; box-shadow: 0 0 10px rgba(255,90,31,0.3);"></div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Activity Recap (12h) -->
            <div style="background: #222; border-radius: 30px; padding: 40px; margin-bottom: 50px; border: 1px solid rgba(255,90,31,0.1);">
              <h4 style="margin: 0 0 25px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #FF5A1F;">Movimentação Recente (12h)</h4>
              <div style="font-size: 28px; font-weight: 300; margin-bottom: 30px;">+ R$ ${latestRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              
              <table style="width: 100%; border-collapse: collapse;">
                ${latestRaffles.slice(0, 5).map(o => `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                      <div style="font-size: 13px; color: #ffffff;">${o.customer_name}</div>
                      <div style="font-size: 10px; opacity: 0.4;">Apoio: ${o.dancer_name || 'Geral'}</div>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; font-weight: bold; color: #FF5A1F;">R$ ${Number(o.total_price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </table>
            </div>

            <div style="text-align: center;">
              <a href="${SUPABASE_URL.replace('.supabase.co', '')}/project/_/editor" style="display: inline-block; background: #FF5A1F; color: #ffffff; padding: 22px 50px; border-radius: 20px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 3px; box-shadow: 0 20px 40px rgba(255,90,31,0.3);">
                Acessar Dashboard
              </a>
            </div>

          </div>
          
          <div style="background-color: #121212; padding: 35px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
            <p style="margin: 0; font-size: 10px; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 4px; font-weight: bold;">
              Danzamerica Intelligence Hub • 2026
            </p>
          </div>
        </div>
      </div>
    `

    await sendResendEmail({
      from: 'Danzamerica Intelligence <relatorios@nucleotatianafigueiredo.com.br>',
      to: adminEmails,
      subject: `📊 Relatório de Performance: Arrecadamos R$ ${latestRevenue.toFixed(0)} nas últimas 12h!`,
      html: summaryHtml,
    })

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (error: any) {
    console.error('Summary Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

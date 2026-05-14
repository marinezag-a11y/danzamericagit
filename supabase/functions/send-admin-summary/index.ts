import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const MAILERSEND_API_KEY = Deno.env.get('MAILERSEND_API_KEY')
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
    
    const data = await res.json()
    if (!res.ok) {
      console.error(`[Resend Error]`, JSON.stringify(data))
      return { ok: false, error: data }
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
    const mailerSendPayload = {
      from: {
        email: payload.from.match(/<(.+)>/)?.[1] || payload.from,
        name: payload.from.match(/^(.+?)\s*</)?.[1] || 'Danzamerica Intelligence'
      },
      to: Array.isArray(payload.to) ? payload.to.map((email: string) => ({ email })) : [{ email: payload.to }],
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
      return { ok: false, error: errorData }
    }
    return { ok: true }
  } catch (err) {
    console.error(`[MailerSend Exception]`, err)
    return { ok: false, error: err }
  }
}

serve(async (req) => {
  try {
    let forceProvider = null
    let targetEmail = null
    
    // Check for test parameters
    try {
      const clone = req.clone()
      const body = await clone.json()
      forceProvider = body.forceProvider
      targetEmail = body.targetEmail
    } catch {
      // Not a JSON request or empty body
    }

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
    
    // Per-Dancer Metrics
    const dancerStats = dancers.map(d => {
      const dancerOrders = allPaidRaffles.filter(o => o.dancer_name === d.name)
      const sold = dancerOrders.reduce((sum, o) => sum + (o.selected_numbers?.length || 0), 0)
      const revenue = dancerOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0)
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
    let adminEmails = []
    if (targetEmail) {
      adminEmails = [targetEmail]
    } else {
      const { data: settingData } = await supabase.from('site_settings').select('value').eq('key', 'notification_emails_general').single()
      adminEmails = settingData?.value 
        ? settingData.value.split(',').map((e: string) => e.trim()).filter(Boolean)
        : ['nucleodedanca@yahoo.com.br', 'marinezag@gmail.com']
    }

    // Build Premium Email HTML
    const summaryHtml = `
      <div style="font-family: 'Inter', sans-serif; background-color: #0f0f0f; padding: 40px; color: #ffffff;">
        <div style="max-width: 700px; margin: 0 auto; background-color: #1a1a1a; border-radius: 40px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 50px 100px rgba(0,0,0,0.5);">
          <div style="padding: 60px 45px; background: linear-gradient(135deg, #1a1a1a 0%, #121212 100%); text-align: center;">
            <div style="color: #FF5A1F; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 5px; margin-bottom: 20px;">Intelligence Dashboard</div>
            <h1 style="margin: 0; font-size: 34px; font-weight: 300; letter-spacing: -1px;">Danzamerica <span style="color: #FF5A1F; font-weight: 800;">2026</span></h1>
            <p style="opacity: 0.4; font-size: 13px; margin-top: 15px; text-transform: uppercase; letter-spacing: 2px;">Relatório Consolidado de Performance</p>
          </div>
          <div style="padding: 0 45px 60px 45px;">
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
            <div style="margin-bottom: 60px;">
              <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 3px; color: #ffffff; margin-bottom: 35px; display: flex; align-items: center;">
                <span style="background: #FF5A1F; width: 15px; height: 15px; border-radius: 50%; display: inline-block; margin-right: 12px;"></span>
                Hall de Talentos (Top 12)
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
                    <div style="background: linear-gradient(90deg, rgba(255,90,31,0.4), #FF5A1F); width: ${d.percent}%; height: 100%; border-radius: 3px;"></div>
                  </div>
                </div>
              `).join('')}
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

    const emailPayload = {
      from: 'Danzamerica Intelligence <relatorios@nucleotatianafigueiredo.com.br>',
      to: adminEmails,
      subject: `📊 Relatório de Performance: Arrecadamos R$ ${latestRevenue.toFixed(0)} nas últimas 12h!`,
      html: summaryHtml,
    }

    let result = { ok: false, error: 'No provider attempted' }

    if (forceProvider === 'mailersend') {
      console.log('[Flow] Forcing MailerSend for test...')
      result = await sendMailerSendEmail(emailPayload)
    } else if (forceProvider === 'resend') {
      console.log('[Flow] Forcing Resend for test...')
      result = await sendResendEmail(emailPayload)
    } else {
      console.log('[Flow] Standard flow: Trying Resend first...')
      result = await sendResendEmail(emailPayload)
      if (!result.ok) {
        console.warn('[Flow] Resend failed, trying MailerSend fallback...')
        result = await sendMailerSendEmail(emailPayload)
      }
    }

    return new Response(JSON.stringify({ success: result.ok, error: result.error }), { 
      status: result.ok ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Summary Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

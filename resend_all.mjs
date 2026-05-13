
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://cybakgeofynizvtaqlph.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function resendFailedEmails() {
  console.log('--- Iniciando Reenvio em Massa ---')

  // Buscar pedidos de rifa que falharam
  const { data: raffleOrders, error: raffleError } = await supabase
    .from('raffle_orders')
    .select('*')
    .eq('notification_sent', false)
    .order('created_at', { ascending: false })

  if (raffleError) {
    console.error('Erro ao buscar rifas:', raffleError)
    return
  }

  console.log(`Encontrados ${raffleOrders?.length || 0} pedidos de rifa pendentes.`)

  for (const order of (raffleOrders || [])) {
    console.log(`Reenviando para: ${order.customer_name} (${order.customer_email})...`)
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          order_id: order.id,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          selected_numbers: order.selected_numbers,
          total_price: order.total_price,
          campaign_id: order.campaign_id,
          dancer_name: order.dancer_name,
          pix_key: order.pix_key,
          pix_bank: order.pix_bank,
          pix_receiver: order.pix_receiver
        })
      })

      const result = await response.json()
      console.log(`Resultado ${order.id}:`, result.success ? 'SUCESSO' : 'FALHA')
    } catch (err) {
      console.error(`Erro ao processar ${order.id}:`, err)
    }
  }

  console.log('--- Processo Concluído ---')
}

resendFailedEmails()

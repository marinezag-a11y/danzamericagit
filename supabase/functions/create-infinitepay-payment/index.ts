import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const INFINITEPAY_TAG = Deno.env.get('INFINITEPAY_TAG') || 'marinez-silva' // Fallback padrão da conta Marinez Silva

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '')

function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  // Remover tudo que não for dígito ou o sinal de +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Se começar com 55 e tiver 12 ou 13 dígitos
  if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
    return `+${cleaned}`;
  }
  
  // Caso contrário, assumir que é do Brasil e adicionar +55
  return `+55${cleaned}`;
}

serve(async (req) => {
  // Tratar requisição CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { 
      order_id, 
      total_price, 
      customer_name, 
      customer_email, 
      customer_phone,
      campaign_name,
      redirect_url
    } = body

    if (!order_id || !total_price) {
      return new Response(JSON.stringify({ error: 'Order ID and Total Price are required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      })
    }

    console.log(`[InfinitePay] Generating checkout for Order: ${order_id}, Price: R$ ${total_price}`)

    // 1. Definir URL de Webhook dinâmica apontando para este mesmo projeto do Supabase
    // O Supabase URL já está nas variáveis de ambiente do Deno, ex: https://xxxx.supabase.co
    const webhookUrl = `${SUPABASE_URL}/functions/v1/infinitepay-webhook`
    const defaultRedirectUrl = redirect_url || `${req.headers.get('origin') || 'https://danzamerica.nucleotatianafigueiredo.com.br'}`

    // 2. Montar o payload da InfinitePay conforme especificações
    // O preço é em centavos (Math.round(total_price * 100))
    const payload = {
      handle: INFINITEPAY_TAG,
      redirect_url: defaultRedirectUrl,
      webhook_url: webhookUrl,
      order_nsu: order_id,
      customer: {
        name: customer_name || "",
        email: customer_email || "",
        phone_number: cleanPhoneNumber(customer_phone)
      },
      items: [
        {
          description: campaign_name ? `Rifa: ${campaign_name}` : "Apoiador Danzamerica - Ação entre Amigos",
          price: Math.round(total_price * 100),
          quantity: 1
        }
      ]
    }

    console.log(`[InfinitePay] POST to InfinitePay Checkout API. Payload:`, JSON.stringify(payload))

    // 3. Fazer a chamada à API da InfinitePay de forma robusta
    // Tentamos o endpoint padrão de checkout primeiro
    let response = await fetch('https://api.checkout.infinitepay.io/v1/checkout/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DanzamericaWebClient/1.0'
      },
      body: JSON.stringify(payload)
    })

    let data;
    const responseText = await response.text()
    
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error(`[InfinitePay] Failed to parse JSON response. Raw response:`, responseText)
    }

    // Se o primeiro endpoint falhar, tentamos o endpoint alternativo como fallback
    if (!response.ok || !data || (!data.url && !data.payment_url && !data.link)) {
      console.warn(`[InfinitePay] Primary endpoint returned status ${response.status}. Trying fallback endpoint /links...`)
      
      const fallbackResponse = await fetch('https://api.checkout.infinitepay.io/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DanzamericaWebClient/1.0'
        },
        body: JSON.stringify(payload)
      })

      const fallbackText = await fallbackResponse.text()
      try {
        const fallbackData = JSON.parse(fallbackText)
        if (fallbackResponse.ok && fallbackData && (fallbackData.url || fallbackData.payment_url || fallbackData.link)) {
          response = fallbackResponse
          data = fallbackData
          console.log(`[InfinitePay] Fallback endpoint success!`)
        } else {
          console.error(`[InfinitePay] Fallback also failed. Status: ${fallbackResponse.status}. Body:`, fallbackText)
        }
      } catch (err) {
        console.error(`[InfinitePay] Fallback parse failed. Raw:`, fallbackText)
      }
    }

    if (!response.ok || !data) {
      return new Response(JSON.stringify({ 
        error: 'Failed to create payment link with InfinitePay',
        details: data || responseText 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    const checkoutUrl = data.url || data.payment_url || data.link

    if (!checkoutUrl) {
      console.error(`[InfinitePay] Response did not contain checkout URL:`, data)
      return new Response(JSON.stringify({ 
        error: 'Response from InfinitePay did not contain a valid payment URL',
        response: data
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    console.log(`[InfinitePay] Checkout link successfully generated: ${checkoutUrl}`)

    // 4. Salvar a URL gerada na tabela de pedidos se for necessário, para referência do admin
    // Isso é útil mas não obrigatório porque temos o Supabase Realtime escutando pelo ID.
    // Atualizaremos opcionalmente a tabela raffle_orders se houver coluna para isso ou apenas retornamos ao front.
    // Como a tabela pode não ter uma coluna específica para a URL da InfinitePay, apenas retornamos para o frontend.
    
    return new Response(JSON.stringify({ 
      success: true, 
      url: checkoutUrl,
      order_id: order_id
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    console.error(`[InfinitePay Exception]`, err)
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500
    })
  }
})

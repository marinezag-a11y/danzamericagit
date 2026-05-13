
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://cybakgeofynizvtaqlph.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YmFrZ2VvZnluaXp2dGFxbHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODI1OTQsImV4cCI6MjA5MzA1ODU5NH0.hScq4tn1YtrRF6wtaKhJ4H3CjLRhC4acpQ0WhirMfEg'

// Usaremos a própria função de SQL do MCP para pegar os dados e o script para disparar
// Para o script funcionar, vou passar os dados via arquivo JSON

async function processFile(filePath) {
  const content = await Deno.readTextFile(filePath);
  const orders = JSON.parse(content);
  
  console.log(`--- Iniciando Processamento de ${orders.length} pedidos ---`);
  
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    console.log(`[${i+1}/${orders.length}] Enviando para: ${order.customer_name}...`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`
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
      });

      const result = await response.json();
      console.log(`   Status: ${result.success ? '✅ SUCESSO' : '❌ FALHA'} (${result.provider})`);
      
      // Pequena pausa para não sobrecarregar
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`   Erro grave no pedido ${order.id}:`, err.message);
    }
  }
  
  console.log('--- Limpeza concluída! ---');
}

if (Deno.args.length > 0) {
  processFile(Deno.args[0]);
} else {
  console.error('Por favor, passe o caminho do arquivo JSON.');
}

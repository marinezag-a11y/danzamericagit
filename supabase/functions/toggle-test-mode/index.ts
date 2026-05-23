import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { campaign_id, is_test_mode } = await req.json()

    if (!campaign_id || typeof is_test_mode !== 'boolean') {
      return new Response(JSON.stringify({ error: 'campaign_id and is_test_mode are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Verify caller is an authenticated admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Check if user is an admin
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('permissions')
      .eq('id', (await userClient.auth.getUser()).data.user?.id || '')
      .single()

    if (profileError || !profile?.permissions?.length) {
      return new Response(JSON.stringify({ error: 'Forbidden — not an admin' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      })
    }

    // Use service role to bypass RLS
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const { data, error } = await serviceClient
      .from('raffle_campaigns')
      .update({ is_test_mode })
      .eq('id', campaign_id)
      .select('id, name, is_test_mode')
      .single()

    if (error) throw error

    console.log(`[TestMode] Campaign ${campaign_id} -> is_test_mode = ${is_test_mode}`)

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[TestMode] Error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

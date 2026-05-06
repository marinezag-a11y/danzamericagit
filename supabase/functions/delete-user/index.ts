import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader?.replace('Bearer ', ''))
    
    if (authError || !user) throw new Error('Não autorizado.')

    const { data: callerProfile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'master') {
      throw new Error('Apenas usuários Master podem excluir outros administradores.')
    }

    const { userId } = await req.json()

    if (!userId) throw new Error('User ID is required')

    // Delete user from Auth
    const { error } = await supabaseClient.auth.admin.deleteUser(userId)

    if (error) throw error

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

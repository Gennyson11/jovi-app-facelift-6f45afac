import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting cleanup of expired accounts...')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const now = new Date().toISOString()

    // Find expired accounts that still have access
    const { data: expiredProfiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, email, name, access_expires_at')
      .eq('has_access', true)
      .not('access_expires_at', 'is', null)
      .lt('access_expires_at', now)

    if (fetchError) {
      console.error('Error fetching expired profiles:', fetchError)
      throw fetchError
    }

    if (!expiredProfiles || expiredProfiles.length === 0) {
      console.log('No expired accounts found.')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired accounts found',
          blocked_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${expiredProfiles.length} expired accounts to block`)

    const blockedAccounts: string[] = []
    const errors: string[] = []

    for (const profile of expiredProfiles) {
      try {
        console.log(`Blocking expired user: ${profile.email} (expired at: ${profile.access_expires_at})`)

        // 1. Remove platform access
        await supabaseAdmin.from('user_platform_access').delete().eq('user_id', profile.id)

        // 2. Revoke access (block the account)
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            has_access: false,
            updated_at: now
          })
          .eq('id', profile.id)

        if (updateError) {
          console.error(`Error blocking profile for ${profile.email}:`, updateError)
          errors.push(`${profile.email}: ${updateError.message}`)
          continue
        }

        console.log(`Successfully blocked user: ${profile.email}`)
        blockedAccounts.push(profile.email)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Exception blocking ${profile.email}:`, err)
        errors.push(`${profile.email}: ${errorMessage}`)
      }
    }

    const result = {
      success: true,
      message: `Cleanup completed. Blocked ${blockedAccounts.length} expired accounts.`,
      blocked_count: blockedAccounts.length,
      blocked_emails: blockedAccounts,
      errors: errors.length > 0 ? errors : undefined
    }

    console.log('Cleanup result:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Cleanup function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

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

    // Find expired accounts
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
          deleted_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${expiredProfiles.length} expired accounts to delete`)

    const deletedAccounts: string[] = []
    const errors: string[] = []

    for (const profile of expiredProfiles) {
      try {
        console.log(`Deleting expired user: ${profile.email} (expired at: ${profile.access_expires_at})`)

        // 1. Delete user_platform_access
        await supabaseAdmin
          .from('user_platform_access')
          .delete()
          .eq('user_id', profile.id)

        // 2. Delete user_coins
        await supabaseAdmin
          .from('user_coins')
          .delete()
          .eq('user_id', profile.user_id)

        // 3. Delete user_roles
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', profile.user_id)

        // 4. Delete profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', profile.id)

        if (profileError) {
          console.error(`Error deleting profile for ${profile.email}:`, profileError)
          errors.push(`${profile.email}: ${profileError.message}`)
          continue
        }

        // 5. Delete from auth.users
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(profile.user_id)

        if (authError) {
          console.error(`Error deleting auth user for ${profile.email}:`, authError)
          errors.push(`${profile.email}: auth deletion failed - ${authError.message}`)
        } else {
          console.log(`Successfully deleted user: ${profile.email}`)
          deletedAccounts.push(profile.email)
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Exception deleting ${profile.email}:`, err)
        errors.push(`${profile.email}: ${errorMessage}`)
      }
    }

    const result = {
      success: true,
      message: `Cleanup completed. Deleted ${deletedAccounts.length} expired accounts.`,
      deleted_count: deletedAccounts.length,
      deleted_emails: deletedAccounts,
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

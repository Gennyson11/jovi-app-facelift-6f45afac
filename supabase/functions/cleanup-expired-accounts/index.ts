import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting cleanup of expired accounts...')

    // Create Supabase client with service role for admin operations
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

    // Find all profiles with expired access
    const now = new Date().toISOString()
    const { data: expiredProfiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, email, name, access_expires_at')
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

    // Delete each expired user from auth (this will cascade delete the profile)
    for (const profile of expiredProfiles) {
      try {
        console.log(`Deleting user: ${profile.email} (expired at: ${profile.access_expires_at})`)
        
        // Delete the user from auth.users - this will cascade to profiles due to foreign key
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
          profile.user_id
        )

        if (deleteError) {
          console.error(`Error deleting user ${profile.email}:`, deleteError)
          errors.push(`${profile.email}: ${deleteError.message}`)
        } else {
          console.log(`Successfully deleted user: ${profile.email}`)
          deletedAccounts.push(profile.email)
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Exception deleting user ${profile.email}:`, err)
        errors.push(`${profile.email}: ${errorMessage}`)
      }
    }

    const result = {
      success: true,
      message: `Cleanup completed. Deleted ${deletedAccounts.length} accounts.`,
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

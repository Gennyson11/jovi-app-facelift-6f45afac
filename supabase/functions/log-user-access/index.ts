import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create client with user's token to get user info
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the user from the token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Logging access for user:', user.id, user.email);

    // Get IP from request headers (Cloudflare/proxy headers first, then fallback)
    const ip = req.headers.get('cf-connecting-ip') || 
               req.headers.get('x-real-ip') || 
               req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               'unknown';

    console.log('Detected IP:', ip);

    // Get geolocation data from IP
    let city = null;
    let region = null;
    let country = null;

    if (ip && ip !== 'unknown' && ip !== '127.0.0.1' && ip !== '::1') {
      try {
        // Using ip-api.com (free, no API key required, 45 requests/minute)
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country`);
        const geoData = await geoResponse.json();
        
        console.log('Geolocation response:', geoData);
        
        if (geoData.status === 'success') {
          city = geoData.city;
          region = geoData.regionName;
          country = geoData.country;
        }
      } catch (geoError) {
        console.error('Error fetching geolocation:', geoError);
        // Continue without geolocation data
      }
    }

    // Insert access log using service role (bypasses RLS)
    const { error: insertError } = await supabaseAdmin
      .from('user_access_logs')
      .insert({
        user_id: user.id,
        ip_address: ip,
        city,
        region,
        country
      });

    if (insertError) {
      console.error('Error inserting access log:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to log access', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Access logged successfully for user:', user.email, 'IP:', ip, 'City:', city);

    return new Response(
      JSON.stringify({ 
        success: true,
        ip,
        city,
        region,
        country
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

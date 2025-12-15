import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { uuid } = await req.json();

    if (!uuid) {
      return new Response(
        JSON.stringify({ error: 'UUID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINIGEN_API_KEY = Deno.env.get('GEMINIGEN_API_KEY');
    if (!GEMINIGEN_API_KEY) {
      console.error('GEMINIGEN_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking video status for UUID: ${uuid}`);

    // Call GeminiGen History API to check status
    const response = await fetch(`https://api.geminigen.ai/uapi/v1/history/${uuid}`, {
      method: 'GET',
      headers: {
        'x-api-key': GEMINIGEN_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GeminiGen History API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to check video status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Video status response:', JSON.stringify(data));

    // Status: 1 = processing, 2 = completed, 3 = failed
    let statusMessage = 'Processando...';
    if (data.status === 2) {
      statusMessage = 'Vídeo gerado com sucesso!';
    } else if (data.status === 3) {
      statusMessage = `Erro: ${data.error_message || 'Falha na geração do vídeo'}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        uuid: data.uuid,
        status: data.status,
        statusPercentage: data.status_percentage,
        statusMessage,
        videoUrl: data.output_url || data.result_url || null,
        errorMessage: data.error_message || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-video-status function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

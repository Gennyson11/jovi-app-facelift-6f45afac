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
    const { prompt, aspectRatio } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
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

    console.log(`Generating video with prompt: ${prompt}, aspect ratio: ${aspectRatio}`);

    // Create form data for the API request - following exact documentation format
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', 'veo-2');
    formData.append('resolution', '720p');
    formData.append('aspect_ratio', aspectRatio || '16:9');

    // Call GeminiGen API
    const response = await fetch('https://api.geminigen.ai/uapi/v1/video-gen/veo', {
      method: 'POST',
      headers: {
        'x-api-key': GEMINIGEN_API_KEY,
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log('GeminiGen API response status:', response.status);
    console.log('GeminiGen API response:', responseText);

    if (!response.ok) {
      console.error('GeminiGen API error:', response.status, responseText);
      
      // Parse error response
      let errorMessage = 'Falha ao gerar vídeo';
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.detail?.error_code === 'PREMIUM_PLAN_REQUIRED') {
          errorMessage = 'Plano Premium necessário. A API GeminiGen requer um plano premium para gerar vídeos.';
        } else if (errorData.detail?.error_message) {
          errorMessage = errorData.detail.error_message;
        }
      } catch {
        // Keep default error message
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos para continuar.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = JSON.parse(responseText);
    console.log('Video generation response:', JSON.stringify(data));

    return new Response(
      JSON.stringify({
        success: true,
        uuid: data.uuid,
        status: data.status,
        message: 'Vídeo sendo gerado! Aguarde...',
        estimatedCredit: data.estimated_credit,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-video function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

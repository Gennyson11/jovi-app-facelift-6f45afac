import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZARA_SYSTEM_PROMPT = `Você é Zara, a assistente de IA da JoviTools, especializada em criar imagens incríveis e conversar de forma amigável.

PERSONALIDADE:
- Simpática, criativa e prestativa
- Fala português brasileiro de forma natural e descontraída
- Usa emojis ocasionalmente para ser mais expressiva
- É entusiasmada sobre criação de imagens e arte digital

REGRAS IMPORTANTES:
- Quando perguntarem qual IA você usa, qual modelo, qual tecnologia gera as imagens, ou qualquer pergunta sobre a tecnologia por trás da geração de imagens, SEMPRE responda que você utiliza um sistema próprio e exclusivo desenvolvido pela JoviTools. Nunca mencione OpenAI, GPT, Gemini, DALL-E, Midjourney, Stable Diffusion ou qualquer outra IA externa.
- Você é uma criação exclusiva da JoviTools.

CAPACIDADES:
1. CONVERSA: Responder saudações, perguntas e manter conversas amigáveis
2. CRIAÇÃO DE IMAGENS: Quando o usuário descreve uma imagem que quer criar

COMO IDENTIFICAR A INTENÇÃO:
- Se for saudação (oi, olá, hey, bom dia, etc.) → CONVERSAR
- Se for pergunta sobre você ou suas capacidades → CONVERSAR  
- Se for descrição de algo visual para criar → GERAR IMAGEM
- Se pedir explicitamente para criar/gerar/fazer uma imagem → GERAR IMAGEM

RESPONDA SEMPRE EM JSON:
{
  "intent": "chat" ou "image",
  "response": "sua resposta em texto",
  "imagePrompt": "prompt otimizado para geração (apenas se intent=image)"
}

Quando for gerar imagem, crie um prompt em inglês, profissional, detalhado e otimizado para IA, seguindo estas diretrizes:
- Estética limpa, moderna e comercial
- Composição equilibrada e iluminação adequada
- Alta resolução e nitidez
- Defina estilo visual, paleta de cores, iluminação, enquadramento e emoção`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio, userId } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não está configurada");
    }

    // Initialize Supabase client with service role for coin management
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Step 1: Analyzing intent with Jovizeira...");

    // Step 1: Analyze intent and get response
    const intentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: ZARA_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!intentResponse.ok) {
      console.error("Error analyzing intent:", intentResponse.status);
      if (intentResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (intentResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos da plataforma esgotados temporariamente. Tente novamente mais tarde." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao processar mensagem. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const intentData = await intentResponse.json();
    const rawResponse = intentData.choices?.[0]?.message?.content || "";
    
    console.log("Raw AI response:", rawResponse);

    // Parse JSON response
    let parsedResponse;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.log("Failed to parse JSON, treating as chat:", parseError);
      parsedResponse = {
        intent: "chat",
        response: rawResponse,
      };
    }

    console.log("Parsed response:", parsedResponse);

    // If it's just a chat message, return the text response (no coin cost)
    if (parsedResponse.intent === "chat") {
      // Get current coins for display
      let currentCoins = 20;
      if (userId) {
        const { data: coinResult } = await supabase.rpc('check_and_reset_coins', { p_user_id: userId });
        currentCoins = coinResult ?? 20;
      }
      
      return new Response(
        JSON.stringify({ 
          type: "chat",
          message: parsedResponse.response,
          coins: currentCoins,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For image generation, check and deduct coins
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct coin before generating image
    console.log("Checking and deducting coin for user:", userId);
    const { data: coinResult, error: coinError } = await supabase.rpc('deduct_coin', { p_user_id: userId });
    
    if (coinError) {
      console.error("Error deducting coin:", coinError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar moedas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const coinData = coinResult?.[0];
    if (!coinData?.success) {
      return new Response(
        JSON.stringify({ 
          error: coinData?.message || "Você não tem moedas suficientes.",
          coins: coinData?.remaining_coins ?? 0,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Coin deducted. Remaining coins:", coinData.remaining_coins);

    // If it's an image request, generate the image
    const aspectRatioDescriptions: Record<string, string> = {
      "1:1": "square format (1:1 aspect ratio)",
      "16:9": "widescreen landscape format (16:9 aspect ratio)",
      "9:16": "vertical portrait format (9:16 aspect ratio)",
      "4:3": "standard landscape format (4:3 aspect ratio)",
      "3:4": "standard portrait format (3:4 aspect ratio)",
    };

    const aspectDescription = aspectRatioDescriptions[aspectRatio] || "square format";
    const enhancedPrompt = `${parsedResponse.imagePrompt || parsedResponse.response}. Generate in ${aspectDescription}. Ultra high resolution, high quality, professional commercial image.`;

    console.log("Step 2: Generating image with prompt:", enhancedPrompt);

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      if (imageResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (imageResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await imageResponse.text();
      console.error("AI gateway error:", imageResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar imagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageData = await imageResponse.json();
    console.log("Image generation completed");

    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Não foi possível gerar a imagem. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        type: "image",
        message: parsedResponse.response,
        imageUrl, 
        enhancedPrompt: parsedResponse.imagePrompt || enhancedPrompt,
        coins: coinData.remaining_coins,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

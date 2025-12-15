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

RESPONDA SEMPRE EM JSON válido (sem markdown):
{"intent": "chat" ou "image", "response": "sua resposta em texto", "imagePrompt": "prompt otimizado em inglês para geração (apenas se intent=image)"}

Quando for gerar imagem, crie um prompt em inglês, profissional, detalhado e otimizado para IA.`;

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

    // Initialize Supabase client with service role for coin management
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Step 1: Analyzing intent with Pollinations Text API...");

    // Step 1: Analyze intent using Pollinations Text API
    const systemPromptEncoded = encodeURIComponent(ZARA_SYSTEM_PROMPT);
    const userPromptEncoded = encodeURIComponent(prompt);
    const intentUrl = `https://text.pollinations.ai/${userPromptEncoded}?model=openai&json=true&system=${systemPromptEncoded}`;

    const intentResponse = await fetch(intentUrl, {
      method: "GET",
    });

    if (!intentResponse.ok) {
      console.error("Error analyzing intent:", intentResponse.status);
      return new Response(
        JSON.stringify({ error: "Erro ao processar mensagem. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawResponse = await intentResponse.text();
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

    // If it's an image request, generate the image using Pollinations API
    const aspectRatioDimensions: Record<string, { width: number; height: number }> = {
      "1:1": { width: 1024, height: 1024 },
      "16:9": { width: 1280, height: 720 },
      "9:16": { width: 720, height: 1280 },
      "4:3": { width: 1024, height: 768 },
      "3:4": { width: 768, height: 1024 },
    };

    const dimensions = aspectRatioDimensions[aspectRatio] || { width: 1024, height: 1024 };
    const imagePrompt = parsedResponse.imagePrompt || parsedResponse.response;
    
    // Truncate prompt if too long (max 500 chars to avoid URL issues)
    const truncatedPrompt = imagePrompt.length > 500 ? imagePrompt.substring(0, 500) : imagePrompt;

    console.log("Step 2: Generating image with Pollinations API:", truncatedPrompt);

    // Build Pollinations URL with simpler parameters
    const encodedPrompt = encodeURIComponent(truncatedPrompt);
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&model=flux&nologo=true`;

    console.log("Pollinations URL:", pollinationsUrl);

    // Fetch image from Pollinations with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout
    
    let imageResponse;
    try {
      imageResponse = await fetch(pollinationsUrl, {
        method: "GET",
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Tempo limite excedido. Tente novamente." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timeoutId);

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text().catch(() => "");
      console.error("Pollinations API error:", imageResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar imagem. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert image to base64 using Uint8Array directly
    const imageBuffer = await imageResponse.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Image = btoa(binary);
    const imageUrl = `data:image/png;base64,${base64Image}`;

    console.log("Image generation completed with Pollinations");

    return new Response(
      JSON.stringify({ 
        type: "image",
        message: parsedResponse.response,
        imageUrl, 
        enhancedPrompt: imagePrompt,
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

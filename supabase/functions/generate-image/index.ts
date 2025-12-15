import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple intent detection based on keywords
function detectIntent(prompt: string): { intent: 'chat' | 'image', response: string } {
  const lowerPrompt = prompt.toLowerCase().trim();
  
  // Chat keywords (greetings, questions about the bot)
  const chatPatterns = [
    /^(oi|olá|ola|hey|hi|hello|e aí|eai|opa|salve|bom dia|boa tarde|boa noite)/,
    /^(quem é você|quem e voce|o que você faz|o que voce faz|como você funciona|como voce funciona)/,
    /^(me ajuda|ajuda|help|socorro)/,
    /^(obrigad|valeu|thanks|vlw)/,
    /^(tchau|bye|até|ate logo|falou)/,
    /\?$/, // Questions ending with ?
  ];
  
  // Image generation keywords
  const imagePatterns = [
    /(crie|criar|gere|gerar|faça|faca|fazer|desenhe|desenhar|ilustre|ilustrar)/,
    /(uma imagem|um desenho|uma ilustração|uma foto|uma arte|um retrato)/,
    /(imagem de|foto de|desenho de|ilustração de)/,
    /(paisagem|cenário|cena|personagem|pessoa|animal|objeto)/,
  ];
  
  // Check if it's clearly a chat message
  for (const pattern of chatPatterns) {
    if (pattern.test(lowerPrompt) && !imagePatterns.some(p => p.test(lowerPrompt))) {
      return {
        intent: 'chat',
        response: getChatResponse(lowerPrompt)
      };
    }
  }
  
  // Default to image generation for descriptive prompts
  return {
    intent: 'image',
    response: '✨ Gerando sua imagem...'
  };
}

function getChatResponse(prompt: string): string {
  if (/^(oi|olá|ola|hey|hi|hello|e aí|eai|opa|salve)/.test(prompt)) {
    return 'Olá! 👋 Sou a Zara, sua assistente de criação de imagens. Me diga o que você gostaria de criar hoje!';
  }
  if (/bom dia/.test(prompt)) {
    return 'Bom dia! ☀️ Pronta para criar imagens incríveis para você. O que vamos fazer hoje?';
  }
  if (/boa tarde/.test(prompt)) {
    return 'Boa tarde! 🌤️ Como posso ajudar você a criar algo incrível?';
  }
  if (/boa noite/.test(prompt)) {
    return 'Boa noite! 🌙 Vamos criar algo especial juntos?';
  }
  if (/quem é você|quem e voce|o que você faz|o que voce faz/.test(prompt)) {
    return 'Sou a Zara, a assistente de IA da JoviTools! 🎨 Minha especialidade é criar imagens incríveis a partir das suas descrições. Basta me dizer o que você imagina e eu transformo em realidade!';
  }
  if (/como você funciona|como voce funciona/.test(prompt)) {
    return 'É simples! Você me descreve a imagem que quer criar e eu uso um sistema exclusivo da JoviTools para gerar. Quanto mais detalhes você der, melhor fica o resultado! 🚀';
  }
  if (/obrigad|valeu|thanks|vlw/.test(prompt)) {
    return 'Por nada! 😊 Fico feliz em ajudar. Se precisar de mais imagens, é só pedir!';
  }
  if (/tchau|bye|até|ate logo|falou/.test(prompt)) {
    return 'Até mais! 👋 Volte sempre que precisar criar algo novo!';
  }
  return 'Olá! Descreva a imagem que você gostaria de criar e eu vou gerá-la para você! 🎨';
}

// Create an optimized English prompt for image generation
function createImagePrompt(userPrompt: string): string {
  // If already in English or contains English, use as is with enhancements
  const isEnglish = /^[a-zA-Z\s\d,.\-!?'"]+$/.test(userPrompt);
  
  if (isEnglish) {
    return `${userPrompt}, high quality, detailed, professional`;
  }
  
  // For Portuguese, add quality enhancers
  return `${userPrompt}, high quality, detailed, professional, ultra HD`;
}

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

    // Step 1: Detect intent locally (no external API needed)
    console.log("Analyzing intent for:", prompt);
    const { intent, response } = detectIntent(prompt);
    console.log("Detected intent:", intent);

    // If it's just a chat message, return the text response (no coin cost)
    if (intent === "chat") {
      // Get current coins for display
      let currentCoins = 20;
      if (userId) {
        const { data: coinResult } = await supabase.rpc('check_and_reset_coins', { p_user_id: userId });
        currentCoins = coinResult ?? 20;
      }
      
      return new Response(
        JSON.stringify({ 
          type: "chat",
          message: response,
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

    // Generate image using Pollinations API
    const aspectRatioDimensions: Record<string, { width: number; height: number }> = {
      "1:1": { width: 1024, height: 1024 },
      "16:9": { width: 1280, height: 720 },
      "9:16": { width: 720, height: 1280 },
      "4:3": { width: 1024, height: 768 },
      "3:4": { width: 768, height: 1024 },
    };

    const dimensions = aspectRatioDimensions[aspectRatio] || { width: 1024, height: 1024 };
    const imagePrompt = createImagePrompt(prompt);
    
    // Truncate prompt if too long (max 400 chars to avoid URL issues)
    const truncatedPrompt = imagePrompt.length > 400 ? imagePrompt.substring(0, 400) : imagePrompt;

    console.log("Generating image with prompt:", truncatedPrompt);

    // Build Pollinations URL
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

    // Convert image to base64
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

    console.log("Image generation completed");

    return new Response(
      JSON.stringify({ 
        type: "image",
        message: "✨ Aqui está sua imagem!",
        imageUrl, 
        enhancedPrompt: truncatedPrompt,
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

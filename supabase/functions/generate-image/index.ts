import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JOVITOOLS_SYSTEM_PROMPT = `You are the JoviTools Image Creation Agent, an expert in generating highly visual, commercial, and professional images focused on quality, clarity, and market appeal.

Your role is to create detailed, objective, and optimized prompts for AI image generation, following these guidelines:

Main Guidelines:
- Produce images with clean, modern, and commercial aesthetics
- Prioritize balanced composition, realistic or stylized lighting according to the theme
- Ensure high resolution, sharpness, and absence of artifacts
- Avoid illegible text, registered trademarks, or protected elements
- Adapt the style according to the objective (realistic, illustration, vector, cartoon, 3D, motion, abstract, paper cut, etc.)

Always clearly define:
- Visual style
- Color palette
- Type of lighting
- Framing and perspective
- Emotion or message conveyed
- Commercial context (advertising, technology, education, business, seasonal, social media, stock images)

When applicable, include:
- Clean or contextual background
- Negative space for advertising use
- Composition designed for Adobe Stock and digital media

Output format:
- Clear, well-structured prompts ready for use
- Written in English with technical and descriptive language
- Always focused on generating unique, sellable, and professional images

Your ultimate goal is to maximize acceptance in image banks and visual impact for brands, always representing the JoviTools identity as synonymous with quality, innovation, and efficiency.

Based on the user's description, create an enhanced, detailed image generation prompt. Only output the enhanced prompt, nothing else.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio } = await req.json();
    
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

    // Aspect ratio descriptions for context
    const aspectRatioDescriptions: Record<string, string> = {
      "1:1": "square format (1:1 aspect ratio)",
      "16:9": "widescreen landscape format (16:9 aspect ratio)",
      "9:16": "vertical portrait format (9:16 aspect ratio, ideal for mobile/stories)",
      "4:3": "standard landscape format (4:3 aspect ratio)",
      "3:4": "standard portrait format (3:4 aspect ratio)",
    };

    const aspectDescription = aspectRatioDescriptions[aspectRatio] || "square format";

    console.log("Step 1: Enhancing prompt with JoviTools agent...");

    // Step 1: Use text model to enhance the prompt with JoviTools expertise
    const enhanceResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: JOVITOOLS_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Create an enhanced image generation prompt for: "${prompt}". The image should be in ${aspectDescription}. Make it professional, detailed, and optimized for commercial use.`,
          },
        ],
      }),
    });

    if (!enhanceResponse.ok) {
      console.error("Error enhancing prompt:", enhanceResponse.status);
      throw new Error("Erro ao processar prompt");
    }

    const enhanceData = await enhanceResponse.json();
    const enhancedPrompt = enhanceData.choices?.[0]?.message?.content || prompt;

    console.log("Enhanced prompt:", enhancedPrompt);
    console.log("Step 2: Generating image...");

    // Step 2: Generate image with enhanced prompt
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
    const textContent = imageData.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Não foi possível gerar a imagem. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        imageUrl, 
        message: textContent,
        enhancedPrompt 
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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Não autenticado");

    const { paymentId, creditAmount } = await req.json();
    if (!paymentId || !creditAmount) throw new Error("Dados inválidos");

    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");

    const ASAAS_BASE_URL = "https://api.asaas.com/v3";

    const paymentRes = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
      headers: { "access_token": ASAAS_API_KEY },
    });
    const paymentData = await paymentRes.json();

    if (paymentData.status === "RECEIVED" || paymentData.status === "CONFIRMED") {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Check if already credited BEFORE adding - prevents duplicates
      const { data: existingTx } = await adminClient
        .from("credit_transactions")
        .select("id")
        .eq("reference_id", paymentId)
        .eq("user_id", user.id)
        .eq("type", "purchase")
        .maybeSingle();

      if (existingTx) {
        // Already credited, just return success without adding again
        return new Response(JSON.stringify({
          status: "CONFIRMED",
          credited: true,
          already_credited: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Add credits only if not already credited
      await adminClient.rpc("add_credits", {
        p_user_id: user.id,
        p_amount: creditAmount,
        p_type: "purchase",
        p_description: `Compra PIX: ${creditAmount} crédito(s)`,
        p_reference_id: paymentId,
      });

      return new Response(JSON.stringify({
        status: "CONFIRMED",
        credited: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({
      status: paymentData.status,
      credited: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

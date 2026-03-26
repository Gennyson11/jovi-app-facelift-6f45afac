import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Asaas webhook received:", JSON.stringify(body));

    const event = body.event;
    const payment = body.payment;

    if (!payment || !payment.id) {
      console.log("No payment data in webhook");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Only process confirmed/received payments
    if (event !== "PAYMENT_CONFIRMED" && event !== "PAYMENT_RECEIVED") {
      console.log(`Ignoring event: ${event}`);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const paymentId = payment.id;
    const description = payment.description || "";

    // Extract credit amount from description: "Compra de X crédito(s) - JoviTools"
    const creditMatch = description.match(/Compra de (\d+) crédito/);
    const creditAmount = creditMatch ? parseInt(creditMatch[1]) : null;

    if (!creditAmount) {
      console.log(`Could not extract credit amount from description: ${description}`);
      return new Response(JSON.stringify({ received: true, error: "Could not extract credit amount" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Find the customer email from Asaas
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      console.error("ASAAS_API_KEY not configured");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const customerRes = await fetch(`https://api.asaas.com/v3/customers/${payment.customer}`, {
      headers: { "access_token": ASAAS_API_KEY },
    });
    const customerData = await customerRes.json();
    const customerEmail = customerData.email;

    if (!customerEmail) {
      console.error("Could not find customer email for:", payment.customer);
      return new Response(JSON.stringify({ received: true, error: "Customer email not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Payment ${paymentId} confirmed for ${customerEmail}, ${creditAmount} credits`);

    // Find user by email
    const { data: profile } = await adminClient
      .from("profiles")
      .select("user_id")
      .eq("email", customerEmail)
      .maybeSingle();

    if (!profile) {
      console.error(`Profile not found for email: ${customerEmail}`);
      return new Response(JSON.stringify({ received: true, error: "Profile not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if already credited (idempotency)
    const { data: existingTx } = await adminClient
      .from("credit_transactions")
      .select("id")
      .eq("reference_id", paymentId)
      .eq("user_id", profile.user_id)
      .maybeSingle();

    if (existingTx) {
      console.log(`Payment ${paymentId} already credited for user ${profile.user_id}`);
      return new Response(JSON.stringify({ received: true, already_credited: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Add credits
    const { data: newBalance, error: creditError } = await adminClient.rpc("add_credits", {
      p_user_id: profile.user_id,
      p_amount: creditAmount,
      p_type: "purchase",
      p_description: `Compra PIX: ${creditAmount} crédito(s)`,
      p_reference_id: paymentId,
    });

    if (creditError) {
      console.error("Error adding credits:", creditError);
      return new Response(JSON.stringify({ error: creditError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log(`Successfully credited ${creditAmount} credits to ${customerEmail}. New balance: ${newBalance}`);

    return new Response(JSON.stringify({ 
      received: true, 
      credited: true, 
      amount: creditAmount,
      new_balance: newBalance,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

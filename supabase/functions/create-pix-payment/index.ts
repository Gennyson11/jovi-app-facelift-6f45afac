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

    const { amount, price, cpfCnpj } = await req.json();
    if (!amount || !price || !cpfCnpj) throw new Error("Dados inválidos. CPF/CNPJ é obrigatório.");

    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");

    const ASAAS_BASE_URL = "https://api.asaas.com/v3";

    // Check/create customer in Asaas
    const customerSearchRes = await fetch(`${ASAAS_BASE_URL}/customers?email=${encodeURIComponent(user.email!)}`, {
      headers: { "access_token": ASAAS_API_KEY },
    });
    const customerSearchData = await customerSearchRes.json();

    let customerId: string;
    if (customerSearchData.data && customerSearchData.data.length > 0) {
      customerId = customerSearchData.data[0].id;
    } else {
      // Create customer
      const createCustomerRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: "POST",
        headers: {
          "access_token": ASAAS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: user.email!.split("@")[0],
          email: user.email,
        }),
      });
      const customerData = await createCustomerRes.json();
      if (customerData.errors) {
        throw new Error(`Erro ao criar cliente: ${JSON.stringify(customerData.errors)}`);
      }
      customerId = customerData.id;
    }

    // Create PIX payment
    const paymentRes = await fetch(`${ASAAS_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "access_token": ASAAS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX",
        value: price,
        description: `Compra de ${amount} crédito(s) - JoviTools`,
        dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString().split("T")[0],
      }),
    });
    const paymentData = await paymentRes.json();
    if (paymentData.errors) {
      throw new Error(`Erro ao criar pagamento: ${JSON.stringify(paymentData.errors)}`);
    }

    // Get PIX QR code
    const pixRes = await fetch(`${ASAAS_BASE_URL}/payments/${paymentData.id}/pixQrCode`, {
      headers: { "access_token": ASAAS_API_KEY },
    });
    const pixData = await pixRes.json();

    return new Response(JSON.stringify({
      paymentId: paymentData.id,
      status: paymentData.status,
      pixCode: pixData.payload,
      qrCodeImage: pixData.encodedImage,
      value: paymentData.value,
      creditAmount: amount,
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

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CAKTO-WEBHOOK] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const body = await req.json();
    const { secret, event, data } = body;

    // Validate webhook secret
    const expectedSecret = Deno.env.get("CAKTO_WEBHOOK_SECRET");
    if (!expectedSecret || secret !== expectedSecret) {
      logStep("Invalid webhook secret");
      return new Response(JSON.stringify({ error: "Invalid secret" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    logStep("Event received", { event, orderId: data?.id });

    const customerEmail = data?.customer?.email?.toLowerCase()?.trim();
    if (!customerEmail) {
      logStep("No customer email in webhook data");
      return new Response(JSON.stringify({ error: "No customer email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Customer email", { email: customerEmail });

    // Find the user profile by email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, email, has_access, access_expires_at")
      .ilike("email", customerEmail)
      .maybeSingle();

    if (profileError) {
      logStep("Error finding profile", { error: profileError.message });
      return new Response(JSON.stringify({ error: "Database error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!profile) {
      logStep("No profile found for email", { email: customerEmail });
      return new Response(JSON.stringify({ success: true, message: "No profile found, skipping" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Profile found", { profileId: profile.id, userId: profile.user_id });

    // Handle different events
    switch (event) {
      case "purchase_approved": {
        // Determine access duration based on subscription or product type
        let accessDays = 30; // default monthly

        // Check if it's a subscription
        if (data?.subscription) {
          const recurrencePeriod = data.subscription.recurrence_period;
          // recurrence_period is in days in Cakto
          if (recurrencePeriod) {
            accessDays = recurrencePeriod;
          }
        }

        // Calculate new expiration: extend from current expiry if still active, or from now
        const now = new Date();
        let baseDate = now;
        if (profile.has_access && profile.access_expires_at) {
          const currentExpiry = new Date(profile.access_expires_at);
          if (currentExpiry > now) {
            baseDate = currentExpiry; // Extend from current expiry
          }
        }
        const newExpiry = new Date(baseDate.getTime() + accessDays * 24 * 60 * 60 * 1000);

        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            has_access: true,
            access_expires_at: newExpiry.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", profile.id);

        if (updateError) {
          logStep("Error updating profile", { error: updateError.message });
          return new Response(JSON.stringify({ error: "Failed to update profile" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }

        // Grant access to all platforms
        const { data: allPlatforms } = await supabaseAdmin
          .from("streaming_platforms")
          .select("id");

        if (allPlatforms && allPlatforms.length > 0) {
          const accessRecords = allPlatforms.map((p) => ({
            user_id: profile.id,
            platform_id: p.id,
          }));

          await supabaseAdmin
            .from("user_platform_access")
            .upsert(accessRecords, { onConflict: "user_id,platform_id", ignoreDuplicates: true });
        }

        logStep("Access granted", { email: customerEmail, accessDays, expiresAt: newExpiry.toISOString() });
        break;
      }

      case "subscription_renewed": {
        // Renew access - extend expiration
        let accessDays = 30;
        if (data?.subscription?.recurrence_period) {
          accessDays = data.subscription.recurrence_period;
        }

        const now = new Date();
        let baseDate = now;
        if (profile.has_access && profile.access_expires_at) {
          const currentExpiry = new Date(profile.access_expires_at);
          if (currentExpiry > now) {
            baseDate = currentExpiry;
          }
        }
        const newExpiry = new Date(baseDate.getTime() + accessDays * 24 * 60 * 60 * 1000);

        await supabaseAdmin
          .from("profiles")
          .update({
            has_access: true,
            access_expires_at: newExpiry.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", profile.id);

        logStep("Subscription renewed", { email: customerEmail, accessDays, expiresAt: newExpiry.toISOString() });
        break;
      }

      case "subscription_canceled": {
        // Don't remove access immediately - let it expire naturally
        logStep("Subscription canceled", { email: customerEmail, currentExpiry: profile.access_expires_at });
        break;
      }

      case "refund": {
        // Revoke access immediately
        await supabaseAdmin
          .from("profiles")
          .update({
            has_access: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        logStep("Access revoked due to refund", { email: customerEmail });
        break;
      }

      case "chargeback": {
        // Revoke access and block
        await supabaseAdmin
          .from("profiles")
          .update({
            has_access: false,
            block_reason: "Chargeback detectado - acesso bloqueado automaticamente",
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        logStep("Access blocked due to chargeback", { email: customerEmail });
        break;
      }

      default: {
        logStep("Unhandled event", { event });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

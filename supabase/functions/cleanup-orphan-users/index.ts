import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { 
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { data: { user: callerUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin verified:", callerUser.email);

    const body = await req.json().catch(() => ({}));
    const { action, emails } = body;

    if (action === "delete_by_emails" && emails && Array.isArray(emails)) {
      console.log("Deleting users by emails:", emails);
      
      const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) throw listError;

      let deletedCount = 0;
      const deletedEmails: string[] = [];
      const errors: string[] = [];

      for (const email of emails) {
        const user = authUsers?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (user) {
          try {
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            if (deleteError) {
              console.error(`Error deleting ${email}:`, deleteError);
              errors.push(`${email}: ${deleteError.message}`);
            } else {
              console.log(`Deleted user: ${email}`);
              deletedEmails.push(email);
              deletedCount++;
            }
          } catch (err) {
            errors.push(`${email}: ${err}`);
          }
        } else {
          console.log(`User not found in auth: ${email}`);
          errors.push(`${email}: User not found in auth`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, deletedCount, deletedEmails, errors: errors.length > 0 ? errors : undefined }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "list_auth_users") {
      const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) throw listError;

      const userList = authUsers?.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })) || [];

      return new Response(
        JSON.stringify({ success: true, users: userList, count: userList.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_orphans") {
      console.log("Finding and deleting orphan auth users...");
      
      const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      const { data: profiles } = await supabaseAdmin.from("profiles").select("user_id");
      const profileUserIds = new Set(profiles?.map(p => p.user_id) || []);
      
      const orphanUsers = authUsers?.filter(u => !profileUserIds.has(u.id)) || [];
      
      console.log(`Found ${orphanUsers.length} orphan users`);
      
      let deletedCount = 0;
      const deletedEmails: string[] = [];
      const errors: string[] = [];

      for (const user of orphanUsers) {
        try {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          if (deleteError) {
            errors.push(`${user.email}: ${deleteError.message}`);
          } else {
            console.log(`Deleted orphan: ${user.email}`);
            deletedEmails.push(user.email || user.id);
            deletedCount++;
          }
        } catch (err) {
          errors.push(`${user.email}: ${err}`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, deletedCount, deletedEmails, totalFound: orphanUsers.length, errors: errors.length > 0 ? errors : undefined }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: delete_by_emails, list_auth_users, or delete_orphans" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

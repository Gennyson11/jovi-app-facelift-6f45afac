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
    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create user client to verify the caller's identity
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Validate JWT using signing-keys-safe flow
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { data: claimsData, error: userError } = await supabaseAuth.auth.getClaims(token);
    const callerUserId = claimsData?.claims?.sub;
    const callerUserEmail = typeof claimsData?.claims?.email === "string" ? claimsData.claims.email : null;

    if (userError || !callerUserId) {
      console.error("Authentication failed:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller has admin OR socio role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId)
      .in("role", ["admin", "socio"]);

    if (roleError || !roleData || roleData.length === 0) {
      console.error("Permission check failed for user:", callerUserId, "- Not an admin or socio");
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin or Socio access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userRoles = roleData.map(r => r.role);
    const isAdmin = userRoles.includes("admin");
    const isSocio = userRoles.includes("socio");

    console.log("User verified:", callerUserEmail, "roles:", userRoles);

    const body = await req.json();
    const { action, email, password, role, partner_id, name, whatsapp, has_access, access_expires_at, client_profile_id, new_email, new_password } = body;

    // Input validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRoles = ["admin", "user", "socio"];
    const validActions = ["create_user", "update_password", "delete_user", "delete_users_without_access", "delete_orphan_auth_users", "delete_client", "update_client", "delete_auth_user_by_id"];

    if (!action || !validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (email && !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (role && !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (partner_id && !uuidRegex.test(partner_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid partner_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (client_profile_id && !uuidRegex.test(client_profile_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid client_profile_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new_email && !emailRegex.test(new_email)) {
      return new Response(
        JSON.stringify({ error: "Invalid new_email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sócios can only create users with 'user' role
    if (isSocio && !isAdmin && role && role !== "user") {
      return new Response(
        JSON.stringify({ error: "Forbidden - Partners can only create users with 'user' role" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Setup action:", action, "email:", email, "partner_id:", partner_id, "by user:", callerUserEmail, "isAdmin:", isAdmin, "isSocio:", isSocio);

    if (action === "create_user") {
      // Create user
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      let userId: string | undefined;

      if (createError) {
        // User might already exist
        if (createError.message.includes("already been registered") || createError.message.includes("already exists")) {
          console.log("User already exists, updating password for:", email);
          
          // Look up user_id from profiles table (reliable, no pagination issues)
          const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
            .from("profiles")
            .select("user_id")
            .eq("email", email)
            .maybeSingle();

          if (profileLookupError || !existingProfile) {
            console.error("Profile not found for existing user:", email, profileLookupError);
            // Fallback: try listing users from auth
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
            const authUser = users?.find(u => u.email === email);
            if (!authUser) {
              throw new Error(`User exists in auth but profile not found for: ${email}`);
            }
            userId = authUser.id;
          } else {
            userId = existingProfile.user_id;
          }

          // Update password
          await supabaseAdmin.auth.admin.updateUserById(userId!, { password });
          
          // Check/add role
          const { data: existingRole } = await supabaseAdmin
            .from("user_roles")
            .select("*")
            .eq("user_id", userId!)
            .maybeSingle();

          if (!existingRole) {
            await supabaseAdmin.from("user_roles").insert({
              user_id: userId!,
              role: role,
            });
          }
        } else {
          throw createError;
        }
      } else {
        userId = userData.user?.id;
        // Add role
        if (userData.user) {
          await supabaseAdmin.from("user_roles").insert({
            user_id: userData.user.id,
            role: role,
          });
        }
      }

      // Update profile with partner_id and other data if provided (using service role bypasses RLS)
      if (userId && (partner_id || name || whatsapp || has_access !== undefined || access_expires_at)) {
        const updateData: Record<string, any> = {};
        if (partner_id) updateData.partner_id = partner_id;
        if (name) updateData.name = name;
        if (whatsapp) updateData.whatsapp = whatsapp;
        if (has_access !== undefined) updateData.has_access = has_access;
        if (access_expires_at) updateData.access_expires_at = access_expires_at;

        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update(updateData)
          .eq("user_id", userId);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
      }

      // Grant access to all platforms if has_access is true
      if (userId && has_access) {
        // Get the profile id for this user
        const { data: profileData } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (profileData) {
          // Get all platforms
          const { data: platforms } = await supabaseAdmin
            .from("streaming_platforms")
            .select("id");

          if (platforms && platforms.length > 0) {
            // Delete existing platform access to avoid duplicates
            await supabaseAdmin
              .from("user_platform_access")
              .delete()
              .eq("user_id", profileData.id);

            // Insert access to all platforms
            const accessEntries = platforms.map((platform) => ({
              user_id: profileData.id,
              platform_id: platform.id,
            }));

            const { error: accessError } = await supabaseAdmin
              .from("user_platform_access")
              .insert(accessEntries);

            if (accessError) {
              console.error("Error granting platform access:", accessError);
            } else {
              console.log(`Granted access to ${platforms.length} platforms for user ${userId}`);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: userId === userData?.user?.id ? "User created" : "User updated", userId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reactivate_client") {
      // Sócios and admins can reactivate a client
      if (!isAdmin && !isSocio) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!client_profile_id || !access_expires_at) {
        return new Response(
          JSON.stringify({ error: "Missing client_profile_id or access_expires_at" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify ownership for sócios
      if (isSocio && !isAdmin) {
        const { data: clientProfile } = await supabaseAdmin
          .from("profiles")
          .select("partner_id")
          .eq("id", client_profile_id)
          .single();
        
        if (!clientProfile || clientProfile.partner_id !== callerUserId) {
          return new Response(
            JSON.stringify({ error: "Forbidden - Not your client" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Update profile access
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ has_access: true, access_expires_at })
        .eq("id", client_profile_id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }

      // Re-grant all platform access
      const { data: platforms } = await supabaseAdmin
        .from("streaming_platforms")
        .select("id");

      if (platforms && platforms.length > 0) {
        await supabaseAdmin
          .from("user_platform_access")
          .delete()
          .eq("user_id", client_profile_id);

        const accessEntries = platforms.map((p) => ({
          user_id: client_profile_id,
          platform_id: p.id,
        }));

        const { error: accessError } = await supabaseAdmin
          .from("user_platform_access")
          .insert(accessEntries);

        if (accessError) {
          console.error("Error granting platform access:", accessError);
        } else {
          console.log(`Reactivated client ${client_profile_id} with ${platforms.length} platforms`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Client reactivated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update_password") {
      // Only admins can update passwords
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Forbidden - Only admins can update passwords" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user_id from profiles table by email
      const { data: profileData, error: profileFetchError } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .single();
      
      if (profileFetchError || !profileData) {
        console.error("Profile not found:", profileFetchError);
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userId = profileData.user_id;

      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      
      if (updateError) {
        throw updateError;
      }

      console.log("Password updated for user:", email, "by admin:", callerUserEmail);

      return new Response(
        JSON.stringify({ success: true, message: "Password updated successfully", userId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_user") {
      // Only admins can delete users
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Forbidden - Only admins can delete users" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // email is already parsed from req.json() on line 69
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user_id from profiles using email
      const { data: profileData, error: profileFetchError } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .single();
      
      if (profileFetchError || !profileData) {
        console.error("Profile not found:", profileFetchError);
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const authUserId = profileData.user_id;
      console.log("Deleting user with auth id:", authUserId, "email:", email, "by admin:", callerUserEmail);

      // Get profile id for tables that reference it
      const { data: fullProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", authUserId)
        .single();

      const profileId = fullProfile?.id;

      // Clean up all related tables before deleting auth user
      await supabaseAdmin.from('user_platform_access').delete().eq('user_id', profileId || '');
      await supabaseAdmin.from('user_coins').delete().eq('user_id', authUserId);
      await supabaseAdmin.from('user_missions').delete().eq('user_id', authUserId);
      await supabaseAdmin.from('credit_transactions').delete().eq('user_id', authUserId);
      await supabaseAdmin.from('user_credits').delete().eq('user_id', authUserId);
      await supabaseAdmin.from('user_access_logs').delete().eq('user_id', authUserId);
      await supabaseAdmin.from('security_audit_log').delete().eq('user_id', authUserId);
      await supabaseAdmin.from('user_roles').delete().eq('user_id', authUserId);
      await supabaseAdmin.from('profiles').update({ partner_id: null }).eq('partner_id', authUserId);
      await supabaseAdmin.from('invites').update({ used_by: null }).eq('used_by', authUserId);
      await supabaseAdmin.from('profiles').delete().eq('user_id', authUserId);

      console.log("Related data cleaned up, now deleting auth user...");

      // Delete from auth.users
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      
      if (deleteAuthError) {
        console.error("Error deleting auth user:", deleteAuthError);
        return new Response(
          JSON.stringify({ error: deleteAuthError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Successfully deleted user:", email, "auth id:", authUserId);

      return new Response(
        JSON.stringify({ success: true, message: "User deleted successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_users_without_access") {
      // Only admins can delete users
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Forbidden - Only admins can delete users" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Deleting all users without access... Requested by:", callerUserEmail);
      
      // Get all profiles without access
      const { data: profilesToDelete, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select("id, user_id, email")
        .eq("has_access", false);

      if (fetchError) {
        throw fetchError;
      }

      if (!profilesToDelete || profilesToDelete.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No users without access to delete", deletedCount: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Found ${profilesToDelete.length} users to delete`);
      
      let deletedCount = 0;
      const errors: string[] = [];

      for (const profile of profilesToDelete) {
        try {
          // Clean up dependent records first to avoid FK constraint errors
          await supabaseAdmin.from("user_platform_access").delete().eq("user_id", profile.id);
          await supabaseAdmin.from("user_missions").delete().eq("user_id", profile.user_id);
          await supabaseAdmin.from("user_coins").delete().eq("user_id", profile.user_id);
          await supabaseAdmin.from("credit_transactions").delete().eq("user_id", profile.user_id);
          await supabaseAdmin.from("user_credits").delete().eq("user_id", profile.user_id);
          await supabaseAdmin.from("user_access_logs").delete().eq("user_id", profile.user_id);
          await supabaseAdmin.from("security_audit_log").delete().eq("user_id", profile.user_id);
          await supabaseAdmin.from("user_roles").delete().eq("user_id", profile.user_id);
          // Clear partner_id references from other profiles
          await supabaseAdmin.from("profiles").update({ partner_id: null }).eq("partner_id", profile.user_id);
          // Clear invites used_by references
          await supabaseAdmin.from("invites").update({ used_by: null }).eq("used_by", profile.user_id);
          // Delete profile
          await supabaseAdmin.from("profiles").delete().eq("id", profile.id);
          
          // Delete from auth.users
          const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(profile.user_id);
          
          if (deleteAuthError) {
            console.error(`Error deleting auth user ${profile.email}:`, deleteAuthError);
            errors.push(`${profile.email}: ${deleteAuthError.message}`);
          } else {
            console.log(`Deleted user: ${profile.email}`);
            deletedCount++;
          }
        } catch (err) {
          console.error(`Error processing ${profile.email}:`, err);
          errors.push(`${profile.email}: ${err}`);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Deleted ${deletedCount} users`, 
          deletedCount,
          totalFound: profilesToDelete.length,
          errors: errors.length > 0 ? errors : undefined
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_auth_user_by_id") {
      // Delete a user directly from auth by their auth user_id
      const { user_id: targetAuthId } = await req.json().catch(() => ({ user_id: null }));
      
      // Since we already parsed the body, we need to get user_id from the initial parse
      // Actually, we can't re-parse. Let's check if it was passed in the original body
      // The original body parsing happened on line 69, so user_id would need to be passed there
      // For now, let's use a different approach - pass it as a separate field
      
      console.log("delete_auth_user_by_id called - this action is deprecated, use delete_orphan_auth_users instead");
      
      return new Response(
        JSON.stringify({ error: "Use delete_orphan_auth_users action instead" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_orphan_auth_users") {
      // Only admins can delete users
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Forbidden - Only admins can delete users" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Finding and deleting orphan auth users... Requested by:", callerUserEmail);
      
      // Get all auth users
      const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        throw listError;
      }

      if (!authUsers || authUsers.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No auth users found", deletedCount: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get all profile user_ids
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("user_id");

      if (profilesError) {
        throw profilesError;
      }

      const profileUserIds = new Set(profiles?.map(p => p.user_id) || []);
      
      // Find orphan users (in auth but not in profiles)
      const orphanUsers = authUsers.filter(u => !profileUserIds.has(u.id));
      
      console.log(`Found ${orphanUsers.length} orphan auth users to delete`);
      
      let deletedCount = 0;
      const errors: string[] = [];
      const deletedEmails: string[] = [];

      for (const user of orphanUsers) {
        try {
          const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          
          if (deleteAuthError) {
            console.error(`Error deleting orphan auth user ${user.email}:`, deleteAuthError);
            errors.push(`${user.email}: ${deleteAuthError.message}`);
          } else {
            console.log(`Deleted orphan user: ${user.email}`);
            deletedEmails.push(user.email || user.id);
            deletedCount++;
          }
        } catch (err) {
          console.error(`Error processing orphan ${user.email}:`, err);
          errors.push(`${user.email}: ${err}`);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Deleted ${deletedCount} orphan auth users`, 
          deletedCount,
          totalFound: orphanUsers.length,
          deletedEmails,
          errors: errors.length > 0 ? errors : undefined
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_client") {
      // Sócios can delete their own clients; admins can delete any client
      if (!client_profile_id) {
        return new Response(
          JSON.stringify({ error: "client_profile_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the client profile to verify ownership
      const { data: clientProfile, error: clientFetchError } = await supabaseAdmin
        .from("profiles")
        .select("user_id, partner_id, email")
        .eq("id", client_profile_id)
        .single();

      if (clientFetchError || !clientProfile) {
        return new Response(
          JSON.stringify({ error: "Client not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sócios can only delete their own clients
      if (isSocio && !isAdmin && clientProfile.partner_id !== callerUserId) {
        return new Response(
          JSON.stringify({ error: "Forbidden - You can only delete your own clients" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const clientAuthId = clientProfile.user_id;
      console.log("Deleting client:", clientProfile.email, "auth id:", clientAuthId, "by:", callerUserEmail);

      // Delete from auth.users (cascades to profiles, roles, etc.)
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(clientAuthId);

      if (deleteAuthError) {
        console.error("Error deleting client auth user:", deleteAuthError);
        return new Response(
          JSON.stringify({ error: deleteAuthError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Successfully deleted client:", clientProfile.email);

      return new Response(
        JSON.stringify({ success: true, message: "Client deleted successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update_client") {
      // Sócios can update their own clients' email and password
      if (!client_profile_id) {
        return new Response(
          JSON.stringify({ error: "client_profile_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // new_email and new_password already parsed from body on line 77

      // Get client profile to verify ownership
      const { data: clientProfile, error: clientFetchError } = await supabaseAdmin
        .from("profiles")
        .select("user_id, partner_id, email")
        .eq("id", client_profile_id)
        .single();

      if (clientFetchError || !clientProfile) {
        return new Response(
          JSON.stringify({ error: "Client not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sócios can only update their own clients
      if (isSocio && !isAdmin && clientProfile.partner_id !== callerUserId) {
        return new Response(
          JSON.stringify({ error: "Forbidden - You can only update your own clients" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const clientAuthId = clientProfile.user_id;
      const updateData: Record<string, string> = {};
      
      if (new_email && new_email !== clientProfile.email) {
        updateData.email = new_email;
      }
      if (new_password && new_password.length >= 6) {
        updateData.password = new_password;
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({ error: "No changes provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update auth user
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(clientAuthId, updateData);

      if (updateAuthError) {
        console.error("Error updating client auth:", updateAuthError);
        return new Response(
          JSON.stringify({ error: updateAuthError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update email in profiles table too
      if (updateData.email) {
        await supabaseAdmin
          .from("profiles")
          .update({ email: updateData.email })
          .eq("id", client_profile_id);
      }

      console.log("Updated client:", clientProfile.email, "by:", callerUserEmail, "changes:", Object.keys(updateData));

      return new Response(
        JSON.stringify({ success: true, message: "Client updated successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Setup error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { 
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Verify the caller is authenticated
    const { data: { user: callerUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !callerUser) {
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
      .eq("user_id", callerUser.id)
      .in("role", ["admin", "socio"]);

    if (roleError || !roleData || roleData.length === 0) {
      console.error("Permission check failed for user:", callerUser.id, "- Not an admin or socio");
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin or Socio access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userRoles = roleData.map(r => r.role);
    const isAdmin = userRoles.includes("admin");
    const isSocio = userRoles.includes("socio");

    console.log("User verified:", callerUser.email, "roles:", userRoles);

    const { action, email, password, role, partner_id, name, has_access, access_expires_at } = await req.json();
    console.log("Setup action:", action, "email:", email, "partner_id:", partner_id, "by user:", callerUser.email, "isAdmin:", isAdmin, "isSocio:", isSocio);

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
          // Get existing user
          const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users?.find(u => u.email === email);
          
          console.log("User already exists, updating password for:", email);
          
          if (existingUser) {
            userId = existingUser.id;
            // Update password
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
            
            // Check/add role
            const { data: existingRole } = await supabaseAdmin
              .from("user_roles")
              .select("*")
              .eq("user_id", existingUser.id)
              .maybeSingle();

            if (!existingRole) {
              await supabaseAdmin.from("user_roles").insert({
                user_id: existingUser.id,
                role: role,
              });
            }
          } else {
            throw createError;
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
      if (userId && (partner_id || name || has_access !== undefined || access_expires_at)) {
        const updateData: Record<string, any> = {};
        if (partner_id) updateData.partner_id = partner_id;
        if (name) updateData.name = name;
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

      console.log("Password updated for user:", email, "by admin:", callerUser.email);

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
      console.log("Deleting user with auth id:", authUserId, "email:", email, "by admin:", callerUser.email);

      // Delete from auth.users (this will cascade to profiles due to trigger/foreign key)
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
      console.log("Deleting all users without access... Requested by:", callerUser.email);
      
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
          // Delete from auth.users (this will cascade to profiles due to foreign key)
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
      console.log("Finding and deleting orphan auth users... Requested by:", callerUser.email);
      
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

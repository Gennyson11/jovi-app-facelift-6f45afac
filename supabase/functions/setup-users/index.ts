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

    const { action, email, password, role, partner_id, name, has_access, access_expires_at } = await req.json();
    console.log("Setup action:", action, "email:", email, "partner_id:", partner_id);

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

      console.log("Password updated for user:", email);

      return new Response(
        JSON.stringify({ success: true, message: "Password updated successfully", userId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_users_without_access") {
      console.log("Deleting all users without access...");
      
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

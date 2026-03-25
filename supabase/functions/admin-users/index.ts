import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's JWT to verify identity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requester is admin using service role (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, targetUserId } = await req.json();

    switch (action) {
      case "list_users": {
        const { data: { users }, error } = await adminClient.auth.admin.listUsers();
        if (error) throw error;

        // Get roles for all users
        const { data: allRoles } = await adminClient
          .from("user_roles")
          .select("user_id, role");

        const enriched = users.map((u: any) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          full_name: u.user_metadata?.full_name || "",
          roles: (allRoles || [])
            .filter((r: any) => r.user_id === u.id)
            .map((r: any) => r.role),
        }));

        return new Response(JSON.stringify({ users: enriched }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "disable_user": {
        if (!targetUserId) throw new Error("targetUserId required");
        if (targetUserId === user.id) throw new Error("Cannot disable yourself");

        // Ban user via Supabase admin API
        const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
          ban_duration: "876000h", // ~100 years
        });
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, message: "User disabled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "enable_user": {
        if (!targetUserId) throw new Error("targetUserId required");
        const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
          ban_duration: "none",
        });
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, message: "User enabled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_user": {
        if (!targetUserId) throw new Error("targetUserId required");
        if (targetUserId === user.id) throw new Error("Cannot delete yourself");

        const { error } = await adminClient.auth.admin.deleteUser(targetUserId);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, message: "User deleted" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

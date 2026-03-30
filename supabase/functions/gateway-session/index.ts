// ═══════════════════════════════════════════════════════════
// RtR Control Tower — gateway-session Edge Function
// Bridges RTR Auth Gateway JWT → Supabase session for RLS
//
// Flow:
// 1. Frontend sends Gateway JWT cookie (rtr_access_token)
// 2. This function verifies the Gateway JWT
// 3. Finds or creates the Supabase Auth user by email
// 4. Generates a Supabase session (access_token + refresh_token)
// 5. Returns tokens for frontend to set via supabase.auth.setSession()
//
// Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
//   - JWT_SECRET: Gateway JWT signing secret
//   - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
// ═══════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Credentials": "true",
};

// Import the crypto key for HS256 verification
async function getJwtKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Step 1: Extract Gateway JWT from cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, ...val] = c.trim().split("=");
        return [key, val.join("=")];
      }),
    );
    const token = cookies["rtr_access_token"];

    if (!token) {
      return new Response(
        JSON.stringify({ error: "no_gateway_token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 2: Verify Gateway JWT
    const key = await getJwtKey();
    let payload: Record<string, unknown>;
    try {
      payload = (await verify(token, key)) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ error: "invalid_gateway_token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const email = payload.email as string;
    const name = payload.name as string;
    if (!email) {
      return new Response(
        JSON.stringify({ error: "no_email_in_token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 3: Use admin client to find or create Supabase user
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find existing user by email
    const { data: userList } = await adminClient.auth.admin.listUsers();
    let supaUser = userList?.users?.find(
      (u: { email?: string }) => u.email === email,
    );

    if (!supaUser) {
      // Auto-create user in Supabase Auth (password is random, never used directly)
      const { data: created, error: createErr } =
        await adminClient.auth.admin.createUser({
          email,
          password: crypto.randomUUID(),
          email_confirm: true,
          user_metadata: { full_name: name },
        });
      if (createErr) {
        return new Response(
          JSON.stringify({ error: "user_create_failed", detail: createErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      supaUser = created.user;
    }

    // Step 4: Generate a Supabase-compatible JWT for this user
    // This JWT will be accepted by Supabase PostgREST for RLS
    const supabaseJwtSecret = Deno.env.get("SUPABASE_JWT_SECRET") || JWT_SECRET;
    const jwtKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(supabaseJwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const now = Math.floor(Date.now() / 1000);
    const accessPayload = {
      aud: "authenticated",
      exp: now + 3600, // 1 hour
      iat: now,
      iss: `${SUPABASE_URL}/auth/v1`,
      sub: supaUser!.id,
      email: supaUser!.email,
      role: "authenticated",
      session_id: crypto.randomUUID(),
    };

    const accessToken = await create(
      { alg: "HS256", typ: "JWT" },
      accessPayload,
      jwtKey,
    );

    // Refresh token (simplified — just a placeholder for setSession)
    const refreshPayload = {
      aud: "authenticated",
      exp: now + 86400, // 24 hours
      iat: now,
      iss: `${SUPABASE_URL}/auth/v1`,
      sub: supaUser!.id,
      session_id: accessPayload.session_id,
    };

    const refreshToken = await create(
      { alg: "HS256", typ: "JWT" },
      refreshPayload,
      jwtKey,
    );

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: supaUser!.id,
          email: supaUser!.email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "internal_error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

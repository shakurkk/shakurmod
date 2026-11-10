import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// The single admin account. The database's assign_owner_admin trigger grants the
// admin role to this verified email; app code never grants roles.
const ADMIN_EMAIL = "nextshakur@gmail.com";
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_IP = 5;
const MAX_FAILS_GLOBAL = 30;

async function sha256(s: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

// Constant-time comparison of the submitted key against the server-side secret.
async function keyMatches(given: string, expected: string) {
  const [a, b] = await Promise.all([sha256(given), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

function publicAuthClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

// Public: exchanges the admin key for a session on the admin account. The key and
// the account password live only in server secrets.
export const adminKeyLogin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ key: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const adminKey = process.env["ADMIN_KEY"];
    const password = process.env["ADMIN_ACCOUNT_PASSWORD"];
    if (!adminKey || !password) throw new Error("Admin login is not configured.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip =
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const since = new Date(Date.now() - WINDOW_MS).toISOString();

    const [perIp, global] = await Promise.all([
      supabaseAdmin.from("admin_login_attempts").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", since),
      supabaseAdmin.from("admin_login_attempts").select("id", { count: "exact", head: true }).gte("created_at", since),
    ]);
    if ((perIp.count ?? 0) >= MAX_FAILS_PER_IP || (global.count ?? 0) >= MAX_FAILS_GLOBAL) {
      return { ok: false as const, error: "Too many attempts. Try again in 15 minutes." };
    }

    if (!(await keyMatches(data.key, adminKey))) {
      await supabaseAdmin.from("admin_login_attempts").insert({ ip });
      return { ok: false as const, error: "Incorrect admin key." };
    }

    const auth = publicAuthClient().auth;
    let res = await auth.signInWithPassword({ email: ADMIN_EMAIL, password });
    if (res.error || !res.data.session) {
      // First login (or the password was rotated): make sure the admin account exists
      // with a confirmed email and the current server-held password.
      const created = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Admin" },
      });
      if (created.error) {
        let userId: string | undefined;
        for (let page = 1; page <= 20 && !userId; page++) {
          const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
          if (error) break;
          userId = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL)?.id;
          if (list.users.length < 200) break;
        }
        if (!userId) throw new Error("Could not prepare the admin account.");
        const upd = await supabaseAdmin.auth.admin.updateUserById(userId, { password, email_confirm: true });
        if (upd.error) throw new Error("Could not prepare the admin account.");
      }
      res = await auth.signInWithPassword({ email: ADMIN_EMAIL, password });
      if (res.error || !res.data.session) throw new Error("Could not start the admin session.");
    }

    // Successful login clears this visitor's failed attempts.
    await supabaseAdmin.from("admin_login_attempts").delete().eq("ip", ip);
    return {
      ok: true as const,
      session: { access_token: res.data.session.access_token, refresh_token: res.data.session.refresh_token },
    };
  });

// Server-only: checks and stores the admin key. Once changed, only a salted
// PBKDF2 hash is kept in the service-role-only `admin_key` table; until then the
// ADMIN_KEY server secret is the key.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ITERATIONS = 100_000; // Cloudflare Workers' PBKDF2 maximum.

const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const fromHex = (s: string) => new Uint8Array(s.match(/../g)?.map((h) => parseInt(h, 16)) ?? []);

async function derive(key: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, base, 256);
  return new Uint8Array(bits);
}

async function sha256(s: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

function equal(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export async function verifyAdminKey(given: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from("admin_key").select("key_hash, key_salt").eq("id", 1).maybeSingle();
  if (error) throw new Error("Could not check the admin key.");
  if (data) return equal(await derive(given, fromHex(data.key_salt)), fromHex(data.key_hash));
  const envKey = process.env["ADMIN_KEY"];
  if (!envKey) throw new Error("Admin login is not configured.");
  const [a, b] = await Promise.all([sha256(given), sha256(envKey)]);
  return equal(a, b);
}

export async function storeAdminKey(newKey: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(newKey, salt);
  const { error } = await supabaseAdmin
    .from("admin_key")
    .upsert({ id: 1, key_hash: toHex(hash), key_salt: toHex(salt), updated_at: new Date().toISOString() });
  if (error) throw new Error("Could not save the new admin key.");
}

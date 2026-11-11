import { afterEach, describe, expect, it } from "vitest";
import { buildUpstreamRequest, DEFAULT_UPSTREAM, mirrorTarget, rewriteUpstreamResponse } from "./mirror";

const saved = process.env["SUPABASE_SERVICE_ROLE_KEY"];
afterEach(() => {
  if (saved === undefined) delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
  else process.env["SUPABASE_SERVICE_ROLE_KEY"] = saved;
});

describe("mirror mode", () => {
  it("forwards to the Lovable-hosted app when the backend service key is missing", () => {
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
    expect(mirrorTarget(new Request("https://shakurmod.example.workers.dev/auth"), {})).toBe(DEFAULT_UPSTREAM);
  });

  it("serves locally on Lovable hosting, where the service key exists", () => {
    expect(mirrorTarget(new Request("https://x.workers.dev/"), { SUPABASE_SERVICE_ROLE_KEY: "k" })).toBeNull();
  });

  it("never forwards a request that was already forwarded (no loops)", () => {
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
    const req = new Request("https://x.workers.dev/", { headers: { "x-shakur-mirror": "1" } });
    expect(mirrorTarget(req, {})).toBeNull();
  });

  it("uses UPSTREAM_ORIGIN when set", () => {
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
    expect(mirrorTarget(new Request("https://x.workers.dev/"), { UPSTREAM_ORIGIN: "https://other.lovable.app/" })).toBe(
      "https://other.lovable.app",
    );
  });

  it("rewrites Origin so the upstream accepts admin sign-in calls", async () => {
    const req = new Request("https://x.workers.dev/_serverFn/abc?x=1", {
      method: "POST",
      headers: { origin: "https://x.workers.dev", "content-type": "application/json" },
      body: "{}",
    });
    const up = await buildUpstreamRequest(req, DEFAULT_UPSTREAM);
    expect(up.url).toBe(`${DEFAULT_UPSTREAM}/_serverFn/abc?x=1`);
    expect(up.headers.get("origin")).toBe(DEFAULT_UPSTREAM);
  });

  it("rewrites upstream redirects back to the public address", () => {
    const res = rewriteUpstreamResponse(
      new Response(null, { status: 302, headers: { location: `${DEFAULT_UPSTREAM}/admin` } }),
      DEFAULT_UPSTREAM,
      "https://x.workers.dev",
    );
    expect(res.headers.get("location")).toBe("https://x.workers.dev/admin");
  });
});

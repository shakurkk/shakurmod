// "Mirror mode" for copies of this app hosted outside Lovable (e.g. a Cloudflare
// Worker built from GitHub). The backend's private service key and the admin
// account password only exist on Lovable hosting and cannot be exported, so a
// self-hosted copy cannot run admin login, file listing or downloads itself.
// Instead it forwards every request, server-to-server, to the Lovable-hosted
// app, which holds the secrets. Visitors keep using the self-hosted address.

export const DEFAULT_UPSTREAM = "https://shakurdrivemod.lovable.app";
const LOOP_HEADER = "x-shakur-mirror";

type Env = Record<string, unknown> | undefined | null;

export function readEnv(name: string, env?: Env): string | undefined {
  const fromParam = env && typeof env === "object" ? env[name] : undefined;
  if (typeof fromParam === "string" && fromParam) return fromParam;
  const g = (globalThis as { __env__?: Record<string, unknown> }).__env__;
  const fromGlobal = g?.[name];
  if (typeof fromGlobal === "string" && fromGlobal) return fromGlobal;
  try {
    const v = typeof process !== "undefined" ? process.env?.[name] : undefined;
    if (v) return v;
  } catch {
    /* no process.env in this runtime */
  }
  return undefined;
}

// Returns the upstream origin to forward to, or null to serve the request locally.
// Lovable hosting always has the service key, so it never mirrors.
export function mirrorTarget(request: Request, env?: Env): string | null {
  if (request.headers.has(LOOP_HEADER)) return null;
  if (readEnv("SUPABASE_SERVICE_ROLE_KEY", env)) return null;
  const raw = readEnv("UPSTREAM_ORIGIN", env) ?? DEFAULT_UPSTREAM;
  let upstream: URL;
  try {
    upstream = new URL(raw);
  } catch {
    return null;
  }
  if (upstream.host === new URL(request.url).host) return null;
  return upstream.origin;
}

const DROP_REQUEST_HEADERS = [
  "host",
  "connection",
  "keep-alive",
  "proxy-connection",
  "transfer-encoding",
  "upgrade",
  "te",
  "trailer",
  "content-length",
  "cf-connecting-ip",
  "cf-ipcountry",
  "cf-ray",
  "cf-visitor",
  "cf-worker",
  "x-real-ip",
];

export async function buildUpstreamRequest(request: Request, upstreamOrigin: string): Promise<Request> {
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, upstreamOrigin);
  const headers = new Headers(request.headers);
  for (const h of DROP_REQUEST_HEADERS) headers.delete(h);
  // The upstream's cross-site protection compares Origin with its own host.
  if (headers.has("origin")) headers.set("origin", upstreamOrigin);
  const referer = headers.get("referer");
  if (referer) {
    try {
      const r = new URL(referer);
      if (r.host === incoming.host) headers.set("referer", new URL(r.pathname + r.search, upstreamOrigin).toString());
    } catch {
      headers.delete("referer");
    }
  }
  headers.set("x-forwarded-host", incoming.host);
  headers.set(LOOP_HEADER, "1");
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  return new Request(target.toString(), {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });
}

export function rewriteUpstreamResponse(response: Response, upstreamOrigin: string, publicOrigin: string): Response {
  const headers = new Headers(response.headers);
  // fetch() already decoded the body; the host re-compresses at the edge.
  headers.delete("content-encoding");
  headers.delete("content-length");
  const location = headers.get("location");
  if (location?.startsWith(upstreamOrigin)) headers.set("location", publicOrigin + location.slice(upstreamOrigin.length));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function mirrorFetch(request: Request, upstreamOrigin: string): Promise<Response> {
  const upstreamRes = await fetch(await buildUpstreamRequest(request, upstreamOrigin));
  return rewriteUpstreamResponse(upstreamRes, upstreamOrigin, new URL(request.url).origin);
}

-- Failed admin-key attempts, used by the server to throttle guessing. Server (service role) only.
CREATE TABLE public.admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_login_attempts_ip_created_idx ON public.admin_login_attempts(ip, created_at DESC);
CREATE INDEX admin_login_attempts_created_idx ON public.admin_login_attempts(created_at DESC);
GRANT ALL ON public.admin_login_attempts TO service_role;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

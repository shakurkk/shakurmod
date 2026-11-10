-- Holds the hashed admin key once the admin changes it. Only server code (service role) can read or write it.
CREATE TABLE public.admin_key (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  key_hash text NOT NULL,
  key_salt text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.admin_key FROM anon, authenticated;
GRANT ALL ON public.admin_key TO service_role;
ALTER TABLE public.admin_key ENABLE ROW LEVEL SECURITY;
-- No policies: anon and authenticated users have no access at all.
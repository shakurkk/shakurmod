-- Visitors read categories through a narrow server function; direct table reads are admin-only.
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Admins view categories" ON public.categories FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.categories FROM anon;
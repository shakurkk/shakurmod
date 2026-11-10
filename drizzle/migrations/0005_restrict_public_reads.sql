-- Visitors now read the library through narrow server functions; direct table and thumbnail reads are admin-only.
DROP POLICY IF EXISTS "Anyone can view files" ON public.files;
CREATE POLICY "Admins view files" ON public.files FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.files FROM anon;

DROP POLICY IF EXISTS "Anyone can view folders" ON public.folders;
CREATE POLICY "Admins view folders" ON public.folders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.folders FROM anon;

DROP POLICY IF EXISTS "Anyone can read thumbnails" ON storage.objects;
CREATE OR REPLACE FUNCTION public.admin_download_stats(_days integer DEFAULT 30)
RETURNS TABLE(day date, downloads bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT g.d::date AS day, count(dl.id)::bigint AS downloads
    FROM generate_series((current_date - (greatest(_days, 1) - 1))::timestamp, current_date::timestamp, interval '1 day') AS g(d)
    LEFT JOIN public.downloads dl ON dl.created_at::date = g.d::date
    GROUP BY g.d
    ORDER BY g.d;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_download_stats(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_download_stats(integer) TO authenticated;

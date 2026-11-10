import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Viewer = {
  user: { id: string; email: string | null; name: string | null; avatar: string | null } | null;
  isAdmin: boolean;
};

// The role is read from the protected roles table; the database enforces it on every write.
export const viewerQuery = () =>
  queryOptions({
    queryKey: ["viewer"],
    queryFn: async (): Promise<Viewer> => {
      let u;
      try {
        u = (await supabase.auth.getUser()).data.user;
      } catch {
        // Storage blocked by the browser: treat the visitor as signed out.
        return { user: null, isAdmin: false };
      }
      if (!u) return { user: null, isAdmin: false };
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id)
        .eq("role", "admin")
        .maybeSingle();
      const meta = (u.user_metadata ?? {}) as Record<string, string | undefined>;
      return {
        user: {
          id: u.id,
          email: u.email ?? null,
          name: meta["full_name"] ?? meta["name"] ?? null,
          avatar: meta["avatar_url"] ?? meta["picture"] ?? null,
        },
        isAdmin: !!role,
      };
    },
    staleTime: 60_000,
  });

export function useViewer() {
  const q = useQuery({ ...viewerQuery(), enabled: typeof window !== "undefined" });
  return { viewer: q.data ?? { user: null, isAdmin: false }, loading: q.isLoading };
}

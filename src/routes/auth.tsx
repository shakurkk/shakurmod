import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { viewerQuery } from "@/lib/auth";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin sign in — SHAKUR MOD" },
      { name: "description", content: "Owner sign-in for the SHAKUR MOD admin dashboard." },
      { property: "og:title", content: "Admin sign in — SHAKUR MOD" },
      { property: "og:description", content: "Owner sign-in for the SHAKUR MOD admin dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function GoogleG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const viewer = useQuery(viewerQuery());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (viewer.data?.isAdmin) navigate({ to: "/admin", replace: true });
  }, [viewer.data?.isAdmin, navigate]);

  const signIn = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
      toast.error("Sign-in didn't complete. Please try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    await qc.invalidateQueries({ queryKey: ["viewer"] });
    setBusy(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.setQueryData(["viewer"], { user: null, isAdmin: false });
  };

  const signedInNotAdmin = viewer.data?.user && !viewer.data.isAdmin;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-[420px] rounded-3xl border bg-card px-6 py-10 text-center shadow-lift sm:px-10">
        <Logo className="justify-center" />
        {viewer.isLoading ? (
          <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" />
        ) : signedInNotAdmin ? (
          <>
            <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Access denied</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {viewer.data?.user?.email} isn't authorized to manage SHAKUR MOD.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="outline" className="h-11 rounded-full" onClick={signOut}>
                Sign out and use another account
              </Button>
              <Button asChild variant="ghost" className="h-11 rounded-full">
                <Link to="/">Back to SHAKUR MOD</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
              <ShieldCheck className="h-7 w-7 text-primary-soft-foreground" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Owner sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">Only the authorized Google account can open the admin dashboard.</p>
            <Button
              variant="google"
              className="mt-7 h-11 w-full gap-2.5 px-3 text-sm font-medium"
              onClick={signIn}
              disabled={busy}
            >
              {busy ? <Loader2 className="animate-spin" /> : <GoogleG />}
              Sign in with Google
            </Button>
            <Link to="/" className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to files
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

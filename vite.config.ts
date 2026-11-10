// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Pre-bundle deps that are only reached on some pages, so the dev server doesn't
    // re-optimize mid-session and serve two React copies ("reading 'useState'" of null).
    optimizeDeps: {
      include: [
        "date-fns",
        "recharts",
        "zod",
        "tus-js-client",
        "@radix-ui/react-alert-dialog",
        "@radix-ui/react-dialog",
        "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-label",
        "@radix-ui/react-progress",
        "@radix-ui/react-select",
        "@radix-ui/react-slot",
        "@radix-ui/react-tabs",
        "class-variance-authority",
        "clsx",
        "lucide-react",
        "sonner",
        "tailwind-merge",
      ],
    },
  },
});

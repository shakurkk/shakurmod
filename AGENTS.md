<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules (SHAKUR MOD)

- Admin sign-in is an Admin Key checked only in `adminKeyLogin` (src/lib/admin-login.functions.ts) via `verifyAdminKey` (src/lib/admin-key.server.ts): a salted PBKDF2 hash in the service-role-only `admin_key` table once the admin changes it (`changeAdminKey`, which re-checks the role and old key), else the `ADMIN_KEY` secret, so the running app can rotate the key without code; throttled via `admin_login_attempts`; on success the server signs into the single admin account with a server-held password and returns its session, so every admin write stays enforced by RLS. The admin role itself is granted only by the `assign_owner_admin` trigger, never from app code or user metadata. Public sign-up and social providers stay off so no other account can exist.
- All writes (files, folders, categories, storage uploads) go through the browser client and are enforced by admin-only RLS; UI hiding is cosmetic, so never add a write path that bypasses RLS.
- The `files` storage bucket is private; downloads must go through `requestDownload` (signed short-lived link + `record_download`) so counts stay accurate.
- Thumbnails live in a private `thumbnails` bucket with public read policy and are shown via signed URLs, because the workspace blocks public buckets.
- File type and size rules live in `src/lib/file-types.ts` and are mirrored by DB CHECK constraints; change both together.
- Uploads over 6 MB use resumable (TUS) uploads in `src/components/admin/upload.ts` so multi-GB files survive flaky connections.

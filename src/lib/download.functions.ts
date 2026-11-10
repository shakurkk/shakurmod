import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public: anyone may download a listed file. The bucket is private, so the
// server issues a short-lived signed link and records the download.
export const requestDownload = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ fileId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: file, error } = await supabaseAdmin
      .from("files")
      .select("id, name, extension, storage_path")
      .eq("id", data.fileId)
      .maybeSingle();
    if (error || !file) throw new Error("File not found");

    const filename = file.name.toLowerCase().endsWith(`.${file.extension}`)
      ? file.name
      : `${file.name}.${file.extension}`;

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("files")
      .createSignedUrl(file.storage_path, 300, { download: filename });
    if (signErr || !signed) throw new Error("Could not create download link");

    await supabaseAdmin.rpc("record_download", { _file_id: file.id });
    return { url: signed.signedUrl };
  });

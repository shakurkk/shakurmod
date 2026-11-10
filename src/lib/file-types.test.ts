import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES, validateUpload, validateThumbnail } from "./file-types";

describe("upload rules", () => {
  it("accepts an APK", () => {
    expect(validateUpload({ name: "Game.MOD.apk", size: 1000 })).toEqual({ ok: true, extension: "apk" });
  });

  it("accepts ZIP, RAR, PDF, images and videos", () => {
    for (const n of ["a.zip", "b.rar", "c.pdf", "d.png", "e.mp4"]) {
      expect(validateUpload({ name: n, size: 10 }).ok).toBe(true);
    }
  });

  it("rejects disallowed file types", () => {
    expect(validateUpload({ name: "script.php", size: 10 }).ok).toBe(false);
    expect(validateUpload({ name: "noextension", size: 10 }).ok).toBe(false);
  });

  it("allows exactly 5 GB but rejects anything bigger", () => {
    expect(MAX_FILE_BYTES).toBe(5 * 1024 * 1024 * 1024);
    expect(validateUpload({ name: "big.zip", size: MAX_FILE_BYTES }).ok).toBe(true);
    expect(validateUpload({ name: "big.zip", size: MAX_FILE_BYTES + 1 }).ok).toBe(false);
  });

  it("rejects empty files", () => {
    expect(validateUpload({ name: "a.zip", size: 0 }).ok).toBe(false);
  });

  it("only accepts image thumbnails", () => {
    expect(validateThumbnail({ name: "t.png", size: 100 }).ok).toBe(true);
    expect(validateThumbnail({ name: "t.pdf", size: 100 }).ok).toBe(false);
  });
});

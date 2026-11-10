import { describe, expect, it } from "vitest";
import { validateNewAdminKey } from "./admin-key-rules";

describe("new admin key rules", () => {
  it("accepts a new key of 8+ characters that matches its confirmation", () => {
    expect(validateNewAdminKey("shakur", "newsecret1", "newsecret1")).toBeNull();
  });
  it("rejects a key shorter than 8 characters", () => {
    expect(validateNewAdminKey("shakur", "short7c", "short7c")).not.toBeNull();
  });
  it("rejects when the confirmation doesn't match", () => {
    expect(validateNewAdminKey("shakur", "newsecret1", "newsecret2")).not.toBeNull();
  });
  it("rejects reusing the current key", () => {
    expect(validateNewAdminKey("oldsecret1", "oldsecret1", "oldsecret1")).not.toBeNull();
  });
});

// Client-safe rules for choosing a new admin key. The server re-checks them.
export const MIN_ADMIN_KEY_LENGTH = 8;
export const MAX_ADMIN_KEY_LENGTH = 200;

export function validateNewAdminKey(oldKey: string, newKey: string, confirmKey: string): string | null {
  if (newKey.length < MIN_ADMIN_KEY_LENGTH) return `The new key must be at least ${MIN_ADMIN_KEY_LENGTH} characters.`;
  if (newKey.length > MAX_ADMIN_KEY_LENGTH) return `The new key must be at most ${MAX_ADMIN_KEY_LENGTH} characters.`;
  if (newKey.trim() !== newKey) return "The new key can't start or end with a space.";
  if (newKey !== confirmKey) return "The new keys don't match.";
  if (newKey === oldKey) return "The new key must be different from the current key.";
  return null;
}

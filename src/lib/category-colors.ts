export const CATEGORY_COLORS = ["blue", "green", "amber", "red", "teal", "slate"] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

const TONES: Record<CategoryColor, { bg: string; text: string; dot: string }> = {
  blue: { bg: "bg-kind-doc/10", text: "text-kind-doc", dot: "bg-kind-doc" },
  green: { bg: "bg-kind-apk/10", text: "text-kind-apk", dot: "bg-kind-apk" },
  amber: { bg: "bg-kind-archive/15", text: "text-kind-archive", dot: "bg-kind-archive" },
  red: { bg: "bg-kind-pdf/10", text: "text-kind-pdf", dot: "bg-kind-pdf" },
  teal: { bg: "bg-kind-audio/10", text: "text-kind-audio", dot: "bg-kind-audio" },
  slate: { bg: "bg-kind-program/10", text: "text-kind-program", dot: "bg-kind-program" },
};

export function categoryTone(color: string) {
  return TONES[(CATEGORY_COLORS as readonly string[]).includes(color) ? (color as CategoryColor) : "blue"];
}

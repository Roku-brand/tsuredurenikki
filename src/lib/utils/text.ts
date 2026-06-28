export function countWords(text: string) {
  const compact = text.replace(/\s/g, "");
  return Array.from(compact).length;
}

export function compactText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function csvTags(value: string | null | undefined) {
  return (value ?? "")
    .split(/[,\n#、]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function makeSnippet(text: string | null | undefined, keyword?: string) {
  const source = (text ?? "").replace(/\s+/g, " ").trim();
  if (!source) return "";
  if (!keyword) return source.slice(0, 120);
  const index = source.toLowerCase().indexOf(keyword.toLowerCase());
  if (index < 0) return source.slice(0, 120);
  const start = Math.max(0, index - 38);
  const end = Math.min(source.length, index + keyword.length + 78);
  return `${start > 0 ? "..." : ""}${source.slice(start, end)}${end < source.length ? "..." : ""}`;
}

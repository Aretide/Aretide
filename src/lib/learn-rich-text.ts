/**
 * Inline markdown links in learn body/FAQ copy: [anchor](/path/) or
 * [anchor](https://...). JSON-LD and tests that want plain text should strip
 * the markup rather than leaking brackets into SERP schema.
 */
export function stripLearnMarkdownLinks(text: string): string {
  return text.replace(
    /\[([^\]]+)\]\((\/[a-zA-Z0-9\-/_]+|https:\/\/[^)\s]+)\)/g,
    "$1",
  );
}

export type LearnRichTextPart =
  | { type: "text"; value: string }
  | { type: "internal"; label: string; href: string }
  | { type: "external"; label: string; href: string };

export function parseLearnRichText(text: string): LearnRichTextPart[] {
  const parts: LearnRichTextPart[] = [];
  const matcher = /\[([^\]]+)\]\((\/[a-zA-Z0-9\-/_]+|https:\/\/[^)\s]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    const label = match[1] ?? "";
    const href = match[2] ?? "";
    if (href.startsWith("/")) {
      parts.push({ type: "internal", label, href });
    } else {
      parts.push({ type: "external", label, href });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts;
}

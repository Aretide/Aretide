import { Link } from "@tanstack/react-router";
import { citationRel } from "@/lib/outbound-links";
import { parseLearnRichText } from "@/lib/learn-rich-text";
import { cn } from "@/lib/utils";

const linkClass =
  "font-medium text-foreground underline underline-offset-4 hover:text-primary";

export function LearnRichText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = parseLearnRichText(text);
  return (
    <span className={cn(className)}>
      {parts.map((part, index) => {
        if (part.type === "text") return <span key={index}>{part.value}</span>;
        if (part.type === "internal") {
          return (
            <Link key={index} to={part.href} className={linkClass}>
              {part.label}
            </Link>
          );
        }
        return (
          <a
            key={index}
            href={part.href}
            target="_blank"
            rel={citationRel(part.href)}
            className={linkClass}
          >
            {part.label}
          </a>
        );
      })}
    </span>
  );
}

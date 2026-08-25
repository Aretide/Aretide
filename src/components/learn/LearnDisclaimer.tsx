import { LEARN_DISCLAIMER_BODY } from "@/lib/learn-trust-copy";
import { cn } from "@/lib/utils";

export const LEARN_DISCLAIMER_TITLE = "Educational, not medical advice";

export { LEARN_DISCLAIMER_BODY };

export function LearnDisclaimer({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm leading-relaxed text-foreground",
        className,
      )}
      aria-label={LEARN_DISCLAIMER_TITLE}
    >
      <p className="mb-1.5 font-semibold">{LEARN_DISCLAIMER_TITLE}</p>
      <p className="text-muted-foreground">{LEARN_DISCLAIMER_BODY}</p>
    </aside>
  );
}

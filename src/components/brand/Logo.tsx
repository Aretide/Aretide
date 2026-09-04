import beemaMark from "@/assets/beema-mark.png";
import beemaMarkIcon from "@/assets/beema-mark-icon.webp";
import beemaWordmark from "@/assets/beema-wordmark.webp";
import beemaLockup from "@/assets/beema-lockup.webp";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Sizing classes applied to the bee mark image (legacy contract). */
  className?: string;
  /** Set on black `ink` surfaces so the wordmark stays legible. */
  tone?: "default" | "ink";
  /** Hide the text wordmark and show only the hexagon bee mark. */
  markOnly?: boolean;
  /** Icon above wordmark instead of side-by-side - compact centered mobile header lockup. */
  stacked?: boolean;
};

export function Logo({
  className,
  tone = "default",
  markOnly = false,
  stacked = false,
}: LogoProps) {
  // Stacked (mobile header) uses the same cropped assets as the desktop
  // HeaderLogo lockup below, so mobile matches desktop pixel-for-pixel on
  // the icon art and the "Health" gold, instead of the older, muddier
  // accent-foreground brown.
  if (stacked) {
    return (
      <span className="inline-flex flex-col items-center gap-1">
        <img
          src={beemaMarkIcon}
          alt={markOnly ? "Beema Health" : ""}
          width={99}
          height={112}
          className={cn("h-10 w-auto object-contain", className)}
        />
        {!markOnly && (
          <img
            src={beemaWordmark}
            alt="Beema Health"
            width={475}
            height={56}
            className="h-3.5 w-auto object-contain"
          />
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src={beemaMark}
        alt="Beema Health"
        width={136}
        height={150}
        className={cn("h-10 w-auto object-contain", className)}
      />
      {/* Wordmark is visual; accessible name comes from the img alt (and any
          wrapping Link aria-label). Keeps Bing/Lighthouse from flagging empty alt. */}
      <span
        aria-hidden="true"
        className={cn(
          "font-display font-bold leading-none tracking-tight text-xl",
          tone === "ink" ? "text-ink-foreground" : "text-foreground",
          markOnly && "sr-only",
        )}
      >
        Beema{" "}
        <span
          className={tone === "ink" ? "text-primary" : "text-accent-foreground"}
        >
          Health
        </span>
      </span>
    </span>
  );
}

/**
 * Full "Beema Health" wordmark + hex bee lockup as a single flattened image
 * (desktop header only - mobile keeps the icon+live-text `Logo` above).
 * Single small WebP (~8KB) so it can't hurt LCP/CWV; explicit width/height
 * prevent layout shift; alt carries the brand name since the wordmark
 * pixels aren't crawlable text.
 */
export function HeaderLogo({ className }: { className?: string }) {
  return (
    <img
      src={beemaLockup}
      alt="Beema Health"
      width={700}
      height={126}
      className={cn("h-9 w-auto object-contain", className)}
    />
  );
}

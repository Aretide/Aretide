import { Link } from "@tanstack/react-router";
import { ArrowRight, Droplet, HeartPulse } from "lucide-react";
import { HexBadge, Reveal } from "@/components/site/primitives";
import {
  ED_TADALAFIL_PRICING,
  HAIRLOSS_ORAL_MINOXIDIL_PRICING,
  formatSimpleStartingAt,
} from "@/lib/simple-treatment-pricing";

/**
 * Homepage isn't only a weight-loss company (2026-08-27) - GLP-1 stays the
 * flagship showcase above (TreatmentShowcase, and every "Get Started" CTA
 * defaults to the GLP-1 intake, see cta-ids.ts DEFAULT_CTA_TARGET), but
 * Sexual Health and Hair need a real homepage presence too, not just a
 * header/footer link. This also fixes a real SEO gap: those hubs had zero
 * homepage inbound links before this.
 *
 * Wellness card removed 2026-08-28 - NAD+ and sermorelin (its only
 * products) are both paused. Add it back here once either returns. TRT is
 * also paused, so Sexual Health's description below only mentions ED.
 */
const CATEGORIES = [
  {
    id: "sexual-health",
    name: "Sexual Health",
    description: "Compounded ED treatment.",
    icon: HeartPulse,
    priceLine: `From ${formatSimpleStartingAt(ED_TADALAFIL_PRICING)}`,
    to: "/sexual-health/",
  },
  {
    id: "hair",
    name: "Hair",
    description: "Compounded oral and topical hairloss treatment.",
    icon: Droplet,
    priceLine: `From ${formatSimpleStartingAt(HAIRLOSS_ORAL_MINOXIDIL_PRICING)}`,
    to: "/hair/",
  },
] as const;

export function WellnessLineupSection() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="veya-container">
        <Reveal>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            More than weight loss
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            Beema also offers compounded treatment for sexual health and hair
            loss, each reviewed by a licensed provider.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              to={category.to}
              aria-label={`Explore ${category.name}`}
              className="group flex flex-col rounded-3xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <HexBadge className="size-11">
                <category.icon className="size-5" aria-hidden />
              </HexBadge>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {category.name}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {category.description}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {category.priceLine}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-foreground">
                  Explore
                  <ArrowRight
                    className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

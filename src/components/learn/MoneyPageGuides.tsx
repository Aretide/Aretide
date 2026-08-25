import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/primitives";
import {
  guideHeadingForMoneyPage,
  guidesForMoneyPage,
} from "@/content/learn/money-page-guides";

/**
 * Guide links rendered on a program page.
 *
 * Each link uses the guide's own title as anchor text, so the internal anchor
 * matches the query the target page is written to answer. The one-line
 * description underneath is the same sentence the guide uses as its meta
 * description, which gives an answer engine a self-contained summary of the
 * destination without duplicating body copy.
 */
export function MoneyPageGuides({ path }: { path: string }) {
  const guides = guidesForMoneyPage(path);
  const heading = guideHeadingForMoneyPage(path);
  if (guides.length === 0) return null;

  return (
    <Section className="pt-0">
      <SectionHeading
        align="left"
        eyebrow="Read next"
        title={heading}
        className="mx-0 max-w-2xl"
      />
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <li key={guide.href}>
            <Link
              to={guide.href}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="text-base font-semibold text-foreground">
                  {guide.title}
                </span>
                <ArrowRight
                  className="mt-1 size-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </span>
              <span className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {guide.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

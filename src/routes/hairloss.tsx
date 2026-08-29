import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CheckCircle2, Droplet, ShieldCheck } from "lucide-react";
import {
  canonicalUrl,
  breadcrumbJsonLd,
  faqPageJsonLd,
  serviceJsonLd,
} from "@/lib/seo";
import {
  CLINICAL_PROVIDER_GROUP,
  SEAN_ARORA_PROVIDER,
} from "@/lib/provider-info";
import { trackPageViewed } from "@/lib/analytics";
import { MarketingLayout } from "@/components/site/MarketingLayout";
import {
  MagneticButton,
  Section,
  SectionHeading,
  SurfaceCard,
} from "@/components/site/primitives";
import {
  TreatmentBreadcrumb,
  TreatmentFaqSection,
  TreatmentHeroArt,
  TreatmentIncludedDropdown,
  SimpleTreatmentPricingCard,
  type TreatmentFaqItem,
} from "@/components/site/TreatmentPageBlocks";
import { HowItWorksSteps } from "@/components/site/HowItWorksSteps";
import { EASE_OUT, LineReveal } from "@/components/home/home-motion";
import { Button } from "@/components/ui/button";
import { CTA_IDS, resolveCta } from "@/lib/cta-ids";
import {
  HAIRLOSS_FINASTERIDE_PRICING,
  HAIRLOSS_ORAL_MINOXIDIL_PRICING,
  HAIRLOSS_TOPICAL_MEN_PRICING,
  HAIRLOSS_TOPICAL_WOMEN_PRICING,
  HAIRLOSS_WOMENS_COMPOUND_PRICING,
  formatSimpleStartingAt,
  simplePricingSentence,
} from "@/lib/simple-treatment-pricing";
import { patientQuestionsGuidance } from "@/lib/marketing-copy";
import { SUPPORT_EMAIL } from "@/lib/contact-info";
import { MoneyPageGuides } from "@/components/learn/MoneyPageGuides";

const TITLE = "Compounded Hairloss Treatment | Beema Health";
const DESCRIPTION = `Compounded hairloss formulations for men and women, reviewed by licensed providers. Nationwide telehealth care from ${formatSimpleStartingAt(HAIRLOSS_FINASTERIDE_PRICING)}. Prescribing is never guaranteed.`;
const SERVICE_DESCRIPTION =
  "Nationwide telehealth service connecting eligible adults with independent licensed providers for compounded hairloss formulation evaluation and ongoing care. Completing intake does not guarantee a prescription.";

const FAQ_ITEMS: TreatmentFaqItem[] = [
  {
    q: "What's the difference between the men's and women's options?",
    a: "Men and women can both be prescribed oral minoxidil. Beyond that, options differ: men have finasteride oral tablets and a topical spray formulated with finasteride; women have a separate oral compound formulation and a topical spray without finasteride (finasteride isn't appropriate for women who are or may become pregnant). All are compounded formulations prepared by a licensed compounding pharmacy, individualized to you rather than sold as a single fixed commercial product. Your licensed provider reviews your intake and recommends which formulation, if any, may be appropriate for your case; prescribing is never guaranteed.",
  },
  {
    q: "Is compounded hairloss treatment FDA-approved?",
    a: "No. These are compounded, individualized formulations, not FDA-approved products. Because they're prepared by a licensed compounding pharmacy specifically for you rather than manufactured and sold under a brand name, they should not be assumed identical to any FDA-approved commercial product. Beema only makes them available when legally permitted and when a licensed provider independently determines a formulation is clinically appropriate for you.",
  },
  {
    q: "How does online hairloss care through Beema work?",
    a: "Care starts with creating a secure account and completing a medical intake covering your health history, hair loss pattern, and goals, at your own pace. A licensed provider reviews your intake and independently decides whether a compounded formulation may be appropriate for you; prescribing is never guaranteed. Beema Health's clinical provider network is led by Dr. Sean Arora, MD, though the clinician assigned to your case may vary by state licensure and availability.",
  },
  {
    q: "How much does hairloss treatment cost through Beema?",
    a: `${simplePricingSentence("Compounded oral minoxidil through Beema", HAIRLOSS_ORAL_MINOXIDIL_PRICING)} Finasteride (men) is ${simplePricingSentence("compounded finasteride", HAIRLOSS_FINASTERIDE_PRICING).replace(/^C/, "c")} The women's oral compound is ${simplePricingSentence("the women's oral compound", HAIRLOSS_WOMENS_COMPOUND_PRICING).replace(/^T/, "t")} Topical sprays are ${simplePricingSentence("the men's topical spray", HAIRLOSS_TOPICAL_MEN_PRICING).replace(/^T/, "t")} and ${simplePricingSentence("the women's topical spray", HAIRLOSS_TOPICAL_WOMEN_PRICING).replace(/^T/, "t")} All prices cover your provider consultation, prescription formulation, and expedited shipping. Questions about your plan? ${patientQuestionsGuidance()}`,
  },
  {
    q: "Does Beema serve patients nationwide?",
    a: "Yes, Beema Health is available to patients in all 50 U.S. states. Whether a specific compounded formulation is available to you still depends on your state's rules around compounded medications and pharmacy fulfillment in your area, and eligibility is always an individual clinical decision made by a licensed provider after reviewing your health history.",
  },
];

const WHATS_INCLUDED = [
  "Prescription Formulation",
  "Doctor Consultation & Visit",
  "Ongoing Doctor Care",
  "Expedited Shipping",
  { label: "Free learning resources", to: "/learn/" },
];

const ELIGIBILITY_POINTS = [
  "Adults 18 and older",
  "Eligibility considers hair loss pattern, health history, and current medications",
  "Final approval and formulation selection rests with a licensed provider",
];

export const Route = createFileRoute("/hairloss")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonicalUrl("/hairloss") },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/hairloss") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Compounded Hairloss Treatment", path: "/hairloss" },
          ]),
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(faqPageJsonLd(FAQ_ITEMS)),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          serviceJsonLd({
            name: "Compounded Hairloss Telehealth Care",
            description: SERVICE_DESCRIPTION,
            path: "/hairloss",
            serviceType: "Hairloss treatment telehealth service",
            reviewedByClinicalLead: false,
            dateModified: "2026-08-29",
            offer: {
              introPrice: HAIRLOSS_FINASTERIDE_PRICING.monthlyUsd,
              recurringPrice: HAIRLOSS_FINASTERIDE_PRICING.monthlyUsd,
            },
          }),
        ),
      },
    ],
  }),
  component: HairlossPage,
});

function HairlossPage() {
  const heroCta = resolveCta(CTA_IDS.hairloss_hero);
  const footerCta = resolveCta(CTA_IDS.hairloss_footer);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    trackPageViewed("hairloss");
  }, []);

  return (
    <MarketingLayout>
      <Section className="relative overflow-hidden bg-grad-hero">
        <div
          aria-hidden
          className="bg-mesh-glow mesh-drift pointer-events-none absolute inset-0 z-0"
        />
        <div
          aria-hidden
          className="bg-grain pointer-events-none absolute inset-0 z-0 text-foreground/[0.035]"
        />
        <div className="relative z-10">
          <TreatmentBreadcrumb current="Compounded Hairloss Treatment" />
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div>
              <SectionHeading
                as="h1"
                align="left"
                eyebrow="Nationwide telehealth hairloss care"
                title={
                  <>
                    <LineReveal>Compounded Hairloss Treatment, </LineReveal>
                    <LineReveal delay={0.1}>for men and women.</LineReveal>
                  </>
                }
                description="Beema Health connects eligible adults with independent licensed providers for individualized hairloss care. Completing intake does not guarantee a prescription."
                className="mx-0 max-w-xl text-left"
              />
              <motion.div
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.6,
                  delay: reduceMotion ? 0 : 0.4,
                  ease: EASE_OUT,
                }}
              >
                <MagneticButton>
                  <Button asChild size="xl">
                    <Link
                      to={heroCta.to}
                      search={heroCta.search}
                      onClick={heroCta.onClick}
                    >
                      {heroCta.label} <ArrowRight />
                    </Link>
                  </Button>
                </MagneticButton>
                <Button asChild size="xl" variant="outline">
                  <Link to="/hairloss/" hash="how-it-works">
                    How it works
                  </Link>
                </Button>
              </motion.div>
              <p className="mt-6 max-w-md text-2xl font-bold text-foreground">
                From {formatSimpleStartingAt(HAIRLOSS_FINASTERIDE_PRICING)}
              </p>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                Medication eligibility, formulation, and availability are
                determined by a licensed provider and applicable law.
              </p>
            </div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{
                duration: reduceMotion ? 0 : 0.7,
                delay: reduceMotion ? 0 : 0.2,
                ease: EASE_OUT,
              }}
              className="mx-auto w-full max-w-sm"
            >
              <TreatmentHeroArt
                icon={Droplet}
                label="Compounded Hairloss Treatment"
              />
              <TreatmentIncludedDropdown
                items={WHATS_INCLUDED}
                className="mt-6 w-full"
              />
            </motion.div>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <SectionHeading
          align="left"
          title="What is compounded hairloss treatment?"
          className="mx-0 max-w-2xl"
        />
        <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            Hair loss medicines usually work in one of two ways: some increase
            blood flow to your scalp, so hair follicles get more oxygen and
            nutrients, and others block a hormone that can shrink hair follicles
            over time. Depending on what your provider prescribes, these
            medicines may help slow hair loss and support the hair you still
            have.
          </p>
          <p>
            Beema offers compounded oral and topical formulations for both men
            and women, prepared by a licensed compounding pharmacy specifically
            for you - often combining multiple ingredients into one formulation
            rather than sold as a single fixed commercial product. Men and women
            are prescribed different formulations for some products, since some
            ingredients (like finasteride) aren't appropriate for women who are
            or may become pregnant.
          </p>
          <p>
            These formulations are not FDA-approved and are considered only when
            legally available and clinically appropriate. Which formulation, if
            any, may be appropriate for you is a decision your licensed provider
            makes individually.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/hairloss/" hash="faq">
              View FAQ <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Section>

      <HowItWorksSteps
        className="bg-muted/40"
        eyebrow="How it works"
        title="How Beema's hairloss care works"
        showCareFollowUpNote
      />

      <Section id="pricing" className="pt-0">
        <SectionHeading
          align="left"
          title="Choose your formulation"
          description="Your provider decides which formulation, if any, is clinically appropriate - this is a starting point, not a self-selected order."
          className="mx-0 max-w-2xl"
        />

        <h3 className="mt-10 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
          For Men
        </h3>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          <SimpleTreatmentPricingCard
            label="oral minoxidil"
            pricing={HAIRLOSS_ORAL_MINOXIDIL_PRICING}
          />
          <SimpleTreatmentPricingCard
            label="finasteride"
            pricing={HAIRLOSS_FINASTERIDE_PRICING}
          />
          <SimpleTreatmentPricingCard
            label="the men's topical spray"
            pricing={HAIRLOSS_TOPICAL_MEN_PRICING}
          />
        </div>

        <h3 className="mt-10 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
          For Women
        </h3>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          <SimpleTreatmentPricingCard
            label="oral minoxidil"
            pricing={HAIRLOSS_ORAL_MINOXIDIL_PRICING}
          />
          <SimpleTreatmentPricingCard
            label="the women's oral compound"
            pricing={HAIRLOSS_WOMENS_COMPOUND_PRICING}
          />
          <SimpleTreatmentPricingCard
            label="the women's topical spray"
            pricing={HAIRLOSS_TOPICAL_WOMEN_PRICING}
          />
        </div>

        <div className="mt-8">
          <SurfaceCard>
            <h3 className="text-lg font-semibold text-foreground">
              Who may be eligible
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Not everyone qualifies. Your provider weighs your hair loss
              pattern, health history, current medications, and applicable state
              law before making an independent decision.
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-3">
              {ELIGIBILITY_POINTS.map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
                  {t}
                </li>
              ))}
            </ul>
          </SurfaceCard>
        </div>
      </Section>

      <Section className="bg-muted/40 pt-0">
        <SectionHeading
          align="left"
          title="Safety and important information"
          className="mx-0 max-w-2xl"
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <SurfaceCard>
            <div className="flex gap-4">
              <ShieldCheck className="size-6 shrink-0 text-accent-foreground" />
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Prescription medical care
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  These formulations are prescription products and aren't
                  appropriate for everyone. They are compounded, not
                  FDA-approved, and considered only when legally available and
                  clinically appropriate.
                </p>
              </div>
            </div>
          </SurfaceCard>
          <SurfaceCard>
            <div className="flex gap-4">
              <ShieldCheck className="size-6 shrink-0 text-accent-foreground" />
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Talk to your provider
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Include your full medical history, possible contraindications,
                  side effects, and any medication interactions in your intake
                  questionnaire. After you complete intake and pay, you can ask
                  follow-up questions. Before then, email{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-primary underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  . For more on eligibility and warning signs, see{" "}
                  <Link to="/safety/" className="text-primary underline">
                    Safety &amp; eligibility
                  </Link>
                  .
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Clinical oversight: Beema Health&rsquo;s clinical provider network is
          led by {SEAN_ARORA_PROVIDER.displayName},{" "}
          {SEAN_ARORA_PROVIDER.credentials}, {SEAN_ARORA_PROVIDER.role} of{" "}
          {CLINICAL_PROVIDER_GROUP}. Licensed clinicians make every treatment
          decision independently, the clinician assigned to your care may vary
          by state licensure and availability.
        </p>
      </Section>

      <Section id="faq" className="scroll-mt-20 bg-muted/40 pt-0">
        <SectionHeading
          align="left"
          title="Frequently asked questions"
          description={
            <>
              For broader questions about pricing, shipping, and refills, see
              our full{" "}
              <Link to="/faq/" className="text-primary underline">
                FAQ
              </Link>
              .
            </>
          }
          className="mx-0 max-w-2xl"
        />
        <div className="mt-8">
          <TreatmentFaqSection items={FAQ_ITEMS} />
        </div>
      </Section>

      <Section className="pt-0">
        <div className="relative overflow-hidden rounded-4xl bg-primary px-6 py-14 text-center text-primary-foreground md:px-12">
          <div
            aria-hidden
            className="bg-mesh-primary-depth mesh-drift pointer-events-none absolute inset-0 z-0"
          />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold">
              <LineReveal>Start with your medical intake.</LineReveal>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
              Save your progress and finish at your own pace. A licensed
              provider makes every clinical decision independently, prescribing
              is never guaranteed.
            </p>
            <MagneticButton className="mt-8">
              <Button
                asChild
                size="xl"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Link
                  to={footerCta.to}
                  search={footerCta.search}
                  onClick={footerCta.onClick}
                >
                  {footerCta.label} <ArrowRight />
                </Link>
              </Button>
            </MagneticButton>
          </div>
        </div>
      </Section>
      <MoneyPageGuides path="/hairloss/" />
    </MarketingLayout>
  );
}

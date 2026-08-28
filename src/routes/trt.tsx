import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CheckCircle2, Pill, ShieldCheck } from "lucide-react";
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
  TRT_PRICING,
  formatSimpleStartingAt,
  simplePricingSentence,
} from "@/lib/simple-treatment-pricing";
import { patientQuestionsGuidance } from "@/lib/marketing-copy";
import { SUPPORT_EMAIL } from "@/lib/contact-info";
import { MoneyPageGuides } from "@/components/learn/MoneyPageGuides";

const TITLE = "Compounded Enclomiphene for TRT | Beema Health";
const DESCRIPTION = `Compounded enclomiphene for testosterone therapy in men, reviewed by licensed providers. Nationwide telehealth care at ${formatSimpleStartingAt(TRT_PRICING)}. Prescribing is never guaranteed.`;
const SERVICE_DESCRIPTION =
  "Nationwide telehealth service connecting eligible adult men with independent licensed providers for compounded enclomiphene evaluation and ongoing care. Completing intake does not guarantee a prescription.";

const FAQ_ITEMS: TreatmentFaqItem[] = [
  {
    q: "What is compounded enclomiphene, and is it testosterone?",
    a: "Enclomiphene is not testosterone. It's an oral medication that works on a different part of the body's hormone system to encourage your body to produce more of its own testosterone, rather than replacing testosterone directly the way an injection would. Beema's enclomiphene is compounded, meaning it's prepared by a licensed compounding pharmacy rather than manufactured and sold under a brand name. It is not FDA-approved, and it's made available only when it's legally permitted in your state and a licensed provider determines it's clinically appropriate for your individual case. To be considered, you'll complete a medical intake covering your health history, current medications, and goals, which a licensed provider reviews before deciding whether enclomiphene, or another option, may be appropriate.",
  },
  {
    q: "Is enclomiphene right for me?",
    a: "Whether enclomiphene is right for you depends on your health history, current medications, and a licensed provider's independent clinical judgment after reviewing your intake, not a fixed checklist. Beema's enclomiphene care is intended for adult men, and eligibility also depends on applicable state law where you live. Completing intake does not guarantee that enclomiphene, or any treatment, will be prescribed, and not everyone who applies will be approved.",
  },
  {
    q: "How does online TRT care through Beema work?",
    a: "Care starts with creating a secure account and completing a medical intake questionnaire covering your health history, current medications, and goals, at your own pace. A licensed provider then reviews your intake and independently decides whether compounded enclomiphene may be appropriate for you; prescribing is never guaranteed. Beema Health's clinical provider network is led by Dr. Sean Arora, MD, though the clinician assigned to your case may vary by state licensure and availability. If approved, your plan includes the doctor consultation, prescription medication, ongoing doctor follow-up, and expedited shipping.",
  },
  {
    q: "How much does TRT cost through Beema?",
    a: `${simplePricingSentence("Compounded enclomiphene through Beema", TRT_PRICING)} That covers your provider consultation and ongoing doctor care, prescription medication, and expedited shipping. Dose adjustments within compounded enclomiphene do not change the monthly price. Questions about your plan? ${patientQuestionsGuidance()}`,
  },
  {
    q: "Is compounded enclomiphene FDA-approved?",
    a: "No. Compounded enclomiphene is not FDA-approved. It's prepared individually by a licensed compounding pharmacy rather than manufactured and approved as a standardized branded drug, so it should not be assumed identical in formulation, strength, or effect to any FDA-approved medication. Beema only makes it available when legally permitted under applicable state and federal rules and when a licensed provider independently determines it's clinically appropriate for your specific case.",
  },
  {
    q: "Does Beema serve patients nationwide?",
    a: "Yes, Beema Health is available to patients in all 50 U.S. states, so you can start your medical intake no matter where you live. Whether compounded enclomiphene specifically is available to you still depends on your state's rules around compounded medications and pharmacy fulfillment in your area, and eligibility is always an individual clinical decision made by a licensed provider after reviewing your health history and current medications.",
  },
];

const WHATS_INCLUDED = [
  "Prescription Medication",
  "Doctor Consultation & Visit",
  "Ongoing Doctor Care",
  "Expedited Shipping",
  { label: "Free learning resources", to: "/learn/" },
];

const ELIGIBILITY_POINTS = [
  "Adult men, 18 and older",
  "Eligibility considers health history and current medications",
  "Final approval rests with a licensed provider and depends on applicable state law",
];

export const Route = createFileRoute("/trt")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonicalUrl("/trt") },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/trt") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "TRT (Compounded Enclomiphene)", path: "/trt" },
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
            name: "Compounded Enclomiphene TRT Telehealth Care",
            description: SERVICE_DESCRIPTION,
            path: "/trt",
            serviceType: "Testosterone therapy telehealth service",
            reviewedByClinicalLead: false,
            dateModified: "2026-08-27",
            offer: {
              introPrice: TRT_PRICING.monthlyUsd,
              recurringPrice: TRT_PRICING.monthlyUsd,
            },
          }),
        ),
      },
    ],
  }),
  component: TrtPage,
});

function TrtPage() {
  const heroCta = resolveCta(CTA_IDS.trt_hero);
  const footerCta = resolveCta(CTA_IDS.trt_footer);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    trackPageViewed("trt");
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
          <TreatmentBreadcrumb current="TRT (Compounded Enclomiphene)" />
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div>
              <SectionHeading
                as="h1"
                align="left"
                eyebrow="Nationwide telehealth TRT care"
                title={
                  <>
                    <LineReveal>Compounded Enclomiphene, </LineReveal>
                    <LineReveal delay={0.1}>
                      for men who want their own testosterone back up.
                    </LineReveal>
                  </>
                }
                description="Beema Health connects eligible adult men with independent licensed providers for individualized testosterone care. Completing intake does not guarantee a prescription."
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
                  <Link to="/trt/" hash="how-it-works">
                    How it works
                  </Link>
                </Button>
              </motion.div>
              <p className="mt-6 max-w-md text-2xl font-bold text-foreground">
                {formatSimpleStartingAt(TRT_PRICING)}
              </p>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                Medication eligibility and availability are determined by a
                licensed provider and applicable law.
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
              <TreatmentHeroArt icon={Pill} label="Compounded Enclomiphene" />
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
          title="What is enclomiphene?"
          className="mx-0 max-w-2xl"
        />
        <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            Testosterone is a hormone that plays a role in energy, mood, muscle,
            and sex drive in men. If a lab test shows your testosterone is low,
            enclomiphene signals your brain to tell your body to make more
            testosterone on its own. That's different from a testosterone shot,
            which puts testosterone directly into your body instead of asking
            your body to make its own.
          </p>
          <p>
            Enclomiphene is an oral medication that works differently than
            injectable testosterone: instead of replacing testosterone directly,
            it works on a different part of your hormone system to encourage
            your body to produce more of its own.
          </p>
          <p>
            Beema's compounded enclomiphene is prepared by a licensed
            compounding pharmacy specifically for you. It is not FDA-approved
            and is considered only when legally available and clinically
            appropriate. Whether it's an appropriate option for you is a
            decision your licensed provider makes individually.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/trt/" hash="faq">
              View FAQ <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Section>

      <HowItWorksSteps
        className="bg-muted/40"
        eyebrow="How it works"
        title="How Beema's TRT care works"
        showCareFollowUpNote
      />

      <Section id="pricing" className="pt-0">
        <div className="grid gap-10 lg:grid-cols-2">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE_OUT }}
          >
            <SurfaceCard className="h-full">
              <h3 className="text-lg font-semibold text-foreground">
                Who may be eligible
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Not everyone qualifies for TRT. Your provider weighs health
                history, current medications, and applicable state law before
                making an independent decision.
              </p>
              <ul className="mt-5 space-y-2">
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
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: reduceMotion ? 0 : 0.6,
              delay: reduceMotion ? 0 : 0.1,
              ease: EASE_OUT,
            }}
          >
            <SimpleTreatmentPricingCard
              label="TRT"
              pricing={TRT_PRICING}
              className="h-full"
            />
          </motion.div>
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
                  Enclomiphene is a prescription medication and isn't
                  appropriate for everyone. Compounded enclomiphene is not
                  FDA-approved and is considered only when legally available and
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
      <MoneyPageGuides path="/trt/" />
    </MarketingLayout>
  );
}

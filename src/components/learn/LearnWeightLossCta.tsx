import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { CTA_IDS, resolveCta, type CtaId } from "@/lib/cta-ids";
import {
  LEARN_CTA_TRUST_BODY,
  LEARN_GOOGLE_ADS_CERT_SENTENCE,
  LEARN_LEGITSCRIPT_STATUS_SENTENCE,
} from "@/lib/learn-trust-copy";
import { LegitScriptSeal } from "@/components/site/LegitScriptSeal";

export function LearnWeightLossCta({
  ctaId = CTA_IDS.learn_weight_loss,
}: {
  ctaId?: CtaId;
}) {
  const cta = resolveCta(ctaId);
  return (
    <div className="rounded-3xl border border-primary/30 bg-primary-soft/40 px-6 py-8 text-center">
      <h2 className="text-xl font-semibold text-foreground">
        Beema&apos;s live offering is medical weight-loss care
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {LEARN_CTA_TRUST_BODY}
      </p>
      <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {LEARN_LEGITSCRIPT_STATUS_SENTENCE} {LEARN_GOOGLE_ADS_CERT_SENTENCE}
      </p>
      <div className="mt-4 flex justify-center">
        <LegitScriptSeal />
      </div>
      <div className="mt-6">
        <MagneticButton>
          <Button asChild size="xl">
            <Link to={cta.to} search={cta.search} onClick={cta.onClick}>
              {cta.label} <ArrowRight />
            </Link>
          </Button>
        </MagneticButton>
      </div>
    </div>
  );
}

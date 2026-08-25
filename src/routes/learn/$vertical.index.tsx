import { createFileRoute } from "@tanstack/react-router";
import { LearnHubView } from "@/components/learn/LearnHubView";
import { LEARN_HUBS, LEARN_HUB_DATES } from "@/content/learn/hubs";
import { learnPath, type LearnVertical } from "@/content/learn/types";
import {
  learnDocumentMeta,
  learnHeadScripts,
  learnHubBreadcrumbs,
} from "@/lib/learn-seo";
import { medicalWebPageJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/learn/$vertical/")({
  head: ({ params }) => {
    const vertical = params.vertical as LearnVertical;
    const hub = LEARN_HUBS[vertical];
    if (!hub) return {};
    const path = learnPath(vertical);
    const { meta, links } = learnDocumentMeta({
      title: hub.meta.title,
      description: hub.meta.description,
      path,
      ogType: "website",
      ogDescription: hub.meta.ogDescription,
    });
    return {
      meta,
      links,
      scripts: learnHeadScripts({
        breadcrumbs: learnHubBreadcrumbs(vertical),
        medicalWebPage: medicalWebPageJsonLd({
          name: hub.meta.h1,
          description: hub.meta.description,
          path,
          dateModified: LEARN_HUB_DATES[vertical],
        }),
        faqs: hub.faqs,
      }),
    };
  },
  component: LearnVerticalHubPage,
});

function LearnVerticalHubPage() {
  const { vertical } = Route.useParams();
  return <LearnHubView vertical={vertical as LearnVertical} />;
}

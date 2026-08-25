import { createFileRoute, notFound } from "@tanstack/react-router";
import { LearnArticleView } from "@/components/learn/LearnArticleView";
import { getArticle } from "@/content/learn/registry";
import { learnPath } from "@/content/learn/types";
import {
  learnArticleBreadcrumbs,
  learnArticleJsonLd,
  learnDocumentMeta,
  learnHeadScripts,
} from "@/lib/learn-seo";

export const Route = createFileRoute("/learn/$vertical/$slug")({
  loader: ({ params }) => {
    const article = getArticle(params.vertical, params.slug);
    if (!article) throw notFound();
    return article;
  },
  head: ({ loaderData: article }) => {
    if (!article) return {};
    const path = learnPath(article.vertical, article.slug);
    const { meta, links } = learnDocumentMeta({
      title: article.title,
      description: article.description,
      path,
      ogType: "article",
    });
    return {
      meta,
      links,
      scripts: learnHeadScripts({
        breadcrumbs: learnArticleBreadcrumbs(article),
        medicalWebPage: learnArticleJsonLd(article),
        faqs: article.faqs,
      }),
    };
  },
  component: LearnArticlePage,
});

function LearnArticlePage() {
  const article = Route.useLoaderData();
  return <LearnArticleView article={article} />;
}

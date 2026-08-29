import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Paused 2026-08-28: not selling TRT/enclomiphene for now. Full page content
 * lives in git history (see commit a5bf351c and later on
 * feature/new-treatment-pages) - restore by reverting this file, re-adding
 * the nav/footer/sitemap/llms.txt entries removed in the same commit that
 * added this stub, and un-disallowing /trt in robots.txt.
 *
 * Also: when this returns, do NOT market it as "TRT" - enclomiphene is
 * pharmacologically distinct from testosterone replacement therapy (it
 * stimulates the body's own production rather than replacing testosterone
 * directly). See docs/features/treatment-pages.md and the
 * "TRT vs enclomiphene" learn article for the naming rule and the
 * educational distinction.
 */
export const Route = createFileRoute("/trt")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Paused 2026-08-28: NAD+ and sermorelin (the only Wellness products) are
 * both paused, so the category hub has nothing to show. Full page content
 * lives in git history (see commit 8733aece and later on
 * feature/new-treatment-pages) - restore by reverting this file once NAD+
 * and/or sermorelin come back, re-adding the nav/footer/sitemap/llms.txt
 * entries removed in the same commit that added this stub, and
 * un-disallowing /wellness in robots.txt.
 */
export const Route = createFileRoute("/wellness")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Paused 2026-08-28: not selling sermorelin for now. Full page content lives
 * in git history (see commit a5bf351c and later on
 * feature/new-treatment-pages) - restore by reverting this file, re-adding
 * the nav/footer/sitemap/llms.txt entries removed in the same commit that
 * added this stub, and un-disallowing /sermorelin in robots.txt.
 */
export const Route = createFileRoute("/sermorelin")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});

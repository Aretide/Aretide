import {
  INITIAL_RESEARCH_DATE_MODIFIED,
  INITIAL_RESEARCH_DESCRIPTION,
  INITIAL_RESEARCH_PATH,
  INITIAL_RESEARCH_TITLE,
} from "@/lib/learn/initial-research";
import {
  RESISTANCE_TRAINING_DATE_MODIFIED,
  RESISTANCE_TRAINING_DESCRIPTION,
  RESISTANCE_TRAINING_PATH,
  RESISTANCE_TRAINING_TITLE,
} from "@/lib/learn/resistance-training";
import {
  REST_INTERVALS_DATE_MODIFIED,
  REST_INTERVALS_DESCRIPTION,
  REST_INTERVALS_PATH,
  REST_INTERVALS_TITLE,
} from "@/lib/learn/rest-intervals";
import {
  SEMA_VS_TIRZ_DATE_MODIFIED,
  SEMA_VS_TIRZ_DESCRIPTION,
  SEMA_VS_TIRZ_PATH,
  SEMA_VS_TIRZ_TITLE,
} from "@/lib/learn/semaglutide-vs-tirzepatide";

export type LegacyLearnGuide = {
  path: string;
  title: string;
  description: string;
  lastmod: string;
};

/**
 * Pre-existing /learn/{slug} guides that predate the vertical URL system.
 * Keep them linked from the learn index and weight-loss hub so they are not
 * orphaned. They are not glob-registered articles.
 */
export const LEGACY_LEARN_GUIDES: readonly LegacyLearnGuide[] = [
  {
    path: INITIAL_RESEARCH_PATH,
    title: INITIAL_RESEARCH_TITLE,
    description: INITIAL_RESEARCH_DESCRIPTION,
    lastmod: INITIAL_RESEARCH_DATE_MODIFIED,
  },
  {
    path: RESISTANCE_TRAINING_PATH,
    title: RESISTANCE_TRAINING_TITLE,
    description: RESISTANCE_TRAINING_DESCRIPTION,
    lastmod: RESISTANCE_TRAINING_DATE_MODIFIED,
  },
  {
    path: REST_INTERVALS_PATH,
    title: REST_INTERVALS_TITLE,
    description: REST_INTERVALS_DESCRIPTION,
    lastmod: REST_INTERVALS_DATE_MODIFIED,
  },
  {
    path: SEMA_VS_TIRZ_PATH,
    title: SEMA_VS_TIRZ_TITLE,
    description: SEMA_VS_TIRZ_DESCRIPTION,
    lastmod: SEMA_VS_TIRZ_DATE_MODIFIED,
  },
];

import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  LEARN_INDEX_PATH,
  LEARN_VERTICAL_H1_LABELS,
  learnPath,
  type LearnVertical,
} from "@/content/learn/types";
import { Fragment } from "react";

type Crumb = { label: string; to?: string };

export function LearnBreadcrumb({
  vertical,
  current,
}: {
  vertical?: LearnVertical;
  current?: string;
}) {
  const crumbs: Crumb[] = [
    { label: "Home", to: "/" },
    {
      label: "Learn",
      to: current || vertical ? LEARN_INDEX_PATH : undefined,
    },
  ];
  if (vertical) {
    crumbs.push({
      label: LEARN_VERTICAL_H1_LABELS[vertical],
      to: current ? learnPath(vertical) : undefined,
    });
  }
  if (current) {
    crumbs.push({ label: current });
  }

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isLast || !crumb.to ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.to}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

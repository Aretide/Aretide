import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { isLearnVertical } from "@/content/learn/types";

export const Route = createFileRoute("/learn/$vertical")({
  loader: ({ params }) => {
    if (!isLearnVertical(params.vertical)) throw notFound();
    return { vertical: params.vertical };
  },
  component: LearnVerticalLayout,
});

function LearnVerticalLayout() {
  return <Outlet />;
}

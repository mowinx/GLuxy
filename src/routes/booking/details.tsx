import { createFileRoute } from "@tanstack/react-router";
import { DetailsPage, parseBook } from "@/components/luxy/pages-market";
export const Route = createFileRoute("/booking/details")({
  validateSearch: (raw) => parseBook(raw as Record<string, unknown>),
  component: function Page() {
    return <DetailsPage search={Route.useSearch()} />;
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { SummaryPage, parseBook } from "@/components/luxy/pages-market";
export const Route = createFileRoute("/booking/summary")({
  validateSearch: (raw) => parseBook(raw as Record<string, unknown>),
  component: function Page() {
    return <SummaryPage search={Route.useSearch()} />;
  },
});

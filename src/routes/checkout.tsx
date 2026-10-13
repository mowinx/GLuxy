import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage, parseDetail } from "@/components/luxy/pages-market";
import { FlowHeader } from "@/components/luxy/shell";
export const Route = createFileRoute("/checkout")({
  validateSearch: (raw) => parseDetail(raw as Record<string, unknown>),
  component: function Page() {
    return (
      <div className="min-h-screen bg-page">
        <FlowHeader />
        <CheckoutPage search={Route.useSearch()} />
      </div>
    );
  },
});

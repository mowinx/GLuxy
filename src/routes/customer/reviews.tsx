import { createFileRoute } from "@tanstack/react-router";
import { CustomerReviews } from "@/components/luxy/pages-work";
function Page() { return <CustomerReviews />; }
export const Route = createFileRoute("/customer/reviews")({
  component: Page,
});

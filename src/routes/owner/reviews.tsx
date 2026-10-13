import { createFileRoute } from "@tanstack/react-router";
import { OwnerReviews } from "@/components/luxy/pages-work";
function Page() { return <OwnerReviews />; }
export const Route = createFileRoute("/owner/reviews")({
  component: Page,
});

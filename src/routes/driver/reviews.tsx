import { createFileRoute } from "@tanstack/react-router";
import { DriverReviews } from "@/components/luxy/pages-work";
function Page() { return <DriverReviews />; }
export const Route = createFileRoute("/driver/reviews")({
  component: Page,
});

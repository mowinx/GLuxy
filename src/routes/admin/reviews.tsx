import { createFileRoute } from "@tanstack/react-router";
import { AdminReviews } from "@/components/luxy/pages-admin";
function Page() { return <AdminReviews />; }
export const Route = createFileRoute("/admin/reviews")({
  component: Page,
});

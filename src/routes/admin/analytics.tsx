import { createFileRoute } from "@tanstack/react-router";
import { Coming } from "@/components/luxy/pages-admin";
function Page() { return <Coming title="Analytics" />; }
export const Route = createFileRoute("/admin/analytics")({
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import { Coming } from "@/components/luxy/pages-admin";
function Page() { return <Coming title="Promotions" />; }
export const Route = createFileRoute("/admin/promotions")({
  component: Page,
});

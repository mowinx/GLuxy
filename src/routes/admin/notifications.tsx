import { createFileRoute } from "@tanstack/react-router";
import { Coming } from "@/components/luxy/pages-admin";
function Page() { return <Coming title="Notifications" />; }
export const Route = createFileRoute("/admin/notifications")({
  component: Page,
});

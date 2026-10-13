import { createFileRoute } from "@tanstack/react-router";
import { AdminSettings } from "@/components/luxy/pages-admin";
function Page() { return <AdminSettings />; }
export const Route = createFileRoute("/admin/settings")({
  component: Page,
});

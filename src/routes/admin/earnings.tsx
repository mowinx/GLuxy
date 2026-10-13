import { createFileRoute } from "@tanstack/react-router";
import { AdminEarnings } from "@/components/luxy/pages-admin";
function Page() { return <AdminEarnings />; }
export const Route = createFileRoute("/admin/earnings")({
  component: Page,
});

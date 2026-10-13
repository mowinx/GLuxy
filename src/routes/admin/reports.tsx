import { createFileRoute } from "@tanstack/react-router";
import { AdminReports } from "@/components/luxy/pages-admin";
function Page() { return <AdminReports />; }
export const Route = createFileRoute("/admin/reports")({
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import { Coming } from "@/components/luxy/pages-admin";
function Page() { return <Coming title="Audit logs" />; }
export const Route = createFileRoute("/admin/audit-logs")({
  component: Page,
});

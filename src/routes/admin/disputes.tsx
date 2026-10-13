import { createFileRoute } from "@tanstack/react-router";
import { AdminDisputes } from "@/components/luxy/pages-admin";
function Page() { return <AdminDisputes />; }
export const Route = createFileRoute("/admin/disputes")({
  component: Page,
});

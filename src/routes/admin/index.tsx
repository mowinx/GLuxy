import { createFileRoute } from "@tanstack/react-router";
import { AdminHome } from "@/components/luxy/pages-admin";
function Page() { return <AdminHome />; }
export const Route = createFileRoute("/admin/")({
  component: Page,
});

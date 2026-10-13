import { createFileRoute } from "@tanstack/react-router";
import { AdminSearch } from "@/components/luxy/pages-admin";
function Page() { return <AdminSearch />; }
export const Route = createFileRoute("/admin/search")({
  component: Page,
});

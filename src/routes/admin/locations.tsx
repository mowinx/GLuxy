import { createFileRoute } from "@tanstack/react-router";
import { AdminLocations } from "@/components/luxy/pages-admin";
function Page() { return <AdminLocations />; }
export const Route = createFileRoute("/admin/locations")({
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import { AdminVehicles } from "@/components/luxy/pages-admin";
function Page() { return <AdminVehicles />; }
export const Route = createFileRoute("/admin/vehicles")({
  component: Page,
});

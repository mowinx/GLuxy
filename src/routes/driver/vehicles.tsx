import { createFileRoute } from "@tanstack/react-router";
import { DriverVehicles } from "@/components/luxy/pages-work";
function Page() { return <DriverVehicles />; }
export const Route = createFileRoute("/driver/vehicles")({
  component: Page,
});

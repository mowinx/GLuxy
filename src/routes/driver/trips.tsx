import { createFileRoute } from "@tanstack/react-router";
import { DriverTrips } from "@/components/luxy/pages-work";
function Page() { return <DriverTrips />; }
export const Route = createFileRoute("/driver/trips")({
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import { OwnerDrivers } from "@/components/luxy/pages-work";
function Page() { return <OwnerDrivers />; }
export const Route = createFileRoute("/owner/drivers")({
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import { DriverSettings } from "@/components/luxy/pages-work";
function Page() { return <DriverSettings />; }
export const Route = createFileRoute("/driver/settings")({
  component: Page,
});

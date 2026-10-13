import { createFileRoute } from "@tanstack/react-router";
import { OwnerSettings } from "@/components/luxy/pages-work";
function Page() { return <OwnerSettings />; }
export const Route = createFileRoute("/owner/settings")({
  component: Page,
});

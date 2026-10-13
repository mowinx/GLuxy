import { createFileRoute } from "@tanstack/react-router";
import { OwnerHome } from "@/components/luxy/pages-work";
function Page() { return <OwnerHome />; }
export const Route = createFileRoute("/owner/")({
  component: Page,
});

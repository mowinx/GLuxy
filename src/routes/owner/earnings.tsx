import { createFileRoute } from "@tanstack/react-router";
import { OwnerEarnings } from "@/components/luxy/pages-work";
function Page() { return <OwnerEarnings />; }
export const Route = createFileRoute("/owner/earnings")({
  component: Page,
});

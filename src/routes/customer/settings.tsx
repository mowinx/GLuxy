import { createFileRoute } from "@tanstack/react-router";
import { CustomerSettings } from "@/components/luxy/pages-work";
function Page() { return <CustomerSettings />; }
export const Route = createFileRoute("/customer/settings")({
  component: Page,
});

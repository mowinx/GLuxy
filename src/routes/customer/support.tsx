import { createFileRoute } from "@tanstack/react-router";
import { CustomerSupport } from "@/components/luxy/pages-work";
function Page() { return <CustomerSupport />; }
export const Route = createFileRoute("/customer/support")({
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import { CustomerHome } from "@/components/luxy/pages-work";
function Page() { return <CustomerHome />; }
export const Route = createFileRoute("/customer/")({
  component: Page,
});

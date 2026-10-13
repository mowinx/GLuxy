import { createFileRoute } from "@tanstack/react-router";
import { DriverHome } from "@/components/luxy/pages-work";
function Page() { return <DriverHome />; }
export const Route = createFileRoute("/driver/")({
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import { NotificationsStub } from "@/components/luxy/pages-work";
function Page() { return <NotificationsStub />; }
export const Route = createFileRoute("/customer/notifications")({
  component: Page,
});

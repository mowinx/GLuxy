import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/components/luxy/pages-work";
function Page() { return <CalendarPage role="driver" />; }
export const Route = createFileRoute("/driver/calendar")({
  component: Page,
});

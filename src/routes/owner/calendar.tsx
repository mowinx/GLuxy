import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/components/luxy/pages-work";
function Page() { return <CalendarPage role="owner" />; }
export const Route = createFileRoute("/owner/calendar")({
  component: Page,
});

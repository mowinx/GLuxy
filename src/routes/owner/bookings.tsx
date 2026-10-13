import { createFileRoute } from "@tanstack/react-router";
import { OwnerBookings } from "@/components/luxy/pages-work";
function Page() { return <OwnerBookings />; }
export const Route = createFileRoute("/owner/bookings")({
  component: Page,
});

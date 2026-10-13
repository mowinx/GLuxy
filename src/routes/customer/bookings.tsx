import { createFileRoute } from "@tanstack/react-router";
import { CustomerBookings } from "@/components/luxy/pages-work";
function Page() { return <CustomerBookings />; }
export const Route = createFileRoute("/customer/bookings")({
  component: Page,
});

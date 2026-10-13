import { createFileRoute } from "@tanstack/react-router";
import { AdminBookings } from "@/components/luxy/pages-admin";
function Page() { return <AdminBookings />; }
export const Route = createFileRoute("/admin/bookings")({
  component: Page,
});

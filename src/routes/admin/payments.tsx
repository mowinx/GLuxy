import { createFileRoute } from "@tanstack/react-router";
import { AdminPayments } from "@/components/luxy/pages-admin";
function Page() { return <AdminPayments />; }
export const Route = createFileRoute("/admin/payments")({
  component: Page,
});

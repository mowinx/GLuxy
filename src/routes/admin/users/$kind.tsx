import { createFileRoute } from "@tanstack/react-router";
import { AdminUsers } from "@/components/luxy/pages-admin";
function Page() { return <AdminUsers kind={Route.useParams().kind} />; }
export const Route = createFileRoute("/admin/users/$kind")({
  component: Page,
});

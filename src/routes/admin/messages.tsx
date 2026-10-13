import { createFileRoute } from "@tanstack/react-router";
import { Coming } from "@/components/luxy/pages-admin";
function Page() { return <Coming title="Messages" />; }
export const Route = createFileRoute("/admin/messages")({
  component: Page,
});

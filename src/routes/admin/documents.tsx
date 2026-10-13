import { createFileRoute } from "@tanstack/react-router";
import { Coming } from "@/components/luxy/pages-admin";
function Page() { return <Coming title="Documents" />; }
export const Route = createFileRoute("/admin/documents")({
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "@/components/luxy/bits";
function Page() { return <Stub title="Reports" copy="A downloadable owner report is not in this version." />; }
export const Route = createFileRoute("/owner/reports")({
  component: Page,
});

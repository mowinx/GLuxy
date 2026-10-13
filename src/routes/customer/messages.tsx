import { createFileRoute } from "@tanstack/react-router";
import { MessagesStub } from "@/components/luxy/pages-work";
function Page() { return <MessagesStub />; }
export const Route = createFileRoute("/customer/messages")({
  component: Page,
});

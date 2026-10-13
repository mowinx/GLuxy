import { createFileRoute } from "@tanstack/react-router";
import { InvitePage } from "@/components/luxy/pages-auth";
export const Route = createFileRoute("/invite/$inviteId")({
  component: function Page() {
    return <InvitePage inviteId={Route.useParams().inviteId} />;
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { OwnerWallet } from "@/components/luxy/pages-work";
function Page() { return <OwnerWallet />; }
export const Route = createFileRoute("/owner/wallet")({
  component: Page,
});

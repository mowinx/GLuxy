import { createFileRoute } from "@tanstack/react-router";
import { CustomerWallet } from "@/components/luxy/pages-work";
function Page() { return <CustomerWallet />; }
export const Route = createFileRoute("/customer/wallet")({
  component: Page,
});

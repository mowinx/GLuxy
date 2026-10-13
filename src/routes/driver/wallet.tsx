import { createFileRoute } from "@tanstack/react-router";
import { DriverWallet } from "@/components/luxy/pages-work";
function Page() { return <DriverWallet />; }
export const Route = createFileRoute("/driver/wallet")({
  component: Page,
});

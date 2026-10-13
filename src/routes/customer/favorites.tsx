import { createFileRoute } from "@tanstack/react-router";
import { CustomerFavorites } from "@/components/luxy/pages-work";
function Page() { return <CustomerFavorites />; }
export const Route = createFileRoute("/customer/favorites")({
  component: Page,
});

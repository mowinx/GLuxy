import { createFileRoute } from "@tanstack/react-router";
import { CustomerCars } from "@/components/luxy/pages-work";
function Page() { return <CustomerCars />; }
export const Route = createFileRoute("/customer/cars")({
  component: Page,
});

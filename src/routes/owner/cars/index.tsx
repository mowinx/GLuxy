import { createFileRoute } from "@tanstack/react-router";
import { OwnerCars } from "@/components/luxy/pages-work";
function Page() { return <OwnerCars />; }
export const Route = createFileRoute("/owner/cars/")({
  component: Page,
});

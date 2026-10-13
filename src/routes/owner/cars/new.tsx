import { createFileRoute } from "@tanstack/react-router";
import { OwnerNewCar } from "@/components/luxy/pages-work";
function Page() { return <OwnerNewCar />; }
export const Route = createFileRoute("/owner/cars/new")({
  component: Page,
});

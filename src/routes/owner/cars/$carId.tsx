import { createFileRoute } from "@tanstack/react-router";
import { OwnerCarPage } from "@/components/luxy/pages-work";
function Page() { const { carId } = Route.useParams(); return <OwnerCarPage carId={carId} />; }
export const Route = createFileRoute("/owner/cars/$carId")({
  component: Page,
});

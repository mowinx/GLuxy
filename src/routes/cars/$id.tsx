import { createFileRoute } from "@tanstack/react-router";
import { CarPage } from "@/components/luxy/pages-market";
export const Route = createFileRoute("/cars/$id")({
  component: function Page() {
    return <CarPage id={Route.useParams().id} />;
  },
});

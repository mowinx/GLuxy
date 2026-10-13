import { createFileRoute } from "@tanstack/react-router";
import { BookingByCode } from "@/components/luxy/pages-trip";
export const Route = createFileRoute("/booking/$code")({
  component: function Page() {
    return <BookingByCode code={Route.useParams().code} />;
  },
});

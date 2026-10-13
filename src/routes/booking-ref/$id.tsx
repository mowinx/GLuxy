import { createFileRoute } from "@tanstack/react-router";
import { BookingById } from "@/components/luxy/pages-trip";
import { FlowHeader } from "@/components/luxy/shell";
export const Route = createFileRoute("/booking-ref/$id")({
  component: function Page() {
    return (
      <div className="min-h-screen bg-page">
        <FlowHeader />
        <BookingById id={Route.useParams().id} />
      </div>
    );
  },
});

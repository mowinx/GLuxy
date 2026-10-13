import { createFileRoute, Outlet } from "@tanstack/react-router";
import { FlowHeader } from "@/components/luxy/shell";
export const Route = createFileRoute("/booking")({
  component: function Layout() {
    return (
      <div className="min-h-screen bg-page">
        <FlowHeader />
        <Outlet />
      </div>
    );
  },
});

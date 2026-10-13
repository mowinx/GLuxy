import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashShell, RoleGuard } from "@/components/luxy/shell";
export const Route = createFileRoute("/driver")({
  component: function Layout() {
    return (
      <RoleGuard role="driver">
        <DashShell role="driver">
          <Outlet />
        </DashShell>
      </RoleGuard>
    );
  },
});

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashShell, RoleGuard } from "@/components/luxy/shell";
export const Route = createFileRoute("/owner")({
  component: function Layout() {
    return (
      <RoleGuard role="owner">
        <DashShell role="owner">
          <Outlet />
        </DashShell>
      </RoleGuard>
    );
  },
});

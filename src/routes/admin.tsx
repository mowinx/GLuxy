import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashShell, RoleGuard } from "@/components/luxy/shell";
export const Route = createFileRoute("/admin")({
  component: function Layout() {
    return (
      <RoleGuard role="admin">
        <DashShell role="admin">
          <Outlet />
        </DashShell>
      </RoleGuard>
    );
  },
});

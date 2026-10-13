import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashShell, RoleGuard } from "@/components/luxy/shell";
export const Route = createFileRoute("/customer")({
  component: function Layout() {
    return (
      <RoleGuard role="customer">
        <DashShell role="customer">
          <Outlet />
        </DashShell>
      </RoleGuard>
    );
  },
});

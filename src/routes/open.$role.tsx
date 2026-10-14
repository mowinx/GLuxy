import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashShell } from "@/components/luxy/shell";
import { AdminHome } from "@/components/luxy/pages-admin";
import { CustomerHome, DriverHome, OwnerHome } from "@/components/luxy/pages-work";
import { useLuxy } from "@/lib/luxy/store";
import type { Role } from "@/lib/luxy/types";

const EMAIL: Record<string, string> = {
  customer: "ada@luxy.demo",
  owner: "chidi@luxy.demo",
  driver: "tunde@luxy.demo",
  admin: "victor@luxy.demo",
};

export const Route = createFileRoute("/open/$role")({
  component: OpenRole,
});

function OpenRole() {
  const { role } = Route.useParams();
  const email = EMAIL[role] ?? EMAIL.customer;
  const signed = useState(() => useLuxy.getState().enterDemo(email) ?? "customer")[0] as Role;
  return (
    <DashShell role={signed}>
      {signed === "owner" ? <OwnerHome /> : signed === "driver" ? <DriverHome /> : signed === "admin" ? <AdminHome /> : <CustomerHome />}
    </DashShell>
  );
}

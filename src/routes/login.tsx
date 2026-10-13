import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/luxy/pages-auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

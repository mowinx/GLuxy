import { createFileRoute } from "@tanstack/react-router";
import { SignupPage } from "@/components/luxy/pages-auth";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

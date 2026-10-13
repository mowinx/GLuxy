import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/luxy/pages-market";

export const Route = createFileRoute("/")({
  component: HomePage,
});

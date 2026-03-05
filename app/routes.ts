import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("view", "routes/view.tsx"),
  route("api/notes", "routes/api.notes.ts"),
] satisfies RouteConfig;

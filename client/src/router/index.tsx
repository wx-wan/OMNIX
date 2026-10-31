import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "users", element: <Users /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);

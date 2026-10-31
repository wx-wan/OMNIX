import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import CrmBoard from "@/pages/CrmBoard";
import Settings from "@/pages/Settings";
import Showcase from "@/pages/Showcase";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "users", element: <Users /> },
      { path: "crm", element: <CrmBoard /> },
      { path: "showcase", element: <Showcase /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);

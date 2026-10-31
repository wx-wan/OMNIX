import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import CrmBoard from "@/pages/CrmBoard";
import Customers from "@/pages/Customers";
import Products from "@/pages/Products";
import Settings from "@/pages/Settings";
import Showcase from "@/pages/Showcase";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

const protectedRoutes = [
  { index: true, element: <Dashboard /> },
  { path: "users", element: <Users /> },
  { path: "crm", element: <CrmBoard /> },
  { path: "customers", element: <Customers /> },
  { path: "products", element: <Products /> },
  { path: "showcase", element: <Showcase /> },
  { path: "settings", element: <Settings /> },
];

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: protectedRoutes,
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

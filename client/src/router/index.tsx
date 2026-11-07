import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Dashboard from "@/pages/Dashboard";
import CrmBoard from "@/pages/CrmBoard";
import Contacts from "@/pages/Contacts";
import DealForm from "@/pages/DealForm";
import Products from "@/pages/Products";
import Quotations from "@/pages/Quotations";
import QuotationDetail from "@/pages/QuotationDetail";
import QuotationExportPage from "@/pages/QuotationExportPage";
import QuotationTemplates from "@/pages/QuotationTemplates";
import Settings from "@/pages/Settings";
import Showcase from "@/pages/Showcase";
import FeeSheet from "@/pages/FeeSheet";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

const protectedRoutes = [
  { index: true, element: <Dashboard /> },
  { path: "contacts", element: <Contacts /> },
  { path: "crm", element: <CrmBoard /> },
  { path: "crm/deals/new", element: <DealForm /> },
  { path: "crm/deals/:id", element: <DealForm /> },
  { path: "crm/deals/:id/fees", element: <FeeSheet /> },
  { path: "products", element: <Products /> },
  { path: "quotations", element: <Quotations /> },
  { path: "quotations/:id", element: <QuotationDetail /> },
  { path: "quotation-templates", element: <QuotationTemplates /> },
  { path: "showcase", element: <Showcase /> },
  { path: "settings", element: <Settings /> },
];

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    // 报价单导出页：独立新标签页全屏编辑器（不经 AppShell，参考小满导出器）
    path: "/quotations/:id/export",
    element: (
      <RequireAuth>
        <QuotationExportPage />
      </RequireAuth>
    ),
  },
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

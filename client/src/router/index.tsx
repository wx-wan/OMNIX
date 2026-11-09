import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Dashboard from "@/pages/Dashboard";
import CrmBoard from "@/pages/CrmBoard";
import Contacts from "@/pages/Contacts";
import DealForm from "@/pages/DealForm";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Quotations from "@/pages/Quotations";
import QuotationDetail from "@/pages/QuotationDetail";
import QuotationExportPage from "@/pages/QuotationExportPage";
import QuotationTemplates from "@/pages/QuotationTemplates";
import QuotationTemplateEditor from "@/pages/QuotationTemplateEditor";
import QuotationTemplatePreview from "@/pages/QuotationTemplatePreview";
import Settings from "@/pages/Settings";
import Showcase from "@/pages/Showcase";
import FeeSheet from "@/pages/FeeSheet";
import Fees from "@/pages/Fees";
import DesignOrders from "@/pages/DesignOrders";
import DesignOrdersList from "@/pages/DesignOrdersList";
import SampleOrders from "@/pages/SampleOrders";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

const protectedRoutes = [
  { index: true, element: <Dashboard /> },
  { path: "contacts", element: <Contacts /> },
  { path: "crm", element: <CrmBoard /> },
  { path: "crm/deals/new", element: <DealForm /> },
  { path: "crm/deals/:id", element: <DealForm /> },
  { path: "crm/deals/:id/fees", element: <FeeSheet /> },
  { path: "fees", element: <Fees /> },
  { path: "crm/deals/:id/design-orders", element: <DesignOrders /> },
  { path: "design-orders", element: <DesignOrdersList /> },
  { path: "crm/deals/:id/sample-orders", element: <SampleOrders /> },
  { path: "products", element: <Products /> },
  { path: "products/:id", element: <ProductDetail /> },
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
    // 单据模板设计器：独立新标签页全屏编辑器（新建 / 编辑，不经 AppShell）
    path: "/quotation-templates/new",
    element: (
      <RequireAuth>
        <QuotationTemplateEditor />
      </RequireAuth>
    ),
  },
  {
    path: "/quotation-templates/:id/edit",
    element: (
      <RequireAuth>
        <QuotationTemplateEditor />
      </RequireAuth>
    ),
  },
  {
    // 单据模板预览：独立新标签页只读预览（不经 AppShell）
    path: "/quotation-templates/:id/preview",
    element: (
      <RequireAuth>
        <QuotationTemplatePreview />
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

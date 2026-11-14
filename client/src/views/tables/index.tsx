import { useLocation } from "react-router";
import BasicTable from "src/components/tables/basic-table/BasicTable";
import CheckboxTable from "src/components/tables/checkbox-table/CheckboxTable";
import HoverTable from "src/components/tables/hover-table/HoverTable";
import StripedRowTable from "src/components/tables/striped-row-table/StripedRowTable";
import { ReactTableDemo } from "src/components/tables/react-table-demo/ReactTableDemo";
import type { TableVariant } from "src/components/tables/react-table-demo/ReactTableDemo";

/**
 * D3 · 线上 18 个 tables 站内路由
 *
 * /shadcn-tables/*（4 个）直接复用免费版已有的 4 个表格组件；
 * /react-tables/*（14 个）交给 ReactTableDemo 按 variant 开关功能。
 */

type ShadcnEntry = { title: string; Comp: () => React.JSX.Element };
type ReactEntry = { title: string; variant: TableVariant };

const SHADCN_ROUTES: Record<string, ShadcnEntry> = {
  "/shadcn-tables/basic": { title: "Basic Table", Comp: BasicTable },
  "/shadcn-tables/striped-row": { title: "Striped Row Table", Comp: StripedRowTable },
  "/shadcn-tables/hover-table": { title: "Hover Table", Comp: HoverTable },
  "/shadcn-tables/checkbox-table": { title: "Checkbox Table", Comp: CheckboxTable },
};

const REACT_ROUTES: Record<string, ReactEntry> = {
  "/react-tables/basic": { title: "Basic Table", variant: "basic" },
  "/react-tables/dense": { title: "Dense Table", variant: "dense" },
  "/react-tables/sorting": { title: "Sorting Table", variant: "sorting" },
  "/react-tables/filtering": { title: "Filtering Table", variant: "filtering" },
  "/react-tables/pagination": { title: "Pagination Table", variant: "pagination" },
  "/react-tables/row-selection": { title: "Row Selection Table", variant: "row-selection" },
  "/react-tables/columnvisibility": { title: "Column Visibility Table", variant: "columnvisibility" },
  "/react-tables/editable": { title: "Editable Table", variant: "editable" },
  "/react-tables/sticky": { title: "Sticky Header Table", variant: "sticky" },
  "/react-tables/drag-drop": { title: "Drag & Drop Table", variant: "drag-drop" },
  "/react-tables/empty": { title: "Empty Table", variant: "empty" },
  "/react-tables/expanding": { title: "Expanding Table", variant: "expanding" },
  "/react-tables/user-datatable": { title: "User DataTable", variant: "user-datatable" },
  "/react-tables/order-datatable": { title: "Order DataTable", variant: "order-datatable" },
};

export const TABLE_VARIANT_PATHS = [
  ...Object.keys(SHADCN_ROUTES),
  ...Object.keys(REACT_ROUTES),
];

const TablesVariantPage = () => {
  const { pathname } = useLocation();

  const shadcn = SHADCN_ROUTES[pathname];
  if (shadcn) {
    const Comp = shadcn.Comp;
    return <Comp />;
  }

  const react = REACT_ROUTES[pathname];
  if (react) {
    return <ReactTableDemo variant={react.variant} title={react.title} />;
  }

  return null;
};

export default TablesVariantPage;

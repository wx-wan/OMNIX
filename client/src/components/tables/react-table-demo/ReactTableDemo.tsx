import { Fragment, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  ExpandedState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * D3 · react-tables 变体
 *
 * 线上 demo 有 14 个 /react-tables/* 站内路由（basic / dense / sorting /
 * filtering / pagination / row-selection / columnvisibility / editable /
 * sticky / drag-drop / empty / expanding / user-datatable / order-datatable）。
 * 这里用一个 TanStack useReactTable 实例按 variant 开关行模型与控件，
 * 避免 14 份重复实现；线上 4 个 /shadcn-tables/* 则直接复用免费版组件。
 */

export type TableVariant =
  | "basic"
  | "dense"
  | "sorting"
  | "filtering"
  | "pagination"
  | "row-selection"
  | "columnvisibility"
  | "editable"
  | "sticky"
  | "drag-drop"
  | "empty"
  | "expanding"
  | "user-datatable"
  | "order-datatable";

type Row = {
  id: number;
  name: string;
  role: string;
  status: string;
  amount: number;
};

const DATA: Row[] = [
  { id: 1, name: "Olivia Rhye", role: "Designer", status: "Active", amount: 1250 },
  { id: 2, name: "Phoenix Baker", role: "Developer", status: "Active", amount: 2400 },
  { id: 3, name: "Lana Steiner", role: "Manager", status: "Pending", amount: 980 },
  { id: 4, name: "Demi Wilkinson", role: "Analyst", status: "Active", amount: 1760 },
  { id: 5, name: "Candice Wu", role: "Support", status: "Inactive", amount: 640 },
  { id: 6, name: "Natali Craig", role: "Designer", status: "Active", amount: 3120 },
  { id: 7, name: "Drew Cano", role: "Developer", status: "Pending", amount: 1890 },
  { id: 8, name: "Orlando Diggs", role: "Manager", status: "Inactive", amount: 770 },
];

const FLAGS: Record<TableVariant, Record<string, boolean>> = {
  basic: {},
  dense: { dense: true },
  sorting: { sorting: true },
  filtering: { filtering: true },
  pagination: { pagination: true },
  "row-selection": { selection: true },
  columnvisibility: { visibility: true },
  editable: { editable: true },
  sticky: { sticky: true },
  "drag-drop": { drag: true },
  empty: { empty: true },
  expanding: { expanding: true },
  "user-datatable": { sorting: true, filtering: true, pagination: true, user: true },
  "order-datatable": { sorting: true, filtering: true, pagination: true, order: true },
};

const DESCRIPTIONS: Record<TableVariant, string> = {
  basic: "Plain core row model without extra features",
  dense: "Compact row height for dense data views",
  sorting: "Click a column header to sort",
  filtering: "Global filter across all columns",
  pagination: "Page through rows with a fixed page size",
  "row-selection": "Select individual rows or all rows",
  columnvisibility: "Toggle which columns are shown",
  editable: "Edit cell values inline",
  sticky: "Header stays visible while scrolling",
  "drag-drop": "Move rows up and down",
  empty: "Empty state with no rows",
  expanding: "Expand a row to see its detail",
  "user-datatable": "User records with sorting, filter and pagination",
  "order-datatable": "Order records with sorting, filter and pagination",
};

export function ReactTableDemo({
  variant,
  title,
}: {
  variant: TableVariant;
  title: string;
}) {
  const flags = FLAGS[variant];
  const [rows, setRows] = useState<Row[]>(DATA);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const columns = useMemo<ColumnDef<Row>[]>(() => {
    const base: ColumnDef<Row>[] = [
      {
        accessorKey: flags.user ? "name" : flags.order ? "id" : "name",
        header: flags.order ? "Order" : "Name",
        cell: ({ row }) => (flags.order ? `#${1000 + row.original.id}` : row.original.name),
      },
      { accessorKey: "role", header: flags.order ? "Customer" : "Role" },
      { accessorKey: "status", header: "Status" },
      {
        accessorKey: "amount",
        header: flags.order ? "Total" : "Amount",
        cell: ({ getValue }) => `$${(getValue() as number).toLocaleString()}`,
      },
    ];
    if (flags.selection) {
      base.unshift({
        id: "select",
        header: () => <span className="text-xs">All</span>,
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select row ${row.original.id}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      });
    }
    if (flags.drag) {
      base.push({
        id: "move",
        header: "Move",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label={`Move row ${row.original.id} up`}
              onClick={() => {
                const i = row.index;
                if (i <= 0) return;
                setRows((prev) => {
                  const next = [...prev];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  return next;
                });
              }}
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label={`Move row ${row.original.id} down`}
              onClick={() => {
                const i = row.index;
                setRows((prev) => {
                  if (i >= prev.length - 1) return prev;
                  const next = [...prev];
                  [next[i + 1], next[i]] = [next[i], next[i + 1]];
                  return next;
                });
              }}
            >
              ↓
            </Button>
          </div>
        ),
      });
    }
    if (flags.expanding) {
      base.unshift({
        id: "expand",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label={`Expand row ${row.original.id}`}
            onClick={row.getToggleExpandedHandler()}
          >
            {row.getIsExpanded() ? "−" : "+"}
          </Button>
        ),
      });
    }
    if (flags.editable) {
      // 把 name 列替换成可编辑输入
      const nameCol = base.find((c) => "accessorKey" in c && c.accessorKey === "name");
      if (nameCol) {
        Object.assign(nameCol, {
          cell: ({ row }: { row: { original: Row; index: number } }) => (
            <Input
              className="h-7 w-36"
              aria-label={`Edit name row ${row.original.id}`}
              value={row.original.name}
              onChange={(e) => {
                const value = e.target.value;
                setRows((prev) =>
                  prev.map((r) => (r.id === row.original.id ? { ...r, name: value } : r))
                );
              }}
            />
          ),
        });
      }
    }
    return base;
  }, [flags]);

  const table = useReactTable({
    data: flags.empty ? [] : rows,
    columns,
    state: { sorting, globalFilter, rowSelection, columnVisibility, expanded },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: flags.sorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: flags.filtering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: flags.pagination ? getPaginationRowModel() : undefined,
    getExpandedRowModel: flags.expanding ? getExpandedRowModel() : undefined,
    getRowCanExpand: () => Boolean(flags.expanding),
    initialState: { pagination: { pageSize: 4 } },
  });

  const hideableColumns = table
    .getAllLeafColumns()
    .filter((c) => c.id !== "select" && c.id !== "expand" && c.id !== "move");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{DESCRIPTIONS[variant]}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {flags.filtering && (
          <Input
            className="max-w-xs"
            placeholder="Filter rows..."
            aria-label="Filter rows"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        )}
        {flags.visibility && (
          <div className="flex flex-wrap gap-3" data-table-column-toggles>
            {hideableColumns.map((column) => (
              <label key={column.id} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                />
                {String(column.columnDef.header ?? column.id)}
              </label>
            ))}
          </div>
        )}
        {flags.selection && (
          <label className="flex items-center gap-1.5 text-xs" data-table-select-all>
            <input
              type="checkbox"
              checked={table.getIsAllRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
            />
            Select all rows
          </label>
        )}

        <div className={flags.sticky ? "max-h-56 overflow-auto rounded-md border" : "rounded-md border"}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={flags.sticky ? "sticky top-0 z-10 bg-background" : ""}
                    >
                      {header.isPlaceholder ? null : flags.sorting ? (
                        <button
                          type="button"
                          className="cursor-pointer"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow className={flags.dense ? "h-7" : ""}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={flags.dense ? "py-1" : ""}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {flags.expanding && row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={row.getVisibleCells().length} className="bg-muted/30 text-xs">
                          {row.original.name} · {row.original.role} · {row.original.status} ·
                          ${row.original.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-20 text-center text-sm text-muted-foreground">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {flags.pagination && (
          <div className="flex items-center justify-end gap-2" data-table-pagination>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
            </Button>
          </div>
        )}
        {flags.selection && (
          <p className="text-xs text-muted-foreground" data-table-selection-count>
            {Object.keys(rowSelection).length} row(s) selected
          </p>
        )}
      </CardContent>
    </Card>
  );
}

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import ExcelJS from "exceljs";

/** demo 用示例报价单数据（与报价单字段对齐，纯演示） */
const DEMO = {
  company: {
    name: "OMNIX 科技有限公司",
    address: "深圳市南山区科技园 OMNIX 大厦 8F",
    taxNo: "91440300XXXXXXXX1Q",
    phone: "0755-8888 8888",
  },
  number: "S00099",
  date: "2026-11-04",
  validUntil: "2026-12-04",
  customer: {
    name: "深圳恒星电子有限公司",
    contact: "林经理",
    address: "深圳市宝安区西乡街道 18 号",
  },
  items: [
    { name: "无线蓝牙耳机 Pro", qty: 100, unit: "台", price: 299 },
    { name: "USB-C 快充适配器", qty: 200, unit: "个", price: 89 },
    { name: "铝合金笔记本支架", qty: 50, unit: "件", price: 129 },
  ],
  notes: "1. 报价含 13% 增值税专用发票（含税价）。\n2. 交货期：确认订单后 15 个工作日内。\n3. 本报价单有效期至上方日期。",
};

const money = (n: number) =>
  "¥" + n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const subtotals = DEMO.items.map((i) => i.price * i.qty);
const total = subtotals.reduce((a, b) => a + b, 0);
const tax = total * 0.13;
const grandTotal = total + tax;

/**
 * 组件页 demo：演示两件事
 *  1) react-to-print —— 把报价单 DOM 送入浏览器打印对话框（钉钉式在线排版打印）
 *  2) ExcelJS        —— 把同一份数据导出为带排版的 .xlsx，并能回读导入
 */
export default function QuotationExportDemo() {
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrint = useReactToPrint({
    contentRef,
    documentTitle: `报价单-${DEMO.number}`,
  });

  const [imported, setImported] = useState<string[][] | null>(null);
  const [busy, setBusy] = useState(false);

  const exportExcel = async () => {
    setBusy(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = DEMO.company.name;
      wb.created = new Date();
      const ws = wb.addWorksheet("报价单");

      ws.columns = [
        { header: "产品名称", key: "name", width: 30 },
        { header: "数量", key: "qty", width: 10 },
        { header: "单位", key: "unit", width: 8 },
        { header: "单价", key: "price", width: 14 },
        { header: "金额", key: "amount", width: 16 },
      ];

      // 标题（合并）
      ws.mergeCells("A1:E1");
      const title = ws.getCell("A1");
      title.value = `${DEMO.company.name} · 报价单`;
      title.font = { bold: true, size: 16 };
      title.alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(1).height = 28;

      // 单号 / 日期 / 有效期（合并）
      ws.mergeCells("A2:E2");
      const meta = ws.getCell("A2");
      meta.value = `单号 ${DEMO.number}    日期 ${DEMO.date}    有效期 ${DEMO.validUntil}`;
      meta.font = { size: 10, color: { argb: "FF666666" } };
      meta.alignment = { horizontal: "center" };

      // 表头（第 4 行）
      const headerRow = ws.getRow(4);
      headerRow.height = 22;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2563EB" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { bottom: { style: "thin" } };
      });

      // 数据行
      DEMO.items.forEach((it, i) => {
        const r = ws.getRow(5 + i);
        r.getCell(1).value = it.name;
        r.getCell(2).value = it.qty;
        r.getCell(3).value = it.unit;
        const priceCell = r.getCell(4);
        priceCell.value = it.price;
        priceCell.numFmt = "¥#,##0.00";
        const amountCell = r.getCell(5);
        amountCell.value = it.price * it.qty;
        amountCell.numFmt = "¥#,##0.00";
        r.eachCell((cell) => {
          cell.border = { bottom: { style: "thin", color: { argb: "FFE5E7EB" } } };
        });
      });

      const dataEnd = 5 + DEMO.items.length - 1;

      // 合计区
      const writeTotal = (row: number, label: string, value: number, bold = false) => {
        const r = ws.getRow(row);
        r.getCell(1).value = label;
        if (bold) r.getCell(1).font = { bold: true };
        const c = r.getCell(5);
        c.value = value;
        c.numFmt = "¥#,##0.00";
        if (bold) c.font = { bold: true };
      };
      writeTotal(dataEnd + 1, "合计", total);
      writeTotal(dataEnd + 2, "税额 (13%)", tax);
      writeTotal(dataEnd + 3, "价税合计", grandTotal, true);

      // 排版 / 打印设置（钉钉式：一页宽、留边距）
      ws.pageSetup = {
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
      };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `报价单-${DEMO.number}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const importExcel = async (file: File) => {
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buf);
      const ws = wb.getWorksheet("报价单") ?? wb.worksheets[0];
      const rows: string[][] = [];
      ws.eachRow((row, idx) => {
        if (idx < 4) return; // 跳过标题 / 元信息 / 表头
        const vals = (row.values as unknown[] | undefined) ?? [];
        const cells = vals.slice(1).map((v) => (v == null ? "" : String(v)));
        if (cells.every((c) => c === "")) return;
        rows.push(cells);
      });
      setImported(rows);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 操作条（不进入打印区域） */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => reactToPrint()}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          浏览器打印（react-to-print）
        </button>
        <button
          type="button"
          onClick={() => void exportExcel()}
          disabled={busy}
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-accent"
        >
          导出 Excel（ExcelJS）
        </button>
        <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-accent">
          导入 Excel（回读演示）
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importExcel(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {/* 可打印的报价单文档（ref 区域） */}
      <div
        ref={contentRef}
        className="mx-auto w-full max-w-2xl border border-border bg-white p-6 text-[13px] leading-relaxed text-gray-800"
      >
        <div className="mb-1 text-center text-lg font-bold text-gray-900">
          {DEMO.company.name}
        </div>
        <div className="mb-4 text-center text-base font-semibold tracking-widest text-gray-700">
          报 价 单 (QUOTATION)
        </div>

        <div className="mb-4 flex justify-between text-xs text-gray-600">
          <span>单号：{DEMO.number}</span>
          <span>日期：{DEMO.date}</span>
          <span>有效期：{DEMO.validUntil}</span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded bg-gray-50 p-3 text-xs">
          <div>
            <span className="text-gray-500">客户：</span>
            {DEMO.customer.name}
          </div>
          <div>
            <span className="text-gray-500">联系人：</span>
            {DEMO.customer.contact}
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">地址：</span>
            {DEMO.customer.address}
          </div>
        </div>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border border-gray-200 px-2 py-1.5 text-left">产品名称</th>
              <th className="border border-gray-200 px-2 py-1.5 text-center">数量</th>
              <th className="border border-gray-200 px-2 py-1.5 text-center">单位</th>
              <th className="border border-gray-200 px-2 py-1.5 text-right">单价</th>
              <th className="border border-gray-200 px-2 py-1.5 text-right">金额</th>
            </tr>
          </thead>
          <tbody>
            {DEMO.items.map((it, i) => (
              <tr key={i}>
                <td className="border border-gray-200 px-2 py-1.5">{it.name}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-center">{it.qty}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-center">{it.unit}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-right">{money(it.price)}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-right">
                  {money(it.price * it.qty)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="border border-gray-200 px-2 py-1.5 text-right font-medium" colSpan={4}>
                合计
              </td>
              <td className="border border-gray-200 px-2 py-1.5 text-right">{money(total)}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-2 py-1.5 text-right font-medium" colSpan={4}>
                税额 (13%)
              </td>
              <td className="border border-gray-200 px-2 py-1.5 text-right">{money(tax)}</td>
            </tr>
            <tr className="font-bold">
              <td className="border border-gray-200 px-2 py-1.5 text-right" colSpan={4}>
                价税合计
              </td>
              <td className="border border-gray-200 px-2 py-1.5 text-right">{money(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-4 whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs text-gray-600">
          {DEMO.notes}
        </div>

        <div className="mt-6 flex justify-between text-xs text-gray-500">
          <span>供应商：{DEMO.company.name}</span>
          <span>电话：{DEMO.company.phone}</span>
        </div>
      </div>

      {/* 导入回读结果 */}
      {imported && (
        <div className="flex flex-col gap-2">
          <p className="section-title">导入回读（ExcelJS 解析结果）</p>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-xs">
              <tbody>
                {imported.map((row, i) => (
                  <tr key={i} className="border-b border-border/60">
                    {row.map((c, j) => (
                      <td key={j} className="px-2 py-1">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

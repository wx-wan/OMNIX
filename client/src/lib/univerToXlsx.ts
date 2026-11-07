/*
 * 把 Univer 工作簿快照（wb.save() 产物）转换成 .xlsx 并触发浏览器下载。
 * 使用 ExcelJS（开源 Univer 1.3 的 Excel 导出在 PRO 包中且被混淆+license 门控，
 * 故自行转换，零 license、可离线）。
 *
 * 快照关键格式（实证）：
 *  - 样式注册表在工作簿顶层 snap.styles（键为字符串，cell.s 是索引键；也可能内联对象）
 *  - 颜色 "#RRGGBB"/"RRGGBB"/数字；ht 1左/2中/3右；vt 1上/2中/3下；tb 3=WRAP
 *  - 边框 bd.{t,b,l,r} = {s: 样式枚举(0-7 或字符串), cl:{rgb}}
 *  - 合并 mergeData: IRange[]（0 基含端点）
 *  - 行高 rowData[r].h（px）、列宽 columnData[c].w（px）
 *  - 图片：resources 中 name 含 DRAWING 的 body(JSON) 或 sheet.drawingData；
 *    ISheetImage{ source(dataURL/URL), sheetTransform:{from/to:{col,colOff,row,rowOff}} } 单位 px（0 基）
 */

type UniverColor = string | number | { rgb?: string | number } | undefined;

interface UniverBorderSide {
  s?: number | string;
  cl?: UniverColor;
}

interface UniverStyle {
  ff?: string;
  fs?: number;
  bl?: number | boolean;
  it?: number | boolean;
  ul?: number | boolean | { s?: number | boolean };
  st?: number | boolean | { s?: number | boolean };
  cl?: UniverColor;
  bg?: UniverColor;
  ht?: number;
  vt?: number;
  tb?: number;
  ind?: number;
  bd?: { t?: UniverBorderSide; b?: UniverBorderSide; l?: UniverBorderSide; r?: UniverBorderSide };
}

interface UniverCell {
  v?: unknown;
  s?: string | number | UniverStyle;
  f?: string;
}

interface UniverAnchor {
  col: number;
  colOff: number;
  row: number;
  rowOff: number;
}

interface UniverImage {
  source?: string;
  drawingType?: number | string;
  sheetTransform?: { from?: UniverAnchor; to?: UniverAnchor };
  transform?: { width?: number; height?: number };
}

const H_ALIGN: Record<number, string> = { 1: "left", 2: "center", 3: "right" };
const V_ALIGN: Record<number, string> = { 1: "top", 2: "middle", 3: "bottom" };
const BORDER_STYLE_NUM: Record<number, string> = {
  0: "none",
  1: "thin",
  2: "medium",
  3: "dashed",
  4: "dotted",
  5: "thick",
  6: "double",
  7: "hair",
};

const EMU_PER_PX = 9525;

/** Univer 颜色 → ExcelJS ARGB（FFRRGGBB） */
function toArgb(c: UniverColor): string | undefined {
  let hex: string | undefined;
  if (typeof c === "string") hex = c;
  else if (typeof c === "number") hex = c.toString(16).padStart(6, "0");
  else if (c && typeof c === "object") {
    const r = (c as { rgb?: string | number }).rgb;
    if (typeof r === "number") hex = r.toString(16).padStart(6, "0");
    else if (typeof r === "string") hex = r;
  }
  if (!hex) return undefined;
  hex = hex.replace(/^#/, "").toUpperCase();
  if (hex.length === 8) return hex; // 已含 alpha
  if (hex.length === 6) return `FF${hex}`;
  if (hex.length === 3) return `FF${hex.split("").map((ch) => ch + ch).join("")}`;
  return undefined;
}

function borderStyle(s?: number | string): string | undefined {
  if (s === undefined || s === null) return undefined;
  if (typeof s === "string") return s === "none" ? undefined : s;
  return BORDER_STYLE_NUM[s];
}

function boolOf(x: number | boolean | { s?: number | boolean } | undefined): boolean {
  if (typeof x === "number") return x !== 0;
  if (typeof x === "boolean") return x;
  if (x && typeof x === "object") return Boolean(x.s);
  return false;
}

function resolveStyle(cell: UniverCell, styles: Record<string, UniverStyle>): UniverStyle | undefined {
  const s = cell.s;
  if (!s) return undefined;
  if (typeof s === "object") return s;
  return styles[String(s)];
}

/** Univer 样式 → ExcelJS 单元格样式 */
function styleToExcel(s?: UniverStyle, hasNewline = false): Record<string, unknown> | undefined {
  if (!s) return undefined;
  const out: Record<string, unknown> = {};

  const font: Record<string, unknown> = {};
  if (boolOf(s.bl)) font.bold = true;
  if (boolOf(s.it)) font.italic = true;
  if (boolOf(s.ul)) font.underline = { style: "single" };
  if (boolOf(s.st)) font.strike = true;
  if (s.ff) font.name = s.ff;
  if (s.fs) font.size = s.fs;
  const fontColor = toArgb(s.cl);
  if (fontColor) font.color = { argb: fontColor };
  if (Object.keys(font).length) out.font = font;

  const bg = toArgb(s.bg);
  if (bg) out.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };

  const alignment: Record<string, unknown> = {};
  if (s.ht !== undefined && H_ALIGN[s.ht]) alignment.horizontal = H_ALIGN[s.ht];
  if (s.vt !== undefined && V_ALIGN[s.vt]) alignment.vertical = V_ALIGN[s.vt];
  // tb=3 为 WRAP；含换行符的文本也强制换行，避免 WPS/Excel 展示成单行
  if (s.tb === 3 || hasNewline) alignment.wrapText = true;
  if (Object.keys(alignment).length) out.alignment = alignment;

  if (s.bd) {
    const border: Record<string, unknown> = {};
    for (const [k, name] of [
      ["t", "top"],
      ["b", "bottom"],
      ["l", "left"],
      ["r", "right"],
    ] as const) {
      const side = s.bd[k];
      const style = borderStyle(side?.s);
      if (side && style) {
        border[name] = { style, color: { argb: toArgb(side.cl) ?? "FF000000" } };
      }
    }
    if (Object.keys(border).length) out.border = border;
  }

  return Object.keys(out).length ? out : undefined;
}

/** 解析图片 source 为 ExcelJS 可用的 image 对象；不可用返回 undefined */
async function imageSourceToExcel(
  source: string,
): Promise<{ base64?: string; buffer?: ArrayBuffer; extension: string } | undefined> {
  const dataUrl = source.match(/^data:image\/(png|jpe?g|gif);base64,(.+)$/);
  if (dataUrl) {
    return { base64: dataUrl[2], extension: dataUrl[1].replace("jpg", "jpeg") };
  }
  if (/^https?:\/\//.test(source)) {
    try {
      const resp = await fetch(source);
      if (!resp.ok) return undefined;
      const type = resp.headers.get("content-type") ?? "";
      const ext = type.includes("png") ? "png" : type.includes("gif") ? "gif" : "jpeg";
      return { buffer: await resp.arrayBuffer(), extension: ext };
    } catch {
      return undefined;
    }
  }
  // 裸 base64（无 dataURL 前缀）：默认按 png
  if (/^[A-Za-z0-9+/=]+$/.test(source.slice(0, 64))) return { base64: source, extension: "png" };
  return undefined;
}

/** 从快照里收集所有图片（兼容 resources[DRAWING] 与 sheet.drawingData 两种载体），返回 sheetId → images */
function collectImages(snap: Record<string, any>): Map<string, UniverImage[]> {
  const bySheet = new Map<string, UniverImage[]>();
  const push = (sheetId: string, img: UniverImage) => {
    if (!img?.source) return;
    const list = bySheet.get(sheetId) ?? [];
    list.push(img);
    bySheet.set(sheetId, list);
  };
  const looksLikeImage = (x: unknown): x is UniverImage =>
    Boolean(
      x &&
        typeof x === "object" &&
        typeof (x as UniverImage).source === "string" &&
        (x as UniverImage).sheetTransform,
    );

  const walk = (node: any, sheetHint: string | null, depth: number) => {
    if (!node || typeof node !== "object" || depth > 6) return;
    if (looksLikeImage(node)) {
      push(sheetHint ?? "sheet1", node as UniverImage);
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (looksLikeImage(v)) push(sheetHint ?? "sheet1", v as UniverImage);
      else if (v && typeof v === "object") {
        // 层级约定：unitId → subUnitId(=sheetId) → drawingId → image；第 2 层的 key 是 sheetId
        walk(v, depth === 1 ? k : sheetHint, depth + 1);
      }
    }
  };

  // 载体 1：workbook.resources 中 name 含 DRAWING 的 body
  for (const r of (snap.resources ?? []) as Array<{ name?: string; body?: string }>) {
    if (typeof r?.name === "string" && r.name.toUpperCase().includes("DRAWING") && typeof r.body === "string") {
      try {
        walk(JSON.parse(r.body), null, 0);
      } catch {
        /* 忽略损坏的 drawing 资源 */
      }
    }
  }
  // 载体 2：worksheet.drawingData
  for (const [sid, sheet] of Object.entries(snap.sheets ?? {})) {
    const dd = (sheet as Record<string, any>)?.drawingData;
    if (dd && typeof dd === "object") walk(dd, sid, 0);
  }
  return bySheet;
}

/** 根据锚点估算图片尺寸（px）；优先 transform.width/height */
function imageSizePx(img: UniverImage, sheet: Record<string, any>): { width: number; height: number } {
  if (img.transform?.width && img.transform?.height) {
    return { width: img.transform.width, height: img.transform.height };
  }
  const from = img.sheetTransform?.from;
  const to = img.sheetTransform?.to;
  const defaultW = sheet?.defaultColumnWidth ?? 100;
  const defaultH = sheet?.defaultRowHeight ?? 24;
  const colW = (c: number) => sheet?.columnData?.[String(c)]?.w ?? defaultW;
  const rowH = (r: number) => sheet?.rowData?.[String(r)]?.h ?? defaultH;
  let width = 100;
  let height = 60;
  if (from && to) {
    // width = Σ列宽(from.col..to.col-1) + to.colOff - from.colOff
    width = 0;
    for (let c = from.col; c < to.col; c++) width += colW(c);
    width += (to.colOff ?? 0) - (from.colOff ?? 0);
    height = 0;
    for (let r = from.row; r < to.row; r++) height += rowH(r);
    height += (to.rowOff ?? 0) - (from.rowOff ?? 0);
  }
  return { width: Math.max(8, Math.round(width)), height: Math.max(8, Math.round(height)) };
}

/** 快照 → ExcelJS 工作簿（纯转换，node/浏览器均可跑，便于测试） */
export async function snapshotToWorkbook(snapshot: Record<string, any>) {
  const ExcelJS = (await import("exceljs")).default;
  const sheets: Record<string, any> = snapshot.sheets ?? {};
  const order: string[] = snapshot.sheetOrder ?? Object.keys(sheets);
  const styles: Record<string, UniverStyle> = snapshot.styles ?? {};
  const imagesBySheet = collectImages(snapshot);

  const wb = new ExcelJS.Workbook();
  wb.creator = "OMNIX";

  for (const sid of order) {
    const sheet = sheets[sid];
    if (!sheet) continue;
    const cellData: Record<string, Record<string, UniverCell>> = sheet.cellData ?? {};
    const ws = wb.addWorksheet(sheet.name ?? sid);

    // 行高（px → pt）
    const rowData: Record<string, { h?: number }> = sheet.rowData ?? {};
    for (const [rStr, rd] of Object.entries(rowData)) {
      const r = Number(rStr);
      if (rd?.h) ws.getRow(r + 1).height = Math.round(rd.h * 0.75 * 100) / 100;
    }
    // 列宽（px → Excel 字符宽）：px ≈ width*7 + 5
    const colData: Record<string, { w?: number }> = sheet.columnData ?? {};
    for (const [cStr, cd] of Object.entries(colData)) {
      const c = Number(cStr);
      if (cd?.w) ws.getColumn(c + 1).width = Math.max(4, Math.round(((cd.w - 5) / 7) * 100) / 100);
    }

    // 单元格：值 + 样式（空值但有样式的单元格也要写，保证合并区/描边完整）
    for (const [rStr, row] of Object.entries(cellData)) {
      const r = Number(rStr);
      for (const [cStr, cell] of Object.entries(row)) {
        if (!cell) continue;
        const c = Number(cStr);
        const target = ws.getCell(r + 1, c + 1);
        const v = cell.v;
        if (typeof v === "number") target.value = v;
        else if (typeof v === "string" && v !== "") target.value = v;
        else if (v && typeof v === "object") {
          // 富文本对象：取拼接文本兜底
          const parts = (v as { richText?: { text?: string }[] }).richText;
          if (Array.isArray(parts)) target.value = parts.map((p) => p.text ?? "").join("");
        }
        if (cell.f) {
          const base = typeof target.value === "number" || typeof target.value === "string" ? target.value : 0;
          target.value = { formula: cell.f.replace(/^=/, ""), result: base as number };
        }
        const hasNl = typeof target.value === "string" && (target.value as string).includes("\n");
        const sx = styleToExcel(resolveStyle(cell, styles), hasNl);
        if (sx) Object.assign(target, sx);
      }
    }

    // 合并单元格
    const mergeData = sheet.mergeData as
      | Array<{ startRow: number; endRow: number; startColumn: number; endColumn: number }>
      | undefined;
    if (mergeData?.length) {
      for (const m of mergeData) {
        try {
          ws.mergeCells(m.startRow + 1, m.startColumn + 1, m.endRow + 1, m.endColumn + 1);
        } catch {
          /* 与已有合并冲突时忽略 */
        }
      }
    }

    // 图片嵌入（浮动图片 → oneCellAnchor，EMU 偏移）
    const images = imagesBySheet.get(sid) ?? [];
    for (const img of images) {
      const parsed = await imageSourceToExcel(img.source!);
      if (!parsed) continue;
      try {
        const imgId = wb.addImage(parsed as never);
        const from = img.sheetTransform?.from ?? { col: 0, colOff: 0, row: 0, rowOff: 0 };
        const { width, height } = imageSizePx(img, sheet);
        ws.addImage(imgId, {
          // ExcelJS Anchor 支持 nativeCol/nativeColOff 直写，偏移单位为 EMU
          tl: {
            nativeCol: Math.max(0, from.col),
            nativeColOff: Math.max(0, Math.round((from.colOff ?? 0) * EMU_PER_PX)),
            nativeRow: Math.max(0, from.row),
            nativeRowOff: Math.max(0, Math.round((from.rowOff ?? 0) * EMU_PER_PX)),
          },
          ext: { width, height },
          editAs: "oneCell",
        });
      } catch (err) {
        console.warn("导出图片失败", err);
      }
    }
  }
  return wb;
}

export async function downloadUniverSnapshot(snapshot: unknown, filename = "quotation.xlsx") {
  if (!snapshot || typeof snapshot !== "object") return;
  const wb = await snapshotToWorkbook(snapshot as Record<string, any>);

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/** 快照 → xlsx base64（发送邮件附件用；不含 data: 前缀）。非法快照返回 null。 */
export async function snapshotToXlsxBase64(snapshot: unknown): Promise<string | null> {
  if (!snapshot || typeof snapshot !== "object") return null;
  const wb = await snapshotToWorkbook(snapshot as Record<string, any>);
  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

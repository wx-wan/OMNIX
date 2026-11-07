import {
  FIELD_DEFS,
  resolveKey,
  formatField,
  type FieldDef,
  type LineItem,
  type TemplateData,
} from "./quotationFields";

/**
 * 报价单「循环明细表」核心逻辑。
 * 模板在单元格里写占位符 {{line.xxx}}（由 UniverSheetsDemo 的「添加循环表」流程生成），
 * 并在快照顶层挂 loopConfig（循环区域）。预览时按该报价单的 lines 逐行展开真实字段。
 */

/** 一个循环区域（0 基，含端点） */
export interface LoopConfig {
  sheetId: string;
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
}

const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
const SINGLE_TOKEN_RE = /^\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}$/;

/**
 * 设计态 token 灰底提示色（标准化 6 位 HEX，不含 #）。
 * 由 UniverSheetsDemo 套到含 {{token}} 的单元格上，提升模板可读性；
 * 导出/预览调用 expandSnapshot 展开成品时会被剥离，避免明细行带灰底。
 */
export const TOKEN_HIGHLIGHT_BG = "EEF2FF";

/**
 * 设计态循环区域整体灰底提示色（纯灰）。
 * 「循环列」弹窗确认后给整个循环区域上色（保留用户已有填充），
 * 展开成品时与 token 高亮一并剥离。
 */
export const REGION_GRAY_BG = "F3F4F6";

/** 把 Univer 颜色归一化为大写 6 位 HEX（去 #、3 位扩 6 位、数字转 16 进制） */
function normalizeRgb(rgb?: string | number): string {
  if (rgb == null) return "";
  let s = typeof rgb === "number" ? rgb.toString(16) : String(rgb);
  s = s.replace(/^#/, "").toUpperCase();
  if (s.length === 6) return s;
  if (s.length === 3) return s.split("").map((c) => c + c).join("");
  return s;
}

// ---- A1 表示法与 0 基行列互转（弹窗选区输入用） ----

/** 0 基列号 → A1 列字母（0→A，25→Z，26→AA） */
export function colLetters(col: number): string {
  let n = Math.max(0, Math.floor(col)) + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** A1 列字母 → 0 基列号（A→0，AA→26）；非法返回 -1 */
export function lettersToCol(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) {
    const code = ch.charCodeAt(0);
    if (code < 65 || code > 90) return -1;
    n = n * 26 + (code - 64);
  }
  return n - 1;
}

/** 0 基行列 → 单元格引用（如 7,1 → "B8"） */
export function cellToA1(row: number, col: number): string {
  return `${colLetters(col)}${row + 1}`;
}

/** 0 基区域 → A1 区域引用（如 "B8:I10"；单格时同样返回 "B8"） */
export function rangeToA1(r: {
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
}): string {
  const a = cellToA1(r.startRow, r.startColumn);
  const b = cellToA1(r.endRow, r.endColumn);
  return a === b ? a : `${a}:${b}`;
}

/** 解析单个单元格引用（"B8" → 0 基 {row,col}）；非法返回 null */
export function parseA1Cell(ref: string): { row: number; col: number } | null {
  const m = ref.trim().match(/^([A-Za-z]+)(\d+)$/);
  if (!m) return null;
  const col = lettersToCol(m[1]);
  const row = parseInt(m[2], 10) - 1;
  if (col < 0 || row < 0) return null;
  return { row, col };
}

/** 解析区域引用（"B8:I10" 或单格 "B8"）→ 0 基边界；非法返回 null */
export function parseA1Range(
  ref: string,
): { startRow: number; startColumn: number; endRow: number; endColumn: number } | null {
  const parts = ref.trim().split(":");
  const a = parseA1Cell(parts[0] ?? "");
  if (!a) return null;
  if (parts.length === 1) {
    return { startRow: a.row, startColumn: a.col, endRow: a.row, endColumn: a.col };
  }
  const b = parseA1Cell(parts[1] ?? "");
  if (!b) return null;
  return {
    startRow: Math.min(a.row, b.row),
    startColumn: Math.min(a.col, b.col),
    endRow: Math.max(a.row, b.row),
    endColumn: Math.max(a.col, b.col),
  };
}

/** 从快照顶层读取循环配置（兼容缺失） */
export function extractLoopsFromSnapshot(snap: unknown): LoopConfig[] {
  const s = snap as { loopConfig?: LoopConfig[] } | null;
  return Array.isArray(s?.loopConfig) ? s!.loopConfig! : [];
}

/**
 * 自动识别循环区域（块级语义）：扫描快照里含 {{line.*}}（产品字段编码）占位符的单元格，
 * 先取它们的包围盒，再反复吸入与包围盒相交的合并单元格（如纵跨整个产品块的「产品图片」列），
 * 直到不再扩大——识别出完整视觉区块而非零散 token 行。
 * 未找到任何产品字段时返回 null。
 */
export function detectLoopRegionFromLines(snap: unknown): LoopConfig | null {
  if (!snap || typeof snap !== "object") return null;
  const s = snap as {
    sheets?: Record<string, { cellData?: Record<string, Record<string, any>>; mergeData?: any[] }>;
  };
  for (const [sheetId, sheet] of Object.entries(s.sheets ?? {})) {
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const [rStr, row] of Object.entries(sheet.cellData ?? {})) {
      for (const [cStr, cell] of Object.entries(row)) {
        if (typeof cell?.v === "string" && cell.v.includes("{{line.")) {
          const r = Number(rStr);
          const c = Number(cStr);
          if (Number.isFinite(r) && Number.isFinite(c)) {
            minR = Math.min(minR, r); maxR = Math.max(maxR, r);
            minC = Math.min(minC, c); maxC = Math.max(maxC, c);
          }
        }
      }
    }
    if (maxR < minR) continue;
    // 经合并单元格传递扩散：行范围与当前块相交的合并区吸入块范围（如纵跨整个
    // 产品块的「产品图片」列在 token 列之外，须按行相交吸收），直至稳定
    const merges = Array.isArray(sheet.mergeData) ? sheet.mergeData : [];
    let changed = true;
    while (changed) {
      changed = false;
      for (const m of merges) {
        const mr = m ?? {};
        const rowIntersects = mr.startRow <= maxR && mr.endRow >= minR;
        if (!rowIntersects) continue;
        if (mr.startRow < minR) { minR = mr.startRow; changed = true; }
        if (mr.endRow > maxR) { maxR = mr.endRow; changed = true; }
        if (mr.startColumn < minC) { minC = mr.startColumn; changed = true; }
        if (mr.endColumn > maxC) { maxC = mr.endColumn; changed = true; }
      }
    }
    return { sheetId, startRow: minR, startColumn: minC, endRow: maxR, endColumn: maxC };
  }
  return null;
}

/** 判断循环区域内是否至少含一个 {{line.*}} 产品字段占位符 */
function loopHasLineToken(snap: unknown, loop: LoopConfig): boolean {
  const s = snap as { sheets?: Record<string, { cellData?: Record<string, Record<string, any>> }> };
  const sheet = s.sheets?.[loop.sheetId] ?? Object.values(s.sheets ?? {})[0];
  if (!sheet) return false;
  for (let r = loop.startRow; r <= loop.endRow; r++) {
    const row = sheet.cellData?.[String(r)];
    if (!row) continue;
    for (let c = loop.startColumn; c <= loop.endColumn; c++) {
      const cell = row[String(c)];
      if (typeof cell?.v === "string" && cell.v.includes("{{line.")) return true;
    }
  }
  return false;
}

/**
 * 在快照上定义/替换循环区域，并给区域内单元格整体上纯灰底（设计态标记）：
 *  - 顶层挂 loopConfig = [region]；
 *  - 区域内每个单元格：无填充 → 套共享灰底样式；已有填充（用户自己的区块色）→ 保留不动；
 *    有其它样式（边框/字体）→ 合并出「原样式+灰底」的新注册样式。
 * 深拷贝，不污染上游对象。展开成品时 expandSnapshot 会剥离该灰底。
 */
export function withLoopRegion(snapshot: unknown, region: LoopConfig): unknown {
  if (!snapshot || typeof snapshot !== "object") return snapshot;
  const out = JSON.parse(JSON.stringify(snapshot)) as {
    styles?: Record<string, any>;
    sheets?: Record<string, any>;
    loopConfig?: LoopConfig[];
  };
  out.loopConfig = [region];
  const sheet = out.sheets?.[region.sheetId] ?? Object.values(out.sheets ?? {})[0];
  if (!sheet) return out;

  const gray = `#${REGION_GRAY_BG}`;
  const styles: Record<string, any> = (out.styles ??= {});
  const GRAY_KEY = "_loopGray";
  styles[GRAY_KEY] ??= { bg: { rgb: gray } };

  const cellData: Record<string, any> = sheet.cellData ?? (sheet.cellData = {});
  let mergeSeq = 0;
  for (let r = region.startRow; r <= region.endRow; r++) {
    const row = cellData[String(r)] ?? (cellData[String(r)] = {});
    for (let c = region.startColumn; c <= region.endColumn; c++) {
      const cell = row[String(c)] ?? (row[String(c)] = {});
      const s = cell.s;
      const resolved = typeof s === "string" ? styles[s] : s;
      if (resolved?.bg) continue; // 已有填充（用户区块色）：保留
      if (!resolved) {
        cell.s = GRAY_KEY; // 无样式：直接挂共享灰底
      } else {
        const nk = `${GRAY_KEY}_m${mergeSeq++}`;
        styles[nk] = { ...resolved, bg: { rgb: gray } };
        cell.s = nk; // 有其它样式（边框/字体）：合并出「原样式+灰底」
      }
    }
  }

  // 行列数兜底，保证区域完整可见
  sheet.rowCount = Math.max(sheet.rowCount ?? 0, region.endRow + 2);
  sheet.columnCount = Math.max(sheet.columnCount ?? 0, region.endColumn + 2);
  return out;
}

/** 把单个占位符替换为真实值：line.* 从循环行取，其余（客户/单据/金额）从整体数据取 */
function resolveToken(key: string, data?: TemplateData, line?: LineItem): string {
  const def = FIELD_DEFS.find((f) => f.key === key);
  if (!def) return "";
  const source = data ?? ({} as TemplateData);
  return formatField(def, resolveKey(source, key, line));
}

/** 替换单元格文本中的全部 {{key}}；整格单 token 且为数值字段则直接返回数字 */
export function substituteTokens(value: unknown, data?: TemplateData, line?: LineItem): unknown {
  if (typeof value !== "string" || !value.includes("{{")) return value;
  const single = value.match(SINGLE_TOKEN_RE);
  if (single) {
    const def: FieldDef | undefined = FIELD_DEFS.find((f) => f.key === single[1]);
    if (def?.kind === "number") {
      const raw = resolveKey(data ?? ({} as TemplateData), single[1], line);
      if (typeof raw === "number") return raw;
    }
  }
  return value.replace(TOKEN_RE, (_m, k: string) => resolveToken(k, data, line));
}

/**
 * 只替换系统字段占位符（{{customer.*}}/{{quotation.*}}/{{totals.*}}）。
 * {{line.*}} 保留原样——它们只应在循环区内被逐行替换；循环区外出现时若也替换成空串，
 * 用户无从排查（表现为「渲染不出值」）。保留字面量是明确的配置错误信号。
 */
export function substituteSystemTokens(value: unknown, data?: TemplateData): unknown {
  if (typeof value !== "string" || !value.includes("{{")) return value;
  return value.replace(TOKEN_RE, (m, k: string) => (k.startsWith("line.") ? m : resolveToken(k, data)));
}

/**
 * 按明细行「块级」循环展开快照（小满模型）：
 *  - 循环区 = 用户界定的整块行区间（如产品块 8~20 行，含标签行/静态文本/跨行合并）；
 *  - 复制 N 份（N = 明细 length，至少 1），每个实例内 {{line.x}} 替换为对应明细行值，
 *    其余 {{customer.*}}/{{quotation.*}}/{{totals.*}} 替换为整体真实值；
 *  - 区域外的 {{line.*}} 保留字面量（不在有效循环区内的产品字段属配置错误，不静默清空）；
 *  - 区域下方（>endRow）的单元格 / 合并 / 行高整体下移 (N-1)*blockH 行；
 *    块内合并与行高逐实例复制，保持每组的视觉结构；
 *  - 展开后的成品删除 loopConfig，避免二次展开。
 * 显式 loopConfig 若不含任何 {{line.*}}（区域界定与 token 脱节，常见于旧模板残留）
 * 则作废，回退「产品字段所在行 + 合并扩散」自动识别。多区域按自下而上处理避免位移干扰。
 */
export function expandSnapshot(snapshot: unknown, lines: LineItem[], data?: TemplateData): unknown {
  if (!snapshot || typeof snapshot !== "object") return snapshot;
  // 优先用显式循环配置；区域内没有任何产品字段占位符的视为无效配置（旧模板残留）；
  // 全部无效时按「产品字段所在行 + 合并扩散」自动派生循环区
  let loops = extractLoopsFromSnapshot(snapshot).filter((l) => loopHasLineToken(snapshot, l));
  if (!loops.length) {
    const detected = detectLoopRegionFromLines(snapshot);
    if (detected) loops = [detected];
  }

  // 无循环配置且无产品字段：成品/纯模板——仍要把系统字段占位符替换为真实值
  if (!loops.length) {
    const plain = JSON.parse(JSON.stringify(snapshot)) as {
      sheets?: Record<string, { cellData?: Record<string, Record<string, any>> }>;
    };
    for (const sheet of Object.values(plain.sheets ?? {})) {
      for (const row of Object.values(sheet.cellData ?? {})) {
        for (const cell of Object.values(row)) {
          cell.v = substituteTokens(cell.v, data);
        }
      }
    }
    return plain;
  }

  const n = Math.max(lines.length, 1);
  const out = JSON.parse(JSON.stringify(snapshot)) as {
    sheets?: Record<string, any>;
    loopConfig?: LoopConfig[];
  };
  delete out.loopConfig;

  // 自下而上处理：下方区域先展开，其位移不影响上方区域的行号
  const ordered = [...loops].sort((a, b) => b.startRow - a.startRow);

  for (const loop of ordered) {
    const sheet = out.sheets?.[loop.sheetId] ?? Object.values(out.sheets ?? {})[0];
    if (!sheet) continue;

    const { startRow, startColumn, endRow, endColumn } = loop;
    const blockH = endRow - startRow + 1;
    const shift = (n - 1) * blockH;

    const cellData: Record<string, any> = sheet.cellData ?? (sheet.cellData = {});
    const newCellData: Record<string, any> = {};

    // 1) 收集区域内模板单元格（含静态文本/样式，token 仅作替换）
    const pattern: { r: number; c: number; cell: any }[] = [];
    for (let r = startRow; r <= endRow; r++) {
      const row = cellData[String(r)];
      if (!row) continue;
      for (let c = startColumn; c <= endColumn; c++) {
        const cell = row[String(c)];
        if (cell) pattern.push({ r, c, cell: JSON.parse(JSON.stringify(cell)) });
      }
    }

    // 2) 逐行实例写入（i=0 覆盖原区域，i>=1 向下追加）；实例内 line.* 按该明细行取值
    for (let i = 0; i < n; i++) {
      const line = lines[i];
      const rowOffset = i * blockH;
      for (const p of pattern) {
        const nr = p.r + rowOffset;
        const nc = p.c;
        const newCell = { ...p.cell, v: substituteTokens(p.cell.v, data, line) };
        (newCellData[String(nr)] ??= {})[String(nc)] = newCell;
      }
    }

    // 3) 区域上方（<startRow）原样保留、区域下方（>endRow）整体下移；两段只替换
    //    系统字段占位符（页头客户名/单号等）；{{line.*}} 保留字面量以暴露配置错误
    for (const [rStr, row] of Object.entries(cellData)) {
      const r = Number(rStr);
      if (r < startRow || r > endRow) {
        const copy = JSON.parse(JSON.stringify(row)) as Record<string, any>;
        for (const cell of Object.values(copy)) {
          cell.v = substituteSystemTokens(cell.v, data);
        }
        newCellData[String(r < startRow ? r : r + shift)] = copy;
      }
    }
    sheet.cellData = newCellData;

    // 4) 合并：块内合并按实例复制；下方合并下移；上方合并保留。
    // 块是「垂直整段复制」，列向不变——故「块内合并」只按行区间判定：
    // 只要与块行区间 [startRow,endRow] 有交集即随实例复制（不要求完全落在块内，
    // 也不要求列落在区域列内）。否则两类常见合并会被漏复制：
    //  - 比 token 更宽的整行标签横并；
    //  - 竖跨整个产品块的「产品图片」列——它常比行区块上探/下沉一行（如块 9-19、图 8-18），
    //    若要求完全落在块内会被判为区域外而只在首个实例保留合并。
    const mergeData: any[] = sheet.mergeData ?? [];
    const newMerge: any[] = [];
    for (const m of mergeData) {
      const inPattern = m.endRow >= startRow && m.startRow <= endRow;
      if (inPattern) {
        for (let i = 0; i < n; i++) {
          const off = i * blockH;
          newMerge.push({
            startRow: m.startRow + off,
            endRow: m.endRow + off,
            startColumn: m.startColumn,
            endColumn: m.endColumn,
          });
        }
      } else if (m.startRow > endRow) {
        newMerge.push({
          startRow: m.startRow + shift,
          endRow: m.endRow + shift,
          startColumn: m.startColumn,
          endColumn: m.endColumn,
        });
      } else {
        newMerge.push(m);
      }
    }
    if (newMerge.length) sheet.mergeData = newMerge;

    // 5) 行高：块内行高逐实例复制（保持每组视觉结构一致），区域下方下移
    if (sheet.rowData) {
      const newRowData: Record<string, any> = {};
      for (const [rStr, rd] of Object.entries(sheet.rowData)) {
        const r = Number(rStr);
        if (r < startRow) {
          newRowData[String(r)] = rd;
        } else if (r > endRow) {
          newRowData[String(r + shift)] = rd;
        } else {
          for (let i = 0; i < n; i++) newRowData[String(r + i * blockH)] = rd;
        }
      }
      sheet.rowData = newRowData;
    }

    // 6) 扩展行数，保证展开后有足够网格
    sheet.rowCount = Math.max(sheet.rowCount ?? 0, endRow + shift + blockH + 2);
  }

  // 设计态灰底提示（token 蓝灰 + 循环区域纯灰）：展开成品时移除，避免导出/预览带灰底
  const styles = (out as { styles?: Record<string, any> }).styles;
  if (styles) {
    const stripSet = new Set([TOKEN_HIGHLIGHT_BG, REGION_GRAY_BG]);
    for (const id of Object.keys(styles)) {
      const bg = styles[id]?.bg?.rgb;
      if (stripSet.has(normalizeRgb(bg))) delete styles[id].bg;
    }
  }

  return out;
}

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, memo } from "react";
import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import ZhCN from "@univerjs/preset-sheets-core/locales/zh-CN";
// 图片/浮层图形能力：工具条出现「插入图片」，支持浮动图与单元格图片（报价单模板贴图用）
import { UniverSheetsDrawingPreset } from "@univerjs/preset-sheets-drawing";
import DrawingZhCN from "@univerjs/preset-sheets-drawing/locales/zh-CN";
import "@univerjs/preset-sheets-core/lib/index.css";
import "@univerjs/preset-sheets-drawing/lib/index.css";
import {
  FIELD_DEFS,
  FIELD_GROUPS,
  formatField,
  resolveKey,
  sampleTemplateData,
  type TemplateData,
} from "@/lib/quotationFields";
import {
  detectLoopRegionFromLines,
  extractLoopsFromSnapshot,
  REGION_GRAY_BG,
  TOKEN_HIGHLIGHT_BG,
  rangeToA1,
  type LoopConfig,
} from "@/lib/univerLoop";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadUniverSnapshot } from "@/lib/univerToXlsx";

// 默认空表格：用户从空白起步，手动录入或点选系统字段带入真实值
const emptySnapshot = {
  id: "quotation-demo",
  name: "报价单",
  appVersion: "1.3.1",
  locale: LocaleType.ZH_CN,
  sheetOrder: ["sheet1"],
  styles: {},
  sheets: {
    sheet1: {
      id: "sheet1",
      name: "报价单",
      type: 0,
      rowCount: 40,
      columnCount: 8,
      defaultColumnWidth: 120,
      defaultRowHeight: 26,
      cellData: {},
    },
  },
};

/** 是否为合法的 Univer 工作簿快照（旧 TipTap JSON 不含 sheets，会被忽略） */
export function isValidUniverSnapshot(v: unknown): boolean {
  return !!v && typeof v === "object" && "sheets" in (v as Record<string, unknown>);
}

/**
 * 按容器实际尺寸扩列/扩行：columnCount 不足时，超出列数定义的区域 Univer
 * 不渲染网格 → 出现「H 列后大片空白」。历史保存的快照列数偏小（旧窄容器时代），
 * 新建快照也可能小于当前视口，故统一在加载前放大（深拷贝，不污染上游对象）。
 */
function ensureGridSize(snap: unknown, width: number, height: number) {
  const copy = JSON.parse(JSON.stringify(snap)) as {
    sheets?: Record<string, { columnCount?: number; rowCount?: number; defaultColumnWidth?: number; defaultRowHeight?: number }>;
  };
  for (const sheet of Object.values(copy.sheets ?? {})) {
    const colW = sheet.defaultColumnWidth || 120;
    const rowH = sheet.defaultRowHeight || 26;
    const needCols = Math.ceil(width / colW) + 8; // 多备 8 列，避免一滚动就见白
    const needRows = Math.ceil(height / rowH) + 10;
    sheet.columnCount = Math.max(sheet.columnCount ?? 0, needCols, 8);
    sheet.rowCount = Math.max(sheet.rowCount ?? 0, needRows, 40);
  }
  return copy;
}

/** 暴露给父组件的命令式接口：取出当前工作簿快照 / 载入新快照（套用模板）/ 导出 Excel */
export interface UniverSheetsHandle {
  getSnapshot: () => Promise<unknown>;
  loadSnapshot: (snap: unknown) => void;
  exportXlsx: (filename?: string) => Promise<void>;
  /** 当前选区的 A1 表示（如 "B8:I10"）；无选区返回 null（循环列弹窗「读取当前选区」用） */
  getSelectedA1: () => string | null;
  /** 进入循环字段绑定模式：明细字段点击写入 {{token}} 占位符（循环列弹窗确认后调用） */
  beginLoopBinding: () => void;
  /** 把任意原始文本写入当前选中单元格（快捷文本插入用；不解析不格式化） */
  insertText: (text: string) => void;
}

interface UniverSheetsProps {
  /** 用于解析系统字段真实值的报价单数据；缺省时用示例数据 */
  data?: TemplateData;
  /** 初始工作簿快照（Univer 格式）；非法/缺省时回退到默认空表格 */
  initialSnapshot?: unknown;
  /** 非 fill 模式下的画布高度（px）；Showcase 等无确定高度父级的场景用 */
  height?: number;
  /**
   * 是否把循环配置（loopConfig）写回 getSnapshot 产物。
   * 模板设计器= true（模板需携带循环定义复用）；报价单预览= false（预览是已展开成品）。
   */
  persistLoop?: boolean;
  /**
   * 填充模式：画布绝对定位填满「高度确定」的父级（弹窗等 flex 链）。
   * 关键：画布尺寸不参与父级布局计算（absolute），从根上切断
   * 「内容溢出→滚动条→宽度变化→Univer 重渲染→回弹」的尺寸反馈震荡（选中框抖动根源）。
   */
  fill?: boolean;
  /** 「完成循环表」后通知宿主（宿主负责取快照并展开完整明细） */
  onLoopFinish?: () => void;
  /**
   * 模板编辑模式：左侧系统字段点击写入 {{占位符}}（导出/预览时再解析为真实值）；
   * 缺省 false=演示模式，点击直接写入字段真实值（Showcase 用）。
   */
  templateMode?: boolean;
  /** 隐藏左侧字段面板：纯查看/成品场景（如报价单导出页）只保留画布 */
  hidePanel?: boolean;
}

/** 自动填充单元格的高亮样式，区分「字段带入」与「手动录入」 */
const FILLED_STYLE = { bg: { rgb: "#FEF3C7" }, cl: { rgb: "#92400E" } };

/** 设计态 token 灰底提示样式（含 {{token}} 的单元格），导出/预览时由 expandSnapshot 剥离 */
const TOKEN_HIGHLIGHT = { bg: { rgb: `#${TOKEN_HIGHLIGHT_BG}` } };

/** 设计态循环区域整体纯灰标记（整片区域），导出/预览时由 expandSnapshot 剥离 */
const REGION_GRAY = { bg: { rgb: `#${REGION_GRAY_BG}` } };

/** 明细表列（顺序即写入顺序） */
const LINE_COLUMNS: { key: string; label: string }[] = [
  { key: "line.name", label: "产品名称" },
  { key: "line.description", label: "描述" },
  { key: "line.quantity", label: "数量" },
  { key: "line.unit", label: "单位" },
  { key: "line.price", label: "单价" },
  { key: "line.discount", label: "折扣(%)" },
  { key: "line.taxRate", label: "税率(%)" },
  { key: "line.amount", label: "金额" },
];

/**
 * Univer 在线电子表格组件（可嵌入 Showcase 或报价单预览弹窗）。
 * 交互：左侧系统字段面板点击 → 把该字段的真实值写入右侧光标所在单元格；
 * 「插入明细表」按钮 → 在光标处一次性写入 表头 + 全部明细行（同步、无需预览/加载态）。
 */
const UniverSheetsDemoInner = forwardRef<UniverSheetsHandle, UniverSheetsProps>(
  function UniverSheetsDemo(
    { data, initialSnapshot, height = 600, fill = false, persistLoop = false, onLoopFinish, templateMode = false, hidePanel = false },
    ref,
  ) {
    const reactId = useId();
    const containerId = `univer-sheets-${reactId.replace(/:/g, "")}`;
    const univerRef = useRef<{ dispose: () => void } | null>(null);
    const apiRef = useRef<any>(null);
    const wbRef = useRef<any>(null);
    // 初始化完成前收到 loadSnapshot（弹窗打开即套默认模板的竞态）：暂存，初始化后补载
    const pendingSnapRef = useRef<unknown>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [status, setStatus] = useState<string>("先点选单元格，再点左侧字段——自动写入对应真实值");
    const [ready, setReady] = useState(false);

    // 循环明细表：框选区域 → 写占位符 → 完成
    const [loopMode, setLoopMode] = useState<null | "select" | "field">(null);
    const [pendingRange, setPendingRange] = useState<LoopConfig | null>(null);
    const [loopDefined, setLoopDefined] = useState(false);
    // 当前循环配置（命令式 getSnapshot 时挂载进快照）；从 initialSnapshot 还原，支持二次编辑模板
    const loopsRef = useRef<LoopConfig[]>([]);
    // 字段面板搜索（照小满：字段多时可直接检索）
    const [fieldSearch, setFieldSearch] = useState("");
    // 明细行所在行：手动输入行号区间定义循环区（照小满「产品字段编码所在行 12 ~ 13」）
    const [manualRows, setManualRows] = useState<{ from: string; to: string }>({ from: "", to: "" });

    // 工作簿唯一 id 序号：每次重载创建新工作簿时用，避免 Univer「same unit id」冲突
    const wbSeqRef = useRef(0);

    const previewData = data ?? sampleTemplateData();

    useEffect(() => {
      if (univerRef.current || !containerRef.current) return;

      let univer: { dispose: () => void } | null = null;
      try {
        const { univer: u, univerAPI } = createUniver({
          locale: LocaleType.ZH_CN,
          locales: {
            [LocaleType.ZH_CN]: mergeLocales(ZhCN, DrawingZhCN),
          },
          presets: [
            UniverSheetsCorePreset({ container: containerId }),
            UniverSheetsDrawingPreset(),
          ],
        });
        univer = u as { dispose: () => void };
        univerRef.current = univer;
        apiRef.current = univerAPI;
        // 载入初始快照（合法 Univer 快照优先；否则默认空表格），若格式有出入则退化为空白工作表。
        // 载入前按容器实际尺寸扩列/扩行，确保网格铺满视口（否则列数定义之外是空白死区）
        const snapRaw = isValidUniverSnapshot(initialSnapshot) ? initialSnapshot : emptySnapshot;
        const snap = ensureGridSize(
          snapRaw,
          containerRef.current?.clientWidth ?? 0,
          containerRef.current?.clientHeight ?? 0,
        );
        try {
          wbRef.current = univerAPI.createWorkbook(snap as never);
        } catch {
          try {
            wbRef.current = univerAPI.createWorkbook({} as never);
          } catch {
            /* 忽略 */
          }
        }
        // 确保新建工作簿处于激活态（部分版本 createWorkbook 不会自动激活）
        try {
          if (wbRef.current && typeof univerAPI.setActiveWorkbook === "function") {
            univerAPI.setActiveWorkbook(wbRef.current);
          }
        } catch {
          /* 忽略 */
        }
        // 初始化期间暂存的套用请求（loadSnapshot 早于就绪）：补载
        if (pendingSnapRef.current && wbRef.current) {
          const p = pendingSnapRef.current;
          pendingSnapRef.current = null;
          applySnapshot(p);
        }
        // dev 调试钩子：浏览器控制台可读取当前画布快照（E2E 验证灰底/loopConfig/展开行用）
        if (import.meta.env.DEV) {
          (window as unknown as { __univerSnapshot?: () => unknown }).__univerSnapshot = () => {
            try {
              return wbRef.current?.save?.();
            } catch {
              return null;
            }
          };
        }
      } catch (err) {
        console.error("Univer 初始化失败", err);
      } finally {
        // 无论初始化是否完全成功，都让画布进入可交互态（避免首开长时间骨架屏）
        setReady(true);
      }

      return () => {
        try {
          univer?.dispose();
        } catch {
          /* 忽略 */
        }
        // 清理容器内的 Univer DOM，避免 StrictMode 二次挂载时叠加
        if (containerRef.current) containerRef.current.innerHTML = "";
        univerRef.current = null;
        apiRef.current = null;
        wbRef.current = null;
        setReady(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 还原循环配置：套用模板（initialSnapshot 变化）时，把快照里的 loopConfig 读回，
    // 使模板设计器能识别「已定义循环表」并可重新编辑。预览传入的是已展开快照（无 loopConfig）。
    useEffect(() => {
      const loops = extractLoopsFromSnapshot(initialSnapshot);
      loopsRef.current = loops;
      setLoopDefined(loops.length > 0);
      setLoopMode(null);
      setPendingRange(null);
      // 设计态：区域内整片纯灰 + token 单元格蓝灰高亮
      try {
        applyDesignHighlight(loops);
      } catch {
        /* 忽略 */
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSnapshot]);

    // initialSnapshot 变化时（如明细行数据异步加载完成、或退出设计态切回展开成品）
    // 重新套用画布，保证画布与最新快照一致。跳过首帧：挂载时初始化已套用一次。
    const prevSnapRef = useRef(initialSnapshot);
    useEffect(() => {
      if (!ready) return;
      if (prevSnapRef.current === initialSnapshot) return;
      prevSnapRef.current = initialSnapshot;
      try {
        applySnapshot(initialSnapshot);
      } catch (err) {
        console.error("套用快照失败", err);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSnapshot, ready]);

    /** 释放旧工作簿并按快照新建（未就绪时由 loadSnapshot 暂存 pending，不直接调用） */
    const applySnapshot = (snap: unknown) => {
      const api = apiRef.current;
      if (!api) return;
      try {
        const old = wbRef.current;
        if (old) {
          try {
            old.dispose?.();
          } catch {
            /* 忽略 */
          }
          try {
            api.disposeWorkbook?.(old);
          } catch {
            /* 忽略 */
          }
        }
        const snapRaw = isValidUniverSnapshot(snap) ? snap : emptySnapshot;
        // 每次新建都用唯一 unit id，避免 Univer 报「same unit id」导致重载失败
        const snapWithId = { ...(snapRaw as Record<string, unknown>), id: `sheet-${++wbSeqRef.current}` } as unknown;
        const sized = ensureGridSize(
          snapWithId,
          containerRef.current?.clientWidth ?? 0,
          containerRef.current?.clientHeight ?? 0,
        );
        const wb = api.createWorkbook(sized as never);
        wbRef.current = wb;
        try {
          if (typeof api.setActiveWorkbook === "function") api.setActiveWorkbook(wb);
        } catch {
          /* 忽略 */
        }
        // 套用模板后，按快照内的循环配置还原，并给循环区域/token 套灰底提示
        const loops = extractLoopsFromSnapshot(snap);
        loopsRef.current = loops;
        setLoopDefined(loops.length > 0);
        try {
          applyDesignHighlight(loops);
        } catch {
          /* 忽略 */
        }
        setReady(true);
      } catch (err) {
        console.error("载入工作簿快照失败", err);
      }
    };

    useImperativeHandle(ref, () => ({
      getSnapshot: async () => {
        const wb = wbRef.current;
        if (!wb) return null;
        try {
          if (typeof wb.save === "function") {
            const snap = await wb.save();
            // 模板设计器需把循环定义一起写回；预览是已展开成品，不回挂（避免二次展开）
            if (snap && persistLoop) snap.loopConfig = loopsRef.current;
            return snap;
          }
        } catch (err) {
          console.error("导出 Univer 快照失败", err);
        }
        return null;
      },
      // 套用模板：释放旧工作簿，按快照新建（按容器尺寸扩列/扩行），不重建整个 Univer 实例。
      // 未就绪时暂存 pending，初始化完成后补载（弹窗打开即套默认模板的竞态）。
      loadSnapshot: (snap: unknown) => {
        const api = apiRef.current;
        if (!api) {
          pendingSnapRef.current = snap;
          return;
        }
        applySnapshot(snap);
      },
      // 导出 Excel：取当前工作簿快照 → 转 .xlsx → 浏览器下载（开源 Univer 无 exportXlsx，自研转换）
      exportXlsx: async (filename = "quotation.xlsx") => {
        const snap = await wbRef.current?.save?.();
        if (snap) await downloadUniverSnapshot(snap, filename);
      },
      // 当前选区的 A1 表示（循环列弹窗「读取当前选区」）
      getSelectedA1: () => {
        const b = getSelectedRangeBounds(wbRef.current);
        return b ? rangeToA1(b) : null;
      },
      // 进入循环字段绑定模式：明细字段点击写入占位符（循环列弹窗确认后调用）
      beginLoopBinding: () => {
        const loop = loopsRef.current[0];
        if (!loop) return;
        setPendingRange(loop);
        setLoopMode("field");
        setStatus("循环区域已标记（纯灰）。点选区域内单元格 → 点左侧「明细字段」绑定占位符；完成后点「完成循环表」展开完整明细");
      },
      // 把原始文本写入当前选中单元格（快捷文本插入；不解析不格式化）
      insertText: (text: string) => {
        const wb = wbRef.current;
        if (!wb) return;
        try {
          const anchor = getAnchor(wb);
          if (!anchor) return;
          anchor.sheet.getRange(anchor.row, anchor.col).setValue(text);
        } catch (err) {
          console.error("写入文本失败", err);
        }
      },
    }));

    /** 取当前激活单元格作为写入起点；无选中则落到 A1（row/col 从 0 计） */
    const getAnchor = (wb: any): { sheet: any; row: number; col: number } | null => {
      const sheet =
        wb.getActiveSheet?.() ??
        (typeof wb.getSheetByName === "function" ? wb.getSheetByName("sheet1") : null);
      if (!sheet) return null;
      const range = sheet.getActiveRange?.();
      const irange = range && typeof range.getRange === "function" ? range.getRange() : null;
      const row = irange ? (irange as { startRow: number }).startRow : 0;
      const col = irange ? (irange as { startColumn: number }).startColumn : 0;
      return { sheet, row, col };
    };

    /** 点选系统字段 → 模板模式写 {{占位符}}（导出时解析），演示模式写真实值 */
    const insertField = (key: string) => {
      const wb = wbRef.current;
      if (!wb) return;
      try {
        const anchor = getAnchor(wb);
        if (!anchor) return;
        const { sheet, row, col } = anchor;
        const def = FIELD_DEFS.find((f) => f.key === key);
        const cellRange = sheet.getRange(row, col);
        if (templateMode) {
          cellRange.setValue(`{{${key}}}`);
          if (typeof cellRange.setStyle === "function") {
            try {
              cellRange.setStyle(TOKEN_HIGHLIGHT);
            } catch {
              /* 忽略 */
            }
          }
        } else {
          const raw = resolveKey(previewData, key);
          const value = def ? formatField(def, raw) : raw == null ? "" : String(raw);
          cellRange.setValue(value === "" ? "—" : value);
          // 高亮标记「字段自动填充」，便于区分手动录入（API 不存在时安全跳过）
          if (typeof cellRange.setStyle === "function") {
            try {
              cellRange.setStyle(FILLED_STYLE);
            } catch {
              /* 忽略 */
            }
          }
        }
        const a1 = typeof cellRange.getA1Notation === "function" ? cellRange.getA1Notation() : "";
        setStatus(
          templateMode
            ? `已插入占位符 {{${key}}} → ${a1 || "单元格"}`
            : `已写入 ${def?.label ?? key} → ${a1 || "单元格"}`,
        );
      } catch (err) {
        console.error("写入字段失败", err);
        setStatus("写入失败：请先点选一个单元格");
      }
    };

    /** 插入明细表：在光标处同步写入 表头 + 全部明细行（一次性，无需循环/加载态） */
    const insertLineTable = () => {
      const wb = wbRef.current;
      if (!wb) return;
      try {
        const anchor = getAnchor(wb);
        if (!anchor) return;
        const { sheet, row, col } = anchor;
        const lines = previewData.lines ?? [];
        if (!lines.length) {
          setStatus("当前报价单无明细行可插入");
          return;
        }
        const header = LINE_COLUMNS.map((c) => c.label);
        const body = lines.map((line) =>
          LINE_COLUMNS.map((c) => {
            const def = FIELD_DEFS.find((f) => f.key === c.key)!;
            const v = formatField(def, resolveKey(previewData, c.key, line));
            return v === "" ? "—" : v;
          }),
        );
        const values = [header, ...body];
        const range = sheet.getRange(row, col, values.length, values[0].length);
        range.setValues(values);
        setStatus(`已插入明细表（${lines.length} 行）`);
      } catch (err) {
        console.error("插入明细表失败", err);
        setStatus("插入明细表失败");
      }
    };

    /** 读取当前鼠标框选的完整选区范围（0 基，含端点）；无选区返回 null */
    const getSelectedRangeBounds = (wb: any): LoopConfig | null => {
      const sheet =
        wb.getActiveSheet?.() ??
        (typeof wb.getSheetByName === "function" ? wb.getSheetByName("sheet1") : null);
      if (!sheet) return null;
      const range = sheet.getActiveRange?.();
      const ir = range && typeof range.getRange === "function" ? range.getRange() : range;
      if (!ir) return null;
      const { startRow, endRow, startColumn, endColumn } = ir as {
        startRow: number;
        endRow: number;
        startColumn: number;
        endColumn: number;
      };
      if ([startRow, endRow, startColumn, endColumn].some((n) => typeof n !== "number")) return null;
      return { sheetId: sheet.getSheetId?.() ?? "sheet1", startRow, endRow, startColumn, endColumn };
    };

    /**
     * 设计态循环区域标记：区域内整片单元格纯灰底（证明该区域按明细行循环），
     * 含 {{token}} 的单元格再叠加蓝灰高亮；已有填充（用户区块色）保留不动。
     * 通过 Univer 的 setStyle 写入（与 FILLED_STYLE 同机制，会随模板保存）；
     * 导出/预览时由 expandSnapshot 剥离这两种底色，成品明细行不带灰底。
     */
    const applyDesignHighlight = (regions?: LoopConfig[]) => {
      const wb = wbRef.current;
      if (!wb) return;
      const list = regions ?? loopsRef.current;
      if (!list.length) return;
      const sheet =
        wb.getActiveSheet?.() ??
        (typeof wb.getSheetByName === "function" ? wb.getSheetByName("sheet1") : null);
      if (!sheet) return;
      // 读一次当前快照，识别哪些单元格已有填充（避免覆盖用户设置的区块色）
      let styles: Record<string, any> = {};
      let cellData: Record<string, any> = {};
      try {
        const snap = typeof wb.save === "function" ? wb.save() : null;
        if (snap) {
          styles = snap.styles ?? {};
          const sid = sheet.getSheetId?.();
          cellData = snap.sheets?.[sid]?.cellData ?? {};
        }
      } catch {
        /* 忽略 */
      }
      const existingBg = (r: number, c: number) => {
        const cell = cellData[String(r)]?.[String(c)];
        const s = cell?.s;
        const st = typeof s === "string" ? styles[s] : s;
        return st?.bg?.rgb;
      };
      for (const rg of list) {
        for (let r = rg.startRow; r <= rg.endRow; r++) {
          for (let c = rg.startColumn; c <= rg.endColumn; c++) {
            try {
              const range = sheet.getRange(r, c);
              const v = typeof range.getValue === "function" ? range.getValue() : undefined;
              if (typeof v === "string" && v.includes("{{")) {
                if (typeof range.setStyle === "function") range.setStyle(TOKEN_HIGHLIGHT);
                continue;
              }
              if (!existingBg(r, c) && typeof range.setStyle === "function") {
                range.setStyle(REGION_GRAY);
              }
            } catch {
              /* 忽略 */
            }
          }
        }
      }
    };

    // ---- 循环明细表流程：添加 → 框选区域 → 确认 → 写占位符 → 完成 ----
    const handleStartLoop = () => {
      setPendingRange(null);
      setLoopMode("select");
      setStatus("框选循环区域：用鼠标拖选要按明细循环的区域，再点「确认区域」");
    };
    /** 自动识别循环区域：扫描含 {{line.*}} 产品字段占位符的单元格，取其行列包围盒 */
    const handleAutoDetectLoop = () => {
      const wb = wbRef.current;
      if (!wb) return;
      try {
        const snap = typeof wb.save === "function" ? wb.save() : null;
        const region = snap ? detectLoopRegionFromLines(snap) : null;
        if (!region) {
          setStatus("未找到产品字段占位符（{{line.*}}）：请先在明细行写入产品字段");
          return;
        }
        loopsRef.current = [region];
        setLoopDefined(true);
        setLoopMode(null);
        setPendingRange(null);
        try {
          applyDesignHighlight([region]);
        } catch {
          /* 忽略 */
        }
        setStatus(
          `已按产品字段所在行识别循环区域 ${rangeToA1(region)}（整片纯灰标记），完成保存后导出时按明细行展开`,
        );
      } catch (err) {
        console.error("自动识别循环区域失败", err);
        setStatus("自动识别循环区域失败");
      }
    };
    const handleConfirmRange = () => {
      const wb = wbRef.current;
      if (!wb) return;
      const b = getSelectedRangeBounds(wb);
      if (!b) {
        setStatus("未检测到选区，请先用鼠标拖选一片单元格");
        return;
      }
      setPendingRange(b);
      setLoopMode("field");
      try {
        applyDesignHighlight([b]);
      } catch {
        /* 忽略 */
      }
      setStatus("已确认区域。现在点选区域内单元格，再点左侧「明细字段」写入占位符；完成后点「完成循环表」");
    };
    const handleFinishLoop = () => {
      if (!pendingRange) {
        setLoopMode(null);
        return;
      }
      loopsRef.current = [pendingRange];
      setLoopDefined(true);
      setLoopMode(null);
      setPendingRange(null);
      if (onLoopFinish) {
        // 宿主（报价单弹窗）负责取快照并展开完整明细
        onLoopFinish();
        return;
      }
      setStatus("循环表已定义：预览时将按明细行逐行展开真实字段");
    };
    const handleLoopCancel = () => {
      setLoopMode(null);
      setPendingRange(null);
      setStatus("已取消循环表定义");
    };
    const handleClearLoop = () => {
      loopsRef.current = [];
      setLoopDefined(false);
      setLoopMode(null);
      setPendingRange(null);
      setStatus("已清除循环表定义（单元格内占位符需手动删除）");
    };
    /** 照小满「产品字段编码所在行」：手动输入行号区间（1 起始，显示行号）定义明细循环区。
     *  整行覆盖（列向取整表宽度），展开时按区间行数 × 明细行数复制。 */
    const handleManualLoop = () => {
      const from = parseInt(manualRows.from, 10);
      const to = parseInt(manualRows.to, 10);
      if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < from) {
        setStatus("请输入有效的行号区间（起始 ≤ 结束，从第 1 行起）");
        return;
      }
      try {
        const wb = wbRef.current;
        const sheet = wb?.getActiveSheet?.() ?? wb?.getSheets?.()?.[0];
        const saved = wb?.save?.() as { sheets?: Record<string, unknown> } | undefined;
        const sheetId =
          sheet?.getSheetId?.() ??
          (saved?.sheets ? Object.keys(saved.sheets)[0] : "") ??
          "";
        if (!sheetId) {
          setStatus("定义循环区失败：未找到工作表");
          return;
        }
        const maxCol = Math.max(0, (sheet?.getMaxColumns?.() ?? 30) - 1);
        const range: LoopConfig = {
          sheetId,
          startRow: from - 1,
          startColumn: 0,
          endRow: to - 1,
          endColumn: maxCol,
        };
        loopsRef.current = [range];
        setLoopDefined(true);
        setLoopMode(null);
        setPendingRange(null);
        try {
          applyDesignHighlight([range]);
        } catch {
          /* 忽略 */
        }
        setStatus(`已按行号定义明细循环区：第 ${from} ~ ${to} 行`);
      } catch (err) {
        console.error("手动定义循环区失败", err);
        setStatus("定义循环区失败");
      }
    };

    return (
      <div className={`flex min-h-0 w-full min-w-0 flex-col gap-3 ${fill ? "h-full" : ""}`}>
        {/* 顶部：说明（纯查看场景不显示） */}
        {!hidePanel && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              点选左侧系统字段，自动把该字段的真实值写入右侧光标所在单元格
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 lg:flex-row flex-1 min-h-0">
          {/* 左侧：系统字段面板（点击写入真实值 / 一键插入明细表）。
              撑满整行高度（与右侧表格等高），内容超高时面板内部滚动，不留底部空白 */}
          <div
            className={`overflow-y-auto rounded-lg border border-border bg-card p-3 ${
              hidePanel
                ? "hidden"
                : "flex min-h-0 w-full shrink-0 flex-col lg:w-64"
            }`}
            style={fill ? undefined : { maxHeight: height }}
          >
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              {templateMode ? "系统字段（点击插入 {{占位符}}）" : "系统字段（点击写入真实值）"}
            </p>
            {/* 照小满：字段可搜索 */}
            <Input
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              placeholder="搜索字段"
              className="mb-2 h-8 w-full rounded-lg"
            />
            <div className="flex flex-col gap-3">
              {FIELD_GROUPS.filter((g) => g.id !== "line").map((group) => {
                const kw = fieldSearch.trim().toLowerCase();
                const fields = FIELD_DEFS.filter(
                  (f) =>
                    f.group === group.id &&
                    (!kw || f.label.toLowerCase().includes(kw) || f.key.toLowerCase().includes(kw)),
                );
                if (!fields.length) return null;
                return (
                  <div key={group.id}>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="flex flex-col gap-1">
                      {fields.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => insertField(f.key)}
                          className="w-full rounded border border-border bg-background px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* 循环明细表：框选区域 → 写占位符 → 按明细行循环渲染真实字段 */}
              <div className="rounded-md border border-dashed border-primary/40 p-2">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  循环明细表（按行展开）
                </p>

                {loopMode === null && !loopDefined && (
                  <div className="flex flex-col gap-1">
                    <Button size="sm" className="w-full" onClick={handleStartLoop}>
                      添加循环表
                    </Button>
                    <Button size="sm" variant="outline" className="w-full" onClick={handleAutoDetectLoop}>
                      按产品字段所在行自动识别
                    </Button>
                  </div>
                )}

                {loopMode === "select" && (
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] text-muted-foreground">拖选循环区域后确认</p>
                    <div className="flex gap-1">
                      <Button size="sm" className="flex-1" onClick={handleConfirmRange}>
                        确认区域
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleLoopCancel}>
                        取消
                      </Button>
                    </div>
                  </div>
                )}

                {loopMode === "field" && (
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] text-muted-foreground">点单元格→点下方字段写占位符</p>
                    <div className="flex gap-1">
                      <Button size="sm" className="flex-1" onClick={handleFinishLoop}>
                        完成循环表
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleLoopCancel}>
                        取消
                      </Button>
                    </div>
                  </div>
                )}

                {loopDefined && loopMode === null && (
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] text-emerald-600">已定义循环表（按明细行循环）</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="flex-1" onClick={handleStartLoop}>
                        重新定义
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleClearLoop}>
                        清除
                      </Button>
                    </div>
                  </div>
                )}

                {/* 照小满「产品字段编码所在行」：手动输入行号区间定义明细循环区 */}
                {loopMode === null && (
                  <div className="mt-2 flex flex-col gap-1">
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      明细行所在行（输入行号）
                    </p>
                    <div className="flex items-center gap-1">
                      <Input
                        value={manualRows.from}
                        onChange={(e) => setManualRows((s) => ({ ...s, from: e.target.value }))}
                        inputMode="numeric"
                        placeholder="起始行"
                        className="h-7 rounded-lg px-2 text-xs"
                      />
                      <span className="shrink-0 text-xs text-muted-foreground">~</span>
                      <Input
                        value={manualRows.to}
                        onChange={(e) => setManualRows((s) => ({ ...s, to: e.target.value }))}
                        inputMode="numeric"
                        placeholder="结束行"
                        className="h-7 rounded-lg px-2 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 shrink-0 px-2 text-xs"
                        onClick={handleManualLoop}
                      >
                        确定
                      </Button>
                    </div>
                  </div>
                )}

                {/* 明细字段：模板模式下点击即写入 {{line.x}} 占位符（灰底提示）；
                    产品字段编码所在行即明细循环区域，导出时自动按明细行展开，
                    无需先进入循环绑定模式 */}
                <p className="mb-1 mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  明细字段（点击写入 {"{{占位符}}"}）
                </p>
                <div className="flex flex-col gap-1">
                  {FIELD_DEFS.filter((f) => {
                    const kw = fieldSearch.trim().toLowerCase();
                    return (
                      f.group === "line" &&
                      (!kw || f.label.toLowerCase().includes(kw) || f.key.toLowerCase().includes(kw))
                    );
                  }).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => insertField(f.key)}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* 传统一次性插入（样例数据），非模板循环用法 */}
                <button
                  type="button"
                  onClick={insertLineTable}
                  className="mt-2 w-full rounded border border-border px-2 py-1.5 text-center text-[11px] text-muted-foreground transition-colors hover:bg-accent"
                >
                  快速插入明细表（{(previewData.lines ?? []).length} 行）
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：Univer 工作表。画布绝对定位（尺寸不参与布局）→ 父级高度链确定后
              Univer 只测量一次，不再被滚动条/回弹反复触发整表重渲染 */}
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              className={fill ? "relative min-h-0 flex-1" : "relative shrink-0"}
              style={fill ? undefined : { height }}
            >
              <div
                ref={containerRef}
                id={containerId}
                className="absolute inset-0 overflow-hidden rounded-lg"
              />
              {!ready && <Skeleton className="absolute inset-0 rounded-lg" />}
            </div>
          </div>
        </div>
        {/* 状态行放在两栏之外：不参与行高计算，保证左右两栏（面板与画布）严格等高 */}
        <p className="shrink-0 text-xs text-muted-foreground">{status}</p>
      </div>
    );
  },
);

const UniverSheetsDemo = memo(UniverSheetsDemoInner);
UniverSheetsDemo.displayName = "UniverSheetsDemo";

export default UniverSheetsDemo;

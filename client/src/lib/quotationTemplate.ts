import type { JSONContent } from "@tiptap/core";
import {
  FIELD_DEFS,
  formatField,
  resolveKey,
  type TemplateData,
  type LineItem,
} from "./quotationFields";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fieldDefByKey = new Map(FIELD_DEFS.map((f) => [f.key, f]));

function resolveField(key: string, data: TemplateData, loopItem?: LineItem): string {
  const def = fieldDefByKey.get(key);
  if (!def) return `{{${key}}}`;
  return formatField(def, resolveKey(data, key, loopItem));
}

function renderInline(
  nodes: JSONContent[] | undefined,
  data: TemplateData,
  loopItem?: LineItem,
): string {
  if (!nodes) return "";
  let html = "";
  for (const n of nodes) {
    if (n.type === "text") {
      let t = escapeHtml(n.text ?? "");
      for (const m of n.marks ?? []) {
        if (m.type === "bold") t = `<strong>${t}</strong>`;
        else if (m.type === "italic") t = `<em>${t}</em>`;
        else if (m.type === "strike") t = `<s>${t}</s>`;
        else if (m.type === "code") t = `<code>${t}</code>`;
      }
      html += t;
    } else if (n.type === "mergeField") {
      html += resolveField((n.attrs?.key as string) ?? "", data, loopItem);
    } else if (n.type === "hardBreak") {
      html += "<br>";
    }
  }
  return html;
}

function renderCell(cell: JSONContent, data: TemplateData, loopItem?: LineItem): string {
  const inner = (cell.content ?? []).map((b) => renderBlock(b, data, loopItem)).join("");
  return `<td class="qt-cell">${inner}</td>`;
}

function renderRow(row: JSONContent, data: TemplateData, loopItem?: LineItem): string {
  return `<tr>${(row.content ?? []).map((c) => renderCell(c, data, loopItem)).join("")}</tr>`;
}

/** 递归判断节点树是否包含 line.* 合并字段（用于自动识别循环表） */
function containsLineField(node: JSONContent): boolean {
  if (node.type === "mergeField") {
    const key = node.attrs?.key;
    return typeof key === "string" && key.startsWith("line.");
  }
  return (node.content ?? []).some(containsLineField);
}

function renderBlock(node: JSONContent, data: TemplateData, loopItem?: LineItem): string {
  switch (node.type) {
    case "paragraph":
      return `<p>${renderInline(node.content, data, loopItem)}</p>`;
    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      return `<h${level}>${renderInline(node.content, data, loopItem)}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${(node.content ?? []).map((li) => `<li>${renderBlock(li, data, loopItem)}</li>`).join("")}</ul>`;
    case "orderedList":
      return `<ol>${(node.content ?? []).map((li) => `<li>${renderBlock(li, data, loopItem)}</li>`).join("")}</ol>`;
    case "listItem":
      return (node.content ?? []).map((b) => renderBlock(b, data, loopItem)).join("");
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map((b) => renderBlock(b, data, loopItem)).join("")}</blockquote>`;
    case "horizontalRule":
      return "<hr>";
    case "table": {
      const rows = node.content ?? [];
      const isLoop = containsLineField(node);
      const header = rows[0] ? renderRow(rows[0], data) : "";
      let body = "";
      if (isLoop) {
        const bodyRows = rows.slice(1);
        for (const item of data.lines) {
          body += bodyRows.map((r) => renderRow(r, data, item)).join("");
        }
      } else {
        body = rows.slice(1).map((r) => renderRow(r, data)).join("");
      }
      return `<table class="qt-table"><thead>${header}</thead><tbody>${body}</tbody></table>`;
    }
    case "tableRow":
      return `<tr>${(node.content ?? []).map((c) => renderCell(c, data, loopItem)).join("")}</tr>`;
    default:
      return renderInline(node.content, data, loopItem);
  }
}

/**
 * 报价单文档渲染样式（自包含、随 HTML 输出，预览/冻结副本/未来打印 PDF 一致）。
 * 设计语言：品牌黄 #FFD54F 点缀 + 浅色标题带 + 规整表格，读起来像一份正式报价单纸张；
 * 只作用于 .qt-doc 作用域，不污染全局；结构与可编辑性保持不变。
 */
const QT_DOC_STYLE = `
.qt-doc{box-sizing:border-box;background:#fff;color:#1f2937;font-size:14px;line-height:1.7;
  padding:36px 40px;border:1px solid #eef0f4;border-radius:12px;
  box-shadow:0 1px 2px rgba(16,24,40,.04),0 10px 30px rgba(16,24,40,.06)}
.qt-doc *{box-sizing:border-box}
.qt-doc h1{margin:0 0 20px;font-size:27px;font-weight:800;letter-spacing:-.01em;color:#111827;
  display:flex;align-items:center;gap:12px}
.qt-doc h1::before{content:"";width:7px;height:28px;border-radius:4px;background:#FFD54F;display:inline-block}
.qt-doc h2{margin:26px 0 12px;font-size:18px;font-weight:700;color:#111827;
  border-bottom:2px solid #FFD54F;padding-bottom:7px}
.qt-doc h3{margin:18px 0 8px;font-size:15px;font-weight:700;color:#374151}
.qt-doc h4{margin:14px 0 6px;font-size:14px;font-weight:700;color:#374151}
.qt-doc h5{margin:12px 0 6px;font-size:13.5px;font-weight:600;color:#4b5563}
.qt-doc h6{margin:10px 0 6px;font-size:13px;font-weight:600;color:#4b5563}
.qt-doc p{margin:9px 0}
.qt-doc ul,.qt-doc ol{margin:9px 0;padding-left:22px}
.qt-doc li{margin:3px 0}
.qt-doc blockquote{margin:14px 0;padding:11px 16px;border-left:4px solid #FFD54F;
  background:#fff8e1;border-radius:0 8px 8px 0;color:#6b7280;font-style:normal}
.qt-doc hr{border:0;border-top:1px solid #eef0f4;margin:20px 0}
.qt-doc a{color:#b45309;text-decoration:underline}
.qt-doc code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#f3f4f6;
  padding:1px 6px;border-radius:4px;font-size:.9em}
.qt-doc table.qt-table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13.5px;
  overflow:hidden;border-radius:8px;box-shadow:0 0 0 1px #eef0f4}
.qt-doc table.qt-table thead th{background:linear-gradient(180deg,#fff8e1,#fef3c7);color:#5b4a12;
  font-weight:700;text-align:left;padding:11px 13px;border-bottom:2px solid #fcd34d}
.qt-doc table.qt-table td.qt-cell{padding:10px 13px;border:1px solid #eef0f4;vertical-align:top}
.qt-doc table.qt-table tbody tr:nth-child(even){background:#fcfcfd}
.qt-doc table.qt-table tbody tr:hover{background:#fff8e1}
.qt-doc .merge-field{display:inline-block;background:#fef3c7;color:#92400e;border:1px solid #fde68a;
  border-radius:5px;padding:0 6px;font-size:.88em;font-weight:600;white-space:nowrap}
.qt-doc strong{font-weight:700;color:#111827}
`;

/** 把模板（TipTap JSON）+ 数据渲染为最终 HTML：替换合并字段、循环展开 lines 表。 */
export function renderTemplate(doc: JSONContent, data: TemplateData): string {
  const body = (doc.content ?? []).map((b) => renderBlock(b, data)).join("");
  return `<article class="qt-doc"><style>${QT_DOC_STYLE}</style><div class="qt-doc-body">${body}</div></article>`;
}

import { useMemo } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { MergeField } from "@/lib/tiptap/templateNodes";
import {
  FIELD_DEFS,
  FIELD_GROUPS,
  type FieldDef,
  type TemplateData,
} from "@/lib/quotationFields";
import { renderTemplate } from "@/lib/quotationTemplate";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Pilcrow,
  Code,
  SquareCode,
  List,
  ListOrdered,
  Quote,
  Table,
  Rows3,
  Columns3,
  Plus,
  Minus,
  PanelTop,
  Trash2,
  Undo2,
  Redo2,
  type LucideIcon,
} from "lucide-react";

/** 工具栏组合图标：底图标 + 右上角加/减角标（表格行/列增删用）。 */
function IconBadge({ Base, badge }: { Base: LucideIcon; badge: "+" | "-" }) {
  return (
    <span className="relative inline-flex">
      <Base className="size-4" />
      {badge === "+" ? (
        <Plus className="absolute -right-1.5 -top-1 size-2.5 stroke-[3]" />
      ) : (
        <Minus className="absolute -right-1.5 -top-1 size-2.5 stroke-[3]" />
      )}
    </span>
  );
}

export type TemplateMode = "edit" | "preview";

interface TemplateEditorCoreProps {
  /** 渲染数据（真实报价单或样例） */
  data: TemplateData;
  /** 初始模板内容（TipTap JSON，含 mergeField 占位符） */
  initialDoc: JSONContent;
  /** 受控模式：edit=编辑 / preview=预览 */
  mode: TemplateMode;
  /** 文档内容变化回调（用于按单编辑的保存/脏检测） */
  onDocChange?: (doc: JSONContent) => void;
  /** 是否显示左侧系统字段调色板（设计器/弹窗内可插入字段） */
  palette?: boolean;
  className?: string;
}

function ToolBtn({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={
        "inline-flex size-7 items-center justify-center rounded-md transition-colors " +
        (active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

/**
 * 模板编辑器核心：字段调色板 + TipTap 富文本工具条 + 编辑/预览。
 * 设计器（模板管理页）与详情页「预览报价单」弹窗共用本组件，避免两份实现。
 */
export default function TemplateEditorCore({
  data,
  initialDoc,
  mode,
  onDocChange,
  palette = true,
  className,
}: TemplateEditorCoreProps) {
  const editor: Editor | null = useEditor({
    extensions: [StarterKit, TableKit, MergeField],
    content: initialDoc,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onDocChange?.(editor.getJSON()),
  });

  const previewHtml = useMemo(
    () => (mode === "preview" && editor ? renderTemplate(editor.getJSON(), data) : ""),
    [mode, editor, data],
  );

  if (!editor) return null;

  const insertField = (def: FieldDef) =>
    editor
      .chain()
      .focus()
      .insertContent({ type: "mergeField", attrs: { key: def.key, label: def.label } })
      .run();

  const insertTable = () =>
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  const onDrop = (e: React.DragEvent) => {
    const key = e.dataTransfer.getData("application/x-merge-field");
    if (!key) return;
    e.preventDefault();
    const def = FIELD_DEFS.find((f) => f.key === key);
    const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
    if (pos)
      editor
        .chain()
        .focus()
        .insertContentAt(pos.pos, {
          type: "mergeField",
          attrs: { key, label: def?.label ?? key },
        })
        .run();
  };

  return (
    <div className={className}>
      <style>{`
        .merge-field{background:#eef2ff;color:#4338ca;border-radius:4px;padding:0 4px;font-size:.85em;white-space:nowrap;}
        .qt-table{width:100%;border-collapse:collapse;margin:.5rem 0;}
        .qt-table th,.qt-table td,.qt-cell{border:1px solid #d1d5db;padding:4px 8px;}
        .qt-table thead{background:#f9fafb;}
      `}</style>

      <div className="flex min-h-0 flex-1 flex-row gap-3">
        {palette && mode === "edit" && (
          <div className="w-56 shrink-0 overflow-y-auto rounded-md border border-border bg-muted/20 p-3">
            <div className="mb-2 text-sm font-semibold">系统字段</div>
            <p className="mb-2 text-xs text-muted-foreground">拖入编辑器，或点击插入</p>
            <div className="flex flex-col gap-3">
              {FIELD_GROUPS.map((g) => (
                <div key={g.id}>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">{g.label}</div>
                  <div className="flex flex-wrap gap-1">
                    {FIELD_DEFS.filter((f) => f.group === g.id).map((f) => (
                      <span
                        key={f.key}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("application/x-merge-field", f.key)
                        }
                        onClick={() => insertField(f)}
                        className="cursor-grab rounded border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                        title="拖入编辑器或点击插入"
                      >
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 编辑框：外层统一边框容器，工具栏作为顶部操作带（下边框分隔），内容区在框内滚动 */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-background">
          {mode === "edit" && (
            <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-1.5 py-1">
              <ToolBtn
                title="加粗"
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <Bold className="size-4" />
              </ToolBtn>
              <ToolBtn
                title="斜体"
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <Italic className="size-4" />
              </ToolBtn>
              <ToolBtn
                title="删除线"
                active={editor.isActive("strike")}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                <Strikethrough className="size-4" />
              </ToolBtn>
              <ToolBtn
                title="行内代码"
                active={editor.isActive("code")}
                onClick={() => editor.chain().focus().toggleCode().run()}
              >
                <Code className="size-4" />
              </ToolBtn>
              <span className="mx-1 h-5 w-px bg-border" />
              <ToolBtn
                title="正文"
                active={editor.isActive("paragraph") && !editor.isActive("heading")}
                onClick={() => editor.chain().focus().setParagraph().run()}
              >
                <Pilcrow className="size-4" />
              </ToolBtn>
              <ToolBtn
                title="一级标题"
                active={editor.isActive("heading", { level: 1 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                <Heading1 className="size-4" />
              </ToolBtn>
              <ToolBtn
                title="标题"
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <Heading2 className="size-4" />
              </ToolBtn>
              <ToolBtn
                title="小标题"
                active={editor.isActive("heading", { level: 3 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              >
                <Heading3 className="size-4" />
              </ToolBtn>
              <ToolBtn
                title="四级标题"
                active={editor.isActive("heading", { level: 4 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
              >
                <Heading4 className="size-4" />
              </ToolBtn>
              <ToolBtn
                title="五级标题"
                active={editor.isActive("heading", { level: 5 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
              >
                <Heading5 className="size-4" />
              </ToolBtn>
              <ToolBtn
                title="六级标题"
                active={editor.isActive("heading", { level: 6 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
              >
                <Heading6 className="size-4" />
              </ToolBtn>
              <span className="mx-1 h-5 w-px bg-border" />
              <ToolBtn
                title="无序列表"
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List className="size-4" />
              </ToolBtn>
              <ToolBtn
                title="有序列表"
                active={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="size-4" />
              </ToolBtn>
              <ToolBtn
                title="引用"
                active={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <Quote className="size-4" />
              </ToolBtn>
              <span className="mx-1 h-5 w-px bg-border" />
              <ToolBtn title="插入表格" onClick={insertTable}>
                <Table className="size-4" />
              </ToolBtn>
              {editor.isActive("table") && (
                <>
                  <span className="mx-1 h-5 w-px bg-border" />
                  <ToolBtn
                    title="下方加一行"
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                  >
                    <IconBadge Base={Rows3} badge="+" />
                  </ToolBtn>
                  <ToolBtn title="删除当前行" onClick={() => editor.chain().focus().deleteRow().run()}>
                    <IconBadge Base={Rows3} badge="-" />
                  </ToolBtn>
                  <ToolBtn
                    title="右侧加一列"
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                  >
                    <IconBadge Base={Columns3} badge="+" />
                  </ToolBtn>
                  <ToolBtn
                    title="删除当前列"
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                  >
                    <IconBadge Base={Columns3} badge="-" />
                  </ToolBtn>
                  <ToolBtn
                    title="切换表头行"
                    active={editor.isActive("tableHeader")}
                    onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                  >
                    <PanelTop className="size-4" />
                  </ToolBtn>
                  <ToolBtn title="删除整表" onClick={() => editor.chain().focus().deleteTable().run()}>
                    <Trash2 className="size-4" />
                  </ToolBtn>
                </>
              )}
              <ToolBtn title="分割线" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus className="size-4" />
              </ToolBtn>
              <ToolBtn
                title="代码块"
                active={editor.isActive("codeBlock")}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              >
                <SquareCode className="size-4" />
              </ToolBtn>
              <span className="mx-1 h-5 w-px bg-border" />
              <ToolBtn title="撤销" onClick={() => editor.chain().focus().undo().run()}>
                <Undo2 className="size-4" />
              </ToolBtn>
              <ToolBtn title="重做" onClick={() => editor.chain().focus().redo().run()}>
                <Redo2 className="size-4" />
              </ToolBtn>
            </div>
          )}

          {/* 编辑器常驻挂载（预览时仅隐藏）：条件卸载会让 ProseMirror 视图与 DOM 分离，工具栏点击无效 */}
          <div
            className={
              "min-h-0 flex-1 overflow-y-auto p-4 text-sm leading-relaxed text-foreground [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h4]:mb-1 [&_h4]:mt-2 [&_h4]:text-sm [&_h4]:font-semibold [&_h5]:mb-1 [&_h5]:mt-2 [&_h5]:text-sm [&_h5]:font-medium [&_h6]:mb-1 [&_h6]:mt-2 [&_h6]:text-sm [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-1 [&_td]:border [&_td]:border-border [&_td]:p-1 " +
              (mode === "edit" ? "" : "hidden")
            }
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <EditorContent editor={editor} />
          </div>
          {mode === "preview" && (
            <div
              className="rendered-doc min-h-0 flex-1 overflow-y-auto p-6 text-sm leading-relaxed text-foreground [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h4]:mb-1 [&_h4]:mt-2 [&_h4]:text-sm [&_h4]:font-semibold [&_h5]:mb-1 [&_h5]:mt-2 [&_h5]:text-sm [&_h5]:font-medium [&_h6]:mb-1 [&_h6]:mt-2 [&_h6]:text-sm [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-6 [&_table]:w-full [&_table]:border-collapse"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

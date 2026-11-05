import { useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";

/** 工具条按钮（演示用，沿用 Tailwind 风格） */
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
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors " +
        (active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

const SAMPLE = `
  <h2>报价条款与说明</h2>
  <p>1. 本报价含 <strong>13% 增值税专用发票</strong>（含税价），有效期至上方日期。</p>
  <p>2. 交货期：确认订单后 <em>15 个工作日</em> 内。</p>
  <ul>
    <li>支持混批，单款起订量以明细为准。</li>
    <li>物流费用到付，可由我方代订。</li>
  </ul>
  <blockquote>备注：价格随原材料波动，最终以双方盖章合同为准。</blockquote>
`;

/**
 * 组件页 demo：演示在报价单上内嵌「在线富文本编辑器」（TipTap）。
 * 用户可直接在文档里改条款/说明，输出 HTML 存库，预览/打印时再渲染。
 */
export default function RichTextEditorDemo() {
  const [html, setHtml] = useState(SAMPLE.trim());

  const editor: Editor | null = useEditor({
    extensions: [StarterKit, TableKit],
    content: SAMPLE,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* 工具条（不进入打印区域） */}
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted/30 p-1">
        <ToolBtn title="加粗" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </ToolBtn>
        <ToolBtn title="斜体" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </ToolBtn>
        <ToolBtn title="删除线" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </ToolBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolBtn title="标题" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolBtn>
        <ToolBtn title="小标题" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolBtn title="无序列表" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          •
        </ToolBtn>
        <ToolBtn title="有序列表" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1.
        </ToolBtn>
        <ToolBtn title="引用" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          ❝
        </ToolBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolBtn title="插入表格" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          ▦
        </ToolBtn>
        {editor.isActive("table") && (
          <>
            <span className="mx-1 h-5 w-px bg-border" />
            <ToolBtn title="下方加一行" onClick={() => editor.chain().focus().addRowAfter().run()}>
              ＋行
            </ToolBtn>
            <ToolBtn title="删除当前行" onClick={() => editor.chain().focus().deleteRow().run()}>
              －行
            </ToolBtn>
            <ToolBtn title="右侧加一列" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              ＋列
            </ToolBtn>
            <ToolBtn title="删除当前列" onClick={() => editor.chain().focus().deleteColumn().run()}>
              －列
            </ToolBtn>
            <ToolBtn title="切换表头行" active={editor.isActive("tableHeader")} onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
              表头
            </ToolBtn>
            <ToolBtn title="删除整表" onClick={() => editor.chain().focus().deleteTable().run()}>
              删表
            </ToolBtn>
          </>
        )}
        <ToolBtn title="分割线" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          —
        </ToolBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolBtn title="撤销" onClick={() => editor.chain().focus().undo().run()}>
          ↶
        </ToolBtn>
        <ToolBtn title="重做" onClick={() => editor.chain().focus().redo().run()}>
          ↷
        </ToolBtn>
      </div>

      {/* 可编辑区（报价单条款/说明） */}
      <div className="rounded-md border border-border bg-white p-4 text-sm leading-relaxed text-gray-800 [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-50 [&_th]:p-1 [&_td]:border [&_td]:border-gray-300 [&_td]:p-1">
        <EditorContent editor={editor} />
      </div>

      {/* 输出预览（演示如何存库） */}
      <div className="flex flex-col gap-2">
        <p className="section-title">编辑器输出的 HTML（可直接存报价单字段，预览/打印时渲染）</p>
        <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          {html}
        </pre>
      </div>
    </div>
  );
}

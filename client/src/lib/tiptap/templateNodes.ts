import { Node, mergeAttributes } from "@tiptap/core";

/**
 * 合并字段占位节点（inline atom）：拖进编辑器后渲染成 {{标签}} 样式的 chip，
 * 存 data-key，渲染时按字段注册表替换为真实值。
 */
export const MergeField = Node.create({
  name: "mergeField",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      key: { default: "" },
      label: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-merge-field]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-merge-field": node.attrs.key,
        class: "merge-field",
        contenteditable: "false",
        title: node.attrs.key,
      }),
      node.attrs.label || node.attrs.key,
    ];
  },

  renderText({ node }) {
    return `{{${node.attrs.label || node.attrs.key}}}`;
  },
});


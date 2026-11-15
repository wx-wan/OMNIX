import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  ChevronDown,
  Feather,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Textarea } from "src/components/ui/textarea";
import { PmsField, PmsSheet } from "src/views/workspace/pms";
import {
  STAGE_KEYS,
  completeStageForm,
  getStageForm,
  projectIdByNo,
  saveStageForm,
  stageFormKey,
  type StageForm,
  type StageKey,
} from "src/api/workspace/project-stages";

/**
 * 需求模块编辑页：1:1 复刻 demos.shadcndashboard.dev/apps/invoice/edit/PineappleInc
 * 差异仅一处：发票号 # 101 换成业务项目编号（URL 参数）。
 * 所有字段可编辑并随项目编号 + 阶段持久化，写入项目制 store 与项目动态。
 */
const DEFAULT_FORM = (): StageForm => ({
  billFrom: "PineappleInc.\nfirst@xabz.com\nGanesh glory,Godrej garden city,Ahmedabad.\n979796786",
  billTo: "Redq Inc.\ntoFirst@agth.com\nGodrej garden city,Ahmedabad.\n757575233",
  createDate: "April 1, 2025",
  dueDate: "April 5, 2025",
  status: "Paid",
  notes: "",
  items: [{ id: "item-1", name: "Courge", units: 9, price: 10 }],
  updatedAt: "",
});

const STATUSES = ["Paid", "Unpaid", "Pending"];
type EditKind = "billFrom" | "billTo" | "createDate" | "dueDate" | null;

/** 新阶段表单自动继承同一项目最近一个已填阶段的往来单位、状态与明细，避免重复录入。 */
const loadForm = (key: string): StageForm => {
  const saved = getStageForm(key);
  if (saved) return saved;
  const prefix = key.split("_")[0];
  const stage = STAGE_KEYS.find((item) => key.endsWith(`_${item}`)) ?? "requirement";
  for (let i = STAGE_KEYS.indexOf(stage) - 1; i >= 0; i--) {
    const previous = getStageForm(stageFormKey(prefix, STAGE_KEYS[i]));
    if (previous)
      return {
        ...DEFAULT_FORM(),
        billFrom: previous.billFrom,
        billTo: previous.billTo,
        status: previous.status,
        notes: previous.notes,
        items: previous.items.map((item) => ({ ...item })),
      };
  }
  return DEFAULT_FORM();
};

export default function RequirementEditPage() {
  const { projectNo = "101" } = useParams();
  const [searchParams] = useSearchParams();
  const stageParam = searchParams.get("stage") ?? "requirement";
  const stage: StageKey = STAGE_KEYS.includes(stageParam as StageKey)
    ? (stageParam as StageKey)
    : "requirement";
  const key = stageFormKey(`#${projectNo}`, stage);
  const [form, setForm] = useState<StageForm>(() => loadForm(key));
  const [editing, setEditing] = useState<Exclude<EditKind, null>>("billFrom");
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saved, setSaved] = useState(false);
  const lastRef = useRef("");

  useEffect(() => {
    setForm(loadForm(key));
  }, [key]);

  /** 停止输入 700ms 自动落库：不点 Update Invoice 也不丢数据，且不重复写项目动态。 */
  useEffect(() => {
    const signature = `${key}|${JSON.stringify(form)}`;
    const isFirstLoad = lastRef.current === "" || !lastRef.current.startsWith(`${key}|`);
    const unchanged = lastRef.current === signature;
    lastRef.current = signature;
    if (unchanged || isFirstLoad) return;
    const timer = window.setTimeout(
      () => saveStageForm(key, form, projectIdByNo(projectNo), false),
      700
    );
    return () => window.clearTimeout(timer);
  }, [form, key, projectNo]);

  const total = form.items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.units) || 0),
    0
  );

  const openEdit = (kind: Exclude<EditKind, null>) => {
    setEditing(kind);
    setEditValue(form[kind]);
    setEditOpen(true);
  };

  /** 字段在弹窗内即时写回表单，Save 只负责关闭，不再需要「保存 + 提交」两步。 */
  const applyEdit = () => setEditOpen(false);

  const updateItem = (id: string, field: "name" | "price" | "units", value: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === "name" ? value : Number(value) || 0,
            }
          : item
      ),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: `item-${Date.now()}`, name: "", units: 1, price: 0 },
      ],
    }));
  };

  const removeItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      items:
        prev.items.length > 1
          ? prev.items.filter((item) => item.id !== id)
          : [{ id, name: "", units: 1, price: 0 }],
    }));
  };

  /** 一键确认：保存表单、写项目动态，并自动把项目推进到下一阶段。 */
  const save = () => {
    completeStageForm(key, form, projectIdByNo(projectNo));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const lines = (value: string) => value.split("\n");

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-6 rounded-xl border border-border bg-background px-6 py-5">
        <h4 className="text-xl font-semibold text-foreground">Invoice Edit</h4>
        <ol className="flex items-center whitespace-nowrap" aria-label="Breadcrumb">
          <li className="flex items-center">
            <Link to="/" className="text-sm leading-none text-foreground">
              Home
            </Link>
          </li>
          <li className="mx-2 p-0.5 text-sm text-foreground">/</li>
          <li aria-current="page" className="flex items-center text-sm leading-none text-foreground opacity-80">
            Invoice Edit
          </li>
        </ol>
      </div>

      <div className="rounded-xl border border-border bg-card p-0 text-sm text-card-foreground">
        <div className="p-6">
          <div className="mb-6 flex flex-col items-start justify-between gap-5 sm:flex-row">
            <h3 className="order-2 mt-1 flex items-center text-xl sm:order-1">
              #{projectNo}
            </h3>
            <div className="order-1 sm:order-2">
              <Link
                to="/"
                aria-label="Shadcn Dashboard"
                className="block max-w-[40px] overflow-hidden lg:max-w-[120px]"
              >
                <span className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Feather className="size-5" />
                  </span>
                </span>
              </Link>
            </div>
            <div className="order-3 sm:order-3">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    status:
                      STATUSES[(STATUSES.indexOf(prev.status) + 1) % STATUSES.length] ?? "Paid",
                  }))
                }
                className="flex cursor-pointer items-center justify-center rounded border border-border px-3 py-1"
              >
                <span className="inline-flex h-5 items-center gap-1 rounded-4xl bg-teal-400/10 px-2 text-xs font-medium text-teal-500">
                  {form.status}
                  <ChevronDown className="size-3" />
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6 lg:col-span-6">
              <div className="mb-2 block">
                <label className="text-base font-medium">Bill From</label>
              </div>
              <div className="rounded-xl border border-border bg-muted p-4 dark:bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    {lines(form.billFrom).map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label="Edit bill from"
                    onClick={() => openEdit("billFrom")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
              </div>
              <div className="py-5">
                <h6 className="text-sm">Create date</h6>
                <button
                  type="button"
                  onClick={() => openEdit("createDate")}
                  className="mt-2 inline-flex h-8 w-full items-center rounded-lg border border-border bg-background px-2.5 text-sm text-muted-foreground"
                >
                  {form.createDate}
                </button>
              </div>
            </div>

            <div className="col-span-12 md:col-span-6 lg:col-span-6">
              <div className="mb-2 block">
                <label className="text-base font-medium">Bill To</label>
              </div>
              <div className="flex flex-col gap-1 rounded-md border border-border bg-muted p-4 dark:bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    {lines(form.billTo).map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label="Edit bill to"
                    onClick={() => openEdit("billTo")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
              </div>
              <div className="py-5">
                <h6 className="text-sm">Due date</h6>
                <button
                  type="button"
                  onClick={() => openEdit("dueDate")}
                  className="mt-2 inline-flex h-8 w-full items-center rounded-lg border border-border bg-background px-2.5 text-sm text-muted-foreground"
                >
                  {form.dueDate}
                </button>
              </div>
            </div>
          </div>

          <div className="mb-10 mt-4 rounded-md border border-border">
            <div className="relative w-full overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b">
                    {["Item Name", "Unit Price", "Units", "Total Cost", "Actions"].map(
                      (head, index) => (
                        <th
                          key={head}
                          className={`h-10 text-left align-middle font-medium whitespace-nowrap text-foreground ${index ? "px-2" : "px-4"}`}
                        >
                          {head}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border [&_tr:last-child]:border-0">
                  {form.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="min-w-44 p-2 px-4 align-middle whitespace-nowrap">
                        <input
                          value={item.name}
                          onChange={(event) => updateItem(item.id, "name", event.target.value)}
                          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none"
                        />
                      </td>
                      <td className="min-w-44 p-2 align-middle whitespace-nowrap">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(event) => updateItem(item.id, "price", event.target.value)}
                          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none"
                        />
                      </td>
                      <td className="min-w-44 p-2 align-middle whitespace-nowrap">
                        <input
                          type="number"
                          value={item.units}
                          onChange={(event) => updateItem(item.id, "units", event.target.value)}
                          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none"
                        />
                      </td>
                      <td className="min-w-32 p-2 align-middle whitespace-nowrap">
                        {(Number(item.price) || 0) * (Number(item.units) || 0)}
                      </td>
                      <td className="flex items-center gap-2 p-2 align-middle whitespace-nowrap">
                        <button
                          type="button"
                          aria-label="Add item"
                          onClick={addItem}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <PlusCircle className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove item"
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-1 rounded-md border border-border bg-muted p-4 dark:bg-muted/50">
            <div className="mb-3 flex justify-end">
              <div className="flex gap-3 lg:w-1/5">
                <h2 className="w-full max-w-52 font-normal text-muted-foreground">Sub Total:</h2>
                <h3 className="ms-auto font-normal text-muted-foreground">${total}</h3>
              </div>
            </div>
            <div className="mb-3 flex justify-end">
              <div className="flex gap-3 border-b border-border lg:w-1/5">
                <h2 className="w-full max-w-52 font-normal text-muted-foreground">Tax:</h2>
                <h3 className="ms-auto font-normal text-muted-foreground">9%</h3>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="flex gap-3 lg:w-1/5">
                <h2 className="w-full max-w-52">Grand Total:</h2>
                <h3 className="ms-auto text-base">${Math.ceil(total * 1.09)}</h3>
              </div>
            </div>
          </div>

          <div className="-mx-6 -mb-6 mt-6 flex justify-end border-t border-border px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={save}
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground"
              >
                {saved ? "Saved" : "Update Invoice"}
              </button>
              <Link
                to="/projects"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PmsSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        title={editing === "billFrom" || editing === "billTo" ? "Billing details" : "Date"}
      >
        <PmsField
          label={
            editing === "billFrom"
              ? "Bill From"
              : editing === "billTo"
                ? "Bill To"
                : "Date"
          }
        >
          {editing === "billFrom" || editing === "billTo" ? (
            <Textarea
              value={editValue}
              onChange={(event) => {
                setEditValue(event.target.value);
                setForm((prev) => ({ ...prev, [editing]: event.target.value }));
              }}
              className="min-h-28 text-sm"
            />
          ) : (
            <Input
              value={editValue}
              onChange={(event) => {
                setEditValue(event.target.value);
                setForm((prev) => ({ ...prev, [editing]: event.target.value }));
              }}
              className="h-9 text-sm"
            />
          )}
        </PmsField>
        <Button type="button" className="w-full" onClick={applyEdit}>
          Save
        </Button>
      </PmsSheet>
    </div>
  );
}

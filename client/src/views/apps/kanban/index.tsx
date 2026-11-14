import { useRef, useState } from "react";
import {
  CalendarDays,
  CircleCheck,
  CircleMinus,
  CirclePause,
  LoaderCircle,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "../shared";

/**
 * Kanban · 按官网 preview 逐项 1:1
 * https://shadcndashboard.dev/block/kanban-application-02/preview?style=vega
 *
 * 4 列（To do / In Progress / In Review / Done），10 张卡片的标题、日期、
 * 负责人头像均照抄；列头图标与配色对应 灰 / 橙 / 红 / 青。
 * Add Task 弹窗、删除、跨列拖拽为可交互实现（官网用 dnd-kit，这里用
 * 原生 HTML5 drag & drop 实现等价行为，不引入新依赖）。
 */
const AVATAR_BASE =
  "https://images.shadcnspace.com/assets/shadcn-dashboard/profile/";

const ASSIGNEES = [
  { id: "unassigned", name: "Unassigned", avatar: "" },
  { id: "af", name: "Amelia Frost", avatar: "user-7.webp" },
  { id: "nb", name: "Noah Blake", avatar: "user-2.webp" },
  { id: "mc", name: "Maya Chen", avatar: "user-4.webp" },
];

type Task = { id: string; title: string; date: string; assignee: string };

type Column = {
  id: string;
  title: string;
  icon: LucideIcon;
  wrap: string;
  iconCls: string;
  badgeCls: string;
  tasks: Task[];
};

const INITIAL_COLUMNS: Column[] = [
  {
    id: "todo",
    title: "To do",
    icon: LoaderCircle,
    wrap: "bg-muted/60",
    iconCls: "text-muted-foreground",
    badgeCls: "bg-background/70 text-muted-foreground",
    tasks: [
      { id: "t1", title: "Set up shadcn/ui and configure Tailwind theme colors", date: "Jul 6, 2026 · 9:30 AM", assignee: "af" },
      { id: "t2", title: "Design drag-and-drop interactions for the column cards", date: "Jul 8, 2026", assignee: "nb" },
      { id: "t3", title: "Implement dark mode toggle in the top navigation", date: "Jul 10, 2026 · 2:00 PM", assignee: "mc" },
    ],
  },
  {
    id: "progress",
    title: "In Progress",
    icon: CirclePause,
    wrap: "bg-orange-500/10",
    iconCls: "text-orange-600",
    badgeCls: "border-orange-500/30 text-orange-600",
    tasks: [
      { id: "t4", title: "Integrate Framer Motion for smooth card-drop animations", date: "Jul 2, 2026 · 11:00 AM", assignee: "mc" },
      { id: "t5", title: "Connect Kanban board state to local storage", date: "Jul 3, 2026", assignee: "nb" },
    ],
  },
  {
    id: "review",
    title: "In Review",
    icon: CircleMinus,
    wrap: "bg-rose-500/10",
    iconCls: "text-rose-600",
    badgeCls: "border-rose-500/30 text-rose-600",
    tasks: [
      { id: "t6", title: "Review pull request for the kanban board column reordering", date: "Jul 11, 2026 · 10:00 AM", assignee: "af" },
      { id: "t7", title: "QA drag-and-drop behavior across browsers", date: "Jul 12, 2026", assignee: "nb" },
    ],
  },
  {
    id: "done",
    title: "Done",
    icon: CircleCheck,
    wrap: "bg-teal-500/10",
    iconCls: "text-teal-600",
    badgeCls: "border-teal-500/30 text-teal-600",
    tasks: [
      { id: "t8", title: "Initialize Next.js project with TypeScript", date: "Jul 2, 2026", assignee: "af" },
      { id: "t9", title: "Scaffold base layout and sidebar navigation", date: "Jun 30, 2026", assignee: "nb" },
      { id: "t10", title: "Add authentication middleware using Auth.js", date: "Jun 29, 2026", assignee: "mc" },
    ],
  },
];

const avatarUrl = (assignee: string) => {
  const person = ASSIGNEES.find((a) => a.id === assignee);
  return person?.avatar ? `${AVATAR_BASE}${person.avatar}` : "";
};

const KanbanApp = () => {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const dragRef = useRef<{ colId: string; taskId: string } | null>(null);
  const [dialogCol, setDialogCol] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [assignee, setAssignee] = useState("unassigned");
  const [date, setDate] = useState<Date | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  const [time, setTime] = useState("");

  const dialogColumn = columns.find((c) => c.id === dialogCol) ?? null;
  const assigneeName =
    ASSIGNEES.find((a) => a.id === assignee)?.name ?? "Unassigned";
  const initials =
    assignee === "unassigned"
      ? "UA"
      : assigneeName
          .split(" ")
          .map((part) => part[0])
          .join("")
          .toUpperCase();
  const dateLabel = date
    ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const closeDialog = () => {
    setDialogCol(null);
    setMessage("");
    setAssignee("unassigned");
    setDate(undefined);
    setDateOpen(false);
    setTime("");
  };

  const addTask = () => {
    if (!dialogCol || !message.trim()) return;
    const task: Task = {
      id: `t-${Date.now()}`,
      title: message.trim(),
      date: [dateLabel, time].filter(Boolean).join(" · "),
      assignee,
    };
    setColumns((prev) =>
      prev.map((c) => (c.id === dialogCol ? { ...c, tasks: [...c.tasks, task] } : c))
    );
    closeDialog();
  };

  const removeTask = (colId: string, taskId: string) =>
    setColumns((prev) =>
      prev.map((c) =>
        c.id === colId ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) } : c
      )
    );

  const dropTask = (toColId: string, beforeTaskId?: string) => {
    const current = dragRef.current;
    if (!current) return;
    const source = columns.find((c) => c.id === current.colId);
    const task = source?.tasks.find((t) => t.id === current.taskId);
    if (task) {
      setColumns((prev) =>
        prev.map((c) => {
          const without = c.tasks.filter((t) => t.id !== current.taskId);
          if (c.id === current.colId && c.id !== toColId) return { ...c, tasks: without };
          if (c.id === toColId) {
            const next = [...without];
            const idx = beforeTaskId ? next.findIndex((t) => t.id === beforeTaskId) : -1;
            next.splice(idx >= 0 ? idx : next.length, 0, task);
            return { ...c, tasks: next };
          }
          return c;
        })
      );
    }
    dragRef.current = null;
  };

  return (
    <AppShell title="Kanban">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`flex min-h-[280px] flex-col gap-3 rounded-xl p-3 ${col.wrap}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dropTask(col.id)}
          >
            <div className="flex items-center gap-2 px-1 py-1">
              <col.icon className={`h-4 w-4 ${col.iconCls}`} />
              <span className="text-sm font-medium">{col.title}</span>
              <Badge variant="outline" className={`ms-auto ${col.badgeCls}`}>
                {String(col.tasks.length).padStart(2, "0")}
              </Badge>
            </div>

            <div className="flex flex-col gap-3">
              {col.tasks.map((task) => {
                const src = avatarUrl(task.assignee);
                return (
                  <Card
                    key={task.id}
                    draggable
                    role="button"
                    tabIndex={0}
                    aria-roledescription="sortable"
                    style={{ padding: 12, gap: 0 }}
                    className="group relative cursor-grab rounded-lg shadow-sm active:cursor-grabbing"
                    onDragStart={() => {
                      dragRef.current = { colId: col.id, taskId: task.id };
                    }}
                    onDragEnd={() => {
                      dragRef.current = null;
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.stopPropagation();
                      dropTask(col.id, task.id);
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Delete task"
                      onClick={() => removeTask(col.id, task.id)}
                      className="absolute end-2 top-2 hidden h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/5 hover:text-primary group-hover:flex"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <p className="pe-6 text-sm leading-snug">{task.title}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{task.date}</span>
                      </div>
                      {src && (
                        <img
                          src={src}
                          alt={ASSIGNEES.find((a) => a.id === task.assignee)?.name ?? ""}
                          className="h-6 w-6 shrink-0 rounded-full object-cover"
                        />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setDialogCol(col.id)}
              className="mt-auto flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </button>
          </div>
        ))}
      </div>

      <Dialog open={!!dialogCol} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="gap-6 p-6 sm:max-w-md">
          <DialogHeader className="min-h-16 justify-center gap-2">
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>Add a new task to {dialogColumn?.title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-muted-foreground text-xs text-background">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <Label htmlFor="task-assignee">Assignee</Label>
                <Select
                  value={assignee}
                  onValueChange={(value) => setAssignee(String(value))}
                >
                  <SelectTrigger id="task-assignee" className="mt-1 h-9! w-full">
                    <SelectValue>
                      {(value) =>
                        ASSIGNEES.find((a) => a.id === value)?.name ?? "Unassigned"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNEES.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-message">Message</Label>
              <Textarea
                id="task-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What needs to be done?"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <Label>Date</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className="h-9 w-full justify-start font-normal"
                      />
                    }
                  >
                    <CalendarDays className="h-4 w-4 opacity-70" />
                    <span>{dateLabel || "Select date"}</span>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(next) => {
                        setDate(next);
                        setDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-time">Time</Label>
                <Input
                  id="task-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 gap-2 border-0 bg-transparent p-0">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button disabled={!message.trim()} onClick={addTask}>
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default KanbanApp;

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Puzzle,
  Trash2,
  Pencil,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { Grid } from "@/components/layout/Grid";
import { Split } from "@/components/layout/Split";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { KanbanBoard, type KanbanStage } from "@/components/kanban/KanbanBoard";
import { Chatter, type ChatterMessage } from "@/components/chatter/Chatter";

// 演示用的示例数据（代表后端返回内容，非界面文案）
const kanbanStages: KanbanStage[] = [
  {
    id: "todo",
    title: "待办",
    accent: "bg-slate-400",
    items: [
      {
        id: "t1",
        title: "需求评审：导出报表",
        description: "梳理列与格式要求",
        tag: "需求",
        priority: "medium",
        assignee: { name: "林", initials: "林" },
        meta: "截止 11-02",
      },
      {
        id: "t2",
        title: "接入支付回调",
        priority: "high",
        assignee: { name: "陈", initials: "陈" },
      },
    ],
  },
  {
    id: "doing",
    title: "进行中",
    accent: "bg-sky-500",
    items: [
      {
        id: "d1",
        title: "看板组件开发",
        description: "阶段流展示，支持横向滚动",
        tag: "前端",
        priority: "high",
        assignee: { name: "王", initials: "王" },
      },
    ],
  },
  {
    id: "review",
    title: "待审核",
    accent: "bg-amber-500",
    items: [
      {
        id: "r1",
        title: "主题色一致性走查",
        priority: "low",
        assignee: { name: "李", initials: "李" },
      },
    ],
  },
  {
    id: "done",
    title: "已完成",
    accent: "bg-emerald-500",
    items: [
      {
        id: "o1",
        title: "字体落地",
        description: "montserrat + noto-sans-sc",
        priority: "medium",
        assignee: { name: "王", initials: "王" },
        meta: "10-31",
      },
    ],
  },
];

// 演示用的示例数据（代表后端返回内容，非界面文案）
const chatterMessages: ChatterMessage[] = [
  {
    id: "m1",
    author: "林经理",
    body: "客户已确认报价，麻烦安排样品寄出。",
    timestamp: "10-29 09:12",
    attachments: [{ name: "报价单_v2.pdf", size: "240 KB" }],
  },
  {
    id: "m2",
    author: "陈销售",
    body: "样品今天已发出，快递单号 SF1234567890。",
    timestamp: "10-29 15:40",
  },
  {
    id: "m3",
    author: "林经理",
    body: "收到，跟进一下物流状态。",
    timestamp: "10-30 10:05",
  },
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="section-title">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function Showcase() {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(true);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Puzzle className="size-6 text-primary" /> {t("showcase.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("showcase.subtitle")}</p>
      </div>

      <Section
        title={t("showcase.layoutTitle")}
        description={t("showcase.layoutDesc")}
        icon={Puzzle}
      >
        <Stack gap={6}>
          <PageHeader
            title={t("showcase.demoHeaderTitle")}
            description={t("showcase.demoHeaderDesc")}
            icon={Info}
            actions={<Button size="sm">{t("common.actions")}</Button>}
          />
          <Grid min="12rem">
            <StatCard label={t("showcase.statUsers")} value="1,284" delta="+12.5%" trend="up" icon={Puzzle} />
            <StatCard label={t("showcase.statSessions")} value="342" delta="+4.1%" trend="up" icon={Info} />
            <StatCard label={t("showcase.statRevenue")} value="¥89,200" delta="-2.3%" trend="down" icon={Trash2} />
          </Grid>
          <Split
            main={
              <Section title={t("showcase.mainArea")}>
                <p className="text-sm text-muted-foreground">
                  {t("showcase.mainAreaDesc")}
                </p>
              </Section>
            }
            aside={
              <Section title={t("showcase.sideArea")}>
                <p className="text-sm text-muted-foreground">
                  {t("showcase.sideAreaDesc")}
                </p>
              </Section>
            }
          />
        </Stack>
      </Section>

      <Section
        title={t("showcase.kanbanTitle")}
        description={t("showcase.kanbanDesc")}
        icon={Puzzle}
      >
        <KanbanBoard stages={kanbanStages} />
      </Section>

      <Section
        title={t("showcase.chatterTitle")}
        description={t("showcase.chatterDesc")}
        icon={Puzzle}
      >
        <Chatter
          initialMessages={chatterMessages}
          currentUser="我"
          followers={["林经理", "陈销售", "王主管"]}
          className="max-w-xl"
        />
      </Section>

      <Card>
        <CardHeader>
          <CardTitle>Button & Badge</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Row label={t("showcase.btnVariants")}>
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </Row>
          <Row label={t("showcase.btnSizes")}>
            <Button size="xs">xs</Button>
            <Button size="sm">sm</Button>
            <Button size="default">default</Button>
            <Button size="lg">lg</Button>
            <Button size="icon-sm"><Info /></Button>
            <Button size="icon"><Info /></Button>
          </Row>
          <Row label="Badge">
            <Badge>default</Badge>
            <Badge variant="secondary">secondary</Badge>
            <Badge variant="outline">outline</Badge>
            <Badge variant="destructive">destructive</Badge>
            <Badge variant="success">success</Badge>
            <Badge variant="ghost">ghost</Badge>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("showcase.form")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Row label="Input">
            <Input className="max-w-xs" placeholder={t("showcase.inputPlaceholder")} />
          </Row>
          <Row label="Textarea">
            <Textarea className="max-w-md" placeholder={t("showcase.textareaPlaceholder")} />
          </Row>
          <Row label="Label + Checkbox / Switch">
            <div className="flex items-center gap-2">
              <Checkbox checked={checked} onCheckedChange={(v) => setChecked(!!v)} id="cb" />
              <Label htmlFor="cb">{t("showcase.agreeTerms")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={on} onCheckedChange={setOn} id="sw" />
              <Label htmlFor="sw">{t("showcase.enableNotify")}</Label>
            </div>
          </Row>
          <Row label="Select">
            <Select defaultValue="all">
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("showcase.filterAll")}</SelectItem>
                <SelectItem value="active">{t("showcase.filterActive")}</SelectItem>
                <SelectItem value="inactive">{t("showcase.filterInactive")}</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("showcase.overlays")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Row label="Dialog">
            <Dialog>
              <DialogTrigger render={<Button variant="outline">{t("showcase.openDialog")}</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("showcase.confirmAction")}</DialogTitle>
                  <DialogDescription>{t("showcase.confirmDesc")}</DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">{t("showcase.dialogBody")}</p>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline">{t("common.cancel")}</Button>} />
                  <Button>{t("common.confirm")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Row>
          <Row label="DropdownMenu">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline">{t("showcase.menu")}</Button>} />
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Pencil /> {t("showcase.edit")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <Trash2 /> {t("showcase.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Row>
          <Row label="Popover">
            <Popover>
              <PopoverTrigger render={<Button variant="outline">{t("showcase.popoverTrigger")}</Button>} />
              <PopoverContent>
                <p className="text-sm">{t("showcase.popoverBody")}</p>
              </PopoverContent>
            </Popover>
          </Row>
          <Row label="Tooltip">
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline">{t("showcase.tooltipTrigger")}</Button>} />
              <TooltipContent>{t("showcase.tooltipText")}</TooltipContent>
            </Tooltip>
          </Row>
          <Row label="Sheet">
            <Sheet>
              <SheetTrigger render={<Button variant="outline">{t("showcase.sheetTrigger")}</Button>} />
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>{t("showcase.sheetTitle")}</SheetTitle>
                  <SheetDescription>{t("showcase.sheetDesc")}</SheetDescription>
                </SheetHeader>
                <p className="text-sm text-muted-foreground">{t("showcase.sheetBody")}</p>
                <SheetFooter>
                  <SheetTrigger render={<Button>{t("showcase.sheetDone")}</Button>} />
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("showcase.dataDisplay")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Row label="Tabs">
            <Tabs defaultValue="a" className="w-full max-w-md">
              <TabsList>
                <TabsTrigger value="a">{t("showcase.tabFirst")}</TabsTrigger>
                <TabsTrigger value="b">{t("showcase.tabSecond")}</TabsTrigger>
              </TabsList>
              <TabsContent value="a">{t("showcase.tabFirstBody")}</TabsContent>
              <TabsContent value="b">{t("showcase.tabSecondBody")}</TabsContent>
            </Tabs>
          </Row>
          <Row label="Avatar">
            <Avatar>
              <AvatarImage src="https://i.pravatar.cc/96?img=12" />
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
            <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
          </Row>
          <Row label="Progress">
            <Progress value={64} className="w-56" />
          </Row>
          <Row label="Separator">
            <div className="w-full">
              <p className="text-sm">{t("showcase.separatorTop")}</p>
              <Separator className="my-3" />
              <p className="text-sm">{t("showcase.separatorBottom")}</p>
            </div>
          </Row>
          <Row label="Skeleton">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="size-10 rounded-full" />
          </Row>
          <Row label="Table">
            <Table className="max-w-md">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("showcase.tableName")}</TableHead>
                  <TableHead>{t("showcase.tableRole")}</TableHead>
                  <TableHead>{t("showcase.tableStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Ada</TableCell>
                  <TableCell>admin</TableCell>
                  <TableCell><Badge variant="success">{t("showcase.tableEnabled")}</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Lin</TableCell>
                  <TableCell>user</TableCell>
                  <TableCell><Badge variant="outline">{t("showcase.tableDisabled")}</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Row>
        </CardContent>
      </Card>
    </div>
  );
}

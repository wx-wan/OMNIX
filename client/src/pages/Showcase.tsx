import { lazy, Suspense, useState, type ReactNode } from "react";
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
import { PageMeta } from "@/components/layout/PageMeta";
import { StatCard } from "@/components/layout/StatCard";
import { KanbanBoard, type KanbanStage } from "@/components/kanban/KanbanBoard";
import { Chatter, type ChatterMessage } from "@/components/chatter/Chatter";
import { Image } from "@/components/ui/image";
import { ImageUpload } from "@/components/ui/image-upload";
import { SearchableSelect, type SelectRecord } from "@/components/common/SearchableSelect";
import { OrderLinesTable } from "@/components/crm/OrderLinesTable";
import QuotationExportDemo from "@/components/demo/QuotationExportDemo";
import RichTextEditorDemo from "@/components/demo/RichTextEditorDemo";
// 重型 Univer preset 按需加载（进入该演示区块时才拉取独立 chunk）
const UniverSheetsDemo = lazy(() => import("@/components/demo/UniverSheetsDemo"));

// 演示用图片（内联 SVG，避免依赖网络）
const SAMPLE_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#FFD54F'/><stop offset='1' stop-color='#2b2b2b'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><text x='50%' y='50%' fill='white' font-size='20' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'>OMNIX</text></svg>`,
)}`;

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

// 演示数据：客户（many2one 选择器用，含使用率与更多字段）
const demoCustomers: SelectRecord[] = [
  { id: "c1", label: "深圳恒星电子", sublabel: "采购 · lin@hengxing.com", avatarText: "恒", usage: 42, details: [{ label: "联系人", value: "林经理" }, { label: "电话", value: "138-0011-2233" }, { label: "国家", value: "中国" }, { label: "客户类型", value: "终端客户" }] },
  { id: "c2", label: "宁波远洋贸易", sublabel: "外贸 · wang@yuan.cn", avatarText: "宁", usage: 38, details: [{ label: "联系人", value: "王经理" }, { label: "电话", value: "139-0022-3344" }, { label: "国家", value: "中国" }, { label: "客户类型", value: "贸易商" }] },
  { id: "c3", label: "东莞精工模具", sublabel: "工厂 · chen@jinggong.com", avatarText: "东", usage: 31, details: [{ label: "联系人", value: "陈工" }, { label: "电话", value: "137-0033-4455" }, { label: "国家", value: "中国" }, { label: "客户类型", value: "工厂" }] },
  { id: "c4", label: "上海联拓科技", sublabel: "采购 · zhao@liantuo.com", avatarText: "上", usage: 27, details: [{ label: "联系人", value: "赵经理" }, { label: "电话", value: "136-0044-5566" }, { label: "国家", value: "中国" }, { label: "客户类型", value: "终端客户" }] },
  { id: "c5", label: "广州海纳塑胶", sublabel: "工厂 · sun@haina.com", avatarText: "广", usage: 24, details: [{ label: "联系人", value: "孙主管" }, { label: "电话", value: "135-0055-6677" }, { label: "国家", value: "中国" }, { label: "客户类型", value: "工厂" }] },
  { id: "c6", label: "苏州锐驰电机", sublabel: "外贸 · li@ruichi.com", avatarText: "苏", usage: 19, details: [{ label: "联系人", value: "李经理" }, { label: "电话", value: "134-0066-7788" }, { label: "国家", value: "中国" }, { label: "客户类型", value: "贸易商" }] },
  { id: "c7", label: "Hangzhou Yihao", sublabel: "采购 · amy@yihao.com", avatarText: "H", usage: 15, details: [{ label: "联系人", value: "Amy" }, { label: "电话", value: "+86-571-8888" }, { label: "国家", value: "中国" }, { label: "客户类型", value: "终端客户" }] },
  { id: "c8", label: "佛山德胜五金", sublabel: "工厂 · zhou@desheng.com", avatarText: "佛", usage: 12, details: [{ label: "联系人", value: "周经理" }, { label: "电话", value: "133-0077-8899" }, { label: "国家", value: "中国" }, { label: "客户类型", value: "工厂" }] },
  { id: "c9", label: "天津北洋实业", sublabel: "贸易 · wu@beiyang.com", avatarText: "天", usage: 9, details: [{ label: "联系人", value: "吴经理" }, { label: "电话", value: "132-0088-9900" }, { label: "国家", value: "中国" }, { label: "客户类型", value: "贸易商" }] },
  { id: "c10", label: "Ningbo Vast", sublabel: "外贸 · tom@vast.com", avatarText: "N", usage: 7, details: [{ label: "联系人", value: "Tom" }, { label: "电话", value: "+86-574-6666" }, { label: "国家", value: "中国" }, { label: "客户类型", value: "贸易商" }] },
  { id: "c11", label: "成都天府智造", sublabel: "工厂 · qian@tianfu.com", avatarText: "成", usage: 4, details: [{ label: "联系人", value: "钱工" }, { label: "电话", value: "131-0099-0011" }, { label: "国家", value: "中国" }, { label: "客户类型", value: "工厂" }] },
  { id: "c12", label: "Wuhan Changjiang", sublabel: "采购 · lily@cj.com", avatarText: "W", usage: 2, details: [{ label: "联系人", value: "Lily" }, { label: "电话", value: "+86-27-5555" }, { label: "国家", value: "中国" }, { label: "客户类型", value: "终端客户" }] },
];

// 演示数据：产品（订单明细表格的产品选择器用）
const demoProducts: SelectRecord[] = [
  { id: "p1", label: "无线蓝牙耳机 Pro", sublabel: "电子 · 台", avatarText: "耳", usage: 56, details: [{ label: "品类", value: "消费电子" }, { label: "单价", value: "¥299.00" }, { label: "单位", value: "台" }] },
  { id: "p2", label: "USB-C 快充适配器", sublabel: "电子 · 个", avatarText: "充", usage: 48, details: [{ label: "品类", value: "配件" }, { label: "单价", value: "¥89.00" }, { label: "单位", value: "个" }] },
  { id: "p3", label: "铝合金笔记本支架", sublabel: "五金 · 件", avatarText: "支", usage: 40, details: [{ label: "品类", value: "办公" }, { label: "单价", value: "¥129.00" }, { label: "单位", value: "件" }] },
  { id: "p4", label: "硅胶手机壳", sublabel: "塑胶 · 个", avatarText: "壳", usage: 33, details: [{ label: "品类", value: "配件" }, { label: "单价", value: "¥39.00" }, { label: "单位", value: "个" }] },
  { id: "p5", label: "智能手环 5", sublabel: "电子 · 只", avatarText: "环", usage: 29, details: [{ label: "品类", value: "穿戴" }, { label: "单价", value: "¥199.00" }, { label: "单位", value: "只" }] },
  { id: "p6", label: "机械键盘 87 键", sublabel: "电子 · 台", avatarText: "键", usage: 22, details: [{ label: "品类", value: "办公" }, { label: "单价", value: "¥359.00" }, { label: "单位", value: "台" }] },
  { id: "p7", label: "便携投影仪 1080P", sublabel: "电子 · 台", avatarText: "投", usage: 17, details: [{ label: "品类", value: "影音" }, { label: "单价", value: "¥999.00" }, { label: "单位", value: "台" }] },
  { id: "p8", label: "运动水壶 750ml", sublabel: "塑胶 · 个", avatarText: "壶", usage: 11, details: [{ label: "品类", value: "户外" }, { label: "单价", value: "¥49.00" }, { label: "单位", value: "个" }] },
  { id: "p9", label: "桌面收纳盒", sublabel: "塑胶 · 个", avatarText: "盒", usage: 6, details: [{ label: "品类", value: "办公" }, { label: "单价", value: "¥25.00" }, { label: "单位", value: "个" }] },
  { id: "p10", label: "降噪耳麦 Studio", sublabel: "电子 · 副", avatarText: "麦", usage: 3, details: [{ label: "品类", value: "影音" }, { label: "单价", value: "¥599.00" }, { label: "单位", value: "副" }] },
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
  const [uploaded, setUploaded] = useState<string | null>(SAMPLE_IMAGE);
  const [pickedCustomer, setPickedCustomer] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <PageMeta title={t("showcase.title")} description={t("showcase.subtitle")} />

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

      <Section
        title={t("showcase.imageTitle")}
        description={t("showcase.imageDesc")}
        icon={Puzzle}
      >
        <div className="grid max-w-2xl grid-cols-2 gap-4">
          <Image src={SAMPLE_IMAGE} alt="示例图片" ratio="16/9" />
          <Image src="https://invalid.example/nope.png" alt="加载失败的示例" ratio="16/9" />
        </div>
      </Section>

      <Section
        title={t("showcase.imageUploadTitle")}
        description={t("showcase.imageUploadDesc")}
        icon={Puzzle}
      >
        <div className="grid max-w-2xl grid-cols-2 gap-4">
          <ImageUpload value={uploaded} onChange={setUploaded} ratio="1/1" />
          <ImageUpload ratio="1/1" />
        </div>
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

      <Section
        title={t("showcase.pickerTitle")}
        description={t("showcase.pickerDesc")}
        icon={Puzzle}
      >
        <div className="flex flex-col gap-3">
          <div className="max-w-xs">
            <Label htmlFor="demo-picker">{t("orderLines.product")}</Label>
            <SearchableSelect
              id="demo-picker"
              records={demoCustomers}
              value={pickedCustomer}
              onChange={(r) => setPickedCustomer(r?.id ?? null)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("showcase.pickerSelected")}：
            {pickedCustomer
              ? demoCustomers.find((c) => c.id === pickedCustomer)?.label
              : "—"}
          </p>
        </div>
      </Section>

      <Section
        title={t("showcase.orderLinesTitle")}
        description={t("showcase.orderLinesDesc")}
        icon={Puzzle}
      >
        <OrderLinesTable products={demoProducts} />
      </Section>

      <Section
        title="报价单导出 / 打印 Demo"
        description="react-to-print（浏览器排版打印，钉钉式）+ ExcelJS（带排版导出 .xlsx 并可回读导入）"
        icon={Puzzle}
      >
        <QuotationExportDemo />
      </Section>

      <Section
        title="报价单在线编辑器 Demo"
        description="TipTap（headless 富文本，可内嵌到报价单上直接编辑条款/说明，输出 HTML 存库）"
        icon={Puzzle}
      >
        <RichTextEditorDemo />
      </Section>

      <Section
        title="Univer 在线电子表格 Demo（真·Excel 体验）"
        description="Univer（Apache-2.0 开源、可私有化）嵌入工作表引擎：真公式、填充柄、排序筛选、单元格样式/货币格式。对比 WPS 无需企业授权与云端回调。"
        icon={Puzzle}
      >
        <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-lg" />}>
          <UniverSheetsDemo />
        </Suspense>
      </Section>
    </div>
  );
}

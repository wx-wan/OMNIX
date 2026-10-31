import { useState, type ReactNode } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
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

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="section-title">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function Showcase() {
  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(true);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Puzzle className="size-6 text-primary" /> 基础组件库
        </h1>
        <p className="text-sm text-muted-foreground">
          基于 Base UI（shadcn base-nova）· 品牌黄 #FFD54F
        </p>
      </div>

      <Section
        title="Layout 布局组件（island UI）"
        description="Container · Stack · Grid · Split · PageHeader · Section · StatCard"
        icon={Puzzle}
      >
        <Stack gap={6}>
          <PageHeader
            title="示例页头"
            description="带图标 + 右侧操作区"
            icon={Info}
            actions={<Button size="sm">操作</Button>}
          />
          <Grid min="12rem">
            <StatCard label="总用户" value="1,284" delta="+12.5%" trend="up" icon={Puzzle} />
            <StatCard label="会话" value="342" delta="+4.1%" trend="up" icon={Info} />
            <StatCard label="营收" value="¥89,200" delta="-2.3%" trend="down" icon={Trash2} />
          </Grid>
          <Split
            main={
              <Section title="主区">
                <p className="text-sm text-muted-foreground">
                  主内容区，占据剩余宽度；窄屏时自动堆叠到侧栏上方。
                </p>
              </Section>
            }
            aside={
              <Section title="侧栏">
                <p className="text-sm text-muted-foreground">
                  固定宽度的侧栏（桌面 20rem）。
                </p>
              </Section>
            }
          />
        </Stack>
      </Section>

      <Card>
        <CardHeader>
          <CardTitle>Button & Badge</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Row label="Button 变体">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </Row>
          <Row label="Button 尺寸">
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
          <CardTitle>表单</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Row label="Input">
            <Input className="max-w-xs" placeholder="请输入内容" />
          </Row>
          <Row label="Textarea">
            <Textarea className="max-w-md" placeholder="请输入详细描述" />
          </Row>
          <Row label="Label + Checkbox / Switch">
            <div className="flex items-center gap-2">
              <Checkbox checked={checked} onCheckedChange={(v) => setChecked(!!v)} id="cb" />
              <Label htmlFor="cb">同意条款</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={on} onCheckedChange={setOn} id="sw" />
              <Label htmlFor="sw">启用通知</Label>
            </div>
          </Row>
          <Row label="Select">
            <Select defaultValue="all">
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>浮层 / 弹出</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Row label="Dialog">
            <Dialog>
              <DialogTrigger render={<Button variant="outline">打开对话框</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认操作</DialogTitle>
                  <DialogDescription>此操作不可撤销，请谨慎。</DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">对话框内容区。</p>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline">取消</Button>} />
                  <Button>确认</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Row>
          <Row label="DropdownMenu">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline">菜单</Button>} />
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>操作</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Pencil /> 编辑
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <Trash2 /> 删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Row>
          <Row label="Popover">
            <Popover>
              <PopoverTrigger render={<Button variant="outline">弹出</Button>} />
              <PopoverContent>
                <p className="text-sm">这是一个 Popover 气泡。</p>
              </PopoverContent>
            </Popover>
          </Row>
          <Row label="Tooltip">
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline">悬停查看</Button>} />
              <TooltipContent>提示文本</TooltipContent>
            </Tooltip>
          </Row>
          <Row label="Sheet">
            <Sheet>
              <SheetTrigger render={<Button variant="outline">抽屉</Button>} />
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>侧边抽屉</SheetTitle>
                  <SheetDescription>从右侧滑入。</SheetDescription>
                </SheetHeader>
                <p className="text-sm text-muted-foreground">抽屉内容。</p>
                <SheetFooter>
                  <SheetTrigger render={<Button>完成</Button>} />
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>数据展示</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Row label="Tabs">
            <Tabs defaultValue="a" className="w-full max-w-md">
              <TabsList>
                <TabsTrigger value="a">第一项</TabsTrigger>
                <TabsTrigger value="b">第二项</TabsTrigger>
              </TabsList>
              <TabsContent value="a">第一项内容</TabsContent>
              <TabsContent value="b">第二项内容</TabsContent>
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
              <p className="text-sm">上方</p>
              <Separator className="my-3" />
              <p className="text-sm">下方</p>
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
                  <TableHead>名称</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Ada</TableCell>
                  <TableCell>admin</TableCell>
                  <TableCell><Badge variant="success">启用</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Lin</TableCell>
                  <TableCell>user</TableCell>
                  <TableCell><Badge variant="outline">停用</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Row>
        </CardContent>
      </Card>
    </div>
  );
}

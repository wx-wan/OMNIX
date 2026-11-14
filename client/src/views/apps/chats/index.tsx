import ApplicationShell01 from "@/components/shadcn-dashboard/blocks/application-shell/application-shell-01";
import { AppShell } from "../shared";

/**
 * /apps/chats 挂载官网 Copy Prompt 导出的 application-shell-01 block。
 *
 * 官网 Next.js 结构里的 app/application-shell-01/page.tsx，在本项目
 * （Vite + React Router）对应这个路由文件；block 源码原样放在
 * src/components/shadcn-dashboard/blocks/application-shell/application-shell-01/。
 */
const ChatsApp = () => (
  <AppShell title="Chat App">
    <ApplicationShell01 />
  </AppShell>
);

export default ChatsApp;

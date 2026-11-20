import { FC, useEffect } from 'react';
import Sidebar from './vertical/sidebar/Sidebar';
import Header from './vertical/header/Header';
import { SidebarInset, SidebarProvider } from 'src/components/ui/sidebar';
import { cn } from 'src/lib/utils';
import { Outlet } from 'react-router';
import { STYLE_NAMES, useCustomizer } from 'src/context/CustomizerContext';

const FullLayout: FC = () => {
  const { state, set } = useCustomizer();

  // 从访客页（BlankLayout 已摘掉 style-*）回到主应用时补回主题皮肤；
  // CustomizerContext 的 effect 只在 state 变化时执行，路由切换不会触发。
  useEffect(() => {
    const root = document.documentElement;
    STYLE_NAMES.forEach((name) => root.classList.remove(`style-${name}`));
    root.classList.add(`style-${state.activeStyle}`);
  }, [state.activeStyle]);

  return (
    <>
    <SidebarProvider
      open={!state.isCollapse}
      onOpenChange={(open) => set("isCollapse", !open)}
      style={{ "--sidebar-width-icon": "52px" } as React.CSSProperties}
    >
      
        <Sidebar />
     
      <SidebarInset className="outline outline-border m-2 rounded-xl overflow-clip">
        {/* Top Header  */}
       <Header /> 
        
          {/* Body Content  */}
          {/* Container Option：线上商业版组件层契约
              cn("full" === isLayout ? "w-full" : "w-full mx-auto container")
              boxed → .container 收窄居中（--boxed-gutter 控制两侧留白）；full → 撑满。
              只收窄容器本身：页面底、侧栏、主体圆角一律不改，不加灰边/盒子边框。 */}
          <div data-container-surface className="flex flex-1 flex-col gap-4 p-4">
          <div className={cn("w-full", state.isLayout === "full" ? "" : "mx-auto container")}>
            <div className=" min-h-[calc(100vh-140px)]"><Outlet /></div>
          </div>
        </div>
       
        
      </SidebarInset>
    </SidebarProvider>
    </>
  );
};

export default FullLayout;

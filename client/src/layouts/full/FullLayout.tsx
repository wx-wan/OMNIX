import { FC } from 'react';
import Sidebar from './vertical/sidebar/Sidebar';
import Header from './vertical/header/Header';
import { SidebarInset, SidebarProvider } from 'src/components/ui/sidebar';
import { cn } from 'src/lib/utils';
import Footer from './shared/footer/Footer';
import { Outlet } from 'react-router';
import Customizer from 'src/components/shared/Customizer';
import { useCustomizer } from 'src/context/CustomizerContext';

const FullLayout: FC = () => {
  const { state, set } = useCustomizer();

  return (
    <>
    <SidebarProvider
      open={!state.isCollapse}
      onOpenChange={(open) => set("isCollapse", !open)}
      style={{ "--sidebar-width-icon": "52px" } as React.CSSProperties}
    >
      
        <Sidebar />
     
      <SidebarInset className="outline outline-border m-2 rounded-xl overflow-hidden">
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
            <div className="pt-6">
              <Footer />
            </div>
          </div>
        </div>
       
        
      </SidebarInset>
    </SidebarProvider>
    <Customizer />
    </>
  );
};

export default FullLayout;

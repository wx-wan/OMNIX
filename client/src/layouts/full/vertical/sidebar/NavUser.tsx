import { Settings, BookOpen } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from "react-i18next";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroupContent, SidebarGroup } from "@/components/ui/sidebar"


export function NavUser() {
    const { t } = useTranslation();
    const navItems = [
        {
            title: "Setting",
            url: "/settings/general",
            icon: Settings,
        },
        {
            title: "Documentation",
            url: "/faq",
            icon: BookOpen,
        },
    ]

    return (
        <SidebarGroup className="mt-auto p-0">
            <SidebarGroupContent>
                <SidebarMenu className=" ">
                    {navItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            {/* Link 作为按钮本体的渲染元素：整行 div 均可点击跳转，与仪表盘菜单项交互一致 */}
                            <SidebarMenuButton
                                size="lg"
                                className="h-full w-full cursor-pointer"
                                render={<Link to={item.url} prefetch="none" />}
                            >
                                <item.icon className="shadow-none size-5 shrink-0" />
                                <div className="flex flex-col flex-1 text-left text-sm leading-tight hide-menu whitespace-nowrap">
                                    <span className="truncate font-medium">{t(item.title)}</span>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

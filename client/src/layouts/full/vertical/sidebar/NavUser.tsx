import { Settings, BookOpen } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from "react-i18next";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroupContent, SidebarGroup } from "@/components/ui/sidebar"


export function NavUser() {
    const { t } = useTranslation();
    const navItems = [
        {
            title: "Setting",
            url: "https://demos.shadcndashboard.dev/theme-pages/faq",
            icon: Settings,
        },
        {
            title: "Documentation",
            url: "https://shadcndashboard.dev/docs",
            icon: BookOpen,
        },
    ]

    return (
        <SidebarGroup className="mt-auto p-0">
            <SidebarGroupContent>
                <SidebarMenu className=" ">
                    {navItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton size="lg" className="h-full cursor-pointer">
                                <Link to={item.url} prefetch="none">
                                    <div className="flex items-center gap-3 w-full">
                                        <item.icon className="shadow-none size-5 shrink-0" />
                                        <div className="flex flex-col flex-1 text-left text-sm leading-tight hide-menu whitespace-nowrap">
                                            <span className="truncate font-medium">{t(item.title)}</span>
                                        </div>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

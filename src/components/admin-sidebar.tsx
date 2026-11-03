"use client"

import * as React from "react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
    FileTextIcon, FileChartColumnIcon, CommandIcon,
    UsersIcon, ShieldAlertIcon, MonitorIcon
} from "lucide-react"
import {NavAdminMain} from "@/components/nav/nav-admin-main";
import {NavAdminDocuments} from "@/components/nav/nav-admin-documents";
import {NavUser} from "@/components/nav/nav-user";


const navMain = [
    { title: "Visão Geral", url: "/admin/dashboard/overview", icon: <MonitorIcon /> },
    { title: "Gerir Utilizadores", url: "/admin/dashboard/users", icon: <UsersIcon /> },
    { title: "Denúncias/Alertas", url: "/admin/dashboard/alerts", icon: <ShieldAlertIcon /> },
]

const documents = [
    { name: "Relatórios Globais", url: "/admin/dashboard/reports", icon: <FileChartColumnIcon /> },
    { name: "Logs de Sistema", url: "/admin/dashboard/logs", icon: <FileTextIcon /> },
]

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user?: {
        name: string;
        email: string;
        avatar?: string;
    };
}

export default function AdminSidebar({ user, ...props }: AdminSidebarProps) {
    const userData = {
        name: user?.name || "Administrador",
        email: user?.email || "",
        avatar: user?.avatar || "",
    }

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="data-[slot=sidebar-menu-button]:p-1.5!"
                            render={<a href="/admin/dashboard" />}
                        >
                            <CommandIcon className="size-8!" />
                            <span className="text-base font-semibold">Fortis Libertas Admin</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavAdminMain items={navMain} />
                <NavAdminDocuments items={documents} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
        </Sidebar>
    )
}
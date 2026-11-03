"use client"

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {LayoutDashboardIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavAdminMain({
                            items,
                        }: {
    items: {
        title: string
        url: string
        icon?: React.ReactNode
    }[]
}) {
    const pathname = usePathname()

    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                    {items.map((item) => {
                        const isActive = pathname === item.url

                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    tooltip={item.title}
                                    render={<Link href={item.url} />}
                                    isActive={isActive}
                                >
                                    {item.icon}
                                    <span>{item.title}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon } from "lucide-react"

export function NavMain({
                          items,
                        }: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  const pathname = usePathname()
  const isDashboardActive = pathname === "/dashboard"

  return (
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                  tooltip="Dashboard"
                  isActive={isDashboardActive}
                  className={
                    isDashboardActive
                        ? "border-l-2 border-blue-500 bg-sidebar-accent font-medium text-sidebar-accent-foreground rounded-l-none"
                        : ""
                  }
                  render={<Link href="/dashboard" />}
              >
                <LayoutDashboardIcon />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarMenu>
            {items.map((item) => {
              const isActive =
                  pathname === item.url || pathname.startsWith(`${item.url}/`)

              return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        className={
                          isActive
                              ? "border-l-2 border-blue-500 bg-sidebar-accent font-medium text-sidebar-accent-foreground rounded-l-none"
                              : ""
                        }
                        render={<Link href={item.url} />}
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
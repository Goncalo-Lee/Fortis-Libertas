"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavDocuments({
                               items,
                             }: {
  items: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  const pathname = usePathname()

  return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Documentos</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)

            return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                      isActive={isActive}
                      className={
                        isActive
                            ? "border-l-2 border-blue-500 bg-sidebar-accent font-medium text-sidebar-accent-foreground rounded-l-none"
                            : ""
                      }
                      render={<Link href={item.url} />}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
  )
}
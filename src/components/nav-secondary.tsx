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

export function NavSecondary({
                               items,
                               ...props
                             }: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()

  return (
      <SidebarGroup {...props}>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const isActive =
                  pathname === item.url || pathname.startsWith(`${item.url}/`)

              return (
                  <SidebarMenuItem key={item.title}>
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
"use client"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {CirclePlusIcon, LayoutDashboardIcon, MailIcon} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavMain({
                          items,
                        }: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  const pathname = usePathname() // 2. Obtém o URL atual

  return (
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                  tooltip="Dashboard"
                  isActive={pathname === "/dashboard"}
                  render={<Link href="/dashboard" />}
              >
                <LayoutDashboardIcon />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarMenu>
            {items.map((item) => {
              // 3. Compara o URL do item com o URL onde o utilizador está
              const isActive = pathname === item.url

              return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        tooltip={item.title}
                        render={<Link href={item.url} />}
                        isActive={isActive} // 4. Passa a prop para o shadcn!
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
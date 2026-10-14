"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
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
  FileTextIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  FileChartColumnIcon,
  CommandIcon,
  BadgeEuroIcon, MinusCircleIcon, CalendarArrowDownIcon,
  ClipboardMinusIcon, PiggyBankIcon, FileOutputIcon, BellIcon, ArrowLeftRightIcon
} from "lucide-react"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Rendimentos",
      url: "/incomes",
      icon: (
        <BadgeEuroIcon
        />
      ),
    },
    {
      title: "Despesas",
      url: "/expenses",
      icon: (
        <MinusCircleIcon
        />
      ),
    },
    {
      title: "Metas Financeiras",
      url: "/financial-goals",
      icon: (
        <CalendarArrowDownIcon
        />
      ),
    },
    {
      title: "Dívidas",
      url: "/financial-debts",
      icon: (
        <ClipboardMinusIcon
        />
      ),
    },
    {
      title: "Pé de meia",
      url: "/money-pillow",
      icon: (
          <PiggyBankIcon
          />
      ),
    },
    {
      title: "Notificações",
      url: "/notifications",
      icon: (
          <BellIcon
          />
      ),
    },
  ],
  navSecondary: [
    {
      title: "Configurações",
      url: "#",
      icon: (
        <Settings2Icon
        />
      ),
    },
    {
      title: "Ajuda/Chatbot",
      url: "#",
      icon: (
        <CircleHelpIcon
        />
      ),
    },
    {
      title: "Pesquisar",
      url: "#",
      icon: (
        <SearchIcon
        />
      ),
    },
  ],
  documents: [
    {
      name: "Exportações",
      url: "/exportations",
      icon: (
        <FileOutputIcon
        />
      ),
    },
    {
      name: "Gerador de relatórios",
      url: "/reports-generator",
      icon: (
        <FileChartColumnIcon
        />
      ),
    },
    {
      name: "Faturas",
      url: "/invoices",
      icon: (
        <FileTextIcon
        />
      ),
    },
    {
      name: "Registo de transações",
      url: "/transactions-log",
      icon: (
          <ArrowLeftRightIcon
          />
      ),
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <CommandIcon className="size-8!" />
              <span className="text-base font-semibold">Fortis Libertas</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

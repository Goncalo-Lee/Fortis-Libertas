"use client"

import * as React from "react"
import { NavDocuments } from "@/components/nav/nav-documents"
import { NavMain } from "@/components/nav/nav-main"
import { NavUser } from "@/components/nav/nav-user"
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
  FileChartColumnIcon, CommandIcon, BadgeEuroIcon, MinusCircleIcon,
  CalendarArrowDownIcon, ClipboardMinusIcon, PiggyBankIcon,
  FileOutputIcon, BellIcon, ArrowLeftRightIcon, ShieldCheck, ShieldCheckIcon
} from "lucide-react"
import ChatToggleDialog from "@/components/chat-toggle-dialog";

const navMain = [
  { title: "Rendimentos", url: "/dashboard/incomes", icon: <BadgeEuroIcon /> },
  { title: "Despesas", url: "/dashboard/expenses", icon: <MinusCircleIcon /> },
  { title: "Metas Financeiras", url: "/dashboard/financial-goals", icon: <CalendarArrowDownIcon /> },
  { title: "Dívidas", url: "/dashboard/financial-debts", icon: <ClipboardMinusIcon /> },
  { title: "Fundo de emergência", url: "/dashboard/money-pillow", icon: <ShieldCheckIcon /> },
  { title: "Notificações", url: "/dashboard/notifications", icon: <BellIcon /> },
]

const documents = [
  { name: "Exportações", url: "/dashboard/documents/exportations", icon: <FileOutputIcon /> },
  { name: "Gerador de relatórios", url: "/dashboard/documents/reports-generator", icon: <FileChartColumnIcon /> },
  { name: "Faturas", url: "/dashboard/documents/invoices", icon: <FileTextIcon /> },
  { name: "Registo de transações", url: "/dashboard/documents/transactions-log", icon: <ArrowLeftRightIcon /> },
]

interface UserSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function UserSidebar({ user, ...props }: UserSidebarProps) {
  const userData = {
    name: user?.name || "Utilizador",
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
                  render={<a href="/dashboard" />}
              >
                <CommandIcon className="size-8!" />
                <span className="text-base font-semibold">FORTIS LIBERTAS</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navMain} />
          <NavDocuments items={documents} />
        </SidebarContent>
        <SidebarFooter>
          <ChatToggleDialog />
          <NavUser user={userData} />
        </SidebarFooter>
      </Sidebar>
  )
}
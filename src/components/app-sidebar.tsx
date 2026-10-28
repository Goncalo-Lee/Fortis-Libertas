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
  FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon,
  FileChartColumnIcon, CommandIcon, BadgeEuroIcon, MinusCircleIcon,
  CalendarArrowDownIcon, ClipboardMinusIcon, PiggyBankIcon,
  FileOutputIcon, BellIcon, ArrowLeftRightIcon, UsersIcon, ShieldAlertIcon
} from "lucide-react"

// User role
const userMenus = {
  navMain: [
    { title: "Rendimentos", url: "/dashboard/incomes", icon: <BadgeEuroIcon /> },
    { title: "Despesas", url: "/dashboard/expenses", icon: <MinusCircleIcon /> },
    { title: "Metas Financeiras", url: "/dashboard/financial-goals", icon: <CalendarArrowDownIcon /> },
    { title: "Dívidas", url: "/dashboard/financial-debts", icon: <ClipboardMinusIcon /> },
    { title: "Pé de meia", url: "/dashboard/money-pillow", icon: <PiggyBankIcon /> },
    { title: "Notificações", url: "/dashboard/notifications", icon: <BellIcon /> },
  ],
  documents: [
    { name: "Exportações", url: "/dashboard/documents/exportations", icon: <FileOutputIcon /> },
    { name: "Gerador de relatórios", url: "/dashboard/documents/reports-generator", icon: <FileChartColumnIcon /> },
    { name: "Faturas", url: "/dashboard/documents/invoices", icon: <FileTextIcon /> },
    { name: "Registo de transações", url: "/dashboard/documents/transactions-log", icon: <ArrowLeftRightIcon /> },
  ]
}

// Admin role
const adminMenus = {
  navMain: [
    { title: "Visão Geral", url: "/dashboard/admin/overview", icon: <CommandIcon /> },
    { title: "Gerir Utilizadores", url: "/dashboard/admin/users", icon: <UsersIcon /> },
    { title: "Denúncias/Alertas", url: "/dashboard/admin/alerts", icon: <ShieldAlertIcon /> },
  ],
  documents: [
    { name: "Relatórios Globais", url: "/dashboard/admin/reports", icon: <FileChartColumnIcon /> },
    { name: "Logs de Sistema", url: "/dashboard/admin/logs", icon: <FileTextIcon /> },
  ]
}

// Secondary menus
const navSecondary = [
  { title: "Configurações", url: "#", icon: <Settings2Icon /> },
  { title: "Ajuda/Chatbot", url: "#", icon: <CircleHelpIcon /> },
  { title: "Pesquisar", url: "#", icon: <SearchIcon /> },
]

// props
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function AppSidebar({ role = "user", user, ...props }: AppSidebarProps) {
  const activeMenu = role === "admin" ? adminMenus : userMenus;

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
                <span className="text-base font-semibold">Fortis Libertas</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={activeMenu.navMain} />
          <NavDocuments items={activeMenu.documents} />
          {role !== "admin" && (
              <NavSecondary items={navSecondary} className="mt-auto" />
          )}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={userData} />
        </SidebarFooter>
      </Sidebar>
  )
}
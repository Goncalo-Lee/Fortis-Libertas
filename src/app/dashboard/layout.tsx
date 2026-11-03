import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { FinancialProvider } from "@/contexts/FinancialContext";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {

    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        redirect("/sign-in")
    }

    return (
        // 1º Nível: Sabe quem é a pessoa
        <ProfileProvider>

            <DashboardProvider>


                <FinancialProvider>

                    <SidebarProvider
                        className="h-svh"
                        style={
                            {
                                "--sidebar-width": "calc(var(--spacing) * 65)",
                                "--header-height": "calc(var(--spacing) * 12)",
                            } as React.CSSProperties
                        }
                    >
                        <AppSidebar
                            variant="inset"
                            className="font-poppins"
                            role={session.user.role}
                            user={{
                                name: session.user.name,
                                email: session.user.email,
                                avatar: session.user.image,
                            }}
                        />
                        <SidebarInset className="flex flex-col min-h-0">
                            <SiteHeader />
                            <main className="flex-1 min-h-0 overflow-hidden">
                                {children}
                            </main>
                        </SidebarInset>
                    </SidebarProvider>

                </FinancialProvider>
            </DashboardProvider>
        </ProfileProvider>
    )
}
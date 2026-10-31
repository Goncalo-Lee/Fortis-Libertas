"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    Bell,
    Trophy,
    CheckCircle2,
    PieChart,
    Trash2,
    CheckCheck,
    Calendar,
    ArrowRight,
} from "lucide-react"
import { useFinancial } from "@/contexts/FinancialContext"

type NotificationType = "goal_reached" | "validate_record" | "report_ready"

interface NotificationItem {
    id: string
    title: string
    description: string
    type: NotificationType
    date: string
    read: boolean
    actionUrl?: string
}

export default function NotificationsPage() {
    const { financialRecords, installmentPlans } = useFinancial()

    // Estado para guardar os IDs das notificações já processadas pelo utilizador (lidas/apagadas)
    const [dismissedIds, setDismissedIds] = useState<string[]>([])
    const [readIds, setReadIds] = useState<string[]>([])
    const [isMounted, setIsMounted] = useState(false)

    // ============================================================================
    // 1. CARREGAR ESTADO DA MEMÓRIA DO BROWSER (Evita Hydration Errors)
    // ============================================================================
    useEffect(() => {
        const savedDismissed = localStorage.getItem("fl_dismissed_notifications")
        const savedRead = localStorage.getItem("fl_read_notifications")

        if (savedDismissed) setDismissedIds(JSON.parse(savedDismissed))
        if (savedRead) setReadIds(JSON.parse(savedRead))

        setIsMounted(true)
    }, [])

    // Helpers para guardar na memória
    const saveToMemory = (key: string, data: string[]) => {
        localStorage.setItem(key, JSON.stringify(data))
    }

    // ============================================================================
    // 2. MOTOR DE REGRAS (GERA NOTIFICAÇÕES ON-THE-FLY)
    // ============================================================================
    const generatedNotifications = useMemo(() => {
        if (!isMounted || !financialRecords) return []

        const alerts: NotificationItem[] = []

        // --- REGRA A: Registos sem Categoria ---
        const uncategorizedRecords = financialRecords.filter((r: any) => !r.categoryId && !r.category_id)
        if (uncategorizedRecords.length > 0) {
            alerts.push({
                id: "rule_uncategorized_records",
                title: "Validação Pendente",
                description: `Tens ${uncategorizedRecords.length} registo(s) financeiro(s) sem categoria atribuída. Classifica-os para manteres os teus relatórios precisos.`,
                type: "validate_record",
                date: new Date().toISOString(),
                read: readIds.includes("rule_uncategorized_records"),
                actionUrl: "/dashboard/documents/transactions-log",
            })
        }

        // --- REGRA B: Metas Concluídas (Installment Plans) ---
        if (installmentPlans && installmentPlans.length > 0) {
            installmentPlans.forEach((plan: any) => {
                const planTarget = Number(plan.price || plan.target_amount || 0)

                // Somar os registos financeiros associados a este plano
                const linkedRecordsSum = financialRecords
                    .filter((r: any) => (r.installmentPlanId === plan.id || r.installment_plan_id === plan.id))
                    .reduce((sum: number, r: any) => sum + Number(r.price || 0), 0)

                // Se o valor acumulado for igual ou superior ao objetivo do plano
                if (planTarget > 0 && linkedRecordsSum >= planTarget) {
                    const notifId = `rule_goal_reached_${plan.id}`
                    alerts.push({
                        id: notifId,
                        title: "🎉 Meta Conquistada!",
                        description: `Parabéns! O teu objetivo "${plan.name}" atingiu 100% do valor definido (€${planTarget.toFixed(2)}).`,
                        type: "goal_reached",
                        date: new Date().toISOString(),
                        read: readIds.includes(notifId),
                        actionUrl: "/dashboard/money-pillow", // Pode apontar para a página da almofada ou metas
                    })
                }
            })
        }

        // --- REGRA C: Relatório Mensal Fechado ---
        const today = new Date()
        // Se estivermos nos primeiros 7 dias do mês, gerar aviso do mês anterior
        if (today.getDate() <= 7) {
            const prevMonth = today.getMonth() === 0 ? 12 : today.getMonth()
            const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()
            const notifId = `rule_report_${prevMonth}_${year}`

            alerts.push({
                id: notifId,
                title: "Relatório Mensal Disponível",
                description: `O teu raio-X financeiro de ${prevMonth}/${year} já está pronto. Vê onde gastaste mais e o teu balanço final.`,
                type: "report_ready",
                date: new Date(year, today.getMonth(), 1).toISOString(),
                read: readIds.includes(notifId),
                actionUrl: "/dashboard/reports",
            })
        }

        // Filtrar as notificações que o utilizador já eliminou
        return alerts.filter(notif => !dismissedIds.includes(notif.id))

    }, [financialRecords, installmentPlans, isMounted, dismissedIds, readIds])

    const unreadCount = generatedNotifications.filter((n) => !n.read).length

    // ============================================================================
    // 3. AÇÕES DO UTILIZADOR
    // ============================================================================
    const handleMarkAsRead = (id: string) => {
        const updated = [...readIds, id]
        setReadIds(updated)
        saveToMemory("fl_read_notifications", updated)
    }

    const handleMarkAllAsRead = () => {
        const allIds = generatedNotifications.map(n => n.id)
        const updated = Array.from(new Set([...readIds, ...allIds]))
        setReadIds(updated)
        saveToMemory("fl_read_notifications", updated)
    }

    const handleDeleteNotification = (id: string) => {
        const updated = [...dismissedIds, id]
        setDismissedIds(updated)
        saveToMemory("fl_dismissed_notifications", updated)
    }

    const handleClearAll = () => {
        const allIds = generatedNotifications.map(n => n.id)
        const updated = Array.from(new Set([...dismissedIds, ...allIds]))
        setDismissedIds(updated)
        saveToMemory("fl_dismissed_notifications", updated)
    }

    if (!isMounted) return null // Evita piscar o layout antes do localStorage carregar

    return (
        <div className="flex-1 w-full p-4 sm:p-6 md:p-8 font-poppins overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">

                {/* CABEÇALHO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--primary-app)] flex items-center gap-2.5">
                            Centro de Notificações
                            {unreadCount > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white translate-y-[-2px]">
                                    {unreadCount} Nova{unreadCount > 1 ? "s" : ""}
                                </span>
                            )}
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            Avisos inteligentes e alertas gerados automaticamente sobre o teu estado financeiro.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                <CheckCheck className="w-4 h-4" />
                                <span>Marcar lidas</span>
                            </button>
                        )}
                        {generatedNotifications.length > 0 && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Limpar tudo</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* LISTA DE NOTIFICAÇÕES */}
                <div className="space-y-3">
                    {generatedNotifications.length === 0 ? (
                        <Card className="py-12 shadow-sm text-center border-slate-200/80 dark:border-slate-800">
                            <CardContent className="flex flex-col items-center justify-center space-y-3">
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                                    <Bell className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        Estás a par de tudo!
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Não existem pendências, metas concluídas ou relatórios novos.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        generatedNotifications.map((item) => (
                            <Card
                                key={item.id}
                                className={`shadow-sm transition-all border ${
                                    !item.read
                                        ? "border-blue-200 dark:border-blue-800/60 bg-blue-50/20 dark:bg-blue-950/10"
                                        : "border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900/40"
                                }`}
                            >
                                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3.5">
                                        {/* Ícones Contextuais */}
                                        <div
                                            className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                                                item.type === "goal_reached"
                                                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                                    : item.type === "validate_record"
                                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                            }`}
                                        >
                                            {item.type === "goal_reached" && <Trophy className="w-5 h-5" />}
                                            {item.type === "validate_record" && <CheckCircle2 className="w-5 h-5" />}
                                            {item.type === "report_ready" && <PieChart className="w-5 h-5" />}
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                                                    {item.title}
                                                </h2>
                                                {!item.read && (
                                                    <span className="w-2 h-2 rounded-full bg-blue-600" title="Não lida" />
                                                )}
                                            </div>
                                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                                {item.description}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(item.date).toLocaleDateString("pt-PT")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botões de Ação */}
                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                        {item.actionUrl && (
                                            <a
                                                href={item.actionUrl}
                                                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[var(--primary-app)] transition-colors"
                                            >
                                                <span>Ver Detalhes</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </a>
                                        )}

                                        {!item.read && (
                                            <button
                                                type="button"
                                                onClick={() => handleMarkAsRead(item.id)}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                                            >
                                                Marcar Lida
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteNotification(item.id)}
                                            aria-label="Apagar notificação"
                                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
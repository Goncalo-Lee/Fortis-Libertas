"use client"

import { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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
    Sparkles,
} from "lucide-react"

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
    // 1, 2, 3. Estado das Notificações
    const [notifications, setNotifications] = useState<NotificationItem[]>([
        {
            id: "n1",
            title: "🎉 Meta Conquistada!",
            description: "Parabéns! A tua meta 'Viagem de Férias' atingiu 100%. Já podes movê-la para o histórico de conquistas.",
            type: "goal_reached",
            date: "2026-10-24",
            read: false,
            actionUrl: "/dashboard/goals",
        },
        {
            id: "n2",
            title: "Validação Pendente",
            description: "Tens 2 despesas espontâneas registadas esta semana por classificar. Lembra-te de verificar o impacto nos teus impulsos.",
            type: "validate_record",
            date: "2026-10-23",
            read: false,
            actionUrl: "/dashboard/expenses",
        },
        {
            id: "n3",
            title: "Relatório Mensal Disponível",
            description: "O teu raio-x financeiro de outubro já está pronto. Vê como correu a aplicação da Regra 50/30/20.",
            type: "report_ready",
            date: "2026-10-21",
            read: true,
            actionUrl: "/dashboard/incomes",
        },
        {
            id: "n4",
            title: "Almofada de Segurança Reforçada",
            description: "O teu Pé de Meia atingiu novos patamares e já cobre mais de 4 meses de despesas essenciais!",
            type: "goal_reached",
            date: "2026-10-18",
            read: true,
            actionUrl: "/dashboard/money-pillow",
        },
    ])

    const unreadCount = notifications.filter((n) => !n.read).length

    // Marcar uma como lida
    const handleMarkAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
    }

    // Marcar todas como lidas
    const handleMarkAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }

    // Apagar notificação
    const handleDeleteNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }

    // Limpar todas
    const handleClearAll = () => {
        setNotifications([])
    }

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins">

            {/* CABEÇALHO DA PÁGINA + AÇÕES GLOBAIS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                        Centro de Notificações
                        {unreadCount > 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                            </span>
                        )}
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Avisos inteligentes, validações e alertas sobre o teu progresso financeiro.
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
                    {notifications.length > 0 && (
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
            <div className="max-w-4xl space-y-3">
                {notifications.length === 0 ? (
                    <Card className="py-12 shadow-sm text-center">
                        <CardContent className="flex flex-col items-center justify-center space-y-3">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                                <Bell className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    Estás a par de tudo!
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Não tens novas notificações neste momento.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((item) => (
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
                                    {/* Ícone adaptado ao tipo de notificação */}
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
                                            <span>•</span>
                                            <span className="capitalize font-medium text-slate-500">
                                                {item.type === "goal_reached"
                                                    ? "Meta Financeira"
                                                    : item.type === "validate_record"
                                                        ? "Validação de Registo"
                                                        : "Relatório"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Botões de Ação da Notificação */}
                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                    {item.actionUrl && (
                                        <a
                                            href={item.actionUrl}
                                            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                                        >
                                            <span>Ver</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </a>
                                    )}

                                    {!item.read && (
                                        <button
                                            type="button"
                                            onClick={() => handleMarkAsRead(item.id)}
                                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                                        >
                                            Marcar lida
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
    )
}
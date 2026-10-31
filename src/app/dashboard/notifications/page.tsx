"use client"

import { useState, useEffect } from "react"
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
import { useNotifications } from "@/contexts/NotificationContext"

export default function NotificationsPage() {
    const { unreadCount, markAllAsRead } = useNotifications()

    // Como os dados reais vêm do backend, simulamos a lista de leitura
    // baseada no contexto. Na realidade, deverias ter um endpoint de GET para as notificações todas.
    const [isMounted, setIsMounted] = useState(false)

    // Efeito para garantir a hidratação e marcar como lidas ao entrar
    useEffect(() => {
        setIsMounted(true)
        if (unreadCount > 0) {
            markAllAsRead()
        }
    }, [unreadCount, markAllAsRead])

    if (!isMounted) return null

    return (
        <div className="flex-1 w-full p-4 sm:p-6 md:p-8 font-poppins overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">

                {/* CABEÇALHO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--primary-app)] flex items-center gap-2.5">
                            Centro de Notificações
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            As tuas notificações foram lidas e o contador foi atualizado automaticamente.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            type="button"
                            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Limpar histórico</span>
                        </button>
                    </div>
                </div>

                {/* PLACEHOLDER DE LISTA DE NOTIFICAÇÕES */}
                <div className="space-y-3">
                    <Card className="py-12 shadow-sm text-center border-slate-200/80 dark:border-slate-800">
                        <CardContent className="flex flex-col items-center justify-center space-y-3">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                                <Bell className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    Histórico de notificações em breve
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Esta secção listará as mensagens gravadas no servidor.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
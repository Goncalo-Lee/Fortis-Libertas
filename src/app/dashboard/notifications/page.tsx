"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, CheckCircle2, Trash2, Calendar, AlertCircle, Info, CheckCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useNotifications } from "@/contexts/NotificationContext"

export default function NotificationsPage() {
    const {
        notifications, unreadCount, loading,
        markAllAsRead, markAsRead, deleteNotification
    } = useNotifications()

    const [isProcessing, setIsProcessing] = useState(false)

    const handleMarkAllAsRead = async () => {
        setIsProcessing(true)
        try {
            await markAllAsRead()
            toast.success("Todas as notificações marcadas como lidas.")
        } catch (err) {
            toast.error("Falha ao marcar notificações como lidas.")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteNotification(id)
            toast.success("Notificação removida.")
        } catch (err) {
            toast.error("Falha ao eliminar notificação.")
        }
    }

    const renderIcon = (type?: string) => {
        const t = (type || "").toLowerCase()
        if (t.includes("alert") || t.includes("warning") || t.includes("late")) {
            return <AlertCircle className="w-4 h-4 text-amber-500" />
        }
        if (t.includes("success") || t.includes("goal") || t.includes("paid")) {
            return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        }
        return <Info className="w-4 h-4 text-blue-500" />
    }

    return (
        <div className="flex-1 w-full h-full p-4 sm:p-6 md:p-8 font-poppins flex flex-col overflow-hidden">
            <div className="mx-auto w-full max-w-4xl space-y-6 flex flex-col h-full">
                {/* Cabeçalho Fixo */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                    <div className="space-y-1">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                            Centro de Notificações
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            {unreadCount > 0
                                ? `Tens ${unreadCount} notificação(ões) por ler.`
                                : "Estás a par de todas as atualizações."}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <CheckCheck className="w-4 h-4" />
                                <span>Marcar todas como lidas</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Conteúdo com Scroll Limitado */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {loading ? (
                        <Card className="py-12 shadow-sm text-center border-slate-200/80 dark:border-slate-800">
                            <CardContent className="flex flex-col items-center justify-center space-y-3">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                <p className="text-xs text-muted-foreground">A carregar notificações...</p>
                            </CardContent>
                        </Card>
                    ) : notifications.length === 0 ? (
                        <Card className="py-12 shadow-sm text-center border-slate-200/80 dark:border-slate-800">
                            <CardContent className="flex flex-col items-center justify-center space-y-3">
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                                    <Bell className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        Sem notificações
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Não existem avisos ou lembretes pendentes na tua conta.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        notifications.map((item) => (
                            <div
                                key={item.notification_id}
                                className={`flex items-start justify-between p-3.5 sm:p-4 rounded-xl border transition-all ${
                                    !item.is_read
                                        ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 shadow-xs"
                                        : "bg-white dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800"
                                }`}
                            >
                                <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                                        {renderIcon(item.type)}
                                    </div>
                                    <div className="min-w-0 space-y-0.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {item.title}
                                            </p>
                                            {!item.is_read && (
                                                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed break-words">
                                            {item.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1 pt-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(item.created_at).toLocaleString("pt-PT")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {!item.is_read && (
                                        <button
                                            type="button"
                                            title="Marcar como lida"
                                            onClick={() => markAsRead(item.notification_id)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors cursor-pointer"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        title="Eliminar notificação"
                                        onClick={() => handleDelete(item.notification_id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
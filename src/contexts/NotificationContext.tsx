"use client";

import * as React from "react";
import { toast } from "sonner";

export interface NotificationItem {
    notification_id: string;
    title: string;
    message: string;
    type?: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationContextType {
    notifications: NotificationItem[];
    unreadCount: number;
    loading: boolean;
    refreshNotifications: () => Promise<void>;
    markAllAsRead: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    createNotification: (title: string, message: string, type?: string) => Promise<void>;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = React.useState<number>(0);
    const [loading, setLoading] = React.useState<boolean>(true);

    // 1. Carregar Notificações e a Contagem (Tudo junto)
    const refreshNotifications = React.useCallback(async () => {
        setLoading(true);
        try {
            // Busca a lista completa
            const resList = await fetch("/api/v1/me/notifications?per_page=50", {
                method: "GET",
                cache: "no-store",
            });
            if (resList.ok) {
                const body = await resList.json();
                setNotifications(body.data || []);
            }

            // Busca a contagem de não lidas
            const resCount = await fetch("/api/v1/me/notifications/unread-count", {
                method: "GET",
                cache: "no-store",
            });
            if (resCount.ok) {
                const countBody = await resCount.json();
                setUnreadCount(countBody.data?.unread ?? 0);
            }
        } catch (err) {
            console.error("Falha ao sincronizar notificações:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Marcar TODAS como lidas
    const markAllAsRead = React.useCallback(async () => {
        setUnreadCount(0); // Atualização otimista
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        try {
            const res = await fetch("/api/v1/me/notifications/read-all", {
                method: "POST",
            });
            if (!res.ok) refreshNotifications(); // Se falhar, reverte
        } catch (err) {
            refreshNotifications();
        }
    }, [refreshNotifications]);

    // 3. Marcar UMA como lida
    const markAsRead = React.useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/v1/me/notifications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_read: true }),
            });
            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Falha ao atualizar notificação:", err);
        }
    }, []);

    // 4. Apagar notificação
    const deleteNotification = React.useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/v1/me/notifications/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
                // Recalcula o unreadCount caso a notificação apagada não estivesse lida
                refreshNotifications();
            } else {
                throw new Error("Erro na eliminação");
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }, [refreshNotifications]);

    // 5. CRIAR Nova Notificação (Ideal para Metas e Fundos!)
    const createNotification = React.useCallback(async (title: string, message: string, type: string = "info") => {
        try {
            await fetch("/api/v1/me/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, message, type }),
            });
            refreshNotifications(); // Puxa logo a nova para o sino apitar
        } catch (err) {
            console.error("Erro ao criar notificação", err);
        }
    }, [refreshNotifications]);

    // Carrega tudo quando a app inicia
    React.useEffect(() => {
        refreshNotifications();
    }, [refreshNotifications]);

    return (
        <NotificationContext.Provider value={{
            notifications, unreadCount, loading,
            refreshNotifications, markAllAsRead, markAsRead, deleteNotification, createNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = React.useContext(NotificationContext);
    if (!context) throw new Error("useNotifications deve ser utilizado dentro de NotificationProvider.");
    return context;
}
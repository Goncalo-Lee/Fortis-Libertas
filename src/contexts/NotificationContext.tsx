"use client";

import * as React from "react";

interface NotificationContextType {
    unreadCount: number;
    refreshCount: () => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [unreadCount, setUnreadCount] = React.useState<number>(0);

    const refreshCount = React.useCallback(async () => {
        try {
            const res = await fetch("/api/v1/me/notifications/unread-count", {
                method: "GET",
                cache: "no-store",
            });
            if (res.ok) {
                const body = await res.json();
                setUnreadCount(body.data?.unread_count ?? 0);
            }
        } catch (err) {
            console.error("Falha ao sincronizar notificações:", err);
        }
    }, []);

    const markAllAsRead = React.useCallback(async () => {
        // Atualização otimista na interface
        setUnreadCount(0);
        try {
            const res = await fetch("/api/v1/me/notifications/unread-count", {
                method: "PATCH",
            });
            if (!res.ok) {
                refreshCount();
            }
        } catch (err) {
            console.error("Falha ao marcar notificações como lidas:", err);
            refreshCount();
        }
    }, [refreshCount]);

    React.useEffect(() => {
        refreshCount();
    }, [refreshCount]);

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshCount, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = React.useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications deve ser utilizado dentro de NotificationProvider.");
    }
    return context;
}
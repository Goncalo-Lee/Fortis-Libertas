"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageSquare, Power, Loader2 } from "lucide-react"
import { toast } from "sonner"

const TAWK_SRC = "https://embed.tawk.to/6adcd550803f96347af46e2f/1k5na2gp1"

export default function ChatToggleDialog() {
    const [open, setOpen] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Deteta se o widget já estava injetado no DOM
    useEffect(() => {
        const existingScript = document.getElementById("tawkTo-script")
        if (existingScript) {
            setIsActive(true)
        }
    }, [])

    const handleToggleChat = () => {
        setIsLoading(true)

        try {
            if (!isActive) {
                // ==========================================
                // 1. ATIVAR TAWK.TO (Injeta o script no DOM)
                // ==========================================
                window.Tawk_API = window.Tawk_API || {}
                window.Tawk_LoadStart = new Date()

                // Se o script já tiver sido carregado antes, apenas volta a mostrar
                if (window.Tawk_API.showWidget) {
                    window.Tawk_API.showWidget()
                    if (window.Tawk_API.maximize) window.Tawk_API.maximize()
                    setIsActive(true)
                    setIsLoading(false)
                    setOpen(false)
                    toast.success("Chatbot ativado!")
                    return
                }

                const s1 = document.createElement("script")
                s1.id = "tawkTo-script"
                s1.async = true
                s1.src = TAWK_SRC
                s1.charset = "UTF-8"
                s1.setAttribute("crossorigin", "*")

                s1.onload = () => {
                    setIsActive(true)
                    setIsLoading(false)
                    setOpen(false)
                    if (window.Tawk_API?.maximize) {
                        window.Tawk_API.maximize()
                    }
                    toast.success("Chatbot ativado com sucesso!")
                }

                s1.onerror = () => {
                    setIsLoading(false)
                    toast.error("Erro ao carregar o serviço de chat.")
                }

                document.head.appendChild(s1)

            } else {
                // ==========================================
                // 2. DESATIVAR TAWK.TO (Esconde e limpa o DOM)
                // ==========================================
                if (window.Tawk_API?.hideWidget) {
                    window.Tawk_API.hideWidget()
                }

                // Remove o script do head
                const scriptEl = document.getElementById("tawkTo-script")
                if (scriptEl) {
                    scriptEl.remove()
                }

                // Remove os iframes/containers que o Tawk injetou no body
                const tawkElements = document.querySelectorAll('iframe[src*="tawk.to"], div[class*="tawk"]')
                tawkElements.forEach((el) => {
                    const rootContainer = el.closest('div[style*="position: fixed"]') || el
                    rootContainer.remove()
                })

                setIsActive(false)
                setIsLoading(false)
                setOpen(false)
                toast.info("Chatbot desativado.")
            }
        } catch (error) {
            console.error("Erro no Tawk.to:", error)
            setIsLoading(false)
            toast.error("Ocorreu um erro ao alterar o estado do chat.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium rounded-lg text-slate-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate text-slate-100">Ajuda / Chatbot</span>
                </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md font-poppins">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[var(--primary-app)]" />
                        Assistente Virtual Fortis Libertas
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Ativa ou desativa o chat em tempo real de suporte.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 my-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Estado Atual
                        </span>
                        <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                isActive
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                        >
                            {isActive ? "Ativo" : "Desligado"}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {isActive
                            ? "O widget está ativo no ecrã. Podes desligá-lo para libertar recursos do browser."
                            : "Ao clicar em ativar, o assistente virtual ficará disponível no canto inferior direito."}
                    </p>
                </div>

                <DialogFooter className="pt-2 flex gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleToggleChat}
                        disabled={isLoading}
                        className={`gap-2 ${isActive ? "bg-rose-600 hover:bg-rose-700 text-white" : ""}`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> A processar...
                            </>
                        ) : (
                            <>
                                <Power className="w-4 h-4" />
                                {isActive ? "Desativar Chat" : "Ativar Chat"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
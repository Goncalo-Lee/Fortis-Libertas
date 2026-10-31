"use client"

import { useState } from "react"
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
import { Mail, Loader2, ArrowRight, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

interface RequestResetDialogProps {
    email: string
}

export default function RequestResetDialog({ email }: RequestResetDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleRequestReset = async () => {
        if (!email) {
            toast.error("Nenhum email associado encontrado.")
            return
        }

        setIsLoading(true)
        try {
            const { error } = await authClient.requestPasswordReset({
                email,
                // window.location.origin garante que funciona em localhost:3000 e no domínio real em produção
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) {
                throw new Error(error.message)
            }

            toast.success("Email de reposição enviado! Verifica a tua caixa de correio.")
            setOpen(false)
        } catch (err: any) {
            toast.error(err.message || "Erro ao solicitar a reposição de palavra-passe.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                    <span>Redefinir palavra-passe</span>
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md font-poppins">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Repor Palavra-passe
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Vamos enviar um link seguro para o teu email para redefinires a tua palavra-passe.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 my-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
                        <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Email de Destino</span>
                        <span className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                            {email || "A carregar email..."}
                        </span>
                    </div>
                </div>

                <DialogFooter className="pt-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleRequestReset} disabled={isLoading || !email} className="min-w-[140px]">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Link Seguro"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
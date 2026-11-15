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
import { Input } from "@/components/ui/input"
import { Mail, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

interface MailChangeDialogProps {
    currentEmail: string
}

export default function MailChangeDialog({ currentEmail }: MailChangeDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [newEmail, setNewEmail] = useState("")

    const handleChangeEmail = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newEmail || !newEmail.includes("@")) {
            toast.error("Por favor, insira um email válido.")
            return
        }

        if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
            toast.error("O novo email tem de ser diferente do atual.")
            return
        }

        setIsLoading(true)
        try {
            const { error } = await authClient.changeEmail({
                newEmail: newEmail.toLowerCase(),
                callbackURL: `${window.location.origin}/dashboard/settings/account`,
            })

            if (error) {
                throw new Error(error.message)
            }

            toast.success("Verifica a caixa de correio do novo email para confirmares a alteração!")
            setOpen(false)
            setNewEmail("")
        } catch (err: any) {
            toast.error(err.message || "Erro ao solicitar a alteração de email.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button variant="outline" className="w-full sm:w-auto gap-2" />
                }
            >
                <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Alterar Email</span>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md font-poppins">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Alterar Email de Conta
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Vamos enviar um link de verificação para o teu <strong>novo</strong> endereço de email. A alteração só terá efeito após a tua confirmação.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleChangeEmail} className="space-y-4 my-2">
                    <div className="flex flex-col gap-1.5 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Email Atual
                        </span>
                        <span className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                            {currentEmail || "A carregar email..."}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="new-email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Novo Email
                        </label>
                        <Input
                            id="new-email"
                            type="email"
                            placeholder="novo.email@exemplo.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setOpen(false)
                                setNewEmail("")
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !newEmail} className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white">
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Confirmar Alteração"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
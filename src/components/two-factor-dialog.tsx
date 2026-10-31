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
import { Label } from "@/components/ui/label"
import { ShieldCheck, ShieldAlert, KeyRound, Loader2, QrCode } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

interface Enable2FADialogProps {
    session: any
    onStatusChange?: () => void
}

export default function Enable2FADialog({ session, onStatusChange }: Enable2FADialogProps) {
    const isEnabled = Boolean(session?.user?.twoFactorEnabled)

    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<"password" | "qr">("password")
    const [password, setPassword] = useState("")
    const [code, setCode] = useState("")
    const [totpURI, setTotpURI] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    function resetModal() {
        setStep("password")
        setPassword("")
        setCode("")
        setTotpURI("")
        setIsLoading(false)
    }

    // 1. Pedir a palavra-passe e obter o QR Code
    const handleStartEnable = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) return toast.error("Introduz a tua palavra-passe.")

        setIsLoading(true)
        try {
            const { data, error } = await authClient.twoFactor.enable({
                password,
                method: "totp",
                issuer: "Fortis Libertas",
            })

            if (error) {
                throw new Error(error.message || "Palavra-passe incorreta.")
            }

            if (data?.totpURI) {
                setTotpURI(data.totpURI)
                setStep("qr")
            }
        } catch (err: any) {
            toast.error(err.message || "Erro ao iniciar configuração do 2FA.")
        } finally {
            setIsLoading(false)
        }
    }

    // 2. Validar o primeiro código do Authenticator
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim() || code.length < 6) {
            return toast.error("Introduz o código de 6 dígitos gerado pela app.")
        }

        setIsLoading(true)
        try {
            const { error } = await authClient.twoFactor.verifyTotp({
                code: code.trim(),
            })

            if (error) {
                throw new Error(error.message || "Código inválido ou expirado.")
            }

            toast.success("Autenticação de dois fatores ativada com sucesso!")
            setOpen(false)
            resetModal()
            if (onStatusChange) onStatusChange()
        } catch (err: any) {
            toast.error(err.message || "Erro ao verificar código.")
        } finally {
            setIsLoading(false)
        }
    }

    // 3. Desativar 2FA
    const handleDisable2FA = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) return toast.error("Introduz a tua palavra-passe para desativar.")

        setIsLoading(true)
        try {
            const { error } = await authClient.twoFactor.disable({
                password,
            })

            if (error) {
                throw new Error(error.message || "Erro ao desativar 2FA.")
            }

            toast.success("Autenticação de dois fatores desativada.")
            setOpen(false)
            resetModal()
            if (onStatusChange) onStatusChange()
        } catch (err: any) {
            toast.error(err.message || "Palavra-passe incorreta.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetModal(); }}>
            <DialogTrigger asChild>
                <Button variant={isEnabled ? "destructive" : "default"} className="gap-2">
                    {isEnabled ? (
                        <>
                            <ShieldAlert className="w-4 h-4" />
                            <span>Desativar 2FA</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Ativar 2FA</span>
                        </>
                    )}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md font-poppins">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        {isEnabled ? "Desativar Autenticação 2FA" : "Configurar Autenticação de Dois Fatores"}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        {isEnabled
                            ? "Confirma a tua palavra-passe para remover esta camada extra de proteção."
                            : step === "password"
                                ? "Confirma a tua palavra-passe atual para gerar a chave de segurança."
                                : "Lê o código QR com o Google Authenticator ou 1Password e introduz o código gerado."}
                    </DialogDescription>
                </DialogHeader>

                {/* CENÁRIO A: DESATIVAR 2FA */}
                {isEnabled ? (
                    <form onSubmit={handleDisable2FA} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="disable-pass" className="text-xs font-medium">Palavra-passe Atual</Label>
                            <Input
                                id="disable-pass"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="A tua palavra-passe"
                                required
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" variant="destructive" disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Desativação"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    /* CENÁRIO B: ATIVAR 2FA */
                    <>
                        {step === "password" ? (
                            <form onSubmit={handleStartEnable} className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="enable-pass" className="text-xs font-medium">Palavra-passe Atual</Label>
                                    <Input
                                        id="enable-pass"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="A tua palavra-passe"
                                        required
                                    />
                                </div>
                                <DialogFooter className="pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continuar"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyCode} className="space-y-4 pt-2 flex flex-col items-center text-center">
                                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpURI)}`}
                                        alt="QR Code TOTP"
                                        className="w-44 h-44"
                                    />
                                </div>

                                <div className="w-full space-y-2 text-left">
                                    <Label htmlFor="auth-code" className="text-xs font-medium">Código da Aplicação (6 dígitos)</Label>
                                    <Input
                                        id="auth-code"
                                        type="text"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                        placeholder="000000"
                                        className="text-center font-mono text-lg tracking-widest font-semibold"
                                        required
                                    />
                                </div>

                                <DialogFooter className="w-full pt-2">
                                    <Button type="button" variant="ghost" onClick={resetModal}>Voltar</Button>
                                    <Button type="submit" disabled={isLoading || code.length < 6} className="flex-1">
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar e Ativar"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
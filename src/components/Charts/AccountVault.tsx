"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PiggyBank, ShieldCheck } from "lucide-react"
import { useFinancial } from "@/contexts/FinancialContext"

export default function AccountVault() {
    const { financialRecords, paymentMethods } = useFinancial()

    // Permite fixar o valor ao clicar ou mostrar ao passar o rato
    const [isPinned, setIsPinned] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const showValue = isPinned || isHovered

    // 1. LÓGICA DE NEGÓCIO: Calcular o Pé de Meia Real
    const { totalSaved, securityLevel } = useMemo(() => {
        if (!financialRecords || !paymentMethods) return { totalSaved: 0, securityLevel: 1 }

        // Procura os métodos de pagamento destinados a poupança (ex: Cofre, Poupança, Vault)
        const savingsMethods = paymentMethods.filter((pm: any) =>
            pm.name.toLowerCase().includes("poupança") ||
            pm.name.toLowerCase().includes("cofre") ||
            pm.name.toLowerCase().includes("pé de meia")
        )

        const savingsMethodIds = savingsMethods.map((pm: any) => pm.id)

        // Soma as entradas e saídas APENAS dessas contas de poupança
        const total = financialRecords
            .filter((record: any) => savingsMethodIds.includes(record.paymentMethodId || record.payment_method_id))
            .reduce((acc: number, record: any) => {
                const amount = Number(record.price || 0)
                // Assume-se que a classificação Income/Expense já é tratada como positivo/negativo no registo
                // ou ajustas mediante o recordTypeName, tal como no contexto global.
                return acc + amount
            }, 0)

        // Define um objetivo dinâmico para a barra de nível (ex: 5000€ para ter o escudo nível 5)
        const savingsGoal = 5000
        const calculatedLevel = total >= savingsGoal ? 5 : Math.max(1, Math.ceil((total / savingsGoal) * 5))

        return { totalSaved: total, securityLevel: calculatedLevel }
    }, [financialRecords, paymentMethods])

    return (
        <Card
            onClick={() => setIsPinned((prev) => !prev)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setIsPinned((prev) => !prev)
                }
            }}
            aria-label="Mostrar ou ocultar valor da poupança"
            className="@container flex h-full w-full cursor-pointer select-none flex-col justify-between py-3 font-poppins shadow-sm transition-colors hover:border-emerald-200 dark:hover:border-emerald-800/60"
        >
            <CardHeader className="pb-1 md:pb-2 w-full z-10">
                <CardTitle className="text-sm sm:text-base md:text-lg font-medium text-muted-foreground flex items-center justify-center gap-2">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                        <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    Poupanças
                </CardTitle>
            </CardHeader>

            <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-3 my-auto">
                <div className="relative flex items-center justify-center">
                    <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shadow-inner transition-transform duration-300 ${
                            showValue ? "scale-105" : "scale-100"
                        }`}
                    >
                        <PiggyBank className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400 stroke-[1.75]" />
                    </div>

                    {/* O escudo fica dourado/teal quando o nível 5 é atingido */}
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                        <ShieldCheck className={`w-4 h-4 ${securityLevel === 5 ? "text-amber-500" : "text-teal-500"}`} />
                    </div>
                </div>

                <div className="grid w-full items-center justify-items-center">
                    <div
                        className={`col-start-1 row-start-1 flex w-full flex-col items-center gap-2.5 transition-all duration-300 ${
                            showValue
                                ? "pointer-events-none translate-y-2 opacity-0"
                                : "translate-y-0 opacity-100"
                        }`}
                    >
                        <div className="flex items-center gap-1.5 w-full max-w-[140px] justify-center">
                            {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                    key={level}
                                    className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                                        level <= securityLevel
                                            ? "bg-emerald-500 dark:bg-emerald-400"
                                            : "bg-slate-100 dark:bg-slate-800"
                                    }`}
                                />
                            ))}
                        </div>

                        <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                            {securityLevel === 5 ? "Fundo de Segurança Atingido" : "A construir reserva"}
                        </span>
                    </div>

                    <div
                        className={`col-start-1 row-start-1 flex w-full flex-col items-center gap-0.5 transition-all duration-300 ${
                            showValue
                                ? "translate-y-0 opacity-100"
                                : "pointer-events-none -translate-y-2 opacity-0"
                        }`}
                    >
                        <div className="text-primary-app dark:text-white text-xl font-bold @[220px]:text-xl @[320px]:text-2xl lg:text-3xl">
                            € {totalSaved.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {isPinned ? "Fixado (clica para ocultar)" : "Total acumulado no cofre"}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
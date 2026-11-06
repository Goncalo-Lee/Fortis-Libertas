"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, ShieldAlert, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useFinancial } from "@/contexts/FinancialContext"

export default function AccountVault() {
    const { financialRecords, installmentPlans, paymentMethods, recordTypes } = useFinancial()

    const [isPinned, setIsPinned] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const showValue = isPinned || isHovered

    // ============================================================================
    // LÓGICA DE NEGÓCIO: Fundo de Emergência
    // ============================================================================
    const { totalSaved, targetAmount, monthsCovered, securityLevel } = useMemo(() => {
        // 1. Localizar o Plano do Fundo de Emergência na BD
        const emergencyPlan = (installmentPlans || []).find(
            (p: any) =>
                p.status !== "cancelled" &&
                (p.description?.startsWith("[PILLOW]") ||
                    p.description?.startsWith("[EMERGENCY]") ||
                    p.name?.toLowerCase().includes("emergência") ||
                    p.name?.toLowerCase().includes("almofada") ||
                    p.name?.toLowerCase().includes("fundo de reserva"))
        )

        const planId = emergencyPlan?.installment_plan_id || emergencyPlan?.id

        const target = Number(
            emergencyPlan?.total_amount ?? emergencyPlan?.totalAmount ?? emergencyPlan?.amount ?? 4500
        )
        const totalMonths = Number(emergencyPlan?.total_installments ?? emergencyPlan?.totalInstallments ?? 6)
        const monthlyCost = totalMonths > 0 ? target / totalMonths : 750

        // 2. Contas de suporte
        const savingsMethodIds = (paymentMethods || [])
            .filter((pm: any) => {
                const name = (pm.name || "").toLowerCase()
                return name.includes("poupança") || name.includes("cofre") || name.includes("emergência") || name.includes("reserva")
            })
            .map((pm: any) => pm.payment_method_id || pm.id)

        // 3. Filtrar movimentos
        const relevantRecords = (financialRecords || []).filter((r: any) => {
            const rPlanId = r.installment_plan_id || r.installmentPlanId
            const payId = r.payment_method_id || r.paymentMethodId

            if (planId && rPlanId === planId) return true
            return !planId && savingsMethodIds.includes(payId)
        })

        // 4. Entradas vs Saídas
        let deposits = 0
        let withdrawals = 0

        relevantRecords.forEach((r: any) => {
            const amount = Number(r.price || 0)
            const rtId = r.record_type_id || r.recordTypeId || r.recordType?.record_type_id || r.recordType?.id
            const rt = (recordTypes || []).find((t: any) => (t.record_type_id || t.id) === rtId)
            const kind = rt?.kind || r.record_type?.kind
            const typeName = (rt?.name || r.recordType?.name || "").toLowerCase()

            const isWithdrawal =
                kind === "income" ||
                typeName.includes("receita") ||
                typeName.includes("income") ||
                r.name?.toLowerCase().includes("uso de emergência") ||
                r.name?.toLowerCase().includes("reserva")

            if (isWithdrawal) {
                withdrawals += amount
            } else {
                deposits += amount
            }
        })

        const balance = Math.max(0, deposits - withdrawals)
        const covered = monthlyCost > 0 ? Number((balance / monthlyCost).toFixed(1)) : 0
        const completionPct = target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : 0
        const level = Math.min(5, Math.max(1, Math.ceil((completionPct / 100) * 5)))

        return {
            totalSaved: balance,
            targetAmount: target,
            monthsCovered: covered,
            securityLevel: level
        }
    }, [financialRecords, installmentPlans, paymentMethods, recordTypes])

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
            aria-label="Mostrar ou ocultar valor do fundo de emergência"
            className="@container flex h-full w-full cursor-pointer select-none flex-col justify-between p-3 sm:p-4 font-poppins shadow-sm transition-all hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-md"
        >
            <CardHeader className="p-0 pb-1 w-full z-10">
                <CardTitle className="text-xs @[180px]:text-sm sm:text-base font-semibold text-muted-foreground flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 truncate">
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5 @[200px]:w-4 @[200px]:h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="truncate">Fundo de Emergência</span>
                    </span>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 shrink-0">
                        Reserva
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="p-0 pt-2 flex flex-col items-center justify-center text-center gap-2 sm:gap-3 my-auto w-full">
                <div className="relative flex items-center justify-center my-0.5">
                    <div
                        className={`w-12 h-12 @[200px]:w-14 @[200px]:h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shadow-inner transition-transform duration-300 ${
                            showValue ? "scale-105" : "scale-100"
                        }`}
                    >
                        <ShieldCheck className={`w-6 h-6 @[200px]:w-7 @[200px]:h-7 sm:w-8 sm:h-8 stroke-[1.75] transition-colors duration-300 ${
                            securityLevel >= 4 ? "text-emerald-600 dark:text-emerald-400" : "text-teal-600 dark:text-teal-400"
                        }`} />
                    </div>

                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
                        <span className={`block w-2.5 h-2.5 rounded-full ${
                            securityLevel === 5 ? "bg-emerald-500 animate-pulse" : "bg-teal-500"
                        }`} />
                    </div>
                </div>

                <div className="grid w-full items-center justify-items-center min-h-[50px] @[200px]:min-h-[56px]">
                    <div
                        className={`col-start-1 row-start-1 flex w-full flex-col items-center gap-1.5 sm:gap-2 transition-all duration-300 ${
                            showValue
                                ? "pointer-events-none translate-y-2 opacity-0"
                                : "translate-y-0 opacity-100"
                        }`}
                    >
                        <div className="flex items-center gap-1 sm:gap-1.5 w-full max-w-[130px] @[200px]:max-w-[150px] justify-center px-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                    key={level}
                                    className={`h-1.5 @[200px]:h-2 flex-1 rounded-full transition-all duration-500 ${
                                        level <= securityLevel
                                            ? "bg-emerald-500 dark:bg-emerald-400 shadow-xs"
                                            : "bg-slate-200 dark:bg-slate-800"
                                    }`}
                                />
                            ))}
                        </div>

                        <span className="text-[11px] @[200px]:text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                            {monthsCovered > 0 ? `${monthsCovered} meses protegidos` : "A iniciar reserva"}
                        </span>
                        <span className="text-[10px] text-muted-foreground/80 hidden @[180px]:inline">
                            Clica para ver saldo
                        </span>
                    </div>

                    <div
                        className={`col-start-1 row-start-1 flex w-full flex-col items-center gap-0.5 transition-all duration-300 ${
                            showValue
                                ? "translate-y-0 opacity-100"
                                : "pointer-events-none -translate-y-2 opacity-0"
                        }`}
                    >
                        <div className="text-slate-900 dark:text-slate-100 text-lg @[190px]:text-xl @[250px]:text-2xl font-bold tracking-tight">
                            € {totalSaved.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] @[200px]:text-[11px] font-medium text-emerald-600 dark:text-emerald-400 truncate max-w-full px-1">
                            {isPinned ? "Fixado (clica para ocultar)" : `Meta: € ${targetAmount.toLocaleString("pt-PT")}`}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
"use client"

import { useMemo, useEffect, useState } from "react"
import { Target, AlertCircle, X, Check, Star } from "lucide-react"
import {
    Label,
    PolarRadiusAxis,
    PolarAngleAxis,
    RadialBar,
    RadialBarChart,
} from "recharts"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    type ChartConfig,
} from "@/components/ui/chart"

import { useFinancial } from "@/contexts/FinancialContext"

const chartConfig = {
    amount: { label: "Valor Alcançado" },
    meta: { label: "Meta", color: "var(--app-gains, #10b981)" },
} satisfies ChartConfig

export default function ChartRadial() {
    const { financialRecords, installmentPlans } = useFinancial()
    const [primaryGoalId, setPrimaryGoalId] = useState<string | null>(null)
    const [isSelectorOpen, setIsSelectorOpen] = useState(false)

    // Sincroniza com a meta destacada no localStorage
    useEffect(() => {
        const saved = localStorage.getItem("primaryFinancialGoal")
        if (saved) setPrimaryGoalId(saved)
    }, [])

    // Lista de planos ativos filtrada e enriquecida
    const activePlans = useMemo(() => {
        return (installmentPlans || []).filter(
            (p: any) => p.status !== "completed" && p.status !== "cancelled"
        )
    }, [installmentPlans])

    const { currentAmount, targetAmount, percentage, planName, hasPlans, activePlanId } = useMemo(() => {
        if (activePlans.length === 0) {
            return {
                currentAmount: 0,
                targetAmount: 100,
                percentage: 0,
                planName: "Sem Metas",
                hasPlans: false,
                activePlanId: null,
            }
        }

        // Seleciona a meta guardada ou faz fallback para a primeira da lista
        const activePlan = activePlans.find((p: any) => p.id === primaryGoalId) || activePlans[0]

        // Lê com prioridade totalAmount / total_amount (nomes reais da tua BD/Drizzle)
        const target = Number(
            activePlan.totalAmount ??
            activePlan.total_amount ??
            activePlan.amount ??
            activePlan.target_amount ??
            activePlan.price ??
            0
        )

        const current = (financialRecords || [])
            .filter((r: any) => (r.installmentPlanId || r.installment_plan_id) === activePlan.id)
            .reduce((acc: number, r: any) => acc + Number(r.price || 0), 0)

        const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

        return {
            currentAmount: current,
            targetAmount: target > 0 ? target : 1,
            percentage: pct,
            planName: activePlan.name || "Meta Financeira",
            hasPlans: true,
            activePlanId: activePlan.id,
        }
    }, [financialRecords, activePlans, primaryGoalId])

    function handleSelectGoal(id: string, e: React.MouseEvent) {
        e.stopPropagation()
        setPrimaryGoalId(id)
        localStorage.setItem("primaryFinancialGoal", id)
        setIsSelectorOpen(false)
    }

    const chartData = [
        { name: "meta", amount: currentAmount, fill: "#10b981" },
    ]

    return (
        <Card
            onClick={() => hasPlans && setIsSelectorOpen(true)}
            role={hasPlans ? "button" : undefined}
            tabIndex={hasPlans ? 0 : undefined}
            className={`relative flex h-full min-h-0 w-full flex-col justify-between py-3 font-poppins shadow-sm transition-colors overflow-hidden ${
                hasPlans ? "cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-800/60" : ""
            }`}
        >
            {/* CABEÇALHO PADRONIZADO E SUAVE */}
            <CardHeader className="pb-1 w-full z-10 shrink-0">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                        <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span>{hasPlans ? planName : "Meta Financeira"}</span>
                </CardTitle>
            </CardHeader>

            {/* CONTEÚDO / GRÁFICO */}
            <CardContent className="px-4 pb-2 flex-1 flex flex-col items-center justify-center min-h-[160px] w-full my-auto">
                {hasPlans ? (
                    <div className="w-full h-full min-h-[150px] max-h-[220px] flex items-center justify-center">
                        <ChartContainer config={chartConfig} className="w-full h-full aspect-square max-w-[200px] max-h-[200px]">
                            <RadialBarChart
                                data={chartData}
                                startAngle={210}
                                endAngle={-30}
                                innerRadius="78%"
                                outerRadius="100%"
                            >
                                <PolarAngleAxis
                                    type="number"
                                    domain={[0, Math.max(targetAmount, currentAmount)]}
                                    tick={false}
                                />
                                <RadialBar
                                    dataKey="amount"
                                    background={{ fill: "rgba(148, 163, 184, 0.15)" }}
                                    cornerRadius={8}
                                />
                                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) - 8}
                                                            className="fill-slate-900 dark:fill-white text-2xl sm:text-3xl font-bold font-poppins"
                                                        >
                                                            {percentage}%
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 16}
                                                            className="fill-muted-foreground text-[10px] sm:text-[11px] font-medium"
                                                        >
                                                            € {currentAmount.toLocaleString("pt-PT")} / {targetAmount.toLocaleString("pt-PT")}
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </PolarRadiusAxis>
                            </RadialBarChart>
                        </ChartContainer>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <span className="text-xs text-muted-foreground text-center">
                            Nenhuma meta ativa criada.
                        </span>
                    </div>
                )}

                {hasPlans && (
                    <span className="text-[10px] text-muted-foreground/80 mt-1">
                        Clica no cartão para alternar a meta
                    </span>
                )}
            </CardContent>

            {/* MODAL INTERNO DE SELEÇÃO AO CLICAR NO CARTÃO */}
            {isSelectorOpen && (
                <div
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsSelectorOpen(false)
                    }}
                    className="absolute inset-0 z-50 flex flex-col bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm p-3.5 animate-in fade-in zoom-in-95 duration-150"
                >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                        <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                Escolher Meta Principal
                            </h4>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsSelectorOpen(false)
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                        {activePlans.map((plan: any) => {
                            const isSelected = plan.id === activePlanId
                            const target = Number(plan.totalAmount ?? plan.total_amount ?? plan.amount ?? 0)

                            return (
                                <button
                                    key={plan.id}
                                    type="button"
                                    onClick={(e) => handleSelectGoal(plan.id, e)}
                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors border ${
                                        isSelected
                                            ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-medium"
                                            : "border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                    }`}
                                >
                                    <div className="truncate pr-2">
                                        <p className="truncate font-semibold">{plan.name}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Alvo: € {target.toLocaleString("pt-PT")}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </Card>
    )
}
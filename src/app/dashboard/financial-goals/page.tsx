"use client"

import { useState, useMemo, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Target,
    Trophy,
    Plus,
    Calendar,
    CheckCircle2,
    Trash2,
    Clock,
    Award,
    TrendingUp,
    Star,
    Pencil,
    X,
    Save
} from "lucide-react"
import { toast } from "sonner"
import { useDashboard } from "@/contexts/DashboardContext"
import { useFinancial } from "@/contexts/FinancialContext"

type GoalHorizon = "short" | "medium" | "long"

export default function FinancialGoalsPage() {
    const { activeDashboard } = useDashboard()
    const { installmentPlans, financialRecords, refresh } = useFinancial()

    // Estado do Formulário de Criação
    const [isAdding, setIsAdding] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newTarget, setNewTarget] = useState("")
    const [newMonths, setNewMonths] = useState("6")
    const [newHorizon, setNewHorizon] = useState<GoalHorizon>("short")

    // Estado para Meta Destaque / Selecionada (Persistida no Browser)
    const [primaryGoalId, setPrimaryGoalId] = useState<string | null>(null)

    // Estado para Modal de Edição de Meta
    const [editingGoal, setEditingGoal] = useState<{ id: string; name: string; targetAmount: number } | null>(null)
    const [editName, setEditName] = useState("")
    const [editTarget, setEditTarget] = useState("")
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem("primaryFinancialGoal")
        if (saved) setPrimaryGoalId(saved)
    }, [])

    function handleSetPrimaryGoal(id: string) {
        localStorage.setItem("primaryFinancialGoal", id)
        setPrimaryGoalId(id)
        toast.success("Meta definida como principal para o Dashboard!")
    }

    // ==========================================
    // 1. PROCESSAR DADOS REAIS DA BASE DE DADOS
    // ==========================================
    const enrichedPlans = useMemo(() => {
        if (!installmentPlans) return []

        return installmentPlans.map((plan: any) => {
            // O backend devolve totalAmount (ou total_amount)
            const targetAmount = Number(
                plan.totalAmount ?? plan.total_amount ?? plan.amount ?? plan.price ?? 0
            )

            const savedAmount = (financialRecords || [])
                .filter((r: any) => (r.installmentPlanId || r.installment_plan_id) === plan.id)
                .reduce((acc: number, r: any) => acc + Number(r.price || 0), 0)

            return {
                ...plan,
                targetAmount,
                savedAmount,
                monthsRemaining: Number(plan.totalInstallments ?? plan.total_installments ?? 6),
                status: plan.status || "pending",
                createdAt: plan.createdAt || plan.created_at || new Date().toISOString()
            }
        })
    }, [installmentPlans, financialRecords])

    const activeGoals = enrichedPlans.filter((p: any) => p.status !== "completed" && p.status !== "cancelled")
    const completedGoals = enrichedPlans.filter((p: any) => p.status === "completed")

    // Apanha o plano selecionado (ou o primeiro ativo como fallback)
    const selectedGoal = useMemo(() => {
        if (activeGoals.length === 0) return null
        return activeGoals.find((g: any) => g.id === primaryGoalId) || activeGoals[0]
    }, [activeGoals, primaryGoalId])

    const selectedPct = selectedGoal && selectedGoal.targetAmount > 0
        ? Math.min(Math.round((selectedGoal.savedAmount / selectedGoal.targetAmount) * 100), 100)
        : 0

    const totalMonthlyEffort = activeGoals.reduce((acc: number, g: any) => {
        const remaining = Math.max(0, g.targetAmount - g.savedAmount)
        return acc + remaining / Math.max(1, g.monthsRemaining)
    }, 0)

    // ==========================================
    // 2. OPERAÇÕES DE API (POST / PATCH / DELETE)
    // ==========================================
    async function handleCreateGoal(e: React.FormEvent) {
        e.preventDefault()
        const target = parseFloat(newTarget)
        const months = parseInt(newMonths, 10) || 1

        if (!newTitle.trim() || isNaN(target) || target <= 0) return
        setIsSubmitting(true)

        // Calcula a data de vencimento (due_date) com base nos meses indicados:
        const calculatedDueDate = new Date()
        calculatedDueDate.setMonth(calculatedDueDate.getMonth() + months)
        const dueDateString = calculatedDueDate.toISOString().split("T")[0] // "YYYY-MM-DD"

        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newTitle.trim(),
                    description: `Meta a ${newHorizon === "short" ? "curto" : newHorizon === "medium" ? "médio" : "longo"} prazo`,
                    total_amount: target.toFixed(2), // "1200.00"
                    total_installments: months,      // número inteiro de meses/prestações
                    due_date: dueDateString,         // "YYYY-MM-DD"
                    status: "pending"                // Status válido ("pending" | "paid" | "cancelled" | "late")
                })
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.message || "Falha ao criar plano! Tento outro nome ou um valor maior...")
            }

            refresh()
            toast.success("Novo objetivo financeiro criado com sucesso!")
            setNewTitle("")
            setNewTarget("")
            setNewMonths("6")
            setIsAdding(false)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Erro ao criar a meta.")
        } finally {
            setIsSubmitting(false)
        }
    }

    function openEditModal(goal: any) {
        setEditingGoal({ id: goal.id, name: goal.name, targetAmount: goal.targetAmount })
        setEditName(goal.name)
        setEditTarget(String(goal.targetAmount))
    }

    async function handleSaveEdit(e: React.FormEvent) {
        e.preventDefault()
        if (!editingGoal) return

        const target = parseFloat(editTarget)
        if (!editName.trim() || isNaN(target) || target <= 0) {
            return toast.error("Preenche um nome válido e um valor maior que 0.")
        }

        setIsSavingEdit(true)
        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${editingGoal.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    total_amount: target.toFixed(2)
                })
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.message || "Erro ao atualizar dados da meta.")
            }

            refresh()
            toast.success("Meta atualizada com sucesso!")
            setEditingGoal(null)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Falha ao gravar alterações da meta.")
        } finally {
            setIsSavingEdit(false)
        }
    }

    async function handleCompleteGoal(goalId: string) {
        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${goalId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "completed" })
            })
            if (!res.ok) throw new Error("Falha ao concluir")

            refresh()
            toast.success("Muitos parabéns! Meta alcançada com sucesso! 🎉")

            if (primaryGoalId === goalId) {
                localStorage.removeItem("primaryFinancialGoal")
                setPrimaryGoalId(null)
            }
        } catch (error) {
            toast.error("Erro ao concluir a meta.")
        }
    }

    async function handleDeleteGoal(id: string) {
        if (!confirm("Tens a certeza? Os registos associados não serão apagados, mas perderão a ligação a esta meta.")) return
        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Falha ao eliminar")

            if (primaryGoalId === id) {
                localStorage.removeItem("primaryFinancialGoal")
                setPrimaryGoalId(null)
            }
            refresh()
            toast.success("Objetivo removido.")
        } catch (error) {
            toast.error("Erro ao remover o objetivo.")
        }
    }

    function handleReinforceIntent() {
        toast.info("Para reforçar, vai a 'Despesas', regista a saída e associa-a a esta Meta!", {
            duration: 6000
        })
    }

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins relative">

            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Metas e Objetivos Financeiros
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Acompanha a tua meta ativa e planeia objetivos sem recorrer a dívidas.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsAdding((prev) => !prev)}
                    className="flex items-center gap-1.5 self-start sm:self-auto bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>Criar Nova Meta</span>
                </button>
            </div>

            {/* MODAL / OVERLAY DE EDIÇÃO */}
            {editingGoal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Editar Meta Financeira</CardTitle>
                                <CardDescription className="text-xs">Altera o nome ou ajusta o valor alvo.</CardDescription>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingGoal(null)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Nome da Meta</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Objetivo de Valor (€)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={editTarget}
                                        onChange={(e) => setEditTarget(e.target.value)}
                                        className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-sm"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingGoal(null)}
                                        className="h-9 px-4 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingEdit}
                                        className="h-9 px-4 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {isSavingEdit ? "A guardar..." : "Guardar Alterações"}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* FORMULÁRIO DE NOVA META */}
            {isAdding && (
                <Card className="border-blue-200 dark:border-blue-800/60 bg-blue-50/30 dark:bg-blue-950/10 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold">
                            Definir Novo Objetivo Financeiro
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Define o nome da meta, o valor total a alcançar e o prazo previsto.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateGoal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Nome da Meta</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Férias, Carro, Computador..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Valor Alvo (€)</label>
                                <input
                                    type="number"
                                    step="1"
                                    placeholder="1000"
                                    value={newTarget}
                                    onChange={(e) => setNewTarget(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Prazo e Horizonte</label>
                                <div className="flex gap-1.5">
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={newMonths}
                                        onChange={(e) => setNewMonths(e.target.value)}
                                        className="h-9 w-16 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs sm:text-sm text-center"
                                        title="Meses"
                                        required
                                    />
                                    <select
                                        value={newHorizon}
                                        onChange={(e) => setNewHorizon(e.target.value as GoalHorizon)}
                                        className="h-9 flex-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs"
                                    >
                                        <option value="short">Curto Prazo</option>
                                        <option value="medium">Médio Prazo</option>
                                        <option value="long">Longo Prazo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmitting ? "..." : "Criar"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="h-9 px-3 bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-md hover:bg-slate-300/70 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* LINHA 1: CARTÕES DE RESUMO (AGORA COM FOCO NA META SELECIONADA) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Cartão 1: Meta Selecionada / Destaque */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            {selectedGoal ? `Meta Ativa: ${selectedGoal.name}` : "Nenhuma Meta Ativa"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-2 my-auto">
                        {selectedGoal ? (
                            <>
                                <div className="text-xl font-bold @[220px]:text-xl @[320px]:text-2xl text-slate-900 dark:text-slate-100">
                                    € {selectedGoal.savedAmount.toLocaleString("pt-PT")}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {" "}/ € {selectedGoal.targetAmount.toLocaleString("pt-PT")} ({selectedPct}%)
                                    </span>
                                </div>
                                <div className="w-full max-w-[200px] h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                                        style={{ width: `${selectedPct}%` }}
                                    />
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-muted-foreground">Cria uma meta para ver o progresso.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Cartão 2: Ritmo Mensal Necessário */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
                                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            Ritmo Mensal Recomendado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold @[220px]:text-2xl @[320px]:text-3xl text-slate-900 dark:text-slate-100">
                            € {Math.ceil(totalMonthlyEffort).toLocaleString("pt-PT")} <span className="text-xs font-normal text-muted-foreground">/mês</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Para cumprir as tuas {activeGoals.length} metas no prazo
                        </span>
                    </CardContent>
                </Card>

                {/* Cartão 3: Objetivos Conquistados */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                                <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            Objetivos Conquistados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold @[220px]:text-2xl @[320px]:text-3xl text-slate-900 dark:text-slate-100">
                            {completedGoals.length} Metas
                        </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            € {completedGoals.reduce((acc: number, c: any) => acc + c.targetAmount, 0).toLocaleString("pt-PT")} poupados sem dívidas
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* LINHA 2: METAS EM CURSO E DETALHES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LISTA DE METAS */}
                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                As Tuas Metas em Curso
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Clica em "Destacar" para definir qual aparece na Dashboard principal.
                            </CardDescription>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {activeGoals.length} ativas
                        </span>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {activeGoals.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-6">Não tens metas em curso.</p>
                        )}
                        {activeGoals.map((goal: any) => {
                            const pct = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100)
                            const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)
                            const monthlyNeeded = Math.ceil(remaining / Math.max(1, goal.monthsRemaining))
                            const isReadyToComplete = pct >= 100
                            const isPrimary = (selectedGoal?.id === goal.id)

                            return (
                                <div
                                    key={goal.id}
                                    className={`p-4 rounded-xl border space-y-3 transition-all ${
                                        isPrimary
                                            ? "border-blue-400/80 dark:border-blue-500/60 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm"
                                            : "border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                                                    {goal.name}
                                                </h3>
                                                {isPrimary && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                                                        <Star className="w-3 h-3 fill-current" /> Meta Selecionada
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {isReadyToComplete
                                                    ? "Objetivo alcançado! Pronto para ser concluído."
                                                    : `Faltam € ${remaining.toLocaleString("pt-PT")} • Esforço: € ${monthlyNeeded}/mês`}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                    isReadyToComplete
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                                }`}
                                            >
                                                {pct}%
                                            </span>
                                            <button
                                                type="button"
                                                title="Editar nome ou valor"
                                                onClick={() => openEditModal(goal)}
                                                className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full h-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                isReadyToComplete ? "bg-emerald-500" : "bg-blue-600 dark:bg-blue-500"
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                                        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                            € {goal.savedAmount.toLocaleString("pt-PT")}{" "}
                                            <span className="font-normal text-muted-foreground">
                                                / € {goal.targetAmount.toLocaleString("pt-PT")}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!isPrimary && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetPrimaryGoal(goal.id)}
                                                    className="text-[11px] font-medium px-2.5 py-1 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors border border-blue-200 dark:border-blue-900/50"
                                                >
                                                    Destacar
                                                </button>
                                            )}

                                            {!isReadyToComplete ? (
                                                <button
                                                    type="button"
                                                    onClick={handleReinforceIntent}
                                                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                                                >
                                                    Depositar
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCompleteGoal(goal.id)}
                                                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Concluir Meta
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteGoal(goal.id)}
                                                aria-label="Eliminar meta"
                                                className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                <div className="lg:col-span-5 space-y-6">
                    <Card className="py-4 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                Histórico de Metas Alcançadas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {completedGoals.length === 0 && (
                                <p className="text-xs text-center text-muted-foreground py-4">Ainda não concluíste nenhuma meta.</p>
                            )}
                            {completedGoals.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {item.name}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(item.createdAt).toLocaleDateString("pt-PT")}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                        € {item.targetAmount.toLocaleString("pt-PT")}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
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
    CreditCard,
    AlertTriangle,
    Plus,
    Calendar,
    CheckCircle2,
    Trash2,
    Clock,
    TrendingDown,
    Star,
    Pencil,
    X,
    Save
} from "lucide-react"
import { toast } from "sonner"
import { useDashboard } from "@/contexts/DashboardContext"
import { useFinancial } from "@/contexts/FinancialContext"

type DebtHorizon = "short" | "medium" | "long"

export default function DebtsPage() {
    const { activeDashboard } = useDashboard()
    const { installmentPlans, financialRecords, refresh } = useFinancial()

    // Estado do Formulário de Criação
    const [isAdding, setIsAdding] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newTarget, setNewTarget] = useState("")
    const [newMonths, setNewMonths] = useState("12")
    const [newHorizon, setNewHorizon] = useState<DebtHorizon>("medium")

    // Estado para Dívida Destaque / Selecionada (Persistida no Browser)
    const [primaryDebtId, setPrimaryDebtId] = useState<string | null>(null)

    // Estado para Modal de Edição
    const [editingDebt, setEditingDebt] = useState<{ id: string; name: string; targetAmount: number } | null>(null)
    const [editName, setEditName] = useState("")
    const [editTarget, setEditTarget] = useState("")
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem("primaryFinancialDebt")
        if (saved) setPrimaryDebtId(saved)
    }, [])

    function handleSetPrimaryDebt(id: string) {
        localStorage.setItem("primaryFinancialDebt", id)
        setPrimaryDebtId(id)
        toast.success("Dívida definida como foco principal!")
    }

    // ==========================================
    // 1. FILTRAR E PROCESSAR APENAS DÍVIDAS ([DEBT])
    // ==========================================
    const enrichedPlans = useMemo(() => {
        if (!installmentPlans) return []

        return installmentPlans
            .filter((p: any) => p.description && p.description.startsWith("[DEBT]"))
            .map((plan: any) => {
                const targetAmount = Number(
                    plan.totalAmount ?? plan.total_amount ?? plan.amount ?? plan.target_amount ?? plan.price ?? 0
                )

                const paidAmount = (financialRecords || [])
                    .filter((r: any) => (r.installmentPlanId || r.installment_plan_id) === plan.id)
                    .reduce((acc: number, r: any) => acc + Number(r.price || 0), 0)

                return {
                    ...plan,
                    targetAmount,
                    paidAmount,
                    monthsRemaining: Number(plan.totalInstallments ?? plan.total_installments ?? 12),
                    status: plan.status || "pending",
                    createdAt: plan.createdAt || plan.created_at || new Date().toISOString()
                }
            })
    }, [installmentPlans, financialRecords])

    const activeDebts = enrichedPlans.filter((p: any) => p.status !== "completed" && p.status !== "cancelled")
    const completedDebts = enrichedPlans.filter((p: any) => p.status === "completed")

    // Dívida selecionada / destaque
    const selectedDebt = useMemo(() => {
        if (activeDebts.length === 0) return null
        return activeDebts.find((g: any) => g.id === primaryDebtId) || activeDebts[0]
    }, [activeDebts, primaryDebtId])

    const selectedPct = selectedDebt && selectedDebt.targetAmount > 0
        ? Math.min(Math.round((selectedDebt.paidAmount / selectedDebt.targetAmount) * 100), 100)
        : 0

    const totalMonthlyEffort = activeDebts.reduce((acc: number, d: any) => {
        const remaining = Math.max(0, d.targetAmount - d.paidAmount)
        return acc + remaining / Math.max(1, d.monthsRemaining)
    }, 0)

    // ==========================================
    // 2. OPERAÇÕES DE API (POST / PATCH / DELETE)
    // ==========================================
    async function handleCreateDebt(e: React.FormEvent) {
        e.preventDefault()
        const target = parseFloat(newTarget)
        const months = parseInt(newMonths, 10) || 1

        if (!newTitle.trim() || isNaN(target) || target <= 0) return
        setIsSubmitting(true)

        const calculatedDueDate = new Date()
        calculatedDueDate.setMonth(calculatedDueDate.getMonth() + months)
        const dueDateString = calculatedDueDate.toISOString().split("T")[0]

        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newTitle.trim(),
                    description: `[DEBT] Crédito a ${newHorizon === "short" ? "curto" : newHorizon === "medium" ? "médio" : "longo"} prazo`,
                    total_amount: target.toFixed(2),
                    total_installments: months,
                    due_date: dueDateString,
                    status: "pending"
                })
            })

            const resData = await res.json().catch(() => ({}))

            if (!res.ok) {
                if (res.status === 409 || resData.code === "NAME_ALREADY_EXISTS") {
                    throw new Error(`O nome "${newTitle.trim()}" já está a ser utilizado noutro registo.`)
                }
                throw new Error(resData.message || "Falha ao registar dívida.")
            }

            refresh()
            toast.success("Novo registo de dívida criado com sucesso!")
            setNewTitle("")
            setNewTarget("")
            setNewMonths("12")
            setIsAdding(false)
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar a dívida.")
        } finally {
            setIsSubmitting(false)
        }
    }

    function openEditModal(debt: any) {
        setEditingDebt({ id: debt.id, name: debt.name, targetAmount: debt.targetAmount })
        setEditName(debt.name)
        setEditTarget(String(debt.targetAmount))
    }

    async function handleSaveEdit(e: React.FormEvent) {
        e.preventDefault()
        if (!editingDebt) return

        const target = parseFloat(editTarget)
        if (!editName.trim() || isNaN(target) || target <= 0) {
            return toast.error("Preenche um nome válido e um valor maior que 0.")
        }

        setIsSavingEdit(true)
        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${editingDebt.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    total_amount: target.toFixed(2)
                })
            })

            const resData = await res.json().catch(() => ({}))
            if (!res.ok) {
                if (res.status === 409 || resData.code === "NAME_ALREADY_EXISTS") {
                    throw new Error(`Já existe outro registo com o nome "${editName.trim()}".`)
                }
                throw new Error(resData.message || "Erro ao atualizar dados da dívida.")
            }

            refresh()
            toast.success("Dívida atualizada com sucesso!")
            setEditingDebt(null)
        } catch (error: any) {
            toast.error(error.message || "Falha ao gravar alterações da dívida.")
        } finally {
            setIsSavingEdit(false)
        }
    }

    async function handleCompleteDebt(debtId: string) {
        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${debtId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "completed" })
            })
            if (!res.ok) throw new Error("Falha ao concluir")

            refresh()
            toast.success("Fantástico! Dívida totalmente liquidada! 🎉")

            if (primaryDebtId === debtId) {
                localStorage.removeItem("primaryFinancialDebt")
                setPrimaryDebtId(null)
            }
        } catch (error) {
            toast.error("Erro ao liquidar a dívida.")
        }
    }

    async function handleDeleteDebt(id: string) {
        if (!confirm("Tens a certeza? Os pagamentos associados não serão apagados, mas perderão a ligação a esta dívida.")) return
        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Falha ao eliminar")

            if (primaryDebtId === id) {
                localStorage.removeItem("primaryFinancialDebt")
                setPrimaryDebtId(null)
            }
            refresh()
            toast.success("Registo de dívida removido.")
        } catch (error) {
            toast.error("Erro ao remover a dívida.")
        }
    }

    function handleReinforceIntent() {
        toast.info("Para abater, vai a 'Despesas', cria um registo e associa-o a esta Dívida!", {
            duration: 6000
        })
    }

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins relative">

            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Gestão de Dívidas
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Controla os teus créditos, empréstimos e prestações em aberto.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsAdding((prev) => !prev)}
                    className="flex items-center gap-1.5 self-start sm:self-auto bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>Registar Nova Dívida</span>
                </button>
            </div>

            {/* MODAL DE EDIÇÃO */}
            {editingDebt && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Editar Dívida</CardTitle>
                                <CardDescription className="text-xs">Altera o nome ou ajusta o valor total em dívida.</CardDescription>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingDebt(null)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Nome da Dívida</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Valor Total (€)</label>
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
                                        onClick={() => setEditingDebt(null)}
                                        className="h-9 px-4 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingEdit}
                                        className="h-9 px-4 text-xs font-medium rounded-md bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 disabled:opacity-50"
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

            {/* FORMULÁRIO DE NOVA DÍVIDA */}
            {isAdding && (
                <Card className="border-rose-200 dark:border-rose-800/60 bg-rose-50/30 dark:bg-rose-950/10 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold">
                            Registar Novo Crédito / Dívida
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Indica o nome do credor ou crédito, o valor total e o prazo de liquidação.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateDebt} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Credor / Nome</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Crédito Automóvel..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Valor Total (€)</label>
                                <input
                                    type="number"
                                    step="1"
                                    placeholder="5000"
                                    value={newTarget}
                                    onChange={(e) => setNewTarget(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Prestações (Meses)</label>
                                <div className="flex gap-1.5">
                                    <input
                                        type="number"
                                        min="1"
                                        max="360"
                                        value={newMonths}
                                        onChange={(e) => setNewMonths(e.target.value)}
                                        className="h-9 w-16 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs sm:text-sm text-center"
                                        title="Meses"
                                        required
                                    />
                                    <select
                                        value={newHorizon}
                                        onChange={(e) => setNewHorizon(e.target.value as DebtHorizon)}
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
                                    className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmitting ? "..." : "Registar"}
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

            {/* CARTÕES DE TOPO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Cartão 1: Dívida Selecionada / Destaque */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-md">
                                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            </div>
                            {selectedDebt ? `Dívida em Foco: ${selectedDebt.name}` : "Nenhuma Dívida"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-2 my-auto">
                        {selectedDebt ? (
                            <>
                                <div className="text-xl font-bold @[220px]:text-xl @[320px]:text-2xl text-slate-900 dark:text-slate-100">
                                    € {selectedDebt.paidAmount.toLocaleString("pt-PT")}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {" "}abertos / € {selectedDebt.targetAmount.toLocaleString("pt-PT")} ({selectedPct}%)
                                    </span>
                                </div>
                                <div className="w-full max-w-[200px] h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-rose-600 dark:bg-rose-500 rounded-full transition-all duration-500"
                                        style={{ width: `${selectedPct}%` }}
                                    />
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-muted-foreground">Não tens dívidas registadas em aberto.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Cartão 2: Esforço Mensal */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                                <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            Esforço Mensal Base
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold @[220px]:text-2xl @[320px]:text-3xl text-slate-900 dark:text-slate-100">
                            € {Math.ceil(totalMonthlyEffort).toLocaleString("pt-PT")} <span className="text-xs font-normal text-muted-foreground">/mês</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Encargo previsto para as tuas {activeDebts.length} dívidas ativas
                        </span>
                    </CardContent>
                </Card>

                {/* Cartão 3: Créditos Liquidados */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            Créditos Liquidados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold @[220px]:text-2xl @[320px]:text-3xl text-slate-900 dark:text-slate-100">
                            {completedDebts.length} Dívidas
                        </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            € {completedDebts.reduce((acc: number, c: any) => acc + c.targetAmount, 0).toLocaleString("pt-PT")} amortizados
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* LISTAGEM */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LISTA ATIVA */}
                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                Prestações em Curso
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Foca-te numa dívida de cada vez. Clica em "Focar" para destacar.
                            </CardDescription>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {activeDebts.length} ativas
                        </span>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {activeDebts.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-6">Excelente, não tens dívidas registadas!</p>
                        )}
                        {activeDebts.map((debt: any) => {
                            const pct = Math.min(Math.round((debt.paidAmount / debt.targetAmount) * 100), 100)
                            const remaining = Math.max(0, debt.targetAmount - debt.paidAmount)
                            const monthlyNeeded = Math.ceil(remaining / Math.max(1, debt.monthsRemaining))
                            const isReadyToComplete = pct >= 100
                            const isPrimary = (selectedDebt?.id === debt.id)

                            return (
                                <div
                                    key={debt.id}
                                    className={`p-4 rounded-xl border space-y-3 transition-all ${
                                        isPrimary
                                            ? "border-rose-400/80 dark:border-rose-500/60 bg-rose-50/20 dark:bg-rose-950/20 shadow-sm"
                                            : "border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                                                    {debt.name}
                                                </h3>
                                                {isPrimary && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                                                        <Star className="w-3 h-3 fill-current" /> Foco Atual
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {isReadyToComplete
                                                    ? "Valor totalmente liquidado! Pronto para fechar."
                                                    : `Faltam € ${remaining.toLocaleString("pt-PT")} • Pagamento ref: € ${monthlyNeeded}/mês`}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                    isReadyToComplete
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                        : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                                }`}
                                            >
                                                {pct}%
                                            </span>
                                            <button
                                                type="button"
                                                title="Editar nome ou valor"
                                                onClick={() => openEditModal(debt)}
                                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full h-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                isReadyToComplete ? "bg-emerald-500" : "bg-rose-600 dark:bg-rose-500"
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                                        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                            € {debt.paidAmount.toLocaleString("pt-PT")}{" "}
                                            <span className="font-normal text-muted-foreground">
                                                / € {debt.targetAmount.toLocaleString("pt-PT")}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!isPrimary && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetPrimaryDebt(debt.id)}
                                                    className="text-[11px] font-medium px-2.5 py-1 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                                                >
                                                    Focar
                                                </button>
                                            )}

                                            {!isReadyToComplete ? (
                                                <button
                                                    type="button"
                                                    onClick={handleReinforceIntent}
                                                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                                >
                                                    Abater
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCompleteDebt(debt.id)}
                                                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Liquidar
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDebt(debt.id)}
                                                className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
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

                {/* HISTÓRICO LIQUIDADAS */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="py-4 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                Histórico de Liquidações
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {completedDebts.length === 0 && (
                                <p className="text-xs text-center text-muted-foreground py-4">Ainda não liquidaste nenhuma dívida pelo sistema.</p>
                            )}
                            {completedDebts.map((item: any) => (
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
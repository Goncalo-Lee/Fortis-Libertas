"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Trophy, Plus, Calendar, CheckCircle2, Trash2, Clock, Award, TrendingUp, Star, Pencil, X, Save, ArrowDownToLine } from "lucide-react"
import { toast } from "sonner"
import { useDashboard } from "@/contexts/DashboardContext"
import { useFinancial } from "@/contexts/FinancialContext"
import { CreateCategoryModal } from "@/components/CreateCategoryModal"

export default function FinancialGoalsPage() {
    const { activeDashboard } = useDashboard()
    const { installmentPlans, financialRecords, categories, recordTypes, paymentMethods, addFinancialRecord, refresh } = useFinancial()


    console.log("Registos financeiros:", financialRecords);


    const [isAdding, setIsAdding] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newTarget, setNewTarget] = useState("")
    const [newMonths, setNewMonths] = useState("6")
    const [newCategoryId, setNewCategoryId] = useState("")

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [tempCategory, setTempCategory] = useState<any>(null)

    const [primaryGoalId, setPrimaryGoalId] = useState<string | null>(null)
    const [editingGoal, setEditingGoal] = useState<{ id: string; name: string; targetAmount: number } | null>(null)
    const [editName, setEditName] = useState("")
    const [editTarget, setEditTarget] = useState("")
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    const [depositGoal, setDepositGoal] = useState<any | null>(null)
    const [depositAmount, setDepositAmount] = useState("")
    const [depositPaymentMethodId, setDepositPaymentMethodId] = useState("")
    const [isDepositing, setIsDepositing] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem("primaryFinancialGoal")
        if (saved) setPrimaryGoalId(saved)
    }, [])

    function handleSetPrimaryGoal(id: string) {
        localStorage.setItem("primaryFinancialGoal", id)
        setPrimaryGoalId(id)
        toast.success("Meta definida como foco principal!")
    }

    const expenseRecordType = useMemo(() => {
        if (!recordTypes) return null
        return recordTypes.find((rt: any) => rt.kind === "expense")
    }, [recordTypes])
    const defaultExpenseTypeId = expenseRecordType?.record_type_id || expenseRecordType?.id

    const availableCategories = useMemo(() => {
        let list = categories ? [...categories] : [];

        if (tempCategory && !list.some((c: any) => (c.category_id || c.id) === tempCategory.id)) {
            list.push(tempCategory);
        }

        return list.filter((c: any) => {
            if (tempCategory && (c.category_id || c.id) === tempCategory.id) return true;
            const rts = c.record_types || c.recordTypes || [];
            if (rts.length > 0) {
                return rts.some((rt: any) => rt.kind === "expense" || rt.kind === "neutral")
            }
            return false;
        })
    }, [categories, tempCategory])

    const enrichedPlans = useMemo(() => {
        if (!installmentPlans) return []
        return installmentPlans
            .filter((p: any) => !p.description || !p.description.startsWith("[DEBT]"))
            .map((plan: any) => {
                const planId = plan.installment_plan_id || plan.id
                const targetAmount = Number(plan.total_amount ?? plan.totalAmount ?? plan.amount ?? 0)

                // CORREÇÃO MAGISTRAL: Alargar a procura do ID e do campo de valor no registo financeiro!
                const savedAmount = (financialRecords || [])
                    .filter((r: any) =>
                        r.installment_plan_id === planId ||
                        r.installmentPlanId === planId ||
                        r.plan_id === planId
                    )
                    .reduce((acc: number, r: any) => acc + Number(r.amount || r.price || r.value || 0), 0)

                return {
                    ...plan,
                    id: planId,
                    installment_plan_id: planId,
                    categoryId: plan.category_id || plan.categoryId,
                    targetAmount,
                    savedAmount,
                    monthsRemaining: Number(plan.total_installments ?? plan.totalInstallments ?? 6),
                    status: plan.status || "pending",
                    createdAt: plan.created_at || plan.createdAt || new Date().toISOString(),
                    name: plan.name
                }
            })
    }, [installmentPlans, financialRecords])

    const activeGoals = enrichedPlans.filter((p: any) => p.status !== "paid" && p.status !== "cancelled")
    const completedGoals = enrichedPlans.filter((p: any) => p.status === "paid")

    const selectedGoal = useMemo(() => {
        if (activeGoals.length === 0) return null
        return activeGoals.find((g: any) => g.id === primaryGoalId) || activeGoals[0]
    }, [activeGoals, primaryGoalId])

    const selectedPct = selectedGoal && selectedGoal.targetAmount > 0
        ? Math.min(Math.round((selectedGoal.savedAmount / selectedGoal.targetAmount) * 100), 100)
        : 0

    // CORREÇÃO: Colocado o sinal de subtração que tinhas perdido
    const totalMonthlyEffort = activeGoals.reduce((acc: number, g: any) => {
        const remaining = Math.max(0, g.targetAmount - g.savedAmount)
        const months = Number(g.total_installments ?? g.totalInstallments ?? 6)
        return acc + remaining / Math.max(1, months)
    }, 0)

    async function handleExecuteDeposit(e: React.FormEvent) {
        e.preventDefault()
        if (!depositGoal || !depositPaymentMethodId) return toast.error("Preenche todos os campos.")
        const amount = parseFloat(depositAmount)
        if (isNaN(amount) || amount <= 0) return toast.error("Valor inválido.")

        setIsDepositing(true)
        try {
            await addFinancialRecord({
                name: `Reforço: ${depositGoal.name}`,
                description: "Depósito direto na Meta Financeira",
                price: amount,
                recordTypeName: "EXPENSE",
                recordTypeId: defaultExpenseTypeId,
                categoryId: depositGoal.categoryId,
                paymentMethodId: depositPaymentMethodId,
                paymentDate: new Date().toISOString(),
                installmentPlanId: depositGoal.id
            })

            toast.success(`Depósito de €${amount.toFixed(2)} efetuado com sucesso!`)
            setDepositGoal(null)
            setDepositAmount("")
            setDepositPaymentMethodId("")
            refresh()
        } catch (error: any) {
            toast.error(error.message || "Erro ao efetuar depósito.")
        } finally {
            setIsDepositing(false)
        }
    }

    async function handleCreateGoal(e: React.FormEvent) {
        e.preventDefault()
        if (!activeDashboard?.dashboard_id) return toast.error("Sem dashboard ativo.")
        if (!newCategoryId) return toast.error("Seleciona uma categoria.")

        if (!defaultExpenseTypeId) {
            return toast.error("Erro crítico: O teu dashboard atual não tem nenhum 'Record Type' de Despesa configurado. Vai à página de Despesas ou corre o seed.")
        }

        const target = parseFloat(newTarget)
        const months = parseInt(newMonths, 10) || 1

        if (!newTitle.trim() || isNaN(target) || target <= 0) {
            return toast.error("Indica um título e valor válidos.")
        }

        setIsSubmitting(true)
        const calculatedDueDate = new Date()
        calculatedDueDate.setMonth(calculatedDueDate.getMonth() + months)
        const dueDateString = calculatedDueDate.toISOString().split("T")[0]

        const payload = {
            name: newTitle.trim(),
            description: `Meta a ${months} meses`,
            total_amount: target.toFixed(2),
            total_installments: months,
            due_date: dueDateString,
            status: "pending",
            category_id: newCategoryId,
        }

        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const rawText = await res.text()
                try {
                    const errorData = JSON.parse(rawText)
                    throw new Error(errorData.detail || errorData.message || "Erro na validação da API.")
                } catch {
                    throw new Error(`Erro do Servidor: ${rawText.substring(0, 100)}`)
                }
            }

            refresh()
            toast.success("Objetivo financeiro criado com sucesso!")
            setNewTitle("")
            setNewTarget("")
            setNewMonths("6")
            setNewCategoryId("")
            setIsAdding(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    function openEditModal(goal: any) {
        const goalId = goal.installment_plan_id || goal.id
        setEditingGoal({ id: goalId, name: goal.name, targetAmount: goal.targetAmount })
        setEditName(goal.name)
        setEditTarget(String(goal.targetAmount))
    }

    async function handleSaveEdit(e: React.FormEvent) {
        e.preventDefault()
        if (!editingGoal || !activeDashboard?.dashboard_id) return
        const target = parseFloat(editTarget)
        if (!editName.trim() || isNaN(target) || target <= 0) return toast.error("Dados inválidos.")

        setIsSavingEdit(true)
        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${editingGoal.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name: editName.trim(), total_amount: target.toFixed(2) })
            })
            if (!res.ok) throw new Error("Erro ao atualizar.")
            refresh()
            toast.success("Meta atualizada!")
            setEditingGoal(null)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSavingEdit(false)
        }
    }

    async function handleCompleteGoal(goalId: string) {
        if (!activeDashboard?.dashboard_id) return
        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${goalId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ status: "paid" })
            })
            if (!res.ok) throw new Error("Falha ao concluir.")
            refresh()
            toast.success("Muitos parabéns! Meta conquistada! 🎉")
            if (primaryGoalId === goalId) {
                localStorage.removeItem("primaryFinancialGoal")
                setPrimaryGoalId(null)
            }
        } catch (error) {
            toast.error("Erro ao concluir.")
        }
    }

    async function handleDeleteGoal(id: string) {
        if (!activeDashboard?.dashboard_id) return
        if (!confirm("Tens a certeza? Os registos associados perderão a ligação a esta meta.")) return
        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${id}`, {
                method: "DELETE",
                credentials: "include"
            })
            if (!res.ok) throw new Error("Falha ao eliminar.")
            refresh()
            toast.success("Objetivo removido.")
            if (primaryGoalId === id) setPrimaryGoalId(null)
        } catch (error) {
            toast.error("Erro ao remover.")
        }
    }

    async function handleDeleteCategory(categoryId: string) {
        if (!confirm("Tens a certeza que queres apagar esta categoria?")) return
        try {
            await fetch(`/api/v1/dashboards/${activeDashboard?.dashboard_id}/categories/${categoryId}`, { method: "DELETE", credentials: "include" })
            refresh()
            toast.success("Categoria eliminada.")
            if (newCategoryId === categoryId) setNewCategoryId("")
        } catch (error) {
            toast.error("Erro ao eliminar a categoria.")
        }
    }

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins relative">

            <CreateCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                recordTypeId={defaultExpenseTypeId}
                typeLabel="Despesa"
                onSuccess={(id, name, kind) => {
                    const newCat = {
                        id,
                        category_id: id,
                        name,
                        record_types: [{ kind: kind || "expense" }]
                    };
                    setTempCategory(newCat);
                    setNewCategoryId(id);
                }}
            />

            {depositGoal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Depositar na Meta</CardTitle>
                                <CardDescription className="text-xs mt-0.5">Reforçar {depositGoal.name}</CardDescription>
                            </div>
                            <button type="button" onClick={() => setDepositGoal(null)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleExecuteDeposit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Valor a Depositar (€)</label>
                                    <input type="number" step="0.01" placeholder="Ex: 50.00" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="h-9 w-full rounded-md border bg-slate-50 dark:bg-slate-900 px-3 text-sm" required autoFocus />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Retirar de que conta?</label>
                                    <select value={depositPaymentMethodId} onChange={(e) => setDepositPaymentMethodId(e.target.value)} className="h-9 w-full rounded-md border bg-slate-50 dark:bg-slate-900 px-2 text-xs" required>
                                        <option value="" disabled>Selecionar conta bancária...</option>
                                        {paymentMethods.map((p: any) => (
                                            <option key={p.payment_method_id || p.id} value={p.payment_method_id || p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button type="button" onClick={() => setDepositGoal(null)} className="h-9 px-4 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Cancelar</button>
                                    <button type="submit" disabled={isDepositing} className="h-9 px-4 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                                        <ArrowDownToLine className="w-3.5 h-3.5" /> {isDepositing ? "A processar..." : "Confirmar Depósito"}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {editingGoal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold">Editar Meta</CardTitle>
                            <button type="button" onClick={() => setEditingGoal(null)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Nome da Meta</label>
                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 w-full rounded-md border bg-slate-50 dark:bg-slate-900 px-3 text-sm" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Objetivo de Valor (€)</label>
                                    <input type="number" step="0.01" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} className="h-9 w-full rounded-md border bg-slate-50 dark:bg-slate-900 px-3 text-sm" required />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button type="button" onClick={() => setEditingGoal(null)} className="h-9 px-4 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Cancelar</button>
                                    <button type="submit" disabled={isSavingEdit} className="h-9 px-4 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                                        <Save className="w-3.5 h-3.5" /> {isSavingEdit ? "A guardar..." : "Guardar"}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">Metas Financeiras</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">Poupanças com propósito, sem recorrer a créditos.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsAdding((prev) => !prev)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
                >
                    <Plus className="w-4 h-4" /> <span>Criar Nova Meta</span>
                </button>
            </div>

            {isAdding && (
                <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10 shadow-sm animate-in fade-in slide-in-from-top-3">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold">Definir Novo Objetivo</CardTitle>
                        <CardDescription className="text-xs">O valor e a categoria são guardados diretamente no plano da base de dados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateGoal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Nome da Meta</label>
                                <input type="text" placeholder="Ex: Viagem, Carro..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-9 rounded-md border bg-white dark:bg-slate-900 px-3 text-sm" required />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                                <div className="flex gap-1 h-9">
                                    <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} className="h-full flex-1 rounded-md border bg-white dark:bg-slate-900 px-2 text-xs" required>
                                        <option value="" disabled>Selecionar...</option>
                                        {availableCategories.map((c: any) => (
                                            <option key={c.category_id || c.id} value={c.category_id || c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>

                                    {newCategoryId && (
                                        <button type="button" onClick={() => handleDeleteCategory(newCategoryId)} className="h-full aspect-square bg-red-50 text-red-500 rounded-md flex items-center justify-center border border-red-200 hover:bg-red-100 dark:bg-red-950/30 cursor-pointer" title="Apagar Categoria">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="h-full aspect-square bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-center hover:bg-slate-200 cursor-pointer text-slate-500" title="Nova Categoria">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Valor Alvo (€)</label>
                                <input type="number" step="0.01" placeholder="1000.00" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} className="h-9 rounded-md border bg-white dark:bg-slate-900 px-3 text-sm" required />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Prazo (Meses)</label>
                                <div className="flex gap-2">
                                    <input type="number" min="1" max="120" value={newMonths} onChange={(e) => setNewMonths(e.target.value)} className="h-9 w-20 rounded-md border bg-white dark:bg-slate-900 px-2 text-sm text-center" required />
                                    <button type="submit" disabled={isSubmitting} className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md cursor-pointer disabled:opacity-50">
                                        {isSubmitting ? "..." : "Criar"}
                                    </button>
                                </div>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                                <button type="button" onClick={() => setIsAdding(false)} className="h-8 px-3 text-slate-500 hover:text-slate-700 text-xs cursor-pointer">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" /> {selectedGoal ? `Ativa: ${selectedGoal.name}` : "Nenhuma Meta Ativa"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-2 my-auto">
                        {selectedGoal ? (
                            <>
                                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                    € {selectedGoal.savedAmount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                    <span className="text-xs font-normal text-muted-foreground"> / € {selectedGoal.targetAmount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="w-full max-w-[200px] h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${selectedPct}%` }} />
                                </div>
                            </>
                        ) : <p className="text-xs text-muted-foreground">Sem metas ativas registadas.</p>}
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-600" /> Ritmo Recomendado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            € {Math.ceil(totalMonthlyEffort).toLocaleString("pt-PT")} <span className="text-xs font-normal text-muted-foreground">/mês</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Para cumprir {activeGoals.length} meta(s) a tempo</span>
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-600" /> Conquistadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{completedGoals.length} Metas</div>
                        <span className="text-xs text-emerald-600 font-medium">
                            € {completedGoals.reduce((acc: number, c: any) => acc + c.targetAmount, 0).toLocaleString("pt-PT")} poupados
                        </span>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" /> Metas em Curso
                        </CardTitle>
                        <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {activeGoals.length} ativas
                        </span>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activeGoals.length === 0 && (
                            <p className="text-xs text-center text-muted-foreground py-6">Nenhuma meta em aberto. Clica no botão acima para começar.</p>
                        )}
                        {activeGoals.map((goal: any) => {
                            const goalId = goal.installment_plan_id || goal.id
                            const pct = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100)

                            // CORREÇÃO: Colocado o sinal de subtração que tinhas perdido
                            const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)

                            const months = Number(goal.total_installments ?? goal.totalInstallments ?? 6)
                            const monthlyNeeded = Math.ceil(remaining / Math.max(1, months))
                            const isReadyToComplete = pct >= 100
                            const isPrimary = (selectedGoal?.id === goalId)

                            return (
                                <div key={goalId} className={`p-4 rounded-xl border space-y-3 transition-all ${isPrimary ? "border-blue-400 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs" : "border-slate-200/80 bg-slate-50/40 dark:bg-slate-900/30"}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-semibold">{goal.name}</h3>
                                                {isPrimary && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                        <Star className="w-3 h-3 fill-current" /> Foco
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {isReadyToComplete ? "Objetivo alcançado!" : `Faltam € ${remaining.toLocaleString("pt-PT")} | € ${monthlyNeeded}/mês`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isReadyToComplete ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                                                {pct}%
                                            </span>
                                            <button onClick={() => openEditModal(goal)} className="p-1 text-slate-400 hover:text-blue-600 rounded-md cursor-pointer">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full h-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-300 ${isReadyToComplete ? "bg-emerald-500" : "bg-blue-600"}`} style={{ width: `${pct}%` }} />
                                    </div>

                                    <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                                        <div className="text-xs sm:text-sm font-bold">
                                            € {goal.savedAmount.toLocaleString("pt-PT")}{" "}
                                            <span className="font-normal text-muted-foreground">/ € {goal.targetAmount.toLocaleString("pt-PT")}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!isPrimary && (
                                                <button onClick={() => handleSetPrimaryGoal(goalId)} className="text-[11px] font-medium px-2.5 py-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200 cursor-pointer">
                                                    Destacar
                                                </button>
                                            )}
                                            {isReadyToComplete ? (
                                                <button onClick={() => handleCompleteGoal(goalId)} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                                                </button>
                                            ) : (
                                                <button onClick={() => setDepositGoal(goal)} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer transition-colors">
                                                    <ArrowDownToLine className="w-3.5 h-3.5" /> Depositar
                                                </button>
                                            )}
                                            <button onClick={() => handleDeleteGoal(goalId)} className="p-1 text-slate-400 hover:text-red-500 rounded-md cursor-pointer">
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
                                <Award className="w-4 h-4 text-emerald-600" /> Histórico de Conquistas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {completedGoals.length === 0 && <p className="text-xs text-center text-muted-foreground py-4">Sem metas concluídas.</p>}
                            {completedGoals.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-emerald-200/50 bg-emerald-50/30 dark:bg-emerald-950/10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-md bg-emerald-100 text-emerald-600"><CheckCircle2 className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-sm font-medium">{item.name}</p>
                                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString("pt-PT")}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-700">€ {item.targetAmount.toLocaleString("pt-PT")}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
"use client"

import { useState, useMemo } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Plus,
    Calendar,
    TrendingDown,
    ArrowDownRight,
    PieChart,
    History,
    Trash2,
    AlertCircle,
    Flame,
    Home,
    Repeat
} from "lucide-react"

import { toast } from "sonner"
import { useDashboard } from "@/contexts/DashboardContext"
import { useFinancial } from "@/contexts/FinancialContext"
import { CreateCategoryModal } from "@/components/CreateCategoryModal"
import { DynamicIcon } from "@/components/DynamicIcon"

type ExpenseNature = "essential" | "subscription" | "spontaneous"

export default function ExpensesPage() {
    const { activeDashboard } = useDashboard()
    const { financialRecords, recordTypes, categories, paymentMethods, tags, installmentPlans, addFinancialRecord, refresh } = useFinancial()

    const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly")

    // Controlo do formulário
    const [isAdding, setIsAdding] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newAmount, setNewAmount] = useState("")
    const [newDescription, setNewDescription] = useState("")
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
    const [newCategoryId, setNewCategoryId] = useState("")
    const [newPaymentMethodId, setNewPaymentMethodId] = useState("")
    const [newNature, setNewNature] = useState<ExpenseNature>("spontaneous")
    const [newInstallmentPlanId, setNewInstallmentPlanId] = useState("") // NOVO: Dropdown de Meta/Dívida

    // Controlo do Modal de Categoria
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [tempCategory, setTempCategory] = useState<any>(null)

    // IDENTIFICAR TIPO EXPENSE
    const expenseType = useMemo(() => {
        if (!recordTypes) return null
        return recordTypes.find((rt: any) =>
            rt.kind === "expense" || (rt.name || "").toLowerCase().includes("despesa") || (rt.name || "").toLowerCase().includes("expense")
        )
    }, [recordTypes])

    const expenseTypeId = expenseType?.record_type_id || expenseType?.id;

    // FILTRAR APENAS CATEGORIAS VÁLIDAS PARA DESPESA
    const availableCategories = useMemo(() => {
        let list = categories ? [...categories] : [];

        if (tempCategory && !list.some((c: any) => (c.category_id || c.id) === tempCategory.id)) {
            list.push(tempCategory);
        }

        return list.filter((c: any) => {
            // Se for a categoria temporária que acabámos de criar, deixamos passar
            if (tempCategory && (c.category_id || c.id) === tempCategory.id) return true;

            const rts = c.record_types || c.recordTypes || [];
            if (rts.length > 0) {
                // Filtro estrito: Apenas se tiver 'expense' ou 'neutral'
                return rts.some((rt: any) => rt.kind === "expense" || rt.kind === "neutral")
            }
            return false 
        })
    }, [categories, tempCategory])

    // ==========================================
    // SEPARAR METAS E DÍVIDAS ATIVAS PARA O DROPDOWN
    // ==========================================
    const activeGoals = useMemo(() => {
        if (!installmentPlans) return []
        return installmentPlans.filter((p: any) =>
            (!p.description || !p.description.startsWith("[DEBT]")) &&
            p.status !== "paid" && p.status !== "cancelled"
        )
    }, [installmentPlans])

    const activeDebts = useMemo(() => {
        if (!installmentPlans) return []
        return installmentPlans.filter((p: any) =>
            p.description?.startsWith("[DEBT]") &&
            p.status !== "paid" && p.status !== "cancelled"
        )
    }, [installmentPlans])


    // ==========================================
    // 1. FILTRAR E CLASSIFICAR DESPESAS REAIS
    // ==========================================
    const expenses = useMemo(() => {
        if (!financialRecords || !recordTypes) return []

        return financialRecords.filter((record: any) => {
            const rtId = record.record_type_id || record.recordTypeId;
            return rtId === expenseTypeId;
        }).map((record: any) => {
            const catId = record.category_id || record.categoryId;
            const catObj = categories.find((c: any) => (c.category_id || c.id) === catId);

            const colorHex = catObj?.color?.codeColor || catObj?.color?.code_color || catObj?.color?.hex_code || "#C62828";
            const iconCode = catObj?.icon?.codeIcon || catObj?.icon?.code_icon || catObj?.icon?.name || "trending_down";

            const recordTags = record.tags || []
            let nature: ExpenseNature = "spontaneous"
            if (recordTags.some((t: any) => t.name?.toUpperCase() === "ESSENCIAL")) nature = "essential"
            if (recordTags.some((t: any) => t.name?.toUpperCase() === "SUBSCRIÇÃO")) nature = "subscription"

            return {
                id: record.financial_record_id || record.id,
                title: record.name,
                description: record.description,
                amount: Number(record.price || 0),
                categoryId: catId,
                categoryName: catObj?.name || "Sem Categoria",
                colorHex,
                iconCode,
                date: record.payment_date || record.paymentDate,
                nature,
                installmentPlanId: record.installment_plan_id || record.installmentPlanId
            }
        }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [financialRecords, recordTypes, categories, expenseTypeId])

    // ==========================================
    // 2. AGRUPAR DESPESAS POR CATEGORIA
    // ==========================================
    const expenseSources = useMemo(() => {
        const sources: Record<string, any> = {};
        expenses.forEach((exp: any) => {
            if (!sources[exp.categoryId]) {
                sources[exp.categoryId] = {
                    name: exp.categoryName,
                    colorHex: exp.colorHex,
                    iconCode: exp.iconCode,
                    total: 0
                }
            }
            sources[exp.categoryId].total += exp.amount;
        });
        return Object.values(sources).sort((a: any, b: any) => b.total - a.total);
    }, [expenses])

    // ==========================================
    // 3. MATEMÁTICA E TOTAIS
    // ==========================================
    const multiplier = viewMode === "annual" ? 12 : 1

    const essentialTotal = expenses.filter((e: any) => e.nature === "essential").reduce((acc: number, curr: any) => acc + curr.amount, 0) * multiplier
    const subscriptionTotal = expenses.filter((e: any) => e.nature === "subscription").reduce((acc: number, curr: any) => acc + curr.amount, 0) * multiplier
    const spontaneousTotal = expenses.filter((e: any) => e.nature === "spontaneous").reduce((acc: number, curr: any) => acc + curr.amount, 0) * multiplier

    const totalExpenses = essentialTotal + subscriptionTotal + spontaneousTotal

    const essentialPct = totalExpenses > 0 ? Math.round((essentialTotal / totalExpenses) * 100) : 0
    const subscriptionPct = totalExpenses > 0 ? Math.round((subscriptionTotal / totalExpenses) * 100) : 0
    const spontaneousPct = totalExpenses > 0 ? Math.max(0, 100 - essentialPct - subscriptionPct) : 0

    // ==========================================
    // FUNÇÕES DE ACÇÃO
    // ==========================================
    async function handleAddExpense(e: React.FormEvent) {
        e.preventDefault()
        const parsedAmount = parseFloat(newAmount)
        if (!newTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return
        if (!newCategoryId || !newPaymentMethodId) return toast.error("Seleciona a Categoria e a Conta!")
        if (!activeDashboard?.dashboard_id) return toast.error("Sem dashboard ativo.")

        setIsSubmitting(true)
        try {
            const tagNameMap = { "essential": "Essencial", "subscription": "Subscrição", "spontaneous": "Espontânea" }
            const targetTagName = tagNameMap[newNature]

            let targetTag = tags.find((t: any) => t.name?.toUpperCase() === targetTagName.toUpperCase())
            if (!targetTag) {
                const tagRes = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/tags`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ name: targetTagName, description: `Tag ${targetTagName}` })
                })
                if (tagRes.ok) {
                    const tagData = await tagRes.json()
                    targetTag = tagData.data || tagData
                }
            }

            const tagId = targetTag?.tag_id || targetTag?.id

            await addFinancialRecord({
                name: newTitle,
                description: newDescription.trim() || undefined,
                price: parsedAmount,
                recordTypeName: "EXPENSE",
                recordTypeId: expenseTypeId,
                categoryId: newCategoryId,
                paymentMethodId: newPaymentMethodId,
                paymentDate: new Date(newDate).toISOString(),
                tagIds: tagId ? [tagId] : [],
                installmentPlanId: newInstallmentPlanId || null // A Magia da Associação
            })

            toast.success(`Despesa adicionada com sucesso!`)
            setNewTitle(""); setNewAmount(""); setNewDescription("");
            setNewDate(new Date().toISOString().split('T')[0]);
            setNewCategoryId(""); setNewPaymentMethodId(""); setNewInstallmentPlanId("");
            setIsAdding(false)
        } catch (error: any) {
            toast.error(error.message || "Erro ao gravar despesa.")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Eliminar esta despesa?")) return
        try {
            await fetch(`/api/v1/dashboards/${activeDashboard?.dashboard_id}/financial-records/${id}`, { method: "DELETE", credentials: "include" })
            refresh()
            toast.success("Despesa eliminada.")
        } catch (error) {
            toast.error("Erro ao eliminar.")
        }
    }

    async function handleDeleteCategory(categoryId: string) {
        if (!confirm("Queres eliminar esta categoria?")) return
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
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins">

            <CreateCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                recordTypeId={expenseTypeId}
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">Despesas e Gastos</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">Controla a tua estrutura de custos de forma detalhada.</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
                        <button type="button" onClick={() => setViewMode("monthly")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "monthly" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-muted-foreground hover:text-slate-900"}`}>Mensal</button>
                        <button type="button" onClick={() => setViewMode("annual")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "annual" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-muted-foreground hover:text-slate-900"}`}>Anual</button>
                    </div>
                    <button type="button" onClick={() => setIsAdding((prev) => !prev)} className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>Registar Gasto</span>
                    </button>
                </div>
            </div>

            {isAdding && (
                <Card className="border-rose-200 dark:border-rose-800/60 bg-rose-50/30 dark:bg-rose-950/10 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold">Registar Saída de Dinheiro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">O que compraste?</label>
                                <input type="text" placeholder="Ex: Combustível, Jantar, Luz..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm" required />
                            </div>

                            {/* NOVO CAMPO: Associação a Metas / Dívidas */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Associar a Objetivo ou Dívida (Opcional)</label>
                                <select
                                    value={newInstallmentPlanId}
                                    onChange={(e) => setNewInstallmentPlanId(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs"
                                >
                                    <option value="">Nenhum (Gasto normal)</option>

                                    {activeGoals.length > 0 && (
                                        <optgroup label="🎯 Depositar em Meta / Poupança">
                                            {activeGoals.map((g: any) => {
                                                const gId = g.installment_plan_id || g.id
                                                return <option key={gId} value={gId}>{g.name}</option>
                                            })}
                                        </optgroup>
                                    )}

                                    {activeDebts.length > 0 && (
                                        <optgroup label="💳 Abater em Crédito / Dívida">
                                            {activeDebts.map((d: any) => {
                                                const dId = d.installment_plan_id || d.id
                                                return <option key={dId} value={dId}>{d.name}</option>
                                            })}
                                        </optgroup>
                                    )}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Valor (€)</label>
                                <input type="number" step="0.01" placeholder="0.00" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm" required />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Data</label>
                                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm" required />
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                                <div className="flex gap-1 h-9">
                                    <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} className="h-full flex-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs" required>
                                        <option value="" disabled>Selecionar...</option>
                                        {availableCategories.map((c: any) => {
                                            const catId = c.category_id || c.id
                                            return <option key={catId} value={catId}>{c.name}</option>
                                        })}
                                    </select>
                                    {newCategoryId && (
                                        <button type="button" onClick={() => handleDeleteCategory(newCategoryId)} className="h-full aspect-square bg-red-50 text-red-500 rounded-md flex items-center justify-center border border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900/50 cursor-pointer" title="Apagar Categoria">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="h-full aspect-square bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-center hover:bg-slate-200 cursor-pointer text-slate-500" title="Nova Categoria">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Pago por</label>
                                <select value={newPaymentMethodId} onChange={(e) => setNewPaymentMethodId(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs" required>
                                    <option value="" disabled>Conta...</option>
                                    {paymentMethods.map((p: any) => {
                                        const payId = p.payment_method_id || p.id
                                        return <option key={payId} value={payId}>{p.name}</option>
                                    })}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Notas Adicionais (Opcional)</label>
                                <input type="text" placeholder="Ex: Compra do mês, Dividido..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm" />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 md:col-span-6 mt-2 items-center justify-between border-t border-rose-100 dark:border-rose-900/50 pt-3">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <label className="text-xs font-medium text-muted-foreground">Classificação (50/30/20):</label>
                                    <select value={newNature} onChange={(e) => setNewNature(e.target.value as ExpenseNature)} className="h-8 flex-1 sm:flex-none rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs cursor-pointer">
                                        <option value="spontaneous">🛍️ Espontânea / Impulso</option>
                                        <option value="essential">🏠 Essencial / Fixa</option>
                                        <option value="subscription">🔄 Subscrição Mensal</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto justify-end">
                                    <button type="button" onClick={() => setIsAdding(false)} className="h-9 px-4 bg-slate-200/70 text-slate-700 text-xs rounded-md hover:bg-slate-300/70 cursor-pointer">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting} className="h-9 px-6 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-md cursor-pointer disabled:opacity-50">
                                        {isSubmitting ? "A gravar..." : "Guardar Gasto"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-md">
                                <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            </div>
                            Gasto Total {viewMode === "monthly" ? "Mensal" : "Anual"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold @[220px]:text-2xl @[320px]:text-3xl text-slate-900 dark:text-slate-100">
                            € {totalExpenses.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                                <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            Fugas de Orçamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1.5 my-auto">
                        <div className="text-xl font-bold @[220px]:text-xl @[320px]:text-2xl text-slate-900 dark:text-slate-100">
                            € {(spontaneousTotal + subscriptionTotal).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>Impulsos: € {spontaneousTotal.toLocaleString("pt-PT")}</span>
                            <span>•</span>
                            <span>Subscrições: € {subscriptionTotal.toLocaleString("pt-PT")}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                                <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            Classificação (50/30/20)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col justify-center gap-2.5 my-auto">
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div style={{ width: `${essentialPct}%` }} className="bg-blue-500 h-full transition-all duration-500" title="Essenciais" />
                            <div style={{ width: `${subscriptionPct}%` }} className="bg-purple-500 h-full transition-all duration-500" title="Subscrições" />
                            <div style={{ width: `${spontaneousPct}%` }} className="bg-rose-500 h-full transition-all duration-500" title="Espontâneas" />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Fixas ({essentialPct}%)</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Subscr. ({subscriptionPct}%)</span>
                            <span className="flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-500" /> Impulso ({spontaneousPct}%)</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-5 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            Distribuição de Gastos
                        </CardTitle>
                        <CardDescription className="text-xs">Para onde está a ir o teu dinheiro.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {expenseSources.length === 0 ? (
                            <div className="text-center text-sm py-4 text-muted-foreground">Nenhuma categoria registada.</div>
                        ) : expenseSources.map((source: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 dark:bg-slate-900/30 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${source.colorHex}25`, color: source.colorHex }}>
                                        <DynamicIcon name={source.iconCode} className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{source.name}</p>
                                </div>
                                <span className="text-sm font-bold" style={{ color: source.colorHex }}>
                                    € {source.total.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                Histórico de Despesas
                            </CardTitle>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {expenses.length} movimentos
                        </span>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                        {expenses.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Sem despesas registadas.</p>}
                        {expenses.map((item: any) => {
                            return (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-md shrink-0" style={{ backgroundColor: `${item.colorHex}25`, color: item.colorHex }}>
                                            <DynamicIcon name={item.iconCode} className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                                                {item.nature === "spontaneous" ? (
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-0.5 border border-rose-200/50 dark:border-rose-900/50">
                                                        <AlertCircle className="w-2.5 h-2.5" /> Espontânea
                                                    </span>
                                                ) : item.nature === "essential" ? (
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center gap-0.5 border border-blue-200/50 dark:border-blue-900/50">
                                                        <Home className="w-2.5 h-2.5" /> Essencial
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center gap-0.5 border border-purple-200/50 dark:border-purple-900/50">
                                                        <Repeat className="w-2.5 h-2.5" /> Subscrição
                                                    </span>
                                                )}

                                                {/* ETIQUETA VISUAL NO HISTÓRICO SE TIVER META/DÍVIDA ASSOCIADA */}
                                                {item.installmentPlanId && (
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                        🎯 Foco/Dívida
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <span className="font-medium" style={{ color: item.colorHex }}>{item.categoryName}</span>
                                                <span>•</span>
                                                {item.date ? new Date(item.date).toLocaleDateString("pt-PT") : ""}
                                                {item.description && <span className="ml-1 opacity-70 italic truncate max-w-[120px] sm:max-w-[150px]">{item.description}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400">
                                            € {item.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                        </span>
                                        <button type="button" onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
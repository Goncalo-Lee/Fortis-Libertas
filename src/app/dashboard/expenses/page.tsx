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
    Home,
    ShoppingBag,
    Repeat,
    Plus,
    Calendar,
    TrendingDown,
    ArrowDownRight,
    PieChart,
    History,
    Trash2,
    AlertCircle,
    Flame,
    Check,
    X
} from "lucide-react"

import { toast } from "sonner"
import { useDashboard } from "@/contexts/DashboardContext"
import { useFinancial } from "@/contexts/FinancialContext"

type ExpenseNature = "essential" | "subscription" | "spontaneous"

export default function ExpensesPage() {
    const { activeDashboard } = useDashboard()
    const { financialRecords, recordTypes, categories, paymentMethods, tags, addFinancialRecord, refresh } = useFinancial()

    const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly")

    // Controlo do formulário
    const [isAdding, setIsAdding] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newAmount, setNewAmount] = useState("")
    const [newCategoryId, setNewCategoryId] = useState("")
    const [newPaymentMethodId, setNewPaymentMethodId] = useState("")
    const [newNature, setNewNature] = useState<ExpenseNature>("spontaneous")

    // Controlo da criação rápida de Categoria
    const [isAddingCategory, setIsAddingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [isSubmittingCategory, setIsSubmittingCategory] = useState(false)

    // ==========================================
    // 1. FILTRAR E CLASSIFICAR DESPESAS REAIS
    // ==========================================
    const expenses = useMemo(() => {
        if (!financialRecords || !recordTypes) return []

        return financialRecords.filter((record: any) => {
            let typeName = record.recordType?.name || ""
            if (!typeName) {
                const typeId = record.recordTypeId || record.record_type_id
                const rt = recordTypes.find((t: any) => t.id === typeId)
                if (rt) typeName = rt.name
            }
            return typeName.toUpperCase() === "EXPENSE"
        }).map((record: any) => {
            const catId = record.category?.id || record.categoryId || record.category_id
            const categoryObj = categories.find((c: any) => c.id === catId)

            // LER A TAG PARA SABER A NATUREZA (Espontânea, Essencial, Subscrição)
            const recordTags = record.tags || []
            let nature: ExpenseNature = "spontaneous"
            if (recordTags.some((t: any) => t.name.toUpperCase() === "ESSENCIAL")) nature = "essential"
            if (recordTags.some((t: any) => t.name.toUpperCase() === "SUBSCRIÇÃO")) nature = "subscription"

            return {
                id: record.id,
                title: record.name,
                amount: Number(record.price || 0),
                categoryId: catId,
                categoryName: categoryObj?.name || "Sem Categoria",
                date: record.paymentDate || record.payment_date,
                nature,
            }
        })
    }, [financialRecords, recordTypes, categories])

    // ==========================================
    // 2. MATEMÁTICA E TOTAIS
    // ==========================================
    const multiplier = viewMode === "annual" ? 12 : 1

    const essentialTotal = expenses.filter((e: any) => e.nature === "essential").reduce((acc: number, curr: any) => acc + curr.amount, 0) * multiplier
    const subscriptionTotal = expenses.filter((e: any) => e.nature === "subscription").reduce((acc: number, curr: any) => acc + curr.amount, 0) * multiplier
    const spontaneousTotal = expenses.filter((e: any) => e.nature === "spontaneous").reduce((acc: number, curr: any) => acc + curr.amount, 0) // Espontâneas não multiplicam no ano

    const totalExpenses = essentialTotal + subscriptionTotal + spontaneousTotal

    const essentialPct = totalExpenses > 0 ? Math.round((essentialTotal / totalExpenses) * 100) : 0
    const subscriptionPct = totalExpenses > 0 ? Math.round((subscriptionTotal / totalExpenses) * 100) : 0
    const spontaneousPct = totalExpenses > 0 ? Math.max(0, 100 - essentialPct - subscriptionPct) : 0

    // ==========================================
    // FUNÇÕES DE API (Categorias e Despesas)
    // ==========================================
    async function handleCreateCategory() {
        if (!newCategoryName.trim()) return
        if (categories.length >= 20) return toast.error("Limite de 20 categorias atingido.")

        setIsSubmittingCategory(true)
        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/categories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCategoryName.trim() })
            })
            if (!res.ok) throw new Error("Erro")
            refresh()
            toast.success("Categoria criada!")
            setNewCategoryName("")
            setIsAddingCategory(false)
        } catch (error) {
            toast.error("Não foi possível criar a categoria.")
        } finally {
            setIsSubmittingCategory(false)
        }
    }

    async function handleDeleteCategory(categoryId: string) {
        if (!confirm("Queres eliminar esta categoria?")) return
        setIsSubmittingCategory(true)
        try {
            await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/categories/${categoryId}`, { method: "DELETE" })
            refresh()
            toast.success("Categoria eliminada.")
            if (newCategoryId === categoryId) setNewCategoryId("")
        } catch (error) {
            toast.error("Erro ao eliminar a categoria.")
        } finally {
            setIsSubmittingCategory(false)
        }
    }

    async function handleAddExpense(e: React.FormEvent) {
        e.preventDefault()
        const parsedAmount = parseFloat(newAmount)
        if (!newTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return
        if (!newCategoryId || !newPaymentMethodId) return toast.error("Seleciona a Categoria e a Conta de Pagamento!")

        setIsSubmitting(true)
        try {
            // Mapeia a Natureza (UI) para uma Tag real (BD)
            const tagNameMap = { "essential": "Essencial", "subscription": "Subscrição", "spontaneous": "Espontânea" }
            const targetTagName = tagNameMap[newNature]

            let targetTag = tags.find((t: any) => t.name.toUpperCase() === targetTagName.toUpperCase())
            if (!targetTag) {
                const tagRes = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/tags`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: targetTagName })
                })
                if (tagRes.ok) {
                    const tagData = await tagRes.json()
                    targetTag = tagData.data || tagData
                }
            }

            await addFinancialRecord({
                name: newTitle,
                price: parsedAmount,
                recordTypeName: "EXPENSE",
                categoryId: newCategoryId,
                paymentMethodId: newPaymentMethodId,
                tagIds: targetTag ? [targetTag.id] : []
            })

            toast.success(`Despesa "${newTitle}" adicionada!`)
            setNewTitle("")
            setNewAmount("")
            setNewCategoryId("")
            setNewPaymentMethodId("")
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
            await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/financial-records/${id}`, { method: "DELETE" })
            refresh()
            toast.success("Despesa eliminada.")
        } catch (error) {
            toast.error("Erro ao eliminar.")
        }
    }

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">Despesas e Gastos</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">Controla os teus custos fixos, subscrições e compras espontâneas.</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
                        <button type="button" onClick={() => setViewMode("monthly")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "monthly" ? "bg-white dark:bg-slate-900 text-slate-900 shadow-xs" : "text-muted-foreground"}`}>Mensal</button>
                        <button type="button" onClick={() => setViewMode("annual")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "annual" ? "bg-white dark:bg-slate-900 text-slate-900 shadow-xs" : "text-muted-foreground"}`}>Impacto Anual</button>
                    </div>
                    <button type="button" onClick={() => setIsAdding((prev) => !prev)} className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>Registar Gasto</span>
                    </button>
                </div>
            </div>

            {isAdding && (
                <Card className="border-rose-200 dark:border-rose-800/60 bg-rose-50/30 dark:bg-rose-950/10 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold">Registar Saída de Dinheiro</CardTitle>
                        <CardDescription className="text-xs">Associa a uma categoria e ao método de pagamento.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                                <input type="text" placeholder="Ex: Renda, Netflix..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm" required />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Valor (€)</label>
                                <input type="number" step="0.01" placeholder="0.00" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm" required />
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                                {isAddingCategory ? (
                                    <div className="flex items-center gap-1 h-9">
                                        <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="h-full w-full rounded-md border border-rose-300 dark:border-rose-700 bg-white px-2 text-xs" autoFocus />
                                        <button type="button" onClick={handleCreateCategory} disabled={isSubmittingCategory} className="h-full aspect-square bg-rose-600 text-white rounded-md flex items-center justify-center"><Check className="w-4 h-4" /></button>
                                        <button type="button" onClick={() => setIsAddingCategory(false)} className="h-full aspect-square bg-slate-200 text-slate-600 rounded-md flex items-center justify-center"><X className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <div className="flex gap-1 h-9">
                                        <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} className="h-full flex-1 rounded-md border border-slate-200 bg-white px-3 text-xs" required={!isAddingCategory}>
                                            <option value="" disabled>Selecionar...</option>
                                            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        {newCategoryId && (
                                            <button type="button" onClick={() => handleDeleteCategory(newCategoryId)} disabled={isSubmittingCategory} className="h-full aspect-square bg-red-50 text-red-500 rounded-md flex items-center justify-center border border-red-200 hover:bg-red-100">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button type="button" onClick={() => setIsAddingCategory(true)} className="h-full aspect-square bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center">
                                            <Plus className="w-4 h-4 text-slate-500" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Pago por</label>
                                <select value={newPaymentMethodId} onChange={(e) => setNewPaymentMethodId(e.target.value)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs" required>
                                    <option value="" disabled>Conta...</option>
                                    {paymentMethods.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            {/* SELECTOR DE NATUREZA / TAG (Espontânea vs Fixa) */}
                            <div className="flex flex-col sm:flex-row gap-3 md:col-span-6 mt-2 items-center justify-between border-t border-rose-100 dark:border-rose-900/50 pt-3">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-muted-foreground">Classificação:</label>
                                    <select value={newNature} onChange={(e) => setNewNature(e.target.value as ExpenseNature)} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs">
                                        <option value="spontaneous">🛍️ Espontânea / Impulso</option>
                                        <option value="essential">🏠 Essencial Fixa</option>
                                        <option value="subscription">🔄 Subscrição Mensal</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto justify-end">
                                    <button type="button" onClick={() => setIsAdding(false)} className="h-9 px-4 bg-slate-200/70 text-slate-700 text-xs rounded-md hover:bg-slate-300/70">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting || isAddingCategory} className="h-9 px-6 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-md">
                                        {isSubmitting ? "..." : "Guardar Gasto"}
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
                        <span className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            € {spontaneousTotal.toLocaleString("pt-PT")} em gastos espontâneos
                        </span>
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
                            Relatório de Despesas
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
                            <Home className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            Estrutura de Gastos
                        </CardTitle>
                        <CardDescription className="text-xs">Percebe onde podes cortar caso precises de poupar mais.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg"><Home className="w-4 h-4 text-blue-600" /></div>
                                <div><p className="text-sm font-semibold text-slate-900">Essenciais e Habitação</p><p className="text-xs text-muted-foreground">Custos obrigatórios</p></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900">€ {essentialTotal.toLocaleString("pt-PT")}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg"><Repeat className="w-4 h-4 text-purple-600" /></div>
                                <div><p className="text-sm font-semibold text-slate-900">Subscrições e Serviços</p><p className="text-xs text-muted-foreground">Débitos automáticos</p></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900">€ {subscriptionTotal.toLocaleString("pt-PT")}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-rose-200/60 bg-rose-50/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-100 rounded-lg"><ShoppingBag className="w-4 h-4 text-rose-600" /></div>
                                <div><p className="text-sm font-semibold text-slate-900">Despesas Espontâneas</p><p className="text-xs text-rose-700">Onde é mais fácil reduzir</p></div>
                            </div>
                            <span className="text-sm font-bold text-rose-600">€ {spontaneousTotal.toLocaleString("pt-PT")}</span>
                        </div>
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
                        {expenses.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-md ${item.nature === "essential" ? "bg-blue-100 text-blue-600" : item.nature === "subscription" ? "bg-purple-100 text-purple-600" : "bg-rose-100 text-rose-600"}`}>
                                        {item.nature === "essential" && <Home className="w-4 h-4" />}
                                        {item.nature === "subscription" && <Repeat className="w-4 h-4" />}
                                        {item.nature === "spontaneous" && <ShoppingBag className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-slate-900">{item.title}</p>
                                            {item.nature === "spontaneous" ? (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 flex items-center gap-1 border border-rose-200/50">
                                                    <AlertCircle className="w-2.5 h-2.5" /> Espontânea
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Recorrente</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            {item.categoryName} • {item.date ? new Date(item.date).toLocaleDateString("pt-PT") : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm sm:text-base font-bold text-rose-600">
                                        € {item.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                    </span>
                                    <button type="button" onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
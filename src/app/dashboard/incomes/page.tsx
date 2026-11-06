"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar, TrendingUp, PieChart, History, Trash2, ArrowUpRight, Check, Target } from "lucide-react"
import { toast } from "sonner"
import { useFinancial } from "@/contexts/FinancialContext"
import { useDashboard } from "@/contexts/DashboardContext"
import { CreateCategoryModal } from "@/components/CreateCategoryModal"
import { DynamicIcon } from "@/components/DynamicIcon"

export default function IncomesPage() {
    const { activeDashboard } = useDashboard()
    const { financialRecords, recordTypes, categories, paymentMethods, installmentPlans, refresh, addFinancialRecord } = useFinancial()

    const [isAdding, setIsAdding] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newAmount, setNewAmount] = useState("")
    const [newDescription, setNewDescription] = useState("")
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
    const [newCategoryId, setNewCategoryId] = useState("")
    const [newPaymentMethodId, setNewPaymentMethodId] = useState("")
    const [newInstallmentPlanId, setNewInstallmentPlanId] = useState("") // NOVO: Associação a Meta/Objetivo

    // Estado do Modal
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [tempCategory, setTempCategory] = useState<any>(null)

    // IDENTIFICAR TIPO INCOME
    const incomeType = useMemo(() => {
        if (!recordTypes) return null
        return recordTypes.find((rt: any) =>
            rt.kind === "income" || (rt.name || "").toLowerCase().includes("receita") || (rt.name || "").toLowerCase().includes("income")
        )
    }, [recordTypes])

    const incomeTypeId = incomeType?.record_type_id || incomeType?.id;

    // FILTRAR APENAS CATEGORIAS VÁLIDAS PARA RECEITA
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
                // Filtro estrito: Apenas se tiver 'income' ou 'neutral'
                return rts.some((rt: any) => rt.kind === "income" || rt.kind === "neutral")
            }
            return false
        })
    }, [categories, tempCategory])

    // APENAS METAS PARA ASSOCIAR A RECEITAS (Exclui dívidas que começam com [DEBT])
    const availableGoals = useMemo(() => {
        if (!installmentPlans) return []
        return installmentPlans.filter((p: any) => {
            const isDebt = p.description && p.description.startsWith("[DEBT]")
            return !isDebt && p.status !== "paid" && p.status !== "cancelled"
        })
    }, [installmentPlans])

    // ==========================================
    // 1. FILTRAR E MAPEAR RENDIMENTOS
    // ==========================================
    const incomes = useMemo(() => {
        if (!financialRecords || !recordTypes) return []

        return financialRecords.filter((record: any) => {
            const rtId = record.record_type_id || record.recordTypeId;
            return rtId === incomeTypeId;
        }).map((record: any) => {
            const catId = record.category_id || record.categoryId;
            const catObj = categories.find((c: any) => (c.category_id || c.id) === catId);

            const colorHex = catObj?.color?.codeColor || catObj?.color?.code_color || catObj?.color?.hex_code || "#10b981";
            const iconCode = catObj?.icon?.codeIcon || catObj?.icon?.code_icon || catObj?.icon?.name || "category";

            return {
                id: record.financial_record_id || record.id,
                title: record.name,
                description: record.description,
                amount: Number(record.price || 0),
                categoryId: catId,
                categoryName: catObj?.name || "Geral",
                colorHex,
                iconCode,
                date: record.payment_date || record.paymentDate,
                installmentPlanId: record.installment_plan_id || record.installmentPlanId
            }
        }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [financialRecords, recordTypes, categories, incomeTypeId])

    const totalIncome = incomes.reduce((acc: number, curr: any) => acc + curr.amount, 0)

    // ==========================================
    // 2. AGRUPAR RENDIMENTOS POR CATEGORIA
    // ==========================================
    const incomeSources = useMemo(() => {
        const sources: Record<string, any> = {};
        incomes.forEach((inc: any) => {
            if (!sources[inc.categoryId]) {
                sources[inc.categoryId] = {
                    name: inc.categoryName,
                    colorHex: inc.colorHex,
                    iconCode: inc.iconCode,
                    total: 0
                }
            }
            sources[inc.categoryId].total += inc.amount;
        });
        return Object.values(sources).sort((a: any, b: any) => b.total - a.total);
    }, [incomes])

    // =====================================
    // FUNÇÕES DE ACÇÃO
    // =====================================
    async function handleAddIncome(e: React.FormEvent) {
        e.preventDefault()
        const parsedAmount = parseFloat(newAmount)
        if (!newTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return
        if (!newCategoryId || !newPaymentMethodId) return toast.error("Seleciona a Categoria e a Conta de Recebimento!")

        setIsSubmitting(true)
        try {
            await addFinancialRecord({
                name: newTitle,
                description: newDescription.trim() || undefined,
                price: parsedAmount,
                recordTypeName: "INCOME",
                recordTypeId: incomeTypeId,
                categoryId: newCategoryId,
                paymentMethodId: newPaymentMethodId,
                paymentDate: new Date(newDate).toISOString(),
                installmentPlanId: newInstallmentPlanId || null // <--- O CAMPO EXTRA QUE ENVIA A LIGAÇÃO À META!
            })
            toast.success(`Ganho adicionado com sucesso!`)
            setNewTitle(""); setNewAmount(""); setNewDescription("");
            setNewDate(new Date().toISOString().split('T')[0]);
            setNewCategoryId(""); setNewPaymentMethodId(""); setNewInstallmentPlanId("");
            setIsAdding(false)
        } catch (error: any) {
            toast.error(error.message || "Ocorreu um erro ao gravar a receita.")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Tens a certeza que queres eliminar este registo?")) return
        if (!activeDashboard?.dashboard_id) return
        try {
            await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/financial-records/${id}`, { method: "DELETE", credentials: "include" })
            refresh()
            toast.success("Registo eliminado.")
        } catch (error) {
            toast.error("Erro ao eliminar o registo.")
        }
    }

    async function handleDeleteCategory(categoryId: string) {
        if (!confirm("Tens a certeza que queres eliminar esta categoria?")) return
        try {
            await fetch(`/api/v1/dashboards/${activeDashboard?.dashboard_id}/categories/${categoryId}`, { method: "DELETE", credentials: "include" })
            refresh()
            toast.success("Categoria eliminada.")
            if (newCategoryId === categoryId) setNewCategoryId("")
        } catch (error) {
            toast.error("Não foi possível eliminar.")
        }
    }

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins">

            <CreateCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                recordTypeId={incomeTypeId}
                typeLabel="Receita"
                onSuccess={(id, name, kind) => {
                    const newCat = { 
                        id, 
                        category_id: id, 
                        name, 
                        record_types: [{ kind: kind || "income" }] 
                    };
                    setTempCategory(newCat);
                    setNewCategoryId(id);
                }}
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">Rendimentos e Ganhos</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">Controla as tuas fontes de dinheiro com precisão.</p>
                </div>
                <button type="button" onClick={() => setIsAdding((prev) => !prev)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs cursor-pointer">
                    <Plus className="w-4 h-4" /> <span>Novo Ganho</span>
                </button>
            </div>

            {isAdding && (
                <Card className="border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold">Registar Entrada de Dinheiro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddIncome} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Descrição / Título</label>
                                <input type="text" placeholder="Ex: Salário, Projeto Extra..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm" required />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Valor (€)</label>
                                <input type="number" step="0.01" placeholder="0.00" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm" required />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Data</label>
                                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm" required />
                            </div>

                            <div className="flex flex-col gap-1">
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
                                        <button type="button" onClick={() => handleDeleteCategory(newCategoryId)} className="h-full aspect-square bg-red-50 text-red-500 rounded-md flex items-center justify-center hover:bg-red-100 dark:bg-red-950/30 cursor-pointer border border-red-100 dark:border-red-900/50" title="Apagar Categoria">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="h-full aspect-square bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-center hover:bg-slate-200 cursor-pointer text-slate-500" title="Criar Nova Categoria">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Recebido em</label>
                                <select value={newPaymentMethodId} onChange={(e) => setNewPaymentMethodId(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs" required>
                                    <option value="" disabled>Escolhe a conta...</option>
                                    {paymentMethods.map((p: any) => {
                                        const payId = p.payment_method_id || p.id
                                        return <option key={payId} value={payId}>{p.name}</option>
                                    })}
                                </select>
                            </div>

                            {/* NOVO CAMPO: ASSOCIAR A UMA META */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Associar a Objetivo / Meta (Opcional)</label>
                                <select value={newInstallmentPlanId} onChange={(e) => setNewInstallmentPlanId(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs">
                                    <option value="">Nenhum (Receita normal)</option>
                                    {availableGoals.map((g: any) => {
                                        const gId = g.installment_plan_id || g.id
                                        return <option key={gId} value={gId}>🎯 {g.name}</option>
                                    })}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Notas Adicionais (Opcional)</label>
                                <input type="text" placeholder="Detalhes extra..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm" />
                            </div>

                            <div className="flex gap-2 md:col-span-2 justify-end">
                                <button type="button" onClick={() => setIsAdding(false)} className="h-9 px-4 bg-slate-200/70 text-slate-700 text-xs rounded-md hover:bg-slate-300/70 cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md cursor-pointer disabled:opacity-50">{isSubmitting ? "A gravar..." : "Guardar Ganho"}</button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" /> Total Acumulado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">€ {totalIncome.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>

                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <Target className="w-4 h-4 text-amber-600" /> Regra 50/30/20 Ideal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col justify-center gap-2 my-auto">
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-md border border-slate-100 dark:border-slate-800">
                                <span className="block text-[10px] text-muted-foreground">50% Essencial</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">€ {Math.round(totalIncome * 0.5).toLocaleString("pt-PT")}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-md border border-slate-100 dark:border-slate-800">
                                <span className="block text-[10px] text-muted-foreground">30% Lazer</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">€ {Math.round(totalIncome * 0.3).toLocaleString("pt-PT")}</span>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/40">
                                <span className="block text-[10px] text-emerald-700 dark:text-emerald-400">20% Poupar</span>
                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">€ {Math.round(totalIncome * 0.2).toLocaleString("pt-PT")}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-5 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-slate-600 dark:text-slate-400" /> Fontes de Rendimento
                        </CardTitle>
                        <CardDescription className="text-xs">Distribuição das tuas receitas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {incomeSources.length === 0 ? (
                            <div className="text-center text-sm py-4 text-muted-foreground">Nenhuma fonte registada.</div>
                        ) : incomeSources.map((source: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${source.colorHex}25`, color: source.colorHex }}>
                                        <DynamicIcon name={source.iconCode} className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-semibold">{source.name}</p>
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
                            <CardTitle className="text-base font-semibold flex items-center gap-2"><History className="w-4 h-4 text-slate-600 dark:text-slate-400" /> Histórico</CardTitle>
                        </div>
                        <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{incomes.length} registos</span>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                        {incomes.length === 0 ? (
                            <div className="text-center text-sm py-10 text-muted-foreground">Sem rendimentos.</div>
                        ) : incomes.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-md" style={{ backgroundColor: `${item.colorHex}25`, color: item.colorHex }}>
                                        <DynamicIcon name={item.iconCode} className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium flex items-center gap-2">
                                            {item.title}
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: `${item.colorHex}15`, color: item.colorHex }}>
                                                {item.categoryName}
                                            </span>
                                            {item.installmentPlanId && (
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-sm font-medium">🎯 Associado a Meta</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Calendar className="w-3 h-3" /> {item.date ? new Date(item.date).toLocaleDateString("pt-PT") : "Sem data"}
                                            {item.description && <span className="ml-1 truncate max-w-[120px] sm:max-w-[200px]">{item.description}</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-sm sm:text-base font-bold" style={{ color: item.colorHex }}>
                                        + € {item.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                    </span>
                                    <button type="button" onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
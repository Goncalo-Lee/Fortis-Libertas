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
    Briefcase,
    CreditCard,
    Sparkles,
    Plus,
    Calendar,
    TrendingUp,
    ArrowUpRight,
    PieChart,
    History,
    Trash2,
    Check,
    X
} from "lucide-react"

import { toast } from "sonner"
import { useFinancial } from "@/contexts/FinancialContext"
import { useDashboard } from "@/contexts/DashboardContext"

export default function IncomesPage() {
    const { activeDashboard } = useDashboard()
    const { financialRecords, recordTypes, categories, paymentMethods, refresh, addFinancialRecord } = useFinancial()

    const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly")

    // Controlo do formulário
    const [isAdding, setIsAdding] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newAmount, setNewAmount] = useState("")
    const [newCategoryId, setNewCategoryId] = useState("")
    const [newPaymentMethodId, setNewPaymentMethodId] = useState("")

    // Controlo da criação/eliminação de Categoria
    const [isAddingCategory, setIsAddingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [isSubmittingCategory, setIsSubmittingCategory] = useState(false)

    // 1. FILTRAR AS RECEITAS REAIS DA BD
    const incomes = useMemo(() => {
        if (!financialRecords || !recordTypes) return []

        return financialRecords.filter((record: any) => {
            let typeName = record.recordType?.name || ""
            if (!typeName) {
                const typeId = record.recordTypeId || record.record_type_id
                const rt = recordTypes.find((t: any) => t.id === typeId)
                if (rt) typeName = rt.name
            }
            return typeName.toUpperCase() === "INCOME"
        }).map((record: any) => {
            const catId = record.categoryId || record.category_id
            const categoryObj = categories.find((c: any) => c.id === catId)
            const searchName = (categoryObj?.name || record.name).toLowerCase()

            let uiCategory = "extra"
            if (searchName.includes("refeição") || searchName.includes("meal") || searchName.includes("alimentação")) {
                uiCategory = "meal_card"
            } else if (searchName.includes("salário") || searchName.includes("vencimento") || searchName.includes("fixo") || searchName.includes("ordenado")) {
                uiCategory = "fixed"
            }

            return {
                id: record.id,
                title: record.name,
                amount: Number(record.price || 0),
                category: uiCategory,
                date: record.paymentDate || record.payment_date,
                recurring: uiCategory !== "extra",
            }
        })
    }, [financialRecords, recordTypes, categories])

    const multiplier = viewMode === "annual" ? 12 : 1
    const fixedTotal = incomes.filter((i: any) => i.category === "fixed").reduce((acc: number, curr: any) => acc + curr.amount, 0) * multiplier
    const mealCardTotal = incomes.filter((i: any) => i.category === "meal_card").reduce((acc: number, curr: any) => acc + curr.amount, 0) * multiplier
    const extraTotal = incomes.filter((i: any) => i.category === "extra").reduce((acc: number, curr: any) => acc + curr.amount, 0)
    const totalIncome = fixedTotal + mealCardTotal + extraTotal
    const fixedPercentage = totalIncome > 0 ? Math.round(((fixedTotal + mealCardTotal) / totalIncome) * 100) : 0
    const extraPercentage = totalIncome > 0 ? 100 - fixedPercentage : 0


    // 2. FUNÇÃO PARA CRIAR NOVA CATEGORIA
    async function handleCreateCategory() {
        if (!newCategoryName.trim()) return
        setIsSubmittingCategory(true)

        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/categories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCategoryName.trim() })
            })

            if (!res.ok) throw new Error("Erro ao criar categoria")

            refresh()
            toast.success(`Categoria "${newCategoryName}" criada!`)
            setNewCategoryName("")
            setIsAddingCategory(false)
        } catch (error) {
            console.error(error)
            toast.error("Não foi possível criar a categoria.")
        } finally {
            setIsSubmittingCategory(false)
        }
    }

    // 2.1 FUNÇÃO PARA APAGAR CATEGORIA
    async function handleDeleteCategory(categoryId: string) {
        if (!confirm("Tens a certeza que queres eliminar esta categoria? Os registos associados a ela poderão ficar sem categoria.")) return

        setIsSubmittingCategory(true)
        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/categories/${categoryId}`, {
                method: "DELETE"
            })

            if (!res.ok) throw new Error("Erro ao apagar categoria")

            refresh()
            toast.success("Categoria eliminada com sucesso.")

            // Se a categoria apagada era a que estava selecionada, limpa a seleção
            if (newCategoryId === categoryId) {
                setNewCategoryId("")
            }
        } catch (error) {
            console.error(error)
            toast.error("Não foi possível eliminar a categoria.")
        } finally {
            setIsSubmittingCategory(false)
        }
    }

    // 3. FUNÇÃO PARA GUARDAR A RECEITA (USANDO O CONTEXTO!)
    async function handleAddIncome(e: React.FormEvent) {
        e.preventDefault()
        const parsedAmount = parseFloat(newAmount)
        if (!newTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return

        if (!newCategoryId || !newPaymentMethodId) {
            toast.error("Seleciona a Categoria e a Conta de Recebimento!")
            return
        }

        setIsSubmitting(true)

        try {
            await addFinancialRecord({
                name: newTitle,
                price: parsedAmount,
                recordTypeName: "INCOME",
                categoryId: newCategoryId,
                paymentMethodId: newPaymentMethodId
            })

            toast.success(`Ganho "${newTitle}" adicionado com sucesso!`)

            setNewTitle("")
            setNewAmount("")
            setNewCategoryId("")
            setNewPaymentMethodId("")
            setIsAdding(false)

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Ocorreu um erro ao gravar a receita.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // 4. FUNÇÃO PARA APAGAR REGISTO
    async function handleDelete(id: string) {
        if (!confirm("Tens a certeza que queres eliminar este registo?")) return
        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/financial-records/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Falha ao eliminar")

            refresh()
            toast.success("Registo eliminado com sucesso.")
        } catch (error) {
            console.error(error)
            toast.error("Erro ao eliminar o registo.")
        }
    }

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Rendimentos e Ganhos
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Gere o teu vencimento, cartão refeição e entradas extra.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
                        <button type="button" onClick={() => setViewMode("monthly")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "monthly" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs" : "text-muted-foreground hover:text-slate-900"}`}>
                            Mensal
                        </button>
                        <button type="button" onClick={() => setViewMode("annual")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "annual" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs" : "text-muted-foreground hover:text-slate-900"}`}>
                            Anual (Proj.)
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsAdding((prev) => !prev)}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Novo Ganho</span>
                    </button>
                </div>
            </div>

            {/* FORMULÁRIO */}
            {isAdding && (
                <Card className="border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                            Registar Entrada de Dinheiro
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddIncome} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">

                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Salário, Vinted..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Valor (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            {/* CATEGORIA (COM CRIAÇÃO RÁPIDA E ELIMINAÇÃO) */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                                {isAddingCategory ? (
                                    <div className="flex items-center gap-1 h-9">
                                        <input
                                            type="text"
                                            placeholder="Nova categoria..."
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            className="h-full w-full rounded-md border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 px-2 text-xs"
                                            autoFocus
                                        />
                                        <button type="button" onClick={handleCreateCategory} disabled={isSubmittingCategory} className="h-full aspect-square bg-emerald-600 text-white rounded-md flex items-center justify-center hover:bg-emerald-700 cursor-pointer">
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button type="button" onClick={() => setIsAddingCategory(false)} className="h-full aspect-square bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-md flex items-center justify-center hover:bg-slate-300 cursor-pointer">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-1 h-9">
                                        <select
                                            value={newCategoryId}
                                            onChange={(e) => setNewCategoryId(e.target.value)}
                                            className="h-full flex-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                            required={!isAddingCategory}
                                        >
                                            <option value="" disabled>Selecionar...</option>
                                            {categories.map((c: any) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>

                                        {/* Botão de Apagar (só aparece se uma categoria estiver selecionada) */}
                                        {newCategoryId && (
                                            <button
                                                type="button"
                                                title="Apagar categoria"
                                                onClick={() => handleDeleteCategory(newCategoryId)}
                                                disabled={isSubmittingCategory}
                                                className="h-full aspect-square bg-red-50 border border-red-200 dark:border-red-900/50 dark:bg-red-950/30 text-red-500 rounded-md flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 cursor-pointer disabled:opacity-50"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            title="Nova categoria"
                                            onClick={() => setIsAddingCategory(true)}
                                            className="h-full aspect-square bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-md flex items-center justify-center hover:bg-slate-200 cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 text-slate-500" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* MÉTODO DE PAGAMENTO */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Recebido em (Conta)</label>
                                <select
                                    value={newPaymentMethodId}
                                    onChange={(e) => setNewPaymentMethodId(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                >
                                    <option value="" disabled>Escolhe a conta...</option>
                                    {paymentMethods.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-2 md:col-span-5 mt-2 justify-end">
                                <button type="button" onClick={() => setIsAdding(false)} className="h-9 px-4 bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-md hover:bg-slate-300/70 cursor-pointer">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting || isAddingCategory} className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50">
                                    {isSubmitting ? "A gravar..." : "Guardar Ganho"}
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* LINHA 1: CARTÕES DE RESUMO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            Rendimento {viewMode === "monthly" ? "Mensal" : "Anual"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold @[220px]:text-2xl @[320px]:text-3xl text-slate-900 dark:text-slate-100">
                            € {totalIncome.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Inclui € {extraTotal.toLocaleString("pt-PT")} em ganhos extra
                        </span>
                    </CardContent>
                </Card>

                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            Base Garantida
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1.5 my-auto">
                        <div className="text-xl font-bold @[220px]:text-xl @[320px]:text-2xl text-slate-900 dark:text-slate-100">
                            € {(fixedTotal + mealCardTotal).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>Fixo: € {fixedTotal.toLocaleString("pt-PT")}</span>
                            <span>•</span>
                            <span>Cartão Ref.: € {mealCardTotal.toLocaleString("pt-PT")}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                                <PieChart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            Regra 50/30/20 Ideal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col justify-center gap-2 my-auto">
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-md">
                                <span className="block text-[10px] text-muted-foreground">50% Essencial</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    € {Math.round(totalIncome * 0.5)}
                                </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-md">
                                <span className="block text-[10px] text-muted-foreground">30% Lazer</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    € {Math.round(totalIncome * 0.3)}
                                </span>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/40">
                                <span className="block text-[10px] text-emerald-700 dark:text-emerald-300">20% Poupar</span>
                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                    € {Math.round(totalIncome * 0.2)}
                                </span>
                            </div>
                        </div>
                        <p className="text-[11px] text-center text-muted-foreground">
                            Estabilidade: <strong>{fixedPercentage}% fixo</strong> vs <strong>{extraPercentage}% extra</strong>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* LINHA 2: FONTES ATIVAS & HISTÓRICO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-5 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            Fontes de Rendimento Ativas
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Resumo de como o dinheiro entrou na tua conta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Trabalho / Vencimento</p></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">€ {fixedTotal.toLocaleString("pt-PT")}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cartão de Refeição</p></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">€ {mealCardTotal.toLocaleString("pt-PT")}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Rendimento Extra</p></div>
                            </div>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">+ € {extraTotal.toLocaleString("pt-PT")}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                Histórico de Entradas
                            </CardTitle>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {incomes.length} registos
                        </span>
                    </CardHeader>

                    <CardContent className="space-y-2.5">
                        {incomes.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-10">Ainda não tens rendimentos registados.</div>
                        ) : incomes.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-md ${item.category === "fixed" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : item.category === "meal_card" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"}`}>
                                        {item.category === "fixed" && <Briefcase className="w-4 h-4" />}
                                        {item.category === "meal_card" && <CreditCard className="w-4 h-4" />}
                                        {item.category === "extra" && <Sparkles className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Calendar className="w-3 h-3" />
                                            {item.date ? new Date(item.date).toLocaleDateString("pt-PT") : "Sem data"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                                        + € {item.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                    >
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
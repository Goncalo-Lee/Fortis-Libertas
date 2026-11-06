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
    ShieldCheck,
    SlidersHorizontal,
    ArrowUpRight,
    Calendar,
    Plus,
    History,
    Trash2,
    Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { useDashboard } from "@/contexts/DashboardContext"
import { useFinancial } from "@/contexts/FinancialContext"

import { CreateCategoryModal } from "@/components/CreateCategoryModal"

export default function EmergencyFundPage() {
    const { activeDashboard } = useDashboard()
    const { installmentPlans, financialRecords, paymentMethods, recordTypes, categories, tags, refresh } = useFinancial()

    // Controlo de painéis simplificado
    const [isConfiguring, setIsConfiguring] = useState(false)
    const [isAddingMovement, setIsAddingMovement] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Estados do configurador de meta
    const [tempCost, setTempCost] = useState("750")
    const [tempMonths, setTempMonths] = useState("6")

    // Estados do formulário de reforço
    const [movTitle, setMovTitle] = useState("")
    const [movAmount, setMovAmount] = useState("")
    const [movPaymentMethodId, setMovPaymentMethodId] = useState("")
    const [movTag, setMovTag] = useState("Reforço Mensal")
    const [movCategoryId, setMovCategoryId] = useState("")

    // Estados do Modal de Categoria
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [tempCategory, setTempCategory] = useState<any>(null)

    // ==========================================
    // 1. LOCALIZAR O PLANO DO FUNDO DE EMERGÊNCIA
    // ==========================================
    const emergencyPlan = useMemo(() => {
        if (!installmentPlans) return null
        return installmentPlans.find(
            (p: any) =>
                p.status !== "cancelled" &&
                (p.description?.startsWith("[EMERGENCY]") ||
                    p.description?.startsWith("[PILLOW]") ||
                    p.name?.toLowerCase().includes("emergência") ||
                    p.name?.toLowerCase().includes("almofada") ||
                    p.name?.toLowerCase().includes("pé de meia"))
        ) || null
    }, [installmentPlans])

    const { monthlyEssentialCost, targetMonths, idealTarget, emergencyPlanId } = useMemo(() => {
        if (!emergencyPlan) {
            return { monthlyEssentialCost: 750, targetMonths: 6, idealTarget: 4500, emergencyPlanId: null }
        }

        const planId = emergencyPlan.installment_plan_id || emergencyPlan.id
        const months = Number(emergencyPlan.total_installments ?? emergencyPlan.totalInstallments ?? 6)
        const total = Number(emergencyPlan.total_amount ?? emergencyPlan.totalAmount ?? emergencyPlan.amount ?? 4500)

        let cost = months > 0 ? Math.round(total / months) : 750
        if (emergencyPlan.description && emergencyPlan.description.includes("Custo:")) {
            const match = emergencyPlan.description.match(/Custo:\s*([\d.]+)/)
            if (match) cost = parseFloat(match[1])
        }

        return {
            monthlyEssentialCost: cost,
            targetMonths: months > 0 ? months : 6,
            idealTarget: total,
            emergencyPlanId: planId
        }
    }, [emergencyPlan])

    const expenseRecordType = useMemo(() => {
        return (recordTypes || []).find((rt: any) => rt.kind === "expense")
    }, [recordTypes])
    const defaultExpenseTypeId = expenseRecordType?.record_type_id || expenseRecordType?.id

    // FILTRO DE CATEGORIAS (Apenas Despesas, com injeção em tempo real)
    const availableCategories = useMemo(() => {
        let list = categories ? [...categories] : []

        if (tempCategory && !list.some((c: any) => (c.category_id || c.id) === tempCategory.id)) {
            list.push(tempCategory)
        }

        return list.filter((c: any) => {
            if (tempCategory && (c.category_id || c.id) === tempCategory.id) return true

            const rts = c.record_types || c.recordTypes || []
            if (rts.length === 0) return true

            return rts.some((rt: any) => rt.kind === "expense" || rt.kind === "neutral")
        })
    }, [categories, tempCategory])

    useEffect(() => {
        if (emergencyPlan) {
            setTempCost(String(monthlyEssentialCost))
            setTempMonths(String(targetMonths))
        }
    }, [emergencyPlan, monthlyEssentialCost, targetMonths])

    // ==========================================
    // 2. PROCESSAR MOVIMENTOS
    // ==========================================
    const movements = useMemo(() => {
        if (!financialRecords || !emergencyPlanId) return []

        return financialRecords
            .filter((r: any) => (r.installment_plan_id || r.installmentPlanId) === emergencyPlanId)
            .map((r: any) => {
                const tagName = r.tags && r.tags.length > 0 ? r.tags[0].name : "Reforço"

                return {
                    id: r.financial_record_id || r.id,
                    title: r.name,
                    amount: Number(r.price || 0),
                    date: r.payment_date || r.paymentDate || new Date().toISOString(),
                    categoryTag: tagName
                }
            })
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [financialRecords, emergencyPlanId])

    const totalDeposits = movements.reduce((acc, curr) => acc + curr.amount, 0)

    // Como abolimos os levantamentos na UI, o saldo é o total depositado
    const currentBalance = totalDeposits

    const monthsCovered = monthlyEssentialCost > 0 ? Number((currentBalance / monthlyEssentialCost).toFixed(1)) : 0
    const completionPct = idealTarget > 0 ? Math.min(Math.round((currentBalance / idealTarget) * 100), 100) : 0
    const securityLevel = Math.min(5, Math.max(1, Math.ceil((completionPct / 100) * 5)))

    // ==========================================
    // 3. GUARDAR / CONFIGURAR NA BD
    // ==========================================
    async function handleSaveConfig(e: React.FormEvent) {
        e.preventDefault()
        if (!activeDashboard?.dashboard_id) return toast.error("Sem dashboard ativo.")

        const parsedCost = parseFloat(tempCost)
        const parsedMonths = parseInt(tempMonths, 10) || 6

        if (isNaN(parsedCost) || parsedCost <= 0) {
            return toast.error("Introduz um custo mensal válido.")
        }

        const calculatedTarget = parsedCost * parsedMonths
        const dueDate = new Date()
        dueDate.setMonth(dueDate.getMonth() + parsedMonths)

        setIsSubmitting(true)
        try {
            if (emergencyPlanId) {
                const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${emergencyPlanId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        name: "Fundo de Emergência",
                        total_amount: calculatedTarget,
                        total_installments: parsedMonths,
                        description: `[EMERGENCY] Custo: ${parsedCost} | Meses: ${parsedMonths}`
                    })
                })
                if (!res.ok) throw new Error("Falha ao atualizar parâmetros.")
            } else {
                const defaultCat = categories?.[0]

                const payload: Record<string, any> = {
                    name: "Fundo de Emergência",
                    description: `[EMERGENCY] Custo: ${parsedCost} | Meses: ${parsedMonths}`,
                    total_amount: calculatedTarget,
                    total_installments: parsedMonths,
                    due_date: dueDate.toISOString().split("T")[0],
                    status: "pending"
                }

                if (defaultCat) payload.category_id = defaultCat.category_id || defaultCat.id

                const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload)
                })
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}))
                    throw new Error(errData.detail || errData.message || "Falha ao criar fundo de emergência.")
                }
            }

            refresh()
            toast.success("Fundo de Emergência configurado com sucesso!")
            setIsConfiguring(false)
        } catch (error: any) {
            toast.error(error.message || "Erro ao gravar configuração.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // ==========================================
    // 4. REGISTAR REFORÇO
    // ==========================================
    async function handleAddMovement(e: React.FormEvent) {
        e.preventDefault()
        if (!activeDashboard?.dashboard_id) return

        let activePlanId = emergencyPlanId

        const parsedAmount = parseFloat(movAmount)
        if (!movTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !movCategoryId) {
            return toast.error("Introduz descrição, montante e categoria válidos.")
        }

        const fallbackMethod = paymentMethods?.[0]
        const fallbackMethodId = fallbackMethod?.payment_method_id || fallbackMethod?.id
        const selectedMethod = movPaymentMethodId || fallbackMethodId
        if (!selectedMethod) {
            return toast.error("Não tens contas de pagamento registadas.")
        }

        setIsSubmitting(true)
        try {
            if (!activePlanId) {
                const defaultTarget = 750 * 6
                const dueDate = new Date()
                dueDate.setMonth(dueDate.getMonth() + 6)

                const payload: Record<string, any> = {
                    name: "Fundo de Emergência",
                    description: `[EMERGENCY] Custo: 750 | Meses: 6`,
                    total_amount: defaultTarget,
                    total_installments: 6,
                    due_date: dueDate.toISOString().split("T")[0],
                    status: "pending",
                    category_id: movCategoryId
                }
                const initRes = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload)
                })
                if (initRes.ok) {
                    const initData = await initRes.json()
                    const createdPlan = initData.data || initData
                    activePlanId = createdPlan.installment_plan_id || createdPlan.id
                } else {
                    const err = await initRes.json().catch(() => ({}))
                    throw new Error(err.detail || err.message || "Configura o fundo de emergência primeiro.")
                }
            }

            let matchedTag = (tags || []).find((t: any) => t.name?.toLowerCase() === movTag.toLowerCase())
            if (!matchedTag && movTag) {
                const tagRes = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/tags`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ name: movTag, description: `Tag ${movTag}` })
                })
                if (tagRes.ok) {
                    const tagData = await tagRes.json()
                    matchedTag = tagData.data || tagData
                }
            }

            const tagId = matchedTag?.tag_id || matchedTag?.id

            const recordPayload: Record<string, any> = {
                name: movTitle.trim(),
                price: parsedAmount,
                record_type_id: defaultExpenseTypeId,
                category_id: movCategoryId,
                payment_method_id: selectedMethod,
                installment_plan_id: activePlanId,
                status: "paid",
                payment_date: new Date().toISOString()
            }

            if (tagId) recordPayload.tag_ids = [tagId]

            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/financial-records`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(recordPayload)
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.detail || errData.message || "Erro ao registar movimento.")
            }

            refresh()
            toast.success(`Reforço de € ${parsedAmount.toFixed(2)} adicionado!`)

            setMovTitle("")
            setMovAmount("")
            setIsAddingMovement(false)
        } catch (error: any) {
            toast.error(error.message || "Falha ao gravar o movimento.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // ==========================================
    // 5. APAGAR MOVIMENTO
    // ==========================================
    async function handleDeleteMovement(id: string) {
        if (!confirm("Tens a certeza que queres eliminar este reforço?")) return
        if (!activeDashboard?.dashboard_id) return

        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/financial-records/${id}`, {
                method: "DELETE",
                credentials: "include"
            })
            if (!res.ok) throw new Error("Falha ao eliminar registo")

            refresh()
            toast.success("Reforço removido com sucesso.")
        } catch (error) {
            toast.error("Erro ao apagar o movimento.")
        }
    }

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins relative">

            {/* MODAL DE CATEGORIA OBRIGATÓRIA (Sempre Despesa) */}
            <CreateCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                recordTypeId={defaultExpenseTypeId}
                typeLabel="Despesa"
                onSuccess={(id, name) => {
                    const newCat = {
                        id,
                        category_id: id,
                        name,
                        record_types: [{ kind: "expense" }]
                    };
                    setTempCategory(newCat);
                    setMovCategoryId(id);
                }}
            />

            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Fundo de Emergência
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        A tua reserva de segurança para total tranquilidade financeira.
                    </p>
                </div>

                <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => {
                            setIsConfiguring((prev) => !prev)
                            setIsAddingMovement(false)
                        }}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Configurar Fundo</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsAddingMovement((prev) => !prev)
                            setIsConfiguring(false)
                        }}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Reforçar</span>
                    </button>
                </div>
            </div>

            {/* PAINEL DE CONFIGURAÇÃO */}
            {isConfiguring && (
                <Card className="border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                            Dimensionar o Fundo de Emergência
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Define o teu custo essencial mensal e quantos meses de segurança queres garantir.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Custo de Vida Essencial (€ / mês)
                                </label>
                                <input
                                    type="number"
                                    step="10"
                                    value={tempCost}
                                    onChange={(e) => setTempCost(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Meses de Proteção Desejados
                                </label>
                                <select
                                    value={tempMonths}
                                    onChange={(e) => setTempMonths(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                >
                                    <option value="3">3 Meses (Segurança Básica)</option>
                                    <option value="6">6 Meses (Recomendado)</option>
                                    <option value="12">12 Meses (Tranquilidade Máxima)</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmitting ? "A guardar..." : `Atualizar Alvo`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsConfiguring(false)}
                                    className="h-9 px-3 bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-md cursor-pointer"
                                >
                                    Fechar
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* PAINEL DE REFORÇO DO FUNDO */}
            {isAddingMovement && (
                <Card className="border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                            Reforçar o Fundo de Emergência
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Transfere montantes da tua conta corrente para reforçar a tua reserva.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddMovement} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Motivo</label>
                                <select
                                    value={movTag}
                                    onChange={(e) => setMovTag(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                >
                                    <option value="Reforço Mensal">📅 Poupança do Mês</option>
                                    <option value="Ganho Extra">✨ Ganho Extra / Subsídio</option>
                                    <option value="Sobra Orçamental">🪙 Sobra do Orçamento</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                                <div className="flex gap-1 h-9">
                                    <select
                                        value={movCategoryId}
                                        onChange={(e) => setMovCategoryId(e.target.value)}
                                        className="h-full flex-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs"
                                        required
                                    >
                                        <option value="" disabled>Selecionar...</option>
                                        {availableCategories.map((c: any) => (
                                            <option key={c.category_id || c.id} value={c.category_id || c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setIsCategoryModalOpen(true)}
                                        className="h-9 w-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                                        title="Nova Categoria"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Reforço após salário"
                                    value={movTitle}
                                    onChange={(e) => setMovTitle(e.target.value)}
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
                                    value={movAmount}
                                    onChange={(e) => setMovAmount(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Conta Financeira</label>
                                <select
                                    value={movPaymentMethodId}
                                    onChange={(e) => setMovPaymentMethodId(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                >
                                    {(paymentMethods || []).map((pm: any) => {
                                        const pmId = pm.payment_method_id || pm.id
                                        return <option key={pmId} value={pmId}>{pm.name}</option>
                                    })}
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmitting ? "A gravar..." : "Confirmar"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingMovement(false)}
                                    className="h-9 px-3 bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-md cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* CARTÕES DE RESUMO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            Saldo do Fundo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold @[220px]:text-2xl @[320px]:text-3xl text-slate-900 dark:text-slate-100">
                            € {currentBalance.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {completionPct}% da reserva recomendada (€ {idealTarget.toLocaleString("pt-PT")})
                        </span>
                    </CardContent>
                </Card>

                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-teal-100 dark:bg-teal-900/30 rounded-md">
                                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            Autonomia Garantida
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-2 my-auto">
                        <div className="text-xl font-bold @[220px]:text-xl @[320px]:text-2xl text-slate-900 dark:text-slate-100">
                            {monthsCovered} Meses <span className="text-xs font-normal text-muted-foreground">de despesas</span>
                        </div>
                        <div className="flex items-center gap-1.5 w-full max-w-[150px] justify-center">
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
                    </CardContent>
                </Card>

                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                <ArrowUpRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            Total Reforçado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col justify-center items-center gap-2 my-auto">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            € {totalDeposits.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-xs text-muted-foreground">Valor bruto poupado até hoje</span>
                    </CardContent>
                </Card>

            </div>

            {/* SEÇÃO PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <Card className="lg:col-span-5 flex flex-col justify-between py-4 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            Estado do Fundo de Emergência
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Baseado num custo essencial de € {monthlyEssentialCost}/mês durante {targetMonths} meses.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5 my-auto">
                        <div className="flex flex-col items-center text-center gap-2 pt-2">
                            <div className="relative flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shadow-inner">
                                    <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400 stroke-[1.75]" />
                                </div>
                            </div>

                            <div className="w-full space-y-1.5 pt-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-emerald-700 dark:text-emerald-400">
                                        Acumulado: € {currentBalance.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-muted-foreground">
                                        Meta: € {idealTarget.toLocaleString("pt-PT")}
                                    </span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                        style={{ width: `${completionPct}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 text-xs space-y-1">
                                <p className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    Quando reforçar?
                                </p>
                                <p className="text-muted-foreground">
                                    Sempre que recebes salário, subsídios ou sobras de fim do mês.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Coluna Direita: Histórico */}
                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                Movimentos do Fundo
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Reforços associados à tua reserva de segurança.
                            </CardDescription>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {movements.length} movimentos
                        </span>
                    </CardHeader>

                    <CardContent className="space-y-2.5">
                        {movements.length === 0 && (
                            <p className="text-center text-xs text-muted-foreground py-8">
                                Ainda não há movimentos registados no teu Fundo de Emergência.
                            </p>
                        )}
                        {movements.map((mov, index) => {
                            const movId = mov.id || index
                            return (
                                <div
                                    key={movId}
                                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    {mov.title}
                                                </p>
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                    {mov.categoryTag}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(mov.date).toLocaleDateString("pt-PT")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                                            + € {mov.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteMovement(mov.id)}
                                            aria-label="Apagar registo"
                                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                        >
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
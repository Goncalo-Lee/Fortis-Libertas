"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, SlidersHorizontal, ArrowUpRight, Plus, Trash2, Target } from "lucide-react"
import { toast } from "sonner"
import { useDashboard } from "@/contexts/DashboardContext"
import { useFinancial } from "@/contexts/FinancialContext"
import { CreateCategoryModal } from "@/components/CreateCategoryModal"
import { useNotifications } from "@/contexts/NotificationContext"

export default function EmergencyFundPage() {
    const { activeDashboard } = useDashboard()
    const { createNotification } = useNotifications()

    const {
        installmentPlans, financialRecords, paymentMethods, recordTypes, categories, tags, refresh,
        addFinancialRecord, deleteFinancialRecord, addInstallmentPlan, updateInstallmentPlan, deleteInstallmentPlan, addTag
    } = useFinancial()

    // Modal / panel states
    const [isConfiguring, setIsConfiguring] = useState(false)
    const [isAddingMovement, setIsAddingMovement] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [tempCategory, setTempCategory] = useState<any>(null)

    // ID of the movement currently being deleted (disables its button while the request runs)
    const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null)

    // Setup / configuration states
    const [tempCost, setTempCost] = useState("750")
    const [tempMonths, setTempMonths] = useState("6")
    const [setupCategoryId, setSetupCategoryId] = useState("")

    // Top-up (deposit) states
    const [movTitle, setMovTitle] = useState("")
    const [movAmount, setMovAmount] = useState("")
    const [movPaymentMethodId, setMovPaymentMethodId] = useState("")
    const [movTag, setMovTag] = useState("Reforço Mensal")
    const [movCategoryId, setMovCategoryId] = useState("")

    // ==========================================
    // 1. FIND THE FUND'S PLAN
    // ==========================================
    // The fund is stored as an installment plan, identified by a description
    // prefix ([EMERGENCY] / [PILLOW]) or by keywords in its name.
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
        // Defaults when no fund exists yet
        if (!emergencyPlan) {
            return { monthlyEssentialCost: 750, targetMonths: 6, idealTarget: 4500, emergencyPlanId: null }
        }

        const planId = emergencyPlan.installment_plan_id || emergencyPlan.id
        const months = Number(emergencyPlan.total_installments ?? emergencyPlan.totalInstallments ?? 6)
        const total = Number(emergencyPlan.total_amount ?? emergencyPlan.totalAmount ?? emergencyPlan.amount ?? 4500)

        // Derive the monthly cost from total/months, but prefer the value
        // stored in the description ("Custo: X") when it is present.
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

    // Categories usable for this fund (expense/neutral), including a freshly
    // created one that may not have reached the context yet.
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

    // Keep the config form in sync with the stored plan
    useEffect(() => {
        if (emergencyPlan) {
            setTempCost(String(monthlyEssentialCost))
            setTempMonths(String(targetMonths))
        }
    }, [emergencyPlan, monthlyEssentialCost, targetMonths])

    // ==========================================
    // 2. MOVEMENTS CALCULATION
    // ==========================================
    const movements = useMemo(() => {
        if (!financialRecords || !emergencyPlanId) return []
        return financialRecords
            .filter((r: any) => (r.installment_plan_id || r.installmentPlanId || r.plan_id) === emergencyPlanId)
            .map((r: any) => {
                const tagName = r.tags && r.tags.length > 0 ? r.tags[0].name : "Reforço"
                return {
                    id: r.financial_record_id || r.id,
                    title: r.name,
                    amount: Number(r.price || r.amount || r.value || 0),
                    date: r.payment_date || r.paymentDate || new Date().toISOString(),
                    categoryTag: tagName
                }
            })
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [financialRecords, emergencyPlanId])

    const totalDeposits = movements.reduce((acc, curr) => acc + curr.amount, 0)
    const currentBalance = totalDeposits
    const monthsCovered = monthlyEssentialCost > 0 ? Number((currentBalance / monthlyEssentialCost).toFixed(1)) : 0
    const completionPct = idealTarget > 0 ? Math.min(Math.round((currentBalance / idealTarget) * 100), 100) : 0
    const securityLevel = Math.min(5, Math.max(1, Math.ceil((completionPct / 100) * 5)))

    // ==========================================
    // 3. CREATE THE FUND FOR THE FIRST TIME
    // ==========================================
    async function handleCreateFund(e: React.FormEvent) {
        e.preventDefault()
        if (!activeDashboard?.dashboard_id) return toast.error("Sem dashboard ativo.")
        if (!setupCategoryId) return toast.error("Escolhe uma categoria (ex: Poupança).")

        const parsedCost = parseFloat(tempCost)
        const parsedMonths = parseInt(tempMonths, 10) || 6

        if (isNaN(parsedCost) || parsedCost <= 0) {
            return toast.error("Introduz um custo mensal válido.")
        }

        setIsSubmitting(true)
        try {
            const calculatedTarget = parsedCost * parsedMonths
            const dueDate = new Date()
            dueDate.setMonth(dueDate.getMonth() + parsedMonths)

            await addInstallmentPlan({
                name: "Fundo de Emergência",
                description: `[EMERGENCY] Custo: ${parsedCost} | Meses: ${parsedMonths}`,
                // .toFixed(2) converts the number to a string, which is what the API expects
                total_amount: calculatedTarget.toFixed(2),
                total_installments: parsedMonths,
                due_date: dueDate.toISOString().split("T")[0],
                status: "pending",
                // The API requires a category, so we send it along
                category_id: setupCategoryId
            })

            toast.success("Fundo de Emergência criado com sucesso!")
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar o fundo.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // ==========================================
    // 4. UPDATE / DELETE AN EXISTING FUND
    // ==========================================
    async function handleUpdateConfig(e: React.FormEvent) {
        e.preventDefault()
        if (!activeDashboard?.dashboard_id || !emergencyPlanId) return

        const parsedCost = parseFloat(tempCost)
        const parsedMonths = parseInt(tempMonths, 10) || 6

        setIsSubmitting(true)
        try {
            const calculatedTarget = parsedCost * parsedMonths
            await updateInstallmentPlan(emergencyPlanId, {
                name: "Fundo de Emergência",
                // Must be a string, otherwise the API answers with a 422
                total_amount: calculatedTarget.toFixed(2),
                total_installments: parsedMonths,
                description: `[EMERGENCY] Custo: ${parsedCost} | Meses: ${parsedMonths}`
            })
            toast.success("Alvo do Fundo atualizado!")
            setIsConfiguring(false)
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar configuração.")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDeleteFund() {
        if (!emergencyPlanId) return
        if (!confirm("Atenção: Queres mesmo apagar o Fundo de Emergência? O histórico de reforços associados precisa de ser apagado primeiro!")) return

        try {
            await deleteInstallmentPlan(emergencyPlanId)
            toast.success("Fundo apagado. Podes criar um novo!")
            setIsConfiguring(false)
        } catch (error: any) {
            // The backend rejects the delete while linked records still exist
            toast.error("Erro: Verifica se apagaste os movimentos do fundo primeiro.")
        }
    }

    // ==========================================
    // 5. ADD A TOP-UP (DEPOSIT)
    // ==========================================
    async function handleAddMovement(e: React.FormEvent) {
        e.preventDefault()
        if (!activeDashboard?.dashboard_id || !emergencyPlanId) return

        const parsedAmount = parseFloat(movAmount)
        if (!movTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !movCategoryId) {
            return toast.error("Introduz descrição, montante e categoria válidos.")
        }

        // Fall back to the first payment method if none was selected
        const fallbackMethod = paymentMethods?.[0]
        const selectedMethod = movPaymentMethodId || fallbackMethod?.payment_method_id || fallbackMethod?.id
        if (!selectedMethod) return toast.error("Não tens contas de pagamento registadas.")

        setIsSubmitting(true)
        try {
            // Reuse the tag if it already exists, otherwise create it
            let matchedTag = (tags || []).find((t: any) => t.name?.toLowerCase() === movTag.toLowerCase())
            if (!matchedTag && movTag) {
                const tagData = await addTag(movTag)
                matchedTag = tagData.data || tagData
            }

            await addFinancialRecord({
                name: movTitle.trim(),
                price: parsedAmount, // The context already converts this to a string for us
                recordTypeId: defaultExpenseTypeId,
                categoryId: movCategoryId,
                paymentMethodId: selectedMethod,
                installmentPlanId: emergencyPlanId,
                paymentDate: new Date().toISOString(),
                tagIds: matchedTag ? [matchedTag.tag_id || matchedTag.id] : []
            })

            // ========================================================
            // MILESTONE NOTIFICATIONS
            // ========================================================
            const newBalance = currentBalance + parsedAmount

            // 1. Notify when the balance first covers one month of essential costs
            if (newBalance >= monthlyEssentialCost && currentBalance < monthlyEssentialCost) {
                await createNotification(
                    "🛡️ 1 Mês de Proteção!",
                    "Fantástico! Já juntaste o suficiente para cobrir um mês inteiro de despesas essenciais.",
                    "success"
                )
            }

            // 2. Notify when the fund reaches 100% of its target
            if (newBalance >= idealTarget && currentBalance < idealTarget) {
                await createNotification(
                    "🏆 Fundo de Emergência Completo!",
                    "Muitos parabéns! Atingiste o alvo total da tua reserva. Estás financeiramente blindado!",
                    "goal"
                )
            }
            // ========================================================

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
    // 6. DELETE A TOP-UP (DEPOSIT)
    // ==========================================
    async function handleDeleteMovement(movementId?: string) {
        // Guard against missing IDs and double clicks
        if (!movementId || deletingMovementId) return
        if (!confirm("Queres mesmo apagar este movimento? O saldo do fundo vai ser atualizado.")) return

        setDeletingMovementId(movementId)
        try {
            await deleteFinancialRecord(movementId)
            // Balance, progress bar and "months covered" are derived from the
            // records, so they update automatically once the context refreshes.
            toast.success("Movimento apagado.")
        } catch (error: any) {
            toast.error(error.message || "Erro ao apagar o movimento.")
        } finally {
            setDeletingMovementId(null)
        }
    }

    // =========================================================================
    // RENDER 1: SETUP SCREEN (WHEN NO FUND EXISTS)
    // =========================================================================
    if (!emergencyPlanId) {
        return (
            <div className="h-full w-full overflow-y-auto p-4 md:p-6 font-poppins flex flex-col items-center justify-center min-h-[80vh]">
                <CreateCategoryModal
                    isOpen={isCategoryModalOpen}
                    onClose={() => setIsCategoryModalOpen(false)}
                    recordTypeId={defaultExpenseTypeId}
                    typeLabel="Despesa"
                    onSuccess={(id, name) => {
                        const newCat = { id, category_id: id, name, record_types: [{ kind: "expense" }] };
                        setTempCategory(newCat);
                        setSetupCategoryId(id);
                    }}
                />

                <div className="max-w-xl w-full text-center space-y-2 mb-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                        Cria o teu Fundo de Emergência
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        O primeiro passo para a paz de espírito financeira. Define as tuas regras e começa a construir a tua almofada.
                    </p>
                </div>

                <Card className="max-w-xl w-full border-emerald-200 bg-emerald-50/30 shadow-md animate-in zoom-in-95">
                    <CardHeader>
                        <CardTitle className="text-lg">Configuração Inicial</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateFund} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Custo Essencial por Mês (€)</label>
                                    <input
                                        type="number" step="10" value={tempCost} onChange={(e) => setTempCost(e.target.value)}
                                        className="h-10 w-full rounded-md border px-3" required
                                    />
                                    <p className="text-[10px] text-muted-foreground">Valor mínimo para sobreviveres um mês.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Meses de Proteção</label>
                                    <select value={tempMonths} onChange={(e) => setTempMonths(e.target.value)} className="h-10 w-full rounded-md border px-3">
                                        <option value="3">3 Meses (Risco Alto)</option>
                                        <option value="6">6 Meses (Recomendado)</option>
                                        <option value="12">12 Meses (Risco Zero)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <label className="text-sm font-medium text-slate-700">Categoria do Fundo</label>
                                <div className="flex gap-2">
                                    <select value={setupCategoryId} onChange={(e) => setSetupCategoryId(e.target.value)} className="h-10 flex-1 rounded-md border px-3" required>
                                        <option value="" disabled>Selecionar categoria de associação...</option>
                                        {availableCategories.map((c: any) => (
                                            <option key={c.category_id || c.id} value={c.category_id || c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="h-10 w-10 bg-white border rounded-md flex items-center justify-center hover:bg-slate-50">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full h-10 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md">
                                {isSubmitting ? "A criar..." : "Criar Fundo de Emergência"}
                            </button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // =========================================================================
    // RENDER 2: MAIN FUND DASHBOARD
    // =========================================================================
    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins relative">
            <CreateCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                recordTypeId={defaultExpenseTypeId}
                typeLabel="Despesa"
                onSuccess={(id, name) => {
                    const newCat = { id, category_id: id, name, record_types: [{ kind: "expense" }] };
                    setTempCategory(newCat);
                    setMovCategoryId(id);
                }}
            />

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
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg cursor-pointer"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Configurar</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsAddingMovement((prev) => !prev)
                            setIsConfiguring(false)
                        }}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Reforçar</span>
                    </button>
                </div>
            </div>

            {isConfiguring && (
                <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold flex items-center justify-between gap-2">
                            <span>Ajustar o Fundo de Emergência</span>
                            <button type="button" onClick={handleDeleteFund} className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-md cursor-pointer" title="Apagar este Fundo para criar um novo">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Define o teu custo essencial mensal e quantos meses de segurança queres garantir.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Custo Mensal (€)</label>
                                <input type="number" step="10" value={tempCost} onChange={(e) => setTempCost(e.target.value)} className="h-9 rounded-md border px-3 text-sm" required />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Meses de Proteção</label>
                                <select value={tempMonths} onChange={(e) => setTempMonths(e.target.value)} className="h-9 rounded-md border px-3 text-sm">
                                    <option value="3">3 Meses (Risco Alto)</option>
                                    <option value="6">6 Meses (Recomendado)</option>
                                    <option value="12">12 Meses (Risco Zero)</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" disabled={isSubmitting} className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-md cursor-pointer">
                                    {isSubmitting ? "A guardar..." : `Atualizar`}
                                </button>
                                <button type="button" onClick={() => setIsConfiguring(false)} className="h-9 px-3 bg-slate-200 text-slate-700 text-xs rounded-md cursor-pointer">
                                    Fechar
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {isAddingMovement && (
                <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold">Reforçar o Fundo de Emergência</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddMovement} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Motivo</label>
                                <select value={movTag} onChange={(e) => setMovTag(e.target.value)} className="h-9 rounded-md border px-3 text-xs">
                                    <option value="Reforço Mensal">📅 Poupança do Mês</option>
                                    <option value="Ganho Extra">✨ Ganho Extra / Subsídio</option>
                                    <option value="Sobra Orçamental">🪙 Sobra do Orçamento</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                                <div className="flex gap-1 h-9">
                                    <select value={movCategoryId} onChange={(e) => setMovCategoryId(e.target.value)} className="h-full flex-1 rounded-md border px-2 text-xs" required>
                                        <option value="" disabled>Selecionar...</option>
                                        {availableCategories.map((c: any) => (<option key={c.category_id || c.id} value={c.category_id || c.id}>{c.name}</option>))}
                                    </select>
                                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="h-9 w-9 bg-white border rounded-md hover:bg-slate-50 flex items-center justify-center cursor-pointer"><Plus className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                                <input type="text" placeholder="Ex: Reforço após salário" value={movTitle} onChange={(e) => setMovTitle(e.target.value)} className="h-9 rounded-md border px-3 text-xs" required />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Valor (€)</label>
                                <input type="number" step="0.01" value={movAmount} onChange={(e) => setMovAmount(e.target.value)} className="h-9 rounded-md border px-3 text-xs" required />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Conta Financeira</label>
                                <select value={movPaymentMethodId} onChange={(e) => setMovPaymentMethodId(e.target.value)} className="h-9 rounded-md border px-3 text-xs">
                                    {(paymentMethods || []).map((pm: any) => (<option key={pm.payment_method_id || pm.id} value={pm.payment_method_id || pm.id}>{pm.name}</option>))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" disabled={isSubmitting} className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md cursor-pointer">{isSubmitting ? "A gravar..." : "Confirmar"}</button>
                                <button type="button" onClick={() => setIsAddingMovement(false)} className="h-9 px-3 bg-slate-200 text-slate-700 text-xs rounded-md cursor-pointer">Cancelar</button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full text-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Saldo do Fundo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center pt-2 my-auto">
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">€ {currentBalance.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</div>
                        <span className="text-xs text-emerald-600 font-medium">{completionPct}% da reserva recomendada (€ {idealTarget.toLocaleString("pt-PT")})</span>
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full text-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <Target className="w-4 h-4 text-teal-600" /> Autonomia Garantida
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center pt-2 my-auto">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{monthsCovered} Meses <span className="text-xs font-normal text-muted-foreground">de despesas</span></div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full text-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-blue-600" /> Total Reforçado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center pt-2 my-auto">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">€ {totalDeposits.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Progress card */}
                <Card className="lg:col-span-5 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Estado do Fundo de Emergência</CardTitle>
                        <CardDescription className="text-xs">Baseado num custo essencial de € {monthlyEssentialCost}/mês durante {targetMonths} meses.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex flex-col items-center text-center gap-2 pt-2">
                            <div className="w-full space-y-1.5 pt-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-emerald-700">Acumulado: € {currentBalance.toLocaleString("pt-PT")}</span>
                                    <span className="text-muted-foreground">Meta: € {idealTarget.toLocaleString("pt-PT")}</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${completionPct}%` }} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Movements list */}
                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold">Movimentos do Fundo</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                        {movements.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">Ainda não há movimentos registados.</p>}
                        {movements.map((mov, index) => {
                            const movId = mov.id || index
                            const isDeleting = deletingMovementId === mov.id
                            return (
                                <div key={movId} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <p className="text-sm font-medium">{mov.title}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(mov.date).toLocaleDateString("pt-PT")}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-emerald-600">+ € {mov.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteMovement(mov.id)}
                                            disabled={isDeleting}
                                            title="Apagar movimento"
                                            className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
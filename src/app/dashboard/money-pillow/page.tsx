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
    PiggyBank,
    ShieldCheck,
    SlidersHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    HeartHandshake,
    Plus,
    Minus,
    History,
    Trash2,
    Sparkles,
    AlertTriangle,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import { useDashboard } from "@/contexts/DashboardContext"
import { useFinancial } from "@/contexts/FinancialContext"

type MovementType = "deposit" | "withdrawal"

export default function MoneyPillowPage() {
    const { activeDashboard } = useDashboard()
    const { installmentPlans, financialRecords, paymentMethods, recordTypes, tags, refresh } = useFinancial()

    // Controlo de painéis
    const [isConfiguring, setIsConfiguring] = useState(false)
    const [movementMode, setMovementMode] = useState<MovementType | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Estados do configurador de meta
    const [tempCost, setTempCost] = useState("750")
    const [tempMonths, setTempMonths] = useState("6")

    // Estados do formulário de movimento
    const [movTitle, setMovTitle] = useState("")
    const [movAmount, setMovAmount] = useState("")
    const [movPaymentMethodId, setMovPaymentMethodId] = useState("")
    const [movTag, setMovTag] = useState("Reforço Mensal")

    // ==========================================
    // 1. LOCALIZAR O PLANO DO PÉ DE MEIA NA BD
    // ==========================================
    const pillowPlan = useMemo(() => {
        if (!installmentPlans) return null
        return installmentPlans.find(
            (p: any) =>
                p.status !== "cancelled" &&
                (p.description?.startsWith("[PILLOW]") ||
                    p.name?.toLowerCase().includes("pé de meia") ||
                    p.name?.toLowerCase().includes("almofada"))
        ) || null
    }, [installmentPlans])

    // Extrair parâmetros do plano encontrado
    const { monthlyEssentialCost, targetMonths, idealPillowTarget } = useMemo(() => {
        if (!pillowPlan) {
            return { monthlyEssentialCost: 750, targetMonths: 6, idealPillowTarget: 4500 }
        }

        const months = Number(pillowPlan.totalInstallments ?? pillowPlan.total_installments ?? 6)
        const total = Number(pillowPlan.totalAmount ?? pillowPlan.total_amount ?? pillowPlan.amount ?? 4500)

        let cost = months > 0 ? Math.round(total / months) : 750
        if (pillowPlan.description && pillowPlan.description.includes("Custo:")) {
            const match = pillowPlan.description.match(/Custo:\s*([\d.]+)/)
            if (match) cost = parseFloat(match[1])
        }

        return {
            monthlyEssentialCost: cost,
            targetMonths: months > 0 ? months : 6,
            idealPillowTarget: total
        }
    }, [pillowPlan])

    // Sincroniza inputs do modal quando os dados carregam
    useEffect(() => {
        if (pillowPlan) {
            setTempCost(String(monthlyEssentialCost))
            setTempMonths(String(targetMonths))
        }
    }, [pillowPlan, monthlyEssentialCost, targetMonths])

    // ==========================================
    // 2. PROCESSAR MOVIMENTOS REAIS DA BASE DE DADOS
    // ==========================================
    const movements = useMemo(() => {
        if (!financialRecords || !pillowPlan) return []

        return financialRecords
            .filter((r: any) => (r.installmentPlanId || r.installment_plan_id) === pillowPlan.id)
            .map((r: any) => {
                let typeName = r.recordType?.name?.toLowerCase() || ""
                if (!typeName && recordTypes) {
                    const rt = recordTypes.find((t: any) => t.id === (r.recordTypeId || r.record_type_id))
                    if (rt) typeName = rt.name.toLowerCase()
                }

                // Despesas associadas ao plano representam dinheiro guardado (Reforço)
                // Receitas associadas representam dinheiro devolvido à conta (Uso de Emergência)
                const isWithdrawal =
                    typeName.includes("receita") ||
                    typeName.includes("income") ||
                    r.name.toLowerCase().includes("uso de emergência") ||
                    r.name.toLowerCase().includes("reserva")

                const tagName = r.tags && r.tags.length > 0 ? r.tags[0].name : (isWithdrawal ? "Emergência" : "Reforço")

                return {
                    id: r.id,
                    title: r.name,
                    amount: Number(r.price || 0),
                    type: (isWithdrawal ? "withdrawal" : "deposit") as MovementType,
                    date: r.paymentDate || r.payment_date || new Date().toISOString(),
                    categoryTag: tagName
                }
            })
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [financialRecords, pillowPlan, recordTypes])

    // Cálculos da Visão Geral
    const totalDeposits = movements
        .filter((m) => m.type === "deposit")
        .reduce((acc, curr) => acc + curr.amount, 0)

    const totalWithdrawals = movements
        .filter((m) => m.type === "withdrawal")
        .reduce((acc, curr) => acc + curr.amount, 0)

    const currentBalance = Math.max(0, totalDeposits - totalWithdrawals)

    const monthsCovered = monthlyEssentialCost > 0
        ? Number((currentBalance / monthlyEssentialCost).toFixed(1))
        : 0

    const completionPct = idealPillowTarget > 0
        ? Math.min(Math.round((currentBalance / idealPillowTarget) * 100), 100)
        : 0

    const securityLevel = Math.min(5, Math.max(1, Math.ceil((completionPct / 100) * 5)))

    // ==========================================
    // 3. GUARDAR / CONFIGURAR O PÉ DE MEIA NA BD
    // ==========================================
    async function handleSaveConfig(e: React.FormEvent) {
        e.preventDefault()
        const parsedCost = parseFloat(tempCost)
        const parsedMonths = parseInt(tempMonths, 10) || 6

        if (isNaN(parsedCost) || parsedCost <= 0) {
            return toast.error("Introduz um custo mensal válido.")
        }

        const calculatedTarget = (parsedCost * parsedMonths).toFixed(2)
        const dueDate = new Date()
        dueDate.setMonth(dueDate.getMonth() + parsedMonths)

        setIsSubmitting(true)
        try {
            if (pillowPlan) {
                // Atualiza plano existente
                const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${pillowPlan.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: pillowPlan.name || "Pé de Meia",
                        total_amount: calculatedTarget,
                        total_installments: parsedMonths,
                        description: `[PILLOW] Custo: ${parsedCost} | Meses: ${parsedMonths}`
                    })
                })
                if (!res.ok) throw new Error("Falha ao atualizar parâmetros.")
            } else {
                // Cria novo plano do Pé de Meia
                const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: "Pé de Meia",
                        description: `[PILLOW] Custo: ${parsedCost} | Meses: ${parsedMonths}`,
                        total_amount: calculatedTarget,
                        total_installments: parsedMonths,
                        due_date: dueDate.toISOString().split("T")[0],
                        status: "pending"
                    })
                })
                if (!res.ok) throw new Error("Falha ao criar almofada financeira.")
            }

            refresh()
            toast.success("Meta do Pé de Meia configurada com sucesso!")
            setIsConfiguring(false)
        } catch (error: any) {
            toast.error(error.message || "Erro ao gravar configuração.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // ==========================================
    // 4. REGISTAR ENTRADA OU SAÍDA (RECORD REAL)
    // ==========================================
    async function handleAddMovement(e: React.FormEvent) {
        e.preventDefault()
        if (!movementMode) return

        let activePillow = pillowPlan

        // Se ainda não existir plano na BD, cria automaticamente antes do movimento
        if (!activePillow) {
            const defaultTarget = (750 * 6).toFixed(2)
            const dueDate = new Date()
            dueDate.setMonth(dueDate.getMonth() + 6)

            const initRes = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Pé de Meia",
                    description: `[PILLOW] Custo: 750 | Meses: 6`,
                    total_amount: defaultTarget,
                    total_installments: 6,
                    due_date: dueDate.toISOString().split("T")[0],
                    status: "pending"
                })
            })

            if (initRes.ok) {
                const initData = await initRes.json()
                activePillow = initData.data || initData
            } else {
                return toast.error("Configura a almofada primeiro antes de registar movimentos.")
            }
        }

        const parsedAmount = parseFloat(movAmount)
        if (!movTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
            return toast.error("Introduz uma descrição e um montante válido.")
        }

        if (movementMode === "withdrawal" && parsedAmount > currentBalance) {
            return toast.error(`Não podes retirar mais do que o saldo atual (€ ${currentBalance.toLocaleString("pt-PT")}).`)
        }

        const selectedMethod = movPaymentMethodId || paymentMethods?.[0]?.id
        if (!selectedMethod) {
            return toast.error("Não tens contas de pagamento registadas para debitar/creditar.")
        }

        setIsSubmitting(true)
        try {
            // Garante ou associa a Tag da categoria escolhida
            let matchedTag = tags?.find((t: any) => t.name.toLowerCase() === movTag.toLowerCase())
            if (!matchedTag && movTag) {
                const tagRes = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/tags`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: movTag })
                })
                if (tagRes.ok) {
                    const tagData = await tagRes.json()
                    matchedTag = tagData.data || tagData
                }
            }

            const recordType = movementMode === "deposit" ? "EXPENSE" : "INCOME"

            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/financial-records`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: movTitle.trim(),
                    price: parsedAmount,
                    record_type_name: recordType,
                    payment_method_id: selectedMethod,
                    installment_plan_id: activePillow.id,
                    tag_ids: matchedTag ? [matchedTag.id] : [],
                    currency: "EUR",
                    status: "paid",
                    payment_date: new Date().toISOString()
                })
            })

            if (!res.ok) throw new Error("Erro ao registar movimento no servidor.")

            refresh()
            toast.success(
                movementMode === "deposit"
                    ? `Reforço de € ${parsedAmount.toFixed(2)} adicionado!`
                    : `Uso de emergência de € ${parsedAmount.toFixed(2)} registado.`
            )

            setMovTitle("")
            setMovAmount("")
            setMovementMode(null)
        } catch (error: any) {
            toast.error(error.message || "Falha ao gravar o movimento.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // ==========================================
    // 5. APAGAR MOVIMENTO (DELETE REAL)
    // ==========================================
    async function handleDeleteMovement(id: string) {
        if (!confirm("Tens a certeza que queres eliminar este movimento do registo?")) return

        try {
            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/financial-records/${id}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Falha ao eliminar registo")

            refresh()
            toast.success("Movimento removido com sucesso.")
        } catch (error) {
            toast.error("Erro ao apagar o movimento.")
        }
    }

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins">

            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Pé de Meia (Fundo de Emergência)
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        A tua almofada financeira para imprevistos e total tranquilidade.
                    </p>
                </div>

                <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => {
                            setIsConfiguring((prev) => !prev)
                            setMovementMode(null)
                        }}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Configurar Almofada</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setMovementMode("deposit")
                            setMovTag("Reforço Mensal")
                            setIsConfiguring(false)
                        }}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Reforçar</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setMovementMode("withdrawal")
                            setMovTag("Imprevisto Doméstico")
                            setIsConfiguring(false)
                        }}
                        className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                        <Minus className="w-4 h-4" />
                        <span>Usar Reserva</span>
                    </button>
                </div>
            </div>

            {/* PAINEL DE CONFIGURAÇÃO */}
            {isConfiguring && (
                <Card className="border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                            Dimensionar a Almofada Financeira
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
                                    {isSubmitting ? "A guardar..." : `Atualizar Alvo (€ ${(parseFloat(tempCost || "0") * parseInt(tempMonths || "6", 10)).toLocaleString("pt-PT")})`}
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

            {/* PAINEL DE REGISTO DE ENTRADAS OU SAÍDAS */}
            {movementMode && (
                <Card
                    className={`shadow-sm animate-in fade-in slide-in-from-top-4 ${
                        movementMode === "deposit"
                            ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10"
                            : "border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/10"
                    }`}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                            {movementMode === "deposit"
                                ? "Reforçar o Pé de Meia (Entrada)"
                                : "Utilizar Fundo de Emergência (Saída)"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {movementMode === "deposit"
                                ? "Transfere montantes da tua conta corrente para reforçar a almofada."
                                : "Regista saídas estritamente destinadas a imprevistos reais ou emergências."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddMovement} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Motivo</label>
                                <select
                                    value={movTag}
                                    onChange={(e) => setMovTag(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                >
                                    {movementMode === "deposit" ? (
                                        <>
                                            <option value="Reforço Mensal">📅 Poupança do Mês</option>
                                            <option value="Ganho Extra">✨ Ganho Extra / Subsídio</option>
                                            <option value="Sobra Orçamental">🪙 Sobra do Orçamento</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Saúde e Farmácia">🏥 Saúde / Farmácia</option>
                                            <option value="Imprevisto Doméstico">🔧 Avaria Urgente (Casa/Carro)</option>
                                            <option value="Quebra de Rendimento">📉 Quebra de Rendimento</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                                <input
                                    type="text"
                                    placeholder={movementMode === "deposit" ? "Ex: Reforço após salário" : "Ex: Reparação caldeira"}
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
                                    {(paymentMethods || []).map((pm: any) => (
                                        <option key={pm.id} value={pm.id}>{pm.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-1 h-9 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 ${
                                        movementMode === "deposit"
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : "bg-amber-600 hover:bg-amber-700"
                                    }`}
                                >
                                    {isSubmitting ? "A gravar..." : "Confirmar"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMovementMode(null)}
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

                {/* Cartão 1: Saldo Acumulado */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                                <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            Saldo no Pé de Meia
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold @[220px]:text-2xl @[320px]:text-3xl text-slate-900 dark:text-slate-100">
                            € {currentBalance.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {completionPct}% da almofada recomendada (€ {idealPillowTarget.toLocaleString("pt-PT")})
                        </span>
                    </CardContent>
                </Card>

                {/* Cartão 2: Autonomia Garantida */}
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

                {/* Cartão 3: Fluxo da Reserva */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                <HeartHandshake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            Fluxo da Reserva
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col justify-center gap-2 my-auto">
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40">
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-0.5">
                                    <ArrowUpRight className="w-3 h-3" /> Entradas
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                    + € {totalDeposits.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
                                <span className="text-[10px] text-amber-700 dark:text-amber-300 flex items-center justify-center gap-0.5">
                                    <ArrowDownRight className="w-3 h-3" /> Saídas
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300">
                                    - € {totalWithdrawals.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* SEÇÃO PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Coluna Esquerda: Termómetro & Educação Financeira */}
                <Card className="lg:col-span-5 flex flex-col justify-between py-4 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            Estado da Tua Almofada
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Baseado num custo essencial de € {monthlyEssentialCost}/mês durante {targetMonths} meses.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5 my-auto">
                        <div className="flex flex-col items-center text-center gap-2 pt-2">
                            <div className="relative flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shadow-inner">
                                    <PiggyBank className="w-8 h-8 text-emerald-600 dark:text-emerald-400 stroke-[1.75]" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                                    <ShieldCheck className="w-4 h-4 text-teal-500" />
                                </div>
                            </div>

                            <div className="w-full space-y-1.5 pt-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-emerald-700 dark:text-emerald-400">
                                        Guardado: € {currentBalance.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-muted-foreground">
                                        Meta: € {idealPillowTarget.toLocaleString("pt-PT")}
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
                                    Quando reforçar (Entradas)?
                                </p>
                                <p className="text-muted-foreground">
                                    Sempre que recebes salário, subsídios ou sobras de fim do mês.
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 text-xs space-y-1">
                                <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    Quando usar (Saídas)?
                                </p>
                                <p className="text-muted-foreground">
                                    Apenas para urgências comprovadas (saúde, quebra de rendimento ou reparações essenciais).
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Coluna Direita: Histórico de Movimentos Reais */}
                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                Registo de Entradas e Saídas
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Movimentos financeiros reais associados ao teu Fundo de Emergência.
                            </CardDescription>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {movements.length} movimentos
                        </span>
                    </CardHeader>

                    <CardContent className="space-y-2.5">
                        {movements.length === 0 && (
                            <p className="text-center text-xs text-muted-foreground py-8">
                                Ainda não há movimentos registados no teu Pé de Meia.
                            </p>
                        )}
                        {movements.map((mov) => (
                            <div
                                key={mov.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2 rounded-md ${
                                            mov.type === "deposit"
                                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                                : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                        }`}
                                    >
                                        {mov.type === "deposit" ? (
                                            <ArrowUpRight className="w-4 h-4" />
                                        ) : (
                                            <ArrowDownRight className="w-4 h-4" />
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {mov.title}
                                            </p>
                                            <span
                                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                                    mov.type === "deposit"
                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                                }`}
                                            >
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
                                    <span
                                        className={`text-sm sm:text-base font-bold ${
                                            mov.type === "deposit"
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-amber-600 dark:text-amber-400"
                                        }`}
                                    >
                                        {mov.type === "deposit" ? "+" : "-"} €{" "}
                                        {mov.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
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
                        ))}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
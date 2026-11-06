"use client"

import { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Landmark,
    CreditCard,
    Car,
    Plus,
    Calendar,
    CheckCircle2,
    Flame,
    History,
    Trash2,
    TrendingDown,
    ShieldAlert,
    Sparkles,
    ArrowDownRight,
} from "lucide-react"

type DebtCategory = "credit_card" | "personal_auto" | "housing_other"
type PayoffStrategy = "avalanche" | "snowball"

interface DebtItem {
    id: string
    title: string
    totalAmount: number
    remainingAmount: number
    monthlyPayment: number
    interestRate: number // TAEG / Juro anual (%)
    category: DebtCategory
}

interface DebtHistoryLog {
    id: string
    debtTitle: string
    amountPaid: number
    date: string
    type: "installment" | "extra_payoff" | "settled"
}

export default function FinancialDebtsPage() {
    // Estratégia pedagógica de ordenação (Avalanche vs Bola de Neve)
    const [strategy, setStrategy] = useState<PayoffStrategy>("avalanche")

    // Controlo do formulário para adicionar nova dívida (Ponto 1)
    const [isAdding, setIsAdding] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newTotal, setNewTotal] = useState("")
    const [newRemaining, setNewRemaining] = useState("")
    const [newMonthly, setNewMonthly] = useState("")
    const [newInterest, setNewInterest] = useState("")
    const [newCategory, setNewCategory] = useState<DebtCategory>("credit_card")

    // 1. Dívidas Ativas
    const [debts, setDebts] = useState<DebtItem[]>([
        {
            id: "d1",
            title: "Cartão de Crédito (Plafond Usado)",
            totalAmount: 1500,
            remainingAmount: 850,
            monthlyPayment: 85,
            interestRate: 18.5,
            category: "credit_card",
        },
        {
            id: "d2",
            title: "Crédito Automóvel",
            totalAmount: 9000,
            remainingAmount: 4200,
            monthlyPayment: 195,
            interestRate: 7.2,
            category: "personal_auto",
        },
        {
            id: "d3",
            title: "Pagamento Fracionado (Telemóvel)",
            totalAmount: 600,
            remainingAmount: 200,
            monthlyPayment: 50,
            interestRate: 0,
            category: "housing_other",
        },
    ])

    // 3. Histórico de Pagamentos e Dívidas Liquidadas
    const [historyLogs, setHistoryLogs] = useState<DebtHistoryLog[]>([
        {
            id: "h1",
            debtTitle: "Cartão de Crédito (Plafond Usado)",
            amountPaid: 85,
            date: "2026-10-05",
            type: "installment",
        },
        {
            id: "h2",
            debtTitle: "Crédito Automóvel",
            amountPaid: 195,
            date: "2026-10-02",
            type: "installment",
        },
        {
            id: "h3",
            debtTitle: "Empréstimo Pessoal Pequeno",
            amountPaid: 1200,
            date: "2026-08-20",
            type: "settled",
        },
    ])

    // 2. Cálculos para a Visão Geral
    const totalOriginalDebt = debts.reduce((acc, d) => acc + d.totalAmount, 0)
    const totalRemainingDebt = debts.reduce((acc, d) => acc + d.remainingAmount, 0)
    const totalPaidSoFar = Math.max(0, totalOriginalDebt - totalRemainingDebt)
    const payoffPercentage =
        totalOriginalDebt > 0
            ? Math.min(Math.round((totalPaidSoFar / totalOriginalDebt) * 100), 100)
            : 100

    const totalMonthlyInstallments = debts.reduce((acc, d) => acc + d.monthlyPayment, 0)

    // Ordenação dinâmica segundo a estratégia escolhida
    const sortedDebts = [...debts].sort((a, b) => {
        if (strategy === "avalanche") {
            // Maior taxa de juro primeiro
            return b.interestRate - a.interestRate
        }
        // Bola de Neve: Menor saldo devedor primeiro
        return a.remainingAmount - b.remainingAmount
    })

    const priorityDebt = sortedDebts[0]

    // 1. Adicionar nova dívida
    function handleAddDebt(e: React.FormEvent) {
        e.preventDefault()
        const total = parseFloat(newTotal)
        const remaining = parseFloat(newRemaining) || total
        const monthly = parseFloat(newMonthly)
        const interest = parseFloat(newInterest) || 0

        if (!newTitle.trim() || isNaN(total) || total <= 0 || isNaN(monthly) || monthly <= 0) {
            return
        }

        const item: DebtItem = {
            id: crypto.randomUUID(),
            title: newTitle,
            totalAmount: total,
            remainingAmount: Math.min(remaining, total),
            monthlyPayment: monthly,
            interestRate: Math.max(0, interest),
            category: newCategory,
        }

        setDebts((prev) => [...prev, item])
        setNewTitle("")
        setNewTotal("")
        setNewRemaining("")
        setNewMonthly("")
        setNewInterest("")
        setIsAdding(false)
    }

    // Abater valor na dívida (Prestação normal ou Amortização Extra) e registar no Histórico
    function handleMakePayment(debt: DebtItem, amount: number, isExtra: boolean) {
        const actualPayment = Math.min(debt.remainingAmount, amount)
        const newRemaining = debt.remainingAmount - actualPayment
        const today = new Date().toISOString().split("T")[0]

        if (newRemaining <= 0) {
            // Dívida ficou 100% liquidada! Remove das ativas e regista como liquidada no histórico
            setDebts((prev) => prev.filter((d) => d.id !== debt.id))
            setHistoryLogs((prev) => [
                {
                    id: crypto.randomUUID(),
                    debtTitle: debt.title,
                    amountPaid: actualPayment,
                    date: today,
                    type: "settled",
                },
                ...prev,
            ])
        } else {
            // Atualiza o saldo em falta e adiciona entrada ao histórico
            setDebts((prev) =>
                prev.map((d) =>
                    d.id === debt.id ? { ...d, remainingAmount: newRemaining } : d
                )
            )
            setHistoryLogs((prev) => [
                {
                    id: crypto.randomUUID(),
                    debtTitle: debt.title,
                    amountPaid: actualPayment,
                    date: today,
                    type: isExtra ? "extra_payoff" : "installment",
                },
                ...prev,
            ])
        }
    }

    function handleDeleteDebt(id: string) {
        setDebts((prev) => prev.filter((d) => d.id !== id))
    }

    return (
        // h-full overflow-y-auto permite o scroll dentro do teu <main className="overflow-hidden">
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins">

            {/* CABEÇALHO + SELETOR DE ESTRATÉGIA + BOTÃO ADICIONAR DÍVIDA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Gestão de Dívidas e Créditos
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Organiza prestações, reduz juros e acelera a tua liberdade financeira.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Seletor Educativo: Método Avalanche vs Bola de Neve */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setStrategy("avalanche")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                strategy === "avalanche"
                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                                    : "text-muted-foreground hover:text-slate-900"
                            }`}
                            title="Prioriza a dívida com maior taxa de juro"
                        >
                            Método Avalanche
                        </button>
                        <button
                            type="button"
                            onClick={() => setStrategy("snowball")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                strategy === "snowball"
                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                                    : "text-muted-foreground hover:text-slate-900"
                            }`}
                            title="Prioriza a dívida mais pequena para ganhar motivação"
                        >
                            Bola de Neve
                        </button>
                    </div>

                    {/* 1. Botão para Adicionar Dívida */}
                    <button
                        type="button"
                        onClick={() => setIsAdding((prev) => !prev)}
                        className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Registar Dívida</span>
                    </button>
                </div>
            </div>

            {/* PAINEL EXPANSÍVEL PARA ADICIONAR NOVA DÍVIDA */}
            {isAdding && (
                <Card className="border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/10 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold">
                            Adicionar Crédito ou Dívida
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Inclui a taxa de juro (TAEG) para a aplicação calcular qual deves abater primeiro.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddDebt} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value as DebtCategory)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs sm:text-sm"
                                >
                                    <option value="credit_card">💳 Cartão de Crédito</option>
                                    <option value="personal_auto">🚗 Pessoal / Automóvel</option>
                                    <option value="housing_other">🏦 Habitação / Outro</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Identificação</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Cartão Universo, Carro..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Valor Inicial (€)</label>
                                <input
                                    type="number"
                                    step="1"
                                    placeholder="2000"
                                    value={newTotal}
                                    onChange={(e) => setNewTotal(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Falta Pagar (€)</label>
                                <input
                                    type="number"
                                    step="1"
                                    placeholder="1200"
                                    value={newRemaining}
                                    onChange={(e) => setNewRemaining(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex gap-2">
                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-xs font-medium text-muted-foreground">Prestação (€)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        placeholder="80"
                                        value={newMonthly}
                                        onChange={(e) => setNewMonthly(e.target.value)}
                                        className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs sm:text-sm"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1 w-20">
                                    <label className="text-xs font-medium text-muted-foreground">Juro (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="15.0"
                                        value={newInterest}
                                        onChange={(e) => setNewInterest(e.target.value)}
                                        className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 h-9 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer"
                                >
                                    Guardar
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

            {/* 2. VISÃO GERAL (3 CARTÕES DE TOPO COM ESTÉTICA UNIFORME) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Cartão 1: Saldo Devedor Total + Progresso de Abate */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                                <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            Dívida Total em Falta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-2 my-auto">
                        <div className="text-2xl font-bold @[220px]:text-2xl @[320px]:text-3xl text-slate-900 dark:text-slate-100">
                            € {totalRemainingDebt.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="w-full max-w-[200px] h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${payoffPercentage}%` }}
                            />
                        </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {payoffPercentage}% do capital inicial já foi abatido
                        </span>
                    </CardContent>
                </Card>

                {/* Cartão 2: Encargo Mensal com Prestações */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                                <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            Encargo Mensal Fixo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold @[220px]:text-2xl @[320px]:text-3xl text-slate-900 dark:text-slate-100">
                            € {totalMonthlyInstallments.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                            <span className="text-xs font-normal text-muted-foreground"> /mês</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Soma de {debts.length} prestações ativas todos os meses
                        </span>
                    </CardContent>
                </Card>

                {/* Cartão 3: Alvo Prioritário Recomendado */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-md">
                                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            </div>
                            Prioridade de Abate ({strategy === "avalanche" ? "Juro" : "Saldo"})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        {priorityDebt ? (
                            <>
                                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                                    {priorityDebt.title}
                                </div>
                                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                    {strategy === "avalanche"
                                        ? `Taxa mais cara (${priorityDebt.interestRate}% TAEG)`
                                        : `Mais rápida de eliminar (€ ${priorityDebt.remainingAmount} restantes)`}
                                </span>
                            </>
                        ) : (
                            <span className="text-sm font-semibold text-emerald-600">
                                Parabéns! Não tens dívidas ativas.
                            </span>
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* LINHA 2: 1. GERIR DÍVIDAS (ESQUERDA) + 3. HISTÓRICO (DIREITA) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 1. Gerir Dívidas Ativas (7 colunas) */}
                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                Plano de Liquidação de Dívidas
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Ordenado pelo método <strong>{strategy === "avalanche" ? "Avalanche (poupas mais em juros)" : "Bola de Neve (eliminas parcelas mais rápido)"}</strong>.
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {sortedDebts.map((debt, index) => {
                            const paidAmount = Math.max(0, debt.totalAmount - debt.remainingAmount)
                            const paidPct = Math.min(Math.round((paidAmount / debt.totalAmount) * 100), 100)
                            const monthsLeft = Math.ceil(debt.remainingAmount / Math.max(1, debt.monthlyPayment))
                            const isPriority = index === 0

                            return (
                                <div
                                    key={debt.id}
                                    className={`p-4 rounded-xl border space-y-3 transition-all ${
                                        isPriority
                                            ? "border-amber-300 dark:border-amber-700/70 bg-amber-50/30 dark:bg-amber-950/15"
                                            : "border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`p-2 rounded-lg mt-0.5 ${
                                                    debt.category === "credit_card"
                                                        ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600"
                                                        : debt.category === "personal_auto"
                                                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                                                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                                                }`}
                                            >
                                                {debt.category === "credit_card" && <CreditCard className="w-4 h-4" />}
                                                {debt.category === "personal_auto" && <Car className="w-4 h-4" />}
                                                {debt.category === "housing_other" && <Landmark className="w-4 h-4" />}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                                                        {debt.title}
                                                    </h3>
                                                    {isPriority && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                                            <Sparkles className="w-2.5 h-2.5" />
                                                            Foco #1
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                                            debt.interestRate >= 12
                                                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                        }`}
                                                    >
                                                        {debt.interestRate > 0 ? `TAEG ${debt.interestRate}%` : "0% Juros"}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Prestação: <strong>€ {debt.monthlyPayment}/mês</strong> • Restam aprox. {monthsLeft} prestações
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                                                € {debt.remainingAmount.toLocaleString("pt-PT")}
                                            </span>
                                            <span className="block text-[10px] text-muted-foreground">
                                                de € {debt.totalAmount.toLocaleString("pt-PT")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Barra de Progresso de Liquidação (Psicologia Positiva: Verde à medida que abate) */}
                                    <div className="space-y-1">
                                        <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${paidPct}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[11px] text-muted-foreground">
                                            <span>Já abatido: € {paidAmount.toLocaleString("pt-PT")} ({paidPct}%)</span>
                                            <span>Em falta: € {debt.remainingAmount.toLocaleString("pt-PT")}</span>
                                        </div>
                                    </div>

                                    {/* Botões de Ação para Gerir a Dívida */}
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleMakePayment(debt, debt.monthlyPayment, false)}
                                                className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                                            >
                                                Pagar Prestação (€ {debt.monthlyPayment})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMakePayment(debt, 50, true)}
                                                className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-100 hover:bg-amber-200/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
                                            >
                                                Amortizar + € 50
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDebt(debt.id)}
                                            aria-label="Remover dívida"
                                            className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                {/* 3. HISTÓRICO DE PAGAMENTOS E DÍVIDAS LIQUIDADAS (5 colunas) */}
                <Card className="lg:col-span-5 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                Histórico de Abates
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Registo de prestações pagas, amortizações extra e créditos extintos.
                            </CardDescription>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {historyLogs.length} registos
                        </span>
                    </CardHeader>

                    <CardContent className="space-y-2.5">
                        {historyLogs.map((log) => (
                            <div
                                key={log.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                    log.type === "settled"
                                        ? "border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/15"
                                        : "border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2 rounded-md ${
                                            log.type === "settled"
                                                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600"
                                                : log.type === "extra_payoff"
                                                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                        }`}
                                    >
                                        {log.type === "settled" ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : (
                                            <ArrowDownRight className="w-4 h-4" />
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {log.debtTitle}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                {log.type === "settled"
                                                    ? "🎉 Dívida 100% Liquidada"
                                                    : log.type === "extra_payoff"
                                                        ? "⚡ Amortização Extra"
                                                        : "Prestação Mensal"}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(log.date).toLocaleDateString("pt-PT")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                    - € {log.amountPaid.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
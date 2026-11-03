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
} from "lucide-react"

type ExpenseCategory = "essential" | "subscription" | "spontaneous"

interface ExpenseItem {
    id: string
    title: string
    amount: number
    category: ExpenseCategory
    date: string
    recurring: boolean
}

export default function ExpensesPage() {
    // 2. Alternador de Visualização Mensal / Anual
    const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly")

    // Controlo do formulário rápido para adicionar despesas
    const [isAdding, setIsAdding] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newAmount, setNewAmount] = useState("")
    const [newCategory, setNewCategory] = useState<ExpenseCategory>("spontaneous")

    // Dados iniciais de exemplo (Despesas Fixas, Subscrições e Espontâneas)
    const [expenses, setExpenses] = useState<ExpenseItem[]>([
        {
            id: "1",
            title: "Renda / Prestação da Casa",
            amount: 550,
            category: "essential",
            date: "2026-10-01",
            recurring: true,
        },
        {
            id: "2",
            title: "Eletricidade, Água e Net",
            amount: 95,
            category: "essential",
            date: "2026-10-05",
            recurring: true,
        },
        {
            id: "3",
            title: "Streaming (Netflix + Spotify)",
            amount: 24,
            category: "subscription",
            date: "2026-10-08",
            recurring: true,
        },
        {
            id: "4",
            title: "Jantar fora de última hora",
            amount: 38,
            category: "spontaneous",
            date: "2026-10-16",
            recurring: false,
        },
        {
            id: "5",
            title: "Compra por impulso (Roupa)",
            amount: 65,
            category: "spontaneous",
            date: "2026-10-20",
            recurring: false,
        },
    ])

    // Na vista anual, multiplicamos os custos recorrentes por 12 para mostrar o impacto real ao ano
    const multiplier = viewMode === "annual" ? 12 : 1

    const essentialTotal =
        expenses
            .filter((e) => e.category === "essential")
            .reduce((acc, curr) => acc + curr.amount, 0) * multiplier

    const subscriptionTotal =
        expenses
            .filter((e) => e.category === "subscription")
            .reduce((acc, curr) => acc + curr.amount, 0) * multiplier

    // Para despesas espontâneas na vista anual, projetamos o ritmo atual (* 12) para alertar o utilizador
    const spontaneousRaw = expenses
        .filter((e) => e.category === "spontaneous")
        .reduce((acc, curr) => acc + curr.amount, 0)

    const spontaneousTotal = spontaneousRaw * multiplier

    const totalExpenses = essentialTotal + subscriptionTotal + spontaneousTotal

    // Cálculo de percentagens para o Relatório de Despesas (Ponto 5)
    const essentialPct =
        totalExpenses > 0 ? Math.round((essentialTotal / totalExpenses) * 100) : 0
    const subscriptionPct =
        totalExpenses > 0 ? Math.round((subscriptionTotal / totalExpenses) * 100) : 0
    const spontaneousPct =
        totalExpenses > 0 ? Math.max(0, 100 - essentialPct - subscriptionPct) : 0

    function handleAddExpense(e: React.FormEvent) {
        e.preventDefault()
        const parsedAmount = parseFloat(newAmount)
        if (!newTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return

        const newItem: ExpenseItem = {
            id: crypto.randomUUID(),
            title: newTitle,
            amount: parsedAmount,
            category: newCategory,
            date: new Date().toISOString().split("T")[0],
            recurring: newCategory !== "spontaneous",
        }

        setExpenses((prev) => [newItem, ...prev])
        setNewTitle("")
        setNewAmount("")
        setIsAdding(false)
    }

    function handleDelete(id: string) {
        setExpenses((prev) => prev.filter((item) => item.id !== id))
    }

    return (
        // h-full overflow-y-auto garante o scroll suave dentro do DashboardLayout
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins">

            {/* CABEÇALHO DA PÁGINA + TOGGLE MENSAL/ANUAL + BOTÃO ADICIONAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Despesas e Gastos
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Controla os teus custos fixos, subscrições e compras espontâneas.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* 2. Seletor Mensal / Anual */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setViewMode("monthly")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                viewMode === "monthly"
                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                                    : "text-muted-foreground hover:text-slate-900"
                            }`}
                        >
                            Mensal
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("annual")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                viewMode === "annual"
                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                                    : "text-muted-foreground hover:text-slate-900"
                            }`}
                        >
                            Impacto Anual
                        </button>
                    </div>

                    {/* 3. Botão para Adicionar Despesa / Gasto Espontâneo */}
                    <button
                        type="button"
                        onClick={() => setIsAdding((prev) => !prev)}
                        className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Registar Gasto</span>
                    </button>
                </div>
            </div>

            {/* PAINEL RÁPIDO PARA ADICIONAR DESPESA (COM FOCO EM DESPESAS ESPONTÂNEAS) */}
            {isAdding && (
                <Card className="border-rose-200 dark:border-rose-800/60 bg-rose-50/30 dark:bg-rose-950/10 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                            Registar Saída de Dinheiro
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Classifica o gasto para perceberes se foi uma necessidade ou um impulso do momento.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Tipo de Despesa</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value as ExpenseCategory)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                >
                                    <option value="spontaneous">🛍️ Espontânea / Impulso</option>
                                    <option value="essential">🏠 Essencial Fixa (Casa/Contas)</option>
                                    <option value="subscription">🔄 Subscrição / Mensalidade</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">O que compraste?</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Jantar fora, Renda, Netflix..."
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

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer"
                                >
                                    Adicionar
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

            {/* LINHA 1: 3 CARTÕES DE RESUMO (MESMA ESTÉTICA DOS COMPONENTES DA DASHBOARD) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Cartão 1: Total de Gastos */}
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

                {/* Cartão 2: Peso dos Gastos Espontâneos + Subscrições */}
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

                {/* Cartão 3: 5. Relatório de Despesas ( Termómetro de Consumo ) */}
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
                        {/* Barra tricolor que mostra o peso de cada tipo de despesa */}
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                                style={{ width: `${essentialPct}%` }}
                                className="bg-blue-500 h-full transition-all duration-500"
                                title="Essenciais"
                            />
                            <div
                                style={{ width: `${subscriptionPct}%` }}
                                className="bg-purple-500 h-full transition-all duration-500"
                                title="Subscrições"
                            />
                            <div
                                style={{ width: `${spontaneousPct}%` }}
                                className="bg-rose-500 h-full transition-all duration-500"
                                title="Espontâneas"
                            />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Fixas ({essentialPct}%)
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                Subscr. ({subscriptionPct}%)
                            </span>
                            <span className="flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                Impulso ({spontaneousPct}%)
                            </span>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* LINHA 2: GERIR CATEGORIAS DE DESPESA (ESQUERDA) + HISTÓRICO DE DESPESAS (DIREITA) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 1. Gerir Despesas por Natureza (5 colunas) */}
                <Card className="lg:col-span-5 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Home className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            Estrutura de Gastos
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Percebe onde podes cortar caso precises de poupar mais.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">

                        {/* Bloco 1: Despesas Fixas Essenciais */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Essenciais e Habitação
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Custos obrigatórios do mês
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                € {essentialTotal.toLocaleString("pt-PT")}
                            </span>
                        </div>

                        {/* Bloco 2: Subscrições Recorrentes */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Repeat className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Subscrições e Serviços
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Débitos automáticos silenciosos
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                € {subscriptionTotal.toLocaleString("pt-PT")}
                            </span>
                        </div>

                        {/* Bloco 3: Despesas Espontâneas (Alerta Pedagógico) */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-rose-200/60 dark:border-rose-800/40 bg-rose-50/30 dark:bg-rose-950/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
                                    <ShoppingBag className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Despesas Espontâneas
                                    </p>
                                    <p className="text-xs text-rose-700 dark:text-rose-400">
                                        Onde é mais fácil reduzir gastos
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                                - € {spontaneousTotal.toLocaleString("pt-PT")}
                            </span>
                        </div>

                    </CardContent>
                </Card>

                {/* 4. Histórico de Despesas (7 colunas) */}
                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                Histórico de Despesas
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Lista cronológica de todas as saídas de dinheiro.
                            </CardDescription>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {expenses.length} movimentos
                        </span>
                    </CardHeader>

                    <CardContent className="space-y-2.5">
                        {expenses.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2 rounded-md ${
                                            item.category === "essential"
                                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                                                : item.category === "subscription"
                                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600"
                                                    : "bg-rose-100 dark:bg-rose-900/30 text-rose-600"
                                        }`}
                                    >
                                        {item.category === "essential" && <Home className="w-4 h-4" />}
                                        {item.category === "subscription" && <Repeat className="w-4 h-4" />}
                                        {item.category === "spontaneous" && <ShoppingBag className="w-4 h-4" />}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {item.title}
                                            </p>
                                            {item.category === "spontaneous" ? (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center gap-1 border border-rose-200/50 dark:border-rose-800/40">
                                                    <AlertCircle className="w-2.5 h-2.5" />
                                                    Espontânea
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                    Recorrente
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(item.date).toLocaleDateString("pt-PT")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400">
                                        - € {item.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item.id)}
                                        aria-label="Remover despesa"
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
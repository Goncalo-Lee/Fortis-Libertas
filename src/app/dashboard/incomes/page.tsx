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
    CheckCircle2,
} from "lucide-react"

type IncomeCategory = "fixed" | "meal_card" | "extra"

interface IncomeItem {
    id: string
    title: string
    amount: number
    category: IncomeCategory
    date: string
    recurring: boolean
}

export default function IncomesPage() {
    // 2. Alternador de Visualização Mensal / Anual
    const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly")

    // Controlo do formulário rápido para adicionar rendimentos
    const [isAdding, setIsAdding] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newAmount, setNewAmount] = useState("")
    const [newCategory, setNewCategory] = useState<IncomeCategory>("extra")

    // Dados iniciais de exemplo (Fontes + Histórico do mês)
    const [incomes, setIncomes] = useState<IncomeItem[]>([
        {
            id: "1",
            title: "Vencimento Base (Empresa)",
            amount: 1350,
            category: "fixed",
            date: "2026-10-01",
            recurring: true,
        },
        {
            id: "2",
            title: "Cartão Refeição (Subsídio)",
            amount: 198,
            category: "meal_card",
            date: "2026-10-01",
            recurring: true,
        },
        {
            id: "3",
            title: "Projeto Freelance Design",
            amount: 250,
            category: "extra",
            date: "2026-10-14",
            recurring: false,
        },
        {
            id: "4",
            title: "Venda de artigos (Vinted)",
            amount: 45,
            category: "extra",
            date: "2026-10-19",
            recurring: false,
        },
    ])

    // Multiplicador para a vista Anual vs Mensal
    // Nota pedagógica: Ganhos recorrentes multiplicam por 12 (ou 14 no caso de salário, aqui simplificado a 12x para clareza visual), extras mantêm o acumulado registado
    const multiplier = viewMode === "annual" ? 12 : 1

    const fixedTotal =
        incomes
            .filter((i) => i.category === "fixed")
            .reduce((acc, curr) => acc + curr.amount, 0) * multiplier

    const mealCardTotal =
        incomes
            .filter((i) => i.category === "meal_card")
            .reduce((acc, curr) => acc + curr.amount, 0) * multiplier

    const extraTotal = incomes
        .filter((i) => i.category === "extra")
        .reduce((acc, curr) => acc + curr.amount, 0)

    const totalIncome = fixedTotal + mealCardTotal + extraTotal

    // Percentagens para o Relatório Mensal
    const fixedPercentage =
        totalIncome > 0
            ? Math.round(((fixedTotal + mealCardTotal) / totalIncome) * 100)
            : 0
    const extraPercentage = totalIncome > 0 ? 100 - fixedPercentage : 0

    function handleAddIncome(e: React.FormEvent) {
        e.preventDefault()
        const parsedAmount = parseFloat(newAmount)
        if (!newTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return

        const newItem: IncomeItem = {
            id: crypto.randomUUID(),
            title: newTitle,
            amount: parsedAmount,
            category: newCategory,
            date: new Date().toISOString().split("T")[0],
            recurring: newCategory !== "extra",
        }

        setIncomes((prev) => [newItem, ...prev])
        setNewTitle("")
        setNewAmount("")
        setIsAdding(false)
    }

    function handleDelete(id: string) {
        setIncomes((prev) => prev.filter((item) => item.id !== id))
    }

    return (
        // h-full overflow-y-auto permite fazer scroll dentro do teu <main className="overflow-hidden">
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins">

            {/* CABEÇALHO DA PÁGINA + TOGGLE MENSAL/ANUAL + BOTÃO ADICIONAR */}
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
                    {/* 2. Seletor Mensal / Anual */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setViewMode("monthly")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
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
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                viewMode === "annual"
                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                                    : "text-muted-foreground hover:text-slate-900"
                            }`}
                        >
                            Anual (Proj.)
                        </button>
                    </div>

                    {/* 3. Botão para Adicionar Rendimento / Ganho Extra */}
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

            {/* PAINEL RÁPIDO PARA ADICIONAR VENCIMENTO, CARTÃO OU GANHO EXTRA */}
            {isAdding && (
                <Card className="border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                            Registar Entrada de Dinheiro
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Escolhe se é um vencimento fixo, saldo em cartão refeição ou um ganho extra pontual.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddIncome} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Tipo de Ganho</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value as IncomeCategory)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                >
                                    <option value="extra">✨ Ganho Extra (Pontual)</option>
                                    <option value="fixed">💼 Vencimento / Renda Fixa</option>
                                    <option value="meal_card">💳 Cartão Refeição / Subsídio</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Horas extra, Salário, Vinted..."
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
                                    className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer"
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

            {/* LINHA 1: CARTÕES DE RESUMO (ESTÉTICA IGUAL AO SALDO DISPONÍVEL E POUPANÇAS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Cartão 1: Total de Rendimentos */}
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

                {/* Cartão 2: Fontes Fixas + Cartão Refeição */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            Base Garantida (Conta + Cartão)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1.5 my-auto">
                        <div className="text-xl font-bold @[220px]:text-xl @[320px]:text-2xl text-slate-900 dark:text-slate-100">
                            € {(fixedTotal + mealCardTotal).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>Conta: € {fixedTotal.toLocaleString("pt-PT")}</span>
                            <span>•</span>
                            <span>Cartão Ref.: € {mealCardTotal.toLocaleString("pt-PT")}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Cartão 3: 5. Relatório Mensal & Literacia Financeira (Regra 50/30/20) */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                                <PieChart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            Relatório de Distribuição Ideal
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

            {/* LINHA 2: GESTÃO DE FONTES DE RENDIMENTO (ESQUERDA) + HISTÓRICO DE GANHOS (DIREITA) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 1. Gerir Fontes de Rendimento (5 colunas) */}
                <Card className="lg:col-span-5 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            Fontes de Rendimento Ativas
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Como o teu dinheiro chega até ti todos os meses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">

                        {/* Bloco 1: Vencimento / Trabalho */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Trabalho / Vencimento
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Cai direto na Conta Principal
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                € {fixedTotal.toLocaleString("pt-PT")}
                            </span>
                        </div>

                        {/* Bloco 2: Cartão Refeição */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Cartão de Refeição
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Subsídio de Alimentação
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                € {mealCardTotal.toLocaleString("pt-PT")}
                            </span>
                        </div>

                        {/* Bloco 3: Ganhos Extra */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Rendimento Extra / Variável
                                    </p>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                        Ideal para reforçar as Poupanças
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                + € {extraTotal.toLocaleString("pt-PT")}
                            </span>
                        </div>

                    </CardContent>
                </Card>

                {/* 4. Histórico de Ganhos Registados (7 colunas) */}
                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                Histórico de Entradas
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Registo detalhado de todos os rendimentos recebidos.
                            </CardDescription>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {incomes.length} registos
                        </span>
                    </CardHeader>

                    <CardContent className="space-y-2.5">
                        {incomes.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2 rounded-md ${
                                            item.category === "fixed"
                                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                                                : item.category === "meal_card"
                                                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600"
                                                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                                        }`}
                                    >
                                        {item.category === "fixed" && <Briefcase className="w-4 h-4" />}
                                        {item.category === "meal_card" && <CreditCard className="w-4 h-4" />}
                                        {item.category === "extra" && <Sparkles className="w-4 h-4" />}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {item.title}
                                            </p>
                                            {item.recurring && (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                    <CheckCircle2 className="w-2.5 h-2.5 text-teal-500" />
                                                    Fixo
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
                                    <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                                        + € {item.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item.id)}
                                        aria-label="Remover registo"
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
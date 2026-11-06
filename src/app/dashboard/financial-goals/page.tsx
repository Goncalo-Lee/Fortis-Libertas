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
    Target,
    Trophy,
    Lightbulb,
    Plus,
    Calendar,
    CheckCircle2,
    Sparkles,
    Trash2,
    Clock,
    Award,
    TrendingUp,
} from "lucide-react"

type GoalHorizon = "short" | "medium" | "long"

interface GoalItem {
    id: string
    title: string
    targetAmount: number
    savedAmount: number
    monthsRemaining: number
    horizon: GoalHorizon
}

interface CompletedGoalItem {
    id: string
    title: string
    targetAmount: number
    completedDate: string
}

export default function FinancialGoalsPage() {
    // Controlo do formulário para criar nova meta (Ponto 1)
    const [isAdding, setIsAdding] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newTarget, setNewTarget] = useState("")
    const [newSaved, setNewSaved] = useState("")
    const [newMonths, setNewMonths] = useState("6")
    const [newHorizon, setNewHorizon] = useState<GoalHorizon>("short")

    // Metas Ativas (Ponto 1 e Ponto 3)
    const [activeGoals, setActiveGoals] = useState<GoalItem[]>([
        {
            id: "1",
            title: "Viagem de Férias (Verão)",
            targetAmount: 1200,
            savedAmount: 840,
            monthsRemaining: 4,
            horizon: "short",
        },
        {
            id: "2",
            title: "Portátil Novo para Trabalho",
            targetAmount: 1500,
            savedAmount: 450,
            monthsRemaining: 7,
            horizon: "medium",
        },
        {
            id: "3",
            title: "Entrada para Automóvel",
            targetAmount: 4000,
            savedAmount: 1600,
            monthsRemaining: 12,
            horizon: "long",
        },
    ])

    // 4. Histórico de Metas Concluídas
    const [completedGoals, setCompletedGoals] = useState<CompletedGoalItem[]>([
        {
            id: "c1",
            title: "Curso de Especialização",
            targetAmount: 450,
            completedDate: "2026-08-15",
        },
        {
            id: "c2",
            title: "Liquidar Cartão de Crédito",
            targetAmount: 800,
            completedDate: "2026-05-20",
        },
    ])

    // Cálculos Globais de Progresso (Ponto 3)
    const totalTarget = activeGoals.reduce((acc, g) => acc + g.targetAmount, 0)
    const totalSaved = activeGoals.reduce((acc, g) => acc + g.savedAmount, 0)
    const globalPercentage =
        totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0

    // Esforço mensal recomendado somando todas as metas ativas
    const totalMonthlyEffort = activeGoals.reduce((acc, g) => {
        const remaining = Math.max(0, g.targetAmount - g.savedAmount)
        return acc + remaining / Math.max(1, g.monthsRemaining)
    }, 0)

    // 1. Função para Criar Nova Meta
    function handleCreateGoal(e: React.FormEvent) {
        e.preventDefault()
        const target = parseFloat(newTarget)
        const saved = parseFloat(newSaved) || 0
        const months = parseInt(newMonths, 10) || 1

        if (!newTitle.trim() || isNaN(target) || target <= 0) return

        const newGoal: GoalItem = {
            id: crypto.randomUUID(),
            title: newTitle,
            targetAmount: target,
            savedAmount: Math.min(saved, target),
            monthsRemaining: Math.max(1, months),
            horizon: newHorizon,
        }

        setActiveGoals((prev) => [newGoal, ...prev])
        setNewTitle("")
        setNewTarget("")
        setNewSaved("")
        setNewMonths("6")
        setIsAdding(false)
    }

    // Função para reforçar saldo de uma meta (+50€) e testar a barra de progresso
    function handleReinforceGoal(id: string, amount: number) {
        setActiveGoals((prev) =>
            prev.map((goal) => {
                if (goal.id !== id) return goal
                const updatedSaved = Math.min(goal.targetAmount, goal.savedAmount + amount)
                return { ...goal, savedAmount: updatedSaved }
            })
        )
    }

    // Função para mover uma meta atingida para o Histórico de Metas
    function handleCompleteGoal(goal: GoalItem) {
        setActiveGoals((prev) => prev.filter((g) => g.id !== goal.id))
        setCompletedGoals((prev) => [
            {
                id: goal.id,
                title: goal.title,
                targetAmount: goal.targetAmount,
                completedDate: new Date().toISOString().split("T")[0],
            },
            ...prev,
        ])
    }

    function handleDeleteGoal(id: string) {
        setActiveGoals((prev) => prev.filter((g) => g.id !== id))
    }

    return (
        // h-full overflow-y-auto garante o scroll suave dentro do DashboardLayout
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins">

            {/* CABEÇALHO DA PÁGINA + BOTÃO CRIAR META */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Metas e Objetivos Financeiros
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Transforma os teus planos em objetivos concretos sem recorrer a dívidas.
                    </p>
                </div>

                {/* 1. Botão para Criar Novo Objetivo */}
                <button
                    type="button"
                    onClick={() => setIsAdding((prev) => !prev)}
                    className="flex items-center gap-1.5 self-start sm:self-auto bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>Criar Nova Meta</span>
                </button>
            </div>

            {/* 1. PAINEL EXPANSÍVEL PARA CRIAR OBJETIVO FINANCEIRO */}
            {isAdding && (
                <Card className="border-blue-200 dark:border-blue-800/60 bg-blue-50/30 dark:bg-blue-950/10 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold">
                            Definir Novo Objetivo Financeiro
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Uma boa meta tem sempre um valor claro e um prazo definido para saberes quanto guardar por mês.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateGoal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Nome da Meta</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Férias, Portátil, Carro..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Valor Alvo (€)</label>
                                <input
                                    type="number"
                                    step="1"
                                    placeholder="1000"
                                    value={newTarget}
                                    onChange={(e) => setNewTarget(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Já Poupado (€)</label>
                                <input
                                    type="number"
                                    step="1"
                                    placeholder="0 (Opcional)"
                                    value={newSaved}
                                    onChange={(e) => setNewSaved(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Prazo e Horizonte</label>
                                <div className="flex gap-1.5">
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={newMonths}
                                        onChange={(e) => setNewMonths(e.target.value)}
                                        className="h-9 w-16 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs sm:text-sm text-center"
                                        title="Meses até ao objetivo"
                                        required
                                    />
                                    <select
                                        value={newHorizon}
                                        onChange={(e) => setNewHorizon(e.target.value as GoalHorizon)}
                                        className="h-9 flex-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs"
                                    >
                                        <option value="short">Curto Prazo (meses)</option>
                                        <option value="medium">Médio Prazo (1-2 anos)</option>
                                        <option value="long">Longo Prazo (+2 anos)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer"
                                >
                                    Criar
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

            {/* LINHA 1: CARTÕES DE RESUMO (ESTÉTICA ALINHADA COM O RESTO DA DASHBOARD) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Cartão 1: 3. % de Progresso Global */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            Progresso Global ({globalPercentage}%)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-2 my-auto">
                        <div className="text-xl font-bold @[220px]:text-xl @[320px]:text-2xl text-slate-900 dark:text-slate-100">
                            € {totalSaved.toLocaleString("pt-PT")} <span className="text-xs font-normal text-muted-foreground">/ € {totalTarget.toLocaleString("pt-PT")}</span>
                        </div>
                        <div className="w-full max-w-[200px] h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${globalPercentage}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Cartão 2: Esforço Mensal Necessário (Educação Financeira) */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
                                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            Ritmo Mensal Necessário
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold @[220px]:text-2xl @[320px]:text-3xl text-slate-900 dark:text-slate-100">
                            € {Math.ceil(totalMonthlyEffort).toLocaleString("pt-PT")} <span className="text-xs font-normal text-muted-foreground">/mês</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Para cumprir todas as {activeGoals.length} metas dentro do prazo
                        </span>
                    </CardContent>
                </Card>

                {/* Cartão 3: Resumo de Metas Concluídas */}
                <Card className="@container flex flex-col justify-between py-3 shadow-sm">
                    <CardHeader className="pb-1 w-full">
                        <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                                <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            Objetivos Conquistados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-1 my-auto">
                        <div className="text-2xl font-bold @[220px]:text-2xl @[320px]:text-3xl text-slate-900 dark:text-slate-100">
                            {completedGoals.length} Metas
                        </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            € {completedGoals.reduce((acc, c) => acc + c.targetAmount, 0).toLocaleString("pt-PT")} realizados sem dívidas
                        </span>
                    </CardContent>
                </Card>

            </div>

            {/* LINHA 2: METAS ATIVAS COM % DE PROGRESSO (ESQUERDA) + DICAS E HISTÓRICO (DIREITA) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 1 & 3. Lista de Metas Ativas e Barras de % de Progresso (7 colunas) */}
                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                As Tuas Metas em Curso
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Acompanha a percentagem de conclusão e reforça os teus objetivos.
                            </CardDescription>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {activeGoals.length} ativas
                        </span>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {activeGoals.map((goal) => {
                            const pct = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100)
                            const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)
                            const monthlyNeeded = Math.ceil(remaining / Math.max(1, goal.monthsRemaining))
                            const isReadyToComplete = pct >= 100

                            return (
                                <div
                                    key={goal.id}
                                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 space-y-3 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                                                    {goal.title}
                                                </h3>
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
                                                    {goal.horizon === "short"
                                                        ? "Curto Prazo"
                                                        : goal.horizon === "medium"
                                                            ? "Médio Prazo"
                                                            : "Longo Prazo"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {isReadyToComplete
                                                    ? "Objetivo alcançado!"
                                                    : `Faltam € ${remaining.toLocaleString("pt-PT")} • Sugestão: € ${monthlyNeeded}/mês durante ${goal.monthsRemaining} meses`}
                                            </p>
                                        </div>

                                        {/* Etiqueta de % de Progresso */}
                                        <span
                                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                isReadyToComplete
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                            }`}
                                        >
                                            {pct}%
                                        </span>
                                    </div>

                                    {/* 3. Barra de % de Progresso */}
                                    <div className="w-full h-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                isReadyToComplete ? "bg-emerald-500" : "bg-blue-600 dark:bg-blue-500"
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>

                                    {/* Rodapé do Cartão da Meta: Valores + Ações Rápidas */}
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                            € {goal.savedAmount.toLocaleString("pt-PT")}{" "}
                                            <span className="font-normal text-muted-foreground">
                                                de € {goal.targetAmount.toLocaleString("pt-PT")}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!isReadyToComplete ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleReinforceGoal(goal.id, 50)}
                                                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                                                >
                                                    + € 50
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCompleteGoal(goal)}
                                                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Concluir Meta
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteGoal(goal.id)}
                                                aria-label="Eliminar meta"
                                                className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                {/* COLUNA DIREITA: 2. DICAS FINANCEIRAS + 4. HISTÓRICO DE METAS (5 colunas) */}
                <div className="lg:col-span-5 space-y-6">

                    {/* 2. Dicas e Aconselhamento Financeiro */}
                    <Card className="py-4 border-amber-200/70 dark:border-amber-800/40 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-md">
                                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                Aconselhamento Financeiro
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Dicas práticas para atingires os teus objetivos mais depressa.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs sm:text-sm">
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/50 dark:border-slate-800 space-y-1">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    1. Paga-te a ti próprio primeiro
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Assim que receberes o vencimento, transfere logo os <strong>€ {Math.ceil(totalMonthlyEffort)}</strong> para as tuas metas antes de começares a gastar no dia a dia.
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/50 dark:border-slate-800 space-y-1">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    2. Protege o teu Pé de Meia
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Nunca uses o fundo de emergência para comprar bens ou pagar férias. Mantém cada objetivo separado na sua própria meta.
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/50 dark:border-slate-800 space-y-1">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    3. Regra das 48 Horas
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Antes de fazeres uma despesa espontânea, espera 48 horas. Se perderes a vontade, coloca esse valor na tua meta mais próxima de 100%.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Histórico de Metas Concluídas */}
                    <Card className="py-4 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                Histórico de Metas Alcançadas
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Objetivos que já cumpriste com sucesso e planeamento.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {completedGoals.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {item.title}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Concluída em {new Date(item.completedDate).toLocaleDateString("pt-PT")}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                        € {item.targetAmount.toLocaleString("pt-PT")}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                </div>

            </div>
        </div>
    )
}
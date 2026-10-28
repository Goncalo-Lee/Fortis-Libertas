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
} from "lucide-react"

type MovementType = "deposit" | "withdrawal"

interface PillowMovement {
    id: string
    title: string
    amount: number
    type: MovementType
    date: string
    categoryTag: string
}

export default function MoneyPillowPage() {
    // 1. Estado da Criação / Configuração do Pé de Meia
    const [monthlyEssentialCost, setMonthlyEssentialCost] = useState(750)
    const [targetMonths, setTargetMonths] = useState(6)
    const [isConfiguring, setIsConfiguring] = useState(false)

    // Inputs temporários do configurador
    const [tempCost, setTempCost] = useState("750")
    const [tempMonths, setTempMonths] = useState("6")

    // Controlo do formulário de Entradas e Saídas (Ponto 3)
    const [movementMode, setMovementMode] = useState<MovementType | null>(null)
    const [movTitle, setMovTitle] = useState("")
    const [movAmount, setMovAmount] = useState("")
    const [movTag, setMovTag] = useState("Reforço Mensal")

    // 3. Histórico de Entradas e Saídas (a soma dita o saldo atual)
    const [movements, setMovements] = useState<PillowMovement[]>([
        {
            id: "m1",
            title: "Transferência Automática Mensal",
            amount: 200,
            type: "deposit",
            date: "2026-10-02",
            categoryTag: "Reforço Mensal",
        },
        {
            id: "m2",
            title: "Arranjo urgente da máquina de lavar",
            amount: 130,
            type: "withdrawal",
            date: "2026-09-18",
            categoryTag: "Imprevisto Doméstico",
        },
        {
            id: "m3",
            title: "Parte do Subsídio de Férias",
            amount: 650,
            type: "deposit",
            date: "2026-08-05",
            categoryTag: "Ganho Extra",
        },
        {
            id: "m4",
            title: "Poupança Base Inicial",
            amount: 2700,
            type: "deposit",
            date: "2026-06-01",
            categoryTag: "Depósito Inicial",
        },
    ])

    // 2. Cálculos da Visão Geral
    const totalDeposits = movements
        .filter((m) => m.type === "deposit")
        .reduce((acc, curr) => acc + curr.amount, 0)

    const totalWithdrawals = movements
        .filter((m) => m.type === "withdrawal")
        .reduce((acc, curr) => acc + curr.amount, 0)

    const currentBalance = Math.max(0, totalDeposits - totalWithdrawals)
    const idealPillowTarget = monthlyEssentialCost * targetMonths

    // Quantos meses de despesas essenciais este Pé de Meia já cobre
    const monthsCovered =
        monthlyEssentialCost > 0
            ? Number((currentBalance / monthlyEssentialCost).toFixed(1))
            : 0

    const completionPct =
        idealPillowTarget > 0
            ? Math.min(Math.round((currentBalance / idealPillowTarget) * 100), 100)
            : 0

    // Nível de segurança de 1 a 5 (idêntico ao componente AccountVault da Dashboard)
    const securityLevel = Math.min(5, Math.max(1, Math.ceil((completionPct / 100) * 5)))

    // 1. Guardar Configuração do Pé de Meia
    function handleSaveConfig(e: React.FormEvent) {
        e.preventDefault()
        const parsedCost = parseFloat(tempCost)
        const parsedMonths = parseInt(tempMonths, 10)
        if (!isNaN(parsedCost) && parsedCost > 0) {
            setMonthlyEssentialCost(parsedCost)
        }
        if (!isNaN(parsedMonths) && parsedMonths > 0) {
            setTargetMonths(parsedMonths)
        }
        setIsConfiguring(false)
    }

    // 3. Registar Entrada (Reforço) ou Saída (Uso de Emergência)
    function handleAddMovement(e: React.FormEvent) {
        e.preventDefault()
        if (!movementMode) return

        const parsedAmount = parseFloat(movAmount)
        if (!movTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return

        // Impede levantar mais do que o saldo disponível no Pé de Meia
        const finalAmount =
            movementMode === "withdrawal"
                ? Math.min(currentBalance, parsedAmount)
                : parsedAmount

        if (finalAmount <= 0) return

        const newEntry: PillowMovement = {
            id: crypto.randomUUID(),
            title: movTitle,
            amount: finalAmount,
            type: movementMode,
            date: new Date().toISOString().split("T")[0],
            categoryTag: movTag,
        }

        setMovements((prev) => [newEntry, ...prev])
        setMovTitle("")
        setMovAmount("")
        setMovementMode(null)
    }

    function handleDeleteMovement(id: string) {
        setMovements((prev) => prev.filter((m) => m.id !== id))
    }

    return (
        // h-full overflow-y-auto garante o scroll suave dentro do DashboardLayout
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 space-y-6 font-poppins">

            {/* CABEÇALHO + BOTÕES DE AÇÃO (CONFIGURAR, REFORÇAR, USAR) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Pé de Meia (Money Pillow)
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        A tua almofada financeira para imprevistos e total paz de espírito.
                    </p>
                </div>

                <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
                    {/* 1. Botão para Configurar/Criar parâmetros do Pé de Meia */}
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

                    {/* 3. Botão de Entrada (Reforçar) */}
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

                    {/* 3. Botão de Saída (Usar Emergência) */}
                    <button
                        type="button"
                        onClick={() => {
                            setMovementMode("withdrawal")
                            setMovTag("Imprevisto Médico / Saúde")
                            setIsConfiguring(false)
                        }}
                        className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                        <Minus className="w-4 h-4" />
                        <span>Usar Reserva</span>
                    </button>
                </div>
            </div>

            {/* 1. PAINEL DE CRIAÇÃO / DIMENSIONAMENTO DO PÉ DE MEIA */}
            {isConfiguring && (
                <Card className="border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                            Dimensionar o teu Pé de Meia Ideal
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Na literacia financeira, uma boa almofada deve cobrir entre 3 a 6 meses das tuas despesas essenciais fixas.
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
                                    className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer"
                                >
                                    Atualizar Meta (€ {(parseFloat(tempCost || "0") * parseInt(tempMonths || "6", 10)).toLocaleString("pt-PT")})
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

            {/* 3. PAINEL DE REGISTO DE ENTRADAS OU SAÍDAS */}
            {movementMode && (
                <Card
                    className={`shadow-sm ${
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
                                ? "Cada euro guardado aqui compra-te tempo e tranquilidade para o futuro."
                                : "Lembra-te: usa este dinheiro apenas para urgências reais e imprevistas, nunca para compras de lazer."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddMovement} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Origem / Motivo</label>
                                <select
                                    value={movTag}
                                    onChange={(e) => setMovTag(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
                                >
                                    {movementMode === "deposit" ? (
                                        <>
                                            <option value="Reforço Mensal">📅 Poupança do Mês</option>
                                            <option value="Ganho Extra">✨ Ganho Extra / Subsídio</option>
                                            <option value="Arredondamento">🪙 Sobras do Orçamento</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Imprevisto Médico / Saúde">🏥 Saúde / Farmácia</option>
                                            <option value="Avaria Carro / Casa">🔧 Avaria Urgente (Casa/Carro)</option>
                                            <option value="Quebra de Rendimento">📉 Quebra de Rendimento</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                                <input
                                    type="text"
                                    placeholder={
                                        movementMode === "deposit"
                                            ? "Ex: Poupança de Outubro..."
                                            : "Ex: Arranjo do frigorífico..."
                                    }
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

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className={`flex-1 h-9 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                                        movementMode === "deposit"
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : "bg-amber-600 hover:bg-amber-700"
                                    }`}
                                >
                                    Confirmar
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

            {/* 2. VISÃO GERAL (3 CARTÕES DE TOPO ALINHADOS COM O ACCOUNTVAULT) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Cartão 1: Saldo Total do Pé de Meia */}
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
                            {completionPct}% da tua almofada ideal (€ {idealPillowTarget.toLocaleString("pt-PT")})
                        </span>
                    </CardContent>
                </Card>

                {/* Cartão 2: Autonomia Financeira (Meses Assegurados + Barras de Nível) */}
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
                        {/* As mesmas 5 barras de nível do teu componente AccountVault */}
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

                {/* Cartão 3: Balanço de Entradas vs Saídas */}
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
                                    + € {totalDeposits.toLocaleString("pt-PT")}
                                </span>
                            </div>
                            <div className="bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
                                <span className="text-[10px] text-amber-700 dark:text-amber-300 flex items-center justify-center gap-0.5">
                                    <ArrowDownRight className="w-3 h-3" /> Saídas
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300">
                                    - € {totalWithdrawals.toLocaleString("pt-PT")}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* LINHA 2: TERMÓMETRO DO PÉ DE MEIA (ESQUERDA) + 3. HISTÓRICO DE ENTRADAS E SAÍDAS (DIREITA) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Coluna Esquerda (5 colunas): Termómetro Visual + Guia de Uso */}
                <Card className="lg:col-span-5 flex flex-col justify-between py-4 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            Estado da Tua Almofada Financeira
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Baseado num custo essencial de € {monthlyEssentialCost}/mês durante {targetMonths} meses.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5 my-auto">
                        {/* Ilustração Central do Porquinho + Progresso */}
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
                                        Guardado: € {currentBalance.toLocaleString("pt-PT")}
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

                        {/* Regras de Ouro do Pé de Meia (Combate à Iliteracia) */}
                        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 text-xs space-y-1">
                                <p className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    Quando reforçar (Entradas)?
                                </p>
                                <p className="text-muted-foreground">
                                    Sempre que recebes o salário, um reembolso de IRS ou vendas extra.
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 text-xs space-y-1">
                                <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    Quando usar (Saídas)?
                                </p>
                                <p className="text-muted-foreground">
                                    Apenas para urgências (saúde, avarias graves ou desemprego). Para viagens ou compras, usa a página de <strong>Metas</strong>!
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Coluna Direita (7 colunas): Histórico de Entradas e Saídas */}
                <Card className="lg:col-span-7 flex flex-col py-4 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                Registo de Entradas e Saídas
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Todos os reforços e levantamentos de emergência feitos no teu Pé de Meia.
                            </CardDescription>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {movements.length} movimentos
                        </span>
                    </CardHeader>

                    <CardContent className="space-y-2.5">
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
"use client"

import { useState, useMemo } from "react"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Search,
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    Tag,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    ReceiptText
} from "lucide-react"
import { useFinancial } from "@/contexts/FinancialContext"

export default function TransactionsPage() {
    const { financialRecords, categories, paymentMethods } = useFinancial()

    // ============================================================================
    // ESTADOS (Filtros e Paginação)
    // ============================================================================
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    // ============================================================================
    // HELPERS ROBUSTOS
    // ============================================================================
    const getCategoryName = (r: any) => {
        if (r.category?.name) return r.category.name;
        const id = r.categoryId || r.category_id;
        return categories?.find((c: any) => c.id === id)?.name || "Sem categoria";
    }

    const getAccountName = (r: any) => {
        if (r.paymentMethod?.name) return r.paymentMethod.name;
        const id = r.paymentMethodId || r.payment_method_id;
        return paymentMethods?.find((p: any) => p.id === id)?.name || "Desconhecida";
    }

    // ============================================================================
    // PROCESSAMENTO DE DADOS
    // ============================================================================
    const processedRecords = useMemo(() => {
        if (!financialRecords) return []

        let filtered = [...financialRecords]

        // 1. Filtrar por Tipo
        if (typeFilter !== "ALL") {
            filtered = filtered.filter((r: any) => {
                const type = r.recordType?.name || r.record_type_name
                return type === typeFilter
            })
        }

        // 2. Filtrar por Pesquisa (Nome, Categoria ou Conta)
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter((r: any) => {
                const nameMatch = r.name?.toLowerCase().includes(query)
                const catMatch = getCategoryName(r).toLowerCase().includes(query)
                return nameMatch || catMatch
            })
        }

        // 3. Ordenar por Data (Mais recente primeiro)
        filtered.sort((a: any, b: any) => {
            return new Date(b.paymentDate || b.payment_date).getTime() - new Date(a.paymentDate || a.payment_date).getTime()
        })

        return filtered
    }, [financialRecords, typeFilter, searchQuery, categories, paymentMethods])

    // Paginação
    const totalPages = Math.ceil(processedRecords.length / itemsPerPage)
    const paginatedRecords = processedRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Reset à página 1 quando se altera os filtros
    const handleFilterChange = (val: string, type: "search" | "type") => {
        if (type === "search") setSearchQuery(val)
        if (type === "type") setTypeFilter(val as any)
        setCurrentPage(1)
    }

    return (
        <div className="flex-1 w-full p-4 sm:p-6 md:p-8 font-poppins overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">

                {/* CABEÇALHO */}
                <div className="flex flex-col space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--primary-app)]">
                        Histórico de Transações
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                        Consulta, filtra e gere todos os teus movimentos financeiros (Receitas e Despesas).
                    </p>
                </div>


                <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 rounded-xl">

                        {/* Pesquisa */}
                        <div className="relative w-full sm:max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Procurar por descrição ou categoria..."
                                className="pl-9 h-10 w-full bg-white dark:bg-slate-950"
                                value={searchQuery}
                                onChange={(e) => handleFilterChange(e.target.value, "search")}
                            />
                        </div>

                        {/* Filtros */}
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                            <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1 h-10 w-full sm:w-auto">
                                <button
                                    onClick={() => handleFilterChange("ALL", "type")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${
                                        typeFilter === "ALL"
                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    }`}
                                >
                                    Todos
                                </button>
                                <button
                                    onClick={() => handleFilterChange("INCOME", "type")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${
                                        typeFilter === "INCOME"
                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    }`}
                                >
                                    Receitas
                                </button>
                                <button
                                    onClick={() => handleFilterChange("EXPENSE", "type")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${
                                        typeFilter === "EXPENSE"
                                            ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    }`}
                                >
                                    Despesas
                                </button>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* TABELA DE DADOS */}
                <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden">

                    <div className="overflow-x-auto overflow-y-auto max-h-[55vh] relative scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                        <table className="w-full text-sm text-left">

                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Data</th>
                                <th className="px-6 py-4 font-semibold">Descrição</th>
                                <th className="px-6 py-4 font-semibold">Categoria</th>
                                <th className="px-6 py-4 font-semibold">Conta</th>
                                <th className="px-6 py-4 font-semibold text-right">Valor</th>
                            </tr>
                            </thead>

                            <tbody>
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    {/* Ajustado colSpan para 5 porque removeste a coluna Ações */}
                                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <ReceiptText className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                                            <p className="font-medium text-base">Nenhuma transação encontrada</p>
                                            <p className="text-xs">Não tens movimentos registados que correspondam a estes filtros.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((r: any) => {
                                    const type = r.recordType?.name || r.record_type_name
                                    const isIncome = type === "INCOME"
                                    const date = new Date(r.paymentDate || r.payment_date)
                                    const amount = Number(r.price || 0)

                                    return (
                                        <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                                                    {date.toLocaleDateString("pt-PT")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                                                {r.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    <Tag className="w-3 h-3" />
                                                    {getCategoryName(r)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                                    <CreditCard className="w-3.5 h-3.5 opacity-70" />
                                                    {getAccountName(r)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <span className={`inline-flex items-center justify-end gap-1 font-bold ${
                                                        isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                    }`}>
                                                        {isIncome ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                                        € {amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                                    </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINAÇÃO */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 gap-4 shrink-0">
                            <span className="text-xs text-muted-foreground font-medium">
                                A mostrar <strong className="text-slate-900 dark:text-slate-100">{(currentPage - 1) * itemsPerPage + 1}</strong> a <strong className="text-slate-900 dark:text-slate-100">{Math.min(currentPage * itemsPerPage, processedRecords.length)}</strong> de <strong className="text-slate-900 dark:text-slate-100">{processedRecords.length}</strong> registos
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-xs font-medium px-2">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

            </div>
        </div>
    )
}
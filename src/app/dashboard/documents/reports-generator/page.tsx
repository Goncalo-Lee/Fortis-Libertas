"use client"

import { useState, useMemo } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    FileText,
    Download,
    Filter,
    PieChart,
    Calendar,
    ArrowDownRight,
    ArrowUpRight,
    TableProperties,
    FileDown
} from "lucide-react"
import { toast } from "sonner"
import { useFinancial } from "@/contexts/FinancialContext"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type ReportType = "statement" | "expenses_by_category" | "monthly_balance"

export default function ReportsGeneratorPage() {
    const { financialRecords, categories, paymentMethods } = useFinancial()

    // Controlos de Filtro
    const [reportType, setReportType] = useState<ReportType>("statement")
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString())
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

    // Estado de geração
    const [isGenerating, setIsGenerating] = useState(false)
    const [previewData, setPreviewData] = useState<any[] | null>(null)

    // ============================================================================
    // HELPERS ROBUSTOS (Lidam com objectos aninhados ou IDs)
    // ============================================================================
    const getCategoryName = (r: any) => {
        if (r.category?.name) return r.category.name;
        const id = r.categoryId || r.category_id;
        return categories?.find((c: any) => c.id === id)?.name || "Sem categoria";
    }

    const getAccountName = (r: any) => {
        if (r.paymentMethod?.name) return r.paymentMethod.name;
        const id = r.paymentMethodId || r.payment_method_id;
        return paymentMethods?.find((p: any) => p.id === id)?.name || "Conta Desconhecida";
    }

    const availableYears = useMemo(() => {
        if (!financialRecords || financialRecords.length === 0) return [new Date().getFullYear()]
        const years = financialRecords.map((r: any) => new Date(r.paymentDate || r.payment_date).getFullYear())
        return Array.from(new Set(years)).sort((a, b) => b - a)
    }, [financialRecords])

    // ============================================================================
    // GERAR DADOS (TABELA)
    // ============================================================================
    const handleGeneratePreview = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!financialRecords) return toast.error("Sem dados para processar.")

        setIsGenerating(true)

        setTimeout(() => {
            const filteredRecords = financialRecords.filter((r: any) => {
                const d = new Date(r.paymentDate || r.payment_date)
                return d.getMonth() + 1 === parseInt(selectedMonth) && d.getFullYear() === parseInt(selectedYear)
            })

            let generatedData: any[] = []

            if (reportType === "statement") {
                generatedData = filteredRecords.map((r: any) => ({
                    Data: new Date(r.paymentDate || r.payment_date).toLocaleDateString("pt-PT"),
                    Descrição: r.name,
                    Tipo: r.recordType?.name === "INCOME" || r.record_type_name === "INCOME" ? "Receita" : "Despesa",
                    Categoria: getCategoryName(r),
                    Conta: getAccountName(r),
                    "Valor (€)": Number(r.price || 0).toFixed(2),
                }))
            }
            else if (reportType === "expenses_by_category") {
                const expenses = filteredRecords.filter((r: any) =>
                    r.recordType?.name === "EXPENSE" || r.record_type_name === "EXPENSE"
                )
                const grouped = expenses.reduce((acc: any, r: any) => {
                    const cat = getCategoryName(r)
                    acc[cat] = (acc[cat] || 0) + Number(r.price || 0)
                    return acc
                }, {})
                generatedData = Object.entries(grouped)
                    .map(([Categoria, Total]) => ({ Categoria, "Total Gasto (€)": (Total as number).toFixed(2) }))
                    .sort((a, b) => Number(b["Total Gasto (€)"]) - Number(a["Total Gasto (€)"]))
            }
            else if (reportType === "monthly_balance") {
                let totalIncome = 0
                let totalExpense = 0
                filteredRecords.forEach((r: any) => {
                    const amount = Number(r.price || 0)
                    if (r.recordType?.name === "INCOME" || r.record_type_name === "INCOME") {
                        totalIncome += amount
                    } else {
                        totalExpense += amount
                    }
                })
                generatedData = [
                    { Indicador: "Total de Receitas (Entradas)", "Valor (€)": totalIncome.toFixed(2) },
                    { Indicador: "Total de Despesas (Saídas)", "Valor (€)": totalExpense.toFixed(2) },
                    { Indicador: "Balanço Líquido (Poupança)", "Valor (€)": (totalIncome - totalExpense).toFixed(2) }
                ]
            }

            setPreviewData(generatedData)
            setIsGenerating(false)
            toast.success("Relatório gerado com sucesso!")
        }, 600)
    }

    // ============================================================================
    // EXPORTAR CSV (Formatado para Excel em PT)
    // ============================================================================
    const handleExportCSV = () => {
        if (!previewData || previewData.length === 0) return toast.error("Gera o relatório primeiro.")

        const headers = Object.keys(previewData[0])
        const csvRows = []

        // Usa ponto e vírgula para separar as colunas (Padrão Excel PT)
        csvRows.push(headers.join(";"))

        for (const row of previewData) {
            const values = headers.map((header) => {
                const val = row[header]
                let formattedVal = String(val).replace(/"/g, '""')
                if (header.includes("Valor") || header.includes("Total")) {
                    formattedVal = formattedVal.replace(".", ",")
                }
                return `"${formattedVal}"`
            })
            csvRows.push(values.join(";"))
        }

        const csvContent = "\uFEFF" + csvRows.join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `relatorio_${reportType}_${selectedMonth}_${selectedYear}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success("CSV gerado com sucesso.")
    }

    // ============================================================================
    // EXPORTAR PDF
    // ============================================================================
    const handleExportPDF = () => {
        if (!previewData || previewData.length === 0) return toast.error("Gera o relatório primeiro.")

        const doc = new jsPDF()
        const titleMap = {
            "statement": "Extrato Detalhado",
            "expenses_by_category": "Despesas por Categoria",
            "monthly_balance": "Balanço Mensal"
        }

        doc.setFontSize(18)
        doc.text(`Relatório Financeiro: ${titleMap[reportType]}`, 14, 22)

        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Período: ${selectedMonth}/${selectedYear} | Gerado a: ${new Date().toLocaleDateString("pt-PT")}`, 14, 30)

        const tableHeaders = Object.keys(previewData[0])
        const tableData = previewData.map(row => Object.values(row))

        autoTable(doc, {
            startY: 38,
            head: [tableHeaders],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { font: 'helvetica', fontSize: 10 },
        })

        doc.save(`relatorio_${reportType}_${selectedMonth}_${selectedYear}.pdf`)
        toast.success("PDF gerado com sucesso.")
    }

    return (
        <div className="flex-1 w-full p-4 sm:p-6 md:p-8 font-poppins overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">

                {/* CABEÇALHO */}
                <div className="flex flex-col space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Gerador de Relatórios
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                        Extrai dados financeiros, pré-visualiza análises e exporta para CSV/Excel ou PDF profissional.
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-w-0 items-start">

                    {/* COLUNA ESQUERDA: CONFIGURADOR */}
                    <div className="xl:col-span-4 flex flex-col gap-6">
                        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400"/>
                                    Parâmetros do Relatório
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Define o período e o formato de extração.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleGeneratePreview} className="space-y-5">

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Tipo de Relatório</Label>
                                        <div className="flex flex-col gap-2">
                                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${reportType === 'statement' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                                <input type="radio" name="report" value="statement" checked={reportType === 'statement'} onChange={() => setReportType('statement')} className="hidden" />
                                                <FileText className={`w-5 h-5 ${reportType === 'statement' ? 'text-blue-600' : 'text-slate-400'}`} />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">Extrato Detalhado</span>
                                                    <span className="text-[10px] text-muted-foreground">Todas as transações mensais</span>
                                                </div>
                                            </label>

                                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${reportType === 'expenses_by_category' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                                <input type="radio" name="report" value="expenses_by_category" checked={reportType === 'expenses_by_category'} onChange={() => setReportType('expenses_by_category')} className="hidden" />
                                                <PieChart className={`w-5 h-5 ${reportType === 'expenses_by_category' ? 'text-blue-600' : 'text-slate-400'}`} />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">Despesas por Categoria</span>
                                                    <span className="text-[10px] text-muted-foreground">Agrupamento de gastos totais</span>
                                                </div>
                                            </label>

                                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${reportType === 'monthly_balance' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                                <input type="radio" name="report" value="monthly_balance" checked={reportType === 'monthly_balance'} onChange={() => setReportType('monthly_balance')} className="hidden" />
                                                <ArrowUpRight className={`w-5 h-5 ${reportType === 'monthly_balance' ? 'text-blue-600' : 'text-slate-400'}`} />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">Balanço Mensal</span>
                                                    <span className="text-[10px] text-muted-foreground">Fluxo de Caixa (Receitas - Despesas)</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Mês</Label>
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm"
                                            >
                                                <option value="1">Janeiro</option>
                                                <option value="2">Fevereiro</option>
                                                <option value="3">Março</option>
                                                <option value="4">Abril</option>
                                                <option value="5">Maio</option>
                                                <option value="6">Junho</option>
                                                <option value="7">Julho</option>
                                                <option value="8">Agosto</option>
                                                <option value="9">Setembro</option>
                                                <option value="10">Outubro</option>
                                                <option value="11">Novembro</option>
                                                <option value="12">Dezembro</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Ano</Label>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(e.target.value)}
                                                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm"
                                            >
                                                {availableYears.map(yr => (
                                                    <option key={yr} value={yr}>{yr}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={isGenerating} className="w-full gap-2">
                                        {isGenerating ? "A processar..." : "Gerar Pré-visualização"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* COLUNA DIREITA: PRÉ-VISUALIZAÇÃO */}
                    <div className="xl:col-span-8 flex flex-col">
                        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <TableProperties className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/>
                                        Pré-visualização de Dados
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Resultados para o período {selectedMonth}/{selectedYear}.
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:self-start">
                                    <Button
                                        variant="outline"
                                        onClick={handleExportCSV}
                                        disabled={!previewData || previewData.length === 0}
                                        className="gap-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:hover:bg-emerald-950 dark:text-emerald-400"
                                    >
                                        <Download className="w-4 h-4"/> CSV / Excel
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleExportPDF}
                                        disabled={!previewData || previewData.length === 0}
                                        className="gap-2 border-rose-200 hover:bg-rose-50 text-rose-700 dark:border-rose-800 dark:hover:bg-rose-950 dark:text-rose-400"
                                    >
                                        <FileDown className="w-4 h-4"/> PDF
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!previewData ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                        <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3"/>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            Nenhum relatório gerado.
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Utiliza os filtros ao lado para pré-visualizar os dados antes de exportar.
                                        </p>
                                    </div>
                                ) : previewData.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-muted-foreground border rounded-xl">
                                        Não foram encontrados dados financeiros para este período.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-900/50 dark:text-slate-300">
                                            <tr>
                                                {Object.keys(previewData[0]).map((header) => (
                                                    <th key={header} className="px-4 py-3 font-semibold whitespace-nowrap">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {previewData.map((row, idx) => (
                                                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                    {Object.values(row).map((val: any, i) => (
                                                        <td key={i} className="px-4 py-2.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                                            {val === "Despesa" ? (
                                                                <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1"><ArrowDownRight className="w-3 h-3"/> {val}</span>
                                                            ) : val === "Receita" ? (
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> {val}</span>
                                                            ) : (
                                                                val
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
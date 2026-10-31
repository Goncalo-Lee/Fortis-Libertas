"use client"

import { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Database,
    HardDriveDownload,
    FileJson,
    FileSpreadsheet,
    ShieldAlert,
    Archive,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import { useFinancial } from "@/contexts/FinancialContext"
import { useProfile } from "@/contexts/ProfileContext"

export default function ExportationsPage() {
    const { profile: rawProfile } = useProfile()
    const { financialRecords, installmentPlans, categories, tags, paymentMethods } = useFinancial()

    const [isExporting, setIsExporting] = useState<string | null>(null)

    // ============================================================================
    // 1. BACKUP COMPLETO (JSON) - DUMP TOTAL DA CONTA
    // ============================================================================
    const handleExportFullJSON = () => {
        setIsExporting("json")

        setTimeout(() => {
            const fullBackup = {
                metadata: {
                    generated_at: new Date().toISOString(),
                    app: "Fortis Libertas",
                    type: "Full Account Backup"
                },
                user_profile: rawProfile?.data || rawProfile,
                financial_data: {
                    records: financialRecords || [],
                    installment_plans: installmentPlans || [],
                    categories: categories || [],
                    tags: tags || [],
                    payment_methods: paymentMethods || []
                }
            }

            const jsonString = JSON.stringify(fullBackup, null, 2)
            const blob = new Blob([jsonString], { type: "application/json" })
            const url = URL.createObjectURL(blob)

            const link = document.createElement("a")
            link.href = url
            link.download = `backup_completo_${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success("Backup completo (JSON) descarregado com sucesso.")
            setIsExporting(null)
        }, 800)
    }

    // ============================================================================
    // 2. EXPORTAÇÃO CRUA (RAW CSV) - TODAS AS TRANSAÇÕES
    // ============================================================================
    const handleExportRawCSV = () => {
        setIsExporting("csv")

        setTimeout(() => {
            if (!financialRecords || financialRecords.length === 0) {
                setIsExporting(null)
                return toast.error("Não existem registos financeiros para exportar.")
            }

            // Cabeçalhos (Nomes exatos das colunas da BD)
            const headers = ["ID", "Data", "Nome", "Tipo", "Valor", "Moeda", "Categoria_ID", "Metodo_Pagamento_ID", "Plano_Prestacoes_ID", "Estado"]
            const csvRows = [headers.join(";")]

            financialRecords.forEach((r: any) => {
                const values = [
                    r.id,
                    r.paymentDate || r.payment_date,
                    r.name,
                    r.recordType?.name || r.record_type_name,
                    r.price,
                    r.currency || "EUR",
                    r.categoryId || r.category_id || "",
                    r.paymentMethodId || r.payment_method_id || "",
                    r.installmentPlanId || r.installment_plan_id || "",
                    r.status || "paid"
                ]

                const escapedValues = values.map(val => `"${String(val || "").replace(/"/g, '""')}"`)
                csvRows.push(escapedValues.join(";"))
            })

            const csvContent = "\uFEFF" + csvRows.join("\n")
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)

            const link = document.createElement("a")
            link.href = url
            link.download = `raw_transactions_dump_${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success("Dump de transações (CSV) descarregado.")
            setIsExporting(null)
        }, 800)
    }

    return (
        <div className="flex-1 w-full p-4 sm:p-6 md:p-8 font-poppins overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">

                {/* CABEÇALHO */}
                <div className="flex flex-col space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        Exportação de Dados
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                        Descarrega os teus dados em formato bruto para backups pessoais, análise externa ou portabilidade.
                    </p>
                </div>

                {/* AVISO DE SEGURANÇA */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3 items-start">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                            Atenção à sensibilidade dos dados
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
                            Os ficheiros gerados nesta página contêm todo o teu histórico financeiro sem encriptação.
                            Guarda estes ficheiros apenas em locais seguros e não os partilhes em redes públicas.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">

                    {/* CARTÃO 1: BACKUP COMPLETO JSON */}
                    <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md text-purple-600 dark:text-purple-400">
                                    <Archive className="w-4 h-4" />
                                </div>
                                Backup Completo (JSON)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Uma cópia exata e total da tua conta. Inclui perfil, categorias, metas, pé de meia e todas as transações. Ideal para programadores ou portabilidade de conta.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 p-5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <FileJson className="w-5 h-5" />
                                    <span>Formato: <strong>JavaScript Object Notation (.json)</strong></span>
                                </div>
                                <Button
                                    onClick={handleExportFullJSON}
                                    disabled={isExporting !== null}
                                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    {isExporting === "json" ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> A compilar ficheiros...</>
                                    ) : (
                                        <><HardDriveDownload className="w-4 h-4" /> Descarregar Backup Seguro</>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CARTÃO 2: RAW DUMP CSV */}
                    <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
                                    <Database className="w-4 h-4" />
                                </div>
                                Dump de Transações (CSV)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Tabela bruta contendo o teu histórico completo de despesas e receitas. Ideal para importar para o Excel, PowerBI ou base de dados externa.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 p-5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <FileSpreadsheet className="w-5 h-5" />
                                    <span>Formato: <strong>Valores Separados por Vírgula (.csv)</strong></span>
                                </div>
                                <Button
                                    onClick={handleExportRawCSV}
                                    disabled={isExporting !== null}
                                    variant="outline"
                                    className="w-full gap-2 border-blue-200 hover:bg-blue-50 text-blue-700 dark:border-blue-900 dark:hover:bg-blue-950 dark:text-blue-400"
                                >
                                    {isExporting === "csv" ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> A extrair dados da DB...</>
                                    ) : (
                                        <><Database className="w-4 h-4" /> Extrair Tabela de Dados</>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
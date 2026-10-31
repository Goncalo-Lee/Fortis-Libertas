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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Receipt,
    FilePlus,
    UploadCloud,
    Download,
    Trash2,
    Search,
    FileText,
    Link as LinkIcon,
    Loader2,
    CheckCircle2, Plus
} from "lucide-react"
import { toast } from "sonner"
import { useFinancial } from "@/contexts/FinancialContext"

// Interface adaptada para quando ligares ao backend
interface InvoiceItem {
    id: string
    date: string
    supplier: string
    documentType: string
    amount: number
    fileUrl?: string
    linkedRecordId?: string | null
}

export default function InvoicesPage() {
    const { financialRecords } = useFinancial()

    const [searchQuery, setSearchQuery] = useState("")
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Estado limpo, sem hardcoded!
    // Futuramente, substituis isto por um useEffect que faz fetch das faturas à BD.
    const [invoices, setInvoices] = useState<InvoiceItem[]>([])

    // Estados do Formulário de Upload
    const [newInvSupplier, setNewInvSupplier] = useState("")
    const [newInvAmount, setNewInvAmount] = useState("")
    const [newInvDate, setNewInvDate] = useState("")
    const [newInvLinkedRecord, setNewInvLinkedRecord] = useState("")

    // Despesas recentes para preencher a Dropdown de "Associar a Despesa"
    const recentExpenses = useMemo(() => {
        if (!financialRecords) return []
        return financialRecords
            .filter((r: any) => r.recordType?.name === "EXPENSE" || r.record_type_name === "EXPENSE")
            .sort((a: any, b: any) => new Date(b.paymentDate || b.payment_date).getTime() - new Date(a.paymentDate || a.payment_date).getTime())
            .slice(0, 30)
    }, [financialRecords])

    // Filtrar faturas pela barra de pesquisa
    const filteredInvoices = invoices.filter(inv =>
        inv.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.documentType.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalInvoicesValue = invoices.reduce((acc, curr) => acc + curr.amount, 0)
    const unlinkedInvoicesCount = invoices.filter(inv => !inv.linkedRecordId).length

    const handleUploadInvoice = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newInvSupplier || !newInvAmount || !newInvDate) {
            return toast.error("Preenche os campos obrigatórios.")
        }

        setIsSubmitting(true)

        try {
            // AQUI ENTRARÁ O TEU ENDPOINT REAL:
            // const res = await fetch('/api/v1/invoices', { method: 'POST', body: ... })
            // const data = await res.json()

            // Lógica provisória apenas para a UI não quebrar enquanto não ligas o backend
            const newInvoice: InvoiceItem = {
                id: crypto.randomUUID(),
                date: newInvDate,
                supplier: newInvSupplier,
                amount: parseFloat(newInvAmount),
                documentType: "Fatura",
                linkedRecordId: newInvLinkedRecord || null
            }

            setInvoices(prev => [newInvoice, ...prev])

            setNewInvSupplier("")
            setNewInvAmount("")
            setNewInvDate("")
            setNewInvLinkedRecord("")
            setIsUploadOpen(false)

            toast.success("Documento adicionado com sucesso!")
        } catch (error) {
            toast.error("Erro ao arquivar documento.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if(confirm("Tens a certeza que queres eliminar este documento?")) {
            // AQUI ENTRARÁ O DELETE À BD
            setInvoices(prev => prev.filter(inv => inv.id !== id))
            toast.success("Fatura eliminada do arquivo.")
        }
    }

    return (
        <div className="flex-1 w-full p-4 sm:p-6 md:p-8 font-poppins overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">

                {/* CABEÇALHO & AÇÃO PRINCIPAL */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            Faturas e Recibos
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            Arquivo digital para garantias, justificações de despesas e efeitos fiscais (IRS).
                        </p>
                    </div>

                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger
                            render={<Button className="gap-2 shrink-0" />}
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nova Fatura</span>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md font-poppins">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    Arquivar Nova Fatura
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Faz upload do PDF/Imagem e associa o documento a uma despesa registada.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleUploadInvoice} className="space-y-4 pt-2">
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Clica ou arrasta o ficheiro para aqui
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        PDF, PNG ou JPG (Max: 5MB)
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-xs font-semibold">Fornecedor / Entidade</Label>
                                        <Input
                                            placeholder="Ex: Worten, EDP, Continente..."
                                            value={newInvSupplier}
                                            onChange={(e) => setNewInvSupplier(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Data de Emissão</Label>
                                        <Input
                                            type="date"
                                            value={newInvDate}
                                            onChange={(e) => setNewInvDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Valor (€)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={newInvAmount}
                                            onChange={(e) => setNewInvAmount(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                            <LinkIcon className="w-3.5 h-3.5" /> Associar a Despesa (Opcional)
                                        </Label>
                                        <select
                                            value={newInvLinkedRecord}
                                            onChange={(e) => setNewInvLinkedRecord(e.target.value)}
                                            className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm"
                                        >
                                            <option value="">-- Não associar para já --</option>
                                            {recentExpenses.map((r: any) => (
                                                <option key={r.id} value={r.id}>
                                                    {new Date(r.paymentDate || r.payment_date).toLocaleDateString("pt-PT")} - {r.name} (€{Number(r.price).toFixed(2)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> A guardar...</> : "Guardar Fatura"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* CARTÕES DE RESUMO */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-slate-500" /> Total Arquivado
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {invoices.length} <span className="text-sm font-normal text-muted-foreground">docs</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" /> Valor Total Registado
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                € {totalInvoicesValue.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-amber-500" /> Faturas Órfãs (Sem Despesa)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                                {unlinkedInvoicesCount}
                                {unlinkedInvoicesCount === 0 && invoices.length > 0 && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                        <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
                            Histórico de Documentos
                        </CardTitle>
                        <div className="relative w-full sm:w-64 shrink-0">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Procurar fornecedor..."
                                className="pl-9 h-9 text-sm bg-slate-50 dark:bg-slate-900/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-3 font-semibold whitespace-nowrap">Data</th>
                                    <th className="px-6 py-3 font-semibold">Fornecedor</th>
                                    <th className="px-6 py-3 font-semibold">Documento</th>
                                    <th className="px-6 py-3 font-semibold">Associação</th>
                                    <th className="px-6 py-3 font-semibold">Valor</th>
                                    <th className="px-6 py-3 font-semibold text-right">Ações</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                                                <p className="font-medium">O teu arquivo está vazio.</p>
                                                <p className="text-xs">Usa o botão acima para guardares a tua primeira fatura.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((inv) => (
                                        <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                                {new Date(inv.date).toLocaleDateString("pt-PT")}
                                            </td>
                                            <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">
                                                {inv.supplier}
                                            </td>
                                            <td className="px-6 py-3">
                                                    <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                        {inv.documentType}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                {inv.linkedRecordId ? (
                                                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                            <LinkIcon className="w-3.5 h-3.5" /> Vinculado
                                                        </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                                                            Pendente
                                                        </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                                € {inv.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        title="Descarregar PDF"
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(inv.id)}
                                                        title="Eliminar Fatura"
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
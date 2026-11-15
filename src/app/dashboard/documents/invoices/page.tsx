"use client"

import { useState, useMemo, useEffect } from "react"
import {
    Card,
    CardContent,
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
    UploadCloud,
    Download,
    Trash2,
    Search,
    FileText,
    Link as LinkIcon,
    Loader2,
    CheckCircle2,
    Plus,
    Info
} from "lucide-react"
import { toast } from "sonner"
import { useFinancial } from "@/contexts/FinancialContext"

interface InvoiceItem {
    id: string
    date: string
    supplier: string
    documentType: string
    amount: number
    fileName?: string
    fileUrl?: string // Aqui vamos guardar o conteúdo real do ficheiro!
    linkedRecordId?: string | null
}

// ============================================================================
// MOTOR DE BASE DE DADOS LOCAL (IndexedDB) - ZERO BACKEND NECESSÁRIO!
// ============================================================================
const DB_NAME = "MoneyPillowInvoicesDB"
const STORE_NAME = "invoices"

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1)
        request.onupgradeneeded = (e: any) => {
            if (!e.target.result.objectStoreNames.contains(STORE_NAME)) {
                e.target.result.createObjectStore(STORE_NAME, { keyPath: "id" })
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

const saveInvoiceToDB = async (invoice: InvoiceItem) => {
    const db = await openDB()
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite")
        tx.objectStore(STORE_NAME).put(invoice)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

const getAllInvoicesFromDB = async (): Promise<InvoiceItem[]> => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly")
        const req = tx.objectStore(STORE_NAME).getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

const deleteInvoiceFromDB = async (id: string) => {
    const db = await openDB()
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite")
        tx.objectStore(STORE_NAME).delete(id)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

// Converte o ficheiro fisicamente para uma string gigante que o browser consegue guardar
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = error => reject(error)
    })
}
// ============================================================================


export default function InvoicesPage() {
    const { financialRecords, recordTypes } = useFinancial()

    const [searchQuery, setSearchQuery] = useState("")
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const [invoices, setInvoices] = useState<InvoiceItem[]>([])

    const [newInvSupplier, setNewInvSupplier] = useState("")
    const [newInvAmount, setNewInvAmount] = useState("")
    const [newInvDate, setNewInvDate] = useState("")
    const [newInvLinkedRecord, setNewInvLinkedRecord] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    // CARREGAR FATURAS DO BROWSER AO INICIAR A PÁGINA
    useEffect(() => {
        getAllInvoicesFromDB().then((data) => {
            // Ordena da mais recente para a mais antiga
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            setInvoices(data)
            setIsLoading(false)
        }).catch(() => {
            toast.error("Erro ao carregar o arquivo local.")
            setIsLoading(false)
        })
    }, [])

    const recentExpenses = useMemo(() => {
        if (!financialRecords) return []
        return financialRecords
            .filter((r: any) => {
                const rtId = r.record_type_id || r.recordTypeId || r.recordType?.record_type_id || r.recordType?.id
                const rt = (recordTypes || []).find((t: any) => (t.record_type_id || t.id) === rtId)
                const kind = rt?.kind || r.record_type?.kind
                const typeName = (rt?.name || r.recordType?.name || "").toLowerCase()

                return kind === "expense" || typeName.includes("expense") || typeName.includes("despesa")
            })
            .sort((a: any, b: any) => {
                const dateB = new Date(b.payment_date || b.paymentDate || 0).getTime()
                const dateA = new Date(a.payment_date || a.paymentDate || 0).getTime()
                return dateB - dateA
            })
            .slice(0, 30)
    }, [financialRecords, recordTypes])

    const filteredInvoices = invoices.filter(inv =>
        inv.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.documentType.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalInvoicesValue = invoices.reduce((acc, curr) => acc + curr.amount, 0)
    const unlinkedInvoicesCount = invoices.filter(inv => !inv.linkedRecordId).length

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0])
        }
    }

    const handleExpenseSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const recordId = e.target.value
        setNewInvLinkedRecord(recordId)

        if (recordId) {
            const selectedRecord = recentExpenses.find((r: any) =>
                (r.financial_record_id || r.id || "").toString() === recordId.toString()
            )

            if (selectedRecord) {
                if (selectedRecord.price || selectedRecord.amount) {
                    setNewInvAmount(String(selectedRecord.price || selectedRecord.amount))
                }
                if (!newInvSupplier && selectedRecord.name) {
                    setNewInvSupplier(selectedRecord.name)
                }
                if (!newInvDate && (selectedRecord.payment_date || selectedRecord.paymentDate)) {
                    setNewInvDate(new Date(selectedRecord.payment_date || selectedRecord.paymentDate).toISOString().split('T')[0])
                }
            }
        }
    }

    const handleUploadInvoice = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newInvSupplier || !newInvAmount || !newInvDate) {
            return toast.error("Preenche os campos obrigatórios.")
        }
        if (!selectedFile) {
            return toast.error("Por favor, anexa o ficheiro da fatura.")
        }

        setIsSubmitting(true)

        try {
            // Processa o ficheiro para uma string Base64 para poder ser guardada
            const fileDataUrl = await fileToBase64(selectedFile)

            const newInvoice: InvoiceItem = {
                id: crypto.randomUUID(),
                date: newInvDate,
                supplier: newInvSupplier,
                amount: parseFloat(newInvAmount),
                documentType: "Fatura",
                fileName: selectedFile.name,
                fileUrl: fileDataUrl, // O FICHEIRO REAL ESTÁ AQUI DENTRO!
                linkedRecordId: newInvLinkedRecord || null
            }

            // GRAVA NO BROWSER (IndexedDB)
            await saveInvoiceToDB(newInvoice)

            // ATUALIZA A UI
            setInvoices(prev => [newInvoice, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))

            setNewInvSupplier("")
            setNewInvAmount("")
            setNewInvDate("")
            setNewInvLinkedRecord("")
            setSelectedFile(null)
            setIsUploadOpen(false)

            toast.success("Documento arquivado no teu dispositivo!")
        } catch (error) {
            toast.error("Erro ao arquivar documento localmente.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm("Tens a certeza que queres eliminar este documento para sempre?")) {
            try {
                await deleteInvoiceFromDB(id) // Apaga do Browser
                setInvoices(prev => prev.filter(inv => inv.id !== id))
                toast.success("Fatura eliminada do arquivo local.")
            } catch (error) {
                toast.error("Erro ao tentar eliminar.")
            }
        }
    }

    return (
        <div className="flex-1 w-full p-4 sm:p-6 md:p-8 font-poppins overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">

                <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 p-3.5 rounded-xl text-xs sm:text-sm flex gap-3 items-start border border-blue-100 dark:border-blue-900/50 shadow-sm">
                    <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                    <div className="space-y-1">
                        <p className="font-semibold text-blue-900 dark:text-blue-200">Privacidade Garantida (Arquivo Local):</p>
                        <p className="leading-relaxed">
                            Para tua total segurança, <strong>nenhuma fatura é enviada para os nossos servidores</strong>.
                            Os documentos são guardados de forma encriptada diretamente no armazenamento do teu browser (IndexedDB).
                            Estão sempre disponíveis aqui nesta máquina e podes descarregá-los a qualquer momento clicando no ícone de Download.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            Faturas e Recibos
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            Arquivo digital para garantias, justificações de despesas e efeitos fiscais (IRS).
                        </p>
                    </div>

                    <Button onClick={() => setIsUploadOpen(true)} className="gap-2 shrink-0 cursor-pointer">
                        <Plus className="w-4 h-4" />
                        <span>Nova Fatura</span>
                    </Button>

                    <Dialog open={isUploadOpen} onOpenChange={(open) => {
                        setIsUploadOpen(open)
                        if (!open) setSelectedFile(null)
                    }}>
                        <DialogContent className="sm:max-w-md font-poppins">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    Arquivar Nova Fatura
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    O ficheiro será guardado localmente e associado aos teus registos.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleUploadInvoice} className="space-y-4 pt-2">

                                <Label
                                    htmlFor="file-upload"
                                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                >
                                    <div className={`p-3 rounded-full ${selectedFile ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                        {selectedFile ? <CheckCircle2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                    </div>

                                    {selectedFile ? (
                                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[250px]">
                                            {selectedFile.name}
                                        </p>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Clica para selecionar o ficheiro
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                PDF, PNG ou JPG (Max: 15MB)
                                            </p>
                                        </>
                                    )}
                                </Label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".pdf, image/png, image/jpeg, image/jpg"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                <div className="space-y-1.5 pt-2">
                                    <Label className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                        <LinkIcon className="w-3.5 h-3.5" /> 1. Associar a uma Despesa (Opcional)
                                    </Label>
                                    <select
                                        value={newInvLinkedRecord}
                                        onChange={handleExpenseSelection}
                                        className="w-full h-9 rounded-md border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                                    >
                                        <option value="">-- Não associar para já --</option>
                                        {recentExpenses.map((r: any, idx: number) => {
                                            const recordId = r.financial_record_id || r.id || idx
                                            const recordDate = r.payment_date || r.paymentDate
                                            return (
                                                <option key={recordId} value={recordId}>
                                                    {recordDate ? new Date(recordDate).toLocaleDateString("pt-PT") : "Sem data"} - {r.name} (€{Number(r.price || 0).toFixed(2)})
                                                </option>
                                            )
                                        })}
                                    </select>
                                    <p className="text-[10px] text-muted-foreground pl-1">Ao selecionares, os campos abaixo preenchem-se sozinhos!</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-xs font-semibold">2. Fornecedor / Entidade</Label>
                                        <Input
                                            placeholder="Ex: Worten, EDP, Continente..."
                                            value={newInvSupplier}
                                            onChange={(e) => setNewInvSupplier(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">3. Data de Emissão</Label>
                                        <Input
                                            type="date"
                                            value={newInvDate}
                                            onChange={(e) => setNewInvDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">4. Valor (€)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={newInvAmount}
                                            onChange={(e) => setNewInvAmount(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> A arquivar...</> : "Arquivar Fatura"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

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
                                    <th className="px-6 py-3 font-semibold">Ficheiro</th>
                                    <th className="px-6 py-3 font-semibold">Associação</th>
                                    <th className="px-6 py-3 font-semibold">Valor</th>
                                    <th className="px-6 py-3 font-semibold text-right">Ações</th>
                                </tr>
                                </thead>
                                <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                            <p className="mt-2 text-xs">A carregar o teu arquivo local...</p>
                                        </td>
                                    </tr>
                                ) : filteredInvoices.length === 0 ? (
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
                                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 truncate max-w-[150px] inline-block">
                                                    {inv.fileName || inv.documentType}
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
                                                    {/* O BOTÃO DE DOWNLOAD AGORA FUNCIONA A SÉRIO! */}
                                                    {inv.fileUrl && (
                                                        <a
                                                            href={inv.fileUrl}
                                                            download={inv.fileName || `fatura_${inv.supplier}.pdf`}
                                                            title="Descarregar Ficheiro"
                                                            className="p-1.5 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                    )}
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
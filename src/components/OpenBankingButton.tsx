"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useFinancial } from "@/contexts/FinancialContext"

export function OpenBankingButton() {
    // 1. Puxamos o super-poder de gravar registos e as listas de suporte
    const { addFinancialRecord, categories, paymentMethods, recordTypes } = useFinancial()
    const [isSyncing, setIsSyncing] = useState(false)

    async function handleMockBankSync() {
        setIsSyncing(true)

        try {
            // 2. Simular a "viagem" dos dados na internet (loading de 2 segundos)
            await new Promise(resolve => setTimeout(resolve, 2000))

            // 3. Procurar os IDs obrigatórios da tua base de dados para a validação não falhar
            const defaultPayment = paymentMethods?.[0]?.payment_method_id || paymentMethods?.[0]?.id
            const defaultCategory = categories?.[0]?.category_id || categories?.[0]?.id

            const incomeType = recordTypes.find((rt: any) => rt.kind === "income")?.record_type_id || recordTypes.find((rt: any) => rt.kind === "income")?.id
            const expenseType = recordTypes.find((rt: any) => rt.kind === "expense")?.record_type_id || recordTypes.find((rt: any) => rt.kind === "expense")?.id

            // Proteção de segurança: se o dashboard for novo e não tiver os dados mínimos
            if (!defaultPayment || !defaultCategory || !incomeType || !expenseType) {
                throw new Error("Cria primeiro uma conta bancária e uma categoria no teu dashboard!")
            }

            // 4. As nossas transações simuladas e altamente realistas
            const mockTransactions = [
                { name: "Vencimento - Empresa XYZ", price: "1450.00", typeId: incomeType },
                { name: "Supermercados Continente", price: "64.30", typeId: expenseType },
                { name: "Netflix Portugal", price: "11.99", typeId: expenseType },
                { name: "Galp - Combustível", price: "40.00", typeId: expenseType }
            ]

            // 5. O truque de mestre: Disparar a criação para a tua Base de Dados real!
            for (const tx of mockTransactions) {
                await addFinancialRecord({
                    name: tx.name,
                    description: "Importado via Open Banking (Simulação)",
                    price: tx.price,
                    recordTypeId: tx.typeId,
                    categoryId: defaultCategory,
                    paymentMethodId: defaultPayment,
                    paymentDate: new Date().toISOString()
                })
            }

            toast.success("Banco sincronizado! 4 novos movimentos importados com sucesso.")
        } catch (error: any) {
            toast.error(error.message || "Falha na ligação à API do Banco.")
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleMockBankSync}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm cursor-pointer"
        >
            {isSyncing ? (
                <>
                    {/* Ícone de Loading a rodar */}
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    A ligar ao Banco...
                </>
            ) : (
                <>
                    {/* Ícone normal de sincronização */}
                    <RefreshCw className="w-4 h-4" />
                    Sincronizar Banco
                </>
            )}
        </button>
    )
}
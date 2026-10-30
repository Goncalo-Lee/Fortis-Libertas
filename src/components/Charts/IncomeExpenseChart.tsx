"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

import { useFinancial } from "@/contexts/FinancialContext"

const chartConfig = {
    entradas: {
        label: "Entrou (€)",
        color: "var(--app-loses)",
    },
    saidas: {
        label: "Saiu (€)",
        color: "var(--app-gains)",
    },
} satisfies ChartConfig

export function IncomeExpenseChart() {
    const { financialRecords, recordTypes } = useFinancial()

    // Lógica para agrupar os dados dinamicamente por mês
    const chartData = useMemo(() => {
        if (!financialRecords || !recordTypes || financialRecords.length === 0) return []

        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        const today = new Date()

        // 1. Criar os "baldes" para os últimos 6 meses
        const buckets = new Map()
        const result = []

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
            const key = `${d.getFullYear()}-${d.getMonth()}` // Ex: "2026-9"

            const bucket = {
                month: monthNames[d.getMonth()],
                entradas: 0,
                saidas: 0
            }

            buckets.set(key, bucket)
            result.push(bucket)
        }

        // 2. Percorrer os registos da BD e somar nos meses correspondentes
        financialRecords.forEach((record: any) => {
            const dateVal = record.paymentDate || record.payment_date
            if (!dateVal) return

            const recordDate = new Date(dateVal)
            const key = `${recordDate.getFullYear()}-${recordDate.getMonth()}`

            // Só processa se o registo pertencer a um dos últimos 6 meses
            if (buckets.has(key)) {
                const price = Number(record.price || 0)

                // Identifica se é Entrada ou Saída com base no Record Type
                let typeName = record.recordType?.name || ""
                if (!typeName) {
                    const typeId = record.recordTypeId || record.record_type_id
                    const rt = recordTypes.find((t: any) => t.id === typeId)
                    if (rt) typeName = rt.name
                }

                const isExpense = typeName.toLowerCase().includes("despesa") || typeName.toLowerCase().includes("expense")
                const bucket = buckets.get(key)

                if (isExpense) {
                    bucket.saidas += price
                } else {
                    bucket.entradas += price
                }
            }
        })

        return result
    }, [financialRecords, recordTypes])

    // Se ainda não houver dados calculados, criamos um mês vazio para não quebrar o UI
    const lastMonth = chartData.length > 0 ? chartData[chartData.length - 1] : { entradas: 0, saidas: 0 }
    const isPositive = lastMonth.entradas >= lastMonth.saidas

    return (
        <Card className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden py-4 shadow-sm font-poppins">
            <CardHeader className="shrink-0 px-4 pb-0 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-semibold text-cyan-800 flex items-center gap-2">
                        Entradas vs Saídas
                    </CardTitle>
                    <CardDescription className="text-cyan-700">
                        O teu histórico dos últimos 6 meses
                    </CardDescription>
                </div>
                {chartData.length > 0 && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {isPositive ? "Balanço Positivo" : "Balanço Negativo"}
                    </span>
                )}
            </CardHeader>

            <CardContent className="min-h-0 flex-1 px-4">
                <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
                    <BarChart accessibilityLayer data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            className="text-sm font-medium"
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dashed" />}
                        />
                        <Bar dataKey="entradas" fill="var(--app-loses)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="saidas" fill="var(--app-gains)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
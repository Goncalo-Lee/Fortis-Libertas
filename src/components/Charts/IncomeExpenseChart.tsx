"use client"

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

// Dados de exemplo amigáveis. Numa app real, viriam da tua base de dados.
const chartData = [
    { month: "Jan", entradas: 1200, saidas: 900 },
    { month: "Fev", entradas: 1200, saidas: 1100 },
    { month: "Mar", entradas: 1350, saidas: 850 },
    { month: "Abr", entradas: 1250, saidas: 1300 }, // Mês onde saídas > entradas
    { month: "Mai", entradas: 1200, saidas: 950 },
    { month: "Jun", entradas: 1400, saidas: 1000 },
]

// Configuração das cores e rótulos amigáveis
const chartConfig = {
    entradas: {
        label: "Entrou (€)",
        color: "hsl(var(--chart-2))", // Geralmente um verde ou azul no shadcn
    },
    saidas: {
        label: "Saiu (€)",
        color: "hsl(var(--chart-1))", // Geralmente um vermelho ou laranja
    },
} satisfies ChartConfig

export function IncomeExpenseChart() {
    // Lógica simples para ver se o mês atual foi positivo
    const lastMonth = chartData[chartData.length - 1]
    const isPositive = lastMonth.entradas > lastMonth.saidas

    return (
        <Card className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden py-4 shadow-sm font-poppins">
            <CardHeader className="shrink-0 px-4 pb-0">
                <CardTitle className="text-xl font-semibold text-cyan-800 flex items-center gap-2">
                    Entradas vs Saídas
                </CardTitle>
                <CardDescription className="text-cyan-700">
                    O teu histórico dos últimos 6 meses
                </CardDescription>
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
                        <Bar dataKey="entradas" fill="var(--app-gains)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="saidas" fill="var(--app-loses)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
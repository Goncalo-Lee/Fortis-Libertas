"use client"

import { TrendingUp, TrendingDown, Smile } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
        <Card className="w-full max-w-2xl shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-800">
                    Entradas vs Saídas
                </CardTitle>
                <CardDescription className="text-slate-500">
                    O teu histórico dos últimos 6 meses
                </CardDescription>
            </CardHeader>

            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                    <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
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
                        <Bar dataKey="entradas" fill="var(--color-entradas)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="saidas" fill="var(--color-saidas)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>

            <CardFooter className="flex-col items-start gap-2 text-sm bg-slate-50/50 pt-4 pb-4 rounded-b-xl border-t">
                <div className="flex items-center gap-2 font-medium text-slate-700">
                    {isPositive ? (
                        <>
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            Tiveste um saldo positivo no último mês!
                            <Smile className="h-4 w-4 text-green-500 ml-1" />
                        </>
                    ) : (
                        <>
                            <TrendingDown className="h-5 w-5 text-orange-500" />
                            No último mês, as saídas superaram as entradas.
                        </>
                    )}
                </div>
                <div className="leading-none text-slate-500">
                    Acompanhar estes valores ajuda-te a teres um mês mais tranquilo.
                </div>
            </CardFooter>
        </Card>
    )
}
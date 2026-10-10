"use client"

import { HeartHandshake, Sparkles } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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

// Dados de exemplo: Focamos apenas no valor que sobrou livre ao fim do mês
const chartData = [
    { month: "Jan", sobra: 300 },
    { month: "Fev", sobra: 100 },
    { month: "Mar", sobra: 500 },
    { month: "Abr", sobra: 250 },
    { month: "Mai", sobra: 450 },
    { month: "Jun", sobra: 600 },
]

const chartConfig = {
    sobra: {
        label: "Sobrou (€)",
        color: "hsl(var(--chart-2))", // Um verde ou azul claro (cores que transmitem calma)
    },
} satisfies ChartConfig

export function LeftoverBalanceChart() {
    // Pequena lógica para dar um toque empático
    const currentMonthLeftover = chartData[chartData.length - 1].sobra
    const previousMonthLeftover = chartData[chartData.length - 2].sobra
    const isImproving = currentMonthLeftover > previousMonthLeftover

    return (
        <Card className="w-full max-w-2xl shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    A Tua Almofada Financeira
                    <HeartHandshake className="h-5 w-5 text-blue-500" />
                </CardTitle>
                <CardDescription className="text-slate-500">
                    O dinheiro que ficou livre ao final de cada mês
                </CardDescription>
            </CardHeader>

            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{ top: 20, right: 12, left: 12, bottom: 0 }}
                    >
                        {/* O defs cria um gradiente para a área, dando um ar moderno e suave */}
                        <defs>
                            <linearGradient id="colorSobra" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-sobra)" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="var(--color-sobra)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            className="text-sm font-medium"
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        {/* O segredo está no type="natural", que curva a linha em vez de fazer ziguezagues */}
                        <Area
                            dataKey="sobra"
                            type="natural"
                            fill="url(#colorSobra)"
                            stroke="var(--color-sobra)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>

            <CardFooter className="flex-col items-start gap-2 text-sm bg-slate-50/50 pt-4 pb-4 rounded-b-xl border-t">
                <div className="flex items-center gap-2 font-medium text-slate-700">
                    {isImproving ? (
                        <>
                            Estás a conseguir guardar mais este mês!
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                        </>
                    ) : (
                        <>
                            Todos os meses são diferentes, o importante é manter o equilíbrio.
                        </>
                    )}
                </div>
                <div className="leading-none text-slate-500">
                    Este é o teu espaço de segurança. Quanto mais alta a onda, mais folga tens.
                </div>
            </CardFooter>
        </Card>
    )
}
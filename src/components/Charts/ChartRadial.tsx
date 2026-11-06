"use client"

import { TrendingUp } from "lucide-react"
import {
    Label,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    type ChartConfig,
} from "@/components/ui/chart"

export const description = "A radial chart with text"

const chartData = [
    { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
]

const chartConfig = {
    visitors: {
        label: "Visitors",
    },
    safari: {
        label: "Safari",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

export default function ChartRadial() {
    return (
        <Card className="flex h-full min-h-0 flex-col gap-3 overflow-hidden py-4 font-poppins">
            <CardHeader className="shrink-0 items-center text-center  px-4 pb-0">
                <CardTitle>Meta financeira</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 px-4 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-auto h-full w-full"
                >
                    <RadialBarChart
                        data={chartData}
                        startAngle={0}
                        endAngle={250}
                        innerRadius="80%"
                        outerRadius="100%"
                    >
                        <RadialBar 
                            dataKey="visitors" 
                            background 
                            cornerRadius={10} 
                            style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.1))" }}
                        />
                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-primary-app dark:fill-white text-xl sm:text-2xl font-bold"
                                                >
                                                    {chartData[0].visitors.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 20}
                                                    className="fill-muted-foreground text-xs"
                                                >
                                                    Visitors
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </PolarRadiusAxis>
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
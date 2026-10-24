"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"

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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A simple pie chart"

const chartData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)",
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)",
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)",
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export default function ChartPie() {
  return (
      <Card className="flex h-full w-full flex-col gap-2 py-3 font-poppins text-center">
        <CardHeader className="shrink-0 items-center px-3 pb-0">
          <CardTitle className="text-sm">Rendimentos/Despesas</CardTitle>
          <CardDescription className="text-xs">January - June 2024</CardDescription>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 px-3 pb-0">
          <ChartContainer config={chartConfig} className="mx-auto aspect-auto h-full w-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                  data={chartData}
                  dataKey="visitors"
                  nameKey="browser"
                  outerRadius="80%"
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
  )
}


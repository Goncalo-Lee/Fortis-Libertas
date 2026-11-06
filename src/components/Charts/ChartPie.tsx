'use client';

import { useMemo } from "react";
import { PieChart as PieChartIcon } from "lucide-react";
import { Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useFinancial } from "@/contexts/FinancialContext";

const chartConfig = {
  value: { label: "Valor" },
  receitas: {
    label: "Receitas",
    color: "var(--app-gains)", // Receitas a Verde!
  },
  despesas: {
    label: "Despesas",
    color: "var(--app-loses)", // Despesas a Vermelho!
  },
} satisfies ChartConfig;

export default function ChartPie() {
  const { financialRecords } = useFinancial();

  const { chartData, hasData } = useMemo(() => {
    if (!financialRecords || financialRecords.length === 0) {
      return { chartData: [], hasData: false };
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let incomeTotal = 0;
    let expenseTotal = 0;

    financialRecords.forEach((record: any) => {
      if (!record.date) return;
      const recordDate = new Date(record.date);

      if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
        if (record.isExpense) expenseTotal += record.amount;
        if (record.isIncome) incomeTotal += record.amount;
      }
    });

    const data = [
      { id: "receitas", label: "Receitas", value: incomeTotal, fill: "var(--app-gains)" },
      { id: "despesas", label: "Despesas", value: expenseTotal, fill: "var(--app-loses)" }
    ];

    return {
      chartData: data,
      hasData: incomeTotal > 0 || expenseTotal > 0
    };
  }, [financialRecords]);

  return (
      <Card className="font-poppins w-full h-full flex flex-col justify-center items-center text-center shadow-sm py-3">
        <CardHeader className="pb-1 md:pb-2 w-full px-3">
          <CardTitle className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
            <PieChartIcon className="w-4 h-4 text-stone-400" />
            Receitas vs Despesas
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 px-3 pb-0 w-full flex items-center justify-center">
          {hasData ? (
              <ChartContainer config={chartConfig} className="mx-auto aspect-auto h-full w-full max-h-[200px]">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie data={chartData} dataKey="value" nameKey="id" outerRadius="80%" stroke="none" />
                </PieChart>
              </ChartContainer>
          ) : (
              <div className="text-sm text-muted-foreground flex flex-col items-center justify-center h-full gap-2">
                <PieChartIcon className="w-6 h-6 text-stone-200" />
                <span>Sem movimentos este mês</span>
              </div>
          )}
        </CardContent>
      </Card>
  );
}
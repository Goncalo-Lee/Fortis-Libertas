'use client';

import { useMemo } from "react";
import { PieChart as PieChartIcon } from "lucide-react";
import { Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useFinancial } from "@/contexts/FinancialContext";

// Configuração das cores (Verde para Receitas, Vermelho/Laranja para Despesas)
const chartConfig = {
  value: {
    label: "Valor",
  },
  receitas: {
    label: "Receitas",
    color: "#22c55e", // Verde (combina com o cartão de Receitas)
  },
  despesas: {
    label: "Despesas",
    color: "#ef4444", // Vermelho (combina com o cartão de Despesas)
  },
} satisfies ChartConfig;

export default function ChartPie() {
  const { financialRecords, recordTypes } = useFinancial();

  const { chartData, hasData } = useMemo(() => {
    if (!financialRecords || !recordTypes) {
      return { chartData: [], hasData: false };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let incomeTotal = 0;
    let expenseTotal = 0;

    financialRecords.forEach((record: any) => {
      const dateString = record.paymentDate || record.payment_date;
      if (!dateString) return;

      const recordDate = new Date(dateString);

      // Apenas somamos os dados do mês atual
      if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
        let typeName = record.recordType?.name?.toLowerCase() || "";
        if (!typeName) {
          const typeId = record.recordTypeId || record.record_type_id;
          const rt = recordTypes.find((t: any) => t.id === typeId);
          if (rt) typeName = rt.name.toLowerCase();
        }

        const price = Number(record.price || 0);

        if (typeName.includes('despesa') || typeName.includes('expense')) {
          expenseTotal += Math.abs(price);
        } else if (typeName.includes('receita') || typeName.includes('income')) {
          incomeTotal += Math.abs(price);
        }
      }
    });

    const data = [
      { id: "receitas", label: "Receitas", value: incomeTotal, fill: "var(--color-receitas)" },
      { id: "despesas", label: "Despesas", value: expenseTotal, fill: "var(--color-despesas)" }
    ];

    return {
      chartData: data,
      hasData: incomeTotal > 0 || expenseTotal > 0
    };
  }, [financialRecords, recordTypes]);

  return (
      <Card className="font-poppins w-full h-full flex flex-col justify-center items-center text-center shadow-sm py-3">

        {/* Título e ícone estritamente iguais aos outros cartões */}
        <CardHeader className="pb-1 md:pb-2 w-full px-3">
          <CardTitle className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
            <PieChartIcon className="w-4 h-4 text-stone-400" />
            Rácio do Mês
          </CardTitle>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 px-3 pb-0 w-full flex items-center justify-center">
          {hasData ? (
              <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-auto h-full w-full max-h-[200px]"
              >
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="id"
                      outerRadius="80%" //
                      stroke="none"
                  />
                </PieChart>
              </ChartContainer>
          ) : (
              // Caso não haja despesas nem receitas no mês
              <div className="text-sm text-muted-foreground flex flex-col items-center justify-center h-full gap-2">
                <PieChartIcon className="w-6 h-6 text-stone-200" />
                <span>Sem movimentos</span>
              </div>
          )}
        </CardContent>
      </Card>
  )
}
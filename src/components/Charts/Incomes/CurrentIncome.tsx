'use client';

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react"
import { useFinancial } from "@/contexts/FinancialContext";

export default function CurrentIncome() {
    const { financialRecords } = useFinancial();

    const { currentMonthTotal, percentageChange, isIncrease } = useMemo(() => {
        if (!financialRecords || financialRecords.length === 0) {
            return { currentMonthTotal: 0, percentageChange: 0, isIncrease: false };
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Cálculo seguro do mês passado
        let lastMonth = currentMonth - 1;
        let lastYear = currentYear;
        if (lastMonth < 0) {
            lastMonth = 11; // Dezembro
            lastYear -= 1;
        }

        let currentTotal = 0;
        let previousTotal = 0;

        financialRecords.forEach((record: any) => {
            // Se for receita, soma ao mês correspondente
            if (record.isIncome && record.date) {
                const recordDate = new Date(record.date);
                const recordMonth = recordDate.getMonth();
                const recordYear = recordDate.getFullYear();

                if (recordMonth === currentMonth && recordYear === currentYear) {
                    currentTotal += record.amount;
                } else if (recordMonth === lastMonth && recordYear === lastYear) {
                    previousTotal += record.amount;
                }
            }
        });

        // Cálculo da variação percentual
        let percent = 0;
        if (previousTotal > 0) {
            percent = ((currentTotal - previousTotal) / previousTotal) * 100;
        } else if (currentTotal > 0) {
            percent = 100;
        }

        return {
            currentMonthTotal: currentTotal,
            percentageChange: Math.abs(percent),
            isIncrease: currentTotal > previousTotal
        };
    }, [financialRecords]);

    return (
        <Card className="font-poppins w-full h-full flex flex-col justify-center items-center text-center shadow-sm">
            <CardHeader className="pb-1 md:pb-2 w-full">
                <CardTitle className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-500" />
                    Receitas do Mês
                </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center pb-3 md:pb-4 w-full px-4 overflow-hidden">
                <div className="text-slate-900 dark:text-white text-xl sm:text-2xl md:text-xl lg:text-3xl font-bold tracking-tight w-full truncate leading-tight">
                    {currentMonthTotal.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-2 sm:mt-3">
                    <Badge
                        variant="secondary"
                        className={`px-2 py-1 text-xs sm:text-sm whitespace-nowrap ${
                            isIncrease
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : percentageChange === 0
                                    ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                    >
                        {isIncrease ? (
                            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        ) : percentageChange === 0 ? null : (
                            <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        )}
                        {isIncrease ? "+" : (percentageChange > 0 ? "-" : "")}
                        {percentageChange.toFixed(1)}%
                    </Badge>
                    <span className="text-xs sm:text-sm md:text-base text-muted-foreground whitespace-nowrap">
                        vs mês passado
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
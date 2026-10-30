'use client';

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { useFinancial } from "@/contexts/FinancialContext"; // Ajusta o path se necessário

export default function CurrentExpenses() {
    // 1. Consume the global financial context
    const { financialRecords, recordTypes } = useFinancial();

    // 2. Calculate the current and previous month expenses dynamically
    const { currentMonthTotal, percentageChange, isIncrease } = useMemo(() => {
        // Fallback if data is still loading
        if (!financialRecords || !recordTypes) {
            return { currentMonthTotal: 0, percentageChange: 0, isIncrease: false };
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calculate the exact month and year for the previous month
        let lastMonth = currentMonth - 1;
        let lastYear = currentYear;
        if (lastMonth < 0) {
            lastMonth = 11; // December
            lastYear -= 1;
        }

        let currentTotal = 0;
        let previousTotal = 0;

        financialRecords.forEach((record: any) => {
            // A. Check if the record is an expense
            let typeName = record.recordType?.name?.toLowerCase() || "";
            if (!typeName) {
                const typeId = record.recordTypeId || record.record_type_id;
                const rt = recordTypes.find((t: any) => t.id === typeId);
                if (rt) typeName = rt.name.toLowerCase();
            }

            const isExpense = typeName.includes('despesa') || typeName.includes('expense');

            if (isExpense) {
                // B. Parse the payment date (supporting both camelCase and snake_case)
                const dateString = record.paymentDate || record.payment_date;
                if (!dateString) return; // Skip if there's no date

                const recordDate = new Date(dateString);
                const recordMonth = recordDate.getMonth();
                const recordYear = recordDate.getFullYear();

                const price = Number(record.price || 0);

                // C. Add the price to the matching month
                if (recordMonth === currentMonth && recordYear === currentYear) {
                    currentTotal += Math.abs(price);
                } else if (recordMonth === lastMonth && recordYear === lastYear) {
                    previousTotal += Math.abs(price);
                }
            }
        });

        // D. Calculate the percentage change between the two months
        let percent = 0;
        if (previousTotal > 0) {
            percent = ((currentTotal - previousTotal) / previousTotal) * 100;
        } else if (currentTotal > 0) {
            percent = 100; // If last month was 0 and this month we have expenses
        }

        return {
            currentMonthTotal: currentTotal,
            percentageChange: Math.abs(percent),
            isIncrease: currentTotal > previousTotal
        };
    }, [financialRecords, recordTypes]);

    return (
        <Card className="font-poppins w-full h-full flex flex-col justify-center items-center text-center shadow-sm">
            <CardHeader className="pb-1 md:pb-2 w-full">
                <CardTitle className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                    <Minus className="w-4 h-4 text-red-500" />
                    Despesas do Mês
                </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center pb-3 md:pb-4 w-full px-4 overflow-hidden">
                {/* Dynamically formatted current month total */}
                <div className="text-primary-app dark:text-white text-xl sm:text-2xl md:text-xl lg:text-3xl font-bold tracking-tight w-full truncate leading-tight">
                    {currentMonthTotal.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                </div>

                {/* Badge adjusts colors based on whether expenses went up (bad/red) or down (good/green) */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2 sm:mt-3">
                    <Badge
                        variant="secondary"
                        className={`px-2 py-1 text-xs sm:text-sm whitespace-nowrap ${
                            isIncrease
                                ? "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                                : percentageChange === 0
                                    ? "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400"
                                    : "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
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
import ChartPie from "@/components/Charts/ChartPie";
import {IncomeExpenseChart} from "@/components/Charts/IncomeExpenseChart";
import {LeftoverBalanceChart} from "@/components/Charts/LeftoverBalanaceChart";
import ChartPieLabel from "@/components/Charts/ChartPieLabel";
import ChartRadial from "@/components/Charts/ChartRadial";
import ChartPieTest from "@/components/Charts/ChartPieTest";
import {TestChart} from "@/components/Charts/TestChart";
import React from "react";
import CurrentExpenses from "@/components/Charts/Expenses/CurrentExpenses";

export default function ExpensesPage() {
    return (
        <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black h-full">
            {/* Added auto-rows-[350px] at the end of this line */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 w-full h-f px-4 auto-rows-[420px]">
                <CurrentExpenses />
                <IncomeExpenseChart  />
                <LeftoverBalanceChart />
                <ChartPie />
                <ChartPieLabel />
                <ChartRadial />
                <ChartPieTest />
                <TestChart />
            </div>
        </div>
    )
}
import CurrentBalance from "@/components/Charts/CurrentBalance";
import { IncomeExpenseChart } from "@/components/Charts/IncomeExpenseChart";
import ChartPie from "@/components/Charts/ChartPie";
import { FinanceCalendar } from "@/components/FinanceCalendar";
import CurrentExpense from "@/components/Charts/Expenses/CurrentExpenses";
import CurrentIncome from "@/components/Charts/Incomes/CurrentIncome";
import ChartRadial from "@/components/Charts/ChartRadial";
import AccountVault from "@/components/Charts/AccountVault";

const cell =
    "min-h-0 min-w-0 [&>*]:h-full [&>*]:w-full [&>*]:min-h-0 [&>*]:overflow-hidden";
const placeholder =
    "flex h-full w-full items-center justify-center rounded-xl border bg-muted/40 text-sm";

export default function DashboardPage() {
    return (
        <div className="h-full overflow-auto p-3 md:p-4 lg:overflow-hidden">
            <div className="grid grid-cols-1 gap-3 lg:h-full lg:grid-cols-3 lg:grid-rows-[1fr_2fr_1fr] lg:gap-4">
                {/* First line */}
                <div className={cell}><CurrentBalance /></div>
                <div className={cell}><ChartRadial /></div>
                <div className={cell}><AccountVault /></div>

                {/* Second line */}
                <div className={`${cell} lg:col-span-2`}><FinanceCalendar /></div>
                <div className={cell}><IncomeExpenseChart /></div>

                {/* Third line */}
                <div className={cell}><CurrentIncome /></div>
                <div className={cell}><CurrentExpense /></div>
                <div className={cell}><ChartPie /></div>
            </div>
        </div>
    );
}
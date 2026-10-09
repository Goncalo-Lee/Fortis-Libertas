import React from 'react';
import ChartPie from '@/components/ChartPie'
import ChartPieLabel from '@/components/ChartPieLabel';
import ChartRadial from "@/components/ChartRadial";
import ChartPieTest from "@/components/ChartPieTest";
import CurrentBalance from "@/components/CurrentBalance";
import { IncomeExpenseChart } from "@/components/IncomeExpenseChart";
import { LeftoverBalanceChart } from "@/components/LeftoverBalanaceChart";
import {TestChart} from "@/components/TestChart";

export default function page() {
    return (
        <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black min-h-screen py-10">
            <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-slate-100">
                Os nossos componentes
            </h1>

            {/*
            Substituímos o flex por grid.
            - grid-cols-1: 1 coluna em telemóveis
            - md:grid-cols-2: 2 colunas em tablets
            - xl:grid-cols-3: 3 colunas em ecrãs grandes
            - gap-6: espaço generoso entre os gráficos
            - max-w-7xl: impede que estique infinitamente em ecrãs gigantes
          */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full max-w-7xl px-6">
                <CurrentBalance />
                <IncomeExpenseChart />
                <LeftoverBalanceChart />
                <ChartPie />
                <ChartPieLabel />
                <ChartRadial />
                <ChartPieTest />
                <TestChart />
            </div>
        </div>
    );
}
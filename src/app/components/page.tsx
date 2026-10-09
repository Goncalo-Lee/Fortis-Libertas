import React from 'react';
import ChartPie from '@/components/ChartPie'
import ChartPieLabel from '@/components/ChartPieLabel';
import ChartRadial from "@/components/ChartRadial";
import ChartPieTest from "@/components/ChartPieTest";

export default function page() {
  return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
          <h1>Componentes</h1>
          <div className="flex items-center justify-center gap-4">
              <ChartPie />
              <ChartPieLabel />
              <ChartRadial />
              <ChartPieTest />
          </div>
      </div>
  );
}
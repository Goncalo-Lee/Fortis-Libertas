import React from 'react';
import ChartPie from '@/src/components/ChartPie'
import ChartPieLabel from '@/src/components/ChartPieLabel';
import ChartRadial from "@/src/components/ChartRadial";
import ChartPieTest from "@/src/components/ChartPieTest";

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
import CurrentBalance from "@/components/Charts/CurrentBalance";
import {IncomeExpenseChart} from "@/components/Charts/IncomeExpenseChart";
import ChartPie from "@/components/Charts/ChartPie";


export default function DashboardPage() {
  return (
      <div className="flex flex-1 flex-col">
          {/* Removi o excesso de divs aninhadas e apliquei padding direto */}
          <div className="flex-1 space-y-4 p-4 md:space-y-6 md:p-8 pt-6">

              {/* 1ª Linha: Saldo Atual (Ocupa a largura total) */}
              <div className="w-full">
                  <CurrentBalance />
              </div>

              {/* 2ª Linha: Gráficos */}
              {/* Mobile: 1 coluna | Desktop: 3 colunas */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">

                  {/* Gráfico Principal (Ocupa 2/3 do espaço no Desktop) */}
                  <div className="lg:col-span-2">
                      <IncomeExpenseChart />
                  </div>

                  {/* Gráfico Circular (Ocupa 1/3 do espaço no Desktop) */}
                  <div className="lg:col-span-1">
                      <ChartPie />
                  </div>

              </div>

          </div>
      </div>
  )
}
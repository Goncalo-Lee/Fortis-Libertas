"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns"
import { pt } from "date-fns/locale"
import { ChevronLeftIcon, ChevronRightIcon, X, ArrowUpRight, ArrowDownRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinancial } from "@/contexts/FinancialContext"

export function FinanceCalendar() {
  const { financialRecords, recordTypes } = useFinancial()
  const [currentDate, setCurrentDate] = React.useState(new Date())

  // Estado para o Modal interno
  const [selectedDayInfo, setSelectedDayInfo] = React.useState<{ date: Date, incomes: any[], expenses: any[] } | null>(null)

  // Cálculos do mês atual
  const firstDayOfMonth = startOfMonth(currentDate)
  const lastDayOfMonth = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth })
  const startingDayIndex = getDay(firstDayOfMonth)

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))

  return (
      <Card className="relative flex h-full w-full flex-col gap-2 py-3 font-poppins shadow-sm overflow-hidden">

        {/* CABEÇALHO COM TÍTULO CENTRADO */}
        <CardHeader className="relative flex shrink-0 flex-row items-center justify-center px-3 pb-2 pt-1">
          <CardTitle className="text-sm sm:text-base capitalize font-bold text-slate-900 dark:text-slate-100">
            {format(currentDate, "MMMM yyyy", { locale: pt })}
          </CardTitle>
          <div className="absolute right-3 flex gap-1">
            <Button variant="outline" size="icon" className="size-6 h-7 w-7" onClick={prevMonth}>
              <ChevronLeftIcon className="size-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="size-6 h-7 w-7" onClick={nextMonth}>
              <ChevronRightIcon className="size-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col px-3 pb-3">
          {/* DIAS DA SEMANA */}
          <div className="mb-2 grid shrink-0 grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-semibold text-muted-foreground">
            <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
          </div>

          {/* GRELHA DO CALENDÁRIO */}
          <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1.5 sm:gap-2">
            {Array.from({ length: startingDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="rounded-md bg-slate-50 dark:bg-slate-900/20" />
            ))}

            {daysInMonth.map((day) => {
              const isToday = isSameDay(day, new Date())

              // 1. Apanhar os movimentos deste dia
              const dayMovements = (financialRecords || []).filter((m: any) => {
                const dateVal = m.paymentDate || m.payment_date
                return dateVal ? isSameDay(new Date(dateVal), day) : false
              })

              // 2. Separar Entradas e Saídas
              const incomes: any[] = []
              const expenses: any[] = []

              dayMovements.forEach((m: any) => {
                let typeName = m.recordType?.name || ""
                if (!typeName) {
                  const typeId = m.recordTypeId || m.record_type_id
                  const rt = (recordTypes || []).find((t: any) => t.id === typeId)
                  if (rt) typeName = rt.name
                }
                const isExpense = typeName.toLowerCase().includes("despesa") || typeName.toLowerCase().includes("expense")
                if (isExpense) expenses.push(m)
                else incomes.push(m)
              })

              const hasMovements = incomes.length > 0 || expenses.length > 0

              return (
                  <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => hasMovements && setSelectedDayInfo({ date: day, incomes, expenses })}
                      disabled={!hasMovements}
                      className={`relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-md border text-[10px] sm:text-xs leading-none transition-all duration-200 
                          ${isToday ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600"}
                          ${hasMovements ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" : "cursor-default opacity-80 shadow-none"}
                      `}
                  >
                    <span className="font-medium z-10">{format(day, "d")}</span>

                    {/* Contentor das bolinhas */}
                    <div className="mt-1 flex gap-1 h-1.5 items-center z-10">
                      {incomes.length > 0 && (
                          <span className="size-1.5 sm:size-2 rounded-full bg-emerald-500 shadow-sm" />
                      )}
                      {expenses.length > 0 && (
                          <span className="size-1.5 sm:size-2 rounded-full bg-red-500 shadow-sm" />
                      )}
                    </div>
                  </button>
              )
            })}
          </div>
        </CardContent>

        {/* OVERLAY MODAL INTERNO */}
        {selectedDayInfo && (
            <div className="absolute inset-0 z-50 flex flex-col bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  {format(selectedDayInfo.date, "dd 'de' MMMM", { locale: pt })}
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200" onClick={() => setSelectedDayInfo(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {selectedDayInfo.incomes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Entradas</h4>
                      {selectedDayInfo.incomes.map((inc) => (
                          <div key={inc.id} className="flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                                      {inc.name}
                                    </span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                        + €{Number(inc.price || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                    </span>
                          </div>
                      ))}
                    </div>
                )}

                {selectedDayInfo.expenses.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Saídas</h4>
                      {selectedDayInfo.expenses.map((exp) => (
                          <div key={exp.id} className="flex justify-between items-center bg-red-50/50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/50">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                                      {exp.name}
                                    </span>
                            <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                        - €{Number(exp.price || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                    </span>
                          </div>
                      ))}
                    </div>
                )}
              </div>
            </div>
        )}
      </Card>
  )
}
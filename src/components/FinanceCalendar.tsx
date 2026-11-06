"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns"
import { pt } from "date-fns/locale"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Mock de movimentos financeiros
const movimentos = [
  { id: 1, date: new Date(2026, 9, 15), amount: -50.0, desc: "Supermercado" },
  { id: 2, date: new Date(2026, 9, 15), amount: 1200.0, desc: "Salário" },
  { id: 3, date: new Date(2026, 9, 24), amount: -15.5, desc: "Netflix" },
]

export function FinanceCalendar() {
  const [currentDate, setCurrentDate] = React.useState(new Date())

  // Cálculos do mês atual
  const firstDayOfMonth = startOfMonth(currentDate)
  const lastDayOfMonth = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth })

  // Para alinhar o dia 1 no dia da semana correto (0 = Domingo, 1 = Segunda)
  const startingDayIndex = getDay(firstDayOfMonth)

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))

  return (
      <Card className="flex h-full w-full flex-col gap-2 py-3 font-poppins">
        <CardHeader className="flex shrink-0 flex-row items-center justify-between px-3 pb-0">
          <CardTitle className="text-sm capitalize">
            {format(currentDate, "MMMM yyyy", { locale: pt })}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="size-6" onClick={prevMonth}>
              <ChevronLeftIcon className="size-3" />
            </Button>
            <Button variant="outline" size="icon" className="size-6" onClick={nextMonth}>
              <ChevronRightIcon className="size-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col px-3">
          <div className="mb-1 grid shrink-0 grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
            <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1">
            {Array.from({ length: startingDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="rounded-sm bg-muted/20" />
            ))}

            {daysInMonth.map((day) => {
              const dayMovements = movimentos.filter((m) => isSameDay(m.date, day))
              const isToday = isSameDay(day, new Date())
              const total = dayMovements.reduce((s, m) => s + m.amount, 0)

              return (
                  <div
                      key={day.toISOString()}
                      className={`relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-sm border text-[10px] leading-none transition-colors hover:bg-muted/50 ${
                          isToday ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground"
                      }`}
                      title={dayMovements.map((m) => `${m.desc}: ${m.amount}€`).join("\n")}
                  >
                    <span className="font-medium">{format(day, "d")}</span>
                    {dayMovements.length > 0 && (
                        <span
                            className={`mt-0.5 size-1.5 rounded-full ${
                                total >= 0 ? "bg-green-500" : "bg-red-500"
                            }`}
                        />
                    )}
                  </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
  )
}
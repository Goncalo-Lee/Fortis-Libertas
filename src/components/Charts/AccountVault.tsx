"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PiggyBank, ShieldCheck } from "lucide-react"

export default function AccountVault() {
    const totalSaved = 3420
    const securityLevel = 4

    // Permite fixar o valor ao clicar (útil em mobile) ou mostrar apenas ao passar o rato
    const [isPinned, setIsPinned] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const showValue = isPinned || isHovered

    return (
        <Card
            onClick={() => setIsPinned((prev) => !prev)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setIsPinned((prev) => !prev)
                }
            }}
            aria-label="Mostrar ou ocultar valor da poupança"
            className="@container flex h-full w-full cursor-pointer select-none flex-col justify-between py-3 font-poppins shadow-sm transition-colors hover:border-emerald-200 dark:hover:border-emerald-800/60"
        >
            <CardHeader className="pb-1 md:pb-2 w-full z-10">
                <CardTitle className="text-sm sm:text-base md:text-lg font-medium text-muted-foreground flex items-center justify-center gap-2">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                        <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    Poupanças
                </CardTitle>
            </CardHeader>

            <CardContent className="px-4 pb-2 flex flex-col items-center justify-center text-center gap-3 my-auto">

                {/* Ilustração central com ligeiro zoom quando ativo */}
                <div className="relative flex items-center justify-center">
                    <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shadow-inner transition-transform duration-300 ${
                            showValue ? "scale-105" : "scale-100"
                        }`}
                    >
                        <PiggyBank className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400 stroke-[1.75]" />
                    </div>

                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                        <ShieldCheck className="w-4 h-4 text-teal-500" />
                    </div>
                </div>

                {/* Contentor em grelha para alternar entre as barras e o valor sem mudar a altura do cartão */}
                <div className="grid w-full items-center justify-items-center">

                    {/* Estado Padrão: Barras de nível + Texto */}
                    <div
                        className={`col-start-1 row-start-1 flex w-full flex-col items-center gap-2.5 transition-all duration-300 ${
                            showValue
                                ? "pointer-events-none translate-y-2 opacity-0"
                                : "translate-y-0 opacity-100"
                        }`}
                    >
                        <div className="flex items-center gap-1.5 w-full max-w-[140px] justify-center">
                            {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                    key={level}
                                    className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                                        level <= securityLevel
                                            ? "bg-emerald-500 dark:bg-emerald-400"
                                            : "bg-slate-100 dark:bg-slate-800"
                                    }`}
                                />
                            ))}
                        </div>

                        <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                            Reserva saudável
                        </span>
                    </div>

                    {/* Estado Revelado (Hover ou Clique): Valor em Euros */}
                    <div
                        className={`col-start-1 row-start-1 flex w-full flex-col items-center gap-0.5 transition-all duration-300 ${
                            showValue
                                ? "translate-y-0 opacity-100"
                                : "pointer-events-none -translate-y-2 opacity-0"
                        }`}
                    >
                        <div className="text-primary-app dark:text-white text-xl font-bold @[220px]:text-xl @[320px]:text-2xl lg:text-3xl">
                            € {totalSaved.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {isPinned ? "Fixado (clica para ocultar)" : "Total acumulado"}
                        </span>
                    </div>

                </div>

            </CardContent>
        </Card>
    )
}
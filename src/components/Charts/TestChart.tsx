"use client"

import { Target } from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export function TestChart() {
    const goal = 2000
    const saved = 1350

    const percentage = Math.min(Math.round((saved / goal) * 100), 100)

    const sockHeight = 80
    const fillAmount = (percentage / 100) * sockHeight
    const fillY = 100 - fillAmount

    return (
        <Card className="w-full max-w-sm shadow-sm border-slate-200">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                    O teu Pé de Meia 🧦
                </CardTitle>
                <CardDescription className="text-slate-500">
                    A tua poupança para a viagem de férias
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center pt-6 pb-4">

                <div className="relative flex items-center justify-center w-full h-48">

                    <svg
                        viewBox="0 0 120 120"
                        className="w-40 h-40 drop-shadow-md z-20"
                        aria-label={`${percentage}% do pé de meia preenchido`}
                    >
                        <defs>
                            <clipPath id="formato-meia-real">
                                <path d="M40,20 h30 v50 c0,10 10,10 20,10 c15,0 15,20 0,20 h-40 c-20,0 -20,-20 -10,-30 v-50 z" />
                            </clipPath>
                        </defs>

                        {/* Fundo da meia */}
                        <rect
                            width="120"
                            height="120"
                            fill="#f1f5f9"
                            clipPath="url(#formato-meia-real)"
                        />

                        {/* Preenchimento em Azul */}
                        <rect
                            x="0"
                            y={fillY}
                            width="120"
                            height={fillAmount + 10}
                            fill="#3b82f6"
                            className="transition-all duration-1000 ease-out"
                            clipPath="url(#formato-meia-real)"
                        />

                        {/* Contorno */}
                        <path
                            d="M40,20 h30 v50 c0,10 10,10 20,10 c15,0 15,20 0,20 h-40 c-20,0 -20,-20 -10,-30 v-50 z"
                            fill="none"
                            stroke="#334155"
                            strokeWidth="3"
                        />

                        {/* Elástico no topo */}
                        <rect x="36" y="16" width="38" height="12" rx="4" fill="#64748b" stroke="#334155" strokeWidth="2" />
                        <line x1="42" y1="16" x2="42" y2="28" stroke="#334155" strokeWidth="1.5" />
                        <line x1="55" y1="16" x2="55" y2="28" stroke="#334155" strokeWidth="1.5" />
                        <line x1="68" y1="16" x2="68" y2="28" stroke="#334155" strokeWidth="1.5" />
                    </svg>

                    {/* Etiqueta de percentagem */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-full border-2 border-white shadow-sm z-30">
                        {percentage}% Cheio
                    </div>
                </div>

                <div className="mt-2 flex flex-col items-center text-center">
                    <span className="text-3xl font-extrabold text-slate-800">{saved}€</span>
                    <span className="text-sm text-slate-500 mt-1">de {goal}€ planeados</span>
                </div>
            </CardContent>

            <CardFooter className="pt-4 pb-4 bg-slate-50/50 rounded-b-xl border-t mt-2 flex justify-center text-sm font-medium text-slate-600">
        <span className="flex items-center gap-2">
          <Target className="h-4 w-4 text-slate-400" />
          Faltam apenas <strong className="text-slate-800">{goal - saved}€</strong> para o objetivo.
        </span>
            </CardFooter>
        </Card>
    )
}
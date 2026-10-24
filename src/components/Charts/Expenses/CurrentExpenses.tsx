import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, Minus } from "lucide-react"

export default function CurrentExpense() {
    return (
        // O "group" aqui permite que o hover anime o ícone de fundo
        <Card className="font-poppins w-full h-full flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden group border-orange-100 dark:border-orange-900/30">
            <CardHeader className="pb-1 md:pb-2 w-full z-10">
                <CardTitle className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                    <Minus className="w-4 h-4 text-orange-500" />
                    Despesas do Mês
                </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center pb-3 md:pb-4 w-full px-4 overflow-hidden z-10">
                <div className="text-primary-app dark:text-white text-xl sm:text-2xl md:text-xl lg:text-3xl font-bold tracking-tight w-full truncate leading-tight">
                    € 3.120,00
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-2 sm:mt-3">
                    {/* Badge em tons de laranja (a indicar uma descida nas despesas, o que é bom) */}
                    <Badge variant="secondary" className="px-2 py-1 text-xs sm:text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-400 whitespace-nowrap border-none">
                        <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        -1.8%
                    </Badge>
                    <span className="text-xs sm:text-sm md:text-base text-muted-foreground whitespace-nowrap">
                        vs mês passado
                    </span>
                </div>

            </CardContent>
        </Card>
    )
}
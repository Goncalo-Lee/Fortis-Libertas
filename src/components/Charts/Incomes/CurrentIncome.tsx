import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from "lucide-react"

export default function CurrentIncome() {
    return (
        <Card className="w-full h-full flex flex-col justify-center items-center text-center shadow-sm">

            <CardHeader className="pb-2 md:pb-4 w-full">
                <CardTitle className="text-sm sm:text-base md:text-lg font-medium text-muted-foreground">
                    Rendimento Total
                </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center pb-4 md:pb-6 w-full px-4 overflow-hidden">

                {/* O truncate garante que o número nunca "parte" o cartão ao meio se o ecrã for muito estreito */}
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white w-full truncate">
                    € 8.250,00
                </div>

                {/* O flex-wrap permite que a badge e o texto se adaptem se não houver espaço na horizontal */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3 sm:mt-5">
                    <Badge variant="secondary" className="px-2 py-1 text-xs sm:text-sm bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap">
                        <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        +12.3%
                    </Badge>
                    <span className="text-xs sm:text-sm md:text-base text-muted-foreground whitespace-nowrap">
                        vs mês passado
                    </span>
                </div>

            </CardContent>
        </Card>
    )
}
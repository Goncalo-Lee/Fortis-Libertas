import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Plus } from "lucide-react"

export default function CurrentIncome() {
    return (
        <Card className="font-poppins w-full h-full flex flex-col justify-center items-center text-center shadow-sm">

            <CardHeader className="pb-1 md:pb-2 w-full">
                <CardTitle className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4 text-green-500" />
                    Receitas do Mês
                </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center pb-3 md:pb-4 w-full px-4 overflow-hidden">

                {/* O truncate garante que o número nunca "parte" o cartão ao meio se o ecrã for muito estreito */}
                <div className="text-primary-app dark:text-white text-xl sm:text-2xl md:text-xl lg:text-3xl font-bold tracking-tight w-full truncate leading-tight">
                    € 8.250,00
                </div>

                {/* O flex-wrap permite que a badge e o texto se adaptem se não houver espaço na horizontal */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2 sm:mt-3">
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
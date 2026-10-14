import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, CreditCard } from "lucide-react" // Não te esqueças de importar o CreditCard

export default function CurrentExpense() {
    return (
        // O "group" aqui permite que o hover anime o ícone de fundo
        <Card className="w-full h-full flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden group border-orange-100 dark:border-orange-900/30">

            {/* Efeito decorativo subtil no fundo (Laranja) */}
            <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05] transition-transform duration-500 group-hover:scale-110 pointer-events-none">
                <CreditCard className="w-40 h-40 text-orange-600" />
            </div>

            <CardHeader className="pb-2 md:pb-4 w-full z-10">
                <CardTitle className="text-sm sm:text-base md:text-lg font-medium text-muted-foreground flex items-center justify-center gap-2">
                    {/* Pequeno ícone de destaque para embelezar */}
                    <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                        <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    Despesas do Mês
                </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center pb-4 md:pb-6 w-full px-4 overflow-hidden z-10">

                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-blue-950 dark:text-white w-full truncate">
                    € 3.120,00
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-3 sm:mt-5">
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
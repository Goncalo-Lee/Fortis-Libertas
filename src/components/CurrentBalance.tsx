import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from "lucide-react"

export default function CurrentBalance() {
    return (
        <Card className="w-full max-w-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Saldo Disponível
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">€ 2.450,00</div>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +4.5%
                    </Badge>
                    <span className="text-xs text-muted-foreground">vs mês passado</span>
                </div>
            </CardContent>
        </Card>
    )
}
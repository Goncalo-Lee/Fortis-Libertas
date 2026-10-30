"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {CreditCard} from "lucide-react";
import { useFinancial} from "@/contexts/FinancialContext"


export default function CurrentBalance() {
    const { balance, loading } = useFinancial()

    if (loading) return <div>Carregando...</div>;

    return (
        <Card className="@container flex h-full w-full flex-col justify-center gap-1 py-3 font-poppins">
            
            <CardHeader className="pb-2 md:pb-4 w-full z-10">
                <CardTitle className="text-sm sm:text-base md:text-lg font-medium text-muted-foreground flex items-center justify-center gap-2">
                    {/* Pequeno ícone de destaque para embelezar */}
                    <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                        <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    Saldo Disponível
                </CardTitle>
            </CardHeader>



            <CardContent className="px-4 pb-2">
                <div className="text-primary-app dark:text-white text-center text-xl font-bold @[220px]:text-xl @[320px]:text-2xl lg:text-3xl">
                    {(balance ?? 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                </div>
            </CardContent>
        </Card>
    )
}
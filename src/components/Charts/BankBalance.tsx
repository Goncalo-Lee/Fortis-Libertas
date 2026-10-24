"use client"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react";

// 1. Atualiza as props para receber o ID
type Props = {
    id: string | number;
}

export default function BankBalance({ id }: Props) {
    const [balance, setBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Reset ao loading se o ID mudar
        setIsLoading(true);

        // 2. Usa template literals (crases ` `) para colocar o ID dinamicamente no URL
        fetch(`http://localhost:8080/me`)
            .then(response => response.json())
            .then(data => {
                setBalance(data.balance);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setIsLoading(false);
            });

        // 3. ADICIONA O ARRAY DE DEPENDÊNCIAS AQUI.
        // Ao colocar o [id], o React só volta a fazer fetch se o ID mudar.
    }, [id]);

    if (isLoading) return <div>Loading...</div>;

    return (
        <Card className="max-w-sm font-poppins">
            <CardTitle>Saldo Disponível</CardTitle>
            <CardContent>
                <div className="text-3xl font-bold">€ {balance}</div>
            </CardContent>
        </Card>
    )
}
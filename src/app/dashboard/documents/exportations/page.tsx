'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext'; // Importar o cérebro

export default function InitialBalanceComponent() {
    const { activeDashboard, loading: contextLoading } = useDashboard();

    const [initialBalance, setInitialBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Se o contexto ainda está a carregar ou não há dashboard ativo, espera.
        if (contextLoading || !activeDashboard) return;

        setLoading(true); // Se o utilizador trocou de dashboard, ativamos o loading

        // Faz fetch direto usando o ID do dashboard que o contexto diz que está ativo!
        fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/bank-accounts`)
            .then(async (res) => {
                if (!res.ok) throw new Error(`Falha HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => {
                let balance = null;
                if (Array.isArray(data) && data.length > 0) {
                    balance = data[0].initial_balance ?? data[0].initialBalance;
                } else if (data && Array.isArray(data.data) && data.data.length > 0) {
                    balance = data.data[0].initial_balance ?? data.data[0].initialBalance;
                }

                setInitialBalance(balance !== null ? Number(balance) : 0);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

    }, [activeDashboard, contextLoading]); // <-- A MAGIA: Sempre que o activeDashboard mudar, isto corre outra vez automaticamente!

    if (contextLoading || loading) return <p>A sincronizar saldo...</p>;
    if (error) return <p style={{ color: 'red' }}>Erro: {error}</p>;

    return (
        <div>
            <h2>Saldo de "{activeDashboard?.name}": {initialBalance?.toFixed(2)} €</h2>
        </div>
    );
}
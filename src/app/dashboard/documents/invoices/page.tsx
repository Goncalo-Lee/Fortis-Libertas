'use client';

import { useState, useEffect } from 'react';

export default function InitialBalanceComponent() {
    const [initialBalance, setInitialBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBalance() {
            try {
                // PASSO 1: Descobrir qual é o dashboard da Maria
                // (Assumo que o seu colega tenha criado este endpoint para listar os dashboards do utilizador)
                const dashRes = await fetch('/api/v1/dashboards');
                if (!dashRes.ok) {
                    const errorText = await dashRes.text();
                    throw new Error(`Falha ao carregar dashboards (HTTP ${dashRes.status}): ${errorText}`);
                }

                const dashData = await dashRes.json();

                // Extrair o ID do dashboard (adaptar consoante a estrutura do JSON do seu colega)
                const dashboards = Array.isArray(dashData) ? dashData : dashData.data || [];
                if (dashboards.length === 0) {
                    throw new Error("O utilizador não tem nenhum dashboard associado.");
                }

                const dashboardId = dashboards[0].dashboard_id || dashboards[0].id;

                // PASSO 2: Agora que temos o ID, vamos finalmente buscar a conta bancária!
                const bankRes = await fetch(`/api/v1/dashboards/${dashboardId}/bank-accounts`);
                if (!bankRes.ok) {
                    const errorText = await bankRes.text();
                    throw new Error(`Falha ao carregar contas (HTTP ${bankRes.status}): ${errorText}`);
                }

                const bankData = await bankRes.json();
                console.log("Resposta final das contas:", bankData);

                let balance = null;
                if (Array.isArray(bankData) && bankData.length > 0) {
                    balance = bankData[0].initial_balance ?? bankData[0].initialBalance;
                } else if (bankData && Array.isArray(bankData.data) && bankData.data.length > 0) {
                    balance = bankData.data[0].initial_balance ?? bankData.data[0].initialBalance;
                }

                if (balance === null || balance === undefined) {
                    throw new Error("Não encontrei o saldo na resposta.");
                }

                setInitialBalance(Number(balance));
                setLoading(false);

            } catch (err: any) {
                console.error('Erro encadeado:', err);
                setError(err.message);
                setLoading(false);
            }
        }

        fetchBalance();
    }, []);

    if (loading) return <p>A sincronizar com o workspace...</p>;
    if (error) return <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>;

    return (
        <div>
            <h2>Saldo Inicial da Conta: {initialBalance !== null ? `${initialBalance.toFixed(2)} €` : 'Indisponível'}</h2>
        </div>
    );
}
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useDashboard } from './DashboardContext';

const FinancialContext = createContext<any>(undefined);

export function FinancialProvider({ children }: { children: ReactNode }) {
    const { activeDashboard, loading: dashLoading } = useDashboard();

    // Todos os dados de referência
    const [bankAccounts, setBankAccounts] = useState([]);
    const [cards, setCards] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [recordTypes, setRecordTypes] = useState([]);

    // Dados de transação (mensais/dinâmicos)
    const [financialRecords, setFinancialRecords] = useState([]);
    const [installmentPlans, setInstallmentPlans] = useState([]);

    // 👈 NOVO: Estado para guardar o saldo atual calculado pelo backend
    const [balance, setBalance] = useState<number>(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (dashLoading || !activeDashboard) return;

        setLoading(true);
        setError(null);

        const dashId = activeDashboard.dashboard_id;

        Promise.all([
            fetch(`/api/v1/dashboards/${dashId}/bank-accounts`).then(res => res.json()),
            fetch(`/api/v1/dashboards/${dashId}/cards`).then(res => res.json()),
            fetch(`/api/v1/dashboards/${dashId}/categories`).then(res => res.json()),
            fetch(`/api/v1/dashboards/${dashId}/tags`).then(res => res.json()),
            fetch(`/api/v1/dashboards/${dashId}/payment-methods`).then(res => res.json()),
            fetch(`/api/v1/dashboards/${dashId}/record-types`).then(res => res.json()),
            fetch(`/api/v1/dashboards/${dashId}/financial-records`).then(res => res.json()),
            fetch(`/api/v1/dashboards/${dashId}/installment-plans`).then(res => res.json()),
            // 👈 NOVO: Faz o fetch à nova rota do saldo
            fetch(`/api/v1/dashboards/${dashId}/balance`).then(res => res.json())
        ])
            .then(([banks, cardsData, cats, tagsData, pays, types, records, plans, balanceData]) => {
                setBankAccounts(banks.data || banks || []);
                setCards(cardsData.data || cardsData || []);
                setCategories(cats.data || cats || []);
                setTags(tagsData.data || tagsData || []);
                setPaymentMethods(pays.data || pays || []);
                setRecordTypes(types.data || types || []);
                setFinancialRecords(records.data || records || []);
                setInstallmentPlans(plans.data || plans || []);

                // 👈 NOVO: Guarda o saldo que vem no { data: { balance: X } }
                setBalance(balanceData?.data?.balance || balanceData?.balance || 0);

                setLoading(false);
            })
            .catch(err => {
                console.error("Erro no ecossistema financeiro:", err);
                setError("Não foi possível sincronizar todos os dados.");
                setLoading(false);
            });

    }, [activeDashboard, dashLoading]);

    return (
        <FinancialContext.Provider value={{
            bankAccounts, cards, categories, tags, paymentMethods,
            recordTypes, financialRecords, installmentPlans,
            balance, // 👈 NOVO: Disponibiliza o balance para o resto da app
            loading, error
        }}>
            {children}
        </FinancialContext.Provider>
    );
}

export const useFinancial = () => useContext(FinancialContext);
'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useDashboard } from './DashboardContext';

const FinancialContext = createContext<any>(undefined);

/**
 * Helper function to safely fetch data and handle non-JSON responses.
 * Prevents the application from crashing with "Unexpected token '<'"
 * if the server returns an HTML error page (e.g., 404 or 500).
 */
async function safeFetch(url: string) {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Fetch failed for ${url}: Status ${res.status} (${res.statusText})`);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error(`Network or parsing error when calling ${url}:`, err);
        return null;
    }
}

export function FinancialProvider({ children }: { children: ReactNode }) {
    const { activeDashboard, loading: dashLoading } = useDashboard();

    // Reference data states
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [cards, setCards] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [recordTypes, setRecordTypes] = useState<any[]>([]);

    // Transactional data states
    const [financialRecords, setFinancialRecords] = useState<any[]>([]);
    const [installmentPlans, setInstallmentPlans] = useState<any[]>([]);

    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ==========================================
    // REFRESH MECHANISM
    // ==========================================
    const [refreshKey, setRefreshKey] = useState(0);
    const refresh = () => setRefreshKey(prev => prev + 1);

    useEffect(() => {
        if (dashLoading) return;

        if (!activeDashboard) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const dashId = activeDashboard.dashboard_id;

        // Transformámos a Promise.all numa função async para permitir o Auto-Provisionamento
        async function fetchEcosystem() {
            try {
                const [
                    banksData,
                    cardsData,
                    catsData,
                    tagsData,
                    paysData,
                    typesData,
                    recordsData,
                    plansData
                ] = await Promise.all([
                    safeFetch('/api/v1/bank-accounts'),
                    safeFetch('/api/v1/cards'),
                    safeFetch(`/api/v1/dashboards/${dashId}/categories`),
                    safeFetch(`/api/v1/dashboards/${dashId}/tags`),
                    safeFetch(`/api/v1/dashboards/${dashId}/payment-methods`),
                    safeFetch(`/api/v1/dashboards/${dashId}/record-types`),
                    safeFetch(`/api/v1/dashboards/${dashId}/financial-records`),
                    safeFetch(`/api/v1/dashboards/${dashId}/installment-plans`),
                ]);

                let fetchedTypes = typesData?.data || typesData || [];

                // AUTO-PROVISIONING: Garante que INCOME e EXPENSE existem na BD para novos utilizadores
                const baseTypes = ["INCOME", "EXPENSE"];
                for (const typeName of baseTypes) {
                    const exists = fetchedTypes.some((t: any) => t.name && t.name.toUpperCase() === typeName);
                    if (!exists) {
                        try {
                            const createRes = await fetch(`/api/v1/dashboards/${dashId}/record-types`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: typeName, description: `System generated ${typeName}` })
                            });
                            if (createRes.ok) {
                                const newType = await createRes.json();
                                fetchedTypes.push(newType.data || newType);
                            }
                        } catch (err) {
                            console.error(`Failed to auto-create record type ${typeName}:`, err);
                        }
                    }
                }

                // Guardar nos estados (igual ao teu código original)
                setBankAccounts(banksData?.data || banksData || []);
                setCards(cardsData?.data || cardsData || []);
                setCategories(catsData?.data || catsData || []);
                setTags(tagsData?.data || tagsData || []);
                setPaymentMethods(paysData?.data || paysData || []);
                setRecordTypes(fetchedTypes); // Usamos a lista que já inclui os gerados automaticamente
                setFinancialRecords(recordsData?.data || recordsData || []);
                setInstallmentPlans(plansData?.data || plansData || []);

            } catch (err) {
                console.error("Error syncing financial ecosystem:", err);
                setError("Unable to synchronize all financial data.");
            } finally {
                setLoading(false);
            }
        }

        fetchEcosystem();

    }, [activeDashboard, dashLoading, refreshKey]);

    // ==========================================
    // FUNÇÃO PARA ADICIONAR REGISTOS (Disponível em qualquer página)
    // ==========================================
    const addFinancialRecord = async (recordData: {
        name: string;
        price: number;
        recordTypeName: "INCOME" | "EXPENSE";
        categoryId: string;
        paymentMethodId: string;
    }) => {
        if (!activeDashboard?.dashboard_id) throw new Error("Sem dashboard ativo.");

        // Procura o ID correto (case-insensitive para não falhar)
        const targetType = recordTypes.find((rt: any) => rt.name && rt.name.toUpperCase() === recordData.recordTypeName);
        if (!targetType) {
            throw new Error(`Tipo de registo '${recordData.recordTypeName}' não encontrado.`);
        }

        const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/financial-records`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: recordData.name,
                price: recordData.price,
                // Apanha o ID, quer ele venha como `id` ou como `record_type_id` da base de dados
                record_type_id: targetType.id || targetType.record_type_id,
                category_id: recordData.categoryId,
                payment_method_id: recordData.paymentMethodId,
                currency: "EUR",
                status: "paid",
                payment_date: new Date().toISOString()
            })
        });

        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.message || "Erro ao gravar registo financeiro.");
        }

        refresh(); // Atualiza os dados globalmente de forma imediata
        return await res.json();
    };

    /* ==========================================
           DERIVED STATE (CALCULATIONS)
           ========================================== */
    const balance = useMemo(() => {
        if (!bankAccounts.length && !financialRecords.length) return 0;

        const totalInitial = bankAccounts.reduce((acc, account) => {
            const initial = account.initialBalance ?? account.initial_balance ?? 0;
            return acc + Number(initial);
        }, 0);

        const totalRecords = financialRecords.reduce((acc, record) => {
            const price = Number(record.price || 0);

            let typeName = "";
            if (record.recordType?.name) {
                typeName = record.recordType.name.toLowerCase();
            } else {
                const rt = recordTypes.find((t: any) => t.id === record.recordTypeId);
                if (rt) typeName = rt.name.toLowerCase();
            }

            const isExpense = typeName.includes('despesa') || typeName.includes('expense');

            if (isExpense) {
                return acc - Math.abs(price);
            } else {
                return acc + Math.abs(price);
            }
        }, 0);

        return totalInitial + totalRecords;
    }, [bankAccounts, financialRecords, recordTypes]);

    return (
        <FinancialContext.Provider value={{
            balance,
            bankAccounts,
            cards,
            categories,
            tags,
            paymentMethods,
            recordTypes,
            financialRecords,
            installmentPlans,
            loading,
            error,
            refresh,
            addFinancialRecord // Exportamos a função!
        }}>
            {children}
        </FinancialContext.Provider>
    );
}

export const useFinancial = () => useContext(FinancialContext);
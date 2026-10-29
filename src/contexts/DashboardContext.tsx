'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipos para typescript
type Dashboard = { dashboard_id: string; name: string };
type DashboardContextType = {
    dashboards: Dashboard[];
    activeDashboard: Dashboard | null;
    setActiveDashboard: (dash: Dashboard) => void;
    loading: boolean;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [activeDashboard, setActiveDashboardState] = useState<Dashboard | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Carrega todos os dashboards a que o user tem acesso
        fetch('/api/v1/dashboards')
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : data.data || [];
                setDashboards(list);

                if (list.length > 0) {
                    // Tenta ver se havia um dashboard guardado no browser (F5)
                    const savedId = localStorage.getItem('activeDashboardId');
                    const found = list.find((d: Dashboard) => d.dashboard_id === savedId);

                    if (found) {
                        setActiveDashboardState(found);
                    } else {
                        // Se não houver nada guardado, escolhe o primeiro da lista por defeito
                        setActiveDashboardState(list[0]);
                        localStorage.setItem('activeDashboardId', list[0].dashboard_id);
                    }
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Erro a carregar dashboards:', err);
                setLoading(false);
            });
    }, []);

    // Função que é chamada quando o utilizador escolhe outro dashboard no menu
    const setActiveDashboard = (dash: Dashboard) => {
        setActiveDashboardState(dash);
        localStorage.setItem('activeDashboardId', dash.dashboard_id); // Memoriza no F5
    };

    return (
        <DashboardContext.Provider value={{ dashboards, activeDashboard, setActiveDashboard, loading }}>
            {children}
        </DashboardContext.Provider>
    );
}

// Hook personalizado para usar facilmente nos outros ficheiros
export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) throw new Error("useDashboard tem de ser usado dentro de um DashboardProvider");
    return context;
}
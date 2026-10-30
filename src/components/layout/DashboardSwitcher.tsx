'use client';

import { useDashboard } from '@/contexts/DashboardContext';

export default function DashboardSwitcher() {
    const { dashboards, activeDashboard, setActiveDashboard, loading } = useDashboard();

    if (loading) {
        return (
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span>A carregar dashboards...</span>
            </div>
        );
    }

    if (dashboards.length === 0) {
        return (
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                Sem dashboards disponíveis.
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2 w-full max-w-md">
            <label
                htmlFor="dashboard-select"
                className="text-sm font-semibold text-gray-900 dark:text-gray-100"
            >
                Dashboard Ativo
            </label>

            <div className="relative">
                <select
                    id="dashboard-select"
                    value={activeDashboard?.dashboard_id || ''}
                    onChange={(e) => {
                        const selected = dashboards.find(d => d.dashboard_id === e.target.value);
                        if (selected) setActiveDashboard(selected);
                    }}
                    className="block w-full appearance-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
                >
                    <option value="" disabled>Selecione um dashboard...</option>
                    {dashboards.map((dash) => (
                        <option key={dash.dashboard_id} value={dash.dashboard_id}>
                            {dash.name}
                        </option>
                    ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
                Escolha o dashboard cujos dados pretende visualizar e gerir atualmente.
            </p>
        </div>
    );
}
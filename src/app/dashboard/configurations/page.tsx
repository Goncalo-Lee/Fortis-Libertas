'use client';

import { useState, useEffect, FormEvent } from 'react';
import DashboardSwitcher from "@/components/layout/DashboardSwitcher";
// Se tiveres um contexto de autenticação/perfil, importa-o aqui:
// import { useAuth } from '@/contexts/AuthContext';

export default function ConfigurationsPage() {
    // Estados para controlar o formulário
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    // 1. Carregar os dados do utilizador quando a página abre
    useEffect(() => {
        // Exemplo de como carregarias os dados.
        // Se usares um Contexto (ex: useAuth), podes definir diretamente: setName(user.name)
        async function fetchUserData() {
            try {
                const res = await fetch('/api/user/profile'); // A tua rota de leitura
                if (res.ok) {
                    const data = await res.json();
                    setName(data.name || '');
                    setEmail(data.email || '');
                }
            } catch (error) {
                console.error("Erro ao carregar perfil:", error);
            }
        }

        fetchUserData();
    }, []);

    // 2. Função para guardar as alterações na Base de Dados
    const handleSaveProfile = async (e: FormEvent) => {
        e.preventDefault(); // Evita que a página recarregue
        setIsSaving(true);
        setStatusMessage({ type: '', text: '' });

        try {
            // Pedido à tua API (Next.js API Route, Supabase, etc.)
            const response = await fetch('/api/user/profile', {
                method: 'PATCH', // PATCH é o padrão REST para atualizar dados
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }), // Só enviamos o que pode ser alterado
            });

            if (!response.ok) throw new Error('Falha ao atualizar');

            setStatusMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });

            // Limpar a mensagem de sucesso após 3 segundos
            setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);

        } catch (error) {
            console.error(error);
            setStatusMessage({ type: 'error', text: 'Ocorreu um erro ao guardar. Tente novamente.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 sm:p-10">
            <div className="mx-auto max-w-4xl space-y-8">

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Configurações
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Gira as preferências da sua conta e o contexto de trabalho.
                    </p>
                </div>

                {/* Dashboard Switcher */}
                <section className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
                    <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-5">
                        <h2 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                            Contexto de Trabalho
                        </h2>
                    </div>
                    <div className="px-6 py-6">
                        <DashboardSwitcher />
                    </div>
                </section>

                {/* Formulário de Perfil */}
                <section className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
                    <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-5">
                        <h2 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                            Perfil do Utilizador
                        </h2>
                    </div>

                    <form onSubmit={handleSaveProfile} className="px-6 py-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nome Completo
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="mt-2 block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
                                    placeholder="O seu nome"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    disabled
                                    value={email}
                                    className="mt-2 block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed shadow-sm"
                                />
                                <p className="mt-1.5 text-xs text-gray-500">O email não pode ser alterado.</p>
                            </div>
                        </div>

                        {/* Feedback Message */}
                        {statusMessage.text && (
                            <div className={`p-3 rounded-lg text-sm ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {statusMessage.text}
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="submit"
                                disabled={isSaving || !name}
                                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        A Guardar...
                                    </>
                                ) : 'Guardar Alterações'}
                            </button>
                        </div>
                    </form>
                </section>

            </div>
        </div>
    );
}
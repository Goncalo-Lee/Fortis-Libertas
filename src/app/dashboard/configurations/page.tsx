'use client';

import { useState, useEffect, FormEvent } from 'react';
import DashboardSwitcher from "@/components/layout/DashboardSwitcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Globe, LayoutGrid, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/contexts/ProfileContext";

export default function ConfigurationsPage() {
    const profileContext = useProfile();
    const rawResponse = profileContext?.profile;
    const loading = profileContext?.loading;
    const refreshProfile = profileContext?.refresh || profileContext?.revalidate;

    const userData = rawResponse?.data || rawResponse || {};
    const profileData = userData?.profile || {};

    // Estados controlados para Perfil
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Estados controlados para Preferências
    const [language, setLanguage] = useState('pt-PT');
    const [currency, setCurrency] = useState('EUR');
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);

    // Sincronizar com os dados do ProfileContext
    useEffect(() => {
        if (userData && Object.keys(userData).length > 0) {
            setName(userData.full_name || userData.name || '');
            setEmail(userData.email || '');
            setLanguage(profileData.language || 'pt-PT');
            setCurrency(profileData.currency || 'EUR');
        }
    }, [rawResponse]);

    // 1. Guardar Alterações de Perfil (Nome)
    const handleSaveProfile = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("O nome não pode estar vazio.");

        setIsSavingProfile(true);

        try {
            const res = await fetch('/api/v1/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: name.trim() }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Falha ao atualizar perfil.');
            }

            if (refreshProfile) await refreshProfile();
            toast.success('Perfil atualizado com sucesso!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Ocorreu um erro ao guardar o perfil.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // 2. Guardar Preferências Globais (Idioma e Moeda)
    const handleSavePreferences = async (e: FormEvent) => {
        e.preventDefault();
        setIsSavingPrefs(true);

        try {
            const res = await fetch('/api/v1/me/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language, currency }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Falha ao atualizar preferências.');
            }

            if (refreshProfile) await refreshProfile();
            toast.success('Preferências guardadas com sucesso!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao guardar preferências.');
        } finally {
            setIsSavingPrefs(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 w-full p-6 md:p-10 font-poppins flex flex-col justify-center items-center min-h-[50vh] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground text-sm animate-pulse">A carregar configurações...</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-y-auto p-4 sm:p-6 md:p-10 font-poppins flex justify-center">
            <div className="w-full max-w-4xl space-y-8 min-w-0 pb-12">

                {/* Cabeçalho */}
                <div className="flex flex-col space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Configurações
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                        Gere as preferências da sua conta e o contexto de trabalho.
                    </p>
                </div>

                <div className="space-y-6 sm:space-y-8 min-w-0">

                    {/* CARTÃO 1: Contexto de Trabalho (Dashboard Switcher) */}
                    <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
                                    <LayoutGrid className="w-4 h-4" />
                                </div>
                                Contexto de Trabalho
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Alterne entre os seus dashboards ou workspaces ativos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DashboardSwitcher />
                        </CardContent>
                    </Card>
                    

                    {/* CARTÃO 3: Preferências da Aplicação */}
                    <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md text-emerald-600 dark:text-emerald-400">
                                    <Globe className="w-4 h-4" />
                                </div>
                                Preferências da Aplicação
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Defina o idioma padrão da interface e a moeda de referência dos relatórios.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSavePreferences} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-2 min-w-0">
                                        <Label htmlFor="language" className="text-xs font-medium">Idioma</Label>
                                        <select
                                            id="language"
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="flex h-9 w-full truncate rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="pt-PT">Português (PT)</option>
                                            <option value="en-US">English (US)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 min-w-0">
                                        <Label htmlFor="currency" className="text-xs font-medium">Moeda Base</Label>
                                        <select
                                            id="currency"
                                            value={currency}
                                            onChange={(e) => setCurrency(e.target.value)}
                                            className="flex h-9 w-full truncate rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="EUR">Euro (€)</option>
                                            <option value="USD">Dólar ($)</option>
                                            <option value="GBP">Libra (£)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        disabled={isSavingPrefs}
                                        className="gap-2"
                                    >
                                        {isSavingPrefs ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>A Guardar...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>Guardar Preferências</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
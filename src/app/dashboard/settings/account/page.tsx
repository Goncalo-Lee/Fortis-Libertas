'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useProfile } from "@/contexts/ProfileContext";
import { useState } from "react";

export default function AccountSettingsPage() {
    const { profile: rawResponse, loading } = useProfile();

    // Estados para controlar os botões enquanto guardam (mostram "A guardar...")
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPrefs, setSavingPrefs] = useState(false);

    if (loading) {
        return (
            <div className="flex-1 w-full p-6 md:p-10 font-poppins flex justify-center items-center h-screen">
                <p className="text-muted-foreground animate-pulse">A carregar perfil...</p>
            </div>
        );
    }

    const userData = rawResponse?.data || rawResponse || {};
    const profileData = userData?.profile || {};

    const handleSaveIdentity = async () => {
        setSavingProfile(true);
        try {
            // 1. Vamos buscar os valores diretamente aos elementos e imprimimos na consola para confirmar
            const fullNameInput = (document.getElementById('full_name') as HTMLInputElement)?.value;
            const userNameInput = (document.getElementById('user_name') as HTMLInputElement)?.value;
            const phoneInput = (document.getElementById('phone') as HTMLInputElement)?.value;
            const birthDateInput = (document.getElementById('birth_date') as HTMLInputElement)?.value;

            console.log("A enviar para a API:", { fullNameInput, userNameInput, phoneInput, birthDateInput });

            const [userRes, profileRes] = await Promise.all([
                fetch('/api/v1/me', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        full_name: fullNameInput,
                        user_name: userNameInput || null
                    })
                }),
                fetch('/api/v1/me/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: phoneInput || null,
                        birth_date: birthDateInput || null
                    })
                })
            ]);

            if (!userRes.ok) {
                const errText = await userRes.text();
                throw new Error(`Erro no User: ${errText}`);
            }
            if (!profileRes.ok) {
                const errText = await profileRes.text();
                throw new Error(`Erro no Profile: ${errText}`);
            }

            alert("Perfil guardado com sucesso!");

            // 2. FORÇAR REFRESH DOS DADOS:
            // Se o teu ProfileContext tiver uma função para recarregar (ex: refreshProfile ou revalidate), chama-a aqui.
            // Se não tiver, forçamos o browser a atualizar a página para buscar os dados frescos da BD:
            window.location.reload();

        } catch (error: any) {
            console.error("Erro detetado:", error);
            alert(error.message);
        } finally {
            setSavingProfile(false);
        }
    };

    // --- FUNÇÃO DO 2º BOTÃO (Preferências Globais) ---
    const handleSavePreferences = async () => {
        setSavingPrefs(true);
        try {
            const language = (document.getElementById('language') as HTMLSelectElement).value;
            const currency = (document.getElementById('currency') as HTMLSelectElement).value;

            // Atualiza apenas a tabela Profile
            const res = await fetch('/api/v1/me/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: language,
                    currency: currency
                })
            });

            if (!res.ok) throw new Error("Falha ao guardar preferências");

            alert("Preferências guardadas com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao guardar as preferências.");
        } finally {
            setSavingPrefs(false);
        }
    };

    return (
        <div className="flex-1 w-full p-4 sm:p-6 md:p-10 font-poppins flex justify-center">
            <div className="w-full max-w-3xl space-y-8 min-w-0">
                {/* Cabeçalho */}
                <div className="flex flex-col space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Conta do Utilizador</h2>
                    <p className="text-muted-foreground text-sm">
                        Gere as definições globais da tua conta, identidade e segurança.
                    </p>
                </div>

                <div className="grid gap-6 sm:gap-8 min-w-0">

                    {/* CARTÃO 1 */}
                    <Card className="shadow-sm overflow-hidden">
                        <CardHeader>
                            <CardTitle>Perfil Público & Contactos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Nome completo</Label>
                                    <Input defaultValue={userData.full_name || ""} id="full_name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user_name">Nome de utilizador</Label>
                                    <Input defaultValue={userData.user_name || ""} id="user_name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input defaultValue={userData.email || ""} id="email" type="email" disabled className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input defaultValue={profileData.phone || ""} id="phone" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="birth_date">Data de nascimento</Label>
                                    <Input
                                        defaultValue={profileData.birth_date ? profileData.birth_date.split('T')[0] : ""}
                                        id="birth_date"
                                        type="date"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end border-t pt-6 mt-6">
                                {/* LIGAÇÃO DO 1º BOTÃO AQUI */}
                                <Button onClick={handleSaveIdentity} disabled={savingProfile}>
                                    {savingProfile ? "A guardar..." : "Guardar perfil"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CARTÃO 2 */}
                    <Card className="shadow-sm overflow-hidden">
                        <CardHeader>
                            <CardTitle>Preferências da Aplicação</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-2 min-w-0">
                                    <Label htmlFor="language">Idioma</Label>
                                    <select
                                        id="language"
                                        defaultValue={profileData.language || "pt-PT"}
                                        className="flex h-10 w-full truncate rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="pt-PT">Português (PT)</option>
                                        <option value="en-US">English (US)</option>
                                    </select>
                                </div>
                                <div className="space-y-2 min-w-0">
                                    <Label htmlFor="currency">Moeda Base</Label>
                                    <select
                                        id="currency"
                                        defaultValue={profileData.currency || "EUR"}
                                        className="flex h-10 w-full truncate rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="EUR">Euro (€)</option>
                                        <option value="USD">Dólar ($)</option>
                                        <option value="GBP">Libra (£)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end border-t pt-6 mt-6">
                                {/* LIGAÇÃO DO 2º BOTÃO AQUI */}
                                <Button onClick={handleSavePreferences} disabled={savingPrefs}>
                                    {savingPrefs ? "A guardar..." : "Guardar preferências"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
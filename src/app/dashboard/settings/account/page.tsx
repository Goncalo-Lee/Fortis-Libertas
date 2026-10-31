'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, KeyRound, ShieldCheck, Loader2, Save, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/contexts/ProfileContext";
import { authClient } from "@/lib/auth-client";
import Enable2FADialog from "@/components/two-factor-dialog";
import RequestResetDialog from "@/components/request-reset-dialog";

export default function AccountSettingsPage() {
    const { data: session, refetch: refetchSession } = authClient.useSession();
    const profileContext = useProfile();
    const rawResponse = profileContext?.profile;
    const loading = profileContext?.loading;
    const refreshProfile = profileContext?.refresh || profileContext?.revalidate;

    const userData = rawResponse?.data || rawResponse || {};
    const profileData = userData?.profile || {};

    const [fullName, setFullName] = useState("");
    const [userName, setUserName] = useState("");
    const [phone, setPhone] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);

    // Sincronizar dados vindos do ProfileContext
    useEffect(() => {
        if (userData && Object.keys(userData).length > 0) {
            setFullName(userData.full_name || "");
            setUserName(userData.user_name || "");
            setPhone(profileData.phone || "");
            setBirthDate(profileData.birth_date ? profileData.birth_date.split('T')[0] : "");
        }
    }, [rawResponse]);

    const handleSaveIdentity = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);

        try {
            const [userRes, profileRes] = await Promise.all([
                fetch('/api/v1/me', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        full_name: fullName.trim(),
                        user_name: userName.trim() || null
                    })
                }),
                fetch('/api/v1/me/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: phone.trim() || null,
                        birth_date: birthDate || null
                    })
                })
            ]);

            if (!userRes.ok) {
                const err = await userRes.json().catch(() => ({}));
                throw new Error(err.message || "Erro ao atualizar dados de utilizador.");
            }
            if (!profileRes.ok) {
                const err = await profileRes.json().catch(() => ({}));
                throw new Error(err.message || "Erro ao atualizar perfil.");
            }

            if (refreshProfile) await refreshProfile();
            toast.success("Perfil atualizado com sucesso!");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Falha ao gravar perfil.");
        } finally {
            setSavingProfile(false);
        }
    };

    const is2FAEnabled = Boolean(session?.user?.twoFactorEnabled || userData.two_factor_enabled);

    if (loading) {
        return (
            <div className="flex-1 w-full p-6 md:p-10 font-poppins flex flex-col justify-center items-center min-h-[50vh] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground text-sm animate-pulse">A carregar definições da conta...</p>
            </div>
        );
    }

    return (
        // h-full overflow-y-auto garante que a página rola para baixo independentemente do tamanho do ecrã
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 lg:p-8 font-poppins">
            <div className="mx-auto w-full max-w-6xl space-y-6 pb-20">

                {/* CABEÇALHO */}
                <div className="flex flex-col space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Conta do Utilizador
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                        Gere a identidade da tua conta, credenciais e segurança de acesso.
                    </p>
                </div>

                {/* GRID RESPONSIVO:
                    items-start: Impede os cartões de esticarem para baixo criando espaços em branco feios
                    lg:grid-cols-12: Separa em duas colunas em portáteis (1024px+)
                */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* COLUNA ESQUERDA (7 colunas em portáteis): Perfil Público */}
                    <div className="lg:col-span-7">
                        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300">
                                        <User className="w-4 h-4" />
                                    </div>
                                    Perfil Público & Contactos
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Os dados de identificação visíveis na plataforma e relatórios.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveIdentity} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name" className="text-xs font-medium">Nome completo</Label>
                                            <Input
                                                id="full_name"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                required
                                                placeholder="Ex: João Silva"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="user_name" className="text-xs font-medium">Nome de utilizador</Label>
                                            <Input
                                                id="user_name"
                                                value={userName}
                                                onChange={(e) => setUserName(e.target.value)}
                                                placeholder="Ex: joaosilva"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="email" className="text-xs font-medium">Email da Conta</Label>
                                            <Input
                                                id="email"
                                                value={userData.email || ""}
                                                disabled
                                                className="bg-muted cursor-not-allowed opacity-80"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-xs font-medium">Telefone</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="+351 912 345 678"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="birth_date" className="text-xs font-medium">Data de nascimento</Label>
                                            <Input
                                                id="birth_date"
                                                type="date"
                                                value={birthDate}
                                                onChange={(e) => setBirthDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-5 mt-6">
                                        <Button type="submit" disabled={savingProfile} className="gap-2 w-full sm:w-auto">
                                            {savingProfile ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>A guardar...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    <span>Guardar perfil</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* COLUNA DIREITA (5 colunas em portáteis): Segurança e Acesso */}
                    <div className="lg:col-span-5 flex flex-col gap-6">

                        {/* CARTÃO: Repor Password */}
                        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
                                        <KeyRound className="w-4 h-4" />
                                    </div>
                                    Palavra-passe e Acesso
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Altera a tua palavra-passe ou recupera o acesso.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-4 p-5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            Repor Palavra-passe
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Inicia o fluxo seguro para redefinir as credenciais associadas a <strong>{userData.email}</strong>.
                                        </p>
                                    </div>

                                    {/* AQUI ESTÁ O NOVO COMPONENTE DIALOG */}
                                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800 flex justify-end">
                                        <RequestResetDialog email={userData.email} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CARTÃO: Autenticação 2FA */}
                        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md text-emerald-600 dark:text-emerald-400">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    Autenticação (2FA)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Adiciona uma camada extra de segurança através de uma app autenticadora.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-4 p-5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                Estado do 2FA
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    is2FAEnabled
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                                }`}
                                            >
                                                {is2FAEnabled ? "Ativado" : "Desativado"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {is2FAEnabled
                                                ? "A tua conta está protegida. É solicitado um código de segurança temporário a cada início de sessão."
                                                : "A tua conta está protegida apenas por palavra-passe. Recomendamos ativar o 2FA."}
                                        </p>
                                    </div>

                                    {/* DIALOG DO 2FA */}
                                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800 flex justify-end">
                                        <Enable2FADialog
                                            session={session}
                                            onStatusChange={() => {
                                                refetchSession();
                                                if (refreshProfile) refreshProfile();
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}
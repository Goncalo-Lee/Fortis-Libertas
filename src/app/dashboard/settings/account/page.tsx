'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, KeyRound, ShieldCheck, Loader2, Save, Mail, Landmark, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/contexts/ProfileContext";
import { authClient } from "@/lib/auth-client";
import Enable2FADialog from "@/components/two-factor-dialog";
import RequestResetDialog from "@/components/request-reset-dialog";
import MailChangeDialog from "@/components/mail-change-dialog";
import { OpenBankingModal } from "@/components/OpenBankingModal";
import { updateUserIdentity, updateUserProfile } from "@/lib/api-client";

export default function AccountSettingsPage() {
    const { data: session, refetch: refetchSession } = authClient.useSession();
    const profileContext = useProfile();
    const rawResponse = profileContext?.profile;
    const loading = profileContext?.loading;

    const userData = rawResponse?.data || rawResponse || {};
    const profileData = userData?.profile || {};

    // Form states
    const [fullName, setFullName] = useState("");
    const [userName, setUserName] = useState("");
    const [phone, setPhone] = useState("");
    const [birthDate, setBirthDate] = useState("");

    // Independent loading states per action
    const [savingIdentity, setSavingIdentity] = useState(false);
    const [savingPhone, setSavingPhone] = useState(false);
    const [savingBirthDate, setSavingBirthDate] = useState(false);

    // Open Banking Modal states
    const [isOpenBankingModalOpen, setIsOpenBankingModalOpen] = useState(false);
    const [connectedBankInfo, setConnectedBankInfo] = useState<any>(null);

    // Fetch initial profile data directly to prevent stale context issues
    const fetchDirectProfileData = async () => {
        try {
            const res = await fetch('/api/v1/me/profile', { credentials: 'include' });
            if (res.ok) {
                const json = await res.json();
                const pData = json.data || json;
                setPhone(pData.phone || "");
                setBirthDate(pData.birth_date ? pData.birth_date.split('T')[0] : "");
            }
        } catch (err) {
            console.error("Failed to load profile details:", err);
        }
    };

    // Synchronize states when context or page loads
    useEffect(() => {
        if (userData && Object.keys(userData).length > 0) {
            setFullName(userData.full_name || "");
            setUserName(userData.user_name || "");
        }
        fetchDirectProfileData();
    }, [rawResponse]);

    // --- 1. SAVE USER IDENTITY (FULL NAME & USERNAME) ---
    const handleSaveIdentity = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingIdentity(true);

        try {
            await updateUserIdentity({
                full_name: fullName.trim(),
                user_name: userName.trim() || null
            });

            toast.success("Identidade atualizada com sucesso!");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Falha ao gravar identidade.");
        } finally {
            setSavingIdentity(false);
        }
    };

    // --- 2. SAVE PHONE NUMBER ONLY ---
    const handleSavePhone = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple frontend validation for phone length
        const cleanPhone = phone.trim();
        if (cleanPhone && cleanPhone.length > 15) {
            toast.error("O número de telefone é demasiado longo (máximo 15 caracteres).");
            return;
        }

        setSavingPhone(true);
        try {
            await updateUserProfile({
                phone: cleanPhone || null
            });

            toast.success("Telefone atualizado com sucesso!");
            await fetchDirectProfileData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Falha ao gravar telefone.");
        } finally {
            setSavingPhone(false);
        }
    };

    // --- 3. SAVE BIRTH DATE ONLY ---
    const handleSaveBirthDate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple frontend validation for future dates
        if (birthDate) {
            const selectedDate = new Date(birthDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate > today) {
                toast.error("A data de nascimento não pode ser no futuro!");
                return;
            }
        }

        setSavingBirthDate(true);
        try {
            await updateUserProfile({
                birth_date: birthDate || null
            });

            toast.success("Data de nascimento atualizada com sucesso!");
            await fetchDirectProfileData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Falha ao gravar data de nascimento.");
        } finally {
            setSavingBirthDate(false);
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
        <div className="h-full w-full overflow-y-auto p-3 md:p-5 lg:p-6 font-poppins">
            <div className="mx-auto w-full max-w-6xl space-y-4 pb-16">

                {/* HEADER */}
                <div className="flex flex-col space-y-0.5">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Conta do Utilizador
                    </h2>
                    <p className="text-muted-foreground text-xs">
                        Gere a tua identidade, credenciais, integrações e segurança de acesso.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

                    {/* LEFT COLUMN: Profile, Email & Integrations */}
                    <div className="lg:col-span-7 flex flex-col gap-4">

                        {/* CARD: User Email */}
                        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                            <CardHeader className="p-4 pb-3">
                                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md text-indigo-600 dark:text-indigo-400">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    Mail do utilizador
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    O endereço de email associado ao login da tua conta.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs font-medium">Email da Conta</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="email"
                                            value={userData.email || ""}
                                            disabled
                                            className="bg-muted cursor-not-allowed opacity-80 flex-1 h-8 text-xs"
                                        />
                                        <MailChangeDialog currentEmail={userData.email || ""} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CARD: Public Profile & Identity (Original structure restored & compacted) */}
                        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                            <CardHeader className="p-4 pb-3">
                                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300">
                                        <User className="w-4 h-4" />
                                    </div>
                                    Perfil e Identificação
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Os dados de identificação visíveis na plataforma e relatórios.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-4">

                                {/* FORM 1: Identity (Full Name & Username) */}
                                <form onSubmit={handleSaveIdentity} className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="full_name" className="text-xs font-medium">Nome completo</Label>
                                            <Input
                                                id="full_name"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                required
                                                placeholder="Ex: João Silva"
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="user_name" className="text-xs font-medium">Nome de utilizador</Label>
                                            <Input
                                                id="user_name"
                                                value={userName}
                                                onChange={(e) => setUserName(e.target.value)}
                                                placeholder="Ex: joaosilva"
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={savingIdentity} size="sm" className="gap-1.5 h-7 text-xs">
                                            {savingIdentity ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                            <span>Guardar Identidade</span>
                                        </Button>
                                    </div>
                                </form>

                                <div className="border-t border-slate-100 dark:border-slate-800" />

                                {/* FORM 2: Phone Number */}
                                <form onSubmit={handleSavePhone} className="flex flex-col sm:flex-row gap-2.5 items-end">
                                    <div className="space-y-1 flex-1 w-full">
                                        <Label htmlFor="phone" className="text-xs font-medium flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Telefone</span>
                                        </Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+351 912 345 678"
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <Button type="submit" disabled={savingPhone} size="sm" variant="outline" className="gap-1.5 h-8 text-xs w-full sm:w-auto">
                                        {savingPhone ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        <span>Guardar Telefone</span>
                                    </Button>
                                </form>

                                <div className="border-t border-slate-100 dark:border-slate-800" />

                                {/* FORM 3: Birth Date */}
                                <form onSubmit={handleSaveBirthDate} className="flex flex-col sm:flex-row gap-2.5 items-end">
                                    <div className="space-y-1 flex-1 w-full">
                                        <Label htmlFor="birth_date" className="text-xs font-medium flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Data de nascimento</span>
                                        </Label>
                                        <Input
                                            id="birth_date"
                                            type="date"
                                            value={birthDate}
                                            onChange={(e) => setBirthDate(e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <Button type="submit" disabled={savingBirthDate} size="sm" variant="outline" className="gap-1.5 h-8 text-xs w-full sm:w-auto">
                                        {savingBirthDate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        <span>Guardar Data</span>
                                    </Button>
                                </form>

                            </CardContent>
                        </Card>

                        {/* OPEN BANKING CARD */}
                        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md text-purple-600 dark:text-purple-400">
                                            <Landmark className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            Integração Open Banking
                                        </h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                                        Associa a tua conta através da API gratuita da Nordigen (GoCardless) para simular o consentimento PSD2 e sincronizar dados.
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                            Estado:
                                        </span>
                                        <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                connectedBankInfo
                                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                                    : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                            }`}
                                        >
                                            {connectedBankInfo ? `Ligado (${connectedBankInfo.name})` : "Não Configurado"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 self-start sm:self-center">
                                    <Button
                                        variant={connectedBankInfo ? "outline" : "default"}
                                        onClick={() => setIsOpenBankingModalOpen(true)}
                                        className="gap-2 text-xs h-8 w-full sm:w-auto"
                                    >
                                        <Landmark className="w-3.5 h-3.5" />
                                        <span>{connectedBankInfo ? "Gerir Banco" : "Ligar Banco"}</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* RIGHT COLUMN: Security & Access */}
                    <div className="lg:col-span-5 flex flex-col gap-4">

                        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                            <CardHeader className="p-4 pb-3">
                                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
                                        <KeyRound className="w-4 h-4" />
                                    </div>
                                    Palavra-passe e Acesso
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Altera a tua palavra-passe ou recupera o acesso.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                            Repor Palavra-passe
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Inicia o fluxo seguro para redefinir as credenciais associadas a <strong>{userData.email}</strong>.
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800 flex justify-end">
                                        <RequestResetDialog email={userData.email} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                            <CardHeader className="p-4 pb-3">
                                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md text-emerald-600 dark:text-emerald-400">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    Autenticação (2FA)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Adiciona uma camada extra de segurança através de uma app autenticadora.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
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

                                    <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800 flex justify-end">
                                        <Enable2FADialog
                                            session={session}
                                            onStatusChange={() => {
                                                refetchSession();
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <OpenBankingModal
                isOpen={isOpenBankingModalOpen}
                onClose={() => setIsOpenBankingModalOpen(false)}
                onSuccess={(bankData) => {
                    setConnectedBankInfo(bankData);
                }}
            />
        </div>
    );
}
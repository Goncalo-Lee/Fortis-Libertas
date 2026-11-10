"use client"

import { useState } from "react"
import { ShieldCheck, Building2, CheckCircle2, Lock, ArrowRight, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface OpenBankingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (connectedBank: { name: string; balance: number; iban: string }) => void;
}

const MOCK_BANKS = [
    { id: "revolut", name: "Revolut", country: "🇵🇹 PT", logo: "💳", color: "#000000" },
    { id: "cgd", name: "Caixa Geral de Depósitos", country: "🇵🇹 PT", logo: "🔵", color: "#002D62" },
    { id: "bcp", name: "Millennium BCP", country: "🇵🇹 PT", logo: "🔴", color: "#E31B23" },
    { id: "santander", name: "Santander Totta", country: "🇵🇹 PT", logo: "🟥", color: "#EC0000" },
    { id: "novobanco", name: "Novo Banco", country: "🇵🇹 PT", logo: "🟢", color: "#006A4E" },
    { id: "activobank", name: "ActivoBank", country: "🇵🇹 PT", logo: "🔷", color: "#0055A5" },
];

export function OpenBankingModal({ isOpen, onClose, onSuccess }: OpenBankingModalProps) {
    const [step, setStep] = useState<"select_bank" | "consent" | "syncing" | "success">("select_bank");
    const [selectedBank, setSelectedBank] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    if (!isOpen) return null;

    const filteredBanks = MOCK_BANKS.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleSelectBank = (bank: any) => {
        setSelectedBank(bank);
        setStep("consent");
    };

    const handleConfirmConsent = () => {
        setStep("syncing");

        // Simula o tempo de resposta da API da GoCardless/Nordigen a puxar os saldos e transações
        setTimeout(() => {
            setStep("success");
            toast.success(`Conta do ${selectedBank.name} ligada com sucesso!`);

            setTimeout(() => {
                onSuccess({
                    name: `${selectedBank.name} (Open Banking)`,
                    balance: 1450.80, // Simulação de saldo obtido via API
                    iban: `PT50${Math.floor(1000 + Math.random() * 9000)}...`
                });
                onClose();
                setStep("select_bank");
            }, 1200);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-poppins animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Open Banking (PSD2)</h2>
                            <p className="text-[11px] text-muted-foreground">Ligação segura via GoCardless / Nordigen</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer">
                        ✕
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6">
                    {step === "select_bank" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Escolhe a tua instituição bancária:</label>
                                <input
                                    type="text"
                                    placeholder="Pesquisar banco..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full mt-1.5 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                {filteredBanks.map((bank) => (
                                    <button
                                        key={bank.id}
                                        onClick={() => handleSelectBank(bank)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{bank.logo}</span>
                                            <div className="text-left">
                                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600">{bank.name}</p>
                                                <span className="text-[10px] text-muted-foreground">{bank.country} • PSD2 Ready</span>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === "consent" && selectedBank && (
                        <div className="space-y-5 text-center py-2">
                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner">
                                {selectedBank.logo}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Autorizar acesso ao {selectedBank.name}</h3>
                                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                    Serás redirecionado para o ambiente seguro do teu banco para consentir a leitura de saldos e transações.
                                </p>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 rounded-xl p-3 text-left space-y-2 text-[11px] text-amber-800 dark:text-amber-300">
                                <div className="flex items-center gap-1.5 font-semibold">
                                    <Lock className="w-3.5 h-3.5 shrink-0" />
                                    <span>Garantia de Segurança PSD2</span>
                                </div>
                                <p className="opacity-90">A aplicação tem apenas acesso de **leitura**. As tuas credenciais de homebanking nunca são guardadas.</p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setStep("select_bank")} className="flex-1 h-9 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg font-medium cursor-pointer">Voltar</button>
                                <button onClick={handleConfirmConsent} className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-medium cursor-pointer shadow-xs">Prosseguir para o Banco</button>
                            </div>
                        </div>
                    )}

                    {step === "syncing" && (
                        <div className="space-y-4 text-center py-8">
                            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">A estabelecer ligação encriptada...</h3>
                                <p className="text-xs text-muted-foreground">A sincronizar contas e a importar o histórico inicial via API...</p>
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="space-y-4 text-center py-6">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Banco ligado com sucesso!</h3>
                                <p className="text-xs text-muted-foreground">As tuas contas estão agora sincronizadas em tempo real.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer info */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> Criptografia bancária de ponta a ponta (AES-256)
                    </span>
                </div>

            </div>
        </div>
    );
}
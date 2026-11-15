"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useFinancial } from "@/contexts/FinancialContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { DynamicIcon } from "./DynamicIcon";
import { toast } from "sonner";
import { Check } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    // AGORA EXIGE TAMBÉM O NOME PARA ATUALIZAR O FRONTEND INSTANTANEAMENTE
    onSuccess: (categoryId: string, categoryName: string, kind?: string) => void;
    recordTypeId?: string;
    typeLabel?: "Receita" | "Despesa" | "Neutro";
}

export function CreateCategoryModal({ isOpen, onClose, onSuccess, recordTypeId, typeLabel = "Despesa" }: Props) {
    const { activeDashboard } = useDashboard();
    const { globalColors, globalIcons, categories, refresh } = useFinancial();

    const [name, setName] = useState("");
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [selectedIcon, setSelectedIcon] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const usedColorIds = (categories || []).map((cat: any) =>
        cat.color_id || cat.color?.id || cat.color?.color_id
    ).filter(Boolean);

    const availableColors = globalColors?.filter((color: any) => {
        const isReserved = color.isReserved || color.is_reserved;
        const colorId = color.id || color.color_id;
        const isUsed = usedColorIds.includes(colorId);
        return !isReserved && !isUsed;
    }) || [];

    if (isOpen && !selectedColor && availableColors.length > 0) {
        setSelectedColor(availableColors[0].id || availableColors[0].color_id);
    }
    if (isOpen && !selectedIcon && globalIcons?.length > 0) {
        setSelectedIcon(globalIcons[0].id || globalIcons[0].icon_id);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name.trim() || !selectedColor || !selectedIcon) {
            return toast.error("Preenche o nome, seleciona uma cor e um ícone.");
        }

        const nameAlreadyExists = (categories || []).some((c: any) =>
            c.name.toLowerCase() === name.trim().toLowerCase()
        );

        if (nameAlreadyExists) {
            return toast.error(`Já tens uma categoria chamada "${name.trim()}". Escolhe um nome diferente.`);
        }

        setIsLoading(true);
        try {
            const payload: Record<string, any> = {
                name: name.trim(),
                description: `Categoria gerada pelo utilizador`,
                color_id: selectedColor,
                icon_id: selectedIcon
            };

            if (recordTypeId) {
                payload.record_type_ids = [recordTypeId];
            }

            const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/categories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || errData.message || "Erro da API ao criar categoria.");
            }

            const data = await res.json();
            const newId = data.data?.category_id || data.data?.id || data.category_id || data.id;

            toast.success(`Categoria "${name}" criada!`);
            refresh(); // A API vai atualizar em background

            const mapping = {
                Receita: "income",
                Despesa: "expense",
                Neutro: "neutral"
            };
            const kind = mapping[typeLabel];

            // MAGIA: ENVIAMOS O ID E O NOME DIRETAMENTE PARA A PÁGINA
            onSuccess(newId, name.trim(), kind);

            setName("");
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    const typeStyles = {
        Receita: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50",
        Despesa: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50",
        Neutro: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-950 font-poppins">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Nova Categoria
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${typeStyles[typeLabel]}`}>
                            {typeLabel}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Personaliza a cor e o ícone. Cores já em uso foram ocultadas.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome da Categoria</label>
                        <input type="text" placeholder="Ex: Vendas OLX, Rendas..." value={name} onChange={e => setName(e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required autoFocus />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Escolhe uma Cor ({availableColors.length} disponíveis)
                        </label>
                        {availableColors.length === 0 ? (
                            <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-md border border-rose-200 dark:border-rose-900/50">
                                Esgotaste todas as cores do sistema!
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-1">
                                {availableColors.map((color: any) => {
                                    const cId = color.id || color.color_id;
                                    const hex = color.codeColor || color.code_color || color.hex_code;
                                    const isSelected = selectedColor === cId;
                                    return (
                                        <button key={cId} type="button" onClick={() => setSelectedColor(cId)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110 shadow-sm'}`} style={{ backgroundColor: hex }} title={color.name}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Escolhe um Ícone</label>
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-[160px] overflow-y-auto p-1">
                            {globalIcons?.map((icon: any) => {
                                const iId = icon.id || icon.icon_id;
                                const code = icon.codeIcon || icon.code_icon || icon.name;
                                const isSelected = selectedIcon === iId;
                                return (
                                    <button key={iId} type="button" onClick={() => setSelectedIcon(iId)} className={`p-2 rounded-lg flex items-center justify-center transition-colors border ${isSelected ? 'bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm'}`} title={icon.name}>
                                        <DynamicIcon name={code} className="w-5 h-5" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-xs rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium cursor-pointer">Cancelar</button>
                        <button type="submit" disabled={isLoading || availableColors.length === 0} className="px-5 py-2 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 font-medium disabled:opacity-50 cursor-pointer">
                            {isLoading ? "A guardar..." : "Criar Categoria"}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
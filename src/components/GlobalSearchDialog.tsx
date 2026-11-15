"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Calculator,
    CreditCard,
    FileText,
    LayoutDashboard,
    PiggyBank,
    Receipt
} from "lucide-react";

interface GlobalSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open, onOpenChange]);

    const handleSelect = (path: string) => {
        onOpenChange(false);
        router.push(path);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden p-0 shadow-2xl border-slate-700 bg-slate-900 text-slate-100 max-w-lg">
                {/* Acessibilidade: DialogTitle escondido visualmente */}
                <DialogTitle className="sr-only">Pesquisa Global</DialogTitle>

                {/* O <Command> aqui fornece o contexto do cmdk que estava em falta */}
                <Command className="bg-transparent text-slate-100 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                    <CommandInput placeholder="Procurar transações, páginas, categorias..." />
                    <CommandList>
                        <CommandEmpty className="py-6 text-center text-sm text-slate-400">
                            Nenhum resultado encontrado.
                        </CommandEmpty>

                        <CommandGroup heading="Navegação Rápida">
                            <CommandItem
                                onSelect={() => handleSelect("/dashboard")}
                                className="cursor-pointer hover:bg-slate-800 rounded-md"
                            >
                                <LayoutDashboard className="mr-2 h-4 w-4 text-blue-500" />
                                <span>Dashboard Principal</span>
                            </CommandItem>
                            <CommandItem
                                onSelect={() => handleSelect("/dashboard/documents/transactions-log")}
                                className="cursor-pointer hover:bg-slate-800 rounded-md"
                            >
                                <Receipt className="mr-2 h-4 w-4 text-emerald-500" />
                                <span>Histórico de Transações</span>
                            </CommandItem>
                            <CommandItem
                                onSelect={() => handleSelect("/dashboard/financial-goals")}
                                className="cursor-pointer hover:bg-slate-800 rounded-md"
                            >
                                <PiggyBank className="mr-2 h-4 w-4 text-amber-500" />
                                <span>Metas Financeiras</span>
                            </CommandItem>
                            <CommandItem
                                onSelect={() => handleSelect("/dashboard/financial-debts")}
                                className="cursor-pointer hover:bg-slate-800 rounded-md"
                            >
                                <CreditCard className="mr-2 h-4 w-4 text-rose-500" />
                                <span>Gestão de Dívidas</span>
                            </CommandItem>
                            <CommandItem
                                onSelect={() => handleSelect("/dashboard/documents/exportations")}
                                className="cursor-pointer hover:bg-slate-800 rounded-md"
                            >
                                <FileText className="mr-2 h-4 w-4 text-indigo-500" />
                                <span>Documentos e Exportações</span>
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator className="bg-slate-800" />

                        <CommandGroup heading="Ações Rápidas">
                            <CommandItem
                                onSelect={() => handleSelect("/transactions?action=new")}
                                className="cursor-pointer hover:bg-slate-800 rounded-md"
                            >
                                <Calculator className="mr-2 h-4 w-4 text-sky-400" />
                                <span>Registar Nova Transação</span>
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";

export function SidebarSearchTrigger() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="group flex w-full items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-sm text-slate-400 transition-all hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-200"
            >
                <div className="flex items-center gap-2.5">
                    <Search className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="font-medium text-xs">Pesquisar...</span>
                </div>
                <kbd className="pointer-events-none flex select-none items-center gap-0.5 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                    <span className="text-[9px]">⌘</span>K
                </kbd>
            </button>

            {/* Abre o modal central do command menu */}
            <GlobalSearchDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
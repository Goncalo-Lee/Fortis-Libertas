"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner"; // or "react-hot-toast"

export function Logout() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    toast.success("Até a próxima!");
                    router.push("/");
                    router.refresh(); // Clears cached server components/session state
                },
                onError: (ctx) => {
                    toast.error(ctx.error.message || "Failed to sign out");
                    setIsLoading(false);
                },
            },
        });
    };

    return (
        <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-2"
        >
            {isLoading ? (
                <>
                    Signing out...
                    <Loader2 className="size-4 animate-spin" />
                </>
            ) : (
                <>
                    Logout
                    <LogOut className="size-4" />
                </>
            )}
        </Button>
    );
}
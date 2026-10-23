// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import {twoFactorClient} from "better-auth/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL, // "http://localhost:3000" OU CRIAR UMA VARIAVEL DE AMBIENTE

    plugins: [

        twoFactorClient({
            onTwoFactorRedirect: () => {
                window.location.href = "/two-factor";
            }
        })
    ]
});
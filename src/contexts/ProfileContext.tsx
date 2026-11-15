'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Mantemos a tua interface plana para não teres de alterar o resto do frontend
interface UserProfile {
    user_id: string;
    full_name: string;
    user_name: string | null;
    email: string;
    phone: string | null;
    birth_date: string | null;
    currency: string;
    language: string;
    image?: string | null;
}

const ProfileContext = createContext<{ profile: UserProfile | null; loading: boolean } | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/v1/me', {
            method: 'GET',
            credentials: 'include'
        })
            .then(async res => {
                if (!res.ok) {
                    // Assim consegues ver exatamente o status code (ex: 404, 500) e a mensagem de erro do backend
                    const errorText = await res.text();
                    throw new Error(`Erro da API (${res.status}): ${errorText}`);
                }
                return res.json();
            })
            .then(resData => {
                const user = resData.data;
                const userProfile = user?.profile || {};

                // Mapeamos os dados aninhados para a tua estrutura plana
                setProfile({
                    user_id: user.user_id,
                    full_name: user.full_name,
                    user_name: user.user_name,
                    email: user.email,
                    image: user.image,
                    phone: userProfile.phone || null,
                    birth_date: userProfile.birth_date || null,
                    currency: userProfile.currency || "EUR",
                    language: userProfile.language || "pt-PT",
                });

                setLoading(false);
            })
            .catch(err => {
                console.error("Falha ao carregar perfil:", err);
                setLoading(false);
            });
    }, []);

    return (
        <ProfileContext.Provider value={{ profile, loading }}>
            {children}
        </ProfileContext.Provider>
    );
}

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) throw new Error("useProfile deve ser usado dentro de um ProfileProvider");
    return context;
};
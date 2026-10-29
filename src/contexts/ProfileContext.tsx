'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Ajustar consoante a base de dados
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
        // Vai buscar a informação de quem fez login através do cookie do Better Auth
        fetch('/api/v1/me') // endpoint
            .then(res => {
                if (!res.ok) throw new Error("Não autorizado");
                return res.json();
            })
            .then(data => {
                // Junta os dados do User e do Profile
                setProfile(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erro ao carregar perfil:", err);
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
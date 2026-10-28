'use client';

import { useState, useEffect } from 'react';

export default function UserProfile() {
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchUserData() {
            try {
                const response = await fetch('/api/v1/me');

                if (!response.ok) {
                    throw new Error('Não foi possível obter os dados do utilizador.');
                }

                const data = await response.json();

                // Ajusta 'data.name' caso a propriedade na vossa API tenha outro nome
                // (por exemplo: data.nome, data.user.name, etc.)
                setUserName(data.data.full_name || data.data.user_name || 'Utilizador');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchUserData();
    }, []);

    if (loading) return <p>A carregar o perfil...</p>;
    if (error) return <p>Erro: {error}</p>;

    return (
        <div className="p-4">
            <h2>Olá, {userName || 'Utilizador'}!</h2>
            <h3>dasdasd</h3>
        </div>
    );
}
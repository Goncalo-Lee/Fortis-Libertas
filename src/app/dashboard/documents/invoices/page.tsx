'use client';

import { useState, useEffect } from 'react';

export default function MeuComponente() {
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Como a API está no mesmo projeto, basta usares o caminho relativo '/api/user'
        fetch('/api/v1/user/route')
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Erro ao carregar os dados');
                }
                return res.json();
            })
            .then((data) => {
                // Assume que a resposta tem a propriedade 'name'
                setUserName(data.name);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Erro:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <p>A carregar...</p>;

    return (
        <div>
            <h2>Bem-vinda de volta, {userName || 'Convidado'}!</h2>
        </div>
    );
}
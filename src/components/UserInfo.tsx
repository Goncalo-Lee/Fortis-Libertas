"use client"
import React, { useState, useEffect } from 'react';

export default function UserInfo() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchUser() {
            const token = localStorage.getItem('token') || localStorage.getItem('bearer_token');

            if (!token) {
                setError('Token em falta. Faz login primeiro.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/v1/me', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || data.message || 'Erro ao carregar dados');
                }

                setUser(data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    if (loading) return <p>A carregar...</p>;
    if (error) return <p style={{ color: 'red' }}>Erro: {error}</p>;

    return (
        <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>Dados do Utilizador</h3>
            {/* Em vez de mostrar o ID, mostramos diretamente o Nome Completo ou o Username */}
            <p><strong>Nome:</strong> {user?.full_name || user?.user_name || 'Utilizador'}</p>
            <p><strong>Email:</strong> {user?.email}</p>
        </div>
    );
}
export async function updateUserIdentity(data: { full_name: string; user_name: string | null }) {
    const res = await fetch('/api/v1/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao atualizar dados de utilizador.");
    }
    return res.json();
}

export async function updateUserProfile(data: { phone?: string | null; birth_date?: string | null }) {
    const res = await fetch('/api/v1/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Falha ao atualizar perfil.");
    }

    return res.json();
}
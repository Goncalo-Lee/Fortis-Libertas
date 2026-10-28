import React from 'react';
import UserInfo from '@/components/UserInfo'; // Ajusta o caminho conforme onde guardaste o componente

export default function Page() {
  return (
      <main style={{ padding: '40px', fontFamily: 'sans-serif' }}>
        <h1>Página Inicial</h1>
        <p>Aqui está a informação do utilizador autenticado:</p>

        {/* Aqui chamas o componente */}
        <UserInfo />
      </main>
  );
}
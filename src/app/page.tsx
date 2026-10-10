import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
      // O fundo usa um gradiente inspirado no céu e na transição de cores da sua imagem
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#bce0f4] to-[#3a7ba8] font-sans p-4">

        {/* Cartão principal: Minimalista, branco com um leve desfoque para destacar o conteúdo */}
        <div className="bg-white p-10 md:p-14 rounded-3xl shadow-2xl text-center max-w-md w-full border border-white/40">

          {/* Título - Usando a cor azul escura do arco da imagem */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#194b7c] mb-3 tracking-wide">
            FORTIS LIBERTAS
          </h1>

          {/* Slogan */}
          <p className="text-lg md:text-xl text-[#4a6b8c] mb-10 font-medium">
            Descomplicando o dinheiro!
          </p>

          {/* Botões de Ação */}
          <div className="flex flex-col space-y-4">
            {/* Botão Entrar - Destacado com a cor laranja/amarela dos degraus */}
            <Link
                href="/sign-in"
                className="w-full py-3.5 rounded-full bg-[#f29f33] hover:bg-[#e08e22] text-white font-bold text-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Entrar
            </Link>

            {/* Botão Registar - Secundário, simples e limpo */}
            <Link
                href="/sign-up"
                className="w-full py-3.5 rounded-full bg-transparent border-2 border-[#194b7c] text-[#194b7c] hover:bg-[#194b7c] hover:text-white font-bold text-lg transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              Registar
            </Link>
          </div>

        </div>

      </div>
  );
}
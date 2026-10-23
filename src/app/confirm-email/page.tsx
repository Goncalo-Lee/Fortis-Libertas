import React from 'react';
import Link from 'next/link';

export default function EmailConfirmed() {
    return (
        <div
            className={`min-h-screen relative flex flex-col items-center justify-center p-4 bg-cover bg-center bg-no-repeat overflow-hidden font-poppins`}
            style={{ backgroundImage: "url('/background3.jpeg')" }}
        >
            <h1 className="absolute top-4 left-4 md:top-6 md:left-6 text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold text-[#194b7c] tracking-wide z-50">
                FORTIS LIBERTAS
            </h1>

            <div className="text-center text-white max-w-2xl px-4 mb-24 md:mb-32 z-10 flex flex-col items-center">

                <div className="mb-6 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] text-[#4ade80]">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-20 w-20 md:h-24 md:w-24"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                {/* Título do Aviso */}
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-wide drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">
                    Email Confirmado!
                </h2>

                {/* Texto de Confirmação */}
                <p className="text-base sm:text-lg md:text-xl font-normal leading-relaxed text-white/95 mb-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    A sua conta foi ativada com sucesso. Já pode aceder à plataforma e começar a descomplicar a sua vida financeira.
                </p>

                {/* Botão de Ação Direta para Login */}
                <Link href="/sign-in">
                    <button className="bg-[#194b7c] text-white font-bold text-sm md:text-base uppercase px-8 py-3 md:px-10 md:py-4 rounded-full shadow-lg hover:bg-[#194b7c]/90 transition-all transform hover:scale-105">
                        Iniciar Sessão
                    </button>
                </Link>
            </div>
        </div>
    );
}
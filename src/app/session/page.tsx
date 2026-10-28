import React from 'react';
import Link from 'next/link';

export default function UnauthorizedPage() {
    return (
        <div
            className={`min-h-screen relative flex flex-col items-center justify-center p-4 bg-cover bg-center bg-no-repeat overflow-hidden font-poppins`}
            style={{ backgroundImage: "url('/background3.jpeg')" }}
        >
            {/* Título - Responsivo nos tamanhos e posicionamento */}
            <h1 className="absolute top-4 left-4 md:top-6 md:left-6 text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold text-[#194b7c] tracking-wide z-50">
                FORTIS LIBERTAS
            </h1>

            {/* Links Entrar/Registar no topo */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center space-x-1 md:space-x-2 z-50">
                <Link
                    href="/sign-in"
                    className="text-sm sm:text-base md:text-xl lg:text-2xl tracking-wide text-[#194b7c]/90 hover:text-white hover:bg-[#194b7c]/5 px-3 py-1.5 md:px-5 md:py-2.5 rounded-full transition-all duration-300 font-semibold"
                >
                    Entrar
                </Link>
                <Link
                    href="/sign-up"
                    className="text-sm sm:text-base md:text-xl lg:text-2xl tracking-wide text-[#194b7c]/90 hover:text-white hover:bg-[#194b7c]/5 px-3 py-1.5 md:px-5 md:py-2.5 rounded-full transition-all duration-300 font-semibold"
                >
                    Registar
                </Link>
            </div>

            {/* Bloco Central */}
            <div className="text-center text-white max-w-2xl px-4 mt-16 md:mt-0 z-10">

                {/* Título de Erro */}
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-wide drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">
                    ACESSO NEGADO
                </h2>

                {/* Mensagem Explicativa */}
                <p className="text-base sm:text-lg md:text-xl font-normal leading-relaxed text-white/95 mb-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    Ups! Parece que não tem sessão iniciada ou a sua sessão expirou.
                    Por favor, faça login para aceder a esta área.
                </p>

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/sign-in">
                        <button className="bg-[#194b7c] text-white font-bold text-sm md:text-base uppercase px-6 py-3 md:px-8 md:py-4 rounded-full shadow-lg hover:bg-[#194b7c]/90 transition-all transform hover:scale-105">
                            Fazer Login
                        </button>
                    </Link>

                    <Link href="/">
                        <button className="bg-[#194b7c] text-white font-bold text-sm md:text-base uppercase px-6 py-3 md:px-8 md:py-4 rounded-full shadow-lg hover:bg-[#194b7c]/90 transition-all transform hover:scale-105">
                            Voltar ao ínicio
                        </button>
                    </Link>

                </div>
            </div>
        </div>
    );
}
import React from 'react';
import Link from 'next/link';
// Importamos a fonte Poppins do Next.js
import { Poppins } from 'next/font/google';

// Configuramos os pesos da fonte que vamos usar
const poppins = Poppins({
  weight: ['400', '600', '800'],
  subsets: ['latin'],
});

export default function Home() {
  return (
      // Aplicamos a classe da fonte (poppins.className) na div principal
      <div
          className={`min-h-screen relative flex flex-col items-center justify-center p-4 bg-cover bg-center bg-no-repeat overflow-hidden ${poppins.className}`}
          style={{ backgroundImage: "url('/background3.jpeg')" }} // O caminho para a imagem gerada na pasta public
      >
        {/* Título - Responsivo nos tamanhos e posicionamento */}
        <h1 className="absolute top-4 left-4 md:top-6 md:left-6 text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold text-[#194b7c] tracking-wide z-50">
          FORTIS LIBERTAS
        </h1>

        {/* Links Entrar/Registar */}
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

          {/* BEM-VINDO com sombra suave e elegante (drop-shadow-2xl) para dar contraste sem ser agressivo */}
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 tracking-wide drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">
            BEM-VINDO
          </h2>

          {/* Adicionei também uma leve sombra ao parágrafo para o mesmo efeito de contraste suave */}
          <p className="text-base sm:text-lg md:text-xl font-normal leading-relaxed text-white/95 mb-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            Fortis Liberta é a sua aplicação para descomplicar e simplificar o seu dia a dia financeiro!
          </p>

          {/* Botão */}
          <button className="bg-white text-[#194b7c] font-bold text-sm md:text-base uppercase px-6 py-3 md:px-8 md:py-4 rounded-full shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105">
            Comece agora
          </button>
        </div>
      </div>
  );
}
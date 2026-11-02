// Faixa azul de topo das telas internas (Cadastro, Indicadores, Buscar), igual ao Figma:
// o cabeçalho (absolute) fica por cima, e o conteúdo principal "sobe" sobre o azul.
import Image from "next/image";

export default function HeroInterno({ titulo, children, alvo = false, altura = 424, className = "", tituloClass = "max-w-[480px] sm:text-[44px] lg:text-[52px]" }: {
  titulo: React.ReactNode; children?: React.ReactNode; alvo?: boolean; altura?: number; className?: string; tituloClass?: string;
}) {
  return (
    <section className={`relative overflow-hidden bg-azul ${className}`} style={{ minHeight: altura }}>
      {alvo && (
        // Alvo grande do Cadastro (navy) atrás do formulário
        <Image src="/img/alvo-grande.webp" alt="" width={1400} height={1086} priority
          className="pointer-events-none absolute right-[4%] top-[92px] hidden h-auto w-[300px] lg:block xl:right-[8%] xl:w-[400px]" />
      )}
      <div className="anim-subir relative mx-auto max-w-[1280px] px-5 pt-[100px] sm:px-6 sm:pt-[128px] lg:px-[42px]">
        <h1 className={`text-[32px] font-bold leading-[1.02] text-white sm:text-[40px] ${tituloClass}`}>{titulo}</h1>
        {children}
      </div>
    </section>
  );
}

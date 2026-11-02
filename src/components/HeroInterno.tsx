// Faixa azul de topo das telas internas (Cadastro, Indicadores, Buscar), igual ao Figma:
// o cabeçalho (absolute) fica por cima, e o conteúdo principal "sobe" sobre o azul.
import Image from "next/image";

export default function HeroInterno({ titulo, children, alvo = false, altura = 424, className = "", tituloClass = "max-w-[480px] md:text-[52px]" }: {
  titulo: React.ReactNode; children?: React.ReactNode; alvo?: boolean; altura?: number; className?: string; tituloClass?: string;
}) {
  return (
    <section className={`relative overflow-hidden bg-azul ${className}`} style={{ minHeight: altura }}>
      {alvo && (
        // Alvo grande do Cadastro (navy) atrás do formulário
        <Image src="/img/alvo-grande.webp" alt="" width={1400} height={1086} priority
          className="pointer-events-none absolute right-[8%] top-[92px] hidden h-auto w-[400px] md:block" />
      )}
      <div className="relative mx-auto max-w-[1280px] px-6 pt-[128px] md:px-[42px]">
        <h1 className={`text-[40px] font-bold leading-[0.98] text-white ${tituloClass}`}>{titulo}</h1>
        {children}
      </div>
    </section>
  );
}

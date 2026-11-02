// Tela "Início" — reproduz o Figma: hero, barra de busca, sobre, como funciona, públicos, CTA e rodapé.
// Sem "Propor projeto" nem "Demandas abertas" (decisão do grupo — Guia do backend, seção 3).
import Link from "next/link";
import Image from "next/image";
import BarraBusca from "@/components/BarraBusca";
import RodapeInstitucional from "@/components/RodapeInstitucional";

const ETAPAS = [
  { n: "01", t: "Levantamento", d: "Estudantes e professores mapeiam organizações bairro a bairro, com coleta orientada pelo NUPEX." },
  { n: "02", t: "Cadastro", d: "A própria instituição preenche o formulário em etapas: dados, localização e perfil de atuação." },
  { n: "03", t: "Validação", d: "A equipe confere CNPJ, natureza jurídica e endereço antes de publicar a ficha na base." },
  { n: "04", t: "Conexão", d: "Demandas abertas viram projetos de extensão, TCCs e Desafios UNIFACISA." },
];

/** Card "Como funciona": nos ímpares o número fica numa cúpula azul embaixo; nos pares, numa cúpula no topo. */
function Etapa({ n, t, d }: (typeof ETAPAS)[number]) {
  const embaixo = Number(n) % 2 === 1;
  const numero = (
    <div className={`flex h-[160px] items-center justify-center bg-azul text-[84px] font-bold leading-none text-white font-[family-name:Arial,Helvetica,sans-serif] ${embaixo ? "rounded-t-[50%_100%] pt-6" : "rounded-b-[50%_100%] pb-6"}`}>{n}</div>
  );
  const texto = (
    <div className={`px-[34px] text-center text-white ${embaixo ? "pt-[44px]" : "pt-[38px]"}`}>
      <h3 className="text-[27px] font-bold">{t}</h3>
      <p className="mt-3 text-[19px] leading-[1.28]">{d}</p>
    </div>
  );
  return (
    <div className={`flex h-[397px] flex-col overflow-hidden rounded-[26px] bg-marinho ${embaixo ? "justify-between" : ""}`}>
      {embaixo ? (<>{texto}{numero}</>) : (<>{numero}{texto}</>)}
    </div>
  );
}

export default function Inicio() {
  return (
    <main className="relative bg-white">
      {/* Hero: imagem exportada do Figma. O cabeçalho real (Cabecalho) cobre a faixa branca embutida na imagem. */}
      <section aria-label="Conectando demandas a soluções inovadoras">
        <Image src="/img/hero.webp" alt="Conectando demandas à soluções inovadoras — Unifacisa Centro Universitário" width={2560} height={1500} priority className="mx-auto h-auto w-full max-w-[1282px]" />
      </section>
      <h1 className="sr-only">Conectando demandas à soluções inovadoras</h1>

      <div className="px-3"><BarraBusca /></div>

      <div className="mx-auto max-w-[1210px] px-3">
        {/* Sobre o desafio: fotos e formas vêm do Figma; o texto de abertura do cartão azul é HTML. */}
        <section className="relative mt-[42px]" aria-labelledby="sobre">
          <h2 id="sobre" className="sr-only">Sobre o desafio</h2>
          <Image src="/img/sobre.webp" alt="" width={2400} height={813} className="h-auto w-full" />
          <p className="absolute left-[41.3%] top-[9.5%] hidden w-[21%] text-[clamp(13px,1.95vw,25px)] leading-[1.25] text-white md:block">
            Unindo<br />educação,<br />criatividade e<br />inovação, o<br /><b className="whitespace-nowrap">Desafio Unifacisa</b>
          </p>
          <p className="mt-3 text-sm text-marinho md:hidden">Unindo educação, criatividade e inovação, o <b>Desafio Unifacisa</b> aproxima estudantes dos desafios do mundo real.</p>
        </section>

        <section className="mt-[15px]" aria-labelledby="como">
          <p className="text-center text-[32px] leading-tight text-marinho">COMO FUNCIONA</p>
          <h2 id="como" className="text-center text-[38px] font-bold leading-tight text-marinho">Do bairro à base consolidada, <span className="font-bold text-[#2f80ff]">em quatro etapas.</span></h2>
          <div className="mt-[22px] grid gap-[32px] sm:grid-cols-2 lg:grid-cols-4">{ETAPAS.map((e) => <Etapa key={e.n} {...e} />)}</div>
        </section>

        {/* Públicos: painel azul com aba central e três cartões brancos */}
        <section className="relative mt-[40px] md:pt-[90px]" aria-label="Para quem é o Desafio">
          <svg className="absolute left-1/2 top-0 hidden h-[92px] w-[260px] -translate-x-1/2 md:block" viewBox="0 0 260 92" aria-hidden>
            <path d="M0 92 L48 92 C70 92 76 84 86 70 L96 24 C100 8 112 0 130 0 C148 0 160 8 164 24 L174 70 C184 84 190 92 212 92 L260 92 Z" fill="#1555f0" />
          </svg>
          <Image src="/img/alvo-adesivo.webp" alt="" width={261} height={253} className="absolute left-1/2 top-[4px] z-10 hidden h-[118px] w-auto -translate-x-1/2 md:block" />
          <div className="rounded-[44px] bg-azul px-[33px] pb-[33px] pt-[62px] max-md:pt-6">
            <div className="grid gap-[18px] md:grid-cols-3">
              <Publico titulo="ESTUDANTES" foto="/img/card-estudantes.webp" classeFoto="mx-[14px] mb-[20px]" w={685} h={380}>
                <p className="text-[25px] leading-[1.12]">Feito para quem transforma o cotidiano.</p>
              </Publico>
              <Publico titulo="PROFESSORES" foto="/img/card-professores.webp" classeFoto="mb-0 rounded-[34px]" w={733} h={306}>
                <p className="text-[25px] font-bold leading-[1.12]">Orientação com foco e propósito.</p>
                <p className="mt-1 text-[22px] leading-[1.12]">Acompanhe projetos e conecte turmas a organizações parceiras.</p>
              </Publico>
              <Publico titulo="ORGANIZAÇÕES" foto="/img/card-organizacoes.webp" classeFoto="mx-[14px] mb-[20px] rounded-[90px/70px]" w={684} h={380}>
                <p className="text-[25px] leading-[1.12]">Comunidade vira prioridade.</p>
              </Publico>
            </div>
          </div>
        </section>

        <section className="mt-[24px]" aria-label="Cadastre sua organização">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-l-[69px] rounded-r-[20px] bg-white py-[28px] pl-[58px] pr-[56px] shadow-[8px_10px_26px_rgba(2,42,103,0.18)] max-md:rounded-[30px] max-md:px-6">
            <div>
              <p className="text-[31px] font-bold leading-tight text-marinho">Sua organização ainda não está no mapa?</p>
              <p className="mt-1 text-[16px] text-black font-[family-name:var(--font-poppins)]">Seu cadastro pode levar poucos minutos.</p>
            </div>
            <Link href="/cadastro" className="rounded-full bg-lavanda px-[44px] py-[15px] text-[18px] font-bold text-white font-[family-name:var(--font-poppins)]">Cadastrar agora</Link>
          </div>
        </section>
      </div>

      <RodapeInstitucional />
    </main>
  );
}

function Publico({ titulo, foto, classeFoto, w, h, children }: { titulo: string; foto: string; classeFoto: string; w: number; h: number; children: React.ReactNode }) {
  return (
    <article className="flex min-h-[399px] flex-col justify-between overflow-hidden rounded-[40px] bg-white pt-[38px] text-azul">
      <div className="px-[40px]">
        <h3 className="text-[18px] font-bold">{titulo}</h3>
        <div className="mt-[22px]">{children}</div>
      </div>
      <Image src={foto} alt="" width={w} height={h} className={`mt-4 h-auto w-auto max-w-full self-center ${classeFoto}`} />
    </article>
  );
}

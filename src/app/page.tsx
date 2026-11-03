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
    <div className={`flex h-[130px] items-center justify-center bg-azul text-[64px] sm:h-[160px] sm:text-[84px] font-bold leading-none text-white font-[family-name:Arial,Helvetica,sans-serif] ${embaixo ? "rounded-t-[50%_100%] pt-6" : "rounded-b-[50%_100%] pb-6"}`}>{n}</div>
  );
  const texto = (
    <div className={`px-6 pb-6 text-center text-white sm:px-[34px] sm:pb-0 ${embaixo ? "pt-8 sm:pt-[44px]" : "pt-6 sm:pt-[38px]"}`}>
      <h3 className="text-[24px] font-bold sm:text-[27px]">{t}</h3>
      <p className="mt-3 text-[17px] leading-[1.28] sm:text-[19px]">{d}</p>
    </div>
  );
  return (
    <div className={`cartao-anim flex min-h-[340px] flex-col overflow-hidden rounded-[26px] bg-marinho sm:min-h-[397px] ${embaixo ? "justify-between" : ""}`}>
      {embaixo ? (<>{texto}{numero}</>) : (<>{numero}{texto}</>)}
    </div>
  );
}

export default function Inicio() {
  return (
    <main className="relative bg-white">
      {/* Hero: imagem exportada do Figma. O cabeçalho real (Cabecalho) cobre a faixa branca embutida na imagem. */}
      <section aria-label="Conectando demandas a soluções inovadoras" className="bg-[#2a63f2] pt-[60px] sm:pt-[70px] lg:bg-transparent lg:pt-0">
        <Image src="/img/hero.webp" alt="Conectando demandas à soluções inovadoras — Unifacisa Centro Universitário" width={2560} height={1500} priority sizes="(max-width: 1282px) 100vw, 1282px" className="anim-aparecer mx-auto h-auto w-full max-w-[1282px]" />
      </section>
      <h1 className="sr-only">Conectando demandas à soluções inovadoras</h1>

      <div className="px-3"><BarraBusca /></div>

      <div className="mx-auto max-w-[1210px] px-3">
        {/* Sobre o desafio: fotos e formas vêm do Figma; o texto de abertura do cartão azul é HTML. */}
        <section className="relative mt-[42px]" aria-labelledby="sobre">
          <h2 id="sobre" className="sr-only">Sobre o desafio</h2>
          <Image src="/img/sobre.webp" alt="" width={2400} height={813} className="h-auto w-full" />
          <p className="absolute left-[41.3%] top-[9.5%] hidden w-[21%] text-[clamp(11px,1.95vw,25px)] leading-[1.25] text-white sm:block">
            Unindo<br />educação,<br />criatividade e<br />inovação, o<br /><b className="whitespace-nowrap">Desafio Unifacisa</b>
          </p>
          <p className="mt-3 text-sm text-marinho sm:hidden">Unindo educação, criatividade e inovação, o <b>Desafio Unifacisa</b> aproxima estudantes dos desafios do mundo real.</p>
        </section>

        <section className="mt-[15px]" aria-labelledby="como">
          <p className="text-center text-[22px] leading-tight text-marinho sm:text-[32px]">COMO FUNCIONA</p>
          <h2 id="como" className="text-center text-[26px] font-bold leading-tight text-marinho sm:text-[32px] lg:text-[38px]">Do bairro à base consolidada, <span className="font-bold text-[#2f80ff]">em quatro etapas.</span></h2>
          <div className="mt-[22px] grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[24px] xl:gap-[32px]">{ETAPAS.map((e) => <Etapa key={e.n} {...e} />)}</div>
        </section>

        {/* Públicos: painel azul com aba central e três cartões brancos */}
        <section className="relative mt-[40px] lg:pt-[90px]" aria-label="Para quem é o Desafio">
          <svg className="absolute left-1/2 top-0 hidden h-[92px] w-[300px] -translate-x-1/2 lg:block" viewBox="0 0 300 92" aria-hidden>
            <path d="M0 92 H30 C58 92 72 84 84 64 L96 32 C104 12 126 4 150 4 C174 4 196 12 204 32 L216 64 C228 84 242 92 270 92 H300 Z" fill="#1555f0" />
          </svg>
          <Image src="/img/alvo-adesivo.webp" alt="" width={280} height={259} className="absolute left-1/2 top-[12px] z-10 hidden h-[104px] w-auto -translate-x-1/2 lg:block" />
          <div className="rounded-[32px] bg-azul px-4 pb-4 pt-4 sm:px-[33px] sm:pb-[33px] sm:pt-6 lg:rounded-[44px] lg:pt-[62px]">
            <div className="grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
              <Publico titulo="ESTUDANTES" foto="/img/card-estudantes.webp" classeFoto="mx-[14px] mb-[20px]" w={685} h={380}>
                <p className="text-[21px] leading-[1.12] sm:text-[25px]">Feito para quem transforma o cotidiano.</p>
              </Publico>
              <Publico titulo="PROFESSORES" foto="/img/card-professores.webp" classeFoto="mb-0 rounded-[34px]" w={733} h={306}>
                <p className="text-[21px] font-bold leading-[1.12] sm:text-[25px]">Orientação com<br />foco e propósito.</p>
                <p className="mt-1 max-w-[270px] text-[18px] leading-[1.12] sm:text-[22px]">Acompanhe projetos e conecte turmas a organizações parceiras.</p>
              </Publico>
              <Publico cls="md:col-span-2 lg:col-span-1" titulo="ORGANIZAÇÕES" foto="/img/card-organizacoes.webp" classeFoto="mx-[14px] mb-[20px] rounded-[90px/70px]" w={684} h={380}>
                <p className="text-[21px] leading-[1.12] sm:text-[25px]">Comunidade vira prioridade.</p>
              </Publico>
            </div>
          </div>
        </section>

        <section className="mt-[24px]" aria-label="Cadastre sua organização">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] bg-white px-6 py-6 shadow-[8px_10px_26px_rgba(2,42,103,0.18)] lg:rounded-l-[69px] lg:rounded-r-[20px] lg:py-[28px] lg:pl-[58px] lg:pr-[56px]">
            <div>
              <p className="text-[22px] font-bold leading-tight text-marinho sm:text-[26px] lg:text-[31px]">Sua organização ainda não está no mapa?</p>
              <p className="mt-1 text-[16px] text-black font-[family-name:var(--font-poppins)]">Seu cadastro pode levar poucos minutos.</p>
            </div>
            <Link href="/cadastro" className="botao-anim botao-pulso w-full rounded-full bg-lavanda px-[44px] py-[15px] text-center text-[18px] font-bold text-white font-[family-name:var(--font-poppins)] sm:w-auto">Cadastrar agora</Link>
          </div>
        </section>
      </div>

      <RodapeInstitucional />
    </main>
  );
}

function Publico({ cls = "", titulo, foto, classeFoto, w, h, children }: { cls?: string; titulo: string; foto: string; classeFoto: string; w: number; h: number; children: React.ReactNode }) {
  return (
    <article className={`cartao-anim flex min-h-[360px] flex-col justify-between overflow-hidden rounded-[32px] bg-white pt-8 text-azul sm:min-h-[399px] sm:rounded-[40px] sm:pt-[38px] ${cls}`}>
      <div className="px-6 sm:px-[40px]">
        <h3 className="text-[18px] font-bold">{titulo}</h3>
        <div className="mt-[22px]">{children}</div>
      </div>
      <Image src={foto} alt="" width={w} height={h} className={`mt-4 h-auto w-auto max-w-full self-center ${classeFoto}`} />
    </article>
  );
}

// Seções institucionais do Início (Figma, a partir de "Conheça o Desafio"): contexto, objetivos,
// método, trilha de nove passos, parceiros e Video Cast. Conteúdo estático, sem dados do banco.
import Image from "next/image";

const PASSOS = [
  { t: "Demanda", d: "Os demandantes chegam via edital ou trazidos por alunos e professores." },
  { t: "Delimitação da demanda", d: "Visitas técnicas, levantamento de dados e discussão com os demandantes." },
  { t: "Termo de abertura", d: "Construção do termo de abertura do projeto." },
  { t: "Proposta extensionista", d: "Desenvolvimento da proposta com design thinking." },
  { t: "Seminário de validação", d: "Geralmente com a presença dos demandantes e de mentores externos." },
  { t: "Execução", d: "A proposta é colocada em prática." },
  { t: "Organização dos resultados", d: "Resumo expandido e onepage." },
  { t: "Mostra de Projetos", d: "Apresentação na Mostra de Projetos do Desafio Unifacisa." },
  { t: "Publicação dos resultados", d: "Nos anais da mostra e no e-book semestral produzido com o NUPEX." },
];

const OBJETIVOS = [
  { t: "Ensino, pesquisa e extensão", d: "Articulação entre ensino, extensão e pesquisa.", icone: "rede" },
  { t: "Comunidade e sociedade", d: "Interação da comunidade acadêmica com a sociedade, a partir da construção e aplicação de conhecimentos.", icone: "pessoas" },
  { t: "Formação integral", d: "Formação integral do estudante, estimulando a formação do cidadão, de modo interprofissional e interdisciplinar.", icone: "capelo" },
] as const;

const CONTEXTO = [
  { t: "Curricularização da extensão", d: "10% da carga horária curricular estudantil, contida na matriz curricular dos cursos." },
  { t: "Resolução CNE/CES nº 7/2018", d: "Base normativa da curricularização da extensão." },
  { t: "Mercado e prática", d: "Maior aproximação com o mercado de trabalho, a prática profissional e a responsabilidade social." },
  { t: "Conexão", d: "Entre a produção universitária e as demandas da sociedade." },
];

const DESIGN_THINKING = [
  { fase: "Compreender", itens: ["Empatia", "Definir"] },
  { fase: "Explorar", itens: ["Idear"] },
  { fase: "Realizar", itens: ["Prototipar", "Implementar"] },
];

// Logos enviados pela equipe (public/img/parceiros). `h` é a altura de exibição para equilibrar o peso visual.
const PARCEIROS = [
  { src: "pedro-americo.png", nome: "Fundação Pedro Américo", w: 140, h: 49 },
  { src: "sebrae.png", nome: "Sebrae", w: 110, h: 110 },
  { src: "help.png", nome: "HELP — Hospital de Ensino e Laboratórios de Pesquisa", w: 95, h: 95 },
  { src: "amde.png", nome: "AMDE — Agência Municipal de Desenvolvimento", w: 90, h: 82 },
  { src: "museu-uepb.png", nome: "Museu de Arte Popular da Paraíba — UEPB", w: 108, h: 84 },
  { src: "itabaiana.png", nome: "Prefeitura de Itabaiana", w: 130, h: 37 },
  { src: "areia.png", nome: "Prefeitura Municipal de Areia", w: 105, h: 35 },
  { src: "irmaos-de-francisco.png", nome: "Irmãos de Francisco", w: 84, h: 90 },
  { src: "afeto.png", nome: "Afeto — Clínica Escola do Autismo de Campina Grande", w: 130, h: 44 },
];

function Etiqueta({ children, claro = false }: { children: React.ReactNode; claro?: boolean }) {
  return (
    <span className={`inline-block rounded-full px-5 py-2 text-[13px] font-bold sm:text-[14px] ${claro ? "bg-white text-marinho" : "bg-marinho text-white"}`}>{children}</span>
  );
}

function Icone({ tipo }: { tipo: (typeof OBJETIVOS)[number]["icone"] }) {
  const comum = { width: 30, height: 30, viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (tipo === "rede") return (
    <svg {...comum}><circle cx="12" cy="6" r="2.2" /><circle cx="6" cy="17" r="2.2" /><circle cx="18" cy="17" r="2.2" /><path d="M10.6 7.8 7.3 15M13.4 7.8l3.3 7.2M8.3 17h7.4" /></svg>
  );
  if (tipo === "pessoas") return (
    <svg {...comum}><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.5-3.2 2.5-5 5.5-5s5 1.8 5.5 5" /><circle cx="17" cy="9" r="2.3" /><path d="M16 14.2c2.6-.3 4.2 1.1 4.6 4" /></svg>
  );
  return (
    <svg {...comum}><path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" /><path d="M6.5 11.6V16c0 1.2 2.5 2.5 5.5 2.5s5.5-1.3 5.5-2.5v-4.4" /><path d="M21.5 9.5V15" /></svg>
  );
}

const LINK_YOUTUBE = "https://www.youtube.com/results?search_query=DESAFIO+UNIFACISA";

export default function SecoesDesafio() {
  return (
    <div className="mt-6 space-y-5 lg:space-y-6">
      {/* Conheça o Desafio */}
      <section aria-labelledby="conheca" className="overflow-hidden rounded-[32px] bg-marinho text-white lg:rounded-[44px]">
        <div className="grid items-center gap-8 px-6 py-10 sm:px-12 lg:grid-cols-[1fr_520px] lg:gap-0 lg:py-[50px] lg:pr-0">
          <div className="lg:pr-10">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#cdd6ff]">Conheça o Desafio Unifacisa</p>
            <h2 id="conheca" className="mt-4 text-[32px] font-bold leading-[1.1] sm:text-[40px]">
              Mais que um Desafio,<br /><span className="text-[#a99ff8]">ideias que viram solução.</span>
            </h2>
            <p className="mt-6 max-w-[520px] text-[15px] leading-[1.6] sm:text-[16px]">
              Projetos de extensão universitária que promovem a interação transformadora entre a instituição de ensino e os outros setores da sociedade, por meio da articulação permanente entre ensino, pesquisa e extensão.
            </p>
            <ul className="mt-7 flex flex-wrap gap-3">
              {["Ensino", "Pesquisa", "Extensão"].map((p) => <li key={p} className="rounded-full border border-white px-5 py-2 text-[13px] font-bold">{p}</li>)}
            </ul>
          </div>
          {/* Foto com o arco lavanda do Figma */}
          <div className="rounded-l-[200px] bg-lavanda py-5 pl-5 sm:ml-auto sm:w-[520px] lg:w-full">
            <Image src="/img/inicio/mais-que-um-desafio.webp" alt="Estudantes conversando durante um projeto do Desafio Unifacisa" width={469} height={300} className="h-[300px] w-full rounded-l-[180px] object-cover object-[40%_30%]" />
          </div>
        </div>
      </section>

      {/* Contexto */}
      <section aria-labelledby="contexto" className="rounded-[32px] bg-[#efefef] px-6 py-8 sm:px-12 lg:rounded-[44px] lg:py-[44px]">
        <Etiqueta>Contexto</Etiqueta>
        <h2 id="contexto" className="mt-4 text-[28px] font-bold text-marinho sm:text-[32px]">Por que o Desafio existe</h2>
        <div className="mt-6 grid items-end gap-6 lg:grid-cols-[420px_210px_1fr] lg:gap-10">
          <Image src="/img/inicio/contexto-campus.webp" alt="Vista aérea do campus da Unifacisa" width={420} height={230} className="h-auto w-full rounded-[20px] object-cover" />
          <div className="flex h-[230px] w-full flex-col items-center justify-end rounded-t-[105px] bg-azul pb-8 text-center text-white lg:w-[210px]" role="img" aria-label="10% da carga horária em extensão">
            <p className="text-[64px] font-bold leading-none">10<span className="text-[40px]">%</span></p>
            <p className="mt-3 text-[13px] font-bold leading-tight">da carga horária<br />em extensão</p>
          </div>
          <dl className="space-y-3 self-center">
            {CONTEXTO.map((c) => (
              <div key={c.t}>
                <dt className="text-[15px] font-bold text-azul">{c.t}</dt>
                <dd className="text-[13px] leading-snug text-marinho">{c.d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Objetivos */}
      <section aria-labelledby="objetivos" className="rounded-[32px] bg-[#e9e7ff] px-6 py-8 sm:px-12 lg:rounded-[44px] lg:py-[44px]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Etiqueta>Objetivos</Etiqueta>
            <h2 id="objetivos" className="mt-4 text-[28px] font-bold text-marinho sm:text-[32px]">O que o Desafio busca</h2>
          </div>
          <div className="hidden gap-5 sm:flex">
            <Image src="/img/inicio/objetivo-1.webp" alt="" width={250} height={110} className="h-[110px] w-[250px] rounded-full object-cover" />
            <Image src="/img/inicio/objetivo-2.webp" alt="" width={250} height={110} className="h-[110px] w-[250px] rounded-full object-cover" />
          </div>
        </div>
        <ul className="mt-14 grid gap-12 md:grid-cols-3 md:gap-5">
          {OBJETIVOS.map((o) => (
            <li key={o.t} className="relative flex min-h-[196px] flex-col items-center rounded-[28px] bg-marinho px-6 pb-8 pt-12 text-center text-white">
              <span className="absolute -top-[34px] left-1/2 flex h-[68px] w-[68px] -translate-x-1/2 items-center justify-center rounded-full border-4 border-[#e9e7ff] bg-lavanda"><Icone tipo={o.icone} /></span>
              <h3 className="text-[20px] font-bold leading-tight">{o.t}</h3>
              <p className="mt-3 text-[14px] leading-snug">{o.d}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Teoria & Prática + Método */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <section aria-labelledby="teoria" className="rounded-[32px] bg-[#efefef] px-6 py-8 sm:px-10 lg:rounded-[44px]">
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_160px]">
            <div>
              {/* No celular a foto fica ao lado do título, como no desktop, em vez de sobrar embaixo do texto */}
              <Image src="/img/inicio/teoria-pratica.webp" alt="" aria-hidden width={170} height={250} className="float-right ml-4 mb-2 h-[150px] w-[100px] rounded-[50px] object-cover sm:hidden" />
              <Etiqueta>Teoria &amp; Prática</Etiqueta>
              <h2 id="teoria" className="mt-4 text-[26px] font-bold leading-[1.1] text-marinho sm:text-[27px]">Um modelo de trabalho interdisciplinar</h2>
              <p className="mt-4 text-[13.5px] leading-[1.55] text-marinho">
                O Desafio UNIFACISA é um modelo de trabalho que estimula a interdisciplinaridade e a combinação entre teoria e prática. Sistematiza os conhecimentos do curso e oferece vivência prático-profissional, com aplicação em situações reais.
              </p>
            </div>
            <Image src="/img/inicio/teoria-pratica.webp" alt="Estudante usando um notebook" width={170} height={250} className="mx-auto hidden h-[250px] w-[160px] rounded-[80px] object-cover sm:block" />
          </div>
        </section>

        <section aria-labelledby="metodo" className="relative rounded-[32px] bg-azul px-6 py-8 text-white sm:px-10 lg:rounded-[44px]">
          <Image src="/img/inicio/design-thinking.webp" alt="" aria-hidden width={130} height={130} className="absolute right-6 top-8 h-[88px] w-[88px] rounded-full object-cover sm:hidden" />
          <Etiqueta claro>Método</Etiqueta>
          <h2 id="metodo" className="mt-4 pr-[104px] text-[26px] font-bold leading-[1.1] sm:pr-0 sm:text-[28px]">Processo de Design Thinking</h2>
          <div className="mt-6 grid items-center gap-4 sm:grid-cols-[1fr_130px]">
            <ul className="space-y-3">
              {DESIGN_THINKING.map((f) => (
                <li key={f.fase} className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                  <span className="w-full text-[11px] font-bold uppercase tracking-wide sm:w-[112px]">{f.fase}</span>
                  {f.itens.map((i) => <span key={i} className="rounded-full bg-white px-4 py-2 text-[14px] font-bold text-marinho">{i}</span>)}
                </li>
              ))}
            </ul>
            <Image src="/img/inicio/design-thinking.webp" alt="" width={130} height={130} className="mx-auto hidden h-[130px] w-[130px] rounded-full object-cover sm:block" />
          </div>
        </section>
      </div>

      {/* Trilha de nove passos */}
      <section aria-labelledby="trilha" className="rounded-[32px] bg-[#e9e7ff] px-6 py-8 sm:px-12 lg:rounded-[44px] lg:py-[44px]">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <Etiqueta>Trilha</Etiqueta>
            <h2 id="trilha" className="mt-4 text-[28px] font-bold leading-tight text-marinho sm:text-[32px]">O caminho de um projeto, <span className="text-azul">em nove passos.</span></h2>
          </div>
          <Image src="/img/inicio/trilha.webp" alt="" width={350} height={100} className="hidden h-[100px] w-[350px] rounded-full object-cover lg:block" />
        </div>
        <ol className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PASSOS.map((p, i) => {
            const destaque = i === 5; // "Execução" aparece em destaque no Figma
            return (
              <li key={p.t} className={`flex min-h-[118px] items-start gap-4 rounded-[24px] px-5 py-5 ${destaque ? "bg-marinho text-white" : "bg-white text-marinho"}`}>
                <span className={`text-[48px] font-bold leading-none ${destaque ? "text-[#c9c3ff]" : "text-lavanda"}`} aria-hidden>{i + 1}</span>
                <div className="pt-1">
                  <h3 className="text-[15px] font-bold">{p.t}</h3>
                  <p className={`mt-1 text-[12.5px] leading-snug ${destaque ? "text-white/90" : "text-[#4a5b82]"}`}>{p.d}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Parceiros e demandantes */}
      <section aria-labelledby="parceiros" className="rounded-[32px] bg-[#efefef] px-5 py-8 sm:px-8 lg:rounded-[44px] lg:py-9">
        <div className="flex flex-wrap items-start justify-between gap-6 sm:px-4">
          <div>
            <Etiqueta>Parceiros e demandantes</Etiqueta>
            <h2 id="parceiros" className="mt-4 text-[28px] font-bold text-marinho sm:text-[32px]">Quem já trouxe desafios</h2>
          </div>
          <Image src="/img/inicio/parceiros.webp" alt="" width={302} height={76} className="hidden h-[76px] w-[302px] rounded-full object-cover grayscale sm:block" />
        </div>
        {/* Logos passando sem parar para a direita; a lista é repetida para o laço não ter emenda. */}
        <div className="marquee mt-8 overflow-hidden" aria-label="Organizações parceiras e demandantes">
          <ul className="marquee-trilho flex w-max items-center">
            {[...PARCEIROS, ...PARCEIROS].map((p, i) => (
              <li key={`${p.src}-${i}`} aria-hidden={i >= PARCEIROS.length} className="shrink-0 pr-10 sm:pr-14">
                <Image src={`/img/parceiros/${p.src}`} alt={i < PARCEIROS.length ? p.nome : ""} width={p.w} height={p.h} unoptimized style={{ width: p.w, height: p.h }} className="max-w-none object-contain" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Video Cast */}
      <section aria-labelledby="videocast" className="overflow-hidden rounded-[32px] bg-marinho px-6 py-8 text-white sm:px-10 lg:rounded-[44px]">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_332px]">
          <div className="flex items-center gap-6">
            <a href={LINK_YOUTUBE} target="_blank" rel="noopener noreferrer" aria-label="Assistir ao Video Cast no YouTube"
              className="flex h-[96px] w-[96px] shrink-0 items-center justify-center rounded-full bg-lavanda transition-transform duration-200 hover:scale-105 active:scale-95">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="#fff" aria-hidden><path d="M7 4.5v15l13-7.5z" /></svg>
            </a>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wide text-[#cdd6ff]">Canal de divulgação</p>
              <h2 id="videocast" className="mt-1 text-[24px] font-bold leading-tight sm:text-[28px]">Video Cast | Desafio UNIFACISA</h2>
              <p className="mt-2 max-w-[380px] text-[15px] leading-snug">Divulga os projetos e as ações do Desafio Unifacisa, sempre com convidados.</p>
              <div className="mt-4 inline-block rounded-[14px] bg-[#0b3a85] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#b9c6f4]">Coordenação</p>
                <p className="text-[15px] font-bold">Prof. Dr. Adriano Barros</p>
              </div>
            </div>
          </div>
          <a href={LINK_YOUTUBE} target="_blank" rel="noopener noreferrer" aria-label="Abrir o canal Desafio Unifacisa no YouTube" className="mx-auto block w-full max-w-[332px] transition-transform duration-200 hover:scale-[1.02]">
            <Image src="/img/inicio/videocast.webp" alt="Página do canal Desafio Unifacisa com os episódios do Video Cast" width={332} height={200} className="h-auto w-full rounded-[18px]" />
          </a>
        </div>
      </section>
    </div>
  );
}

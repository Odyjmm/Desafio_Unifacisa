"use client";
// Tela "Indicadores". Todos os números vêm da função `indicadores` do banco (Guia, seção 4):
// os valores do protótipo eram exemplos. Painéis sem dado no banco (funil da curadoria) e
// "Demandas abertas" (removido pelo grupo) ficaram de fora.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { carregarIndicadores, carregarListas, urlExportar, type Indicadores, type Opcao } from "@/lib/api";
import HeroInterno from "@/components/HeroInterno";
import RodapeBarra from "@/components/RodapeBarra";

/** Barras horizontais proporcionais ao maior valor (ou a 100 quando for percentual). */
function Barras({ itens, cor = "#1555f0", sufixo = "", maximo }: { itens: { nome: string; valor: number }[]; cor?: string; sufixo?: string; maximo?: number }) {
  const max = maximo ?? Math.max(1, ...itens.map((i) => i.valor));
  return (
    <ul className="mt-4 space-y-2.5">
      {itens.map((i) => (
        <li key={i.nome} className="grid grid-cols-[minmax(0,190px)_1fr_40px] items-center gap-3 text-[11px] text-marinho">
          <span className="truncate font-semibold">{i.nome}</span>
          <span className="h-[8px] rounded-full bg-[#e8edf9]"><span className="block h-full rounded-full" style={{ width: `${Math.max(2, (i.valor / max) * 100)}%`, background: cor }} /></span>
          <span className="text-right font-bold">{i.valor}{sufixo}</span>
        </li>
      ))}
    </ul>
  );
}

const CORES = ["#022a67", "#1555f0", "#8b7cf6", "#c9d3f3"];
function Rosca({ itens, total }: { itens: { nome: string; valor: number }[]; total: number }) {
  const r = 60, c = 2 * Math.PI * r;
  // início de cada fatia = soma dos tamanhos anteriores
  const inicios = itens.map((_, k) => itens.slice(0, k).reduce((t, x) => t + (x.valor / Math.max(1, total)) * c, 0));
  return (
    <div className="mt-3 flex flex-col items-center gap-4">
      <svg viewBox="0 0 160 160" className="h-[150px] w-[150px]" role="img" aria-label={`${total} organizações por natureza jurídica`}>
        <g transform="rotate(-90 80 80)">
          {itens.map((i, k) => { const len = (i.valor / Math.max(1, total)) * c; return <circle key={i.nome} cx="80" cy="80" r={r} fill="none" stroke={CORES[k % 4]} strokeWidth="26" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-inicios[k]} />; })}
        </g>
        <text x="80" y="82" textAnchor="middle" className="fill-[#022a67]" fontSize="26" fontWeight="800">{total}</text>
        <text x="80" y="98" textAnchor="middle" className="fill-[#5b6b8c]" fontSize="8">organizações</text>
      </svg>
      <ul className="w-full space-y-1.5 text-[11px] text-marinho">
        {itens.map((i, k) => (
          <li key={i.nome} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CORES[k % 4] }} /><span className="flex-1">{i.nome}</span>
            <b>{i.valor}</b><span className="w-9 text-right text-[#5b6b8c]">{Math.round((i.valor / Math.max(1, total)) * 100)}%</span></li>
        ))}
      </ul>
    </div>
  );
}

export default function IndicadoresPagina() {
  const [d, setD] = useState<Indicadores | null>(null);
  const [municipios, setMunicipios] = useState<Opcao[]>([]);
  const [areas, setAreas] = useState<Opcao[]>([]);
  const [mun, setMun] = useState("");
  const [area, setArea] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => { carregarListas().then((l) => { setMunicipios(l.municipios); setAreas(l.areas); }); }, []);
  useEffect(() => {
    // Filtros opcionais por município e área; null = sem filtro.
    carregarIndicadores(mun ? [Number(mun)] : null, area ? [Number(area)] : null)
      .then((r) => { setErro(""); setD(r); }).catch(() => setErro("Não foi possível carregar os indicadores."));
  }, [mun, area]);

  const sel = "h-[42px] max-w-full rounded-full bg-white px-4 text-[12px] font-semibold text-marinho outline-none transition-shadow focus:ring-2 focus:ring-white/70 sm:h-[36px]";
  return (
    <main className="flex min-h-screen flex-col bg-fundo">
      <HeroInterno titulo={<>Mapeando organizações, revelando oportunidades.</>} altura={440}>
        <Image src="/img/predio-alunos.webp" alt="" width={1600} height={1130} priority className="pointer-events-none absolute bottom-0 right-0 hidden h-auto w-[420px] lg:block xl:w-[720px]" />
        <div className="relative mt-6 flex flex-wrap items-end gap-3 pb-[72px] max-sm:[&>*]:w-full max-sm:[&_select]:w-full">
          <label className="text-[9.5px] font-bold uppercase text-white/80">Município<br />
            <select aria-label="Município" className={sel} value={mun} onChange={(e) => setMun(e.target.value)}><option value="">Toda a região RMCG</option>{municipios.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
          <label className="text-[9.5px] font-bold uppercase text-white/80">Área de atuação<br />
            <select aria-label="Área de atuação" className={sel} value={area} onChange={(e) => setArea(e.target.value)}><option value="">Todas as áreas</option>{areas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
          {/* Guia, seção 7: Exportar CSV respeita os mesmos filtros */}
          <a className="botao-anim flex h-[42px] items-center justify-center rounded-full bg-marinho px-5 text-[12px] font-bold text-white sm:h-[36px]" href={urlExportar({ municipios: mun ? [Number(mun)] : [], areas: area ? [Number(area)] : [] })}>⤓ Exportar CSV</a>
        </div>
      </HeroInterno>

      <div className="relative z-10 mx-auto -mt-[56px] mb-12 w-full max-w-[1280px] space-y-4 px-3 sm:px-4 lg:px-[22px]">
        {erro && <p className="rounded-2xl bg-white p-3 text-sm font-semibold text-red-600" role="alert">{erro}</p>}
        {d && (<>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[["Organizações na base", d.total_organizacoes, "Ativas e com CNPJ coletado nas bases públicas", false],
              ["Municípios cobertos", `${d.municipios_cobertos}/${d.municipios_total}`, "Municípios da RMCG com registros", false],
              ["Sem coordenadas", d.sem_coordenadas, "Aparecem na lista, mas não no mapa", false],
              ["Completude média", `${d.completude_media}%`, "Média de preenchimento dos campos levantados", true]].map(([t, v, s, escuro]) => (
              <div key={String(t)} className={`cartao-anim rounded-[20px] p-5 ${escuro ? "bg-marinho text-white" : "bg-white text-marinho"}`}>
                <p className="text-[9.5px] font-bold uppercase tracking-wide opacity-80">{t}</p>
                <p className="mt-1 text-[40px] font-bold leading-none">{v}</p><p className="mt-2 text-[10.5px] opacity-75">{s}</p></div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-[22px] bg-white p-4 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="text-[16px] font-bold text-marinho">Organizações por município</h2><p className="text-[11px] text-[#5b6b8c]">Campina Grande e demais municípios da região</p></div>
              <Link href="/buscar" className="botao-anim shrink-0 rounded-full px-2 py-1.5 text-[12px] font-bold text-azul underline">Ver no mapa →</Link></div>
              <Barras itens={d.por_municipio.slice(0, 10).map((l) => ({ nome: l.municipio, valor: l.total }))} /></section>
            <section className="rounded-[22px] bg-white p-4 sm:p-6"><h2 className="text-[16px] font-bold text-marinho">Natureza jurídica</h2><p className="text-[11px] text-[#5b6b8c]">Como as organizações estão registradas no CNPJ</p>
              <Rosca total={d.total_organizacoes} itens={d.por_natureza.map((l) => ({ nome: l.natureza, valor: l.total }))} /></section>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Uma organização com 2 áreas conta nas duas: a soma pode passar do total */}
            <section className="rounded-[22px] bg-white p-4 sm:p-6"><h2 className="text-[16px] font-bold text-marinho">Áreas de atuação</h2><p className="text-[11px] text-[#5b6b8c]">Uma organização pode atuar em mais de uma área</p>
              <Barras itens={d.por_area.map((l) => ({ nome: l.area, valor: l.total }))} /></section>
            <section className="rounded-[22px] bg-white p-4 sm:p-6"><h2 className="text-[16px] font-bold text-marinho">Completude dos campos</h2><p className="text-[11px] text-[#5b6b8c]">Campos que a equipe levanta em campo</p>
              <Barras sufixo="%" maximo={100} cor="#022a67" itens={d.completude_por_campo.map((l) => ({ nome: l.campo, valor: l.percentual }))} /></section>
          </div>
        </>)}
      </div>
      <RodapeBarra direita="Fonte: coleta em campo + MOSC/IPEA e bases públicas de CNPJ" />
    </main>
  );
}

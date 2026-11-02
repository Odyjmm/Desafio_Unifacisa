"use client";
// Tela "Buscar organizações" (lista + mapa). Dados: RPCs do Supabase (Guia do backend, seção 4).
// Sem "Propor projeto" (removido por decisão do grupo — Guia, seção 3).
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  buscarOrganizacoes, carregarIndicadores, carregarListas, marcadoresMapa, resumoMunicipios, urlExportar, formatarCnpj,
  type Filtros, type Marcador, type Opcao, type Organizacao, type ResumoMunicipio,
} from "@/lib/api";
import HeroInterno from "@/components/HeroInterno";
import RodapeBarra from "@/components/RodapeBarra";

// Leaflet usa `window`, então o mapa só carrega no navegador.
const MapaBusca = dynamic(() => import("@/components/MapaBusca"), { ssr: false, loading: () => <div className="h-full min-h-[560px] animate-pulse rounded-[22px] bg-[#dfe8fb]" /> });

const rotulo = "mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-marinho";
const campo = "w-full bg-transparent text-[12.5px] text-marinho outline-none placeholder:text-[#7b89a8]";
const iniciais = (n: string) => n.split(/\s+/).filter((p) => p.length > 2).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || n.slice(0, 2).toUpperCase();

function Conteudo() {
  const params = useSearchParams();
  const [listas, setListas] = useState<{ areas: Opcao[]; publicos: Opcao[]; tipos: Opcao[]; municipios: Opcao[] }>({ areas: [], publicos: [], tipos: [], municipios: [] });
  // Filtros iniciais vêm da barra de busca do Início (?q=&area=&municipio=).
  const [f, setF] = useState<Filtros>({
    texto: params.get("q") ?? "",
    areas: params.get("area") ? [Number(params.get("area"))] : [],
    municipios: params.get("municipio") ? [Number(params.get("municipio"))] : [],
    publicos: [], tiposParceria: [],
  });
  const [total, setTotal] = useState(0);
  const [itens, setItens] = useState<Organizacao[]>([]);
  const [marcadores, setMarcadores] = useState<Marcador[]>([]);
  const [bolhas, setBolhas] = useState<ResumoMunicipio[]>([]);
  const [kpi, setKpi] = useState<{ total: number; cobertos: number; municipios: number } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [ficha, setFicha] = useState<Organizacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarListas().then(setListas).catch(() => setErro("Não foi possível carregar os filtros."));
    carregarIndicadores().then((i) => setKpi({ total: i.total_organizacoes, cobertos: i.municipios_cobertos, municipios: i.municipios_total })).catch(() => {});
  }, []);

  const buscar = useCallback(async (filtros: Filtros) => {
    setCarregando(true); setErro("");
    try {
      const [lista, pts, mun] = await Promise.all([buscarOrganizacoes(filtros), marcadoresMapa(filtros), resumoMunicipios(filtros)]);
      setTotal(lista.total); setItens(lista.itens); setMarcadores(pts); setBolhas(mun);
    } catch { setErro("Não foi possível buscar agora. Tente novamente."); }
    setCarregando(false);
  }, []);
  useEffect(() => { buscar(f); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const aplicar = (n: Filtros) => { setF(n); buscar(n); };
  const atual = itens.find((o) => o.id === sel) ?? null;

  return (
    <main className="flex min-h-screen flex-col bg-fundo">
      <HeroInterno titulo={<>Encontre a organização certa para o seu projeto.</>} altura={400} tituloClass="max-w-[760px] md:text-[48px]">
        <p className="mt-3 max-w-[560px] text-[13px] leading-snug text-white/85">Organizações do terceiro setor da Região Metropolitana de Campina Grande, curadas pelo NUPEX e prontas para parcerias de extensão, TCCs e Desafios.</p>
        {/* Números reais do banco (função `indicadores`) */}
        <div className="mt-5 flex gap-3 md:absolute md:right-[42px] md:top-[124px] md:mt-0">
          <div className="rounded-[18px] bg-marinho px-6 py-3 text-white"><p className="text-[28px] font-bold leading-none">{kpi?.total ?? "—"}</p><p className="text-[10px] opacity-80">organizações ativas</p></div>
          <div className="rounded-[18px] bg-white px-6 py-3 text-marinho"><p className="text-[28px] font-bold leading-none">{kpi?.cobertos ?? "—"}<span className="text-[13px] opacity-70">/{kpi?.municipios ?? "—"}</span></p><p className="text-[10px] opacity-80">municípios com registros</p></div>
        </div>
      </HeroInterno>

      <div className="relative z-10 mx-auto -mt-[60px] max-w-[1280px] px-4 md:px-[22px]">
        <form onSubmit={(e) => { e.preventDefault(); buscar(f); }} className="grid gap-3 rounded-[26px] bg-white p-3 shadow-[0_8px_30px_rgba(2,42,103,0.10)] md:grid-cols-[1.7fr_1fr_1fr_auto]">
          <label className="block rounded-[18px] bg-fundo px-4 py-2.5"><span className={rotulo}>O que você procura?</span>
            <input className={campo} placeholder="Reforço escolar, horta comunitária, nome da organização..." value={f.texto} onChange={(e) => setF({ ...f, texto: e.target.value })} /></label>
          <label className="block rounded-[18px] bg-fundo px-4 py-2.5"><span className={rotulo}>Público-alvo</span>
            <select className={campo} value={f.publicos?.[0] ?? ""} onChange={(e) => setF({ ...f, publicos: e.target.value ? [Number(e.target.value)] : [] })}>
              <option value="">Todos os públicos</option>{listas.publicos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
          <label className="block rounded-[18px] bg-fundo px-4 py-2.5"><span className={rotulo}>Tipo de parceria</span>
            <select className={campo} value={f.tiposParceria?.[0] ?? ""} onChange={(e) => setF({ ...f, tiposParceria: e.target.value ? [Number(e.target.value)] : [] })}>
              <option value="">Qualquer</option>{listas.tipos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
          <button className="rounded-[18px] bg-azul px-8 text-[13px] font-bold text-white">⌕ Buscar</button>
        </form>

        {/* As 12 áreas, sem agrupar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-marinho">Área de atuação:</span>
          <button onClick={() => aplicar({ ...f, areas: [] })} className={`rounded-full px-4 py-1.5 text-[11.5px] font-bold ${!f.areas?.length ? "bg-marinho text-white" : "border border-[#dfe5f1] bg-white text-marinho"}`}>Todas</button>
          {listas.areas.map((a) => (
            <button key={a.id} onClick={() => aplicar({ ...f, areas: [a.id] })} className={`rounded-full px-4 py-1.5 text-[11.5px] font-bold ${f.areas?.[0] === a.id ? "bg-marinho text-white" : "border border-[#dfe5f1] bg-white text-marinho"}`}>{a.nome}</button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold text-marinho" aria-live="polite">{carregando ? "Buscando…" : `${total} organizações encontradas`}</h2>
          {/* Guia, seção 7: botão Exportar CSV */}
          <a className="rounded-full border border-[#dfe5f1] bg-white px-4 py-2 text-[12px] font-bold text-marinho" href={urlExportar(f)}>Exportar CSV</a>
        </div>
        {erro && <p className="mt-1 text-[12px] font-semibold text-red-600" role="alert">{erro}</p>}

        <div className="mt-3 grid gap-4 lg:grid-cols-[350px_1fr]">
          <ul className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
            {itens.map((o) => (
              <li key={o.id}>
                <button onClick={() => setSel(o.id)} className={`w-full rounded-[18px] bg-white p-4 text-left ${sel === o.id ? "border-2 border-azul" : "border-2 border-transparent"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-[#e8efff] px-2 py-0.5 text-[8.5px] font-bold uppercase text-azul">{o.areas?.[0] ?? "Organização"}</span>
                    {/* Regra do Guia: selo só quando situacao_cadastral = 'ativa' */}
                    {o.situacao_cadastral === "ativa" && <span className="text-[10px] font-semibold text-marinho">✓ CNPJ ativo</span>}
                  </div>
                  <p className="mt-2 text-[15px] font-bold leading-tight text-marinho">{o.nome}</p>
                  <p className="mt-1 text-[10.5px] text-[#5b6b8c]">📍 {[o.municipio, o.bairro].filter(Boolean).join(" · ")}</p>
                  {o.natureza_juridica && <p className="text-[10.5px] text-[#5b6b8c]">{o.natureza_juridica}</p>}
                  {o.demandas && <p className="mt-2 rounded-lg bg-fundo px-3 py-2 text-[11px] text-marinho"><b>Demanda:</b> {o.demandas}</p>}
                </button>
              </li>
            ))}
            {!carregando && itens.length === 0 && <li className="rounded-[18px] bg-white p-4 text-sm">Nenhuma organização encontrada com esses filtros.</li>}
          </ul>

          <div className="relative min-h-[560px] rounded-[26px] bg-white p-2">
            <MapaBusca municipios={bolhas} marcadores={marcadores} selecionado={sel} aoSelecionar={setSel}
              aoClicarMunicipio={(id) => aplicar({ ...f, municipios: [id] })} />
            <div className="absolute left-5 top-5 z-[500] rounded-[14px] bg-white px-3 py-2 text-[10px] text-marinho shadow-md">
              <p className="font-bold">Região Metropolitana de Campina Grande</p>
              <p className="mt-1 flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-azul" />Organizações por município (tamanho = quantidade)</p>
              <p className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-[#9aa8c7]" />Sem registros ainda</p>
            </div>
            {atual && (
              <aside className="absolute bottom-5 left-5 z-[500] w-[330px] max-w-[calc(100%-2.5rem)] rounded-[20px] bg-white p-4 shadow-xl">
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-azul text-[12px] font-bold text-white">{iniciais(atual.nome)}</span>
                  <div><p className="text-[13px] font-bold leading-tight text-marinho">{atual.nome}</p>
                    <p className="text-[9.5px] text-[#5b6b8c]">{atual.natureza_juridica}{atual.cnpj ? ` · CNPJ ${formatarCnpj(atual.cnpj)}` : ""}</p></div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[10.5px] text-marinho">
                  <div><dt className="text-[8.5px] font-bold uppercase text-[#5b6b8c]">Área</dt><dd>{atual.areas?.join(", ") || "—"}</dd></div>
                  <div><dt className="text-[8.5px] font-bold uppercase text-[#5b6b8c]">Público-alvo</dt><dd>{atual.publicos?.slice(0, 3).join(", ") || "—"}</dd></div>
                  <div className="col-span-2"><dt className="text-[8.5px] font-bold uppercase text-[#5b6b8c]">Endereço</dt><dd>{atual.endereco_completo || "—"}</dd></div>
                </dl>
                {/* Nenhuma consulta pública devolve nome/cargo do responsável */}
                <button onClick={() => setFicha(atual)} className="mt-3 rounded-full bg-azul px-4 py-2 text-[11px] font-bold text-white">Ver ficha completa</button>
              </aside>
            )}
          </div>
        </div>

        <section className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-white px-7 py-5">
          <div><p className="text-[15px] font-bold text-marinho">Sua organização ainda não está no mapa?</p><p className="text-[11px] text-[#5b6b8c]">O cadastro leva poucos minutos e passa por validação da equipe NUPEX.</p></div>
          <Link href="/cadastro" className="rounded-full bg-lavanda px-6 py-2.5 text-[12px] font-bold text-white">Cadastrar agora</Link>
        </section>
      </div>

      <RodapeBarra />

      {ficha && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-marinho/60 p-4" role="dialog" aria-modal="true" aria-label={`Ficha de ${ficha.nome}`} onClick={() => setFicha(null)}>
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[24px] bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3"><h3 className="text-xl font-bold text-marinho">{ficha.nome}</h3><button aria-label="Fechar" onClick={() => setFicha(null)} className="text-2xl leading-none text-marinho">×</button></div>
            <dl className="mt-4 space-y-3 text-[13px] text-marinho">
              {[["CNPJ", ficha.cnpj ? formatarCnpj(ficha.cnpj) : null], ["Natureza jurídica", ficha.natureza_juridica], ["Endereço", ficha.endereco_completo], ["Áreas", ficha.areas?.join(", ")], ["Públicos", ficha.publicos?.join(", ")],
                ["Tipos de parceria", ficha.tipos_parceria?.join(", ")], ["Demandas", ficha.demandas], ["Telefone", ficha.telefone_1], ["E-mail", ficha.email], ["Site", ficha.site_url], ["Instagram", ficha.instagram], ["Facebook", ficha.facebook]]
                .filter(([, v]) => v).map(([k, v]) => <div key={String(k)}><dt className="text-[10px] font-bold uppercase text-[#5b6b8c]">{k}</dt><dd>{v}</dd></div>)}
            </dl>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Pagina() {
  return <Suspense><Conteudo /></Suspense>;
}

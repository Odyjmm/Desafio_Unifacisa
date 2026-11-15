"use client";
// Tela "Buscar organizações" (lista + mapa). Dados: RPCs do Supabase (Guia do backend, seção 4).
// Sem "Propor projeto" (removido por decisão do grupo — Guia, seção 3).
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  buscarOrganizacoes, carregarIndicadores, carregarListas, marcadoresMapa, resumoMunicipios, urlExportar, formatarCnpj, organizacaoPorId, linkWhatsapp, linkInstagram,
  type Filtros, type Marcador, type Opcao, type Organizacao, type ResumoMunicipio,
} from "@/lib/api";
import HeroInterno from "@/components/HeroInterno";
import RodapeBarra from "@/components/RodapeBarra";

// Leaflet usa `window`, então o mapa só carrega no navegador.
const MapaBusca = dynamic(() => import("@/components/MapaBusca"), { ssr: false, loading: () => <div className="h-full min-h-[440px] animate-pulse sm:min-h-[560px] rounded-[22px] bg-[#dfe8fb]" /> });

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
  const [extra, setExtra] = useState<Organizacao | null>(null); // organização clicada no mapa que ainda não está na lista
  const [maisLoading, setMaisLoading] = useState(false);
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
  const atual = itens.find((o) => o.id === sel) ?? (extra && extra.id === sel ? extra : null);

  // O mapa mostra todas as organizações, mas a lista carrega só uma página: busca a ficha do ponto clicado.
  useEffect(() => {
    if (!sel || itens.some((o) => o.id === sel)) return;
    let cancelado = false;
    organizacaoPorId(sel).then((o) => { if (!cancelado) setExtra(o); }).catch(() => { if (!cancelado) setErro("Não foi possível abrir a ficha desta organização."); });
    return () => { cancelado = true; };
  }, [sel, itens]);

  const carregarMais = async () => {
    setMaisLoading(true);
    try { const r = await buscarOrganizacoes(f, 20, itens.length); setItens((atuais) => [...atuais, ...r.itens.filter((n) => !atuais.some((a) => a.id === n.id))]); }
    catch { setErro("Não foi possível carregar mais organizações."); }
    setMaisLoading(false);
  };

  const botaoInstagram = (o: Organizacao) => {
    const link = linkInstagram(o.instagram);
    return link ? <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`Instagram de ${o.nome}`} title="Abrir o Instagram"
      className="botao-anim inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#f9a03c] via-[#e1306c] to-[#7b3fe4] text-white">
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" /></svg>
    </a> : null;
  };

  const botaoZap = (o: Organizacao, cls: string) => {
    const link = linkWhatsapp(o.telefone_1, o.nome);
    return link ? <a href={link} target="_blank" rel="noopener noreferrer" className={`botao-anim inline-flex items-center justify-center gap-2 rounded-full bg-[#1a9e55] px-4 py-2.5 text-[12px] font-bold text-white ${cls}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.45 1.34-2 1.4-.52.06-1.18.09-1.9-.12-.44-.14-1-.32-1.73-.63-3.04-1.3-5.02-4.37-5.17-4.57-.15-.2-1.23-1.64-1.23-3.12 0-1.49.78-2.22 1.05-2.52.28-.3.6-.37.8-.37h.58c.19 0 .43-.07.67.5.25.6.84 2.07.91 2.22.08.15.13.32.03.52-.1.2-.15.32-.3.5-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.05 1.13 1 2.09 1.31 2.39 1.46.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.28.1 1.75.83 2.05.98.3.15.5.22.57.35.08.12.08.72-.17 1.42Z" /></svg>
      Enviar mensagem</a> : null;
  };


  return (
    <main className="flex min-h-screen flex-col bg-fundo">
      <HeroInterno titulo={<>Encontre a organização certa para o seu projeto.</>} altura={400} tituloClass="max-w-[760px] sm:text-[40px] lg:text-[48px]">
        <p className="mt-3 max-w-[560px] text-[13px] leading-snug text-white/85">Organizações do terceiro setor da Região Metropolitana de Campina Grande, curadas pelo NUPEX e prontas para parcerias de extensão, TCCs e Desafios.</p>
        {/* Números reais do banco (função `indicadores`) */}
        <div className="mt-5 flex flex-wrap gap-3 pb-20 lg:absolute lg:right-[42px] lg:top-[124px] lg:mt-0 lg:pb-0">
          <div className="rounded-[18px] bg-marinho px-6 py-3 text-white"><p className="text-[28px] font-bold leading-none">{kpi?.total ?? "—"}</p><p className="text-[10px] opacity-80">organizações ativas</p></div>
          <div className="rounded-[18px] bg-white px-6 py-3 text-marinho"><p className="text-[28px] font-bold leading-none">{kpi?.cobertos ?? "—"}<span className="text-[13px] opacity-70">/{kpi?.municipios ?? "—"}</span></p><p className="text-[10px] opacity-80">municípios com registros</p></div>
        </div>
      </HeroInterno>

      <div className="relative z-10 mx-auto -mt-[60px] w-full max-w-[1280px] px-3 sm:px-4 lg:px-[22px]">
        <form onSubmit={(e) => { e.preventDefault(); buscar(f); }} className="grid gap-3 rounded-[26px] bg-white p-3 shadow-[0_8px_30px_rgba(2,42,103,0.10)] sm:grid-cols-2 xl:grid-cols-[1.7fr_1fr_1fr_auto]">
          <label className="block rounded-[18px] bg-fundo px-4 py-2.5"><span className={rotulo}>O que você procura?</span>
            <input className={campo} placeholder="Reforço escolar, horta comunitária, nome da organização..." value={f.texto} onChange={(e) => setF({ ...f, texto: e.target.value })} /></label>
          <label className="block rounded-[18px] bg-fundo px-4 py-2.5"><span className={rotulo}>Público-alvo</span>
            <select className={campo} value={f.publicos?.[0] ?? ""} onChange={(e) => setF({ ...f, publicos: e.target.value ? [Number(e.target.value)] : [] })}>
              <option value="">Todos os públicos</option>{listas.publicos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
          <label className="block rounded-[18px] bg-fundo px-4 py-2.5"><span className={rotulo}>Tipo de parceria</span>
            <select className={campo} value={f.tiposParceria?.[0] ?? ""} onChange={(e) => setF({ ...f, tiposParceria: e.target.value ? [Number(e.target.value)] : [] })}>
              <option value="">Qualquer</option>{listas.tipos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
          <button className="botao-anim min-h-[48px] rounded-[18px] bg-azul px-8 text-[14px] font-bold text-white sm:col-span-2 xl:col-span-1">⌕ Buscar</button>
        </form>

        {/* As 12 áreas, sem agrupar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-marinho">Área de atuação:</span>
          <button onClick={() => aplicar({ ...f, areas: [] })} className={`botao-anim rounded-full px-4 py-2 text-[12px] font-bold ${!f.areas?.length ? "bg-marinho text-white" : "border border-[#dfe5f1] bg-white text-marinho"}`}>Todas</button>
          {listas.areas.map((a) => (
            <button key={a.id} onClick={() => aplicar({ ...f, areas: [a.id] })} className={`botao-anim rounded-full px-4 py-2 text-[12px] font-bold ${f.areas?.[0] === a.id ? "bg-marinho text-white" : "border border-[#dfe5f1] bg-white text-marinho"}`}>{a.nome}</button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold text-marinho" aria-live="polite">{carregando ? "Buscando…" : `${total} organizações encontradas`}</h2>
          {/* Guia, seção 7: botão Exportar CSV */}
          <a className="botao-anim rounded-full border border-[#dfe5f1] bg-white px-4 py-2.5 text-[12px] font-bold text-marinho" href={urlExportar(f)}>Exportar CSV</a>
        </div>
        {erro && <p className="mt-1 text-[12px] font-semibold text-red-600" role="alert">{erro}</p>}

        <div className="mt-3 grid gap-4 lg:grid-cols-[350px_1fr]">
          <ul className="max-h-[420px] space-y-3 overflow-y-auto pr-1 lg:max-h-[640px]">
            {itens.map((o) => (
              <li key={o.id}>
                <button onClick={() => setSel(o.id)} className={`cartao-anim w-full rounded-[18px] bg-white p-4 text-left ${sel === o.id ? "border-2 border-azul" : "border-2 border-transparent"}`}>
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
            {itens.length > 0 && itens.length < total && (
              <li><button onClick={carregarMais} disabled={maisLoading} className="botao-anim w-full rounded-full border border-[#dfe5f1] bg-white px-4 py-3 text-[12px] font-bold text-marinho disabled:opacity-60">
                {maisLoading ? "Carregando…" : `Ver mais organizações (${itens.length} de ${total})`}</button></li>
            )}
          </ul>

          <div className="relative min-h-[460px] rounded-[26px] bg-white p-2 sm:min-h-[560px]">
            <MapaBusca municipios={bolhas} marcadores={marcadores} selecionado={sel} aoSelecionar={setSel}
              aoClicarMunicipio={(id) => aplicar({ ...f, municipios: [id] })} />
            <div className="absolute left-4 top-4 z-[500] hidden max-w-[calc(100%-6rem)] rounded-[14px] bg-white px-3 py-2 text-[10px] text-marinho shadow-md sm:left-5 sm:top-5 sm:block">
              <p className="font-bold">Região Metropolitana de Campina Grande</p>
              <p className="mt-1 flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-azul" />Organizações por município (tamanho = quantidade)</p>
              <p className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-[#9aa8c7]" />Sem registros ainda</p>
            </div>
            {atual && (
              <aside className="anim-subir absolute bottom-3 left-3 z-[500] w-[330px] max-w-[calc(100%-1.5rem)] rounded-[20px] bg-white p-4 shadow-xl sm:bottom-5 sm:left-5 sm:max-w-[calc(100%-2.5rem)]">
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => setFicha(atual)} className="botao-anim rounded-full bg-azul px-4 py-2.5 text-[12px] font-bold text-white">Ver ficha completa</button>
                  {botaoZap(atual, "")}
                  {botaoInstagram(atual)}
                </div>
              </aside>
            )}
          </div>
        </div>

        <section className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-white px-5 py-5 sm:px-7">
          <div><p className="text-[15px] font-bold text-marinho">Sua organização ainda não está no mapa?</p><p className="text-[11px] text-[#5b6b8c]">O cadastro leva poucos minutos e passa por validação da equipe NUPEX.</p></div>
          <Link href="/cadastro" className="botao-anim w-full rounded-full bg-lavanda px-6 py-3 text-center text-[13px] font-bold text-white sm:w-auto">Cadastrar agora</Link>
        </section>
      </div>

      <RodapeBarra />

      {ficha && (
        <div className="anim-aparecer fixed inset-0 z-[2000] flex items-center justify-center bg-marinho/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-label={`Ficha de ${ficha.nome}`} onClick={() => setFicha(null)}>
          <div className="anim-subir max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[24px] bg-white p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3"><h3 className="text-xl font-bold text-marinho">{ficha.nome}</h3><button aria-label="Fechar" onClick={() => setFicha(null)} className="botao-anim flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fundo text-2xl leading-none text-marinho">×</button></div>
            <dl className="mt-4 space-y-3 text-[13px] text-marinho">
              {[["CNPJ", ficha.cnpj ? formatarCnpj(ficha.cnpj) : null], ["Natureza jurídica", ficha.natureza_juridica], ["Endereço", ficha.endereco_completo], ["Áreas", ficha.areas?.join(", ")], ["Públicos", ficha.publicos?.join(", ")],
                ["Tipos de parceria", ficha.tipos_parceria?.join(", ")], ["Demandas", ficha.demandas], ["E-mail", ficha.email], ["Site", ficha.site_url], ["Facebook", ficha.facebook]]
                .filter(([, v]) => v).map(([k, v]) => <div key={String(k)}><dt className="text-[10px] font-bold uppercase text-[#5b6b8c]">{k}</dt><dd>{v}</dd></div>)}
              {linkInstagram(ficha.instagram) && (
                <div><dt className="text-[10px] font-bold uppercase text-[#5b6b8c]">Instagram</dt>
                  <dd className="flex flex-wrap items-center gap-3"><span>{ficha.instagram}</span>{botaoInstagram(ficha)}</dd></div>
              )}
              {ficha.telefone_1 && (
                <div><dt className="text-[10px] font-bold uppercase text-[#5b6b8c]">Telefone</dt>
                  <dd className="flex flex-wrap items-center gap-3"><span>{ficha.telefone_1}</span>{botaoZap(ficha, "!py-2")}</dd></div>
              )}
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

"use client";
// Tela "Administrador" (moderação). Guia, seção 6: sessão por cookie httpOnly,
// sempre chamando rotas do MESMO domínio (por isso só funciona de verdade no site publicado).
import { useCallback, useEffect, useMemo, useState } from "react";
import { carregarListas, chamarApi, supabase } from "@/lib/api";
import {
  compararCampos, formatarDataHora, idadeDoEnvio, resumoNovo,
  type Item, type Listas, type ListasAtuais,
} from "@/lib/moderacao";
import HeroInterno from "@/components/HeroInterno";
import RodapeBarra from "@/components/RodapeBarra";

type Situacao = "pendente" | "aprovada" | "rejeitada";
const SITUACOES: { valor: Situacao; rotulo: string }[] = [
  { valor: "pendente", rotulo: "Pendentes" },
  { valor: "aprovada", rotulo: "Aprovadas" },
  { valor: "rejeitada", rotulo: "Rejeitadas" },
];
const POR_PAGINA = 20;
const FUNDO = "/img/fundo-mapa.svg";

type Contagens = { pendente: number; aprovada: number; rejeitada: number; maisAntigo: string | null };

export default function Administrador() {
  const [logado, setLogado] = useState<boolean | null>(null);

  useEffect(() => { chamarApi("/api/moderacao/eu").then((r) => setLogado(r.corpo.moderador === true)); }, []);

  if (logado === null) return <main className="p-10 text-center">Carregando…</main>;
  if (!logado) return <Entrar aoEntrar={() => setLogado(true)} />;
  return <Fila aoSair={() => setLogado(false)} />;
}

/* ───────────────────────────── Entrar ───────────────────────────── */

function Entrar({ aoEntrar }: { aoEntrar: () => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  const [msg, setMsg] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true); setMsg("");
    const { status, corpo } = await chamarApi("/api/moderacao/entrar", { method: "POST", body: JSON.stringify({ email, senha }) });
    setEnviando(false);
    if (status === 200) { setSenha(""); aoEntrar(); }
    // 401 credenciais erradas; 403 não é moderador; 403 origem_invalida ao testar em localhost
    else setMsg(String(corpo.mensagem ?? "Não foi possível entrar."));
  }

  return (
    <main className="flex min-h-screen flex-col bg-fundo">
      <HeroInterno titulo="Área do administrador." altura={320} fundo={FUNDO} tituloClass="max-w-[760px] sm:text-[44px] lg:text-[52px]" />
      <div className="relative z-10 mx-auto -mt-[64px] w-full max-w-[424px] px-3 pb-16 sm:px-0">
        <form onSubmit={enviar} className="rounded-[28px] bg-white p-6 shadow-[0_10px_30px_rgba(2,42,103,0.12)]">
          <h2 className="text-[24px] font-bold text-marinho">Entrar</h2>
          <p className="mt-1 max-w-[260px] text-[12.5px] leading-snug text-[#5b6b8c]">Acesso restrito à equipe de moderação do Desafio Unifacisa.</p>

          <label className="mt-4 block text-[10.5px] font-bold uppercase text-marinho" htmlFor="adm-email">E-mail</label>
          <input id="adm-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-[46px] w-full rounded-[14px] border-2 border-[#c9d3e6] bg-white px-4 text-[14px] text-marinho outline-none transition-colors focus:border-azul" />

          <label className="mt-4 block text-[10.5px] font-bold uppercase text-marinho" htmlFor="adm-senha">Senha</label>
          <div className="relative mt-1.5">
            <input id="adm-senha" type={ver ? "text" : "password"} autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)}
              className="h-[46px] w-full rounded-[14px] border-2 border-[#c9d3e6] bg-white pl-4 pr-12 text-[14px] text-marinho outline-none transition-colors focus:border-azul" />
            <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar senha" : "Mostrar senha"} aria-pressed={ver}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#5b6b8c] hover:text-marinho">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {ver ? (<><path d="M3 3l18 18" /><path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c5 0 8.5 4.2 9.5 6-.4.7-1.2 1.8-2.4 2.9M6.4 7.4C4.2 8.9 2.9 11 2.5 12c1 1.8 4.5 6 9.5 6 1.4 0 2.6-.3 3.7-.8" /><path d="M9.9 10a3 3 0 0 0 4.1 4.1" /></>) : (<><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="3" /></>)}
              </svg>
            </button>
          </div>

          {msg && <p role="alert" className="mt-4 rounded-[12px] bg-[#fde8e6] px-3 py-2.5 text-[11.5px] font-bold text-[#b42318]">{msg}</p>}
          <button disabled={enviando} className="botao-anim mt-4 h-[46px] w-full rounded-full bg-azul text-[14px] font-bold text-white disabled:opacity-60">{enviando ? "Entrando…" : "Entrar"}</button>
        </form>
      </div>
      <RodapeBarra />
    </main>
  );
}

/* ─────────────────────── Fila de moderação ─────────────────────── */

function Fila({ aoSair }: { aoSair: () => void }) {
  const [situacao, setSituacao] = useState<Situacao>("pendente");
  const [pagina, setPagina] = useState(1);
  const [itens, setItens] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [contagens, setContagens] = useState<Contagens | null>(null);
  const [listas, setListas] = useState<Listas | null>(null);
  const [msg, setMsg] = useState("");
  const [carregando, setCarregando] = useState(true);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const carregarContagens = useCallback(async () => {
    // Uma consulta por situação, só para o total (porPagina=1). Os pendentes vêm do mais antigo ao mais novo.
    const [p, a, r] = await Promise.all((["pendente", "aprovada", "rejeitada"] as const).map((s) => chamarApi(`/api/moderacao/fila?status=${s}&pagina=1&porPagina=1`)));
    if (p.status !== 200) return;
    const pend = (p.corpo.itens as Item[] | undefined) ?? [];
    setContagens({ pendente: Number(p.corpo.total ?? 0), aprovada: Number(a.corpo.total ?? 0), rejeitada: Number(r.corpo.total ?? 0), maisAntigo: pend[0]?.enviado_em ?? null });
  }, []);

  const carregar = useCallback(async (s: Situacao, pg: number) => {
    setCarregando(true);
    const { status, corpo } = await chamarApi(`/api/moderacao/fila?status=${s}&pagina=${pg}&porPagina=${POR_PAGINA}`);
    if (status === 200) { setItens(corpo.itens as Item[]); setTotal(Number(corpo.total)); setMsg(""); }
    else setMsg(String(corpo.mensagem ?? "Não foi possível carregar a fila."));
    setCarregando(false);
  }, []);

  // Se as listas de apoio falharem, a fila continua funcionando (ids no lugar dos nomes).
  useEffect(() => { carregarListas().then(setListas).catch(() => setListas({ areas: [], publicos: [], tipos: [], municipios: [], naturezas: [] })); }, []);
  useEffect(() => { carregarContagens(); }, [carregarContagens]);
  useEffect(() => { carregar(situacao, pagina); }, [situacao, pagina, carregar]);

  async function sair() { await chamarApi("/api/moderacao/sair", { method: "POST" }); aoSair(); }
  const trocar = (s: Situacao) => { setSituacao(s); setPagina(1); };

  /** Aprovar ou rejeitar. Devolve a mensagem de erro (para mostrar no cartão) ou null se deu certo. */
  async function decidir(id: number, acao: "aprovar" | "rejeitar", motivo = "") {
    // Rejeitar exige motivo (422 se vazio); aprovar devolve 409 se já foi decidida.
    const init = acao === "rejeitar" ? { method: "POST", body: JSON.stringify({ motivo }) } : { method: "POST" };
    const { status, corpo } = await chamarApi(`/api/moderacao/fila/${id}/${acao}`, init);
    if (status === 200) { await Promise.all([carregar(situacao, pagina), carregarContagens()]); return null; }
    return String(corpo.mensagem ?? "Não foi possível concluir.");
  }

  const antigo = contagens?.maisAntigo;
  return (
    <main className="flex min-h-screen flex-col bg-fundo">
      <HeroInterno titulo="Fila de moderação." altura={400} fundo={FUNDO} tituloClass="max-w-[760px] sm:text-[44px] lg:text-[52px]">
        <p className="mt-3 max-w-[520px] text-[14px] leading-snug text-white/90 sm:text-[15px]">Confira cada envio antes de publicar. Um cadastro só aparece na busca depois de aprovado.</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 pb-[96px]">
          <div>
            <p className="text-[10px] font-bold uppercase text-white/85">Situação</p>
            <div className="mt-2 flex flex-wrap gap-3" role="group" aria-label="Situação dos envios">
              {SITUACOES.map((s) => (
                <button key={s.valor} onClick={() => trocar(s.valor)} aria-pressed={situacao === s.valor}
                  className={`botao-anim h-[44px] rounded-full border-2 px-6 text-[13px] font-bold ${situacao === s.valor ? "border-white bg-white text-marinho" : "border-white/80 text-white"}`}>{s.rotulo}</button>
              ))}
            </div>
          </div>
          <button onClick={sair} className="botao-anim h-[44px] rounded-full bg-marinho px-8 text-[13px] font-bold text-white">Sair</button>
        </div>
      </HeroInterno>

      <div className="relative z-10 mx-auto -mt-[68px] w-full max-w-[1280px] space-y-4 px-3 pb-12 sm:px-4 lg:px-[34px]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Pendentes", contagens?.pendente ?? "—", "Aguardando a sua análise", false],
            ["Aprovadas", contagens?.aprovada ?? "—", "Já aplicadas ao cadastro", false],
            ["Rejeitadas", contagens?.rejeitada ?? "—", "Devolvidas com motivo", false],
            ["Mais antigo na fila", antigo ? idadeDoEnvio(antigo) : "—", antigo ? `Enviado em ${new Date(antigo).toLocaleDateString("pt-BR")}` : "Nenhum envio pendente", true],
          ].map(([t, v, s, escuro]) => (
            <div key={String(t)} className={`cartao-anim rounded-[20px] p-5 ${escuro ? "bg-marinho text-white" : "bg-white text-marinho"}`}>
              <p className="text-[9.5px] font-bold uppercase tracking-wide">{t}</p>
              <p className="mt-1 text-[40px] font-bold leading-none">{v}</p>
              <p className="mt-2 text-[10.5px] opacity-75">{s}</p>
            </div>
          ))}
        </div>

        {msg && <p className="rounded-2xl bg-white p-3 text-sm font-semibold text-red-600" role="alert">{msg}</p>}
        {!carregando && itens.length === 0 && !msg && (
          <p className="rounded-[24px] bg-white p-6 text-center text-[14px] text-marinho">Nenhum envio {situacao === "pendente" ? "pendente" : situacao === "aprovada" ? "aprovado" : "rejeitado"} por aqui.</p>
        )}

        {listas && itens.map((it) => <Envio key={it.id} item={it} listas={listas} aoDecidir={decidir} />)}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-white px-5 py-4">
          <p className="text-[12px] font-bold text-marinho">{total} {total === 1 ? "envio" : "envios"} {situacao === "pendente" ? (total === 1 ? "pendente" : "pendentes") : situacao === "aprovada" ? (total === 1 ? "aprovado" : "aprovados") : (total === 1 ? "rejeitado" : "rejeitados")} · página {pagina} de {totalPaginas}</p>
          <div className="flex gap-3">
            <button disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} className="botao-anim h-[42px] rounded-full border-2 border-[#d5dcec] px-6 text-[13px] font-bold text-marinho disabled:opacity-40">Anterior</button>
            <button disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)} className="botao-anim h-[42px] rounded-full border-2 border-[#d5dcec] px-6 text-[13px] font-bold text-marinho disabled:opacity-40">Próxima</button>
          </div>
        </div>
      </div>
      <RodapeBarra />
    </main>
  );
}

/* ─────────────────────── Cartão de um envio ─────────────────────── */

const selo = "rounded-full px-3 py-1 text-[10.5px] font-bold";

function Envio({ item, listas, aoDecidir }: { item: Item; listas: Listas; aoDecidir: (id: number, acao: "aprovar" | "rejeitar", motivo?: string) => Promise<string | null> }) {
  const [motivo, setMotivo] = useState("");
  const [erroMotivo, setErroMotivo] = useState(false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [todos, setTodos] = useState(false);
  const [atuais, setAtuais] = useState<ListasAtuais | null>(null);

  // Nas edições, as listas atuais (áreas, públicos, parcerias) vêm da view pública da própria organização.
  useEffect(() => {
    if (item.tipo !== "edicao" || !item.organizacao_id) return;
    supabase().from("v_organizacoes_publicas").select("areas, publicos, tipos_parceria").eq("id", item.organizacao_id).maybeSingle()
      .then(({ data }) => setAtuais((data as ListasAtuais | null) ?? { areas: [], publicos: [], tipos_parceria: [] }));
  }, [item.tipo, item.organizacao_id]);

  const novo = useMemo(() => (item.tipo === "criacao" ? resumoNovo(item, listas) : null), [item, listas]);
  const linhas = useMemo(() => (item.tipo === "edicao" ? compararCampos(item, listas, atuais) : []), [item, listas, atuais]);
  const mudadas = linhas.filter((l) => l.mudou);
  const iguais = linhas.filter((l) => !l.mudou && (l.atual || l.proposta));
  const nome = novo?.nome ?? String(item.dados.razao_social ?? item.dados.nome_fantasia ?? item.atual?.["nome_fantasia"] ?? item.atual?.["razao_social"] ?? item.cnpj);
  const pendente = item.status === "pendente";

  async function agir(acao: "aprovar" | "rejeitar") {
    if (acao === "rejeitar" && !motivo.trim()) { setErroMotivo(true); return; }
    setOcupado(true); setErro("");
    const resposta = await aoDecidir(item.id, acao, motivo.trim());
    if (resposta) setErro(resposta);
    setOcupado(false);
  }

  return (
    <article className="rounded-[26px] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[19px] font-bold leading-tight text-marinho">{nome}</h2>
          <p className="mt-1 text-[11px] text-[#5b6b8c]">CNPJ {item.cnpj} · enviado em {formatarDataHora(item.enviado_em)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {novo?.revisarNatureza && <span className={`${selo} bg-[#fdf0cc] text-[#8a5a00]`}>Conferir natureza jurídica</span>}
          {item.tipo === "edicao"
            ? <span className={`${selo} bg-[#e9e7ff] text-[#4a3fb8]`}>Edição · {mudadas.length} {mudadas.length === 1 ? "campo alterado" : "campos alterados"}</span>
            : <span className={`${selo} bg-[#e4ecff] text-azul`}>Novo cadastro</span>}
        </div>
      </div>
      {item.contato_remetente && <p className="mt-3 text-[11.5px] text-marinho"><b>Enviado por:</b> {item.contato_remetente}</p>}

      {item.tipo === "edicao" ? (
        <>
          {/* Ficha atual ao lado da proposta (nas edições) */}
          <div className="mt-4 overflow-x-auto rounded-[16px] border border-[#e3e8f4]">
            <table className="w-full min-w-[560px] text-left text-[12px] text-marinho">
              <thead><tr className="text-[9.5px] font-bold uppercase text-[#5b6b8c]"><th className="px-4 py-3 w-[18%]">Campo</th><th className="px-4 py-3 w-[38%]">Ficha atual</th><th className="px-4 py-3">Proposta</th></tr></thead>
              <tbody>
                {(todos ? [...mudadas, ...iguais] : mudadas).map((l) => (
                  <tr key={l.campo} className="border-t border-[#e3e8f4]">
                    <th className="px-4 py-3 font-bold">{l.campo}</th>
                    <td className={`px-4 py-3 ${l.mudou ? "text-[#6b7894] line-through" : "text-[#6b7894]"}`}>{l.atual || "(vazio)"}</td>
                    <td className={`px-4 py-3 ${l.mudou ? "bg-[#eef3ff] font-bold" : ""}`}>{l.proposta || "(vazio)"}</td>
                  </tr>
                ))}
                {mudadas.length === 0 && !todos && <tr><td colSpan={3} className="px-4 py-4 text-[#5b6b8c]">Nenhum campo com alteração em relação à ficha atual.</td></tr>}
              </tbody>
            </table>
          </div>
          {iguais.length > 0 && (
            <button type="button" onClick={() => setTodos((v) => !v)} className="mt-3 text-[12px] font-bold text-azul underline">
              {todos ? "Ocultar os campos sem alteração" : `Mostrar ${iguais.length === 1 ? "o 1 campo" : `os ${iguais.length} campos`} sem alteração`}
            </button>
          )}
        </>
      ) : novo && (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {([["Instituição", novo.instituicao], ["Localização", novo.localizacao], ["Contato", novo.contato]] as const).map(([t, linhasBox]) => (
              <div key={t} className="rounded-[14px] bg-[#f4f6fb] p-4 text-[12px] leading-relaxed text-marinho">
                <p className="mb-1 text-[9.5px] font-bold uppercase">{t}</p>
                {linhasBox.length ? linhasBox.map((l) => <p key={l}>{l}</p>) : <p className="text-[#6b7894]">(não informado)</p>}
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Chips titulo="Áreas de atuação" itens={novo.areas} />
            <Chips titulo="Públicos atendidos" itens={novo.publicos} />
            <div><p className="mb-1.5 text-[9.5px] font-bold uppercase text-marinho">Demandas</p><p className="text-[12px] leading-snug text-marinho">{novo.demandas || "(vazio)"}</p></div>
          </div>
        </>
      )}

      {item.status === "rejeitada" && <p className="mt-4 text-[12.5px] text-[#b42318]"><b>Motivo:</b> {item.motivo_rejeicao}</p>}
      {erro && <p role="alert" className="mt-4 text-[12px] font-bold text-[#b42318]">{erro}</p>}

      {pendente && (
        <div className="mt-5 flex flex-col gap-4 border-t border-[#e3e8f4] pt-5 sm:flex-row sm:items-end sm:justify-between">
          <button disabled={ocupado} onClick={() => agir("aprovar")} className="botao-anim h-[44px] rounded-full bg-azul px-9 text-[14px] font-bold text-white disabled:opacity-60 sm:self-end">Aprovar</button>
          <div className="w-full sm:max-w-[540px]">
            <label htmlFor={`motivo-${item.id}`} className="text-[10px] font-bold uppercase text-marinho">Motivo da rejeição (obrigatório para rejeitar)</label>
            <div className="mt-1.5 flex gap-3">
              <input id={`motivo-${item.id}`} value={motivo} onChange={(e) => { setMotivo(e.target.value); setErroMotivo(false); }} placeholder="Ex.: endereço não confere com o CNPJ"
                aria-invalid={erroMotivo} className={`h-[44px] min-w-0 flex-1 rounded-[14px] border-2 bg-white px-4 text-[13px] text-marinho outline-none ${erroMotivo ? "border-[#d92d20]" : "border-[#c9d3e6] focus:border-azul"}`} />
              <button disabled={ocupado} onClick={() => agir("rejeitar")} className="botao-anim h-[44px] rounded-full bg-marinho px-7 text-[14px] font-bold text-white disabled:opacity-60">Rejeitar</button>
            </div>
            {erroMotivo && <p role="alert" className="mt-1.5 text-[11px] font-bold text-[#b42318]">Informe o motivo para rejeitar.</p>}
          </div>
        </div>
      )}
    </article>
  );
}

function Chips({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-[9.5px] font-bold uppercase text-marinho">{titulo}</p>
      <div className="flex flex-wrap gap-2">
        {itens.length ? itens.map((i) => <span key={i} className="rounded-full bg-[#e9e7ff] px-3 py-1 text-[11px] font-bold text-[#4a3fb8]">{i}</span>) : <span className="text-[12px] text-[#6b7894]">(vazio)</span>}
      </div>
    </div>
  );
}

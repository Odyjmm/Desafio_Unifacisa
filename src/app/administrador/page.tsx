"use client";
// Tela "Administrador" (moderação). Guia, seção 6: sessão por cookie httpOnly,
// sempre chamando rotas do MESMO domínio (por isso só funciona de verdade no site publicado).
import { useCallback, useEffect, useState } from "react";
import { chamarApi } from "@/lib/api";
import HeroInterno from "@/components/HeroInterno";
import RodapeBarra from "@/components/RodapeBarra";

type Item = {
  id: number; tipo: "criacao" | "edicao"; cnpj: string; status: string; enviado_em: string; motivo_rejeicao: string | null;
  dados: Record<string, unknown>; atual: Record<string, unknown> | null; contato_remetente?: Record<string, unknown> | null;
};

export default function Administrador() {
  const [logado, setLogado] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState<"pendente" | "aprovada" | "rejeitada">("pendente");
  const [itens, setItens] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [motivo, setMotivo] = useState<Record<number, string>>({});

  const carregar = useCallback(async (s: string) => {
    const { status: st, corpo } = await chamarApi(`/api/moderacao/fila?status=${s}&pagina=1&porPagina=20`);
    if (st === 200) { setItens(corpo.itens as Item[]); setTotal(Number(corpo.total)); setMsg(""); }
    else setMsg(String(corpo.mensagem ?? "Não foi possível carregar a fila."));
  }, []);

  useEffect(() => { chamarApi("/api/moderacao/eu").then((r) => setLogado(r.corpo.moderador === true)); }, []);
  useEffect(() => { if (logado) carregar(status); }, [logado, status, carregar]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    const { status: st, corpo } = await chamarApi("/api/moderacao/entrar", { method: "POST", body: JSON.stringify({ email, senha }) });
    if (st === 200) { setSenha(""); setLogado(true); setMsg(""); }
    else setMsg(String(corpo.mensagem ?? "Não foi possível entrar.")); // 401 credenciais, 403 não é moderador, 403 origem_invalida em localhost
  }
  async function sair() { await chamarApi("/api/moderacao/sair", { method: "POST" }); setLogado(false); setItens([]); }
  async function decidir(id: number, acao: "aprovar" | "rejeitar") {
    // Rejeitar exige motivo (422 se vazio); aprovar devolve 409 se já foi decidida.
    const init = acao === "rejeitar" ? { method: "POST", body: JSON.stringify({ motivo: motivo[id] ?? "" }) } : { method: "POST" };
    const { status: st, corpo } = await chamarApi(`/api/moderacao/fila/${id}/${acao}`, init);
    if (st === 200) carregar(status); else setMsg(String(corpo.mensagem ?? "Não foi possível concluir."));
  }

  if (logado === null) return <main className="p-10 text-center">Carregando…</main>;

  if (!logado) return (
    <main className="bg-fundo">
      <HeroInterno titulo={<>Área do administrador</>} altura={300} />
      <div className="mx-auto -mt-16 max-w-md px-4 pb-16">
      <form onSubmit={entrar} className="cartao space-y-4">
        <h1 className="text-2xl font-black text-marinho">Administrador</h1>
        <div><label className="rotulo" htmlFor="e">E-mail</label><input id="e" type="email" className="campo" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><label className="rotulo" htmlFor="s">Senha</label><input id="s" type="password" className="campo" value={senha} onChange={(e) => setSenha(e.target.value)} required /></div>
        {msg && <p className="erro-campo" role="alert">{msg}</p>}
        <button className="btn w-full">Entrar</button>
      </form>
      </div>
      <RodapeBarra />
    </main>
  );

  return (
    <main className="bg-fundo">
      <HeroInterno titulo={<>Fila de moderação</>} altura={300} />
      <div className="mx-auto -mt-16 max-w-5xl px-4 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[22px] bg-white p-4">
        <p className="text-lg font-black text-marinho">Envios para análise</p>
        <button className="btn btn-claro" onClick={sair}>Sair</button>
      </div>
      <div className="mt-4 flex gap-2">
        {(["pendente", "aprovada", "rejeitada"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${status === s ? "bg-azul text-white" : "bg-white text-marinho"}`}>{s}s</button>
        ))}
      </div>
      <p className="mt-3 text-sm">{total} envio(s) {status}(s).</p>
      {msg && <p className="erro-campo" role="alert">{msg}</p>}
      <ul className="mt-4 space-y-4">
        {itens.map((it) => (
          <li key={it.id} className="cartao">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-extrabold text-marinho">{String(it.dados.razaoSocial ?? it.dados.nomeFantasia ?? it.cnpj)}</p>
              <span className="rounded bg-fundo px-2 py-0.5 text-xs font-bold text-azul">{it.tipo === "edicao" ? "Edição" : "Novo cadastro"}</span>
            </div>
            <p className="text-xs text-marinho/70">CNPJ {it.cnpj} · enviado em {new Date(it.enviado_em).toLocaleString("pt-BR")}</p>
            {/* Nas edições, mostra a ficha atual ao lado da proposta para comparação */}
            <div className={`mt-3 grid gap-3 ${it.atual ? "md:grid-cols-2" : ""}`}>
              {it.atual && <div><p className="rotulo">Ficha atual</p><pre className="max-h-64 overflow-auto rounded-xl bg-fundo p-3 text-[11px]">{JSON.stringify(it.atual, null, 2)}</pre></div>}
              <div><p className="rotulo">{it.atual ? "Proposta" : "Dados enviados"}</p><pre className="max-h-64 overflow-auto rounded-xl bg-fundo p-3 text-[11px]">{JSON.stringify(it.dados, null, 2)}</pre></div>
            </div>
            {it.status === "rejeitada" && <p className="mt-2 text-sm text-red-700">Motivo: {it.motivo_rejeicao}</p>}
            {it.status === "pendente" && (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <button className="btn" onClick={() => decidir(it.id, "aprovar")}>Aprovar</button>
                <input className="campo !w-64" placeholder="Motivo da rejeição" value={motivo[it.id] ?? ""} onChange={(e) => setMotivo({ ...motivo, [it.id]: e.target.value })} />
                <button className="btn btn-escuro" onClick={() => decidir(it.id, "rejeitar")}>Rejeitar</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      </div>
      <RodapeBarra />
    </main>
  );
}

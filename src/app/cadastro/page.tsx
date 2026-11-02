"use client";
// Tela "Cadastro" em 3 etapas (Guia do backend, seção 5). O navegador nunca grava no banco:
// o envio final vai para a fila de moderação via POST /api/cadastro.
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { carregarListas, chamarApi, formatarCnpj, type Opcao } from "@/lib/api";
import Turnstile from "@/components/Turnstile";
import HeroInterno from "@/components/HeroInterno";
import RodapeBarra from "@/components/RodapeBarra";

const MapaPino = dynamic(() => import("@/components/MapaPino"), { ssr: false, loading: () => <div className="h-[260px] animate-pulse rounded-[20px] bg-[#e4ebfb]" /> });

type Form = {
  cnpj: string; razaoSocial: string; nomeFantasia: string; naturezaJuridicaId: string;
  responsavel: string; cargoResponsavel: string; email: string; telefone: string;
  site: string; instagram: string; facebook: string;
  cep: string; municipioId: string; bairro: string; logradouro: string; numero: string; complemento: string;
  latitude: number | null; longitude: number | null;
  areaIds: number[]; publicoIds: number[]; tiposParceriaIds: number[]; demandas: string; aceiteDeclaracao: boolean;
};
const VAZIO: Form = {
  cnpj: "", razaoSocial: "", nomeFantasia: "", naturezaJuridicaId: "", responsavel: "", cargoResponsavel: "", email: "", telefone: "",
  site: "", instagram: "", facebook: "", cep: "", municipioId: "", bairro: "", logradouro: "", numero: "", complemento: "",
  latitude: null, longitude: null, areaIds: [], publicoIds: [], tiposParceriaIds: [], demandas: "", aceiteDeclaracao: false,
};
const RASCUNHO = "desafio-unifacisa:rascunho-cadastro";
const CAMPINA: [number, number] = [-7.2307, -35.8811];
const entrada = "h-[54px] w-full rounded-[14px] border border-[#dfe5f1] bg-white px-4 text-[13px] text-marinho outline-none placeholder:text-[#8a97b3] focus:border-azul";
const NOMES_ETAPA = ["Dados da instituição", "Localização", "Perfil de atuação"];

export default function Cadastro() {
  const [etapa, setEtapa] = useState(1);
  const [f, setF] = useState<Form>(VAZIO);
  const [listas, setListas] = useState<Awaited<ReturnType<typeof carregarListas>> | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string }[]>([]);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [token, setToken] = useState("");
  const [modo, setModo] = useState<"criacao" | "edicao" | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((a) => ({ ...a, [k]: v }));

  useEffect(() => {
    carregarListas().then(setListas);
    // "Salvar rascunho": só no navegador (localStorage), sem banco.
    try { const r = localStorage.getItem(RASCUNHO); if (r) setF({ ...VAZIO, ...JSON.parse(r) }); } catch {}
  }, []);
  const salvarRascunho = () => { try { localStorage.setItem(RASCUNHO, JSON.stringify(f)); setAviso([{ tipo: "ok", texto: "Rascunho salvo neste navegador." }]); } catch { setAviso([{ tipo: "erro", texto: "Não foi possível salvar o rascunho." }]); } };

  /** Etapa 1: consulta o CNPJ e pré-preenche (criação) ou carrega a ficha atual (edição). */
  async function consultarCnpj() {
    setOcupado(true); setAviso([]); setModo(null);
    const limpo = f.cnpj.replace(/[^0-9A-Za-z]/g, "");
    const { corpo } = await chamarApi(`/api/cnpj/${encodeURIComponent(limpo)}`);
    setOcupado(false);
    const d = (corpo.dados ?? {}) as Record<string, string & number & null & string[] & number[]>; // campos variam entre criação e edição
    if (corpo.codigo === "criacao") {
      setModo("criacao");
      setF((a) => ({ ...a, cnpj: formatarCnpj(d.cnpj), razaoSocial: d.razaoSocial ?? "", nomeFantasia: d.nomeFantasia ?? "",
        naturezaJuridicaId: d.naturezaJuridicaId ? String(d.naturezaJuridicaId) : "", municipioId: d.municipioId ? String(d.municipioId) : "",
        cep: d.cep ?? "", logradouro: d.logradouro ?? "", numero: d.numero ?? "", complemento: d.complemento ?? "", bairro: d.bairroSugerido ?? "",
        telefone: d.telefone ?? "", email: d.email ?? "" }));
      setAviso([{ tipo: "ok", texto: String(corpo.mensagem) }, ...((corpo.avisos as string[]) ?? []).map((t) => ({ tipo: "erro" as const, texto: t }))]);
    } else if (corpo.codigo === "edicao") {
      setModo("edicao");
      setF((a) => ({ ...a, cnpj: formatarCnpj(d.cnpj), razaoSocial: d.razao_social ?? "", nomeFantasia: d.nome_fantasia ?? "",
        naturezaJuridicaId: d.natureza_juridica_id ? String(d.natureza_juridica_id) : "", municipioId: d.municipio_id ? String(d.municipio_id) : "",
        cep: d.cep ?? "", bairro: d.bairro ?? "", logradouro: d.endereco_completo ?? "", latitude: d.latitude ?? null, longitude: d.longitude ?? null,
        telefone: d.telefone_1 ?? "", email: d.email ?? "", site: d.site_url ?? "", instagram: d.instagram ?? "", facebook: d.facebook ?? "",
        demandas: d.demandas ?? "", areaIds: d.area_ids ?? [], publicoIds: d.publico_ids ?? [], tiposParceriaIds: d.tipo_parceria_ids ?? [] }));
      setAviso([{ tipo: "ok", texto: String(corpo.mensagem) }]);
    } else {
      // cnpj_invalido, inativo, natureza_nao_aceita, filial, raiz_cadastrada, nao_encontrado, limite...: a API já manda a mensagem pronta.
      if (corpo.codigo === "consulta_indisponivel") setModo("criacao"); // permite preencher manualmente
      setAviso([{ tipo: "erro", texto: String(corpo.mensagem ?? "Erro ao consultar o CNPJ.") }]);
    }
  }

  /** Etapa 2: busca coordenadas do endereço no Nominatim (OpenStreetMap) para posicionar o pino. */
  async function localizar() {
    const mun = listas?.municipios.find((m) => String(m.id) === f.municipioId)?.nome ?? "Campina Grande";
    const q = [f.logradouro, f.numero, f.bairro, mun, "Paraíba", "Brasil"].filter(Boolean).join(", ");
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
      const [p] = await r.json();
      if (p) { set("latitude", Number(p.lat)); set("longitude", Number(p.lon)); }
      else setAviso([{ tipo: "erro", texto: "Endereço não encontrado no mapa. Arraste o pino manualmente." }]);
    } catch { setAviso([{ tipo: "erro", texto: "Não foi possível localizar agora. Arraste o pino manualmente." }]); }
  }
  const moverPino = useCallback((lat: number, lng: number) => setF((a) => ({ ...a, latitude: lat, longitude: lng })), []);
  /** Botão "Usar minha localização": pede a posição ao navegador e move o pino. */
  const usarMinhaLocalizacao = () => navigator.geolocation?.getCurrentPosition(
    (p) => moverPino(p.coords.latitude, p.coords.longitude),
    () => setAviso([{ tipo: "erro", texto: "Não foi possível obter sua localização. Arraste o pino manualmente." }]));

  /** Envio final. Campo ausente = não alterar; texto/lista vazia = apagar (Guia, seção 5). */
  async function enviar() {
    setOcupado(true); setErros({}); setAviso([]);
    const links = [f.site, f.instagram, f.facebook].map((s) => s.trim()).filter(Boolean);
    const corpo: Record<string, unknown> = {
      cnpj: f.cnpj, responsavel: f.responsavel, cargoResponsavel: f.cargoResponsavel, email: f.email, telefone: f.telefone,
      cep: f.cep, municipioId: Number(f.municipioId), bairro: f.bairro, logradouro: f.logradouro, numero: f.numero, complemento: f.complemento,
      areaIds: f.areaIds, publicoIds: f.publicoIds, tiposParceriaIds: f.tiposParceriaIds, demandas: f.demandas, links,
      nomeFantasia: f.nomeFantasia, aceiteDeclaracao: f.aceiteDeclaracao, turnstileToken: token || undefined,
    };
    if (f.razaoSocial) corpo.razaoSocial = f.razaoSocial;
    if (f.naturezaJuridicaId) corpo.naturezaJuridicaId = Number(f.naturezaJuridicaId);
    if (f.latitude !== null && f.longitude !== null) { corpo.latitude = f.latitude; corpo.longitude = f.longitude; } // sempre juntas
    const { status, corpo: r } = await chamarApi("/api/cadastro", { method: "POST", body: JSON.stringify(corpo) });
    setOcupado(false);
    if (status === 200 && r.codigo === "enviado") { try { localStorage.removeItem(RASCUNHO); } catch {} setEnviado(true); return; }
    if (r.codigo === "dados_invalidos" && r.erros) {
      // Mostra cada mensagem ao lado do campo e volta à etapa do primeiro erro.
      const m: Record<string, string> = {}; r.erros.forEach((e) => (m[e.campo] = e.mensagem)); setErros(m);
      const etapa1 = ["cnpj", "responsavel", "cargoResponsavel", "email", "telefone", "links"], etapa2 = ["cep", "municipioId", "bairro", "logradouro", "latitude"];
      const c = r.erros[0].campo; setEtapa(etapa1.includes(c) ? 1 : etapa2.includes(c) ? 2 : 3);
    }
    // captcha, ja_em_analise, raiz_cadastrada, limite, consulta_indisponivel: mensagem pronta da API.
    setAviso([{ tipo: "erro", texto: String(r.mensagem ?? "Revise os campos destacados.") }]);
  }

  const alternar = (k: "areaIds" | "publicoIds" | "tiposParceriaIds", id: number) =>
    set(k, f[k].includes(id) ? f[k].filter((x) => x !== id) : [...f[k], id]);
  const erro = (c: string) => (erros[c] ? <p className="mt-1 text-[11px] font-semibold text-red-600">{erros[c]}</p> : null);
  const rotulo = (t: string) => <span className="mb-1.5 block text-[11px] font-bold text-marinho">{t}</span>;
  const caixas = (k: "areaIds" | "publicoIds" | "tiposParceriaIds", opcoes: Opcao[]) => (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <label key={o.id} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${f[k].includes(o.id) ? "border-azul bg-azul text-white" : "border-[#dfe5f1] bg-white text-marinho"}`}>
          <input type="checkbox" className="sr-only" checked={f[k].includes(o.id)} onChange={() => alternar(k, o.id)} />{o.nome}
        </label>
      ))}
    </div>
  );

  if (enviado) return (
    <main className="bg-fundo">
      <HeroInterno titulo={<>Cadastro enviado para análise.</>} altura={380} />
      <div className="mx-auto -mt-24 max-w-xl px-4 pb-24"><div className="rounded-[28px] bg-white p-8 text-center shadow-[0_8px_30px_rgba(2,42,103,0.08)]">
        <h2 className="text-2xl font-black text-marinho">Obrigado!</h2>
        <p className="mt-2 text-sm">A equipe NUPEX vai validar os dados. Quando aprovado, sua organização aparece na busca.</p></div></div>
      <RodapeBarra />
    </main>
  );

  return (
    <main className="flex min-h-[1500px] flex-col bg-fundo">
      <HeroInterno titulo={<>Coloque sua<br />organização no<br />mapa das parcerias.</>} alvo altura={424} tituloClass="max-w-none md:text-[52px]" />
      <div className="relative z-10 mx-auto -mt-[60px] mb-12 grid w-full max-w-[1280px] gap-[25px] px-4 md:px-[24px] lg:grid-cols-[minmax(0,887px)_1fr]">
        <section className="relative rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(2,42,103,0.08)] md:p-[36px]">
          {/* Stepper */}
          <ol className="grid gap-[9px] sm:grid-cols-3">
            {NOMES_ETAPA.map((n, i) => {
              const ativa = etapa === i + 1, feita = etapa > i + 1;
              return (
                <li key={n} className={`flex h-[62px] items-center gap-3 rounded-[20px] px-4 ${ativa ? "bg-azul text-white" : "bg-[#eef1fa] text-marinho"}`}>
                  <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${ativa ? "bg-white text-azul" : feita ? "bg-azul text-white" : "bg-white text-marinho"}`}>{feita ? "✓" : i + 1}</span>
                  <span className="leading-tight"><span className="block text-[9px] font-semibold uppercase opacity-80">Etapa {i + 1}</span><span className="block text-[14px] font-bold">{n}</span></span>
                </li>
              );
            })}
          </ol>

          <h2 className="mt-8 text-[26px] font-bold text-marinho">{NOMES_ETAPA[etapa - 1]}</h2>
          <p className="text-[13px] text-[#5b6b8c]">
            {etapa === 1 && "Comece pelo CNPJ: buscamos razão social, natureza jurídica e situação cadastral nas bases públicas."}
            {etapa === 2 && "Onde a instituição atende. É esse endereço que aparece no mapa de busca."}
            {etapa === 3 && "Conte o que a instituição faz e quem ela atende. Isso alimenta os filtros da busca."}
          </p>
          {aviso.map((a, i) => <p key={i} role={a.tipo === "erro" ? "alert" : "status"} className={`mt-3 rounded-2xl p-3 text-[13px] ${a.tipo === "ok" ? "bg-[#eef1ff] text-marinho" : "bg-red-50 text-red-700"}`}>{a.texto}</p>)}

          <div className="mt-5 grid gap-x-4 gap-y-4 md:grid-cols-2">
            {etapa === 1 && (<>
              <div className="md:col-span-2"><label>{rotulo("CNPJ *")}
                <div className="flex gap-3"><input className={entrada} placeholder="00.000.000/0000-00" value={f.cnpj} onChange={(e) => set("cnpj", e.target.value)} />
                  <button type="button" className="h-[54px] shrink-0 rounded-[18px] bg-lavanda px-6 text-[13px] font-bold text-white disabled:opacity-50" disabled={ocupado || !f.cnpj} onClick={consultarCnpj}>{ocupado ? "Consultando…" : "Consultar CNPJ"}</button></div></label>{erro("cnpj")}</div>
              <div className="flex gap-3 rounded-[18px] bg-[#eef1ff] p-4 text-[12.5px] text-marinho md:col-span-2">
                <span aria-hidden className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-azul text-[10px] font-bold text-azul">i</span>
                <p>Aceitamos apenas CNPJ com situação <b>ativa</b>. Matriz e filiais são consolidadas em um único registro — cadastre a unidade que atua na região.</p></div>
              <>
                <label className="md:col-span-2">{rotulo("Razão social *")}<input className={entrada} placeholder="Como consta no CNPJ" value={f.razaoSocial} onChange={(e) => set("razaoSocial", e.target.value)} /></label>
                <label>{rotulo("Nome fantasia")}<input className={entrada} placeholder="Como a comunidade conhece" value={f.nomeFantasia} onChange={(e) => set("nomeFantasia", e.target.value)} /></label>
                <label>{rotulo("Natureza jurídica *")}<select className={entrada} value={f.naturezaJuridicaId} onChange={(e) => set("naturezaJuridicaId", e.target.value)}><option value="">Selecione</option>{listas?.naturezas.map((n) => <option key={n.id} value={n.id}>{n.descricao}</option>)}</select></label>
                <label>{rotulo("Responsável pelo cadastro *")}<input className={entrada} placeholder="Nome completo" value={f.responsavel} onChange={(e) => set("responsavel", e.target.value)} />{erro("responsavel")}</label>
                <label>{rotulo("Cargo na instituição *")}<input className={entrada} placeholder="Ex.: presidente, coordenadora" value={f.cargoResponsavel} onChange={(e) => set("cargoResponsavel", e.target.value)} />{erro("cargoResponsavel")}</label>
                <label>{rotulo("E-mail institucional *")}<input type="email" className={entrada} placeholder="contato@instituicao.org" value={f.email} onChange={(e) => set("email", e.target.value)} />{erro("email")}</label>
                <label>{rotulo("Telefone / WhatsApp *")}<input className={entrada} placeholder="(83) 90000-0000" value={f.telefone} onChange={(e) => set("telefone", e.target.value)} />{erro("telefone")}</label>
                <label className="md:col-span-2">{rotulo("Site ou redes sociais")}<input className={entrada} placeholder="instagram.com/suainstituicao" value={f.instagram} onChange={(e) => set("instagram", e.target.value)} /></label>
              </>
            </>)}

            {etapa === 2 && (<>
              <label>{rotulo("CEP *")}<input className={entrada} placeholder="58400-000" value={f.cep} onChange={(e) => set("cep", e.target.value)} />{erro("cep")}</label>
              <label>{rotulo("Município *")}<select className={entrada} value={f.municipioId} onChange={(e) => set("municipioId", e.target.value)}><option value="">Selecione um município da RMCG</option>{listas?.municipios.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select>{erro("municipioId")}</label>
              <label>{rotulo("Bairro *")}<input className={entrada} placeholder="Bairro ou comunidade" value={f.bairro} onChange={(e) => set("bairro", e.target.value)} />{erro("bairro")}</label>
              <label>{rotulo("Logradouro *")}<input className={entrada} placeholder="Rua, avenida, sítio..." value={f.logradouro} onChange={(e) => set("logradouro", e.target.value)} />{erro("logradouro")}</label>
              <label>{rotulo("Número")}<input className={entrada} placeholder="S/N" value={f.numero} onChange={(e) => set("numero", e.target.value)} /></label>
              <label>{rotulo("Complemento / referência")}<input className={entrada} placeholder="Ex.: ao lado da escola municipal" value={f.complemento} onChange={(e) => set("complemento", e.target.value)} /></label>
              <div className="relative md:col-span-2">
                <MapaPino lat={f.latitude ?? CAMPINA[0]} lng={f.longitude ?? CAMPINA[1]} aoMover={moverPino} />
                <button type="button" onClick={localizar} className="absolute left-3 top-3 z-[500] rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-marinho shadow">Localizar endereço</button>
                <span className="absolute bottom-3 left-3 z-[500] rounded-full bg-white px-4 py-2 text-[12px] font-bold text-marinho shadow">Arraste o marcador até a porta da instituição</span>
                <button type="button" onClick={usarMinhaLocalizacao} className="absolute bottom-3 right-3 z-[500] rounded-[12px] bg-marinho px-4 py-2 text-[12px] font-bold text-white">Usar minha localização</button>
                {f.latitude !== null && <p className="mt-1 text-[11px] text-[#5b6b8c]">Latitude {f.latitude.toFixed(5)} · Longitude {f.longitude?.toFixed(5)}</p>}{erro("latitude")}
              </div>
            </>)}

            {etapa === 3 && (<div className="space-y-6 md:col-span-2">
              <div><p className="mb-2 text-[13px] font-bold text-marinho">Áreas de atuação * <span className="font-normal text-[#5b6b8c]">({f.areaIds.length} selecionadas)</span></p>{caixas("areaIds", listas?.areas ?? [])}{erro("areaIds")}</div>
              <div><p className="mb-2 text-[13px] font-bold text-marinho">Público atendido * <span className="font-normal text-[#5b6b8c]">({f.publicoIds.length} selecionados)</span></p>{caixas("publicoIds", listas?.publicos ?? [])}{erro("publicoIds")}</div>
              <div><p className="mb-2 text-[13px] font-bold text-marinho">Tipos de parceria</p>{caixas("tiposParceriaIds", listas?.tipos ?? [])}</div>
              <label className="block">{rotulo("Demandas da instituição")}<textarea className={`${entrada} h-auto py-3`} rows={4} maxLength={2000} placeholder="Descreva o que a instituição precisa" value={f.demandas} onChange={(e) => set("demandas", e.target.value)} /></label>
              <label className="flex items-start gap-3 text-[12.5px] text-marinho"><input type="checkbox" checked={f.aceiteDeclaracao} onChange={(e) => set("aceiteDeclaracao", e.target.checked)} className="mt-0.5" />
                <span>Declaro que as informações são verdadeiras e autorizo a divulgação dos dados públicos da instituição.</span></label>{erro("aceiteDeclaracao")}
              <Turnstile aoValidar={setToken} />
            </div>)}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e8edf7] pt-5">
            <div className="flex items-center gap-4">
              {etapa > 1 && <button type="button" className="h-[44px] rounded-full border border-[#dfe5f1] px-5 text-[13px] font-bold text-marinho" onClick={() => setEtapa(etapa - 1)}>Voltar</button>}
              <button type="button" className="text-[12.5px] font-bold text-azul underline" onClick={salvarRascunho}>Salvar rascunho</button>
            </div>
            {etapa < 3
              ? <button type="button" className="h-[46px] rounded-full bg-azul px-8 text-[14px] font-bold text-white disabled:opacity-50" disabled={!modo && etapa === 1} onClick={() => setEtapa(etapa + 1)}>Continuar →</button>
              : <button type="button" className="h-[46px] rounded-full bg-azul px-8 text-[14px] font-bold text-white disabled:opacity-50" disabled={ocupado} onClick={enviar}>{ocupado ? "Enviando…" : "Enviar para análise"}</button>}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[24px] bg-marinho p-6 text-white">
            <h3 className="text-[17px] font-bold">Depois do envio</h3>
            <ol className="mt-4 space-y-3 text-[12px]">
              {[["Validação", "Conferimos CNPJ ativo, natureza jurídica e endereço."], ["Publicação", "A ficha entra na base e aparece no mapa de busca."], ["Conexão", "Professores e turmas entram em contato com propostas."]].map(([t, d], i) => (
                <li key={t} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-azul text-[11px] font-bold">{i + 1}</span><span><b className="block text-[13px]">{t}</b>{d}</span></li>
              ))}
            </ol>
          </div>
          <div className="rounded-[24px] bg-white p-6 text-marinho shadow-[0_8px_30px_rgba(2,42,103,0.06)]">
            <h3 className="text-[15px] font-bold">Quem pode se cadastrar</h3>
            <ul className="mt-3 space-y-2 text-[12px]">
              {["ONGs e associações comunitárias", "Institutos e fundações privadas", "OSC, OSCIP e Organizações Sociais", "Coletivos e grupos de apoio", "Cooperativas sociais", "Entidades beneficentes"].map((t) => <li key={t} className="flex gap-2"><span className="text-azul">✓</span>{t}</li>)}
            </ul>
            <hr className="my-4 border-[#e8edf7]" />
            <p className="text-[12px] font-bold">Não entram na base</p>
            <p className="mt-1 text-[11.5px] text-[#5b6b8c]">Entidades de natureza comercial, associações de proteção veicular e associações patronais ou empresariais.</p>
          </div>
        </aside>
      </div>
      <RodapeBarra />
    </main>
  );
}

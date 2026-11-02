// Camada de acesso ao backend (Guia do backend, seções 4 a 7).
// O navegador NUNCA grava no banco: só lê via Supabase (chave pública) e envia à fila via /api.
import { clientePublico } from "@/lib/supabase/publico";

export type Opcao = { id: number; nome: string };

/** Filtros da busca (Guia, seção 4). Todos opcionais; usam ids. */
export type Filtros = {
  texto?: string;
  municipios?: number[];
  areas?: number[];
  publicos?: number[];
  tiposParceria?: number[];
};

export type Organizacao = {
  id: string; // UUID
  nome: string;
  cnpj: string | null;
  situacao_cadastral: string | null;
  municipio: string | null;
  bairro: string | null;
  endereco_completo: string | null;
  latitude: number | null;
  longitude: number | null;
  natureza_juridica: string | null;
  areas: string[] | null;
  publicos: string[] | null;
  tipos_parceria: string[] | null;
  demandas: string | null;
  telefone_1: string | null;
  email: string | null;
  site_url: string | null;
  instagram: string | null;
  facebook: string | null;
};

export type Marcador = { id: string; nome: string; latitude: number; longitude: number; municipio_id: number; area_ids: number[] };

let cliente: ReturnType<typeof clientePublico> | null = null;
export const supabase = () => (cliente ??= clientePublico());

/** Converte os filtros da tela nos parâmetros das funções RPC do Supabase. */
const paraRpc = (f: Filtros) => ({
  p_texto: f.texto?.trim() || null,
  p_municipio_ids: f.municipios?.length ? f.municipios : null,
  p_area_ids: f.areas?.length ? f.areas : null,
  p_publico_ids: f.publicos?.length ? f.publicos : null,
  p_tipo_parceria_ids: f.tiposParceria?.length ? f.tiposParceria : null,
});

export async function buscarOrganizacoes(f: Filtros, limite = 20, deslocamento = 0) {
  const { data, error } = await supabase().rpc("buscar_organizacoes", { ...paraRpc(f), p_limite: limite, p_deslocamento: deslocamento });
  if (error) throw error;
  return data as { total: number; itens: Organizacao[] };
}

export async function marcadoresMapa(f: Filtros) {
  const { data, error } = await supabase().rpc("marcadores_mapa", paraRpc(f));
  if (error) throw error;
  return (data ?? []) as Marcador[];
}

export type ResumoMunicipio = { municipio_id: number; municipio: string; latitude: number; longitude: number; total: number; sem_coordenadas: number };
/** Bolhas por município do mapa (mesmos filtros da lista). */
export async function resumoMunicipios(f: Filtros) {
  const { data, error } = await supabase().rpc("resumo_mapa_municipios", paraRpc(f));
  if (error) throw error;
  return (data ?? []) as ResumoMunicipio[];
}

export type Indicadores = {
  total_organizacoes: number; municipios_cobertos: number; municipios_total: number; sem_coordenadas: number;
  completude_media: number; completude_por_campo: { campo: string; percentual: number }[];
  por_municipio: { municipio: string; total: number }[]; por_natureza: { natureza: string; total: number }[]; por_area: { area: string; total: number }[];
};
export async function carregarIndicadores(municipios: number[] | null = null, areas: number[] | null = null) {
  const { data, error } = await supabase().rpc("indicadores", { p_municipio_ids: municipios, p_area_ids: areas });
  if (error) throw error;
  return data as Indicadores;
}

export async function carregarListas() {
  const db = supabase();
  const [areas, publicos, tipos, municipios, naturezas] = await Promise.all([
    db.from("areas_atuacao").select("id, nome").order("nome"), // 12 áreas, sem agrupar
    db.from("publicos_alvo").select("id, nome").order("nome"), // 29 públicos, sem agrupar
    db.from("tipos_parceria").select("id, nome, descricao"),
    db.from("municipios").select("id, nome").eq("na_rmcg", true).order("nome"),
    db.from("naturezas_juridicas").select("id, descricao"),
  ]);
  return {
    areas: (areas.data ?? []) as Opcao[],
    publicos: (publicos.data ?? []) as Opcao[],
    tipos: (tipos.data ?? []) as (Opcao & { descricao: string })[],
    municipios: (municipios.data ?? []) as Opcao[],
    naturezas: (naturezas.data ?? []) as { id: number; descricao: string }[],
  };
}

/** Erro padrão das rotas /api: sempre vem com `codigo` e `mensagem` em português. */
export type RespostaApi = { codigo?: string; mensagem?: string; erros?: { campo: string; mensagem: string }[]; [k: string]: unknown };

export async function chamarApi(url: string, init?: RequestInit): Promise<{ status: number; corpo: RespostaApi }> {
  try {
    const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
    const corpo = (await r.json().catch(() => ({}))) as RespostaApi;
    return { status: r.status, corpo };
  } catch {
    return { status: 0, corpo: { codigo: "rede", mensagem: "Sem conexão com o servidor. Tente novamente." } };
  }
}

/** Monta a query string de /api/exportar (Guia, seção 7). */
export function urlExportar(f: Filtros) {
  const p = new URLSearchParams();
  if (f.municipios?.length) p.set("municipios", f.municipios.join(","));
  if (f.areas?.length) p.set("areas", f.areas.join(","));
  const q = p.toString();
  return `/api/exportar${q ? `?${q}` : ""}`;
}

export const formatarCnpj = (c: string) => c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

// Apoio da tela do Administrador: tipos da fila e comparação "ficha atual × proposta" das edições.
// A fila (GET /api/moderacao/fila) devolve `dados` (o que foi enviado) e, nas edições, `atual` (linha de organizacoes).
// Campo ausente em `dados` = não alterar (Guia, seção 5).

export type Item = {
  id: number;
  tipo: "criacao" | "edicao";
  cnpj: string;
  organizacao_id: string | null;
  status: "pendente" | "aprovada" | "rejeitada";
  enviado_em: string;
  revisado_em?: string | null;
  motivo_rejeicao: string | null;
  contato_remetente?: string | null;
  dados: Record<string, unknown>;
  atual: Record<string, unknown> | null;
};

export type Listas = {
  areas: { id: number; nome: string }[];
  publicos: { id: number; nome: string }[];
  tipos: { id: number; nome: string }[];
  municipios: { id: number; nome: string }[];
  naturezas: { id: number; descricao: string }[];
};

/** Listas de nomes da ficha atual (vêm da view pública, pois `atual` não traz as tabelas de ligação). */
export type ListasAtuais = { areas: string[] | null; publicos: string[] | null; tipos_parceria: string[] | null };

export type Linha = { campo: string; atual: string; proposta: string; mudou: boolean };

const texto = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const nomes = (ids: unknown, lista: { id: number; nome: string }[]) =>
  (Array.isArray(ids) ? ids : []).map((i) => lista.find((x) => x.id === Number(i))?.nome ?? `#${i}`);
const juntar = (n: string[] | null | undefined) => [...(n ?? [])].sort((a, b) => a.localeCompare(b, "pt-BR")).join(", ");

/** Campos comparáveis, na ordem em que aparecem na tabela. */
export function compararCampos(item: Item, listas: Listas, atuais: ListasAtuais | null): Linha[] {
  const d = item.dados;
  const a = item.atual ?? {};
  const tem = (k: string) => Object.prototype.hasOwnProperty.call(d, k);

  const simples: [string, string][] = [
    ["Nome fantasia", "nome_fantasia"],
    ["Telefone", "telefone_1"],
    ["E-mail", "email"],
    ["Endereço", "endereco_completo"],
    ["Bairro", "bairro_nome"],
    ["CEP", "cep"],
    ["Responsável", "responsavel"],
    ["Cargo", "cargo_responsavel"],
    ["Site", "site_url"],
    ["Instagram", "instagram"],
    ["Facebook", "facebook"],
    ["Demandas", "demandas"],
  ];

  const linhas: Linha[] = simples.map(([campo, chave]) => {
    // O banco guarda o bairro por id; aqui comparamos pelo nome informado, quando a ficha o traz.
    const atual = texto(chave === "bairro_nome" ? a["bairro_nome"] ?? a["bairro"] : a[chave]);
    const proposta = tem(chave) ? texto(d[chave]) : atual;
    return { campo, atual, proposta, mudou: tem(chave) && proposta !== atual };
  });

  if (tem("municipio_id")) {
    const m = listas.municipios.find((x) => x.id === Number(d.municipio_id))?.nome ?? `#${d.municipio_id}`;
    const atualM = listas.municipios.find((x) => x.id === Number(a["municipio_id"]))?.nome ?? "";
    linhas.push({ campo: "Município", atual: atualM, proposta: m, mudou: m !== atualM });
  }

  const listasIds: [string, string, string[] | null | undefined, { id: number; nome: string }[]][] = [
    ["Áreas de atuação", "area_atuacao_ids", atuais?.areas, listas.areas],
    ["Públicos atendidos", "publicos_alvo_ids", atuais?.publicos, listas.publicos],
    ["Tipos de parceria", "tipos_parceria_ids", atuais?.tipos_parceria, listas.tipos],
  ];
  for (const [campo, chave, atualNomes, lista] of listasIds) {
    const atual = juntar(atualNomes);
    const proposta = tem(chave) ? juntar(nomes(d[chave], lista)) : atual;
    linhas.push({ campo, atual, proposta, mudou: tem(chave) && proposta !== atual });
  }

  if (tem("latitude") && tem("longitude")) {
    const atual = a["latitude"] != null && a["longitude"] != null ? `${a["latitude"]}, ${a["longitude"]}` : "";
    const proposta = `${d.latitude}, ${d.longitude}`;
    linhas.push({ campo: "Ponto no mapa", atual, proposta, mudou: proposta !== atual });
  }
  return linhas;
}

/** Resumo de um cadastro novo, no formato dos três quadros da tela (Instituição, Localização, Contato). */
export function resumoNovo(item: Item, listas: Listas) {
  const d = item.dados;
  const mun = listas.municipios.find((x) => x.id === Number(d.municipio_id))?.nome;
  const natureza = listas.naturezas.find((x) => x.id === Number(d.natureza_juridica_id))?.descricao ?? texto(d._natureza_receita);
  const linha = (rotulo: string, valor: string) => (valor ? `${rotulo}: ${valor}` : "");
  return {
    nome: texto(d.razao_social) || texto(d.nome_fantasia) || item.cnpj,
    instituicao: [linha("Nome fantasia", texto(d.nome_fantasia)), linha("Natureza", natureza), linha("Situação no CNPJ", texto(d.situacao_cadastral))].filter(Boolean),
    localizacao: [texto(d.endereco_completo) && `${texto(d.endereco_completo)}${d.bairro_nome ? ` · ${d.bairro_nome}` : ""}`, [mun, d.cep ? `CEP ${d.cep}` : ""].filter(Boolean).join(" · "), d.latitude != null && d.longitude != null ? `Ponto no mapa: ${d.latitude}, ${d.longitude}` : ""].filter(Boolean) as string[],
    contato: [texto(d.email), texto(d.telefone_1), texto(d.instagram) && `Instagram: ${texto(d.instagram)}`, texto(d.site_url), texto(d.facebook)].filter(Boolean) as string[],
    areas: nomes(d.area_atuacao_ids, listas.areas),
    publicos: nomes(d.publicos_alvo_ids, listas.publicos),
    tipos: nomes(d.tipos_parceria_ids, listas.tipos),
    demandas: texto(d.demandas),
    revisarNatureza: d._natureza_revisar === true,
  };
}

export const formatarDataHora = (iso: string) => {
  const dt = new Date(iso);
  return `${dt.toLocaleDateString("pt-BR")}, ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

/** "2 dias", "1 dia" ou "Hoje", contando a partir do envio. */
export function idadeDoEnvio(iso: string, agora = Date.now()) {
  const dias = Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 86_400_000));
  return dias === 0 ? "Hoje" : dias === 1 ? "1 dia" : `${dias} dias`;
}

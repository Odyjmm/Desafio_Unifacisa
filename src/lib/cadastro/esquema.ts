import { z } from 'zod';

const texto = (max: number) => z.string().trim().max(max);
const idPositivo = z.number().int().positive();

export const esquemaCadastro = z
  .object({
    cnpj: z.string().min(1),

    razaoSocial: texto(200).optional(),
    nomeFantasia: texto(150).optional(),
    naturezaJuridicaId: idPositivo.optional(),
    responsavel: texto(120).min(3, 'Informe o nome completo.'),
    cargoResponsavel: texto(80).min(2, 'Informe o cargo.'),
    email: z.string().trim().toLowerCase().email('E-mail inválido.').max(160),
    telefone: z.string().max(30),
    links: z.array(texto(200)).max(5).optional(),

    cep: z.string().max(12),
    municipioId: idPositivo,
    bairro: texto(80).min(2, 'Informe o bairro ou a comunidade.'),
    logradouro: texto(150).min(2, 'Informe o logradouro.'),
    numero: texto(20).optional(),
    complemento: texto(100).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),

    areaIds: z.array(idPositivo).min(1, 'Marque ao menos uma área de atuação.').max(12),
    publicoIds: z.array(idPositivo).min(1, 'Marque ao menos um público atendido.').max(29),
    tiposParceriaIds: z.array(idPositivo).max(3).optional(),
    demandas: texto(2000).optional(),
    aceiteDeclaracao: z.literal(true, { message: 'É preciso aceitar a declaração.' }),

    turnstileToken: z.string().max(4096).optional(),
  })
  .refine((d) => (d.latitude === undefined) === (d.longitude === undefined), {
    message: 'Informe latitude e longitude juntas.',
    path: ['latitude'],
  });

export type EntradaCadastro = z.infer<typeof esquemaCadastro>;

export function errosDoEsquema(erro: z.ZodError): { campo: string; mensagem: string }[] {
  return erro.issues.map((i) => ({ campo: i.path.join('.') || 'geral', mensagem: i.message }));
}
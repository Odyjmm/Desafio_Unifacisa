create or replace view public.v_organizacoes_publicas
with (security_invoker = true) as
select
    o.id,
    o.cnpj,
    o.razao_social,
    o.nome_fantasia,
    o.razao_social as nome,
    o.situacao_cadastral,
    o.ano_criacao,
    o.municipio_id,
    m.nome                     as municipio,
    o.bairro_id,
    b.nome                     as bairro,
    o.endereco_completo,
    o.cep,
    o.latitude,
    o.longitude,
    o.natureza_juridica_id,
    n.descricao                as natureza_juridica,
    o.telefone_1,
    o.telefone_2,
    o.email,
    o.site_url,
    o.instagram,
    o.facebook,
    o.demandas,
    o.status_verificacao,
    o.coletado_em,
    o.atualizado_em,
    coalesce(a.ids,  '{}'::smallint[]) as area_ids,
    coalesce(a.nomes,'{}'::text[])     as areas,
    coalesce(p.ids,  '{}'::smallint[]) as publico_ids,
    coalesce(p.nomes,'{}'::text[])     as publicos,
    coalesce(t.ids,  '{}'::smallint[]) as tipo_parceria_ids,
    coalesce(t.nomes,'{}'::text[])     as tipos_parceria,
    o.busca,
    case when nullif(btrim(o.nome_fantasia), '') is not null
          and public.f_unaccent(lower(btrim(o.nome_fantasia))) <> public.f_unaccent(lower(btrim(o.razao_social)))
         then btrim(o.nome_fantasia) end as nome_secundario
from public.organizacoes o
join public.municipios m on m.id = o.municipio_id
left join public.bairros b on b.id = o.bairro_id
left join public.naturezas_juridicas n on n.id = o.natureza_juridica_id
left join lateral (
    select array_agg(x.id order by x.nome) as ids, array_agg(x.nome order by x.nome) as nomes
      from public.organizacao_areas oa join public.areas_atuacao x on x.id = oa.area_id
     where oa.organizacao_id = o.id
) a on true
left join lateral (
    select array_agg(x.id order by x.nome) as ids, array_agg(x.nome order by x.nome) as nomes
      from public.organizacao_publicos op join public.publicos_alvo x on x.id = op.publico_id
     where op.organizacao_id = o.id
) p on true
left join lateral (
    select array_agg(x.id order by x.nome) as ids, array_agg(x.nome order by x.nome) as nomes
      from public.organizacao_tipos_parceria ot join public.tipos_parceria x on x.id = ot.tipo_id
     where ot.organizacao_id = o.id
) t on true;

select count(*) as nome_diferente_da_razao
  from public.v_organizacoes_publicas where nome <> razao_social;
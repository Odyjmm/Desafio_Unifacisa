do $$
declare
    v_erros int;
    v_data  constant timestamptz := timestamptz '2026-08-19 00:00:00-03';
    v_qtd   int;
begin
    if not exists (select 1 from importacao.staging_organizacoes) then
        raise exception 'A tabela de staging está vazia. Carregue o CSV primeiro.';
    end if;

    select count(*) into v_erros from importacao.v_problemas where severidade = 'ERRO';
    if v_erros > 0 then
        raise exception 'Importação cancelada: % erro(s) no CSV. Rode 02_validar.sql, corrija o arquivo e recarregue a staging.', v_erros;
    end if;

    create temp table tmp_import on commit drop as
        select p.*, gen_random_uuid() as org_id
          from importacao.v_parsed p;

    insert into public.cnaes (codigo, descricao)
    select codigo, max(descricao)
      from (
            select importacao.cnae_digitos(cnae_prim_txt) as codigo,
                   importacao.cnae_descricao(cnae_prim_txt) as descricao
              from tmp_import where cnae_prim_txt is not null
            union all
            select importacao.cnae_digitos(i.item), importacao.cnae_descricao(i.item)
              from tmp_import t
              cross join lateral regexp_split_to_table(coalesce(t.cnae_sec_txt, ''), '\s*\|\s*') as i(item)
             where btrim(i.item) <> ''
           ) x
     group by codigo
    on conflict (codigo) do update
        set descricao = coalesce(public.cnaes.descricao, excluded.descricao);

    insert into public.bairros (municipio_id, nome)
    select d.municipio_id, d.bairro_txt
      from (
            select distinct on (municipio_id, importacao.norm(bairro_txt)) municipio_id, bairro_txt
              from tmp_import
             where bairro_txt is not null
             order by municipio_id, importacao.norm(bairro_txt), linha
           ) d
     where not exists (
            select 1 from public.bairros b
             where b.municipio_id = d.municipio_id
               and importacao.norm(b.nome) = importacao.norm(d.bairro_txt));

    insert into public.organizacoes (
        id, cnpj, razao_social, nome_fantasia, natureza_juridica_id, cnae_principal_id,
        area_atuacao_id, ano_criacao, municipio_id, bairro_id, endereco_completo, cep,
        latitude, longitude, responsavel, telefone_1, telefone_2, email,
        site_url, instagram, facebook,
        status_verificacao, fonte_coleta, coletado_em, atualizado_em
    )
    select t.org_id, t.cnpj, t.razao_social, t.nome_fantasia, t.natureza_juridica_id, c.id,
           t.area_atuacao_id, t.ano_criacao, t.municipio_id, b.id, t.endereco_completo, t.cep,
           t.latitude, t.longitude, t.responsavel, t.telefone_1, t.telefone_2, t.email,
           t.site, t.instagram, t.facebook,
           'pendente', 'importacao_inicial', v_data, v_data
      from tmp_import t
      left join public.cnaes c on c.codigo = importacao.cnae_digitos(t.cnae_prim_txt)
      left join lateral (
            select b2.id from public.bairros b2
             where b2.municipio_id = t.municipio_id
               and importacao.norm(b2.nome) = importacao.norm(t.bairro_txt)
             order by b2.id limit 1
           ) b on true
     order by t.linha;
    get diagnostics v_qtd = row_count;

    insert into public.organizacao_publicos (organizacao_id, publico_id)
    select distinct t.org_id, pa.id
      from tmp_import t
      cross join lateral regexp_split_to_table(coalesce(t.publico_txt, ''), '\s*\|\s*') as i(item)
      join public.publicos_alvo pa on importacao.norm(pa.nome) = importacao.norm(i.item)
     where btrim(i.item) <> '';

    insert into public.organizacao_cnaes_secundarios (organizacao_id, cnae_id)
    select distinct t.org_id, c.id
      from tmp_import t
      cross join lateral regexp_split_to_table(coalesce(t.cnae_sec_txt, ''), '\s*\|\s*') as i(item)
      join public.cnaes c on c.codigo = importacao.cnae_digitos(i.item)
     where btrim(i.item) <> '';

    raise notice 'Importação concluída: % organizações gravadas.', v_qtd;
end
$$;

select
    (select count(*) from public.organizacoes)                  as organizacoes,
    (select count(*) from public.organizacoes where demandas is null) as com_demandas_vazia,
    (select count(*) from public.bairros)                       as bairros,
    (select count(*) from public.cnaes)                         as cnaes,
    (select count(*) from public.organizacao_publicos)          as ligacoes_publico,
    (select count(*) from public.organizacao_cnaes_secundarios) as ligacoes_cnae_sec;
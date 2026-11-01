create table public.organizacao_areas (
    organizacao_id  uuid     not null references public.organizacoes (id) on delete cascade,
    area_id         smallint not null references public.areas_atuacao (id),
    primary key (organizacao_id, area_id)
);
create index ix_org_areas_area on public.organizacao_areas (area_id);

insert into public.organizacao_areas (organizacao_id, area_id)
select id, area_atuacao_id from public.organizacoes where area_atuacao_id is not null
on conflict do nothing;

alter table public.organizacoes drop column area_atuacao_id;

comment on table public.areas_atuacao is 'Áreas de atuação (saúde, educação, meio ambiente etc.). Uma organização pode ter várias (organizacao_areas).';

create table public.tipos_parceria (
    id         smallint generated always as identity primary key,
    nome       text not null unique,
    descricao  text
);
insert into public.tipos_parceria (nome, descricao) values
    ('Projeto de extensão', 'Turmas atuam ao longo do semestre'),
    ('TCC',                 'Pesquisa aplicada com um estudante'),
    ('Desafio UNIFACISA',   'Equipes propõem soluções');

create table public.organizacao_tipos_parceria (
    organizacao_id  uuid     not null references public.organizacoes (id) on delete cascade,
    tipo_id         smallint not null references public.tipos_parceria (id),
    primary key (organizacao_id, tipo_id)
);
create index ix_org_tipos_parceria_tipo on public.organizacao_tipos_parceria (tipo_id);

alter table public.organizacoes add column cargo_responsavel     text;
alter table public.organizacoes add column aceite_declaracao_em  timestamptz;
alter table public.organizacoes add column situacao_verificada_em timestamptz;

comment on column public.organizacoes.cargo_responsavel is 'Cargo de quem responde pela instituição. Só a própria organização preenche. NÃO é público.';
comment on column public.organizacoes.aceite_declaracao_em is 'Data e hora em que a instituição aceitou a declaração do cadastro online (sem fins lucrativos e autorização de publicação).';
comment on column public.organizacoes.situacao_verificada_em is 'Quando a situação cadastral foi conferida na base pública do CNPJ. Vazio = ainda não conferida.';

alter table public.organizacoes alter column situacao_cadastral drop not null;
alter table public.organizacoes alter column situacao_cadastral drop default;
update public.organizacoes set situacao_cadastral = null where situacao_verificada_em is null;
comment on column public.organizacoes.situacao_cadastral is 'Situação do CNPJ na Receita. Vazia = não verificada.';

alter table public.municipios add column latitude  numeric(9,6);
alter table public.municipios add column longitude numeric(9,6);

update public.municipios m set latitude = s.lat, longitude = s.lon
from (values
    ('Alcantil',        -7.7367, -36.0511), ('Aroeiras',      -7.5447, -35.7066),
    ('Barra de Santana',-7.5181, -35.9913), ('Boa Vista',     -7.2637, -36.2357),
    ('Boqueirão',       -7.4870, -36.1309), ('Campina Grande',-7.2220, -35.8731),
    ('Caturité',        -7.4166, -36.0306), ('Fagundes',      -7.3445, -35.7931),
    ('Gado Bravo',      -7.5828, -35.7899), ('Itatuba',       -7.3811, -35.6380),
    ('Lagoa Seca',      -7.1554, -35.8491), ('Massaranduba',  -7.1899, -35.7848),
    ('Matinhas',        -7.1249, -35.7669), ('Natuba',        -7.6351, -35.5586),
    ('Puxinanã',        -7.1548, -35.9543), ('Queimadas',     -7.3503, -35.9031),
    ('Santa Cecília',   -7.7389, -35.8764), ('Serra Redonda', -7.1862, -35.6842),
    ('Umbuzeiro',       -7.6920, -35.6582)
) as s(nome, lat, lon)
where m.nome = s.nome;
comment on column public.municipios.latitude is 'Sede do município (base pública do IBGE). Usada para posicionar a bolha de contagem no mapa.';

create extension if not exists unaccent with schema extensions;

create or replace function public.f_unaccent(t text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, t) $$;

alter table public.organizacoes add column busca tsvector generated always as (
    to_tsvector('portuguese', public.f_unaccent(
        coalesce(razao_social, '') || ' ' || coalesce(nome_fantasia, '') || ' ' || coalesce(demandas, '')
    ))
) stored;
create index ix_org_busca on public.organizacoes using gin (busca);

create or replace function public.texto_para_tsquery(p_texto text)
returns tsquery
language plpgsql
immutable
set search_path = ''
as $$
declare
    v text;
    q tsquery;
begin
    select string_agg(w || ':*', ' & ')
      into v
      from regexp_split_to_table(
               regexp_replace(public.f_unaccent(lower(coalesce(p_texto, ''))), '[^a-z0-9 ]+', ' ', 'g'),
               '\s+') as w
     where length(w) >= 2;
    if v is null then
        return null;
    end if;
    q := to_tsquery('portuguese', v);
    -- só palavras sem significado ("de", "da"...): ignora o filtro de texto
    if numnode(q) = 0 then
        return null;
    end if;
    return q;
end;
$$;

revoke select on public.organizacoes from anon, authenticated;
grant select (
    id, cnpj, cnpj_raiz, razao_social, nome_fantasia, natureza_juridica_id,
    cnae_principal_id, situacao_cadastral, situacao_verificada_em, ano_criacao,
    municipio_id, bairro_id, endereco_completo, cep, latitude, longitude,
    telefone_1, telefone_2, email, site_url, instagram, facebook,
    demandas, busca, status_verificacao, fonte_coleta, coletado_em, atualizado_em
) on public.organizacoes to anon, authenticated;

create view public.v_organizacoes_publicas
with (security_invoker = true) as
select
    o.id,
    o.cnpj,
    o.razao_social,
    o.nome_fantasia,
    coalesce(nullif(btrim(o.nome_fantasia), ''), o.razao_social) as nome,
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
    o.busca
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

comment on view public.v_organizacoes_publicas is 'Leitura pública das organizações (sem dados pessoais do responsável). Não selecione a coluna "busca": ela existe só para a pesquisa.';

create or replace function public.filtrar_organizacoes(
    p_texto               text       default null,
    p_municipio_ids       smallint[] default null,
    p_bairro_id           integer    default null,
    p_area_ids            smallint[] default null,
    p_publico_ids         smallint[] default null,
    p_tipo_parceria_ids   smallint[] default null,
    p_natureza_ids        smallint[] default null,
    p_somente_com_demanda boolean    default false
)
returns table (id uuid, rank real)
language sql
stable
set search_path = ''
as $$
    with q as (select public.texto_para_tsquery(p_texto) as consulta)
    select v.id,
           case when q.consulta is null then null else ts_rank(v.busca, q.consulta) end
      from public.v_organizacoes_publicas v
      cross join q
     where (q.consulta is null or v.busca @@ q.consulta)
       and (p_municipio_ids     is null or v.municipio_id          = any (p_municipio_ids))
       and (p_bairro_id         is null or v.bairro_id             = p_bairro_id)
       and (p_area_ids          is null or v.area_ids            && p_area_ids)
       and (p_publico_ids       is null or v.publico_ids         && p_publico_ids)
       and (p_tipo_parceria_ids is null or v.tipo_parceria_ids   && p_tipo_parceria_ids)
       and (p_natureza_ids      is null or v.natureza_juridica_id = any (p_natureza_ids))
       and (not coalesce(p_somente_com_demanda, false) or nullif(btrim(v.demandas), '') is not null)
$$;

create or replace function public.buscar_organizacoes(
    p_texto               text       default null,
    p_municipio_ids       smallint[] default null,
    p_bairro_id           integer    default null,
    p_area_ids            smallint[] default null,
    p_publico_ids         smallint[] default null,
    p_tipo_parceria_ids   smallint[] default null,
    p_natureza_ids        smallint[] default null,
    p_somente_com_demanda boolean    default false,
    p_limite              integer    default 20,
    p_deslocamento        integer    default 0
)
returns jsonb
language sql
stable
set search_path = ''
as $$
    with f as (
        select * from public.filtrar_organizacoes(
            p_texto, p_municipio_ids, p_bairro_id, p_area_ids, p_publico_ids,
            p_tipo_parceria_ids, p_natureza_ids, p_somente_com_demanda)
    ),
    pagina as (
        select v.*, f.rank
          from f join public.v_organizacoes_publicas v on v.id = f.id
         order by f.rank desc nulls last, v.nome
         limit least(greatest(coalesce(p_limite, 20), 1), 100)
        offset greatest(coalesce(p_deslocamento, 0), 0)
    )
    select jsonb_build_object(
        'total', (select count(*) from f),
        'itens', coalesce(
            (select jsonb_agg(to_jsonb(p) - 'busca' - 'rank' order by p.rank desc nulls last, p.nome) from pagina p),
            '[]'::jsonb)
    )
$$;

create or replace function public.marcadores_mapa(
    p_texto               text       default null,
    p_municipio_ids       smallint[] default null,
    p_bairro_id           integer    default null,
    p_area_ids            smallint[] default null,
    p_publico_ids         smallint[] default null,
    p_tipo_parceria_ids   smallint[] default null,
    p_natureza_ids        smallint[] default null,
    p_somente_com_demanda boolean    default false
)
returns jsonb
language sql
stable
set search_path = ''
as $$
    select coalesce(jsonb_agg(jsonb_build_object(
               'id', v.id, 'nome', v.nome, 'latitude', v.latitude, 'longitude', v.longitude,
               'municipio_id', v.municipio_id, 'area_ids', v.area_ids) order by v.nome), '[]'::jsonb)
      from public.filtrar_organizacoes(
            p_texto, p_municipio_ids, p_bairro_id, p_area_ids, p_publico_ids,
            p_tipo_parceria_ids, p_natureza_ids, p_somente_com_demanda) f
      join public.v_organizacoes_publicas v on v.id = f.id
     where v.latitude is not null
$$;

create or replace function public.resumo_mapa_municipios(
    p_texto               text       default null,
    p_municipio_ids       smallint[] default null,
    p_bairro_id           integer    default null,
    p_area_ids            smallint[] default null,
    p_publico_ids         smallint[] default null,
    p_tipo_parceria_ids   smallint[] default null,
    p_natureza_ids        smallint[] default null,
    p_somente_com_demanda boolean    default false
)
returns jsonb
language sql
stable
set search_path = ''
as $$
    select coalesce(jsonb_agg(jsonb_build_object(
               'municipio_id', x.id, 'municipio', x.nome,
               'latitude', x.latitude, 'longitude', x.longitude,
               'total', x.total, 'sem_coordenadas', x.sem_coordenadas) order by x.total desc, x.nome), '[]'::jsonb)
      from (
            select m.id, m.nome, m.latitude, m.longitude,
                   count(*) as total,
                   count(*) filter (where v.latitude is null) as sem_coordenadas
              from public.filtrar_organizacoes(
                    p_texto, p_municipio_ids, p_bairro_id, p_area_ids, p_publico_ids,
                    p_tipo_parceria_ids, p_natureza_ids, p_somente_com_demanda) f
              join public.v_organizacoes_publicas v on v.id = f.id
              join public.municipios m on m.id = v.municipio_id
             group by m.id, m.nome, m.latitude, m.longitude
           ) x
$$;

create or replace function public.indicadores(
    p_municipio_ids smallint[] default null,
    p_area_ids      smallint[] default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
    with base as (
        select o.*,
               exists (select 1 from public.organizacao_areas   x where x.organizacao_id = o.id) as tem_area,
               exists (select 1 from public.organizacao_publicos x where x.organizacao_id = o.id) as tem_publico
          from public.organizacoes o
         where (p_municipio_ids is null or o.municipio_id = any (p_municipio_ids))
           and (p_area_ids is null or exists (
                    select 1 from public.organizacao_areas x
                     where x.organizacao_id = o.id and x.area_id = any (p_area_ids)))
    ),
    n as (select count(*)::numeric as total from base),
    comp as (
        select 'Área de atuação' as campo, 1 as ordem,
               count(*) filter (where tem_area) as qtd from base
        union all select 'Contatos', 2,
               count(*) filter (where nullif(btrim(coalesce(telefone_1, telefone_2, email, '')), '') is not null) from base
        union all select 'Público-alvo', 3, count(*) filter (where tem_publico) from base
        union all select 'Responsável', 4,
               count(*) filter (where nullif(btrim(coalesce(responsavel, '')), '') is not null) from base
        union all select 'Redes sociais', 5,
               count(*) filter (where nullif(btrim(coalesce(instagram, facebook, '')), '') is not null) from base
    ),
    comp_pct as (
        select c.campo, c.ordem,
               case when n.total = 0 then 0 else round(100 * c.qtd / n.total, 1) end as percentual
          from comp c cross join n
    )
    select jsonb_build_object(
        'total_organizacoes', (select total::int from n),
        'municipios_cobertos', (select count(distinct municipio_id) from base),
        'municipios_total',    (select count(*) from public.municipios where na_rmcg),
        'sem_coordenadas',     (select count(*) from base where latitude is null),
        'completude_media',    (select coalesce(round(avg(percentual), 1), 0) from comp_pct),
        'completude_por_campo',(select coalesce(jsonb_agg(jsonb_build_object('campo', campo, 'percentual', percentual) order by ordem), '[]'::jsonb) from comp_pct),
        'por_municipio', (
            select coalesce(jsonb_agg(jsonb_build_object('municipio', nome, 'total', qtd) order by qtd desc, nome), '[]'::jsonb)
              from (select m.nome, count(*) as qtd from base b join public.municipios m on m.id = b.municipio_id group by m.nome) s),
        'por_natureza', (
            select coalesce(jsonb_agg(jsonb_build_object('natureza', nome, 'total', qtd) order by qtd desc, nome), '[]'::jsonb)
              from (select coalesce(nj.descricao, 'Não informada') as nome, count(*) as qtd
                      from base b left join public.naturezas_juridicas nj on nj.id = b.natureza_juridica_id
                     group by 1) s),
        'por_area', (
            select coalesce(jsonb_agg(jsonb_build_object('area', nome, 'total', qtd) order by qtd desc, nome), '[]'::jsonb)
              from (select a.nome, count(*) as qtd
                      from base b
                      join public.organizacao_areas oa on oa.organizacao_id = b.id
                      join public.areas_atuacao a on a.id = oa.area_id
                     where p_area_ids is null or oa.area_id = any (p_area_ids)
                     group by a.nome) s)
    )
$$;

create or replace function public.moderacao_obter_organizacao(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    v jsonb;
begin
    if not public.e_moderador() then
        raise exception 'Acesso negado: apenas moderadores.' using errcode = '42501';
    end if;
    select to_jsonb(o) - 'busca' into v from public.organizacoes o where o.id = p_id;
    return v;
end;
$$;

create or replace function public.aprovar_alteracao(p_id bigint)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_alt   public.alteracoes_pendentes%rowtype;
    v_dados jsonb;
    r       public.organizacoes%rowtype;
    v_org   uuid;
begin
    if not public.e_moderador() then
        raise exception 'Acesso negado: apenas moderadores podem aprovar alterações.' using errcode = '42501';
    end if;

    select * into v_alt from public.alteracoes_pendentes where id = p_id for update;
    if not found then
        raise exception 'Alteração % não encontrada.', p_id;
    end if;
    if v_alt.status <> 'pendente' then
        raise exception 'Alteração % já foi %.', p_id, v_alt.status;
    end if;

    v_dados := v_alt.dados;
    r := jsonb_populate_record(null::public.organizacoes, v_dados);

    if v_alt.tipo = 'criacao' then
        if exists (select 1 from public.organizacoes where cnpj = v_alt.cnpj) then
            raise exception 'O CNPJ % já está cadastrado. Rejeite esta criação ou envie como edição.', v_alt.cnpj;
        end if;
        if r.aceite_declaracao_em is null then
            raise exception 'Cadastro novo sem o aceite da declaração (aceite_declaracao_em).';
        end if;

        insert into public.organizacoes (
            cnpj, razao_social, nome_fantasia, natureza_juridica_id,
            ano_criacao, municipio_id, bairro_id, endereco_completo, cep,
            latitude, longitude, responsavel, cargo_responsavel, telefone_1, telefone_2, email,
            site_url, instagram, facebook, demandas,
            situacao_cadastral, situacao_verificada_em, aceite_declaracao_em,
            status_verificacao, fonte_coleta
        ) values (
            v_alt.cnpj, r.razao_social, r.nome_fantasia, r.natureza_juridica_id,
            r.ano_criacao, r.municipio_id, r.bairro_id, r.endereco_completo, r.cep,
            r.latitude, r.longitude, r.responsavel, r.cargo_responsavel, r.telefone_1, r.telefone_2, r.email,
            r.site_url, r.instagram, r.facebook, r.demandas,
            r.situacao_cadastral, r.situacao_verificada_em, r.aceite_declaracao_em,
            'verificado', 'cadastro_online'
        ) returning id into v_org;
    else
        v_org := v_alt.organizacao_id;

        update public.organizacoes o set
            razao_social           = case when v_dados ? 'razao_social'           then r.razao_social           else o.razao_social           end,
            nome_fantasia          = case when v_dados ? 'nome_fantasia'          then r.nome_fantasia          else o.nome_fantasia          end,
            natureza_juridica_id   = case when v_dados ? 'natureza_juridica_id'   then r.natureza_juridica_id   else o.natureza_juridica_id   end,
            ano_criacao            = case when v_dados ? 'ano_criacao'            then r.ano_criacao            else o.ano_criacao            end,
            municipio_id           = case when v_dados ? 'municipio_id'           then r.municipio_id           else o.municipio_id           end,
            bairro_id              = case when v_dados ? 'bairro_id'              then r.bairro_id              else o.bairro_id              end,
            endereco_completo      = case when v_dados ? 'endereco_completo'      then r.endereco_completo      else o.endereco_completo      end,
            cep                    = case when v_dados ? 'cep'                    then r.cep                    else o.cep                    end,
            latitude               = case when v_dados ? 'latitude'               then r.latitude               else o.latitude               end,
            longitude              = case when v_dados ? 'longitude'              then r.longitude              else o.longitude              end,
            responsavel            = case when v_dados ? 'responsavel'            then r.responsavel            else o.responsavel            end,
            cargo_responsavel      = case when v_dados ? 'cargo_responsavel'      then r.cargo_responsavel      else o.cargo_responsavel      end,
            telefone_1             = case when v_dados ? 'telefone_1'             then r.telefone_1             else o.telefone_1             end,
            telefone_2             = case when v_dados ? 'telefone_2'             then r.telefone_2             else o.telefone_2             end,
            email                  = case when v_dados ? 'email'                  then r.email                  else o.email                  end,
            site_url               = case when v_dados ? 'site_url'               then r.site_url               else o.site_url               end,
            instagram              = case when v_dados ? 'instagram'              then r.instagram              else o.instagram              end,
            facebook               = case when v_dados ? 'facebook'               then r.facebook               else o.facebook               end,
            demandas               = case when v_dados ? 'demandas'               then r.demandas               else o.demandas               end,
            situacao_cadastral     = case when v_dados ? 'situacao_cadastral'     then r.situacao_cadastral     else o.situacao_cadastral     end,
            situacao_verificada_em = case when v_dados ? 'situacao_verificada_em' then r.situacao_verificada_em else o.situacao_verificada_em end,
            aceite_declaracao_em   = case when v_dados ? 'aceite_declaracao_em'   then r.aceite_declaracao_em   else o.aceite_declaracao_em   end,
            status_verificacao     = 'verificado'
        where o.id = v_org;

        if not found then
            raise exception 'A organização desta alteração não existe mais.';
        end if;
    end if;

    if v_dados ? 'area_atuacao_ids' then
        delete from public.organizacao_areas where organizacao_id = v_org;
        insert into public.organizacao_areas (organizacao_id, area_id)
        select v_org, x::smallint from jsonb_array_elements_text(v_dados -> 'area_atuacao_ids') as x
        on conflict do nothing;
    end if;

    if v_dados ? 'publicos_alvo_ids' then
        delete from public.organizacao_publicos where organizacao_id = v_org;
        insert into public.organizacao_publicos (organizacao_id, publico_id)
        select v_org, x::smallint from jsonb_array_elements_text(v_dados -> 'publicos_alvo_ids') as x
        on conflict do nothing;
    end if;

    if v_dados ? 'tipos_parceria_ids' then
        delete from public.organizacao_tipos_parceria where organizacao_id = v_org;
        insert into public.organizacao_tipos_parceria (organizacao_id, tipo_id)
        select v_org, x::smallint from jsonb_array_elements_text(v_dados -> 'tipos_parceria_ids') as x
        on conflict do nothing;
    end if;

    update public.alteracoes_pendentes
       set status = 'aprovada',
           organizacao_id = v_org,
           revisado_por = (select auth.uid()),
           revisado_em = now()
     where id = p_id;

    return v_org;
end;
$$;

do $$
declare
    t text;
begin
    foreach t in array array['organizacao_areas', 'tipos_parceria', 'organizacao_tipos_parceria']
    loop
        execute format('alter table public.%I enable row level security', t);
        execute format('create policy "leitura publica" on public.%I for select to anon, authenticated using (true)', t);
        execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
    end loop;
end
$$;

grant select on public.v_organizacoes_publicas to anon, authenticated;

grant execute on function public.f_unaccent(text)           to anon, authenticated;
grant execute on function public.texto_para_tsquery(text)   to anon, authenticated;
grant execute on function public.filtrar_organizacoes(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean) to anon, authenticated;
grant execute on function public.buscar_organizacoes(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean, integer, integer) to anon, authenticated;
grant execute on function public.marcadores_mapa(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean) to anon, authenticated;
grant execute on function public.resumo_mapa_municipios(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean) to anon, authenticated;
grant execute on function public.indicadores(smallint[], smallint[]) to anon, authenticated;

revoke all on function public.moderacao_obter_organizacao(uuid) from public, anon;
grant execute on function public.moderacao_obter_organizacao(uuid) to authenticated;
revoke all on function public.aprovar_alteracao(bigint) from public, anon;
grant execute on function public.aprovar_alteracao(bigint) to authenticated;
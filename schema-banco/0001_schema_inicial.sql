create extension if not exists pg_trgm with schema extensions;

create table public.municipios (
    id            smallint generated always as identity primary key,
    codigo_ibge   char(7)  not null unique,
    nome          text     not null,
    uf            char(2)  not null default 'PB',
    na_rmcg       boolean  not null default false  -- integra a Região Metropolitana de Campina Grande
);
comment on table public.municipios is 'Municípios. na_rmcg marca os que integram a RMCG (área de abrangência da Etapa 1).';

create table public.bairros (
    id            integer generated always as identity primary key,
    municipio_id  smallint not null references public.municipios (id),
    nome          text     not null,
    unique (municipio_id, nome)
);

create table public.naturezas_juridicas (
    id         smallint generated always as identity primary key,
    codigo     char(4) not null unique,
    descricao  text    not null
);
comment on table public.naturezas_juridicas is 'Natureza jurídica conforme código oficial (ex.: associação privada, fundação privada).';

create table public.cnaes (
    id         integer generated always as identity primary key,
    codigo     char(7) not null unique,  -- 7 dígitos, sem pontuação (ex.: 9430800)
    descricao  text    not null
);
comment on table public.cnaes is 'Classificação Nacional de Atividades Econômicas (CNAE).';

create table public.areas_atuacao (
    id         smallint generated always as identity primary key,
    nome       text not null unique
);
comment on table public.areas_atuacao is 'Áreas de atuação (saúde, educação, meio ambiente, assistência social etc.). Cada organização tem uma.';

create table public.publicos_alvo (
    id         smallint generated always as identity primary key,
    nome       text not null unique
);

create table public.categorias_necessidade (
    id         smallint generated always as identity primary key,
    nome       text not null unique
);
comment on table public.categorias_necessidade is 'Categorias de necessidade identificadas pelo grupo na pesquisa (alimentadas pela equipe).';

create table public.organizacoes (
    id                        uuid primary key default gen_random_uuid(),

    cnpj                      char(14) unique,
    cnpj_raiz                 char(8) generated always as (left(cnpj, 8)) stored,
    razao_social              text not null,
    nome_fantasia             text,
    natureza_juridica_id      smallint references public.naturezas_juridicas (id),
    cnae_principal_id         integer  references public.cnaes (id),
    area_atuacao_id           smallint references public.areas_atuacao (id),
    situacao_cadastral        text not null default 'ativa',
    ano_criacao               smallint,

    municipio_id              smallint not null references public.municipios (id),
    bairro_id                 integer  references public.bairros (id),
    logradouro                text,
    numero                    text,
    complemento               text,
    cep                       char(8),
    latitude                  numeric(9,6),
    longitude                 numeric(9,6),

    responsavel               text,
    telefone                  text,
    email                     text,
    site_url                  text,
    logo_url                  text,

    projetos_executados       text,
    parceiros_institucionais  text,
    demandas                  text,

    status_verificacao        text not null default 'pendente',
    fonte_coleta              text not null default 'campo',
    coletado_em               timestamptz not null default now(),
    atualizado_em             timestamptz not null default now(),

    constraint ck_cnpj_formato        check (cnpj is null or cnpj ~ '^[0-9]{14}$'),
    constraint ck_cep_formato         check (cep is null or cep ~ '^[0-9]{8}$'),
    constraint ck_ano_criacao         check (ano_criacao is null or ano_criacao between 1500 and 2100),
    constraint ck_latitude            check (latitude  is null or latitude  between -90  and 90),
    constraint ck_longitude           check (longitude is null or longitude between -180 and 180),
    constraint ck_coordenadas_pares   check ((latitude is null) = (longitude is null)),
    constraint ck_situacao_cadastral  check (situacao_cadastral in ('ativa','suspensa','inapta','baixada','nula')),
    constraint ck_status_verificacao  check (status_verificacao in ('pendente','verificado','desatualizado')),
    constraint ck_fonte_coleta        check (fonte_coleta in ('mosc','campo','site_institucional','rede_social','cnpj_receita','cadastro_online','outra'))
);

comment on table  public.organizacoes is 'Organizações do terceiro setor e organizações híbridas mapeadas.';
comment on column public.organizacoes.cnpj is 'Somente dígitos. Opcional (coletivos informais), único quando informado (RF08).';
comment on column public.organizacoes.cnpj_raiz is 'Oito primeiros dígitos do CNPJ. Identifica matriz e filiais da mesma entidade.';
comment on column public.organizacoes.demandas is 'Campo principal do sistema: o que a organização precisa. Preenchido pela própria organização via cadastro moderado.';

create table public.organizacao_publicos (
    organizacao_id  uuid     not null references public.organizacoes (id) on delete cascade,
    publico_id      smallint not null references public.publicos_alvo (id),
    primary key (organizacao_id, publico_id)
);

create table public.organizacao_cnaes_secundarios (
    organizacao_id  uuid    not null references public.organizacoes (id) on delete cascade,
    cnae_id         integer not null references public.cnaes (id),
    primary key (organizacao_id, cnae_id)
);

create table public.organizacao_necessidades (
    id              bigint generated always as identity primary key,
    organizacao_id  uuid     not null references public.organizacoes (id) on delete cascade,
    categoria_id    smallint not null references public.categorias_necessidade (id),
    descricao       text,
    unique (organizacao_id, categoria_id)
);

create table public.organizacao_redes_sociais (
    id              bigint generated always as identity primary key,
    organizacao_id  uuid not null references public.organizacoes (id) on delete cascade,
    plataforma      text not null,
    url             text not null,
    constraint ck_plataforma check (plataforma in ('instagram','facebook','linkedin','youtube','x','tiktok','whatsapp','outra')),
    unique (organizacao_id, plataforma, url)
);

create table public.moderadores (
    user_id    uuid primary key references auth.users (id) on delete cascade,
    criado_em  timestamptz not null default now()
);

create table public.alteracoes_pendentes (
    id                 bigint generated always as identity primary key,
    tipo               text   not null,
    cnpj               char(14) not null,
    organizacao_id     uuid references public.organizacoes (id) on delete cascade,
    dados              jsonb  not null,
    contato_remetente  text,
    status             text   not null default 'pendente',
    enviado_em         timestamptz not null default now(),
    revisado_por       uuid references auth.users (id) on delete set null,
    revisado_em        timestamptz,
    motivo_rejeicao    text,

    constraint ck_alt_tipo          check (tipo in ('criacao','edicao')),
    constraint ck_alt_cnpj          check (cnpj ~ '^[0-9]{14}$'),
    constraint ck_alt_status        check (status in ('pendente','aprovada','rejeitada')),
    constraint ck_alt_dados_objeto  check (jsonb_typeof(dados) = 'object'),
    constraint ck_alt_dados_tamanho check (octet_length(dados::text) <= 20000),
    constraint ck_alt_edicao_org    check (tipo <> 'edicao' or organizacao_id is not null),
    constraint ck_alt_revisao       check ((status = 'pendente') = (revisado_em is null))
);
comment on table public.alteracoes_pendentes is 'Fila de moderação. Nada entra em organizacoes sem aprovação de um moderador.';

create index ix_org_municipio     on public.organizacoes (municipio_id);
create index ix_org_bairro        on public.organizacoes (bairro_id);
create index ix_org_natureza      on public.organizacoes (natureza_juridica_id);
create index ix_org_area          on public.organizacoes (area_atuacao_id);
create index ix_org_status        on public.organizacoes (status_verificacao);
create index ix_org_cnpj_raiz     on public.organizacoes (cnpj_raiz);
create index ix_org_cnae          on public.organizacoes (cnae_principal_id);

create index ix_org_razao_trgm    on public.organizacoes using gin (razao_social extensions.gin_trgm_ops);
create index ix_org_fantasia_trgm on public.organizacoes using gin (nome_fantasia extensions.gin_trgm_ops);

create index ix_org_publicos_publico     on public.organizacao_publicos (publico_id);
create index ix_org_cnaes_sec_cnae       on public.organizacao_cnaes_secundarios (cnae_id);
create index ix_org_necessidades_cat     on public.organizacao_necessidades (categoria_id);
create index ix_org_redes_organizacao    on public.organizacao_redes_sociais (organizacao_id);
create index ix_bairros_municipio        on public.bairros (municipio_id);

create index ix_alt_fila   on public.alteracoes_pendentes (status, enviado_em);
create index ix_alt_cnpj   on public.alteracoes_pendentes (cnpj);
create index ix_alt_org    on public.alteracoes_pendentes (organizacao_id);
create index ix_alt_revisor on public.alteracoes_pendentes (revisado_por);

create or replace function public.definir_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.atualizado_em = now();
    return new;
end;
$$;

create trigger tg_organizacoes_atualizado_em
    before update on public.organizacoes
    for each row execute function public.definir_atualizado_em();

create or replace function public.e_moderador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.moderadores where user_id = (select auth.uid())
    );
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

        insert into public.organizacoes (
            cnpj, razao_social, nome_fantasia, natureza_juridica_id, area_atuacao_id,
            ano_criacao, municipio_id, bairro_id, logradouro, numero, complemento, cep,
            latitude, longitude, responsavel, telefone, email, site_url, logo_url,
            projetos_executados, parceiros_institucionais, demandas,
            status_verificacao, fonte_coleta
        ) values (
            v_alt.cnpj, r.razao_social, r.nome_fantasia, r.natureza_juridica_id, r.area_atuacao_id,
            r.ano_criacao, r.municipio_id, r.bairro_id, r.logradouro, r.numero, r.complemento, r.cep,
            r.latitude, r.longitude, r.responsavel, r.telefone, r.email, r.site_url, r.logo_url,
            r.projetos_executados, r.parceiros_institucionais, r.demandas,
            'verificado', 'cadastro_online'
        ) returning id into v_org;
    else
        v_org := v_alt.organizacao_id;

        update public.organizacoes o set
            razao_social             = case when v_dados ? 'razao_social'             then r.razao_social             else o.razao_social             end,
            nome_fantasia            = case when v_dados ? 'nome_fantasia'            then r.nome_fantasia            else o.nome_fantasia            end,
            natureza_juridica_id     = case when v_dados ? 'natureza_juridica_id'     then r.natureza_juridica_id     else o.natureza_juridica_id     end,
            area_atuacao_id          = case when v_dados ? 'area_atuacao_id'          then r.area_atuacao_id          else o.area_atuacao_id          end,
            ano_criacao              = case when v_dados ? 'ano_criacao'              then r.ano_criacao              else o.ano_criacao              end,
            municipio_id             = case when v_dados ? 'municipio_id'             then r.municipio_id             else o.municipio_id             end,
            bairro_id                = case when v_dados ? 'bairro_id'                then r.bairro_id                else o.bairro_id                end,
            logradouro               = case when v_dados ? 'logradouro'               then r.logradouro               else o.logradouro               end,
            numero                   = case when v_dados ? 'numero'                   then r.numero                   else o.numero                   end,
            complemento              = case when v_dados ? 'complemento'              then r.complemento              else o.complemento              end,
            cep                      = case when v_dados ? 'cep'                      then r.cep                      else o.cep                      end,
            latitude                 = case when v_dados ? 'latitude'                 then r.latitude                 else o.latitude                 end,
            longitude                = case when v_dados ? 'longitude'                then r.longitude                else o.longitude                end,
            responsavel              = case when v_dados ? 'responsavel'              then r.responsavel              else o.responsavel              end,
            telefone                 = case when v_dados ? 'telefone'                 then r.telefone                 else o.telefone                 end,
            email                    = case when v_dados ? 'email'                    then r.email                    else o.email                    end,
            site_url                 = case when v_dados ? 'site_url'                 then r.site_url                 else o.site_url                 end,
            logo_url                 = case when v_dados ? 'logo_url'                 then r.logo_url                 else o.logo_url                 end,
            projetos_executados      = case when v_dados ? 'projetos_executados'      then r.projetos_executados      else o.projetos_executados      end,
            parceiros_institucionais = case when v_dados ? 'parceiros_institucionais' then r.parceiros_institucionais else o.parceiros_institucionais end,
            demandas                 = case when v_dados ? 'demandas'                 then r.demandas                 else o.demandas                 end,
            status_verificacao       = 'verificado'
        where o.id = v_org;

        if not found then
            raise exception 'A organização desta alteração não existe mais.';
        end if;
    end if;

    if v_dados ? 'publicos_alvo_ids' then
        delete from public.organizacao_publicos where organizacao_id = v_org;
        insert into public.organizacao_publicos (organizacao_id, publico_id)
        select v_org, x::smallint
        from jsonb_array_elements_text(v_dados -> 'publicos_alvo_ids') as x
        on conflict do nothing;
    end if;

    if v_dados ? 'redes_sociais' then
        delete from public.organizacao_redes_sociais where organizacao_id = v_org;
        insert into public.organizacao_redes_sociais (organizacao_id, plataforma, url)
        select v_org, e ->> 'plataforma', e ->> 'url'
        from jsonb_array_elements(v_dados -> 'redes_sociais') as e
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

create or replace function public.rejeitar_alteracao(p_id bigint, p_motivo text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if not public.e_moderador() then
        raise exception 'Acesso negado: apenas moderadores podem rejeitar alterações.' using errcode = '42501';
    end if;

    update public.alteracoes_pendentes
       set status = 'rejeitada',
           motivo_rejeicao = p_motivo,
           revisado_por = (select auth.uid()),
           revisado_em = now()
     where id = p_id and status = 'pendente';

    if not found then
        raise exception 'Alteração % não encontrada ou já revisada.', p_id;
    end if;
end;
$$;

do $$
declare
    t text;
begin
    foreach t in array array[
        'municipios', 'bairros', 'naturezas_juridicas', 'cnaes',
        'areas_atuacao', 'publicos_alvo', 'categorias_necessidade',
        'organizacoes', 'organizacao_publicos', 'organizacao_cnaes_secundarios',
        'organizacao_necessidades', 'organizacao_redes_sociais'
    ]
    loop
        execute format('alter table public.%I enable row level security', t);
        execute format('create policy "leitura publica" on public.%I for select to anon, authenticated using (true)', t);
        execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
    end loop;
end
$$;

alter table public.moderadores enable row level security;
revoke all on public.moderadores from anon, authenticated;

alter table public.alteracoes_pendentes enable row level security;
revoke all on public.alteracoes_pendentes from anon, authenticated;
grant select on public.alteracoes_pendentes to authenticated;
create policy "moderador le fila" on public.alteracoes_pendentes
    for select to authenticated using (public.e_moderador());

revoke all on function public.e_moderador()                      from public, anon;
revoke all on function public.aprovar_alteracao(bigint)          from public, anon;
revoke all on function public.rejeitar_alteracao(bigint, text)   from public, anon;
grant execute on function public.e_moderador()                    to authenticated;
grant execute on function public.aprovar_alteracao(bigint)        to authenticated;
grant execute on function public.rejeitar_alteracao(bigint, text) to authenticated;
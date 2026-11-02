do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'organizacoes' and column_name = 'telefone'
    ) then
        alter table public.organizacoes rename column telefone to telefone_1;
    end if;
end
$$;
alter table public.organizacoes add column if not exists telefone_1 text;
alter table public.organizacoes add column if not exists telefone_2 text;

alter table public.organizacoes drop column if exists logradouro;
alter table public.organizacoes drop column if exists numero;
alter table public.organizacoes drop column if exists complemento;
alter table public.organizacoes add column if not exists endereco_completo text;
alter table public.organizacoes add column if not exists cep char(8);

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'ck_cep_formato' and conrelid = 'public.organizacoes'::regclass
    ) then
        alter table public.organizacoes
            add constraint ck_cep_formato check (cep is null or cep ~ '^[0-9]{8}$');
    end if;
end
$$;
comment on column public.organizacoes.endereco_completo is 'Endereço completo da sede, em texto livre.';
comment on column public.organizacoes.cep is 'Somente os 8 dígitos, sem hífen.';

drop table if exists public.organizacao_redes_sociais;
alter table public.organizacoes add column if not exists instagram text;
alter table public.organizacoes add column if not exists facebook  text;

alter table public.organizacoes drop column if exists nivel_confianca;
alter table public.organizacoes drop column if exists projetos_executados;
alter table public.organizacoes drop column if exists parceiros_institucionais;
alter table public.organizacoes drop column if exists logo_url;

alter table public.organizacoes drop constraint if exists ck_fonte_coleta;
update public.organizacoes set fonte_coleta = 'importacao_inicial'
 where fonte_coleta not in ('importacao_inicial', 'cadastro_online');
alter table public.organizacoes alter column fonte_coleta set default 'importacao_inicial';
alter table public.organizacoes add constraint ck_fonte_coleta
    check (fonte_coleta in ('importacao_inicial', 'cadastro_online'));
comment on column public.organizacoes.fonte_coleta is 'Origem do registro: carga inicial (CSV da pesquisa) ou cadastro online aprovado.';

comment on column public.organizacoes.coletado_em is 'Data da coleta da informação. Na carga inicial: 19/08/2026.';
comment on column public.organizacoes.atualizado_em is 'Atualizada automaticamente a cada edição aprovada.';

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
            ano_criacao, municipio_id, bairro_id, endereco_completo, cep,
            latitude, longitude, responsavel, telefone_1, telefone_2, email,
            site_url, instagram, facebook, demandas,
            status_verificacao, fonte_coleta
        ) values (
            v_alt.cnpj, r.razao_social, r.nome_fantasia, r.natureza_juridica_id, r.area_atuacao_id,
            r.ano_criacao, r.municipio_id, r.bairro_id, r.endereco_completo, r.cep,
            r.latitude, r.longitude, r.responsavel, r.telefone_1, r.telefone_2, r.email,
            r.site_url, r.instagram, r.facebook, r.demandas,
            'verificado', 'cadastro_online'
        ) returning id into v_org;
    else
        v_org := v_alt.organizacao_id;

        update public.organizacoes o set
            razao_social         = case when v_dados ? 'razao_social'         then r.razao_social         else o.razao_social         end,
            nome_fantasia        = case when v_dados ? 'nome_fantasia'        then r.nome_fantasia        else o.nome_fantasia        end,
            natureza_juridica_id = case when v_dados ? 'natureza_juridica_id' then r.natureza_juridica_id else o.natureza_juridica_id end,
            area_atuacao_id      = case when v_dados ? 'area_atuacao_id'      then r.area_atuacao_id      else o.area_atuacao_id      end,
            ano_criacao          = case when v_dados ? 'ano_criacao'          then r.ano_criacao          else o.ano_criacao          end,
            municipio_id         = case when v_dados ? 'municipio_id'         then r.municipio_id         else o.municipio_id         end,
            bairro_id            = case when v_dados ? 'bairro_id'            then r.bairro_id            else o.bairro_id            end,
            endereco_completo    = case when v_dados ? 'endereco_completo'    then r.endereco_completo    else o.endereco_completo    end,
            cep                  = case when v_dados ? 'cep'                  then r.cep                  else o.cep                  end,
            latitude             = case when v_dados ? 'latitude'             then r.latitude             else o.latitude             end,
            longitude            = case when v_dados ? 'longitude'            then r.longitude            else o.longitude            end,
            responsavel          = case when v_dados ? 'responsavel'          then r.responsavel          else o.responsavel          end,
            telefone_1           = case when v_dados ? 'telefone_1'           then r.telefone_1           else o.telefone_1           end,
            telefone_2           = case when v_dados ? 'telefone_2'           then r.telefone_2           else o.telefone_2           end,
            email                = case when v_dados ? 'email'                then r.email                else o.email                end,
            site_url             = case when v_dados ? 'site_url'             then r.site_url             else o.site_url             end,
            instagram            = case when v_dados ? 'instagram'            then r.instagram            else o.instagram            end,
            facebook             = case when v_dados ? 'facebook'             then r.facebook             else o.facebook             end,
            demandas             = case when v_dados ? 'demandas'             then r.demandas             else o.demandas             end,
            status_verificacao   = 'verificado'
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

    update public.alteracoes_pendentes
       set status = 'aprovada',
           organizacao_id = v_org,
           revisado_por = (select auth.uid()),
           revisado_em = now()
     where id = p_id;

    return v_org;
end;
$$;
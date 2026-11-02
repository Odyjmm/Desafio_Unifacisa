alter table public.alteracoes_pendentes add column ip_hash text;
comment on column public.alteracoes_pendentes.ip_hash is 'Hash (com segredo) do IP de quem enviou. Serve só para limitar envios; não permite descobrir o IP.';
create index ix_alt_ip_recente on public.alteracoes_pendentes (ip_hash, enviado_em desc);

create unique index ux_alt_pendente_por_cnpj on public.alteracoes_pendentes (cnpj) where status = 'pendente';

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
    v_mun   smallint;
    v_bairro integer;
    v_nome_bairro text;
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

    v_nome_bairro := nullif(btrim(regexp_replace(coalesce(v_dados ->> 'bairro_nome', ''), '\s+', ' ', 'g')), '');
    if not (v_dados ? 'bairro_id') and v_nome_bairro is not null then
        v_mun := coalesce(
            nullif(v_dados ->> 'municipio_id', '')::smallint,
            (select o.municipio_id from public.organizacoes o where o.id = v_alt.organizacao_id));
        if v_mun is null then
            raise exception 'Alteração % traz bairro sem município.', p_id;
        end if;
        select b.id into v_bairro
          from public.bairros b
         where b.municipio_id = v_mun
           and lower(public.f_unaccent(b.nome)) = lower(public.f_unaccent(v_nome_bairro))
         order by b.id
         limit 1;
        if v_bairro is null then
            insert into public.bairros (municipio_id, nome) values (v_mun, v_nome_bairro)
            returning id into v_bairro;
        end if;
        v_dados := v_dados || jsonb_build_object('bairro_id', v_bairro);
    end if;

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

revoke all on function public.aprovar_alteracao(bigint) from public, anon;
grant execute on function public.aprovar_alteracao(bigint) to authenticated;
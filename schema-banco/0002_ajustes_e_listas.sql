alter table public.municipios alter column codigo_ibge drop not null;
alter table public.municipios add constraint uq_municipio_nome_uf unique (nome, uf);

alter table public.naturezas_juridicas alter column codigo drop not null;
alter table public.naturezas_juridicas add constraint uq_natureza_descricao unique (descricao);
comment on table public.naturezas_juridicas is 'Categorias de natureza jurídica adotadas pela pesquisa (OSC, OS, fundações privadas).';

alter table public.organizacoes drop column logradouro;
alter table public.organizacoes drop column numero;
alter table public.organizacoes drop column complemento;
alter table public.organizacoes add column endereco_completo text;
comment on column public.organizacoes.endereco_completo is 'Endereço completo da sede, em texto livre.';

alter table public.organizacoes rename column telefone to telefone_1;
alter table public.organizacoes add column telefone_2 text;

drop table public.organizacao_redes_sociais;
alter table public.organizacoes add column instagram text;
alter table public.organizacoes add column facebook  text;

alter table public.organizacoes drop constraint ck_fonte_coleta;
update public.organizacoes set fonte_coleta = 'importacao_inicial'
 where fonte_coleta not in ('importacao_inicial', 'cadastro_online');
alter table public.organizacoes alter column fonte_coleta set default 'importacao_inicial';
alter table public.organizacoes add constraint ck_fonte_coleta
    check (fonte_coleta in ('importacao_inicial', 'cadastro_online'));
comment on column public.organizacoes.fonte_coleta is 'Origem do registro: carga inicial (CSV da pesquisa) ou cadastro online aprovado.';

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
            site_url, instagram, facebook, logo_url,
            projetos_executados, parceiros_institucionais, demandas,
            status_verificacao, fonte_coleta
        ) values (
            v_alt.cnpj, r.razao_social, r.nome_fantasia, r.natureza_juridica_id, r.area_atuacao_id,
            r.ano_criacao, r.municipio_id, r.bairro_id, r.endereco_completo, r.cep,
            r.latitude, r.longitude, r.responsavel, r.telefone_1, r.telefone_2, r.email,
            r.site_url, r.instagram, r.facebook, r.logo_url,
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
            endereco_completo        = case when v_dados ? 'endereco_completo'        then r.endereco_completo        else o.endereco_completo        end,
            cep                      = case when v_dados ? 'cep'                      then r.cep                      else o.cep                      end,
            latitude                 = case when v_dados ? 'latitude'                 then r.latitude                 else o.latitude                 end,
            longitude                = case when v_dados ? 'longitude'                then r.longitude                else o.longitude                end,
            responsavel              = case when v_dados ? 'responsavel'              then r.responsavel              else o.responsavel              end,
            telefone_1               = case when v_dados ? 'telefone_1'               then r.telefone_1               else o.telefone_1               end,
            telefone_2               = case when v_dados ? 'telefone_2'               then r.telefone_2               else o.telefone_2               end,
            email                    = case when v_dados ? 'email'                    then r.email                    else o.email                    end,
            site_url                 = case when v_dados ? 'site_url'                 then r.site_url                 else o.site_url                 end,
            instagram                = case when v_dados ? 'instagram'                then r.instagram                else o.instagram                end,
            facebook                 = case when v_dados ? 'facebook'                 then r.facebook                 else o.facebook                 end,
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

    update public.alteracoes_pendentes
       set status = 'aprovada',
           organizacao_id = v_org,
           revisado_por = (select auth.uid()),
           revisado_em = now()
     where id = p_id;

    return v_org;
end;
$$;

insert into public.municipios (nome, uf, na_rmcg) values
    ('Alcantil',         'PB', true),
    ('Aroeiras',         'PB', true),
    ('Barra de Santana', 'PB', true),
    ('Boa Vista',        'PB', true),
    ('Boqueirão',        'PB', true),
    ('Campina Grande',   'PB', true),
    ('Caturité',         'PB', true),
    ('Fagundes',         'PB', true),
    ('Gado Bravo',       'PB', true),
    ('Itatuba',          'PB', true),
    ('Lagoa Seca',       'PB', true),
    ('Massaranduba',     'PB', true),
    ('Matinhas',         'PB', true),
    ('Natuba',           'PB', true),
    ('Puxinanã',         'PB', true),
    ('Queimadas',        'PB', true),
    ('Santa Cecília',    'PB', true),
    ('Serra Redonda',    'PB', true),
    ('Umbuzeiro',        'PB', true);

insert into public.areas_atuacao (nome) values
    ('Educação'),
    ('Saúde'),
    ('Assistência Social'),
    ('Meio Ambiente'),
    ('Cultura e Artes'),
    ('Esporte e Lazer'),
    ('Direitos Humanos'),
    ('Segurança Alimentar e Combate à Fome'),
    ('Desenvolvimento Comunitário'),
    ('Geração de Emprego e Renda'),
    ('Proteção e Defesa dos Animais'),
    ('Ciência, Tecnologia e Inovação');

insert into public.publicos_alvo (nome) values
    ('Crianças, Jovens e Adolescentes'),
    ('Idosos'),
    ('Pessoas em situação de vulnerabilidade social'),
    ('Pessoas em situação de rua'),
    ('Famílias de baixa renda'),
    ('Pessoas com deficiência (PcD)'),
    ('Pessoas com doenças crônicas ou condições específicas'),
    ('Mulheres em situação de vulnerabilidade'),
    ('Vítimas de violência doméstica'),
    ('Comunidades rurais'),
    ('Comunidades tradicionais'),
    ('Populações indígenas'),
    ('População negra'),
    ('Imigrantes e refugiados'),
    ('Pessoas desempregadas'),
    ('Trabalhadores de baixa renda'),
    ('Pessoas em situação de insegurança alimentar'),
    ('Estudantes da rede pública'),
    ('Pessoas com baixa escolaridade'),
    ('Pessoas que buscam capacitação profissional'),
    ('Pequenos empreendedores e trabalhadores informais'),
    ('Animais abandonados ou em situação de maus-tratos'),
    ('Pessoas em situação de dependência química'),
    ('Pessoas privadas de liberdade ou egressas do sistema prisional'),
    ('Cuidadores e familiares de pessoas dependentes'),
    ('Comunidades em áreas de risco social'),
    ('Comunidades em áreas de risco ambiental'),
    ('Pessoas com profissões específicas'),
    ('Público em geral, em projetos de conscientização ou educação social');

insert into public.naturezas_juridicas (descricao) values
    ('Organizações da Sociedade Civil (OSC)'),
    ('Organizações Sociais (OS)'),
    ('Fundações privadas');

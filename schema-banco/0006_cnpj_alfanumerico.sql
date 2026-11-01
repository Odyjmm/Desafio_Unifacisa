alter table public.organizacoes drop constraint ck_cnpj_formato;
alter table public.organizacoes add constraint ck_cnpj_formato
    check (cnpj is null or cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$');

alter table public.alteracoes_pendentes drop constraint ck_alt_cnpj;
alter table public.alteracoes_pendentes add constraint ck_alt_cnpj
    check (cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$');

comment on column public.organizacoes.cnpj is 'Sem máscara, 14 caracteres: 12 alfanuméricos maiúsculos + 2 dígitos verificadores. Opcional (coletivos informais), único quando informado (RF08).';

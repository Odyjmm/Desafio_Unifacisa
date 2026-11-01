alter table public.cnaes alter column codigo type varchar(7);
alter table public.cnaes add constraint ck_cnae_codigo check (codigo ~ '^([0-9]{5}|[0-9]{7})$');
alter table public.cnaes alter column descricao drop not null;

comment on table  public.cnaes is 'CNAE (Classificação Nacional de Atividades Econômicas). Aceita classe (5 dígitos) e subclasse (7 dígitos).';
comment on column public.cnaes.codigo is 'Somente dígitos: 5 (classe, ex.: 94308) ou 7 (subclasse, ex.: 9430800).';
comment on column public.cnaes.descricao is 'Opcional: preenchida quando o CSV traz a descrição junto do código.';
revoke select on public.v_organizacoes_publicas from anon, authenticated;
revoke select on public.organizacoes from anon, authenticated;

revoke all on function public.filtrar_organizacoes(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean) from public, anon, authenticated;
revoke all on function public.buscar_organizacoes(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean, integer, integer) from public, anon, authenticated;
revoke all on function public.marcadores_mapa(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean) from public, anon, authenticated;
revoke all on function public.resumo_mapa_municipios(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean) from public, anon, authenticated;
revoke all on function public.indicadores(smallint[], smallint[]) from public, anon, authenticated;

grant select on public.v_organizacoes_publicas to service_role;
grant execute on function public.filtrar_organizacoes(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean) to service_role;
grant execute on function public.buscar_organizacoes(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean, integer, integer) to service_role;
grant execute on function public.marcadores_mapa(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean) to service_role;
grant execute on function public.resumo_mapa_municipios(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean) to service_role;
grant execute on function public.indicadores(smallint[], smallint[]) to service_role;

select 'anon lê organizacoes'        as item, has_table_privilege('anon', 'public.organizacoes', 'select')            as permitido
union all select 'anon lê a view pública',  has_table_privilege('anon', 'public.v_organizacoes_publicas', 'select')
union all select 'anon executa a busca',    has_function_privilege('anon', 'public.buscar_organizacoes(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean, integer, integer)', 'execute');
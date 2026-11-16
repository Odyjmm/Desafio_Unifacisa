
grant select on public.v_organizacoes_publicas to anon, authenticated;
grant select on public.organizacoes to anon, authenticated;
grant execute on function public.filtrar_organizacoes(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean) to anon, authenticated;
grant execute on function public.buscar_organizacoes(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean, integer, integer) to anon, authenticated;
grant execute on function public.marcadores_mapa(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean) to anon, authenticated;
grant execute on function public.resumo_mapa_municipios(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean) to anon, authenticated;
grant execute on function public.indicadores(smallint[], smallint[]) to anon, authenticated;

select 'anon lê organizacoes' as item, has_table_privilege('anon','public.organizacoes','select') as permitido
union all select 'anon lê a view pública', has_table_privilege('anon','public.v_organizacoes_publicas','select')
union all select 'anon executa a busca', has_function_privilege('anon','public.buscar_organizacoes(text, smallint[], integer, smallint[], smallint[], smallint[], smallint[], boolean, integer, integer)','execute');
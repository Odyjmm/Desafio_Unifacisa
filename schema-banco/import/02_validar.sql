select count(*) as linhas_no_csv,
       (select count(*) from importacao.v_problemas where severidade = 'ERRO')  as erros,
       (select count(*) from importacao.v_problemas where severidade = 'AVISO') as avisos
from importacao.staging_organizacoes;

select linha, severidade, campo, mensagem, valor
from importacao.v_problemas
order by (severidade = 'ERRO') desc, linha, campo;

select m.nome as municipio, p.bairro_txt as bairro, count(*) as organizacoes
from importacao.v_parsed p
join public.municipios m on m.id = p.municipio_id
where p.bairro_txt is not null
group by m.nome, p.bairro_txt
order by m.nome, p.bairro_txt;
# Banco de Demandas Local Multissetorial

> Aplicação web para mapeamento, consulta e visualização georreferenciada de possíveis organizações parceiras na Região Metropolitana de Campina Grande (PB), subsidiando ações de ensino, pesquisa e extensão da UNIFACISA.

**Status:** Aplicação em desenvolvimento e base de dados sendo consolidada

---

## Sobre o projeto

Este repositório contém a aplicação desenvolvida no âmbito do projeto de pesquisa **"CONSTRUÇÃO DE UM BANCO DE DEMANDAS SOCIAIS LOCAIS MULTISSETORIAL: ARTICULAÇÃO ENTRE PESQUISA E PROJETOS INTEGRADORES DA UNIFACISA"**.

### O problema

A curricularização da extensão universitária (Resolução CNE/CES nº 7/2018) exige parcerias com organizações da comunidade, mas não existe uma base de dados consolidada e confiável dessas organizações em Campina Grande e região. Isso dificulta o planejamento dos Projetos Integradores, a articulação em rede e a avaliação do impacto das ações extensionistas.

### A solução

Uma base de dados curada e georreferenciada, acompanhada de uma aplicação web que permite:

- visualizar as organizações em um **mapa interativo**;
- **filtrar e buscar** por município, bairro, área de atuação, natureza jurídica e público-alvo;
- **cadastrar e atualizar** registros (equipe de coleta);
- consultar **indicadores agregados** (organizações por bairro, por área etc.);
- **exportar** os dados para relatórios.

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Front-end e back-end | [Next.js](https://nextjs.org/) (React) com TypeScript |
| Banco de dados e API | [Supabase](https://supabase.com/) (PostgreSQL + PostGIS) |
| Mapa | [Leaflet](https://leafletjs.com/) / React-Leaflet |
| Geocodificação | [Nominatim](https://nominatim.org/) (OpenStreetMap) |
| Hospedagem | [Vercel](https://vercel.com/) |
| Versionamento | Git e GitHub |

---

## Modelo de dados

**Campos definidos pelo instrumento do NUPEX:** nome da instituição, natureza jurídica, área de atuação, município, bairro, público-alvo, ano de criação, contatos, responsável, redes sociais.

**Campos técnicos adicionais:** CNPJ (chave primária para verificação de duplicidade), CNAE primário e secundários, endereço completo, latitude/longitude.

---

## Fontes de dados

A coleta utiliza fontes secundárias públicas, entre elas:

- [Mapa das Organizações da Sociedade Civil (MOSC/IPEA)](https://mapaosc.ipea.gov.br)
- Cadastro Nacional da Pessoa Jurídica (CNPJ) - Receita Federal
- Sites institucionais e redes sociais das organizações
- Portais de transparência e conselhos municipais

---

## Instituição

**Centro Universitário UNIFACISA** - NUPEX (Núcleo de Pesquisa e Extensão)
Campina Grande, Paraíba, Brasil

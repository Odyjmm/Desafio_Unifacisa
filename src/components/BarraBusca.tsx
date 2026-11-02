"use client";
// Barra de busca do Início (visual do Figma): área e município vêm do banco; envia para /buscar.
import { useEffect, useState } from "react";
import { carregarListas, type Opcao } from "@/lib/api";

const campo = "w-full appearance-none bg-transparent text-[15px] text-marinho outline-none placeholder:text-marinho/70 font-[family-name:var(--font-poppins)]";
const rotulo = "mb-0.5 block text-[12.5px] font-bold uppercase tracking-wide text-marinho";

export default function BarraBusca() {
  const [areas, setAreas] = useState<Opcao[]>([]);
  const [municipios, setMunicipios] = useState<Opcao[]>([]);
  useEffect(() => { carregarListas().then((l) => { setAreas(l.areas); setMunicipios(l.municipios); }).catch(() => {}); }, []);
  return (
    <form action="/buscar" className="mx-auto mt-[19px] grid max-w-[1172px] gap-3 rounded-[30px] bg-white p-4 shadow-[0_8px_30px_rgba(2,42,103,0.14)] md:grid-cols-[400px_278px_273px_1fr] md:items-stretch md:gap-[11px] md:px-[14px] md:py-[14px]">
      <label className="block rounded-[22px] bg-fundo px-5 py-3"><span className={rotulo}>O que você procura?</span>
        <input name="q" className={campo} placeholder="Reforço escolar, horta comunitária..." /></label>
      <label className="block rounded-[22px] bg-fundo px-5 py-3"><span className={rotulo}>Área de atuação</span>
        <select name="area" className={campo}><option value="">Todas as áreas</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}</select></label>
      <label className="block rounded-[22px] bg-fundo px-5 py-3"><span className={rotulo}>Município</span>
        <select name="municipio" className={campo}><option value="">Toda a região</option>{municipios.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
      <button className="flex items-center justify-center gap-3 rounded-[22px] bg-azul px-6 text-[17px] font-bold text-white font-[family-name:var(--font-poppins)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>Buscar</button>
    </form>
  );
}

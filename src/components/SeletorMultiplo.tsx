"use client";

import { useEffect, useId, useRef, useState } from "react";

export type OpcaoSeletor = { id: number; nome: string; descricao?: string };

/** Campo que abre ao clicar e mostra as opções para marcar (com "V"); as escolhidas aparecem como etiquetas. */
export default function SeletorMultiplo({ opcoes, marcados, aoAlternar, placeholder, invalido }: {
  opcoes: OpcaoSeletor[];
  marcados: number[];
  aoAlternar: (id: number) => void;
  placeholder: string;
  invalido?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const idPainel = useId();

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!caixa.current?.contains(e.target as Node)) setAberto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", tecla); };
  }, [aberto]);

  const escolhidas = opcoes.filter((o) => marcados.includes(o.id));

  return (
    <div ref={caixa}>
      <button type="button" aria-expanded={aberto} aria-controls={idPainel} onClick={() => setAberto((v) => !v)}
        className={`botao-anim flex min-h-[48px] w-full items-center justify-between gap-3 rounded-[14px] border bg-white px-4 py-2.5 text-left text-[13px] text-marinho ${invalido ? "border-red-400" : aberto ? "border-azul" : "border-[#dfe5f1] hover:border-[#b9c6e6]"}`}>
        <span className={escolhidas.length ? "font-semibold" : "text-[#7a89a8]"}>
          {escolhidas.length ? `${escolhidas.length} selecionada${escolhidas.length === 1 ? "" : "s"} · ${aberto ? "fechar" : "ver mais"}` : placeholder}
        </span>
        <svg viewBox="0 0 16 16" className={`h-4 w-4 shrink-0 text-azul transition-transform ${aberto ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3.5 6l4.5 4.5L12.5 6" /></svg>
      </button>

      {aberto && (
        <ul id={idPainel} className="mt-2 max-h-[300px] space-y-1 overflow-y-auto rounded-[14px] border border-[#dfe5f1] bg-white p-2 shadow-[0_8px_24px_rgba(2,42,103,0.08)]">
          {opcoes.map((o) => {
            const on = marcados.includes(o.id);
            return (
              <li key={o.id}>
                <label className={`flex cursor-pointer items-start gap-3 rounded-[10px] px-3 py-2.5 text-[13px] leading-snug ${on ? "bg-[#eef3ff] font-semibold text-marinho" : "text-marinho hover:bg-fundo"}`}>
                  <input type="checkbox" className="peer sr-only" checked={on} onChange={() => aoAlternar(o.id)} />
                  <span aria-hidden className={`mt-px flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-azul/40 ${on ? "border-azul bg-azul" : "border-[#9aa8c7] bg-white"}`}>
                    <svg viewBox="0 0 16 16" className={`h-3 w-3 ${on ? "opacity-100" : "opacity-0"}`} fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.2 3.2L13 5" /></svg>
                  </span>
                  <span>{o.nome}{o.descricao && <span className="block text-[12px] font-normal text-[#5b6b8c]">{o.descricao}</span>}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {escolhidas.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {escolhidas.map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => aoAlternar(o.id)} title="Remover"
                className="botao-anim inline-flex items-center gap-1.5 rounded-full bg-[#eef3ff] px-3 py-1 text-[12px] font-semibold text-marinho hover:bg-[#dde7ff]">
                {o.nome}<span aria-hidden className="text-azul">×</span><span className="sr-only">remover</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

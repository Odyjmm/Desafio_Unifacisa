"use client";
// Cabeçalho do desenho: pílula branca sobre o azul do topo de cada tela, com logo, navegação
// e botão "Cadastre sua instituição". Fica sobreposto (absolute) ao hero de cada página.
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { chamarApi } from "@/lib/api";

const LINKS = [
  { href: "/", texto: "Início" },
  { href: "/buscar", texto: "Buscar organizações" },
  { href: "/indicadores", texto: "Indicadores" },
];

export default function Cabecalho() {
  const caminho = usePathname();
  const [moderador, setModerador] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  // Guia, seção 6: GET /api/moderacao/eu decide se mostramos o item "Administrador".
  useEffect(() => {
    chamarApi("/api/moderacao/eu").then((r) => setModerador(r.corpo.moderador === true));
  }, [caminho]);

  const inicio = caminho === "/";
  const itens = moderador || caminho === "/administrador" ? [...LINKS, { href: "/administrador", texto: "Administrador" }] : LINKS;

  // Fecha o menu ao trocar de página, ao apertar Esc ou quando a janela fica larga.
  useEffect(() => { setMenuAberto(false); }, [caminho]);
  useEffect(() => {
    const fechar = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuAberto(false); };
    const largura = () => { if (window.innerWidth >= 1024) setMenuAberto(false); };
    window.addEventListener("keydown", fechar);
    window.addEventListener("resize", largura);
    return () => { window.removeEventListener("keydown", fechar); window.removeEventListener("resize", largura); };
  }, []);

  return (
    <header className="absolute inset-x-0 top-0 z-[1000] font-[family-name:var(--font-poppins)]">
      <div className={`mx-auto max-w-[1280px] px-3 sm:px-5 ${inicio ? "pt-4 sm:pt-[30px] lg:px-[44px]" : "pt-3 sm:pt-[22px] lg:px-[22px]"}`}>
        <div className={`relative flex items-center justify-between gap-2 rounded-full bg-white pl-4 pr-2 shadow-[0_6px_24px_rgba(2,42,103,0.10)] sm:pl-5 sm:pr-[10px] ${inicio ? "h-[56px] sm:h-[62px] lg:pl-[75px]" : "h-[54px] sm:h-[58px] lg:pl-[22px]"}`}>
          <Link href="/" aria-label="Desafio Unifacisa — início" className="shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95">
            <Image src="/img/logo-desafio.svg" alt="Desafio Unifacisa" width={118} height={40} priority className="h-8 w-auto sm:h-10" />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {itens.map((l) => (
              <Link key={l.href} href={l.href}
                className={`link-anim rounded-full px-[14px] py-[7px] text-[15px] font-medium hover:-translate-y-0.5 ${caminho === l.href ? "bg-lavanda text-white" : "text-marinho hover:bg-fundo"}`}>
                {l.texto}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/cadastro" className="botao-anim rounded-full bg-[#1d2a6c] px-3 py-2.5 text-center text-[12px] font-semibold leading-tight text-white sm:px-[18px] sm:py-[11px] sm:text-[14px]">
              <span className="sm:hidden">Cadastre-se</span><span className="hidden sm:inline">Cadastre sua instituição</span>
            </Link>
            <button type="button" aria-label={menuAberto ? "Fechar menu" : "Abrir menu"} aria-expanded={menuAberto} aria-controls="menu-mobile"
              onClick={() => setMenuAberto((v) => !v)}
              className="botao-anim flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fundo text-marinho lg:hidden">
              <span className="relative block h-3.5 w-5" aria-hidden>
                <span className={`absolute left-0 h-0.5 w-5 rounded bg-current transition-all duration-300 ${menuAberto ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 top-1.5 h-0.5 w-5 rounded bg-current transition-all duration-200 ${menuAberto ? "opacity-0" : "opacity-100"}`} />
                <span className={`absolute left-0 h-0.5 w-5 rounded bg-current transition-all duration-300 ${menuAberto ? "top-1.5 -rotate-45" : "top-3"}`} />
              </span>
            </button>
          </div>
        </div>
        {menuAberto && (
          <nav id="menu-mobile" aria-label="Menu" className="anim-menu mt-2 overflow-hidden rounded-[28px] bg-white p-2 shadow-[0_12px_32px_rgba(2,42,103,0.18)] lg:hidden">
            {itens.map((l) => (
              <Link key={l.href} href={l.href}
                className={`link-anim block rounded-full px-5 py-3 text-[15px] font-medium ${caminho === l.href ? "bg-lavanda text-white" : "text-marinho hover:bg-fundo active:bg-fundo"}`}>
                {l.texto}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

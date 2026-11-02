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

  // Guia, seção 6: GET /api/moderacao/eu decide se mostramos o item "Administrador".
  useEffect(() => {
    chamarApi("/api/moderacao/eu").then((r) => setModerador(r.corpo.moderador === true));
  }, [caminho]);

  const inicio = caminho === "/";
  const itens = moderador || caminho === "/administrador" ? [...LINKS, { href: "/administrador", texto: "Administrador" }] : LINKS;
  return (
    <header className="absolute inset-x-0 top-0 z-[1000] font-[family-name:var(--font-poppins)]">
      <div className={`mx-auto max-w-[1280px] px-3 ${inicio ? "pt-[30px] md:px-[44px]" : "pt-[22px] md:px-[22px]"}`}>
        <div className={`flex items-center justify-between rounded-full bg-white pl-5 pr-[10px] shadow-[0_6px_24px_rgba(2,42,103,0.10)] ${inicio ? "h-[62px] md:pl-[75px]" : "h-[58px] md:pl-[22px]"}`}>
          <Link href="/" aria-label="Desafio Unifacisa — início">
            <Image src="/img/logo-desafio.svg" alt="Desafio Unifacisa" width={118} height={40} priority className="h-10 w-auto" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {itens.map((l) => (
              <Link key={l.href} href={l.href}
                className={`rounded-full px-[14px] py-[7px] text-[15px] font-medium ${caminho === l.href ? "bg-lavanda text-white" : "text-marinho hover:bg-fundo"}`}>
                {l.texto}
              </Link>
            ))}
          </nav>
          <Link href="/cadastro" className="rounded-full bg-[#1d2a6c] px-[18px] py-[11px] text-[14px] font-semibold text-white">Cadastre sua instituição</Link>
        </div>
      </div>
    </header>
  );
}

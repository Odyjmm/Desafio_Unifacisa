import type { Metadata } from "next";
import { Albert_Sans, Poppins } from "next/font/google";
import "./globals.css";
import Cabecalho from "@/components/Cabecalho";

// Fonte do desenho no Figma.
const albert = Albert_Sans({ variable: "--font-albert", subsets: ["latin"] });
// Cabeçalho e botões do desenho usam uma geométrica tipo Poppins.
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Desafio UNIFACISA — Mapa das parcerias",
  description: "Conectando demandas a soluções inovadoras: encontre organizações do terceiro setor da Região Metropolitana de Campina Grande.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${albert.variable} ${poppins.variable}`}>
      <body className="min-h-screen antialiased">
        <Cabecalho />
        {children}
      </body>
    </html>
  );
}

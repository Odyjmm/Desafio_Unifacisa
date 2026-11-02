import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } } },

  // Guia do backend, seção 2: em desenvolvimento não temos a chave secreta do servidor,
  // então as chamadas /api são redirecionadas ao site publicado.
  // API_PROXY_URL só vai no .env.local — NUNCA defina na Vercel.
  async rewrites() {
    const alvo = process.env.API_PROXY_URL;
    if (!alvo) return [];
    return { beforeFiles: [{ source: "/api/:path*", destination: `${alvo}/api/:path*` }] };
  },
};

export default nextConfig;

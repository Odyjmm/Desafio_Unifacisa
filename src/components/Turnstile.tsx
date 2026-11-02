"use client";
// Widget Cloudflare Turnstile (usa só a Site Key pública). Sem chave configurada, não aparece
// (em desenvolvimento o servidor aceita; em produção o envio exige o token).
import { useEffect, useRef } from "react";

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void } } }

export default function Turnstile({ aoValidar }: { aoValidar: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const chave = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    if (!chave || !ref.current) return;
    let id: string | undefined;
    const montar = () => { if (ref.current && window.turnstile) id = window.turnstile.render(ref.current, { sitekey: chave, callback: aoValidar, "expired-callback": () => aoValidar("") }); };
    if (window.turnstile) montar();
    else {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true; s.onload = montar; document.head.appendChild(s);
    }
    return () => { if (id && window.turnstile) window.turnstile.remove(id); };
  }, [chave, aoValidar]);
  return chave ? <div ref={ref} /> : null;
}

"use client";
// Mapa da busca (estilo Google Maps claro): bolhas por município (resumo_mapa_municipios)
// e, ao aproximar, pontos individuais das organizações (marcadores_mapa). Guia, seção 3 e 4.
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useState } from "react";
import type { Marcador, ResumoMunicipio } from "@/lib/api";

const CENTRO_RMCG: [number, number] = [-7.2, -35.9]; // Região Metropolitana de Campina Grande

/** Bolha numerada: tamanho cresce com a quantidade; a maior (Campina Grande) fica azul-marinho. */
function bolha(m: ResumoMunicipio, maior: number) {
  const d = Math.round(26 + 36 * Math.sqrt(m.total / Math.max(1, maior)));
  const cor = m.total === maior ? "#022a67" : "#1555f0";
  return L.divIcon({
    className: "",
    iconSize: [d, d + 18], iconAnchor: [d / 2, d / 2],
    html: `<div style="display:flex;flex-direction:column;align-items:center;font-family:inherit">
      <div style="width:${d}px;height:${d}px;border-radius:50%;background:${cor};border:3px solid #fff;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${d > 40 ? 16 : 12}px;box-shadow:0 2px 8px rgba(2,42,103,.35)">${m.total}</div>
      <span style="margin-top:2px;font-size:10px;font-weight:700;color:#022a67;text-shadow:0 0 3px #fff,0 0 3px #fff;white-space:nowrap">${m.municipio}</span></div>`,
  });
}

function Zoom({ aoMudar }: { aoMudar: (z: number) => void }) {
  const mapa = useMap();
  useMapEvents({ zoomend: () => aoMudar(mapa.getZoom()) });
  return null;
}
function Controles() {
  const mapa = useMap();
  const b = "flex h-10 w-10 items-center justify-center bg-white text-lg font-bold text-marinho transition-colors duration-150 hover:bg-fundo active:bg-[#e4ebfb]";
  return (
    <div className="absolute right-3 top-3 z-[500] overflow-hidden rounded-xl shadow-md">
      <button aria-label="Aproximar" className={b} onClick={() => mapa.zoomIn()}>+</button>
      <button aria-label="Afastar" className={`${b} border-t border-[#e4e9f5]`} onClick={() => mapa.zoomOut()}>−</button>
    </div>
  );
}

export default function MapaBusca({ municipios, marcadores, selecionado, aoSelecionar, aoClicarMunicipio }: {
  municipios: ResumoMunicipio[]; marcadores: Marcador[]; selecionado: string | null;
  aoSelecionar: (id: string) => void; aoClicarMunicipio: (id: number) => void;
}) {
  const [zoom, setZoom] = useState(10);
  const maior = Math.max(1, ...municipios.map((m) => m.total));
  return (
    <MapContainer center={CENTRO_RMCG} zoom={10} zoomControl={false} scrollWheelZoom className="h-full min-h-[440px] w-full rounded-[22px] sm:min-h-[560px] bg-[#dfe8fb]">
      <TileLayer attribution="&copy; OpenStreetMap &copy; CARTO" url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      <Zoom aoMudar={setZoom} />
      <Controles />
      {zoom < 12 && municipios.filter((m) => m.latitude && m.longitude).map((m) => (
        <Marker key={m.municipio_id} position={[m.latitude, m.longitude]} icon={bolha(m, maior)} eventHandlers={{ click: () => aoClicarMunicipio(m.municipio_id) }} />
      ))}
      {zoom >= 12 && marcadores.map((m) => (
        <CircleMarker key={m.id} center={[m.latitude, m.longitude]} radius={selecionado === m.id ? 11 : 7}
          pathOptions={{ color: "#fff", weight: 2, fillColor: selecionado === m.id ? "#022a67" : "#1555f0", fillOpacity: 1 }}
          eventHandlers={{ click: () => aoSelecionar(m.id) }}><Tooltip>{m.nome}</Tooltip></CircleMarker>
      ))}
    </MapContainer>
  );
}

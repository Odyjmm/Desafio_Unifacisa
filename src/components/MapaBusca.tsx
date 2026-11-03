"use client";
// Mapa da busca: bolhas por município (resumo_mapa_municipios) e, ao aproximar, pontos individuais
// das organizações (marcadores_mapa). Guia, seção 3 e 4.
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Marcador, ResumoMunicipio } from "@/lib/api";

const CENTRO_RMCG: [number, number] = [-7.2, -35.9]; // Região Metropolitana de Campina Grande
const ZOOM_PONTOS = 12; // a partir daqui aparecem as organizações uma a uma

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** Bolha numerada: o tamanho cresce com a quantidade; a maior (Campina Grande) fica azul-marinho.
 *  Município sem registros vira um anel vazio, igual à legenda. */
function bolha(m: ResumoMunicipio, maior: number, mostrarNome: boolean) {
  if (m.total === 0) {
    return L.divIcon({
      className: "mapa-bolha",
      iconSize: [18, 18], iconAnchor: [9, 9],
      html: `<div style="width:18px;height:18px;border-radius:50%;border:2px solid #9aa8c7;background:rgba(255,255,255,.85)"></div>`,
    });
  }
  const d = Math.round(24 + 30 * Math.sqrt(m.total / Math.max(1, maior)));
  const cor = m.total === maior ? "#022a67" : "#1555f0";
  const nome = mostrarNome || d >= 46
    ? `<span class="mapa-bolha-nome">${esc(m.municipio)}</span>` : "";
  return L.divIcon({
    className: "mapa-bolha",
    iconSize: [d, d], iconAnchor: [d / 2, d / 2],
    html: `<div class="mapa-bolha-num" style="width:${d}px;height:${d}px;background:${cor};font-size:${d > 40 ? 15 : 12}px">${m.total}</div>${nome}`,
  });
}

/** Câmera: enquadra os municípios com registros, acompanha o tamanho da caixa e voa até a organização escolhida. */
function Camera({ municipios, marcadores, selecionado, aoMudarZoom }: {
  municipios: ResumoMunicipio[]; marcadores: Marcador[]; selecionado: string | null; aoMudarZoom: (z: number) => void;
}) {
  const mapa = useMap();
  const ultimoSel = useRef<string | null>(null);

  const enquadrar = useCallback(() => {
    const pts = municipios.filter((m) => m.total > 0 && m.latitude && m.longitude).map((m) => [m.latitude, m.longitude] as [number, number]);
    if (pts.length === 0) { mapa.setView(CENTRO_RMCG, 10); return; }
    if (pts.length === 1) { mapa.setView(pts[0], 12); return; }
    mapa.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 12 });
  }, [mapa, municipios]);

  // Reenquadra quando os filtros mudam os municípios.
  useEffect(() => { enquadrar(); }, [enquadrar]);

  // A caixa do mapa muda de tamanho (carregamento, janela, rotação do celular): recalcula sem deixar o mapa torto.
  useEffect(() => {
    const el = mapa.getContainer();
    const ro = new ResizeObserver(() => mapa.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [mapa]);

  // Clicar numa organização da lista leva o mapa até ela.
  useEffect(() => {
    if (!selecionado) { ultimoSel.current = null; return; }
    if (selecionado === ultimoSel.current) return;
    ultimoSel.current = selecionado;
    const m = marcadores.find((x) => x.id === selecionado);
    if (m) mapa.flyTo([m.latitude, m.longitude], Math.max(mapa.getZoom(), 15), { duration: 0.8 });
  }, [selecionado, marcadores, mapa]);

  useMapEvents({ zoomend: () => aoMudarZoom(mapa.getZoom()) });

  const b = "flex h-10 w-10 items-center justify-center bg-white text-lg font-bold text-marinho transition-colors duration-150 hover:bg-fundo active:bg-[#e4ebfb]";
  return (
    <div className="absolute right-3 top-3 z-[500] overflow-hidden rounded-xl shadow-md">
      <button type="button" aria-label="Aproximar" className={b} onClick={() => mapa.zoomIn()}>+</button>
      <button type="button" aria-label="Afastar" className={`${b} border-t border-[#e4e9f5]`} onClick={() => mapa.zoomOut()}>−</button>
      <button type="button" aria-label="Mostrar toda a região" title="Mostrar toda a região" className={`${b} border-t border-[#e4e9f5] text-base`} onClick={enquadrar}>⤢</button>
    </div>
  );
}

export default function MapaBusca({ municipios, marcadores, selecionado, aoSelecionar, aoClicarMunicipio }: {
  municipios: ResumoMunicipio[]; marcadores: Marcador[]; selecionado: string | null;
  aoSelecionar: (id: string) => void; aoClicarMunicipio: (id: number) => void;
}) {
  const [zoom, setZoom] = useState(10);
  const maior = Math.max(1, ...municipios.map((m) => m.total));
  const comCoord = municipios.filter((m) => m.latitude && m.longitude);
  const pontos = zoom >= ZOOM_PONTOS ? marcadores : marcadores.filter((m) => m.id === selecionado);

  return (
    <MapContainer center={CENTRO_RMCG} zoom={10} zoomControl={false} scrollWheelZoom minZoom={8} maxZoom={18}
      className="h-full min-h-[440px] w-full rounded-[22px] bg-[#e9eef8] sm:min-h-[560px]">
      <TileLayer className="mapa-claro" maxZoom={19} attribution="&copy; Colaboradores do OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Camera municipios={municipios} marcadores={marcadores} selecionado={selecionado} aoMudarZoom={setZoom} />
      {zoom < ZOOM_PONTOS && comCoord.map((m) => (
        <Marker key={m.municipio_id} position={[m.latitude, m.longitude]} icon={bolha(m, maior, zoom >= 11)}
          // Bolhas menores ficam por cima das maiores, para não esconder nenhuma.
          zIndexOffset={m.total === 0 ? 500 : 1000 - Math.round(m.total / maior * 500)}
          eventHandlers={{ click: () => m.total > 0 && aoClicarMunicipio(m.municipio_id) }}>
          <Tooltip direction="top" offset={[0, -8]}>
            <b>{m.municipio}</b><br />{m.total === 0 ? "Sem registros ainda" : (m.total > 1 ? `${m.total} organizações` : "1 organização")}
          </Tooltip>
        </Marker>
      ))}
      {pontos.map((m) => (
        <CircleMarker key={m.id} center={[m.latitude, m.longitude]} radius={selecionado === m.id ? 12 : 8}
          pathOptions={{ color: "#fff", weight: 2.5, fillColor: selecionado === m.id ? "#022a67" : "#1555f0", fillOpacity: 1 }}
          eventHandlers={{ click: () => aoSelecionar(m.id) }}><Tooltip direction="top" offset={[0, -6]}>{m.nome}</Tooltip></CircleMarker>
      ))}
    </MapContainer>
  );
}

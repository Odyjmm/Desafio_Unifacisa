"use client";
// Mapa do cadastro: pino arrastável (estilo Uber/iFood) que preenche latitude e longitude.
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Ícone embutido em SVG (evita depender dos PNGs padrão do Leaflet, que o bundler não resolve).
const icone = L.divIcon({
  className: "",
  html: '<svg width="30" height="40" viewBox="0 0 30 40"><path d="M15 0C7 0 0 6.5 0 14.5 0 25 15 40 15 40s15-15 15-25.500C30 6.500 23 0 15 0z" fill="#1555f0"/><circle cx="15" cy="14.500" r="5.500" fill="#fff"/></svg>',
  iconSize: [30, 40], iconAnchor: [15, 40],
});

function Cliques({ aoMover }: { aoMover: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => aoMover(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function MapaPino({ lat, lng, aoMover }: { lat: number; lng: number; aoMover: (lat: number, lng: number) => void }) {
  return (
    <MapContainer center={[lat, lng]} zoom={14} className="h-72 w-full rounded-2xl" key={`${lat.toFixed(3)}`}>
      <TileLayer attribution="&copy; OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Cliques aoMover={aoMover} />
      <Marker position={[lat, lng]} icon={icone} draggable
        eventHandlers={{ dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); aoMover(p.lat, p.lng); } }} />
    </MapContainer>
  );
}

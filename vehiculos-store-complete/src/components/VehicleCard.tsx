import type { Vehicle } from "../types/vehicle";
import React, { useMemo } from "react";

// ── util de formato
const fmtMoney = (n: number) => `RD$${Math.round(n || 0).toLocaleString("es-DO")}`;

// ── estimación de cuota 
const DEFAULTS = { downPct: 0.20, term: 36, apr: 22 }; // 20% inicial, 36 meses, 22% APR
function estimateMonthly(price: number) {
  const principal = Math.max(price * (1 - DEFAULTS.downPct), 0);
  const r = DEFAULTS.apr / 100 / 12;
  return r > 0
    ? (principal * (r * Math.pow(1 + r, DEFAULTS.term))) / (Math.pow(1 + r, DEFAULTS.term) - 1)
    : principal / DEFAULTS.term;
}

// ── Iconos inline 
const CalendarIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const OdoIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 12l4-3M6 12h2M16 12h2M12 6v2M12 16v2" />
  </svg>
);
const PinIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2a6 6 0 0 0-6 6c0 4.8 5 10.2 5.6 10.8.23.25.57.25.8 0C13 18.2 18 12.8 18 8a6 6 0 0 0-6-6zm0 8.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
  </svg>
);

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const isNew = vehicle.condition === "Nuevo";
  const img = vehicle.photos?.[0];
  const price = Number(vehicle.price) || 0;

  const monthly = useMemo(() => estimateMonthly(price), [price]);

  const goFinance = () => {
    localStorage.setItem("lastVehicleId", vehicle.id);
    location.assign(`#/financing?id=${vehicle.id}`);
  };
  const goDetails = () => {
    localStorage.setItem("lastVehicleId", vehicle.id);
    location.assign(`#/vehicle?id=${vehicle.id}`);
  };

  return (
    <article className="group min-w-[226px] rounded-2xl border border-[--border] bg-[--surface] overflow-hidden shadow-card text-[--text]">
      {/* Imagen */}
      <button onClick={goDetails} className="block w-full overflow-hidden relative">
        <div className="relative aspect-[4/3]"> 
          {img ? ( 
            <img
              src={img}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-[--muted]">Sin imagen</div>
          )}

          {/* overlay suave */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.00) 50%, rgba(0,0,0,0.25) 100%)" }}
          />

          {/* etiquetas */}
          <div className="absolute top-3 left-3 flex gap-2">
            {vehicle.condition && (
              <span
                className={`px-2 py-1 rounded-full text-[11px] font-medium border ${
                  isNew
                    ? "backdrop-blur-sm bg-green-800/85 text-white border-white/30"
                    : "backdrop-blur-sm bg-gray-600/70 text-[--text] border-white/30"
                }`}
              >
                {vehicle.condition}
              </span>
            )}
            {vehicle.isFinanceable && (
              <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-blue-900/85 text-white border border-[--primary]/40">
                Financiable
              </span>
            )}
          </div>
        </div>
      </button>
      {/* Contenido */}
      <div className="p-4">
        {/* Título */}
        <h3 className="font-semibold text-[1.05rem] leading-tight">
          {vehicle.brand} {vehicle.model} {vehicle.year}
        </h3>

        {/* Precio grande */}
        <div className="mt-2 text-2xl font-extrabold tracking-tight">{fmtMoney(price)}</div>

        {/* Cuota estimada */}
        <div className="mt-1 text-sm">
          <span className="text-[--muted]">Cuota estimada</span>{" "}
          <span className="text-[--muted]">{fmtMoney(monthly)}/mes</span>
        </div>

        {/* Año / km / ubicación */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
          {/* Año = 1/3 (mínimo interno) */}
          <div className="sm:col-span-1 flex items-center gap-2 whitespace-nowrap min-w-[90px]">
            <CalendarIcon className="w-4 h-4 shrink-0" />
            {vehicle.year || "N/D"}
          </div>

          {/* Kilometraje = 2/3 (mínimo para “100,000 km”) */}
          <div className="sm:col-span-2 flex items-center gap-2 whitespace-nowrap min-w-[150px] sm:justify-c">
            <OdoIcon className="w-4 h-4 shrink-0" />
            {(vehicle.mileageKm ?? 0).toLocaleString("es-DO")} km
          </div>

          {/* Ubicación = fila completa */}
          <div className="col-span-1 sm:col-span-3 flex items-center gap-2 mt-1">
            <PinIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">{vehicle.location || "—"}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={goFinance}
            className="flex-1 px-3 py-2 rounded-xl bg-[--primary] text-[--primary-contrast] hover:bg-[blue]/50"
          >
            Financiar
          </button>
          <button
            onClick={goDetails}
            className="px-4 py-2 rounded-xl border border-[--border] hover:bg-[--bg]"
          >
            Detalles
          </button>
        </div>
      </div>
    </article>
  );
}

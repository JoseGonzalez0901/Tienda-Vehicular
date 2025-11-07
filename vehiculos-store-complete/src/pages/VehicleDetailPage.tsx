import React, { useEffect, useMemo, useState } from "react";
import { fetchVehicleById, fetchRelated } from "../lib/api";
import type { Vehicle } from "../types/vehicle";

// allow using the <model-viewer> web component in JSX/TSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": any;
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Utilidades
// ───────────────────────────────────────────────────────────────────────────────
function currency(n: number) {
  if (!Number.isFinite(n)) return "RD$ 0";
  return "RD$ " + Math.round(n).toLocaleString("es-DO");
}

function SpecItem({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "" || value === "N/A") return null;
  return (
    <div className="flex items-center justify-between rounded-xl border border-[--border] bg-[--surface] px-3 py-2">
      <span className="text-[--muted] text-sm">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 rounded-lg text-xs bg-[--bg] border border-[--border]">
      {children}
    </span>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Mini calculadora (resumen) para la columna derecha
// ───────────────────────────────────────────────────────────────────────────────
type Commission = { type: "percent" | "amount"; value: number };
type CalcData = {
  price: number;
  downPct: number;
  term: number;
  apr: number;
  commission: Commission;
  insurance: number;
  itbisOnCommission: boolean;
  balloonPct: number;
};

function useMiniCalc(d: CalcData) {
  const r = d.apr / 100 / 12;               // tasa mensual
  const down = d.price * (d.downPct / 100); // inicial
  const balloon = d.price * (d.balloonPct / 100);
  const principal = Math.max(d.price - down - balloon, 0);
  const n = Math.max(1, d.term);

  const base =
    r > 0
      ? (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
      : principal / n;

  const commissionBase = d.commission.type === "percent" ? d.price * (d.commission.value / 100) : d.commission.value;
  const commissionMonthly = commissionBase / n;
  const itbisMonthly = d.itbisOnCommission ? commissionMonthly * 0.18 : 0;

  const monthly = base + d.insurance + commissionMonthly + itbisMonthly;
  const total = monthly * n + down + balloon;

  return {
    monthly,
    principal,
    effectiveMonthlyRate: r * 100,
    totalCost: total,
    base,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Página de Detalles
// ───────────────────────────────────────────────────────────────────────────────
export default function VehicleDetailPage({ vehicleId }: { vehicleId: string }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [related, setRelated] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [tab, setTab] = useState<"fotos" | "3d" | "video">("fotos");
  const [mainPhotoIdx, setMainPhotoIdx] = useState(0);

  // Mini calculadora (valores default tomados del vehículo)
  const [calc, setCalc] = useState<CalcData>({
    price: 0,
    downPct: 20,
    term: 36,
    apr: 22,
    commission: { type: "percent", value: 1 },
    insurance: 9000,
    itbisOnCommission: false,
    balloonPct: 0,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        if (!vehicleId) throw new Error("Falta el parámetro id. Ej: #/vehicle?id=veh-002");
        const v = await fetchVehicleById(vehicleId);
        if (!active) return;
        setVehicle(v);
        setCalc((c) => ({ ...c, price: Number(v.price) || 0 }));
        fetchRelated(vehicleId).then((r) => active && setRelated(r || [])).catch(() => {});
        setMainPhotoIdx(0);
        setTab("fotos");
      } catch (e: any) {
        if (active) setErr(e?.message || "Error cargando");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [vehicleId]);

  const photos = useMemo(() => (Array.isArray(vehicle?.photos) ? vehicle!.photos.slice(0, 5) : []), [vehicle]);
  const has3D = !!vehicle?.model3dUrl;
  const hasVideo = !!vehicle?.videoUrl;

  const result = useMiniCalc(calc);

  if (loading) return <div className="container mx-auto px-4 py-10">Cargando detalle…</div>;
  if (err) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">No se pudo cargar</h1>
        <p className="text-[--muted] mt-2">{err}</p>
        <a href="#/home" className="inline-block mt-4 px-4 py-2 rounded-xl bg-[--primary] text-[--primary-contrast]">Volver al inicio</a>
      </div>
    );
  }
  if (!vehicle) return null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-[--muted] flex items-center gap-2">
        <a href="#/home" className="hover:text-[--text]">Inicio</a>
        <span>›</span>
        <a href="#/home" className="hover:text-[--text]">Catálogo</a>
        <span>›</span>
        <span className="text-[--text] font-medium">{vehicle.brand} {vehicle.model}</span>
      </nav>

      {/* Título + precio + ubicación */}
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold">{vehicle.brand} {vehicle.model} {vehicle.year}</h1>
        <div className="text-xl font-bold mt-1">RD$ {Number(vehicle.price).toLocaleString("es-DO")}</div>
        {/* Ubicación con icono */}
        <div className="mt-1 flex items-center gap-1.5 text-sm text-[--muted]">
           <span className="material-symbols-outlined text-[--muted] text-sm">location_on</span>
          <span>{vehicle.location || "Ubicación desconocida"}</span>
        </div>
      </header>

      {/* Grid principal */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Columna izquierda (50/50): Media + descripción + chips + garantías */}
        <div className="space-y-6">  {/* columna izquierda */}  
          {/* Tabs de media */}
          <div className="rounded-2xl border border-[--border] bg-[--surface]">
            {/* Tabs */}
            <div className="flex items-center gap-2 px-4 pt-3">
              {["fotos", "3d", "video"].map((t) => (
                <button
                  key={t}
                  className={`px-3 py-1.5 rounded-lg text-sm ${tab === t ? "bg-[--bg] border border-[--border]" : "text-[--muted]"}`}
                  onClick={() => setTab(t as any)}
                >
                  {t === "fotos" ? "Fotos" : t.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* Contenido de cada tab */}
              {tab === "fotos" && (
                <>
                  {/* Foto principal */}
                  <div className="relative rounded-xl overflow-hidden border border-[--border] bg-[--bg]">
                    {photos[mainPhotoIdx] ? (
                      <img
                        src={photos[mainPhotoIdx]}
                        alt={`${vehicle.brand} ${vehicle.model} ${mainPhotoIdx + 1}`}
                        className="w-full h-[260px] md:h-[360px] object-cover"
                      />
                    ) : (
                      <div className="w-full h-[260px] md:h-[360px] grid place-items-center text-[--muted]">Sin fotos</div>
                    )}
                    {photos.length > 0 && (
                      <div className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded-lg bg-[--surface]/80 border border-[--border]">
                        {mainPhotoIdx + 1}/{photos.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {photos.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setMainPhotoIdx(i)}
                        className={`w-20 h-14 rounded-lg overflow-hidden border ${i === mainPhotoIdx ? "border-[--primary]" : "border-[--border]"}`}
                        title={`Foto ${i + 1}`}
                      >
                        <img src={src} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {tab === "3d" && (
                <div className="rounded-xl overflow-hidden border border-[--border] bg-[--bg] grid place-items-center h-[260px] md:h-[360px]">
                  {has3D ? (
                    //  script de model-viewer en index.html
                    // <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"></script>
                    <model-viewer
                      src={vehicle.model3dUrl!}
                      alt={`${vehicle.brand} ${vehicle.model} 3D`}
                      auto-rotate
                      camera-controls
                      style={{ width: "100%", height: "100%", background: "transparent" }}
                    />
                  ) : (
                    <div className="text-[--muted]">Sin modelo 3D</div>
                  )}
                </div>
              )}

              {tab === "video" && (
                <div className="rounded-xl overflow-hidden border border-[--border] bg-[--bg]">
                  {hasVideo ? (
                    <video className="w-full h-[260px] md:h-[360px]" src={vehicle.videoUrl!} controls playsInline />
                  ) : (
                    <div className="w-full h-[260px] md:h-[360px] grid place-items-center text-[--muted]">Sin video</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Descripción del motor */}
          <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
            <h3 className="font-semibold mb-2">Descripción del Motor</h3>
            <p className="text-[--muted] leading-relaxed">
              {vehicle.description ||
                "Descripción no disponible para este modelo."}
            </p>
          </div>

          {/* Accesorios y características */}
          <div className="rounded-2xl border border-[--border] bg-[--surface] p-5 space-y-3">
            <h3 className="font-semibold">Accesorios y Características</h3>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(vehicle.accessories) && vehicle.accessories.length > 0
                ? vehicle.accessories.map((a, i) => <Chip key={`acc-${i}`}>{a}</Chip>)
                : <span className="text-sm text-[--muted]">Sin accesorios listados.</span>}
              {Array.isArray(vehicle.features) && vehicle.features.map((f, i) => (
                <Chip key={`fea-${i}`}>{f}</Chip>
              ))}
            </div>
          </div>

          {/* Confianza & Garantías */}
          <div className="rounded-2xl border border-[--border] bg-[--surface] p-5 space-y-4">
            {/* Título + icono */}
            <div className="flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-[--muted] text-sm">shield</span>
              Confianza & Garantías
            </div>

            <p className="text-[--muted] text-sm leading-relaxed">
              Tu tranquilidad es nuestra prioridad. Ofrecemos un servicio integral que va más allá de la venta, 
              con garantías sólidas y el respaldo de años de experiencia en el mercado automotriz dominicano.
            </p>

            {/* Items */}
            <div className="space-y-3">
              {/* Inspección rigurosa */}
              <div className="rounded-xl border border-[--border] p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[--muted] text-sm">verified_user</span>
                  <div>
                    <div className="font-semibold">Inspección Rigurosa</div>
                    <div className="text-sm text-[--muted]">
                      Cada vehículo pasa por una inspección de 150 puntos para garantizar su calidad y confiabilidad.
                    </div>
                  </div>
                </div>
              </div>

              {/* Respuesta rápida */}
              <div className="rounded-xl border border-[--border] p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[--muted] text-sm">acute</span>
                  <div>
                    <div className="font-semibold">Respuesta Rápida</div>
                    <div className="text-sm text-[--muted]">
                      Respondemos todas tus consultas en menos de 2 horas durante horario laboral.
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentación completa */}
              <div className="rounded-xl border border-[--border] p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[--muted] text-sm">assignment</span>
                  <div>
                    <div className="font-semibold">Documentación Completa</div>
                    <div className="text-sm text-[--muted]">
                      Todos los papeles en regla. Facilitamos el proceso de traspaso y financiamiento.
                    </div>
                  </div>
                </div>
              </div>

              {/* Soporte post-venta */}
              <div className="rounded-xl border border-[--border] p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[--muted] text-sm">support_agent</span>
                  <div>
                    <div className="font-semibold">Soporte Post-Venta</div>
                    <div className="text-sm text-[--muted]">
                      Acompañamiento completo después de la compra, incluyendo opciones de seguro y mantenimiento.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[--border]/60" />

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[--border] p-4 text-center">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-[--muted] text-sm">Vehículos Vendidos</div>
              </div>
              <div className="rounded-xl border border-[--border] p-4 text-center">
                <div className="text-2xl font-bold">4.8/5</div>
                <div className="text-[--muted] text-sm">Calificación Clientes</div>
              </div>
            </div>
          </div>

        </div>

        {/* Columna derecha (50/50): Especificaciones + mini calculadora */}
        <aside className="space-y-6">
          {/* Especificaciones Técnicas */}
          <div className="rounded-2xl border border-[--border] bg-[--surface] p-5 space-y-3">
            <h3 className="font-semibold">Especificaciones Técnicas</h3>
            <div className="grid gap-2">
              <SpecItem label="Año" value={vehicle.year} />
              <SpecItem label="Kilometraje" value={typeof vehicle.mileageKm === "number" ? `${vehicle.mileageKm.toLocaleString()} km` : "0 km"} />
              <SpecItem label="Motor" value={`${vehicle.engine || "N/A"} ${vehicle.fuel ? ` ${vehicle.fuel}` : ""}`} />
              <SpecItem label="Combustible" value={vehicle.fuel} />
              <SpecItem label="Transmisión" value={vehicle.transmission} />
              <SpecItem label="Tracción" value={vehicle.drive ? `Tracción ${vehicle.drive}` : undefined} />
              <SpecItem label="Potencia" value={vehicle.powerHp ? `${vehicle.powerHp} hp` : undefined} />
              <SpecItem label="Torque" value={vehicle.torqueNm ? `${vehicle.torqueNm} Nm` : undefined} />
              <SpecItem label="Consumo" value={vehicle.consumption} />
              <SpecItem label="Puertas" value={vehicle.doors} />
              <SpecItem label="Asientos" value={vehicle.seats} />
              <SpecItem label="Color" value={vehicle.color} />
            </div>
          </div>

          {/* Calculadora resumida */}
          <div className="rounded-2xl border border-[--border] bg-[--surface] p-5 space-y-4">
            <h3 className="font-semibold">Calculadora de Financiamiento</h3>

            <div className="space-y-1">
              <label className="text-xs text-[--muted]">Precio del Vehículo (RD$)</label>
              <input
                type="number"
                value={calc.price}
                onChange={(e) => setCalc({ ...calc, price: parseFloat(e.target.value) || 0 })}
                className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
              />
            </div>

            <div>
              <label className="text-xs text-[--muted]">Inicial</label>
              <div className="flex justify-between text-xs text-[--muted] mb-1">
                <span>Porcentaje: {calc.downPct.toFixed(1)}%</span>
                <span>Monto: {currency(calc.price * (calc.downPct / 100))}</span>
              </div>
              <input
                type="range"
                min={0} max={80} step={0.5}
                value={calc.downPct}
                onChange={(e) => setCalc({ ...calc, downPct: parseFloat(e.target.value) || 0 })}
                className="w-full"
              />
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <div className="text-xs text-[--muted] mb-1">Monto (RD$)</div>
                  <input
                    type="number"
                    value={Math.round(calc.price * (calc.downPct / 100))}
                    onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0;
                      const pct = calc.price ? (amount / calc.price) * 100 : 0;
                      setCalc({ ...calc, downPct: Math.max(0, Math.min(80, pct)) });
                    }}
                    className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
                  />
                </div>
                <div>
                  <div className="text-xs text-[--muted] mb-1">Porcentaje (%)</div>
                  <input
                    type="number"
                    min={0} max={80} step={0.5}
                    value={Number(calc.downPct.toFixed(1))}
                    onChange={(e) => setCalc({ ...calc, downPct: parseFloat(e.target.value) || 0 })}
                    className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-[--muted]">Plazo (meses)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[12, 18, 24, 36, 48, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => setCalc({ ...calc, term: m })}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${
                      calc.term === m ? "bg-[--primary] text-[--primary-contrast] border-transparent" : "bg-[--bg] border-[--border]"
                    }`}
                  >
                    {m} meses
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[--muted]">Tasa APR Anual (%)</label>
                <input
                  type="number"
                  value={calc.apr}
                  min={0} max={60} step={0.1}
                  onChange={(e) => setCalc({ ...calc, apr: parseFloat(e.target.value) || 0 })}
                  className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
                />
              </div>

              {/* Comisión (inline + switch %) */}
              <div className="space-y-2">
                {/* fila: label a la izquierda / switch a la derecha */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[--muted]">Comisión</label>

                  {/* Switch % ⇄ RD$ */}
                  <label className="inline-flex items-center gap-2 select-none">
                    <span className="text-xs text-[--muted]">%</span>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={calc.commission.type === "amount"}
                      onClick={() =>
                        setCalc({
                          ...calc,
                          commission: {
                            ...calc.commission,
                            type: calc.commission.type === "percent" ? "amount" : "percent",
                          },
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${calc.commission.type === "amount"
                          ? "bg-[--primary]"         // ON (RD$)
                          : "bg-[--bg] border border-[--border]"}`}  // OFF (%)
                    >
                      <span
                        className={`absolute h-5 w-5 rounded-full bg-white transition-transform
                          ${calc.commission.type === "amount" ? "translate-x-5" : "translate-x-0.5"}`}
                        style={{ boxShadow: "0 1px 2px rgba(0,0,0,.25)" }}
                      />
                    </button>

                    <span className="text-xs text-[--muted]">RD$</span>
                  </label>
                </div>

                {/* input de valor (respecta el modo seleccionado) */}
                <input
                  type="number"
                  value={calc.commission.value}
                  onChange={(e) =>
                    setCalc({
                      ...calc,
                      commission: {
                        ...calc.commission,
                        value: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
                  placeholder={calc.commission.type === "percent" ? "1" : "25000"}
                />
              </div>

              {/* <div>
                <label className="text-xs text-[--muted]">Comisión ({calc.commission.type === "percent" ? "%" : "RD$"})</label>
                <div className="flex gap-2 mb-1">
                  {/*<button
                    onClick={() => setCalc({ ...calc, commission: { ...calc.commission, type: "percent" } })}
                    className={`px-2 py-1 rounded-md border ${calc.commission.type === "percent" ? "bg-[--surface]" : "bg-[--bg] border-[--border]"}`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setCalc({ ...calc, commission: { ...calc.commission, type: "amount" } })}
                    className={`px-2 py-1 rounded-md border ${calc.commission.type === "amount" ? "bg-[--surface]" : "bg-[--bg] border-[--border]"}`}
                  >
                    RD$
                  </button>
                </div>
                <input
                  type="number"
                  value={calc.commission.value}
                  onChange={(e) => setCalc({ ...calc, commission: { ...calc.commission, value: parseFloat(e.target.value) || 0 } })}
                  className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
                />
              </div>*/}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[--muted]">Seguro Mensual (RD$)</label>
                <input
                  type="number"
                  value={calc.insurance}
                  onChange={(e) => setCalc({ ...calc, insurance: parseFloat(e.target.value) || 0 })}
                  className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="text-xs text-[--muted]">Balloon (%)</label>
                <input
                  type="number"
                  value={calc.balloonPct}
                  min={0} max={40} step={0.1}
                  onChange={(e) => setCalc({ ...calc, balloonPct: parseFloat(e.target.value) || 0 })}
                  className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={calc.itbisOnCommission}
                onChange={(e) => setCalc({ ...calc, itbisOnCommission: e.target.checked })}
              />
              Incluir ITBIS en comisiones
            </label>

            {/* Resultado breve */}
            <div className="rounded-xl bg-[--bg] border border-[--border] p-4 text-center">
              <div className="text-xs text-[--muted]">Cuota mensual estimada</div>
              <div className="text-2xl font-extrabold mt-1">{currency(result.monthly)}</div>
              <div className="grid grid-cols-3 gap-3 mt-4 text-center ">
                <div className="rounded-lg border border-[--border] p-3 ">
                  <div className="text-xs text-[--muted]">Tasa efectiva mensual</div>
                  <div className="font-semibold">{result.effectiveMonthlyRate.toFixed(2)}%</div>
                </div>
                <div className="rounded-lg border border-[--border] p-3">
                  <div className="text-xs text-[--muted]">Total financiado</div>
                  <div className="font-semibold">{currency(result.principal)}</div>
                </div>
                <div className="rounded-lg border border-[--border] p-3">
                  <div className="text-xs text-[--muted]">Costo total del préstamo</div>
                  <div className="font-semibold">{currency(result.totalCost)}</div>
                </div>
              </div>
              <div className="flex gap-2 justify-center mt-4">
                <a className="px-4 py-2 rounded-xl bg-[--primary] text-[--primary-contrast]" href="#/financing">Calculadora avanzada</a>
                <a className="px-4 py-2 rounded-xl border border-[--border]" target="_blank" href="https://wa.me/18090000000" rel="noreferrer">WhatsApp</a>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="rounded-2xl border border-[--border] bg-[--surface] p-5 space-y-4">
          <div className="font-semibold">Modelos relacionados</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((r) => (
              <a
                key={r.id}
                href={`#/vehicle?id=${r.id}`}
                className="rounded-2xl border border-[--border] bg-[--surface] p-3 hover:border-[--primary]"
              >
                <div className="aspect-video w-full rounded-xl bg-[--bg] overflow-hidden mb-2">
                  {r.photos?.[0] ? (
                    <img src={r.photos[0]} alt={`${r.brand} ${r.model}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[--muted]">Sin foto</div>
                  )}
                </div>
                <div className="text-sm font-semibold">{r.brand} {r.model}</div>
                <div className="text-xs text-[--muted]">{r.year}</div>
                <div className="text-sm font-bold mt-1">RD$ {Number(r.price).toLocaleString("es-DO")}</div>
              </a>
            ))}
          </div>
          <div className="text-center pt-2">
            <a href="#/home" className="px-4 py-2 rounded-xl border border-[--border]">Ver todos los vehículos</a>
          </div>
        </section>
      )}
    </div>
  );
}

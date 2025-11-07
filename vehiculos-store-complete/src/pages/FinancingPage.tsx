import React, { useEffect, useState } from "react";
import { fetchVehicleById, fetchRelated } from "../lib/api";

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  type?: string;
  condition?: string;
  isFinanceable?: boolean;
  mileageKm?: number;
  location?: string;
  photos?: string[];
  engine?: string;
  fuel?: string;
  transmission?: string;
  drive?: string;
  powerHp?: number;
  torqueNm?: number;
  consumption?: string;
  doors?: number;
  seats?: number;
  color?: string;
  accessories?: string[];
  features?: string[];
  description?: string;
  model3dUrl?: string;
  videoUrl?: string;
};

type Commission = { type: "percent" | "amount"; value: number };
type CalcData = {
  price: number;
  downPayment: number;
  downPaymentPercent: number;
  term: number; // meses
  apr: number;  // % anual
  commission: Commission;
  insurance: number; // RD$ mensual
  balloon: number;   // % del precio
  itbisOnCommission: boolean;
};

type Row = { m: number; interest: number; principal: number; base: number; insurance: number; balance: number };

function currency(n: number) {
  if (!isFinite(n)) return "RD$ 0";
  return "RD$ " + Math.round(n).toLocaleString("es-DO");
}

/** ─── Util: lee ?id= de hash (#/ruta?id=...) o de search (?id=...) ─── */
function getVehicleIdFromUrl(): string | null {
  const hash = location.hash || "";
  const hashQuery = hash.includes("?") ? hash.split("?")[1] : "";
  const fromHash = hashQuery ? new URLSearchParams(hashQuery).get("id") : null;

  const fromSearch = new URLSearchParams(location.search).get("id");

  return fromHash || fromSearch;
}

/** ─── Util: ID activo con prioridades URL → localStorage → default ─── */
function resolveActiveVehicleId(): string {
  const fromUrl = getVehicleIdFromUrl();
  const fromStorage = localStorage.getItem("lastVehicleId");
  return fromUrl || fromStorage || "veh-001";
}

function useFinancing(data: CalcData) {
  const r = data.apr / 100 / 12;
  const balloonAmt = (data.balloon / 100) * data.price;
  const principal = Math.max(data.price - data.downPayment - balloonAmt, 0);
  const n = Math.max(1, data.term);

  const base =
    r > 0
      ? (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
      : principal / n;

  const commissionBase =
    data.commission.type === "percent"
      ? data.price * (data.commission.value / 100)
      : data.commission.value;

  const commissionMonthly = commissionBase / n;
  const itbisMonthly = data.itbisOnCommission ? commissionMonthly * 0.18 : 0;

  const monthlyPayment = base + data.insurance + commissionMonthly + itbisMonthly;

  const schedule: Row[] = [];
  let balance = principal;
  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    const principalPart = Math.max(base - interest, 0);
    balance = Math.max(balance - principalPart, 0);
    schedule.push({
      m: i, interest, principal: principalPart, base, insurance: data.insurance, balance,
    });
  }

  const totalInterests = schedule.reduce((s, x) => s + x.interest, 0);
  const totalInsurance = data.insurance * n;
  const totalLoanCost = monthlyPayment * n + data.downPayment + balloonAmt;

  return {
    r, principal, base, monthlyPayment, totalLoanCost, schedule,
    summary: {
      effectiveMonthlyRate: r * 100,
      totalInterests,
      totalInsurance,
      totalCommission: commissionMonthly * n + itbisMonthly * n,
    },
  };
}

export default function FinancingPage() {
  const [activeId, setActiveId] = useState<string>(() => resolveActiveVehicleId());
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [related, setRelated] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [data, setData] = useState<CalcData>({
    price: 0,
    downPayment: 0,
    downPaymentPercent: 0,
    term: 24,
    apr: 22,
    commission: { type: "percent", value: 1 },
    insurance: 9000,
    balloon: 0,
    itbisOnCommission: false,
  });

  // Si cambia el hash (?id=) actualiza el ID activo
  useEffect(() => {
    const onHashChange = () => setActiveId(resolveActiveVehicleId());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Carga del vehículo con fallback a veh-001 si el ID guardado no existe
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        let id = activeId || "veh-001";
        let v: Vehicle | null = null;

        try {
          v = await fetchVehicleById(id);
        } catch {
          if (id !== "veh-001") {
            // fallback
            v = await fetchVehicleById("veh-001");
            id = "veh-001";
          } else {
            throw new Error("No se pudo cargar el vehículo");
          }
        }

        if (!alive || !v) return;
        setActiveId(id);
        setVehicle(v);
        localStorage.setItem("lastVehicleId", v.id); // recuerda el último

        // seed calculadora
        const price = Number(v.price) || 0;
        const downPercent = 20;
        const down = Math.round(price * (downPercent / 100));
        setData((d) => ({ ...d, price, downPayment: down, downPaymentPercent: downPercent }));

        // relacionados (no bloqueante)
        fetchRelated(v.id).then((r) => alive && setRelated(r || [])).catch(() => {});
      } catch (e: any) {
        if (alive) setErr(e?.message || "Error cargando");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [activeId]);

  const { principal, base, monthlyPayment, totalLoanCost, schedule, summary } = useFinancing(data);
  const [showAllRows, setShowAllRows] = useState(false);
  const rowsToShow = showAllRows ? schedule : schedule.slice(0, 6);

  // photo state and helper (avoid undefined 'photos' usage in JSX)
  const [mainPhotoIdx, setMainPhotoIdx] = useState<number>(0);
  const photos = vehicle?.photos || [];

  // helpers
  const setDownAmount = (val: number) => {
    val = Math.max(0, val);
    const percent = data.price ? (val / data.price) * 100 : 0;
    setData({ ...data, downPayment: val, downPaymentPercent: percent });
  };
  const setDownPercent = (val: number) => {
    val = Math.min(80, Math.max(0, val));
    const amount = Math.round(data.price * (val / 100));
    setData({ ...data, downPayment: amount, downPaymentPercent: val });
  };

  if (loading) return <div className="container mx-auto px-4 py-10">Cargando financiamiento…</div>;
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-[--muted] flex items-center gap-2">
        <a href="#/home" className="hover:text-[--text]">Inicio</a>
        <span>›</span>
        <span>Catálogo</span>
        <span>›</span>
        <span className="text-[--text]">{vehicle.brand} {vehicle.model}</span>
        <span>›</span>
        <span className="text-[--text] font-medium">Financiar</span>
      </nav>

      {/* Header */}
      <header className="rounded-2xl border border-[--border] bg-[--surface] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[--bg] border border-[--border] grid place-items-center text-[--muted]">
            {photos[mainPhotoIdx] ? (
                      <img
                        src={photos[mainPhotoIdx]}
                        alt={`${vehicle.brand} ${vehicle.model} ${mainPhotoIdx + 1}`}
                        className="w-full h-[50px] md:h-[50px] object-cover"
                      />
                    ) : (
                      <div className="w-full h-[260px] md:h-[360px] grid place-items-center text-[--muted]">Sin fotos</div>
                    )}</div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              {vehicle.brand} {vehicle.model} {vehicle.year}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {vehicle.condition && (
                <span className={`px-2 py-0.5 rounded-lg text-xs border ${
                  vehicle.condition === "Nuevo"
                    ? "bg-[--success]/15 text-[--success] border-transparent"
                    : "bg-[--muted]/15 text-[--muted] border-transparent"
                }`}>{vehicle.condition}</span>
              )}
              {vehicle.isFinanceable && (
                <span className="px-2 py-0.5 rounded-lg text-xs border bg-[--primary]/15 text-[--primary] border-transparent">Financiable</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[--muted]">Precio</div>
          <div className="text-2xl font-extrabold">RD{"$ "}{Number(vehicle.price).toLocaleString("es-DO")}</div>
          <div className="flex gap-2 mt-3 justify-end">
            <a href="javascript:history.back()" className="px-3 py-2 rounded-xl border border-[--border]">↩ Volver</a>
            <a href="#/home" className="px-3 py-2 rounded-xl border border-[--border]">Cambiar vehículo</a>
          </div>
        </div>
      </header>

      {/* Grid: Calculadora / Resultado */}
      <section className="grid lg:grid-cols-2 gap-6">
        {/* Calculadora */}
        <div className="rounded-2xl border border-[--border] bg-[--surface] p-5 space-y-4">
          <h3 className="font-semibold p-2"><span className="material-symbols-outlined text-[--muted] text-sm px-2">calculate</span>Calculadora de Financiamiento</h3>

          {/* Precio */}
          <div className="space-y-1">
            <label className="text-xs text-[--muted]">Precio del Vehículo (RD$)</label>
            <input
              type="number"
              value={data.price}
              onChange={(e) => setData({ ...data, price: parseFloat(e.target.value) || 0 })}
              className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
            />
          </div>

          {/* Inicial */}
          <div className="space-y-2">
            <label className="text-xs text-[--muted]">Inicial</label>
            <div className="text-xs flex justify-between text-[--muted]">
              <span>Porcentaje: {data.downPaymentPercent.toFixed(1)}%</span>
              <span>Monto: {currency(data.downPayment)}</span>
            </div>
            <input
              type="range"
              min={0} max={80} step={0.5}
              value={data.downPaymentPercent}
              onChange={(e) => setDownPercent(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-[--muted] mb-1">Monto (RD$)</div>
                <input
                  type="number"
                  value={data.downPayment}
                  onChange={(e) => setDownAmount(parseFloat(e.target.value) || 0)}
                  className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
                />
              </div>
              <div>
                <div className="text-xs text-[--muted] mb-1">Porcentaje (%)</div>
                <input
                  type="number"
                  min={0} max={80} step={0.5}
                  value={data.downPaymentPercent}
                  onChange={(e) => setDownPercent(parseFloat(e.target.value) || 0)}
                  className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
                />
              </div>
            </div>
          </div>

          {/* Plazo */}
          <div className="space-y-2">
            <label className="text-xs text-[--muted]">Plazo (meses)</label>
            <div className="flex flex-wrap gap-2">
              {[12, 18, 24, 36, 48, 60].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setData({ ...data, term: m })}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${
                    data.term === m
                      ? "bg-[--primary] text-[--primary-contrast] border-transparent"
                      : "bg-[--bg] border-[--border] hover:bg-[--bg]/80"
                  }`}
                >
                  {m} meses
                </button>
              ))}
            </div>
          </div>

          {/* APR */}
          <div className="space-y-1">
            <label className="text-xs text-[--muted]">Tasa APR Anual (%)</label>
            <input
              type="number"
              value={data.apr}
              min={0} max={60} step={0.1}
              onChange={(e) => setData({ ...data, apr: parseFloat(e.target.value) || 0 })}
              className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
            />
          </div>

          {/* Comisión */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[--muted]">Comisión</label>
              <div className="flex items-center gap-2 text-xs text-[--muted]">
                <button
                  type="button"
                  onClick={() => setData({ ...data, commission: { ...data.commission, type: "percent" } })}
                  className={`px-2 py-1 rounded-md border ${data.commission.type === "percent" ? "bg-[--surface]" : "bg-[--bg] border-[--border]"}`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setData({ ...data, commission: { ...data.commission, type: "amount" } })}
                  className={`px-2 py-1 rounded-md border ${data.commission.type === "amount" ? "bg-[--surface]" : "bg-[--bg] border-[--border]"}`}
                >
                  RD$
                </button>
              </div>
            </div>
            <input
              type="number"
              value={data.commission.value}
              onChange={(e) =>
                setData({
                  ...data,
                  commission: { ...data.commission, value: parseFloat(e.target.value) || 0 },
                })
              }
              className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
              placeholder={data.commission.type === "percent" ? "1" : "25000"}
            />
          </div>

          {/* Seguro */}
          <div className="space-y-1">
            <label className="text-xs text-[--muted]">Seguro Mensual (RD$)</label>
            <input
              type="number"
              value={data.insurance}
              onChange={(e) => setData({ ...data, insurance: parseFloat(e.target.value) || 0 })}
              className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
            />
          </div>

          {/* Balloon */}
          <div className="space-y-1">
            <label className="text-xs text-[--muted]">Balloon (%)</label>
            <input
              type="number"
              value={data.balloon}
              min={0} max={40} step={0.1}
              onChange={(e) => setData({ ...data, balloon: parseFloat(e.target.value) || 0 })}
              className="rounded-xl border border-[--border] bg-[--bg] px-3 py-2 w-full"
            />
          </div>

          {/* ITBIS */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.itbisOnCommission}
              onChange={(e) => setData({ ...data, itbisOnCommission: e.target.checked })}
            />
            Incluir ITBIS en comisiones
          </label>

          {/* Acciones */}
          <div className="flex gap-2 pt-2">
            <button
              className="flex-1 px-4 py-2 rounded-xl bg-[--primary] text-[--primary-contrast]"
              onClick={() => setData({ ...data })}
            >
              Calcular
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-[--border]"
              onClick={() =>
                setData({
                  ...data,
                  downPayment: Math.round(data.price * 0.2),
                  downPaymentPercent: 20,
                  term: 24,
                  apr: 22,
                  commission: { type: "percent", value: 1 },
                  insurance: 9000,
                  balloon: 0,
                  itbisOnCommission: false,
                })
              }
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Resultado */}
        <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
          <h3 className="font-semibold gap-2 mb-4 p-2"><span className="material-symbols-outlined text-[--muted] text-sm px-2">trending_up</span>Cuota Estimada</h3>
          <div className="rounded-xl bg-[--bg] border border-[--border] p-6 text-center py-6">
            <div className="text-m text-[--muted]">Cuota mensual estimada</div>
            <div className="text-4xl md:text-4xl font-extrabold mt-5">{currency(monthlyPayment)}</div>

            <div className="grid grid-cols-3 gap-3 mt-5 text-center align-center">
              <div className="rounded-lg border border-[--border] p-3">
                <div className="text-s text-[--muted]">Tasa efectiva mensual</div>
                <div className="font-semibold text-center text-xl">{summary.effectiveMonthlyRate.toFixed(2)}%</div>
              </div>
              <div className="rounded-lg border border-[--border] p-3">
                <div className="text-s text-[--muted]">Total a financiar</div>
                <div className="font-semibold text-xl">{currency(principal)}</div>
              </div>
              <div className="rounded-lg border border-[--border] p-3">
                <div className="text-s text-[--muted]">Total a préstar</div>
                <div className="font-semibold text-xl">{currency(totalLoanCost)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 text-center">
              <div className="rounded-lg border border-[--border] p-3">
                <div className="text-xs text-[--muted]">Capital aprox. (1er mes)</div>
                <div className="font-semibold">{currency(Math.max(base - principal * (data.apr/100/12), 0))}</div>
              </div>
              <div className="rounded-lg border border-[--border] p-3">
                <div className="text-xs text-[--muted]">Intereses (1er mes)</div>
                <div className="font-semibold">{currency(principal * (data.apr/100/12))}</div>
              </div>
              <div className="rounded-lg border border-[--border] p-3">
                <div className="text-xs text-[--muted]">Seguro</div>
                <div className="font-semibold">{currency(data.insurance)}</div>
              </div>
              <div className="rounded-lg border border-[--border] p-3">
                <div className="text-xs text-[--muted]">Comisión prorrateada</div>
                <div className="font-semibold">
                  {currency(
                    (data.commission.type === "percent" ? data.price * data.commission.value / 100 : data.commission.value) / data.term
                  )}
                </div>
              </div>
            </div>

            <p className="text-[--muted] text-xs mt-4">
              * Simulación referencial sujeta a aprobación crediticia. Las condiciones finales pueden variar.
            </p>
          </div>
        </div>
      </section>

      {/* Tabla de amortización */}
      <section className="rounded-2xl border border-[--border] bg-[--surface] p-5">
        <h3 className="font-semibold mb-4">Tabla de Amortización</h3>
        <div className="overflow-x-auto rounded-xl border border-[--border]">
          <table className="w-full text-sm">
            <thead className="bg-[--bg]">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th>Mes</th>
                <th>Interés</th>
                <th>Capital</th>
                <th>Cuota Base</th>
                <th>Seguro</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {rowsToShow.map((r) => (
                <tr key={r.m} className="border-t border-[--border] [&>td]:px-3 [&>td]:py-2">
                  <td>{r.m}</td>
                  <td>{currency(r.interest)}</td>
                  <td>{currency(r.principal)}</td>
                  <td>{currency(r.base)}</td>
                  <td>{currency(r.insurance)}</td>
                  <td>{currency(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="text-sm text-[--muted]">
            Total de Intereses: <span className="font-semibold text-[--text]">{currency(summary.totalInterests)}</span>
          </div>
          <div className="text-sm text-[--muted]">
            Total de Seguros: <span className="font-semibold text-[--text]">{currency(summary.totalInsurance)}</span>
          </div>
          <div className="text-sm text-[--muted]">
            Última Cuota: <span className="font-semibold text-[--text]">{currency(schedule.length ? schedule[schedule.length - 1].base : 0)}</span>
          </div>
        </div>

        <div className="mt-4">
          <button
            className="text-[--primary] hover:underline text-sm"
            onClick={() => setShowAllRows((s) => !s)}
          >
            {showAllRows ? "Ver solo 6 filas" : `Ver tabla completa (${schedule.length} pagos)`}
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-[--border] bg-[--surface] p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">¿Listo para financiar tu vehículo?</h2>
        <p className="text-[--muted]">Obtén una respuesta rápida y comienza el proceso hoy mismo.</p>
        <div className="flex justify-center gap-3">
          <a className="px-4 py-2 rounded-xl bg-[--primary] text-[--primary-contrast]" href="#/contact">Solicitar financiamiento</a>
          <a className="px-4 py-2 rounded-xl border border-[--border]" target="_blank" href="https://wa.me/18090000000" rel="noreferrer">Continuar por WhatsApp</a>
        </div>
      </section>

      {/* Relacionados (simplificado para evitar dependencias) */}
      {Array.isArray(related) && related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">También te puede interesar</h2>
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
                <div className="text-sm font-semibold">{r.brand} {r.model} {r.year}</div>
                <div className="text-xs text-[--muted]">{r.type?.toUpperCase()}</div>
                <div className="text-sm font-bold mt-1">RD$ {Number(r.price).toLocaleString("es-DO")}</div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
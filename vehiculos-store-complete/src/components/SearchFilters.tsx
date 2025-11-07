import { useEffect, useState } from "react";
import type { VehicleFilters } from "../lib/api";
import { fetchFilters } from "../lib/api";
import type { VehicleType } from "../types/vehicle";

export function SearchFilters({
  onApply,
  onTypeChange,
}: {
  onApply?: (f: VehicleFilters) => void;
  onTypeChange?: (t: VehicleType) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<VehicleType[]>(["carro", "suv", "motocicleta", "camioneta"]);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [filters, setFilters] = useState<VehicleFilters>({});

  useEffect(() => {
    fetchFilters()
      .then((d) => {
        if (d.types?.length) setTypes(d.types as VehicleType[]);
        setBrands(d.brands || []);
        setModels(d.models || []);
        setYears(d.years || []);
        setProvinces(d.provinces || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (patch: Partial<VehicleFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    if (patch.type) onTypeChange?.(patch.type as VehicleType);
  };

  const apply = () => onApply?.(filters);
  const clear = () => {
    setFilters({});
    onApply?.({});
  };

  return (
    <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); apply(); }}>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <Select
          label="Tipo"
          icon="directions_car"
          value={filters.type as any}
          onChange={(v) => set({ type: v as VehicleType })}
          options={types as unknown as string[]}
        />
        <Select
          label="Marca"
          icon="branding_watermark"
          value={filters.brand}
          onChange={(v) => set({ brand: v })}
          options={brands}
        />
        <Select
          label="Modelo"
          icon="directions_car" 
          value={filters.model}
          onChange={(v) => set({ model: v })}
          options={models}
        />
        <Select
          label="Año"
          icon="calendar_month"
          value={(filters.year as any) ?? ""}
          onChange={(v) => set({ year: v ? Number(v) : undefined })}
          options={years.map(String)}
        />
        <Select
          label="Provincia"
          icon="location_on"
          value={filters.province}
          onChange={(v) => set({ province: v })}
          options={provinces}
        />
        <Select
          label="Condición"
          icon="verified"
          value={(filters.condition as any) ?? ""}
          onChange={(v) => set({ condition: (v || undefined) as any })}
          options={["Nuevo", "Usado"]}
        />
      </div>

      <div className="flex items-center gap-6 sm:justify-center ">
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[--primary] text-[--primary-contrast] hover:bg-[--primary]/90 inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          Buscar
        </button>
        <button
          type="button"
          onClick={clear}
          className="text-[--muted] hover:text-[--text] inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
          Borrar filtros
        </button>
        {loading && <span className="text-xs text-[--muted]">Cargando filtros…</span>}
      </div>
    </form>
  );
}

/** Select con icono en el label y caret superpuesto */
function Select({
  label,
  icon,
  options,
  className = "",
  value,
  onChange,
}: {
  label: string;
  icon?: string; // nombre 
  options: string[];
  className?: string;
  value?: string | number;
  onChange?: (v: string) => void;
}) {
  return (
    <label className={"flex flex-col gap-1 " + className}>
      {/* Label con icono */}
      <span className="text-xs text-[--muted] flex items-center gap-3">
        {icon && <span className="material-symbols-outlined text-[--muted]" aria-hidden="true">{icon}</span>}
        {label}
      </span>

      {/* Campo con caret custom */}
      <div className="relative">
        <select
          className="w-full appearance-none rounded-full bg-[--bg] border border-[--border]
                     px-5 py-2.5 pr-10 text-[--text] focus:outline-none"
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value || "")}
        >
          <option value="">Todos</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>

        {/* Caret personalizada (derecha) */}
        <span
          className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2
                     text-[--muted] pointer-events-none"
          aria-hidden="true"
        >
          expand_more
        </span>
      </div>
    </label>
  );
}


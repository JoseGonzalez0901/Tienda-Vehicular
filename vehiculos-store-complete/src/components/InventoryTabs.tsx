// InventoryTabs.tsx
import { useEffect, useState } from "react";
import type { Vehicle } from "../types/vehicle";
import type { VehicleFilters } from "../lib/api";
import { fetchVehicles } from "../lib/api";
import { VehicleCard } from "./VehicleCard";

export function InventoryTabs({ filters }: { filters?: VehicleFilters }) {
  const [tab, setTab] = useState<"recientes" | "populares" | "ofertas">("recientes");
  const [data, setData] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchVehicles({ tab, limit: 10, filters, defaultType: filters?.type ?? "carro" })
      .then((res) => { if (alive) setData(res.items); })
      .catch(() => { if (alive) setData([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tab, JSON.stringify(filters)]);

  return (
    <section>
      <div className="flex justify-center mb-6">
        <div className="inline-flex gap-2 bg-bg/60 border border-border p-1 rounded-full">
          {(["recientes", "populares", "ofertas"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "px-4 py-2 rounded-full text-sm transition-colors " +
                (tab === t ? "bg-[--primary] text-[--primary-contrast] shadow-overlay" : "hover:bg-surface/80")
              }
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(225px,1fr))] gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-56 bg-[--surface] animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(225px,1fr))] gap-2">
          {data.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </section>
  );
}

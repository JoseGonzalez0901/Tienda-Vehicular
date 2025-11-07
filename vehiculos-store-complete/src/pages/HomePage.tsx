import { Hero } from "../components/Hero";
import { SearchFilters } from "../components/SearchFilters";
import { VehicleTypeVector } from "../components/VehicleTypeVector";
import { InventoryTabs } from "../components/InventoryTabs";
import { FinancingMiniHero } from "../components/FinancingMiniHero";
import { FeatureGrid } from "../components/FeatureGrid";
import type { VehicleFilters } from "../lib/api";
import type { VehicleType } from "../types/vehicle";
import { useState } from "react";

export default function HomePage(){
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [selectedType, setSelectedType] = useState<VehicleType>("carro");
  return (
    <>
      <Hero />
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl  p-4 md:p-6 rounded-2xl shadow-lg border border-gray-700">
          <SearchFilters onApply={setFilters} onTypeChange={setSelectedType} />
        </div>
      </div>
      <div className="container mx-auto px-4"><VehicleTypeVector vehicleType={selectedType} /></div>
      <div className="container mx-auto px-4 mt-6"><InventoryTabs filters={filters} /></div>
      <div className="container mx-auto px-4 mt-14"><FinancingMiniHero /></div>
      <div className="container mx-auto px-4 mt-10"><FeatureGrid /></div>
    </>
  );
}

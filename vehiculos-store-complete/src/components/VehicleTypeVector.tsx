// src/components/VehicleTypeVector.tsx
import React from "react";
import type { VehicleType } from "../types/vehicle";

// BASE_URL de Vite ⇒ en producción será "/app/"
const base = (import.meta as any).env.BASE_URL;


const srcByType: Record<VehicleType, string> = {
  carro:     `${base}vectors/carro.svg`,
  camioneta: `${base}vectors/camioneta.svg`,
  suv:       `${base}vectors/suv.svg`,
  motocicleta:      `${base}vectors/motocicleta.svg`,
};

export function VehicleTypeVector({ vehicleType }: { vehicleType: VehicleType }) {
  const src = srcByType[vehicleType] ?? `${base}vectors/carro.svg`;

  return (
    <div className="flex justify-center my-8">
      <img
        src={src}
        alt={`Vector ${vehicleType}`}
        className="w-full max-w-[450px] h-auto select-none pointer-events-none"
        draggable={false}
        style={{ opacity: 1, transform: "scale(1.5)" }}
      />
    </div>
  );
}

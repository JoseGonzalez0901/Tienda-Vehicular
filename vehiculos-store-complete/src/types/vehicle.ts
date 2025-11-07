export type VehicleType = "carro" | "suv" | "motocicleta" | "camioneta";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  type: VehicleType;
  condition: "Nuevo" | "Usado";
  mileageKm?: number;
  location?: string;
  photos?: string[];
  isFinanceable?: boolean;
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
}

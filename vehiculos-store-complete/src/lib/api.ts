// lib/api.ts
import type { Vehicle, VehicleType } from "../types/vehicle";
import type { BlogPost } from "../types/blog";

const BASE = (import.meta as any).env.VITE_API_URL?.replace(/\/+$/, "") || "";
const url = (path: string) => (BASE ? `${BASE}${path}` : path);
const q = (params: Record<string, any>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

// ───────────────────────────────────────────────────────────────────────────────
// Tipos del API (lista)
// ───────────────────────────────────────────────────────────────────────────────
type ApiVehicleItem = {
  id: number;
  title: string;                            // ahora SIN año, ej. "Nissan Note"
  year: number;                             // el año viene aquí
  price: number;
  coverUrl?: string;
  condition?: "Nuevo" | "Usado";            // enviado por backend
  location?: string;    
  mileageKm?:number;                    // enviado por backend
};

type ApiVehicleListResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: ApiVehicleItem[];
};

// ───────────────────────────────────────────────────────────────────────────────
// Tipo del API (detalle by ID)
// ───────────────────────────────────────────────────────────────────────────────
type ApiVehicleSpecs = {
  engine?: string;
  drive?: string;
  powerHp?: number;
  torqueNm?: number;
  consumption?: string;
  doors?: number;
  seats?: number;
  mileageKm?: number;
  description?: string;
  accessories?: string[];
  features?: string[];
};

type ApiVehicleDetail = {
  id: number;
  title: string;                           // "Chevrolet Camaro"
  brand?: string;
  model?: string;
  year: number;
  price: number;
  fuel?: string;
  transmission?: string;
  color?: string;
  location?: string | null;

  // NUEVO: backend expone en raíz
  type?: VehicleType;
  condition?: "Nuevo" | "Usado";

  specs?: ApiVehicleSpecs;
  gallery?: string[];
  videoUrl?: string | null;
  model3DUrl?: string | null;              // D mayúscula
};

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
const toAbsolute = (u?: string | null) =>
  !u ? "" : /^https?:\/\//i.test(u) ? u : `${BASE}${u}`;

const splitTitle = (title: string) => {
  const parts = (title ?? "").trim().split(/\s+/);
  const brand = parts[0] ?? "";
  const model = parts.slice(1).join(" ");
  return { brand, model };
};

const asCondition = (c?: string): Vehicle["condition"] | undefined =>
  c === "Nuevo" || c === "Usado" ? c : undefined;

// Lista -> Vehicle
const mapApiToVehicle = (
  v: ApiVehicleItem,
  defaults: { type: VehicleType; condition?: Vehicle["condition"] }
): Vehicle => {
  const { brand, model } = splitTitle(v.title);
  const photo = toAbsolute(v.coverUrl);

  return {
    id: String(v.id),
    brand,
    model,                 // el título no trae año
    year: v.year,
    price: v.price,
    type: defaults.type,
    condition: asCondition(v.condition) ?? defaults.condition ?? "Usado",
    location: v.location ?? undefined,
    mileageKm: v.mileageKm ?? undefined,
    photos: photo ? [photo] : [],
  };
};

// Detalle -> Vehicle
const mapApiDetailToVehicle = (
  v: ApiVehicleDetail,
  defaults: { type: VehicleType; condition?: Vehicle["condition"] }
): Vehicle => {
  let brand = v.brand;
  let model = v.model;
  if (!brand || !model) {
    const parts = splitTitle(v.title ?? "");
    brand ??= parts.brand;
    model ??= parts.model;
  }

  const photos = (v.gallery ?? []).map(toAbsolute).filter(Boolean);
  const s = v.specs ?? {};

  return {
    id: String(v.id),
    brand: brand ?? "",
    model: model ?? "",
    year: v.year ?? 0,
    price: v.price,

    // preferir lo que envía backend en raíz; si no, caer a defaults
    type: (v.type as VehicleType) ?? defaults.type,
    condition: asCondition(v.condition) ?? defaults.condition ?? "Usado",

    photos,
    fuel: v.fuel,
    transmission: v.transmission,
    color: v.color ?? undefined,
    mileageKm: s.mileageKm,
    powerHp: s.powerHp,
    torqueNm: s.torqueNm,
    doors: s.doors,
    seats: s.seats,
    engine: s.engine,
    drive: s.drive,
    consumption: s.consumption,
    location: v.location ?? undefined,
    accessories: s.accessories,
    features: s.features,
    description: s.description,
    model3dUrl: v.model3DUrl ? toAbsolute(v.model3DUrl) : undefined,
    videoUrl: v.videoUrl ? toAbsolute(v.videoUrl) : undefined,
  };
};

// ───────────────────────────────────────────────────────────────────────────────
// Filtros
// ───────────────────────────────────────────────────────────────────────────────
export type VehicleFilters = {
  type?: VehicleType;
  brand?: string;
  model?: string;
  year?: number | string;
  province?: string;                   // mapeado a VehicleSpec("location")
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  condition?: "Nuevo" | "Usado";
  financeable?: boolean;
  offer?: boolean;
};

export async function fetchFilters() {
  const res = await fetch(url("/api/filters"));
  if (!res.ok) throw new Error("filters " + res.status);
  return res.json() as Promise<{
    types: VehicleType[];
    brands: string[];
    models: string[];
    years: number[];
    provinces: string[];
  }>;
}

// ───────────────────────────────────────────────────────────────────────────────
// Listado paginado
// ───────────────────────────────────────────────────────────────────────────────
export async function fetchVehicles(opts: {
  tab?: "recientes" | "populares" | "ofertas";
  limit?: number;
  page?: number;
  filters?: VehicleFilters;
  defaultType?: VehicleType;
  defaultCondition?: Vehicle["condition"];
} = {}) {
  const { tab, limit = 10, page = 1, filters = {}, defaultType = "carro", defaultCondition } = opts;

  const res = await fetch(url(`/api/vehicles${q({ tab, limit, page, ...filters })}`));
  if (!res.ok) throw new Error("vehicles " + res.status);

  const data: ApiVehicleListResponse = await res.json();

  return {
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    items: data.items.map((it) =>
      mapApiToVehicle(it, { type: filters.type ?? defaultType, condition: defaultCondition })
    ),
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Detalle by ID
// ───────────────────────────────────────────────────────────────────────────────
export async function fetchVehicleById(
  id: string,
  opts: { defaultType?: VehicleType; defaultCondition?: Vehicle["condition"] } = {}
) {
  const { defaultType = "carro", defaultCondition } = opts;
  const res = await fetch(url(`/api/vehicles/${id}`));
  if (!res.ok) throw new Error("vehicle " + res.status);
  const data: ApiVehicleDetail = await res.json();
  return mapApiDetailToVehicle(data, { type: defaultType, condition: defaultCondition });
}

// ───────────────────────────────────────────────────────────────────────────────
// Relacionados
// ───────────────────────────────────────────────────────────────────────────────
export async function fetchRelated(
  id: string,
  opts: { defaultType?: VehicleType; defaultCondition?: Vehicle["condition"]; listShape?: boolean } = {}
) {
  const { defaultType = "carro", defaultCondition, listShape } = opts;
  const res = await fetch(url(`/api/vehicles/${id}/related`));
  if (!res.ok) throw new Error("related " + res.status);
  const raw = await res.json();

  if (!Array.isArray(raw)) return [];

  if (listShape || (raw.length && "year" in raw[0])) {
    return (raw as ApiVehicleItem[]).map((it) =>
      mapApiToVehicle(it, { type: defaultType, condition: defaultCondition })
    );
  }

  return (raw as ApiVehicleDetail[]).map((it) =>
    mapApiDetailToVehicle(it, { type: defaultType, condition: defaultCondition })
  );
}

// ───────────────────────────────────────────────────────────────────────────────
export async function fetchBlogPosts(params: { page?: number; q?: string; category?: string } = {}) {
  const { page = 1, q: search, category } = params;
  const res = await fetch(url(`/api/blogs${q({ page, q: search, category })}`));
  if (!res.ok) throw new Error("blogs " + res.status);
  return res.json() as Promise<{ posts: BlogPost[]; total: number; page: number; pageSize: number }>;
}

export async function fetchBlogPostById(id: string) {
  const res = await fetch(url(`/api/blogs/${id}`));
  if (!res.ok) throw new Error("blog " + res.status);
  return res.json() as Promise<BlogPost>;
}

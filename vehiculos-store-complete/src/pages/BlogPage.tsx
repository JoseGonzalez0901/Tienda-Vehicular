import { useEffect, useMemo, useState } from "react";
import { fetchBlogPosts } from "../lib/api";
import type { BlogPost } from "../types/blog";

/** Util: slug para categorías si el backend manda string suelta */
const slugify = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, "-");

/** Extracciones por si el tipo BlogPost puede variar) */
function getCover(p: BlogPost): string | undefined {
  return (p as any).cover || (p as any).image || (p as any).thumbnail;
}
function getCategoryName(p: BlogPost): string {
  const c = (p as any).category;
  return typeof c === "string" ? c : c?.name || "";
}
function getCategorySlug(p: BlogPost): string {
  const c = (p as any).category;
  return typeof c === "object" && c?.slug ? c.slug : slugify(getCategoryName(p));
}
function getAuthorName(p: BlogPost): string {
  const a = (p as any).author;
  if (!a) return "Autor";
  return typeof a === "string" ? a : a.name || "Autor";
}
function getReadTime(p: BlogPost): number {
  return Number((p as any).readTime || 5);
}
function getViews(p: BlogPost): string {
  return formatViews((p as any).views);
}
/** Formatea vistas: 987 -> "987", 1200 -> "1.2K", 1500000 -> "1.5M" */
function formatViews(views: unknown): string {
  // Si ya viene como "1.2k" o "3M", respétalo y normaliza a mayúscula
  if (typeof views === "string") {
    const t = views.trim();
    if (/^\d+(\.\d+)?\s*[kKmMbB]$/.test(t)) {
      return t.replace(/\s+/g, "").toUpperCase();
    }
  }

  const n = typeof views === "number"
    ? views
    : Number(String(views).replace(/[^\d.]/g, "") || "0");

  if (!isFinite(n) || n < 0) return "0";
  if (n < 1000) return n.toLocaleString("es-DO");

  const round1 = (x: number) => {
    const v = Math.round(x * 10) / 10;            // 1 decimal
    return Number.isInteger(v) ? String(v | 0)    // sin .0
                               : v.toFixed(1);
  };

  if (n < 1_000_000)         return `${round1(n / 1_000)}K`;        // hasta miles
  if (n < 1_000_000_000)     return `${round1(n / 1_000_000)}M`;    // millones
  return `${round1(n / 1_000_000_000)}B`;                           // miles de millones
}


function getDate(post: any): string {
  const raw = post?.publishedAt ?? post?.date ?? post?.createdAt;
  if (raw == null) return "";

  const d = parseDateString(raw);
  // Si no puedo parsear, devuelvo tal cual (por si ya viene formateado)
  if (!d) return String(raw);

  // Formato consistente
  return d.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/** --- parseDateString: trata 'YYYY-MM-DD' como LOCAL (evita -1 día) --- */
function parseDateString(raw: unknown): Date | null {
  if (raw == null) return null;

  // Timestamp numérico (ms o s) o string numérica
  if (typeof raw === "number" || /^\d+$/.test(String(raw))) {
    const n = Number(raw);
    const ms = n < 1e12 ? n * 1000 : n;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;

  // YYYY-MM-DD  -> ¡LOCAL!
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    const dt = new Date(Number(y), Number(m) - 1, Number(d)); // local midnight
    return isNaN(dt.getTime()) ? null : dt;
  }

  // YYYY-MM-DDTHH:mm... Z|±hh:mm -> ISO con TZ explícita
  if (/^\d{4}-\d{2}-\d{2}T/.test(s) && /[Zz]|[+\-]\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DDTHH:mm[:ss] (SIN Z ni offset) -> hora LOCAL
  const isoLocal = s.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(?::(\d{2}))?(?::(\d{2}(?:\.\d+)?))?$/
  );
  if (isoLocal) {
    const [, y, m, d, hh, mm = "0", ssRaw = "0"] = isoLocal;
    const secFloat = parseFloat(ssRaw);
    const sec = Math.floor(secFloat);
    const ms = Math.round((secFloat - sec) * 1000);
    const dt = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      sec,
      ms
    );
    return isNaN(dt.getTime()) ? null : dt;
  }

  // DD/MM/YYYY
  const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) {
    const [, dd, mm, yyyy] = dmy;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(d.getTime()) ? null : d;
  }

  // MM-DD-YYYY o MM/DD/YYYY
  const mdy = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (mdy) {
    const [, mm, dd, yyyy] = mdy;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(d.getTime()) ? null : d;
  }

  // Último intento
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** NUEVO: timestamp de publicación (ms) para ordenar */
const getPublishedAtTs = (p: any): number => {
  const raw = p?.publishedAt ?? p?.date ?? p?.createdAt;
  const d = parseDateString(raw);
  return d ? d.getTime() : -Infinity; // sin fecha → al final
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetchBlogPosts({ page: 1 })
      .then((r) => setPosts(r.posts || []))
      .finally(() => setLoading(false));
  }, []);

  /** categorías deducidas desde los posts (name+slug) */
  const categories = useMemo(() => {
    const map = new Map<string, string>(); // slug -> name
    posts.forEach((p) => {
      const name = getCategoryName(p);
      if (!name) return;
      const slug = getCategorySlug(p);
      if (!map.has(slug)) map.set(slug, name);
    });
    return [{ slug: "all", name: "Todos" }, ...Array.from(map, ([slug, name]) => ({ slug, name }))];
  }, [posts]);

  /** filtrado por categoría y búsqueda */
  const filtered = useMemo(() => {
    let list = posts;
    if (selectedCategory !== "all") {
      list = list.filter((p) => getCategorySlug(p) === selectedCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          ((p as any).excerpt || "").toLowerCase().includes(q) ||
          (Array.isArray((p as any).tags) &&
            ((p as any).tags as string[]).some((t) => t.toLowerCase().includes(q)))
      );
    }
    return list;
  }, [posts, selectedCategory, query]);

  /** ORDEN por fecha (más reciente primero) DESPUÉS de filtrar */
  const orderedByRecent = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => getPublishedAtTs(b) - getPublishedAtTs(a));
    return copy;
  }, [filtered]);

  /** usar el ordenado para el layout */
  const featured = orderedByRecent.slice(0, 3);
  const latest = orderedByRecent.slice(3, 15);

  return (
    <div className="min-h-screen bg-[--bg] text-[--text]">
      <main className="pb-20">
        {/* Breadcrumb */}
        <div className="container px-4 md:px-6 max-w-7xl mx-auto pt-6 text-sm text-[--muted] ">
          <a href="#/" className="hover:text-[--text]">Inicio</a>
          <span className="mx-1">›</span>
          <span className="text-[--text] font-medium">Blog</span>
        </div>

        {/* HERO */}
        <section className="container px-4 md:px-6 max-w-7xl mx-auto mt-6">
          <div className="rounded-2xl border border-[--border] p-6 md:p-10 text-center">
            <h1 className="text-2xl md:text-4xl font-extrabold leading-tight max-w-3xl mx-auto">
              Noticias y guías para comprar y mantener tu vehículo en RD
            </h1>
            <p className="text-[--muted] mt-3 max-w-2xl mx-auto">
              Consejos expertos, regulaciones actualizadas y mejores prácticas del mercado automotriz dominicano.
            </p>

            {/* Buscador */}
            <div className="mt-6 relative max-w-xl mx-auto">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[--muted]">
                search
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar artículos, guías, noticias…"
                className="w-full rounded-full bg-[--bg] border border-[--border] pl-10 pr-24 py-2.5"
              />
              <button
                onClick={() => {}}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-[--primary] text-[--primary-contrast] hover:bg-[--primary]/90"
              >
                Buscar
              </button>
            </div>

            {/* Métricas */}
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-xl mx-auto">
              <Stat value="50+" label="Artículos especializados" />
              <Stat value="15k+" label="Lectores mensuales" />
              <Stat value="24h" label="Actualizaciones diarias" />
            </div>
          </div>
        </section>

        {/* CHIPS DE CATEGORÍA */}
        <section className="container px-4 md:px-6 max-w-7xl mx-auto mt-6 justify-center text-center">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = selectedCategory === c.slug;
              return (
                <button
                  key={c.slug}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active
                      ? "border-[--primary] text-[--text] bg-[--bg]"
                      : "border-[--border] text-[--muted] hover:text-[--text]"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* LAYOUT PRINCIPAL */}
        <section className="container px-4 md:px-6 max-w-7xl mx-auto mt-8 grid lg:grid-cols-12 gap-8">
          {/* IZQUIERDA */}
          <div className="lg:col-span-8">
            <h2 className="text-xl font-bold mb-4">Artículos Destacados</h2>

            {loading ? (
              <SkeletonFeatured />
            ) : (
              <div className="grid md:grid-cols-3 gap-4 mb-10">
                {/* 1 grande */}
                {featured[0] && <FeaturedBig post={featured[0]} className="md:col-span-2" />}
                {/* 2 laterales */}
                <div className="flex flex-col gap-4">
                  {featured.slice(1, 3).map((p) => (
                    <FeaturedSmall key={(p as any).id} post={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Últimos */}
            <div className="flex items-end justify-between mb-3">
              <h3 className="text-lg font-semibold">Últimos artículos</h3>
              <div className="text-[--muted] text-sm">
                {orderedByRecent.length} resultado{orderedByRecent.length !== 1 ? "s" : ""}
              </div>
            </div>

            {loading ? (
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))] gap-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-2xl h-56 bg-[--surface] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))] gap-3">
                {latest.map((p) => (
                  <Card key={(p as any).id} post={p} />
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Buscador lateral */}
            <div className="rounded-2xl border border-[--border] bg-[--surface] p-4">
              <div className="text-sm font-semibold mb-3">Buscar artículos</div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[--muted]">
                  search
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-xl bg-[--bg] border border-[--border] pl-10 pr-3 py-2"
                  placeholder="¿Qué quieres aprender?"
                />
              </div>
              <button className="mt-3 w-full px-4 py-2 rounded-xl border border-[--border] hover:bg-[--bg]">
                Buscar
              </button>
            </div>

            {/* Más leídos */}
            <div className="rounded-2xl border border-[--border] bg-[--surface] p-4">
              <div className="text-sm font-semibold mb-3">Más leídos</div>
              <div className="space-y-3">
                {posts.slice(0, 6).map((p) => (
                  <a key={(p as any).id} href={`#/blog-post?id=${(p as any).id}`} className="flex gap-3 group">
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-[--bg] border border-[--border]">
                      {getCover(p) && <img src={getCover(p)} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium group-hover:underline line-clamp-2">{p.title}</div>
                      <div className="text-[--muted] text-xs mt-1">
                        {getReadTime(p)} min • {getViews(p)}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Temas populares */}
            <div className="rounded-2xl border border-[--border] bg-[--surface] p-4">
              <div className="text-sm font-semibold mb-3">Temas populares</div>
              <div className="flex flex-wrap gap-2">
                {["financiamiento", "seguros", "mantenimiento", "compra/venta", "regulaciones", "motos", "SUV"].map(
                  (t) => (
                    <a
                      key={t}
                      className="px-3 py-1.5 rounded-full border border-[--border] text-sm text-[--muted] hover:text-[--text]"
                      href="#/blog"
                    >
                      #{t}
                    </a>
                  )
                )}
              </div>
            </div>

            {/* Listo para financiar */}
            <div className="rounded-2xl border border-[--border] bg-[--surface] p-5 text-center">
              <div className="text-sm font-semibold">¿Listo para financiar?</div>
              <p className="text-[--muted] text-sm mt-1">Simula tu cuota mensual en menos de 2 minutos</p>
              <a href="#/financing" className="mt-3 inline-block px-4 py-2 rounded-xl bg-[--primary] text-[--primary-contrast]">
                Simular cuota
              </a>
            </div>

            {/* Newsletter */}
            <div className="rounded-2xl border border-[--border] bg-[--surface] p-4">
              <div className="text-sm font-semibold mb-2">Newsletter</div>
              <p className="text-[--muted] text-sm mb-3">
                Recibe las mejores ofertas y vehículos nuevos directamente en tu email.
              </p>
              <input className="w-full rounded-xl bg-[--bg] border border-[--border] px-3 py-2 mb-2" placeholder="Tu email" />
              <button className="w-full px-4 py-2 rounded-xl border border-[--border] hover:bg-[--bg]">Suscribirse</button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

/* ─────────────── Componentes UI ─────────────── */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[--muted] text-xs">{label}</div>
    </div>
  );
}

function SkeletonFeatured() {
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-10">
      <div className="md:col-span-2 rounded-2xl h-64 bg-[--surface] animate-pulse" />
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl h-32 bg-[--surface] animate-pulse" />
        <div className="rounded-2xl h-32 bg-[--surface] animate-pulse" />
      </div>
    </div>
  );
}

function FeaturedBig({ post, className = "" }: { post: BlogPost; className?: string }) {
  return (
    <a href={`#/blog-post?id=${(post as any).id}`} className={`relative rounded-2xl overflow-hidden border border-[--border] bg-[--surface] group ${className}`}>
      <div className="aspect-[16/9] w-full bg-[--bg]">
        {getCover(post) && (
          <img src={getCover(post)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        )}
      </div>
      <div className="p-5">
        <div className="text-xs text-[--muted] mb-1 grid-rows-1 grid-cols-2 flex justify-between">
         <div>{getCategoryName(post)}</div>
         <div>{getDate(post) && (<><span>{getDate(post)}</span></>)}</div>
        </div>
        <h3 className="text-lg font-semibold leading-snug">{post.title}</h3>
        <p className="text-[--muted] text-sm mt-2 line-clamp-2">{(post as any).excerpt || ""}</p>
        <Meta post={post} className="mt-4" />
      </div>
    </a>
  );
}

function FeaturedSmall({ post }: { post: BlogPost }) {
  return (
    <a href={`#/blog-post?id=${(post as any).id}`} className="rounded-2xl overflow-hidden border border-[--border] bg-[--surface] group">
      <div className="aspect-video w-full bg-[--bg]">
        {getCover(post) && (
          <img src={getCover(post)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-[--muted] mb-1 grid-rows-1 grid-cols-2 flex justify-between">
         <div>{getCategoryName(post)}</div>
         <div>{getDate(post) && (<><span>{getDate(post)}</span></>)}</div>
        </div>
        <h4 className="font-semibold leading-snug line-clamp-2">{post.title}</h4>
        <Meta post={post} className="mt-3" />
      </div>
    </a>
  );
}

function Card({ post }: { post: BlogPost }) {
  return (
    <a href={`#/blog-post?id=${(post as any).id}`} className="rounded-2xl overflow-hidden border border-[--border] bg-[--surface] group">
      <div className="aspect-video w-full bg-[--bg]">
        {getCover(post) && (
          <img src={getCover(post)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-[--muted] mb-1 grid-rows-1 grid-cols-2 flex justify-between">
         <div>{getCategoryName(post)}</div>
         <div>{getDate(post) && (<><span>{getDate(post)}</span></>)}</div>
        </div>
        <div className="font-semibold leading-snug line-clamp-2">{post.title}</div>
        <p className="text-[--muted] text-sm mt-1 line-clamp-2">{(post as any).excerpt || ""}</p>
        <Meta post={post} className="mt-3" />
      </div>
    </a>
  );
}

function Meta({ post, className = "" }: { post: BlogPost; className?: string }) {
  return (
    <div className={`flex text-center gap-3 text-[--muted] text-xs  ${className}`}>
      <span className="inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-[--muted] text-sm">person</span>
        {getAuthorName(post)}
      </span>
      <span className="material-symbols-outlined text-[--muted] text-sm">pace</span>
      <span>{getReadTime(post)} min</span>
      <span className="ml-auto inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-[--muted] text-sm">visibility</span>
        {getViews(post)}
      </span>
    </div>
  );
}

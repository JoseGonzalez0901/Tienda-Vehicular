import React, { lazy, Suspense, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Toaster } from "./components/ui/sonner";

const HomePage = lazy(() => import("./pages/HomePage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const VehicleDetailPage = lazy(() => import("./pages/VehicleDetailPage"));
const FinancingPage = lazy(() => import("./pages/FinancingPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));

type Page = "home" | "blog" | "blog-post" | "vehicle" | "financing" | "contact";

// ✅ Lee la ruta desde el hash (soporta "#/vehicle?id=veh-001")
function getRoute(): { page: Page; id?: string } {
  const raw = window.location.hash.replace(/^#\/?/, ""); // ej: "vehicle?id=veh-001"
  const [path, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);

  if (path?.startsWith("vehicle")) return { page: "vehicle", id: params.get("id") || "" };
  if (path?.startsWith("blog-post")) return { page: "blog-post", id: params.get("id") || "" };
  if (path?.startsWith("blog")) return { page: "blog" };
  if (path?.startsWith("financing")) return { page: "financing" };
  if (path?.startsWith("contact")) return { page: "contact" };
  return { page: "home" };
}

// 🔧 ErrorBoundary simple para evitar “pantalla negra”
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("App crashed:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-10">
          <h1 className="heading text-2xl font-bold">Ocurrió un error en la app</h1>
          <p className="text-[--muted] mt-2">
            Revisa la consola del navegador para más detalles (F12 → Console).
          </p>
          <pre className="mt-4 p-3 rounded-xl border border-[--border] bg-[--surface] overflow-auto text-sm">
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [{ page, id }, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHash = () => {
      const r = getRoute();
      console.log("[router] hashchange →", r); // 👀 útil para depurar
      setRoute(r);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <main className="pb-20">
        <AppErrorBoundary>
          <Suspense
            fallback={
              <div className="container mx-auto px-4 py-10">Cargando…</div>
            }
          >
            {page === "home" && <HomePage />}
            {page === "blog" && <BlogPage />}
            {page === "blog-post" && <BlogPostPage postId={id || ""} />}
            {page === "vehicle" && <VehicleDetailPage vehicleId={id || ""} />}
            {page === "financing" && React.createElement(FinancingPage as any, { vehicleId: id || "veh-002" })}
            {page === "contact" && <ContactPage />}
          </Suspense>
        </AppErrorBoundary>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
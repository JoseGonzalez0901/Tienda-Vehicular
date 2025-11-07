import { buttonVariants } from "./ui/button";
export function Header(){
  return (
    <header className="sticky top-0 z-40 bg-[--bg]/80 backdrop-blur border-b border-[--border]">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <a href="#/home" className="font-bold tracking-tight text-lg">Tienda RD</a>
        <nav className="hidden md:flex items-center gap-4">
          <a href="#/home" className="text-[--muted] hover:text-[--text]">Inicio</a>
          <a href="#/financing" className="text-[--muted] hover:text-[--text]">Financiamiento</a>
          <a href="#/blog" className="text-[--muted] hover:text-[--text]">Blog</a>
          <a href="#/contact" className="text-[--muted] hover:text-[--text]">Contacto</a>
        </nav>
        <a href="#/financing" className={buttonVariants({ variant:"outline", size:"sm" })}>Quiero Financiar</a>
      </div>
    </header>
  );
}

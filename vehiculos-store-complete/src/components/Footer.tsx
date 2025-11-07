import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube } from "lucide-react";
export function Footer(){
  return (
    <footer className="bg-[--surface] border-t border-[--border] py-16 mt-16">
      <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8 mb-10">
        <div className="space-y-3">
          <h4 className="font-semibold mb-2">Tienda RD</h4>
          <p className="text-sm text-[--muted]">Tu concesionario de confianza en República Dominicana. Vehículos verificados y financiamiento flexible.</p>
          <div className="flex items-center gap-3 text-[--muted]">
            <a href="#"><Facebook/></a>
            <a href="#"><Instagram/></a>
            <a href="#"><Youtube/></a>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Navegación</h4>
          <ul className="text-sm space-y-2 text-[--muted]">
            <li className="flex items-center gap-2"><MapPin size={16}/><a href="#/home" className="text-[--muted] hover:text-[--text]">Catálogo</a></li>
            <li className="flex items-center gap-2"><Phone size={16}/><a href="#/home" className="text-[--muted] hover:text-[--text]">Vehículos Nuevos</a></li>
            <li className="flex items-center gap-2"><Mail size={16}/><a href="#/home" className="text-[--muted] hover:text-[--text]">Vehículos Usados</a></li>
            <li className="flex items-center gap-2"><Clock size={16}/><a href="#/financing" className="text-[--muted] hover:text-[--text]">Financiamiento</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Contacto</h4>
          <ul className="text-sm space-y-2 text-[--muted]">
            <li className="flex items-center gap-2"><MapPin size={16}/>Santo Domingo</li>
            <li className="flex items-center gap-2"><Phone size={16}/> +1 (809) 000-0000</li>
            <li className="flex items-center gap-2"><Mail size={16}/> ventas@tiendard.com</li>
            <li className="flex items-center gap-2"><Clock size={16}/> Lun-Vie: 9am - 6pm</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Boletín</h4>
          <p className="text-sm text-[--muted] mb-3">Recibe las mejores ofertas y vehículos nuevos directamente en tu email.</p> 
          <form className="flex gap-2 mb-2">
            <input placeholder="Tu email" className="flex-1 rounded-xl border border-[--border] bg-[--bg] px-7"/>
          </form>
          <div> <button className="w-full text-[--primary-contrast] hover:text-[gray]/50">Suscribir</button> </div>
        </div>
      </div>
      <div className="container mx-auto text-xs grid-rows-1 grid-cols-2 flex justify-between">
         <div><p>© 2025 Vehículos RD. Todos los derechos reservados.</p></div>
          <div>
            <p>Diseñado por Jean Luis</p>
          </div>
        </div>
    </footer>
  );
}

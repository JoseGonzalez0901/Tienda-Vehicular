// src/pages/ContactPage.tsx
import React, { useMemo, useState } from "react";

/* ────────── Iconos inline (sin dependencias externas) ────────── */
const PhoneIcon   = (p:any)=>(<svg viewBox="0 0 24 24" className={p.className}><path fill="currentColor" d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1 .4 2.1.7 3.2.8.5 0 .9.4.9.9v3.5c0 .5-.4.9-.9.9C10.4 21 3 13.6 3 4.9c0-.5.4-.9.9-.9H8c.5 0 .9.4.9.9.1 1.1.4 2.2.8 3.2.2.4.1.9-.2 1.2l-2.9 2.4z"/></svg>);
const WhatsappIcon= (p:any)=>(<svg viewBox="0 0 24 24" className={p.className}><path fill="currentColor" d="M12.04 2C6.56 2 2.1 6.46 2.1 11.94c0 2.1.62 4.05 1.68 5.67L2 22l4.54-1.7c1.55 1 3.39 1.58 5.4 1.58 5.48 0 9.94-4.46 9.94-9.94C21.88 6.46 17.52 2 12.04 2m5.82 14.31c-.25.71-1.47 1.34-2.04 1.38-.53.04-1.2.06-1.94-.12-.45-.11-1.03-.33-1.79-.64-3.15-1.36-5.2-4.5-5.37-4.71-.17-.21-1.28-1.71-1.28-3.27 0-1.56.81-2.32 1.1-2.64.29-.32.64-.4.86-.4.22 0 .43 0 .62.01.2.01.46-.07.72.55.25.62.87 2.14.94 2.29.07.15.12.33.02.54-.1.21-.15.33-.3.51-.15.18-.32.4-.46.54-.15.15-.3.31-.13.61.17.29.74 1.21 1.6 1.96 1.1.98 2.03 1.28 2.33 1.42.3.14.48.12.65-.07.17-.19.75-.87.95-1.17.2-.3.4-.25.66-.15.26.1 1.66.78 1.94.92.28.14.47.21.54.33.07.12.07.71-.18 1.42Z"/></svg>);
const MailIcon    = (p:any)=>(<svg viewBox="0 0 24 24" className={p.className}><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6c0-1.1-.9-2-2-2m0 4-8 5L4 8V6l8 5 8-5z"/></svg>);
const MapPinIcon  = (p:any)=>(<svg viewBox="0 0 24 24" className={p.className}><path fill="currentColor" d="M12 2a6 6 0 0 0-6 6c0 4.8 5 10.2 5.6 10.8.23.25.57.25.8 0C13 18.2 18 12.8 18 8a6 6 0 0 0-6-6Zm0 8.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/></svg>);
const ClockIcon   = (p:any)=>(<svg viewBox="0 0 24 24" className={p.className}><path fill="currentColor" d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.262 10.262 0 0 0 12 1.75m.75 10.25V6.5h-1.5V13h6v-1.5Z"/></svg>);
const ArrowRight  = (p:any)=>(<svg viewBox="0 0 24 24" className={p.className}><path fill="currentColor" d="M10 17l5-5-5-5v10zM6 6h2v12H6z"/></svg>);
const CheckIcon   = (p:any)=>(<svg viewBox="0 0 24 24" className={p.className}><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>);
const UploadIcon  = (p:any)=>(<svg viewBox="0 0 24 24" className={p.className}><path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5z"/></svg>);

/* ────────── Tipos y helpers ────────── */
type OfficeKey = "santo-domingo" | "santiago" | "romana";

type FormData = {
  nombre: string; email: string; telefono: string; provincia: string;
  asunto: string; tipo: string; mensaje: string; acepta: boolean; asesor: boolean;
};

const initialForm: FormData = {
  nombre:"", email:"", telefono:"", provincia:"", asunto:"", tipo:"Consulta general",
  mensaje:"", acepta:false, asesor:true
};

const offices: Record<OfficeKey, {
  title:string; address:string; phone:string; whatsapp:string; email:string; iframe:string;
}> = {
  "santo-domingo": {
    title: "Santo Domingo (Matriz)",
    address: "Av. 27 de Febrero #123, Santo Domingo, RD",
    phone: "+1 (809) 555-0123",
    whatsapp: "+1 (809) 555-0123",
    email: "info@vehiculosrd.com",
    iframe:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3763.262!2d-69.93!3d18.47!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1ses!2sdo!4v1699999999999",
  },
  santiago: {
    title: "Santiago",
    address: "C/ Restauración #45, Santiago, RD",
    phone: "+1 (809) 222-9988",
    whatsapp: "+1 (809) 222-9988",
    email: "santiago@vehiculosrd.com",
    iframe:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3763.262!2d-70.70!3d19.45!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1ses!2sdo!4v1699999999998",
  },
  romana: {
    title: "La Romana",
    address: "Av. Libertad #12, La Romana, RD",
    phone: "+1 (809) 333-4477",
    whatsapp: "+1 (809) 333-4477",
    email: "romana@vehiculosrd.com",
    iframe:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3763.262!2d-68.97!3d18.43!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1ses!2sdo!4v1699999999997",
  },
};

const Stat = ({value,label}:{value:string;label:string})=>(
  <div className="text-center">
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-[--muted] text-xs">{label}</div>
  </div>
);

/* ────────── Página ────────── */
export default function ContactPage() {
  const [office, setOffice] = useState<OfficeKey>("santo-domingo");
  const [form, setForm]   = useState<FormData>(initialForm);
  const [sending, setSending] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const data = useMemo(()=>offices[office],[office]);

  const onChange = (k:keyof FormData, v:any)=> setForm(prev=>({...prev,[k]:v}));

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setSending(true); setOkMsg(null);
    try{
      // Opcional: envía al backend si tienes endpoint
      await fetch("/api/contact", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({...form, office})
      }).catch(()=>{ /* si no existe, seguimos sin romper */});
      setOkMsg("¡Gracias! Te contactaremos muy pronto.");
      setForm(initialForm);
    }finally{
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[--bg] text-[--text]">
      {/* Breadcrumb */}
      <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-6 text-sm text-[--muted]">
        <a href="#/" className="hover:text-[--text]">Inicio</a>
        <span className="mx-1">›</span>
        <span className="text-[--text] font-medium">Contacto</span>
      </div>

      {/* HERO */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 mt-6">
        <div className="rounded-2xl border border-[--border] p-6 md:p-10 text-center">
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight max-w-4xl mx-auto">
            Contáctanos & Conversemos
          </h1>
          <p className="text-[--muted] mt-3 max-w-2xl mx-auto">
            Elige tu sucursal, envíanos tu consulta o escríbenos por WhatsApp. Respondemos rápido y con información clara.
          </p>

          {/* Tabs de Sucursal */}
          <div className="mt-6 inline-flex gap-2 bg-[--bg] border border-[--border] rounded-full p-1">
            {([
              {k:"santo-domingo",label:"Santo Domingo"},
              {k:"santiago",label:"Santiago"},
              {k:"romana",label:"La Romana"},
            ] as {k:OfficeKey;label:string}[]).map(t=>(
              <button key={t.k}
                onClick={()=>setOffice(t.k)}
                className={`px-4 py-2 rounded-full text-sm ${office===t.k ? "bg-[--primary] text-[--primary-contrast]" : "hover:bg-[--surface]"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Acciones rápidas */}
          <div className="mt-8 flex flex-wrap justify-center gap-14">
            <a href={`tel:${data.phone}`} className="inline-flex items-center gap-2 px-12 py-3 rounded-xl border border-[--border] hover:bg-[--bg]">
              <PhoneIcon className="w-4 h-4" /> Llamar
            </a>
            <a href={`https://wa.me/${data.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-2 px-12 py-3 rounded-xl bg-[--primary] text-[--primary-contrast]">
              <WhatsappIcon className="w-4 h-4" /> WhatsApp
            </a>
            <a href={`mailto:${data.email}`} className="inline-flex items-center gap-2 px-12 py-3 rounded-xl border border-[--border] hover:bg-[--bg]">
              <MailIcon className="w-4 h-4" /> Email
            </a>
          </div>

          {/* Métricas */}
          <div className="mt-10 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <Stat value="2–4 h" label="Tiempo promedio de respuesta" />
            <Stat value="15k+" label="Consultas atendidas" />
            <Stat value="96%" label="Satisfacción" />
          </div>
        </div>
      </section>
      <div className="container max-w-7xl mx-auto px-4 md:px-6 mt-10 text-center">
        <p className="text-center text-5xl font-semibold mt-10 mb-3">Envíanos tu consulta</p>
        <p className="max-w-2xl mx-auto">Completa el formulario y nos pondremos en contacto contigo en menos de 24 horas. También puedes enviarnos un mensaje directo por WhatsApp.</p>         
      </div>
            

      {/* Formulario + Canales */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 mt-8 grid lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-[--border] bg-[--surface] p-6">
            <h2 className="text-lg font-semibold mb-4">Envíanos tu consulta</h2>
            <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
              <label className="text-sm">Nombre
                <input
                  className="mt-1 w-full rounded-xl bg-[--bg] border border-[--border] px-3 py-2"
                  value={form.nombre} onChange={e=>onChange("nombre", e.target.value)} required />
              </label>
              <label className="text-sm">Email
                <input type="email"
                  className="mt-1 w-full rounded-xl bg-[--bg] border border-[--border] px-3 py-2"
                  value={form.email} onChange={e=>onChange("email", e.target.value)} required />
              </label>
              <label className="text-sm">Teléfono
                <input
                  className="mt-1 w-full rounded-xl bg-[--bg] border border-[--border] px-3 py-2"
                  value={form.telefono} onChange={e=>onChange("telefono", e.target.value)} />
              </label>
              <label className="text-sm">Provincia
                <input
                  className="mt-1 w-full rounded-xl bg-[--bg] border border-[--border] px-3 py-2"
                  value={form.provincia} onChange={e=>onChange("provincia", e.target.value)} />
              </label>
              <label className="text-sm md:col-span-2">Asunto
                <input
                  className="mt-1 w-full rounded-xl bg-[--bg] border border-[--border] px-3 py-2"
                  value={form.asunto} onChange={e=>onChange("asunto", e.target.value)} />
              </label>
              <label className="text-sm">Tipo de solicitud
                <select
                  className="mt-1 w-full rounded-xl bg-[--bg] border border-[--border] px-3 py-2"
                  value={form.tipo} onChange={e=>onChange("tipo", e.target.value)}>
                  <option>Consulta general</option>
                  <option>Financiamiento</option>
                  <option>Vehículos disponibles</option>
                  <option>Post-venta / Garantías</option>
                </select>
              </label>
              <label className="text-sm md:col-span-2">Mensaje
                <textarea rows={4}
                  className="mt-1 w-full rounded-xl bg-[--bg] border border-[--border] px-3 py-2"
                  value={form.mensaje} onChange={e=>onChange("mensaje", e.target.value)} />
              </label>

              <div className="md:col-span-2 flex flex-col gap-2 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={form.asesor} onChange={e=>onChange("asesor", e.target.checked)} />
                  Quiero que un asesor me contacte por WhatsApp
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={form.acepta} onChange={e=>onChange("acepta", e.target.checked)} required />
                  Acepto la política de privacidad
                </label>
              </div>

              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <button disabled={sending}
                  className="px-4 py-2 rounded-xl bg-[--primary] text-[--primary-contrast] hover:bg-[--primary]/90 disabled:opacity-60">
                  {sending ? "Enviando..." : "Enviar mensaje"}
                </button>
                <button type="button"
                  onClick={()=>setForm(initialForm)}
                  className="px-4 py-2 rounded-xl border border-[--border] hover:bg-[--bg]">
                  Limpiar
                </button>
                {okMsg && <span className="text-[--success] text-sm">{okMsg}</span>}
              </div>
            </form>
          </div>
        </div>

        {/* Canales de contacto */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
            <div className="text-sm font-semibold mb-3">Nuestros canales</div>
            <div className="space-y-3">
              <a className="flex items-center justify-between rounded-xl border border-[--border] p-3 hover:bg-[--bg]"
                 href={`tel:${data.phone}`}>
                <span className="inline-flex items-center gap-2"><PhoneIcon className="w-4 h-4" /> {data.phone}</span>
                <ArrowRight className="w-4 h-4 text-[--muted]" />
              </a>
              <a className="flex items-center justify-between rounded-xl border border-[--border] p-3 hover:bg-[--bg]"
                 href={`https://wa.me/${data.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">
                <span className="inline-flex items-center gap-2"><WhatsappIcon className="w-4 h-4" /> WhatsApp</span>
                <ArrowRight className="w-4 h-4 text-[--muted]" />
              </a>
              <a className="flex items-center justify-between rounded-xl border border-[--border] p-3 hover:bg-[--bg]"
                 href={`mailto:${data.email}`}>
                <span className="inline-flex items-center gap-2"><MailIcon className="w-4 h-4" /> {data.email}</span>
                <ArrowRight className="w-4 h-4 text-[--muted]" />
              </a>
              <div className="rounded-xl border border-[--border] p-3">
                <div className="text-sm font-medium mb-1 inline-flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" /> Horario
                </div>
                <div className="text-xs text-[--muted] leading-6">
                  Lun–Vie: 8:00 AM – 6:00 PM<br/>Sáb: 8:00 AM – 4:00 PM
                </div>
              </div>
              <div className="rounded-xl border border-[--border] p-3">
                <div className="text-sm font-medium mb-1 inline-flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" /> Dirección
                </div>
                <div className="text-xs text-[--muted]">{data.address}</div>
              </div>
            </div>
          </div>

          {/* Subir documentos (opcional) */}
          <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
            <div className="text-sm font-semibold mb-2">Adjuntar documentos</div>
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[--border] hover:bg-[--bg] cursor-pointer">
              <UploadIcon className="w-4 h-4" /> Seleccionar archivo…
              <input type="file" className="hidden" />
            </label>
            <p className="text-[--muted] text-xs mt-2">Formatos aceptados: PDF, JPG, PNG (máx. 10MB)</p>
          </div>
        </div>
      </section>

      {/* Mapa y sucursal */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 mt-8">
        <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
          <h3 className="text-lg font-semibold mb-3">Ubicación — {data.title}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden border border-[--border] min-h-[260px]">
              <iframe title="mapa" src={data.iframe} className="w-full h-[260px]" loading="lazy" />
            </div>
            <div className="grid gap-3">
              <div className="rounded-xl border border-[--border] p-4">
                <div className="text-sm font-medium mb-1">Visítanos</div>
                <div className="text-[--muted] text-sm">{data.address}</div>
              </div>
              <div className="rounded-xl border border-[--border] p-4">
                <div className="text-sm font-medium mb-1">Beneficios de atención</div>
                <ul className="text-[--muted] text-sm space-y-1">
                  <li className="inline-flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[--success]" /> Asesoría personalizada</li>
                  <li className="inline-flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[--success]" /> Pruebas de manejo</li>
                  <li className="inline-flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[--success]" /> Opciones de financiamiento</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs simples */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 mt-8 mb-16">
        <div className="rounded-2xl border border-[--border]  p-6">
          <h3 className="text-lg font-semibold mb-4">Preguntas frecuentes</h3>
          <div className="grid md:grid-cols-2 gap-4 text-center">
            {[
              {q:"¿En cuánto tiempo responden?", a:"Usualmente entre 2 y 4 horas hábiles."},
              {q:"¿Puedo financiar un vehículo usado?", a:"Sí, contamos con planes para nuevos y usados."},
              {q:"¿Qué documentos necesito?", a:"Cédula, carta de trabajo/ingresos y estados bancarios."},
              {q:"¿Hacen envíos al interior?", a:"Coordinamos entregas y traslados a todo el país."},
            ].map((f,i)=>(
              <details key={i} className="rounded-xl border border-[--border] p-4">
                <summary className="font-medium cursor-pointer">{f.q}</summary>
                <p className="text-sm text-[--muted] mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 mb-20">
        <div className="rounded-2xl border border-[--border] bg-[--surface] p-8 text-center">
          <h3 className="text-xl font-bold">¿Listo para conversar?</h3>
          <p className="text-[--muted] mt-2">Escríbenos por WhatsApp y te ayudamos a elegir la mejor opción.</p>
          <a
            href={`https://wa.me/${data.whatsapp.replace(/\D/g,"")}`}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-[--primary] text-[--primary-contrast]"
            target="_blank" rel="noreferrer"
          >
            <WhatsappIcon className="w-4 h-4" /> Abrir WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}

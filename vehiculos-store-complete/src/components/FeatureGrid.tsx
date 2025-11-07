export function FeatureGrid(){
  const items = [
    { icon: <span className="material-symbols-outlined">fact_check</span>, title:"Vehículos Verificados", text:"Todos nuestros vehículos pasan por una rigurosa inspección de calidad" },
    { icon: <span className="material-symbols-outlined">acute</span>, title:"Atención rápida", text:"Respuesta inmediata a todas tus consultas a través de WhatsApp" },
    { icon:<span className="material-symbols-outlined">percent_discount</span>, title:"Financiamiento", text:"Planes flexibles adaptados a tu presupuesto y necesidades" },
  ];
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
      <section className="grid md:grid-cols-3 gap-4">
        {items.map((it, i)=>(
          <div key={i} className="rounded-2xl p-6 text-center">
            <div className="text-3xl">{it.icon}</div>
            <h3 className="heading font-semibold mt-2">{it.title}</h3>
            <p className="text-sm text-[--muted] mt-1">{it.text}</p>
          </div>
        ))}
      </section>
    </>
  );
}

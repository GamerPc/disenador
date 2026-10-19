/* =========================================================
   ESTILOS DE TÍTULO DE UN CLIC
   ========================================================= */
const ESTILOS_TITULO = [
  { n:'Impacto',     f:'Anton',            s:120, c:'#1f2330', mayus:true, efecto:'sticker',  css:"font-family:Anton;font-size:26px;color:#1f2330;text-shadow:0 0 0 #fff,1px 2px 3px rgba(0,0,0,.3)" },
  { n:'Burbuja',     f:'Fredoka', b:'700', s:110, c:'#ec4899', efecto:'sticker', css:"font-family:Fredoka;font-weight:700;font-size:26px;color:#ec4899;text-shadow:1px 2px 3px rgba(0,0,0,.3)" },
  { n:'Retro',       f:'Bebas Neue',       s:130, c:'#f59e0b', efecto:'retro',    css:"font-family:'Bebas Neue';font-size:30px;color:#f59e0b;text-shadow:3px 3px 0 #1f2330" },
  { n:'Neón',        f:'Fredoka', b:'600', s:100, c:'#a855f7', efecto:'neon',     css:"font-family:Fredoka;font-weight:600;font-size:24px;color:#a855f7;text-shadow:0 0 6px #a855f7,0 0 12px #a855f7" },
  { n:'Manuscrito',  f:'Caveat',  b:'700', s:120, c:'#7c3aed',                   css:"font-family:Caveat;font-weight:700;font-size:28px;color:#7c3aed" },
  { n:'Marcador',    f:'Permanent Marker', s:100, c:'#1f2330', efecto:'fondo',    css:"font-family:'Permanent Marker';font-size:22px;color:#1f2330;background:#fde047;padding:0 6px" },
  { n:'Elegante',    f:'Playfair Display', b:'700', it:true, s:100, c:'#78350f', efecto:'sombra', css:"font-family:'Playfair Display';font-weight:700;font-style:italic;font-size:24px;color:#78350f;text-shadow:1px 2px 4px rgba(0,0,0,.25)" },
  { n:'Hueco',       f:'Anton',            s:120, c:'#7c3aed', mayus:true, efecto:'hueco', css:"font-family:Anton;font-size:26px;color:transparent;-webkit-text-stroke:1.4px #7c3aed" },
  { n:'Degradado',   f:'Fredoka', b:'700', s:110, grad:['#7c3aed','#ec4899'],      css:"font-family:Fredoka;font-weight:700;font-size:26px;background:linear-gradient(90deg,#7c3aed,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent" },
  { n:'En arco',     f:'Fredoka', b:'700', s:90,  c:'#0d9488', mayus:true, curva:45, css:"font-family:Fredoka;font-weight:700;font-size:22px;color:#0d9488" },
  { n:'Escolar',     f:'Gochi Hand',       s:110, c:'#1e3a8a', efecto:'contorno', css:"font-family:'Gochi Hand';font-size:26px;color:#1e3a8a" },
  { n:'Pizarra',     f:'Amatic SC', b:'700', s:130, c:'#ffffff', fondoPizarra:true, css:"font-family:'Amatic SC';font-weight:700;font-size:28px;color:#fff;background:#14532d;padding:0 8px;border-radius:4px" }
];
function agregarTitulo(e){
  const k = s();
  const texto = e.mayus ? 'TU TÍTULO AQUÍ' : 'Tu título aquí';
  if (e.fondoPizarra){                      // pizarrón con el texto adentro: se mueven y crecen juntos
    const caja = new fabric.Rect({ left:W/2, top:H/2, originX:'center', originY:'center', width:760 * k, height:210 * k, rx:18 * k, ry:18 * k,
      fill:'#14532d', stroke:'#a16207', strokeWidth:14 * k, strokeUniform:true });
    restaurando = true;
    agregar(caja, 'Pizarra');
    const tp = crearTextoVinculado(caja, texto, { fontFamily:e.f, fontSize:e.s * k, fontWeight:e.b || '400', fill:e.c });
    canvas.add(tp); ordenarVinculos();
    restaurando = false;
    const listo = () => { fabric.util.clearFabricFontCache(e.f); tp.initDimensions(); ajustarFormaATexto(tp); canvas.setActiveObject(caja); canvas.requestRenderAll(); renderCapas(); guardarEstado(); };
    document.fonts.load(`${e.b || 400} 40px "${e.f}"`).then(listo, listo);
    return;
  }
  const t = agregarTexto('titulo', { text:texto, fontFamily:e.f, fontSize:e.s * k, fontWeight:e.b || '400', fontStyle:e.it ? 'italic' : 'normal',
    fill: e.grad ? new fabric.Gradient({ type:'linear', gradientUnits:'percentage', coords:{ x1:0, y1:0, x2:1, y2:0 },
      colorStops:[{ offset:0, color:e.grad[0] }, { offset:1, color:e.grad[1] }] }) : e.c });
  const termina = () => {
    fabric.util.clearFabricFontCache(e.f); t.initDimensions();
    if (e.efecto) aplicarEfectoTexto(t, e.efecto);
    if (e.curva) aplicarCurva(t, e.curva, true);
    canvas.requestRenderAll(); actualizarPanel(); guardarEstado();
  };
  document.fonts.load(`${e.b || 400} 40px "${e.f}"`).then(termina, termina);
}
ESTILOS_TITULO.forEach(e => {
  const b = document.createElement('button'); b.className = 'tituloBtn'; b.title = e.n;
  b.innerHTML = `<span style="${e.css}">${e.n}</span>`;
  b.onclick = () => agregarTitulo(e);
  $('estilosTitulo').appendChild(b);
});


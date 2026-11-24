/* =========================================================
   «DISEÑAR» DESDE EL CALENDARIO: EL DISEÑO SALE ARMADO
   Antes solo se copiaba el texto y había que pegarlo en una plantilla.
   Ahora se elige un estilo y se arma un diseño editable con:
   - la medida de la red y el formato (historia 1080×1920, Instagram 1080×1350, X 1600×900…),
   - el tema como título, el texto, la llamada a la acción y los hashtags, ya acomodados.
   «Mi marca» usa los colores, letras y logo del Kit de marca.
   También regresa el botón Sencillo/Completo a la barra de arriba en la computadora.
   ========================================================= */
function medidaPost(p){
  const f = p.formato || '', r = p.plataforma || '';
  if (/Historia|Reel/.test(f) || r === 'TikTok') return [1080, 1920];
  if (r === 'YouTube') return [1280, 720];
  if (r === 'X') return [1600, 900];
  if (r === 'Pinterest') return [1000, 1500];
  if (r === 'LinkedIn') return [1200, 1200];
  if (r === 'Instagram') return [1080, 1350];
  return [1080, 1080];
}
const ESTILOS_POST = {
  marca:   { nombre:'Mi marca', d:'Tus colores, letras y logo', tema(){ const [p, s, a, o, f] = kit.colores, osc = luzDe(f) < 0.45;
             return { fondo:f, titulo:o, texto:osc ? mezclar(o, f, 0.25) : mezclar(o, f, 0.25), acento:p, acento2:s, cta:p, ctaTxt:luzDe(p) > 0.6 ? '#111827' : '#ffffff', fTit:kit.titulo || 'Fredoka', fTxt:kit.texto || 'Poppins', peso:'700', logo:true }; } },
  neon:    { nombre:'Neón', d:'Oscuro y llamativo', tema:() => ({ fondo:'#05070d', titulo:'#ffffff', texto:'#cfe9ff', acento:'#19c8ff', acento2:'#ff3b30', cta:'#19c8ff', ctaTxt:'#05070d', fTit:'Montserrat', fTxt:'Poppins', peso:'900', brillo:true }) },
  elegante:{ nombre:'Elegante', d:'Claro y limpio', tema:() => ({ fondo:'#f6f1ea', titulo:'#1f2330', texto:'#4b5563', acento:'#c2410c', acento2:'#e7d8c6', cta:'#1f2330', ctaTxt:'#ffffff', fTit:'Playfair Display', fTxt:'Inter', peso:'700' }) },
  colorido:{ nombre:'Colorido', d:'Alegre, con degradado', tema:() => ({ degradado:['#7c3aed', '#f97316'], fondo:'#7c3aed', titulo:'#ffffff', texto:'#fff7ed', acento:'#fde047', acento2:'#ffffff', cta:'#fde047', ctaTxt:'#1f2330', fTit:'Fredoka', fTxt:'Poppins', peso:'700' }) }
};
// achica la letra hasta que el texto quepa en el alto que le toca
function caberTexto(t, altoMax, tamMax, tamMin){
  const ancho = t.width, noCabe = () => t.height > altoMax || (t.dynamicMinWidth || 0) > ancho + 0.5;   // ni muy alto ni una palabra más ancha que la caja
  let s = tamMax; t.set('fontSize', s); t.initDimensions();
  while (noCabe() && s > tamMin){ s = Math.max(tamMin, Math.floor(s * 0.92)); t.set({ fontSize:s, width:ancho }); t.initDimensions(); }
  t.set('width', ancho); t.initDimensions();
  return t;
}
// Arma un diseño de una página con: eyebrow, titulo, subtitulo, texto, puntos[], datos[], cta, pie.
// Lo usan «Diseñar» del calendario y «Diseño con IA». Todo queda editable.
function armarDiseno(c, clave, w, h, enVista = false){          // enVista: dentro de vistaDe (lienzo invisible), sin tocar la interfaz
  const e = ESTILOS_POST[clave].tema(), horizontal = w > h, base = Math.min(w, h) * (h / w > 1.6 ? 1.3 : 1);   // historias: todo más grande
  const m = Math.round(Math.min(w, h) * 0.08), ancho = horizontal ? Math.round(w * 0.62) : w - 2 * m, x0 = m;
  if (!enVista){ fijarTamano(w, h); restaurando = true; canvas.clear(); }
  if (e.degradado) DEGRADADO(e.degradado[0], e.degradado[1]); else FONDO(e.fondo);
  const forma = (o, nombre) => { o.set({ selectable:true, name:nombre, id:nuevoId() }); canvas.add(o); return o; };
  // adornos según el estilo
  if (clave === 'neon'){
    forma(new fabric.Circle({ left:w - base * 0.18, top:-base * 0.2, radius:base * 0.32, fill:'transparent', stroke:e.acento, strokeWidth:base * 0.012, opacity:0.9,
      shadow:new fabric.Shadow({ color:e.acento, blur:base * 0.05 }) }), 'Anillo');
    forma(new fabric.Rect({ left:0, top:h - base * 0.025, width:w, height:base * 0.025, fill:e.acento2 }), 'Franja');
  } else if (clave === 'elegante'){
    forma(new fabric.Rect({ left:m * 0.5, top:m * 0.5, width:w - m, height:h - m, fill:'transparent', stroke:e.acento2, strokeWidth:base * 0.006 }), 'Marco');
  } else if (clave === 'colorido'){
    forma(new fabric.Circle({ left:w - base * 0.35, top:-base * 0.12, radius:base * 0.3, fill:'#ffffff', opacity:0.12 }), 'Círculo');
    forma(new fabric.Circle({ left:-base * 0.15, top:h - base * 0.35, radius:base * 0.25, fill:e.acento, opacity:0.25 }), 'Círculo');
  } else {
    forma(new fabric.Rect({ left:0, top:0, width:w, height:base * 0.02, fill:e.acento }), 'Franja');
    forma(new fabric.Circle({ left:w - base * 0.3, top:h - base * 0.3, radius:base * 0.36, fill:e.acento2, opacity:0.18 }), 'Círculo');
  }
  if (horizontal && clave !== 'elegante') forma(new fabric.Circle({ left:w * 0.7, top:h * 0.18, radius:h * 0.32, fill:e.acento, opacity:0.16 }), 'Círculo');
  const txt = (texto, o) => { const t = new fabric.Textbox(texto, { left:x0, top:0, width:ancho, fontFamily:o.f, fontWeight:o.b || '400', fill:o.c, textAlign:'left',
    lineHeight:o.lh || 1.2, charSpacing:o.cs || 0, name:o.n, id:nuevoId() }); return caberTexto(t, o.alto, o.max, o.min); };
  const puntos = (c.puntos || []).filter(Boolean).slice(0, 6), datos = (c.datos || []).filter(Boolean).slice(0, 4);
  const mucho = !!c.texto + (puntos.length ? 1 : 0) + !!c.subtitulo + (datos.length ? 1 : 0);
  const reservaAbajo = c.pie ? base * 0.12 : m, arriba = m + (e.logo ? base * 0.1 : 0), libre = h - arriba - reservaAbajo;
  // se arma la pila de textos; si no cabe en el alto libre, todo se achica un poco y se vuelve a intentar
  let piezas = [];
  for (let f = 1; f > 0.5; f *= 0.9){
    piezas = [];
    if (c.eyebrow) piezas.push([txt(String(c.eyebrow).toUpperCase(), { f:e.fTxt, b:'700', c:e.acento, n:'Encabezado', alto:base * 0.06 * f, max:Math.round(base * 0.03 * f), min:14, cs:120 }), base * 0.025 * f]);
    piezas.push([txt(c.titulo || 'Tu título', { f:e.fTit, b:e.peso, c:e.titulo, n:'Título', alto:h * (mucho > 1 ? 0.24 : mucho ? 0.3 : 0.45) * f, max:Math.round(base * 0.11 * f), min:Math.round(base * 0.04 * f), lh:1.05 }), base * 0.025 * f]);
    if (c.subtitulo) piezas.push([txt(c.subtitulo, { f:e.fTxt, b:'600', c:e.titulo, n:'Subtítulo', alto:h * 0.09 * f, max:Math.round(base * 0.05 * f), min:Math.round(base * 0.024 * f), lh:1.2 }), base * 0.025 * f]);
    piezas.push([new fabric.Rect({ left:x0, top:0, width:base * 0.12, height:Math.max(6, base * 0.008), fill:e.acento, rx:4, ry:4, name:'Línea', id:nuevoId() }), base * 0.035 * f]);
    if (c.texto) piezas.push([txt(c.texto, { f:e.fTxt, c:e.texto, n:'Texto', alto:h * (puntos.length ? 0.16 : horizontal ? 0.3 : 0.26) * f, max:Math.round(base * 0.042 * f), min:Math.round(base * 0.022 * f), lh:1.35 }), base * 0.035 * f]);
    if (puntos.length) piezas.push([txt(puntos.map(x => '•  ' + x).join('\n'), { f:e.fTxt, b:'500', c:e.texto, n:'Puntos', alto:h * 0.24 * f, max:Math.round(base * 0.04 * f), min:Math.round(base * 0.022 * f), lh:1.45 }), base * 0.035 * f]);
    if (datos.length) piezas.push([txt(datos.join('   ·   '), { f:e.fTxt, b:'700', c:e.acento, n:'Datos', alto:h * 0.09 * f, max:Math.round(base * 0.036 * f), min:Math.round(base * 0.02 * f), lh:1.3 }), base * 0.04 * f]);
    if (c.cta){
      const tam = Math.round(base * 0.034 * f), anchoP = Math.min(ancho, Math.max(base * 0.4 * f, c.cta.length * tam * 0.62 + tam * 2.4)), altoP = Math.round(tam * 2.5);
      piezas.push([{ alto:altoP, colocar:yy => nodo('pildora', c.cta, x0 + anchoP / 2, yy + altoP / 2, { w:anchoP, h:altoP, fill:e.cta, color:e.ctaTxt, tam, fuente:e.fTxt, peso:'700', nombre:'Llamada a la acción' }) }, 0]);
    }
    const total = piezas.reduce((s, [o, g], i) => s + (o.colocar ? o.alto : o.getScaledHeight()) + (i < piezas.length - 1 ? g : 0), 0);
    if (total <= libre) break;
  }
  const altoDe = o => o.colocar ? o.alto : o.getScaledHeight();
  const altoTotal = piezas.reduce((s, [o, g], i) => s + altoDe(o) + (i < piezas.length - 1 ? g : 0), 0);
  let y = Math.max(arriba, arriba + (libre - altoTotal) / 2);
  piezas.forEach(([o, g]) => {
    const alto = altoDe(o);
    if (o.colocar) o.colocar(y);
    else { o.set({ originX:'left', originY:'top', left:x0, top:y }); o.setCoords(); canvas.add(o); }
    y += alto + g;
  });
  if (c.pie) canvas.add(txt(c.pie, { f:e.fTxt, b:'600', c:e.acento, n:'Pie', alto:base * 0.07, max:Math.round(base * 0.028), min:14 }).set({ top:h - m - base * 0.04 }));
  if (e.logo && typeof logoEn === 'function') logoEn(w - m - base * 0.08, m + base * 0.05, base * 0.16);
  if (typeof ordenarVinculos === 'function') ordenarVinculos();
  canvas.getObjects().filter(o => o.textoDe).forEach(t => { try { ajustarFormaATexto(t); } catch (er) {} });
  if (enVista) return;
  restaurando = false;
  $('nombreDiseno').value = String(c.titulo || 'Mi diseño').slice(0, 60);
  canvas.discardActiveObject(); canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado();
}
function crearPostDesdePlan(p, clave){
  const [w, h] = medidaPost(p);
  armarDiseno({ eyebrow:p.campana, titulo:p.tema, texto:p.texto, cta:p.cta, pie:p.tags }, clave, w, h);
}
(function(){
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'mEstiloPost';
  m.innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="epTitulo">
    <h3 id="epTitulo">¿Con qué estilo armo tu publicación?</h3>
    <p class="epNota" id="epNota"></p>
    <div class="epLista" id="epLista"></div>
    <div class="acciones"><button class="btnS" id="epPlantillas">Prefiero elegir una plantilla</button><button class="btnS" id="epCerrar">Cancelar</button></div>
  </div>`;
  document.body.appendChild(m);
  $('epCerrar').onclick = () => cerrarModal('mEstiloPost');
  m.addEventListener('click', ev => { if (ev.target === m) cerrarModal('mEstiloPost'); });
})();
{ const original = prDisenar;
  prDisenar = async function(id){
    const p = prPlanes.find(x => x.id === id); if (!p) return;
    const [w, h] = medidaPost(p);
    $('epNota').textContent = `${p.plataforma} · ${p.formato || 'Publicación'} · ${w} × ${h} px. Todo queda editable.`;
    const lista = $('epLista'); lista.innerHTML = '';
    Object.entries(ESTILOS_POST).forEach(([k, est]) => {
      const t = est.tema(), b = document.createElement('button'); b.type = 'button'; b.className = 'epEstilo';
      const fondo = t.degradado ? `linear-gradient(135deg,${t.degradado[0]},${t.degradado[1]})` : t.fondo;
      b.innerHTML = `<span class="epMuestra" style="background:${fondo}"><b style="color:${t.titulo};font-family:'${t.fTit}'">Aa</b><i style="background:${t.acento}"></i></span><span><b>${esc(est.nombre)}</b><small>${esc(est.d)}</small></span>`;
      b.onclick = () => {
        cerrarModal('mEstiloPost'); cerrarModal('mPlanRedes');
        if (typeof hayDisenoInicio === 'function' && hayDisenoInicio()){
          const nom = ($('nombreDiseno').value || 'Mi diseño').trim();
          if (!confirm(`Se va a armar «${p.tema}» en una hoja nueva.\n\nTu diseño «${nom}» se va a cambiar. Si lo quieres conservar, toca «Cancelar» y guárdalo primero.`)) return;
        }
        if (typeof disenoEnBlanco === 'function') disenoEnBlanco();
        if (typeof cerrarInicio === 'function' && $('inicioApp') && !$('inicioApp').hidden) cerrarInicio();
        crearPostDesdePlan(p, k);
        if (['Idea', 'Borrador', 'Cambios solicitados'].includes(prEstadoNormal(p.estado))){ p.estado = 'En diseño'; p.actualizado = new Date().toISOString(); prGuardar(); }
        toast('✓ Listo: tu publicación ya está armada. Toca cualquier texto para cambiarlo.');
      };
      lista.appendChild(b);
    });
    $('epPlantillas').onclick = () => { cerrarModal('mEstiloPost'); original(id); };
    abrirModal('mEstiloPost');
  };
}
// Sencillo/Completo otra vez a la vista en la barra de arriba (en el celular se cambia desde Vista)
(function(){ const b = $('bModo'), n = $('nombreDiseno'); if (b && n && b.parentElement && b.parentElement.id === 'maVista') n.after(b); })();

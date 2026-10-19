/* =========================================================
   PLUMA (formas a tu medida) Y MIS FUENTES
   ========================================================= */
// ---------- Pluma: clic = punto recto · arrastrar = curva · clic en el primer punto = cerrar ----------
let pluma = null;   // { pts:[{x,y,h}], arrastre, mouse }
function avisoPluma(texto){
  let d = $('plumaAviso');
  if (!d){ d = document.createElement('div'); d.id = 'plumaAviso'; $('dibujoAviso').parentNode.appendChild(d); }
  d.innerHTML = texto; d.style.display = texto ? 'flex' : 'none';
}
function activarPluma(on){
  if (on && pluma) return;
  if (!on){
    if (!pluma) return;
    pluma = null; canvas.skipTargetFind = false; canvas.selection = true; canvas.defaultCursor = 'default';
    canvas.clearContext(canvas.contextTop); avisoPluma(''); $('bPluma') && $('bPluma').classList.remove('on');
    canvas.requestRenderAll(); return;
  }
  if (canvas.isDrawingMode) activarDibujo(null);
  if (typeof modoConector !== 'undefined' && modoConector) activarModoConector(false);
  if (activo() && activo().isEditing) activo().exitEditing();
  canvas.discardActiveObject(); canvas.requestRenderAll();
  pluma = { pts:[], arrastre:null, mouse:null };
  canvas.skipTargetFind = true; canvas.selection = false; canvas.defaultCursor = 'crosshair';
  $('bPluma') && $('bPluma').classList.add('on');
  if (document.body.classList.contains('tactil')){ abrirLateral && abrirLateral(false); alternarProps && alternarProps(false); }
  avisoPluma('✒ <span>Toca para poner puntos · arrastra para hacer curvas · toca el primer punto para cerrar</span>' +
    '<button onclick="deshacerPuntoPluma()">↶ Punto</button><button onclick="terminarPluma(false)">✓ Terminar</button><button onclick="activarPluma(false)">✕</button>');
}
const puntoCtrl = (p, signo) => p.h ? { x:p.x + p.h.x * signo, y:p.y + p.h.y * signo } : { x:p.x, y:p.y };
function trazoPluma(pts, cerrar){
  if (!pts.length) return '';
  const f = n => +n.toFixed(2);
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  const seg = (a, b) => (a.h || b.h)
    ? (() => { const c1 = puntoCtrl(a, 1), c2 = puntoCtrl(b, -1); return ` C ${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(b.x)} ${f(b.y)}`; })()
    : ` L ${f(b.x)} ${f(b.y)}`;
  for (let i = 1; i < pts.length; i++) d += seg(pts[i - 1], pts[i]);
  if (cerrar && pts.length > 2) d += seg(pts[pts.length - 1], pts[0]) + ' Z';
  return d;
}
function dibujarPluma(){
  if (!pluma) return;
  const ctx = canvas.contextTop; canvas.clearContext(ctx);
  const pts = pluma.pts.slice();
  if (!pts.length) return;
  ctx.save(); ctx.scale(zoom, zoom);
  const lw = 2 / zoom;
  // vista previa del tramo que sigue (hasta el mouse)
  const prev = pluma.mouse && !pluma.arrastre ? [...pts, { x:pluma.mouse.x, y:pluma.mouse.y, h:null }] : pts;
  const p2 = new Path2D(trazoPluma(prev, false));
  if (pts.length > 2){ ctx.fillStyle = 'rgba(25,200,255,.10)'; ctx.fill(new Path2D(trazoPluma(pts, true))); }
  ctx.strokeStyle = '#19c8ff'; ctx.lineWidth = lw * 1.5; ctx.stroke(p2);
  pts.forEach((p, i) => {
    if (p.h){
      const a = puntoCtrl(p, -1), b = puntoCtrl(p, 1);
      ctx.strokeStyle = 'rgba(255,75,43,.9)'; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      [a, b].forEach(q => { ctx.fillStyle = '#ff4b2b'; ctx.beginPath(); ctx.arc(q.x, q.y, 4 / zoom, 0, 7); ctx.fill(); });
    }
    ctx.fillStyle = i === 0 ? '#ff4b2b' : '#ffffff'; ctx.strokeStyle = '#19c8ff'; ctx.lineWidth = lw;
    const r = (i === 0 && pts.length > 2 ? 9 : 6) / zoom;
    ctx.beginPath(); ctx.rect(p.x - r, p.y - r, r * 2, r * 2); ctx.fill(); ctx.stroke();
  });
  ctx.restore();
}
function deshacerPuntoPluma(){ if (pluma && pluma.pts.length){ pluma.pts.pop(); dibujarPluma(); } }
function terminarPluma(cerrar){
  if (!pluma) return;
  const pts = pluma.pts;
  if (pts.length < 2){ toast('Pon por lo menos dos puntos'); return; }
  const k = s(), color = $('colorForma').value;
  const cerrada = cerrar && pts.length > 2;
  const o = new fabric.Path(trazoPluma(pts, cerrada), cerrada
    ? { fill:color, stroke:null, strokeWidth:0 }
    : { fill:'rgba(0,0,0,0)', stroke:color, strokeWidth:Math.max(2, 8 * k), strokeLineCap:'round', strokeLineJoin:'round', strokeUniform:true });
  if (!cerrada) o.relleno = { tipo:'ninguno', c1:color, c2:'#ffffff', ang:45, gros:14, sep:14, transp:true };
  activarPluma(false);
  agregar(o, cerrada ? 'Forma con pluma' : 'Línea con pluma');
  renderCapas(); actualizarPanel(); guardarEstado();
  toast(cerrada ? 'Forma lista: cámbiale el color, el relleno o ponle resplandor en el panel derecho.' : 'Línea lista. Para que tenga relleno, ciérrala tocando el primer punto.');
}
canvas.on('mouse:down', e => {
  if (!pluma) return;
  const p = canvas.getPointer(e.e), pts = pluma.pts, tol = 12 / zoom;
  if (pts.length > 2 && Math.hypot(p.x - pts[0].x, p.y - pts[0].y) < tol){ terminarPluma(true); return; }
  const nuevo = { x:p.x, y:p.y, h:null };
  pts.push(nuevo); pluma.arrastre = nuevo; dibujarPluma();
});
canvas.on('mouse:move', e => {
  if (!pluma) return;
  const p = canvas.getPointer(e.e);
  pluma.mouse = p;
  const a = pluma.arrastre;
  if (a){ const dx = p.x - a.x, dy = p.y - a.y; a.h = Math.hypot(dx, dy) > 4 / zoom ? { x:dx, y:dy } : null; }
  dibujarPluma();
});
canvas.on('mouse:up', () => { if (pluma){ pluma.arrastre = null; dibujarPluma(); } });
canvas.on('mouse:dblclick', () => { if (pluma){ pluma.pts.pop(); terminarPluma(false); } });
window.addEventListener('keydown', e => {
  if (!pluma) return;
  if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); activarPluma(false); }
  else if (e.key === 'Enter'){ e.preventDefault(); e.stopPropagation(); terminarPluma(false); }
  else if (e.key === 'Backspace' || e.key === 'Delete'){ e.preventDefault(); e.stopPropagation(); deshacerPuntoPluma(); }
}, true);
const activarDibujoBase24 = activarDibujo;
activarDibujo = function(tipo){ if (tipo) activarPluma(false); return activarDibujoBase24.apply(this, arguments); };

// ---------- Mis fuentes: sube un archivo .ttf, .otf, .woff o .woff2 ----------
const BD_FUENTES = 'apik-fuentes';
const bdFuentes = () => new Promise((ok, mal) => {
  const r = indexedDB.open(BD_FUENTES, 1);
  r.onupgradeneeded = () => r.result.createObjectStore('fuentes', { keyPath:'nombre' });
  r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error);
});
const pedirBD = r => new Promise((ok, mal) => { r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); });
async function fuentesGuardadas(){ try { const bd = await bdFuentes(); return await pedirBD(bd.transaction('fuentes').objectStore('fuentes').getAll()); } catch (e) { return []; } }
const misFuentes = {};   // nombre -> dataURL (para incluirlas al exportar SVG)
function registrarFuente(nombre, buffer, dataURL){
  const ff = new FontFace(nombre, buffer);
  return ff.load().then(f => {
    document.fonts.add(f); misFuentes[nombre] = dataURL;
    if (![...$('pFuente').options].some(o => o.value === nombre)){
      let grupo = $('pFuente').querySelector('optgroup[label="Mis fuentes"]');
      if (!grupo){ grupo = document.createElement('optgroup'); grupo.label = 'Mis fuentes'; $('pFuente').prepend(grupo); }
      const op = document.createElement('option'); op.value = nombre; op.textContent = nombre; op.style.fontFamily = `"${nombre}"`; grupo.appendChild(op);
    }
    if (!FUENTES.includes(nombre)) FUENTES.push(nombre);
    fabric.util.clearFabricFontCache(nombre);
    pintarMisFuentes();
  });
}
function pintarMisFuentes(){
  const c = $('listaMisFuentes'); if (!c) return;
  const ns = Object.keys(misFuentes);
  c.innerHTML = ns.length ? '' : '<p class="hint" style="font-size:12px">Aún no subes ninguna.</p>';
  ns.forEach(n => {
    const fila = document.createElement('div'); fila.className = 'filaFuente';
    const b = document.createElement('button'); b.className = 'bigbtn'; b.style.fontFamily = `"${n}"`; b.style.fontSize = '20px'; b.textContent = n;
    b.title = 'Agregar un texto con esta fuente (o cambiar el texto seleccionado)';
    b.onclick = () => {
      const ts = textos();
      if (ts.length){ ts.forEach(t => { t.set('fontFamily', n); t.initDimensions(); }); canvas.requestRenderAll(); actualizarPanel(); guardarEstado(); }
      else agregarTexto('titulo', { text:'Tu texto', fontFamily:n });
    };
    const x = document.createElement('button'); x.className = 'pb'; x.textContent = '✕'; x.title = 'Quitar esta fuente de este navegador';
    x.onclick = async () => {
      if (!confirm('¿Quitar la fuente “' + n + '”? Los textos que la usan se verán con otra letra.')) return;
      try { const bd = await bdFuentes(); await pedirBD(bd.transaction('fuentes', 'readwrite').objectStore('fuentes').delete(n)); } catch (e) {}
      delete misFuentes[n]; pintarMisFuentes();
    };
    fila.append(b, x); c.appendChild(fila);
  });
}
async function subirFuente(archivo){
  if (!archivo) return;
  if (!/\.(ttf|otf|woff2?)$/i.test(archivo.name)) return toast('Ese archivo no es una fuente. Usa .ttf, .otf, .woff o .woff2');
  if (archivo.size > 8 * 1048576) return toast('La fuente pesa más de 8 MB; busca otra versión más ligera');
  const nombre = archivo.name.replace(/\.(ttf|otf|woff2?)$/i, '').replace(/[-_]+/g, ' ').replace(/[^\p{L}\p{N} ]/gu, '').trim().slice(0, 40) || 'Mi fuente';
  const buffer = await archivo.arrayBuffer();
  const dataURL = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(archivo); });
  try { await registrarFuente(nombre, buffer, dataURL); }
  catch (e) { return toast('No se pudo leer esa fuente. Prueba con otro archivo.'); }
  try { const bd = await bdFuentes(); await pedirBD(bd.transaction('fuentes', 'readwrite').objectStore('fuentes').put({ nombre, datos:dataURL, fecha:new Date().toISOString() })); } catch (e) {}
  const ts = textos();
  if (ts.length){ ts.forEach(t => { t.set('fontFamily', nombre); t.initDimensions(); }); canvas.requestRenderAll(); guardarEstado(); actualizarPanel(); }
  toast('Fuente “' + nombre + '” lista. La encuentras al inicio de la lista de fuentes.');
}
(async function(){
  for (const f of await fuentesGuardadas()){
    try { const buf = await (await fetch(f.datos)).arrayBuffer(); await registrarFuente(f.nombre, buf, f.datos); } catch (e) {}
  }
  pintarMisFuentes();
  // los diseños que usan estas fuentes se vuelven a dibujar cuando ya cargaron
  canvas.getObjects().filter(esTexto).forEach(t => { if (misFuentes[t.fontFamily]){ t.initDimensions(); t.dirty = true; } });
  canvas.requestRenderAll();
})();
// En el SVG se incluyen también tus fuentes subidas
const cssDeFuenteBase24 = cssDeFuente;
cssDeFuente = async function(familia, pesos){
  if (misFuentes[familia]) return `@font-face{font-family:'${familia}';src:url(${misFuentes[familia]});}`;
  return cssDeFuenteBase24(familia, pesos);
};
$('archivoFuente').addEventListener('change', e => { subirFuente(e.target.files[0]); e.target.value = ''; });


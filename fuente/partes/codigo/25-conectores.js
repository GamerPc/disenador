/* =========================================================
   CONECTORES
   ========================================================= */
function candidatosConexion(){
  return canvas.getActiveObjects().filter(o => o.type !== 'conector' && !o.textoDe);
}
function puntoBorde(r, hacia, obj){
  const cx = r.left + r.width/2, cy = r.top + r.height/2, dx = hacia.x - cx, dy = hacia.y - cy;
  if (!dx && !dy) return { x:cx, y:cy };
  if (obj && (obj.type === 'circle' || obj.type === 'ellipse')){   // borde redondo real
    const rx = r.width/2, ry = r.height/2, t = 1 / Math.sqrt((dx*dx)/(rx*rx) + (dy*dy)/(ry*ry));
    return { x: cx + dx*Math.min(t, 1), y: cy + dy*Math.min(t, 1) };
  }
  const sx = dx ? (r.width/2) / Math.abs(dx) : Infinity, sy = dy ? (r.height/2) / Math.abs(dy) : Infinity;
  const t = Math.min(sx, sy, 1);
  return { x: cx + dx*t, y: cy + dy*t };
}
// Elige los lados que se "miran" entre dos formas, según dónde está cada una
function ladosAuto(ra, rb){
  const gx = Math.max(rb.left - (ra.left + ra.width), ra.left - (rb.left + rb.width));
  const gy = Math.max(rb.top - (ra.top + ra.height), ra.top - (rb.top + rb.height));
  const ca = { x: ra.left + ra.width/2, y: ra.top + ra.height/2 }, cb = { x: rb.left + rb.width/2, y: rb.top + rb.height/2 };
  if (gx >= gy && gx > 0) return cb.x > ca.x ? ['der','izq'] : ['izq','der'];
  if (gy > 0) return cb.y > ca.y ? ['aba','arr'] : ['arr','aba'];
  const l = ladoHacia(ra, cb);
  return [l, { der:'izq', izq:'der', arr:'aba', aba:'arr' }[l]];
}
// Recalcula por dónde pasa el conector cada vez que algo se mueve
function actualizarConector(c){
  if (c.group) return;
  // un extremo puede estar unido a una forma o suelto en un punto (libreA / libreB)
  const a = porId(c.conA), b = porId(c.conB);
  if ((!a && !c.libreA) || (!b && !c.libreB)) return;
  const punto = q => ({ left:q.x, top:q.y, width:0, height:0 });
  const ra = a ? cajaAbs(a) : punto(c.libreA), rb = b ? cajaAbs(b) : punto(c.libreB);
  const suelto = !a && !b;
  c.lockMovementX = c.lockMovementY = !suelto;
  let [la, lb] = (c.fijo && c.ladoA && c.ladoB) ? [c.ladoA, c.ladoB] : ladosAuto(ra, rb);
  // punto exacto del borde elegido a mano (anclaA / anclaB): se mueve con la forma
  if (a && c.anclaA) la = c.anclaA.lado; if (b && c.anclaB) lb = c.anclaB.lado;
  const redonda = o => !!o && (['circle','ellipse'].includes(o.type) || ['nube','blob'].includes(o.forma));
  const ca = { x: ra.left + ra.width/2, y: ra.top + ra.height/2 }, cb = { x: rb.left + rb.width/2, y: rb.top + rb.height/2 };
  const recta = (c.estilo || 'recta') === 'recta' && !c.fijo;
  const enAncla = (r, an, o) => { const q = { x:r.left + an.u * r.width, y:r.top + an.v * r.height }; return redonda(o) ? puntoBorde(r, { x:r.left + r.width/2 + (q.x - r.left - r.width/2) * 4, y:r.top + r.height/2 + (q.y - r.top - r.height/2) * 4 }, o) : q; };
  const p1 = a && c.anclaA ? enAncla(ra, c.anclaA, a) : recta && redonda(a) ? puntoBorde(ra, cb, a) : ladoPunto(ra, la);
  const p2 = b && c.anclaB ? enAncla(rb, c.anclaB, b) : recta && redonda(b) ? puntoBorde(rb, ca, b) : ladoPunto(rb, lb);
  const vA = la === 'arr' || la === 'aba', vB = lb === 'arr' || lb === 'aba';
  c.modo = vA !== vB ? (vA ? 'vh' : 'hv') : null;
  c.horiz = !vA;
  if (!c.fijo){ c.ladoA = la; c.ladoB = lb; }
  c.set({ x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y }); c.setCoords();
}
function actualizarConexiones(o){
  if (!o) return;
  const ids = new Set();
  (o.type === 'activeSelection' ? o.getObjects() : [o]).forEach(x => {
    if (x.id) ids.add(x.id);
    if (x.textoDe) ids.add(x.textoDe);
  });
  canvas.getObjects().forEach(c => { if (c.type === 'conector' && (ids.has(c.conA) || ids.has(c.conB))) actualizarConector(c); });
}
function actualizarTodasConexiones(){ canvas.getObjects().filter(o => o.type === 'conector').forEach(actualizarConector); }
const conectorDef = { estilo:'codo', inicio:'nada', fin:'flecha', patron:'solida', color:'#1f2330' };
function unir(a, b, o = {}){
  a.id = a.id || nuevoId(); b.id = b.id || nuevoId();
  const c = new fabric.Conector([0, 0, 1, 1], {
    stroke: o.color || conectorDef.color, strokeWidth: o.ancho || 5 * s(), strokeLineCap:'round',
    estilo: o.estilo || conectorDef.estilo, inicio: o.inicio || conectorDef.inicio,
    fin: o.fin || (o.flecha === false ? 'nada' : conectorDef.fin),
    patron: o.patron || (o.punteada ? 'guiones' : conectorDef.patron),
    etiqueta: o.etiqueta || '', orient: o.orient || null, dir: o.dir || null,
    ladoA: o.lados ? o.lados[0] : null, ladoB: o.lados ? o.lados[1] : null, fijo: !!o.lados,
    conA: a.id, conB: b.id, objectCaching:false, perPixelTargetFind:true,
    lockMovementX:true, lockMovementY:true, hasControls:false, id: nuevoId(), name:'Conector'
  });
  actualizarConector(c);
  canvas.add(c); canvas.sendToBack(c);
  canvas.getObjects().filter(x => x.esFondo).forEach(x => canvas.sendToBack(x));
  return c;
}
function heredarConector(c){
  if (!c) return {};
  return { estilo:c.estilo, inicio:c.inicio || 'nada', fin:c.fin || (c.flecha ? 'flecha' : 'nada'),
    patron:c.patron || (c.strokeDashArray ? 'guiones' : 'solida'), color:c.stroke, ancho:c.strokeWidth };
}
function conectar(){
  const sel = candidatosConexion();
  if (sel.length !== 2){ toast('Selecciona exactamente dos elementos (Shift + clic) para conectarlos'); return; }
  canvas.discardActiveObject();
  restaurando = true; const c = unir(sel[0], sel[1]); restaurando = false;
  canvas.setActiveObject(c); canvas.requestRenderAll(); renderCapas(); guardarEstado();
}
function conSel(){ const o = activo(); return o && o.type === 'conector' ? o : null; }
function cambiarConector(cambios){
  const o = conSel(); if (!o) return;
  o.set(cambios); o.dirty = true; actualizarConector(o);
  canvas.requestRenderAll(); actualizarPanel(); guardarEstado();
}
function togglePunteada(){ const o = conSel(); if (o) cambiarConector({ patron: o.patron === 'guiones' ? 'solida' : 'guiones', strokeDashArray:null }); }
document.querySelectorAll('#estilosCon .pb').forEach(b => b.onclick = () => cambiarConector({ estilo:b.dataset.e, orient:null, ladoA:null, ladoB:null, fijo:false }));
document.querySelectorAll('#patronesCon .pb').forEach(b => b.onclick = () => cambiarConector({ patron:b.dataset.p, strokeDashArray:null }));
const PUNTAS = [['nada','Sin punta'],['flecha','Flecha'],['abierta','Flecha abierta'],['circulo','Círculo'],['rombo','Rombo']];
['pInicio','pFin'].forEach(id => {
  PUNTAS.forEach(([v, n]) => { const op = document.createElement('option'); op.value = v; op.textContent = n; $(id).appendChild(op); });
  $(id).onchange = e => cambiarConector(id === 'pInicio' ? { inicio:e.target.value } : { fin:e.target.value, flecha: e.target.value !== 'nada' });
});
function invertirConector(){
  const o = conSel(); if (!o) return;
  cambiarConector({ conA:o.conB, conB:o.conA, ladoA:o.ladoB, ladoB:o.ladoA, anclaA:o.anclaB || null, anclaB:o.anclaA || null, libreA:o.libreB || null, libreB:o.libreA || null,
    inicio: o.fin || (o.flecha ? 'flecha' : 'nada'), fin: o.inicio || 'nada' });
}
function usarComoPredeterminado(){
  const o = conSel(); if (!o) return;
  Object.assign(conectorDef, heredarConector(o)); delete conectorDef.ancho;
  toast('Las líneas nuevas usarán este estilo');
}
$('pEtiqueta').addEventListener('input', e => { const o = conSel(); if (o){ o.set('etiqueta', e.target.value); canvas.requestRenderAll(); } });
$('pEtiqueta').addEventListener('change', guardarEstado);


// Punto del borde de una forma más cercano a donde soltaste (cerca de la mitad, se pega al centro)
function anclaEn(t, q){
  const r = cajaAbs(t), w = r.width || 1, h = r.height || 1;
  let u = Math.max(0, Math.min(1, (q.x - r.left) / w)), v = Math.max(0, Math.min(1, (q.y - r.top) / h));
  const d = { izq:u * w, der:(1 - u) * w, arr:v * h, aba:(1 - v) * h };
  const lado = Object.keys(d).reduce((m, k) => d[k] < d[m] ? k : m, 'izq');
  if (lado === 'izq') u = 0; else if (lado === 'der') u = 1; else if (lado === 'arr') v = 0; else v = 1;
  if ((lado === 'izq' || lado === 'der') && Math.abs(v - 0.5) < 0.06) v = 0.5;
  if ((lado === 'arr' || lado === 'aba') && Math.abs(u - 0.5) < 0.06) u = 0.5;
  return { u, v, lado, x:r.left + u * w, y:r.top + v * h };
}

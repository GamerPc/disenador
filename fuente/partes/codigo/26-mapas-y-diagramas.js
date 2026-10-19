/* =========================================================
   MAPAS Y DIAGRAMAS
   ========================================================= */
const nodoBase = o => (o && o.textoDe) ? porId(o.textoDe) : o;
function crearForma(tipo, o = {}){
  const w = o.w || 320 * s(), hh = o.h || 130 * s();
  const base = { originX:'center', originY:'center', left:0, top:0, fill: o.fill || $('colorForma').value,
    stroke: o.stroke || null, strokeWidth: o.stroke ? (o.grosor || 4 * s()) : 0, strokeUniform:true, forma: tipo };
  switch (tipo){
    case 'redondo':  return new fabric.Rect({ ...base, width:w, height:hh, rx:Math.min(w, hh) * 0.2, ry:Math.min(w, hh) * 0.2 });
    case 'pildora':  return new fabric.Rect({ ...base, width:w, height:hh, rx:hh/2, ry:hh/2 });
    case 'rombo':    return new fabric.Polygon([{x:w/2,y:0},{x:w,y:hh/2},{x:w/2,y:hh},{x:0,y:hh/2}], base);
    case 'paralelo': { const d = hh * 0.35; return new fabric.Polygon([{x:d,y:0},{x:w,y:0},{x:w-d,y:hh},{x:0,y:hh}], base); }
    case 'documento':return new fabric.Path(`M0 0 L${w} 0 L${w} ${hh*0.85} C${w*0.75} ${hh*0.68} ${w*0.5} ${hh*1.04} ${w*0.25} ${hh} C${w*0.12} ${hh*0.98} ${w*0.05} ${hh*0.9} 0 ${hh*0.85} Z`, base);
    case 'circulo':  return new fabric.Circle({ ...base, radius: w/2 });
    case 'elipse':   return new fabric.Ellipse({ ...base, rx: w/2, ry: hh/2 });
    case 'nota':     return new fabric.Rect({ ...base, width:w, height:hh, fill: o.fill || '#fde68a', shadow: new fabric.Shadow({ color:'rgba(0,0,0,.18)', blur:14*s(), offsetX:4*s(), offsetY:6*s() }) });
    case 'nube': case 'blob': {
      const pth = new fabric.Path(tipo === 'nube' ? PATH_NUBE : PATH_BLOB, base);
      pth.set({ scaleX: w / pth.width, scaleY: hh / pth.height }); return pth;
    }
    default:         return new fabric.Rect({ ...base, width:w, height:hh });
  }
}
// Crea un nodo (forma + texto) centrado en x, y
function nodo(tipo, texto, x, y, o = {}){
  const f = crearForma(tipo, o);
  f.id = nuevoId(); f.name = o.nombre || 'Nodo';
  if (o.anchoMax) f.anchoMax = o.anchoMax;
  f.setPositionByOrigin(new fabric.Point(x, y), 'center', 'center'); f.setCoords();
  canvas.add(f);
  if (texto != null){
    const t = crearTextoVinculado(f, texto, { fontSize:o.tam, fill:o.color, fontWeight:o.peso, fontFamily:o.fuente });
    canvas.add(t); ajustarFormaATexto(t);
  }
  return f;
}
const TIPOS_NODO = [
  ['pildora','Inicio / fin','<rect x="3" y="8" width="40" height="14" rx="7"/>'],
  ['proceso','Proceso','<rect x="5" y="5" width="36" height="20"/>'],
  ['rombo','Decisión','<polygon points="23,2 44,15 23,28 2,15"/>'],
  ['paralelo','Datos','<polygon points="11,5 43,5 35,25 3,25"/>'],
  ['documento','Documento','<path d="M5 4 H41 V22 C32 18 24 28 14 25 C10 24 7 23 5 22 Z"/>'],
  ['elipse','Idea','<ellipse cx="23" cy="15" rx="20" ry="11"/>'],
  ['redondo','Concepto','<rect x="5" y="5" width="36" height="20" rx="6"/>'],
  ['circulo','Círculo','<circle cx="23" cy="15" r="12"/>'],
  ['nube','Nube','<path transform="translate(1,-3) scale(.45)" d="M25 60 C10 60 5 45 18 38 C15 22 35 15 45 25 C52 10 78 12 80 30 C95 28 100 48 88 56 C90 66 75 70 68 63 C60 72 40 72 35 63 C30 66 25 64 25 60 Z"/>'],
  ['blob','Mancha','<path transform="translate(8,1) scale(.29)" d="M60 5 C85 5 100 25 95 50 C90 75 70 95 45 92 C20 89 2 70 5 45 C8 20 35 5 60 5 Z"/>'],
  ['nota','Nota','<rect x="8" y="3" width="30" height="24" fill="#fde68a"/>']
];
TIPOS_NODO.forEach(([tipo, nombre, svg]) => {
  const b = document.createElement('button'); b.className = 'nodoBtn'; b.title = nombre;
  b.innerHTML = `<svg viewBox="0 0 46 30" style="fill:#6d6f7b">${svg}</svg>${esc(nombre)}`;
  b.onclick = () => {
    const k = s(), dims = { circulo:[200,200], rombo:[320,200], nota:[280,240] }[tipo] || [320,130];
    restaurando = true;
    const f = nodo(tipo, nombre === 'Círculo' ? 'Texto' : nombre, W/2, H/2, { w:dims[0]*k, h:dims[1]*k, nombre });
    ordenarVinculos(); restaurando = false;
    const t = porId(f.formaTexto);
    canvas.setActiveObject(t); t.enterEditing(); t.selectAll();
    canvas.requestRenderAll(); renderCapas(); guardarEstado();
  };
  $('gridNodos').appendChild(b);
});

const nodoConectable = o => !!o && !esLinea(o) && !['activeSelection','group'].includes(o.type) && !o.esFondo && !o.textoDe && !o.esDeco && !o.tabla;
// Copia una forma (con su estilo) en x, y y le pone texto nuevo
function clonarNodo(p, x, y, cb){
  const tp = porId(p.formaTexto);
  p.clone(n => {
    n.set({ id: nuevoId(), formaTexto: null, textoDe: null, angle: 0, name: p.name || 'Nodo' });
    n.setPositionByOrigin(new fabric.Point(x, y), 'center', 'center'); n.setCoords();
    canvas.add(n);
    let t = null;
    if (puedeTenerTexto(n)){
      t = crearTextoVinculado(n, 'Nueva idea', tp ? { fontSize:tp.fontSize, fill:tp.fill, fontWeight:tp.fontWeight, fontFamily:tp.fontFamily, fontStyle:tp.fontStyle } : {});
      canvas.add(t); ajustarFormaATexto(t);
    }
    cb(n, t);
  }, EXTRA);
}
function crearNodoConectado(p, x, y, opc = {}){
  if (activo() && activo().isEditing) activo().exitEditing();
  canvas.discardActiveObject();
  p.id = p.id || nuevoId();
  const previo = canvas.getObjects().find(o => o.type === 'conector' && o.conB === p.id)
              || canvas.getObjects().find(o => o.type === 'conector' && o.conA === p.id);
  restaurando = true;
  clonarNodo(p, x, y, (n, t) => {
    unir(p, n, { ...heredarConector(previo), ...opc });
    ordenarVinculos();
    restaurando = false;
    if (t){ canvas.setActiveObject(t); t.enterEditing(); t.selectAll(); } else canvas.setActiveObject(n);
    canvas.requestRenderAll(); renderCapas(); guardarEstado(); revisarAuto();
  });
}
// Agrega una idea nueva conectada a la forma seleccionada, en la dirección indicada
function agregarHijo(dir, desde){
  const p = desde || nodoBase(activo());
  if (!nodoConectable(p)){ toast('Selecciona una forma para agregarle ideas conectadas'); return; }
  p.id = p.id || nuevoId();
  const n0 = canvas.getObjects().filter(c => c.type === 'conector' && c.conA === p.id && c.dir === dir).length;
  const pr = cajaAbs(p), c = p.getCenterPoint(), sep = 110 * s(), hueco = 40 * s();
  const k = n0 === 0 ? 0 : (n0 % 2 ? 1 : -1) * Math.ceil(n0 / 2);   // 0, +1, -1, +2, -2…
  let x = c.x, y = c.y;
  if (dir === 'der'){ x += pr.width + sep; y += k * (pr.height + hueco); }
  if (dir === 'izq'){ x -= pr.width + sep; y += k * (pr.height + hueco); }
  if (dir === 'aba'){ y += pr.height + sep; x += k * (pr.width + hueco); }
  if (dir === 'arr'){ y -= pr.height + sep; x += k * (pr.width + hueco); }
  crearNodoConectado(p, x, y, { dir });
}

/* ---------- Conexión arrastrando (círculos +, extremos de líneas y modo conector) ---------- */
const OPUESTO = { der:'izq', izq:'der', arr:'aba', aba:'arr' };
const puntosCon = [...document.querySelectorAll('.puntoCon')], puntosFin = [...document.querySelectorAll('.puntoFin')];
let transformando = false, arrastreCon = null, modoConector = false, trazo = null;
function ladoPunto(r, l){
  return { arr:{x:r.left+r.width/2, y:r.top}, aba:{x:r.left+r.width/2, y:r.top+r.height},
           izq:{x:r.left, y:r.top+r.height/2}, der:{x:r.left+r.width, y:r.top+r.height/2} }[l];
}
// lado de una forma que mira hacia un punto
function ladoHacia(r, q){
  const cx = r.left + r.width/2, cy = r.top + r.height/2, dx = (q.x - cx) / (r.width || 1), dy = (q.y - cy) / (r.height || 1);
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'der' : 'izq') : (dy > 0 ? 'aba' : 'arr');
}
function puntoLienzo(e){
  const r = canvas.upperCanvasEl.getBoundingClientRect();
  return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom };
}
function objetivoEn(q, excluir){
  return canvas.getObjects().slice().reverse().find(o => {
    if (!o.visible || !nodoConectable(o) || o === excluir) return false;
    const r = cajaAbs(o);
    return q.x >= r.left && q.x <= r.left + r.width && q.y >= r.top && q.y <= r.top + r.height;
  });
}
function extremosConector(c){
  const p = c.calcLinePoints(), m = c.calcTransformMatrix();
  return { a: fabric.util.transformPoint(new fabric.Point(p.x1, p.y1), m), b: fabric.util.transformPoint(new fabric.Point(p.x2, p.y2), m) };
}
function dibujarGuia(inicio, q, objetivo){
  const ctx = canvas.contextTop; canvas.clearContext(ctx);
  ctx.save();
  if (objetivo){
    const r = cajaAbs(objetivo);
    ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 3; ctx.setLineDash([]);
    ctx.strokeRect(r.left*zoom - 4, r.top*zoom - 4, r.width*zoom + 8, r.height*zoom + 8);
  }
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]);
  ctx.beginPath(); ctx.moveTo(inicio.x*zoom, inicio.y*zoom); ctx.lineTo(q.x*zoom, q.y*zoom); ctx.stroke();
  ctx.setLineDash([]); ctx.fillStyle = '#7c3aed';
  ctx.beginPath(); ctx.arc(q.x*zoom, q.y*zoom, 6, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
function limpiarGuia(){ canvas.clearContext(canvas.contextTop); canvas.requestRenderAll(); }
// Termina una conexión: sobre otra forma las une; en el vacío crea una idea nueva conectada
function terminarConexion(origen, lado, q){
  const t = objetivoEn(q, origen);
  const ro = cajaAbs(origen);
  const ladoA = lado || ladoHacia(ro, q);
  if (t){
    const ladoB = ladoHacia(cajaAbs(t), ladoPunto(ro, ladoA));
    restaurando = true; const c = unir(origen, t); restaurando = false;
    canvas.setActiveObject(c); canvas.requestRenderAll(); renderCapas(); guardarEstado();
    return 'unido';
  }
  crearNodoConectado(origen, q.x, q.y, {});
  return 'nuevo';
}
function actualizarPuntos(){
  const o = activo(), n = nodoBase(o);
  const verNodo = !transformando && !arrastreCon && !modoConector && o && !o.isEditing && o.type !== 'activeSelection' && nodoConectable(n) && !n.bloqueado;
  const r = verNodo ? cajaAbs(n) : null, sep = 30 / zoom;
  puntosCon.forEach(el => {
    if (!verNodo){ el.style.display = 'none'; return; }
    const l = el.dataset.l, q = ladoPunto(r, l);
    const dx = l === 'der' ? sep : l === 'izq' ? -sep : 0, dy = l === 'aba' ? sep : l === 'arr' ? -sep : 0;
    el.style.left = (q.x + dx) * zoom + 'px'; el.style.top = (q.y + dy) * zoom + 'px'; el.style.display = 'block';
  });
  const verFin = !transformando && !arrastreCon && o && o.type === 'conector';
  const ex = verFin ? extremosConector(o) : null;
  puntosFin.forEach(el => {
    if (!verFin){ el.style.display = 'none'; return; }
    const q = ex[el.dataset.e];
    el.style.left = q.x * zoom + 'px'; el.style.top = q.y * zoom + 'px'; el.style.display = 'block';
  });
}
canvas.on('after:render', actualizarPuntos);
['object:moving','object:scaling','object:rotating'].forEach(ev => canvas.on(ev, () => { transformando = true; }));
canvas.on('mouse:up', () => { if (transformando){ transformando = false; actualizarPuntos(); } });
// El control de giro va en la esquina para no estorbar a los círculos "+"
Object.assign(fabric.Object.prototype.controls.mtr, { x:0.5, y:-0.5, offsetX:18, offsetY:-18, withConnection:false });

puntosCon.forEach(el => {
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    const n = nodoBase(activo()); if (!n) return;
    if (activo().isEditing) activo().exitEditing();
    el.setPointerCapture(e.pointerId);
    arrastreCon = { origen:n, lado:el.dataset.l, x0:e.clientX, y0:e.clientY, movio:false };
  });
  el.addEventListener('pointermove', e => {
    const a = arrastreCon; if (!a) return;
    if (!a.movio && Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > 6){ a.movio = true; actualizarPuntos(); }
    if (a.movio){ const q = puntoLienzo(e); dibujarGuia(ladoPunto(cajaAbs(a.origen), a.lado), q, objetivoEn(q, a.origen)); }
  });
  const soltar = e => {
    const a = arrastreCon; if (!a) return; arrastreCon = null; limpiarGuia();
    if (!a.movio) agregarHijo(a.lado, a.origen);
    else terminarConexion(a.origen, a.lado, puntoLienzo(e));
  };
  el.addEventListener('pointerup', soltar);
  el.addEventListener('pointercancel', () => { arrastreCon = null; limpiarGuia(); });
});
// Arrastrar el extremo de una línea para conectarla a otra forma
puntosFin.forEach(el => {
  let arr = null;
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); el.setPointerCapture(e.pointerId);
    const c = conSel(); if (!c) return;
    arr = { c, extremo: el.dataset.e }; arrastreCon = arr; actualizarPuntos();
  });
  el.addEventListener('pointermove', e => {
    if (!arr) return;
    const q = puntoLienzo(e), ex = extremosConector(arr.c), fijo = arr.extremo === 'a' ? ex.b : ex.a;
    const otro = porId(arr.extremo === 'a' ? arr.c.conB : arr.c.conA);
    dibujarGuia(fijo, q, objetivoEn(q, otro));
  });
  el.addEventListener('pointerup', e => {
    if (!arr) return;
    const { c, extremo } = arr; arr = null; arrastreCon = null; limpiarGuia();
    const otro = porId(extremo === 'a' ? c.conB : c.conA), t = objetivoEn(puntoLienzo(e), otro);
    if (!t){ toast('Suelta el extremo sobre una forma para conectarlo'); actualizarPuntos(); return; }
    t.id = t.id || nuevoId();
    c.set(extremo === 'a' ? { conA:t.id } : { conB:t.id }); c.set({ ladoA:null, ladoB:null, orient:null, fijo:false });
    actualizarConector(c); canvas.setActiveObject(c); canvas.requestRenderAll(); guardarEstado();
  });
});

// Modo conector: arrastrar de forma a forma directamente en el lienzo
function activarModoConector(v){
  modoConector = v; trazo = null;
  canvas.skipTargetFind = v; canvas.selection = !v;
  $('area').classList.toggle('modoCon', v);
  $('modoAviso').style.display = v ? 'block' : 'none';
  if (!v) document.querySelectorAll('.conBtn').forEach(b => b.classList.remove('on'));
  if (v){ if (activo() && activo().isEditing) activo().exitEditing(); canvas.discardActiveObject(); }
  canvas.requestRenderAll(); actualizarPuntos();
}
canvas.on('mouse:down', e => {
  if (!modoConector) return;
  const q = canvas.getPointer(e.e), o = objetivoEn(q, null);
  trazo = o ? { origen:o } : null;
});
canvas.on('mouse:move', e => {
  if (!modoConector || !trazo) return;
  const q = canvas.getPointer(e.e), r = cajaAbs(trazo.origen);
  dibujarGuia(ladoPunto(r, ladoHacia(r, q)), q, objetivoEn(q, trazo.origen));
});
canvas.on('mouse:up', e => {
  if (!modoConector || !trazo) return;
  const a = trazo; trazo = null; limpiarGuia();
  const q = canvas.getPointer(e.e);
  const r = cajaAbs(a.origen);
  if (q.x >= r.left && q.x <= r.left + r.width && q.y >= r.top && q.y <= r.top + r.height) return;   // fue solo un clic
  if (terminarConexion(a.origen, null, q) === 'nuevo') activarModoConector(false);
});
const PRESETS_CON = [
  { n:'Recta',        c:{ estilo:'recta', inicio:'nada',   fin:'flecha', patron:'solida'  }, svg:'<path d="M5 25 L46 7"/><path d="M38 6 L47 6.5 L42 14" fill="#4b5563"/>' },
  { n:'Curva',        c:{ estilo:'curva', inicio:'nada',   fin:'flecha', patron:'solida'  }, svg:'<path d="M4 25 C26 25 26 7 46 7"/><path d="M40 3 L48 7 L40 11" fill="#4b5563"/>' },
  { n:'Codo',         c:{ estilo:'codo',  inicio:'nada',   fin:'flecha', patron:'solida'  }, svg:'<path d="M4 25 H25 V7 H46"/><path d="M40 3 L48 7 L40 11" fill="#4b5563"/>' },
  { n:'Doble flecha', c:{ estilo:'recta', inicio:'flecha', fin:'flecha', patron:'solida'  }, svg:'<path d="M8 15 H44"/><path d="M12 10 L4 15 L12 20" fill="#4b5563"/><path d="M40 10 L48 15 L40 20" fill="#4b5563"/>' },
  { n:'Sin flecha',   c:{ estilo:'curva', inicio:'nada',   fin:'nada',   patron:'solida'  }, svg:'<path d="M4 25 C26 25 26 5 48 5"/>' },
  { n:'Punteada',     c:{ estilo:'recta', inicio:'nada',   fin:'flecha', patron:'guiones' }, svg:'<path d="M5 15 H42" stroke-dasharray="5 4"/><path d="M40 10 L48 15 L40 20" fill="#4b5563"/>' },
  { n:'Relación',     c:{ estilo:'codo',  inicio:'rombo',  fin:'abierta',patron:'solida'  }, svg:'<path d="M12 23 H26 V7 H46"/><path d="M4 23 L8 20 L12 23 L8 26 Z" fill="#4b5563"/><path d="M41 3 L47 7 L41 11"/>' },
  { n:'Punto a punto',c:{ estilo:'recta', inicio:'circulo',fin:'circulo',patron:'solida'  }, svg:'<path d="M8 15 H44"/><circle cx="7" cy="15" r="3.5" fill="#4b5563"/><circle cx="45" cy="15" r="3.5" fill="#4b5563"/>' },
  { n:'Puntos',       c:{ estilo:'curva', inicio:'nada',   fin:'flecha', patron:'puntos'  }, svg:'<path d="M4 25 C26 25 26 7 44 7" stroke-dasharray="0.5 5"/><path d="M40 3 L48 7 L40 11" fill="#4b5563"/>' }
];
PRESETS_CON.forEach(pr => {
  const b = document.createElement('button'); b.className = 'conBtn'; b.title = pr.n;
  b.innerHTML = `<svg viewBox="0 0 52 30">${pr.svg}</svg>${esc(pr.n)}`;
  b.onclick = () => {
    Object.assign(conectorDef, pr.c);
    if (candidatosConexion().length === 2){ conectar(); return; }
    const c = conSel();
    if (c){ cambiarConector({ ...pr.c, strokeDashArray:null, orient:null, ladoA:null, ladoB:null, fijo:false }); return; }
    activarModoConector(true);
    document.querySelectorAll('.conBtn').forEach(x => x.classList.toggle('on', x === b));
  };
  $('gridConectores').appendChild(b);
});

/* ---------- Cambiar el tipo de forma sin perder texto ni conexiones ---------- */
(function(){
  const sel = $('pTipoForma');
  sel.innerHTML = '<option value="">—</option>' + TIPOS_NODO.map(([t, n]) => `<option value="${t}">${esc(n)}</option>`).join('');
  sel.onchange = e => { if (e.target.value) cambiarTipoForma(e.target.value); };
})();
function cambiarTipoForma(tipo){
  const f = nodoBase(activo()); if (!puedeTenerTexto(f)) return;
  const w = f.getScaledWidth(), hh = f.getScaledHeight(), lado = Math.max(w, hh);
  const n = crearForma(tipo, { w: tipo === 'circulo' ? lado : w, h: tipo === 'circulo' ? lado : hh,
    fill: f.fill, stroke: f.stroke, grosor: f.strokeWidth });
  n.set({ id:f.id, formaTexto:f.formaTexto, name:f.name, opacity:f.opacity, shadow:f.shadow, angle:f.angle,
    anchoBase: tipo === 'circulo' ? lado : f.anchoBase, altoBase: tipo === 'circulo' ? lado : f.altoBase, anchoMax: null, bloqueado: f.bloqueado });
  n.setPositionByOrigin(f.getCenterPoint(), 'center', 'center'); n.setCoords();
  const idx = canvas.getObjects().indexOf(f);
  restaurando = true; canvas.remove(f); canvas.insertAt(n, idx); restaurando = false;
  const t = porId(n.formaTexto); if (t){ t.set('width', anchoTexto(n)); ajustarFormaATexto(t); }
  actualizarConexiones(n);
  canvas.setActiveObject(n); canvas.requestRenderAll(); renderCapas(); guardarEstado();
}

/* ---------- Organizar automáticamente (árbol horizontal, vertical o mapa mental) ---------- */
// Centra el contenido en el lienzo; si no cabe, agranda el lienzo
function encuadrarContenido(){
  const b = limitesContenido(); if (!b) return;
  const m = 60 * s(), bw = b.x2 - b.x1, bh = b.y2 - b.y1;
  const nw = Math.min(8000, Math.max(W, Math.ceil(bw + 2*m))), nh = Math.min(8000, Math.max(H, Math.ceil(bh + 2*m)));
  if (nw !== W || nh !== H) cambiarTamano(nw, nh);
  moverTodo(W/2 - (b.x1 + bw/2), H/2 - (b.y1 + bh/2));
}
function grafoConexiones(){
  const hijos = {}, padres = {};
  canvas.getObjects().forEach(c => {
    if (c.type !== 'conector' || !porId(c.conA) || !porId(c.conB)) return;
    (hijos[c.conA] = hijos[c.conA] || []).push(c.conB);
    (padres[c.conB] = padres[c.conB] || []).push(c.conA);
  });
  return { hijos, padres };
}
function moverNodoA(n, x, y){
  n.setPositionByOrigin(new fabric.Point(x, y), 'center', 'center'); n.setCoords();
  const t = porId(n.formaTexto); if (t) centrarTexto(t, n);
}
function organizar(modo){
  if (activo() && activo().isEditing) activo().exitEditing();
  const { hijos, padres } = grafoConexiones();
  const nodos = canvas.getObjects().filter(o => nodoConectable(o) && o.visible && (hijos[o.id] || padres[o.id]));
  if (nodos.length < 2){ toast('Conecta algunas formas primero'); return; }
  const elegido = nodoBase(activo());
  canvas.discardActiveObject();
  let raices = elegido && nodos.includes(elegido) ? [elegido] : nodos.filter(n => !padres[n.id]);
  if (!raices.length) raices = [nodos[0]];
  if (modo === 'mental') raices = [raices[0]];
  const visto = new Set();
  const construir = n => {
    visto.add(n.id);
    const t = { n, hijos: [] };
    (hijos[n.id] || []).forEach(id => { const x = porId(id); if (x && nodos.includes(x) && !visto.has(id)){ visto.add(id); t.hijos.push(id); } });
    t.hijos = t.hijos.map(id => construir(porId(id)));
    return t;
  };
  const eje = modo === 'v' ? 'v' : 'h';
  const sepPrin = 130 * s(), sepSec = 40 * s();
  const medir = t => {
    const r = cajaAbs(t.n);
    t.prin = eje === 'h' ? r.width : r.height; t.sec = eje === 'h' ? r.height : r.width;
    t.hijos.forEach(medir);
    const suma = t.hijos.reduce((a, x) => a + x.ext, 0) + Math.max(0, t.hijos.length - 1) * sepSec;
    t.ext = Math.max(t.sec, suma);
  };
  // coloca un bosque de árboles; prof 0 empieza a "inicio" (distancia desde el origen) con signo +/-
  const colocarBosque = (lista, inicio, signo, centroSec) => {
    const anchos = [];
    const niveles = (t, d) => { anchos[d] = Math.max(anchos[d] || 0, t.prin); t.hijos.forEach(x => niveles(x, d + 1)); };
    lista.forEach(t => niveles(t, 0));
    const dist = []; let acc = inicio;
    anchos.forEach((a, d) => { dist[d] = acc + a/2; acc += a + sepPrin; });
    const total = lista.reduce((a, t) => a + t.ext, 0) + Math.max(0, lista.length - 1) * sepSec;
    const poner = (t, d, desde) => {
      const prin = signo * dist[d], sec = desde + t.ext/2;
      eje === 'h' ? moverNodoA(t.n, prin, sec) : moverNodoA(t.n, sec, prin);
      const sumaH = t.hijos.reduce((a, x) => a + x.ext, 0) + Math.max(0, t.hijos.length - 1) * sepSec;
      let cur = desde + (t.ext - sumaH) / 2;
      t.hijos.forEach(x => { poner(x, d + 1, cur); cur += x.ext + sepSec; });
    };
    let cur = centroSec - total/2;
    lista.forEach(t => { poner(t, 0, cur); cur += t.ext + sepSec; });
  };
  const arboles = raices.filter(r => !visto.has(r.id)).map(construir);
  arboles.forEach(medir);
  if (modo === 'mental'){
    const raiz = arboles[0];
    moverNodoA(raiz.n, 0, 0);
    const der = raiz.hijos.filter((_, i) => i % 2 === 0), izq = raiz.hijos.filter((_, i) => i % 2 === 1);
    colocarBosque(der, raiz.prin/2 + sepPrin, 1, 0);
    colocarBosque(izq, raiz.prin/2 + sepPrin, -1, 0);
  } else colocarBosque(arboles, 0, 1, 0);
  actualizarTodasConexiones();
  encuadrarContenido();
  canvas.requestRenderAll(); guardarEstado();
  toast('Diagrama organizado');
}

/* ---------- Paletas de color para todo el diagrama ---------- */
const PALETAS = [
  ['Vibrante',  ['#7c3aed','#f97316','#06b6d4','#10b981','#ec4899','#eab308'], '#334155'],
  ['Escolar',   ['#1e3a8a','#2563eb','#0891b2','#0d9488','#4f46e5','#0284c7'], '#1e293b'],
  ['Pastel',    ['#c4b5fd','#fdba74','#a5f3fc','#a7f3d0','#fbcfe8','#fde68a'], '#64748b'],
  ['Elegante',  ['#0f172a','#7f1d1d','#334155','#78350f','#1e3a8a','#365314'], '#0f172a'],
  ['Natural',   ['#166534','#65a30d','#ca8a04','#9a3412','#0f766e','#4d7c0f'], '#3f3f46']
];
PALETAS.forEach(([nombre, cols, linea]) => {
  const b = document.createElement('button'); b.className = 'bigbtn'; b.style.cssText = 'display:flex;align-items:center;gap:8px;margin:0;padding:7px 10px';
  b.innerHTML = cols.map(c => `<span style="width:16px;height:16px;border-radius:4px;background:${c}"></span>`).join('') + `<span style="margin-left:4px">${esc(nombre)}</span>`;
  b.onclick = () => aplicarPaleta(cols, linea);
  $('paletasDiagrama').appendChild(b);
});
// Colorea por ramas: la idea principal con el primer color y cada rama con su propio color
function aplicarPaleta(cols, linea){
  const { hijos, padres } = grafoConexiones();
  const nodos = canvas.getObjects().filter(o => nodoConectable(o) && (hijos[o.id] || padres[o.id]));
  if (!nodos.length){ toast('Conecta algunas formas primero'); return; }
  const colorDe = {}, raices = nodos.filter(n => !padres[n.id]);
  (raices.length ? raices : [nodos[0]]).forEach(r => {
    colorDe[r.id] = cols[0];
    (hijos[r.id] || []).forEach((id, i) => {
      const c = cols[1 + (i % (cols.length - 1))];
      const pila = [id];
      while (pila.length){ const x = pila.pop(); if (colorDe[x]) continue; colorDe[x] = c; (hijos[x] || []).forEach(y => pila.push(y)); }
    });
  });
  nodos.forEach(n => {
    const c = colorDe[n.id] || cols[0];
    n.set('fill', c); if (n.stroke) n.set('stroke', c);
    const t = porId(n.formaTexto); if (t) t.set('fill', esOscuro(c) ? '#ffffff' : '#1f2330');
  });
  canvas.getObjects().filter(o => o.type === 'conector').forEach(c => {
    const destino = colorDe[c.conB];
    c.set('stroke', destino && (c.fin || (c.flecha ? 'flecha' : 'nada')) === 'nada' ? destino : linea);
  });
  canvas.requestRenderAll(); guardarEstado();
}
// Zoom con Ctrl + rueda del mouse (o pellizco en el touchpad)
$('area').addEventListener('wheel', e => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  establecerZoom(zoom * (e.deltaY < 0 ? 1.1 : 1/1.1));
}, { passive:false });


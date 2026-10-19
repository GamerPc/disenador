/* =========================================================
   ORGANIZAR
   ========================================================= */
function orden(acc){
  const o = activo(); if (!o) return;
  const f = { frente:'bringToFront', adelante:'bringForward', atras:'sendBackwards', fondo:'sendToBack' }[acc];
  canvas[f](o);
  // El fondo siempre debe quedar hasta atrás
  canvas.getObjects().filter(x => x.esFondo).forEach(x => canvas.sendToBack(x));
  ordenarVinculos();
  canvas.requestRenderAll(); renderCapas(); guardarEstado();
}
// Ejecuta cambios sobre los elementos sueltos de una selección múltiple y la vuelve a armar
function enSeleccion(fn){
  const a = activo(); if (!a || a.type !== 'activeSelection') return false;
  const objs = a.getObjects().filter(x => !x.textoDe && x.type !== 'conector');
  canvas.discardActiveObject();
  fn(objs);
  objs.forEach(o => { o.setCoords(); seguirVinculos(o); });
  actualizarTodasConexiones();
  canvas.setActiveObject(new fabric.ActiveSelection(objs.slice(), { canvas })); incluirVinculados();
  canvas.requestRenderAll(); guardarEstado();
  return true;
}
const mover = (o, dx, dy) => o.set({ left: o.left + dx, top: o.top + dy });
function alinear(d){
  const o = activo(); if (!o) return;
  if (o.type === 'activeSelection' && o.getObjects().filter(x => !x.textoDe && x.type !== 'conector').length > 1){
    enSeleccion(objs => {
      const rs = objs.map(x => cajaAbs(x));
      const L = Math.min(...rs.map(r => r.left)), R = Math.max(...rs.map(r => r.left + r.width));
      const T = Math.min(...rs.map(r => r.top)), B = Math.max(...rs.map(r => r.top + r.height));
      objs.forEach((x, i) => {
        const r = rs[i];
        if (d === 'izq') mover(x, L - r.left, 0);
        if (d === 'der') mover(x, R - (r.left + r.width), 0);
        if (d === 'centroH') mover(x, (L + R)/2 - (r.left + r.width/2), 0);
        if (d === 'arriba') mover(x, 0, T - r.top);
        if (d === 'abajo') mover(x, 0, B - (r.top + r.height));
        if (d === 'centroV') mover(x, 0, (T + B)/2 - (r.top + r.height/2));
      });
    });
    return;
  }
  const r = cajaAbs(o);
  let dx = 0, dy = 0;
  if (d === 'izq') dx = -r.left;
  if (d === 'der') dx = W - (r.left + r.width);
  if (d === 'centroH') dx = W/2 - (r.left + r.width/2);
  if (d === 'arriba') dy = -r.top;
  if (d === 'abajo') dy = H - (r.top + r.height);
  if (d === 'centroV') dy = H/2 - (r.top + r.height/2);
  o.set({ left: o.left + dx, top: o.top + dy }); o.setCoords();
  seguirVinculos(o);
  canvas.requestRenderAll(); guardarEstado();
}
function distribuir(eje){
  enSeleccion(objs => {
    if (objs.length < 3){ toast('Selecciona 3 o más elementos para distribuirlos'); return; }
    const info = objs.map(x => ({ x, r: cajaAbs(x) }));
    const k = eje === 'h' ? 'left' : 'top', tam = eje === 'h' ? 'width' : 'height';
    info.sort((a, b) => (a.r[k] + a.r[tam]/2) - (b.r[k] + b.r[tam]/2));
    const ini = info[0].r[k], fin = info[info.length-1].r[k] + info[info.length-1].r[tam];
    const hueco = (fin - ini - info.reduce((s, i) => s + i.r[tam], 0)) / (info.length - 1);
    let pos = ini;
    info.forEach(i => { const d = pos - i.r[k]; eje === 'h' ? mover(i.x, d, 0) : mover(i.x, 0, d); pos += i.r[tam] + hueco; });
  });
}
function igualarTamano(){
  enSeleccion(objs => {
    const w = Math.max(...objs.map(x => x.getScaledWidth())), hh = Math.max(...objs.map(x => x.getScaledHeight()));
    objs.forEach(x => {
      const c = x.getCenterPoint();
      if (puedeTenerTexto(x)) fijarTamanoForma(x, w, hh); else x.set({ scaleX: w / x.width, scaleY: hh / x.height });
      x.setPositionByOrigin(c, 'center', 'center');
      x.anchoBase = w; x.altoBase = hh; x.anchoMax = null;
      const t = porId(x.formaTexto); if (t){ t.set('width', anchoTexto(x)); ajustarFormaATexto(t); }
    });
  });
}

/* ---------- Copiar y pegar estilo ---------- */
let estiloCopiado = null;
function copiarEstilo(){
  const o = activo(); if (!o) return;
  if (o.type === 'conector'){ estiloCopiado = { conector: heredarConector(o) }; }
  else {
    const f = nodoBase(o.type === 'activeSelection' ? o.getObjects()[0] : o);
    const t = esTexto(f) ? f : porId(f.formaTexto);
    estiloCopiado = {
      forma: esTexto(f) ? null : { fill:f.fill, stroke:f.stroke, strokeWidth:f.strokeWidth, opacity:f.opacity, shadow:f.shadow ? f.shadow.toObject() : null },
      texto: t ? { fontFamily:t.fontFamily, fontSize:t.fontSize, fontWeight:t.fontWeight, fontStyle:t.fontStyle, fill:t.fill, underline:t.underline, textAlign:t.textAlign } : null
    };
  }
  $('bPegarEstilo').classList.add('on');
  toast('Estilo copiado. Selecciona otro elemento y pulsa “Pegar estilo”');
}
function pegarEstilo(){
  if (!estiloCopiado){ toast('Primero copia un estilo'); return; }
  const lista = canvas.getActiveObjects(); if (!lista.length) return;
  lista.forEach(o => {
    if (o.type === 'conector'){ if (estiloCopiado.conector){ const c = estiloCopiado.conector; o.set({ estilo:c.estilo, inicio:c.inicio, fin:c.fin, patron:c.patron, stroke:c.color, strokeWidth:c.ancho, fijo:false }); actualizarConector(o); } return; }
    const f = nodoBase(o);
    if (estiloCopiado.forma && !esTexto(f) && f.type !== 'image'){
      const e = estiloCopiado.forma;
      f.set({ fill:e.fill, stroke:e.stroke, strokeWidth:e.strokeWidth, opacity:e.opacity, shadow: e.shadow ? new fabric.Shadow(e.shadow) : null });
    }
    const t = esTexto(f) ? f : porId(f.formaTexto);
    if (t && estiloCopiado.texto){ t.set(estiloCopiado.texto); t.initDimensions(); if (t.textoDe) ajustarFormaATexto(t); }
  });
  canvas.requestRenderAll(); actualizarPanel(); guardarEstado();
}

function voltear(p){ const o = activo(); if (!o) return; o.set(p, !o[p]); canvas.requestRenderAll(); guardarEstado(); }
function agruparToggle(){
  const o = activo(); if (!o) return;
  if (o.type === 'activeSelection'){ const g = o.toGroup(); g.name = 'Grupo'; }
  else if (o.type === 'group'){ o.toActiveSelection(); }
  canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado();
}
function bloquear(o, v){
  o.set({ bloqueado:v, lockMovementX:v, lockMovementY:v, lockScalingX:v, lockScalingY:v, lockRotation:v, hasControls:!v, editable:!v });
}
function bloquearSel(){
  const o = activo(); if (!o) return;
  const v = !o.bloqueado;
  if (o.type === 'activeSelection') o.getObjects().forEach(x => bloquear(x, v));
  bloquear(o, v);
  canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado();
}
function eliminar(){
  let objs = canvas.getActiveObjects().filter(o => !o.bloqueado);
  if (!objs.length) return;
  canvas.discardActiveObject();
  // Al borrar una forma se borra su texto; al borrar un extremo se borra su conector
  objs.forEach(o => { const t = porId(o.formaTexto); if (t && !objs.includes(t)) objs.push(t); });
  objs.forEach(o => { if (o.textoDe){ const f = porId(o.textoDe); if (f && !objs.includes(f)) f.formaTexto = null; } });
  const ids = new Set(objs.map(o => o.id).filter(Boolean));
  canvas.getObjects().forEach(c => { if (c.type === 'conector' && !objs.includes(c) && (ids.has(c.conA) || ids.has(c.conB))) objs.push(c); });
  restaurando = true; objs.forEach(o => canvas.remove(o)); restaurando = false;
  canvas.requestRenderAll(); renderCapas(); guardarEstado();
}
function clonar(o, cb){ o.clone(cb, EXTRA); }
function pegarClon(c){
  limpiarVinculosClon(c);
  c.set({ left: c.left + 30*s(), top: c.top + 30*s(), evented:true });
  if (c.type === 'activeSelection'){
    c.canvas = canvas;
    restaurando = true; c.forEachObject(x => canvas.add(x)); restaurando = false;
    c.setCoords();
  } else { restaurando = true; canvas.add(c); restaurando = false; }
  canvas.setActiveObject(c); canvas.requestRenderAll(); renderCapas(); guardarEstado();
}
function duplicar(){ const o = activo(); if (o) clonar(o, pegarClon); }


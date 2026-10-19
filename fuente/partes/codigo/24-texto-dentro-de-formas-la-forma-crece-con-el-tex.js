/* =========================================================
   TEXTO DENTRO DE FORMAS (la forma crece con el texto)
   ========================================================= */
const PAD = () => 24 * Math.min(W, H) / 1080;   // margen interior proporcional al lado corto del lienzo
const PATH_NUBE = 'M25 60 C10 60 5 45 18 38 C15 22 35 15 45 25 C52 10 78 12 80 30 C95 28 100 48 88 56 C90 66 75 70 68 63 C60 72 40 72 35 63 C30 66 25 64 25 60 Z';
const PATH_BLOB = 'M60 5 C85 5 100 25 95 50 C90 75 70 95 45 92 C20 89 2 70 5 45 C8 20 35 5 60 5 Z';
function puedeTenerTexto(o){
  return !!o && !esTexto(o) && !esLinea(o) && !['image','group','activeSelection'].includes(o.type) && !o.esFondo && !o.esDeco;
}
function anchoUtil(f){
  const porForma = { rombo:0.5, paralelo:0.72, documento:0.92, elipse:0.72, nube:0.6, blob:0.66 }[f.forma];
  if (porForma) return porForma;
  return f.type === 'rect' ? 1 : (f.type === 'circle' || f.type === 'ellipse') ? 0.72 : f.type === 'triangle' ? 0.55 : 0.68;
}
function esOscuro(c){
  if (typeof c !== 'string') return false;
  try { const [r, g, b] = new fabric.Color(c).getSource(); return (0.299*r + 0.587*g + 0.114*b) < 150; } catch(e){ return false; }
}
function anchoTexto(f){ return Math.max(60, f.getScaledWidth() * anchoUtil(f) - 2 * PAD()); }
function centrarTexto(t, f){
  const c = f.getCenterPoint();
  t.set({ originX:'center', originY:'center', left:c.x, top:c.y, angle:f.angle }); t.setCoords();
}
// Crea el texto vinculado a una forma (no lo agrega al lienzo)
function crearTextoVinculado(f, texto, est = {}){
  f.id = f.id || nuevoId();
  if (!f.anchoBase) f.anchoBase = f.getScaledWidth();
  if (!f.altoBase) f.altoBase = f.getScaledHeight();
  const t = new fabric.Textbox(texto, {
    width: anchoTexto(f), fontFamily: est.fontFamily || 'Poppins', fontSize: est.fontSize || 40 * s(),
    fontWeight: est.fontWeight || '400', fontStyle: est.fontStyle || 'normal', textAlign: 'center', lineHeight: 1.15,
    fill: est.fill || (esOscuro(f.fill) ? '#ffffff' : '#1f2330'), textoDe: f.id, id: nuevoId(), name: 'Texto de forma'
  });
  prepararTextoVinculado(t);
  f.formaTexto = t.id;
  centrarTexto(t, f);
  return t;
}
// El texto de una forma no tiene asas propias: se redimensiona la forma
function prepararTextoVinculado(t){
  t.set({ hasControls:false, lockScalingX:true, lockScalingY:true, lockRotation:true });
}
function normalizarVinculos(){
  canvas.getObjects().forEach(o => { if (o.textoDe && porId(o.textoDe)) prepararTextoVinculado(o); });
}
function textoEnForma(f){
  if (!puedeTenerTexto(f)) return;
  const ya = porId(f.formaTexto);
  if (ya){ canvas.setActiveObject(ya); ya.enterEditing(); ya.selectAll(); canvas.requestRenderAll(); return; }
  const t = crearTextoVinculado(f, 'Escribe aquí');
  canvas.add(t); ajustarFormaATexto(t); ordenarVinculos();
  canvas.setActiveObject(t); t.enterEditing(); t.selectAll(); canvas.requestRenderAll();
}
function agregarCuadroTexto(){
  const k = s();
  const r = new fabric.Rect({ left:W/2, top:H/2, originX:'center', originY:'center', width:520*k, height:160*k,
    rx:24*k, ry:24*k, fill:$('colorForma').value, strokeWidth:0 });
  agregar(r, 'Cuadro de texto');
  textoEnForma(r);
}
// Ancho que ocuparía el texto en una sola línea por renglón (sin cortes automáticos)
function anchoNatural(t){
  const m = new fabric.Text(t.text || ' ', { fontSize:t.fontSize, fontFamily:t.fontFamily, fontWeight:t.fontWeight,
    fontStyle:t.fontStyle, charSpacing:t.charSpacing, lineHeight:t.lineHeight });
  return m.width + 4;
}
// Cambia el tamaño visible de una forma según su tipo
function fijarTamanoForma(f, w, hgt){
  if (f.type === 'rect'){
    f.set({ width: w / f.scaleX, height: hgt / f.scaleY });
    if (f.forma === 'pildora'){ const r = Math.min(w, hgt) / 2; f.set({ rx: r / f.scaleX, ry: r / f.scaleY }); }
  } else if (f.type === 'circle'){
    f.set('radius', Math.max(w, hgt) / 2 / f.scaleX);
  } else if (f.type === 'ellipse'){
    f.set({ rx: w / 2 / f.scaleX, ry: hgt / 2 / f.scaleY });
  } else {
    f.set({ scaleX: w / f.width, scaleY: hgt / f.height });
  }
}
// La forma se adapta al texto: primero se ensancha (hasta un límite) y luego crece hacia abajo.
// Nunca queda más chica que el tamaño que tú le diste.
function ajustarFormaATexto(t){
  const f = porId(t.textoDe); if (!f || f.group || t.group) return;
  if (f.tabla){ reorganizarTabla(f.tabla); return; }
  const pad = PAD(), fac = anchoUtil(f), facAlto = f.type === 'rect' ? 1 : fac;
  const base = f.anchoBase || f.getScaledWidth(), baseAlto = f.altoBase || f.getScaledHeight();
  const minTexto = Math.max(40, base * fac - 2 * pad);
  const limite = f.forma === 'rombo' ? minTexto * 1.5 : Math.min(720 * s(), W * 0.85);
  const maxTexto = Math.max(minTexto, f.anchoMax || limite);
  const tw = Math.min(maxTexto, Math.max(minTexto, anchoNatural(t)));
  if (Math.abs(t.width - tw) > 0.5){ t.set('width', tw); }
  t.initDimensions();
  let ancho = Math.max(base, (tw + 2 * pad) / fac);
  let alto = Math.max(baseAlto, (t.height * t.scaleY + 2 * pad) / facAlto);
  if (f.type === 'circle'){ ancho = alto = Math.max(ancho, alto); }
  if (Math.abs(ancho - f.getScaledWidth()) > 0.5 || Math.abs(alto - f.getScaledHeight()) > 0.5){
    const c = f.getCenterPoint(), altoAntes = f.getScaledHeight();
    fijarTamanoForma(f, ancho, alto);
    // crece hacia abajo (el borde de arriba se queda en su lugar) y parejo a los lados
    const nuevoC = f.angle ? c : new fabric.Point(c.x, c.y - altoAntes / 2 + f.getScaledHeight() / 2);
    f.setPositionByOrigin(nuevoC, 'center', 'center');
    f.setCoords();
  }
  centrarTexto(t, f);
  actualizarConexiones(f);
}
// Mantiene el texto encima de su forma en el orden de capas
function ordenarVinculos(){
  const objs = canvas._objects;
  objs.filter(o => o.formaTexto).forEach(f => {
    const t = porId(f.formaTexto); if (!t) return;
    objs.splice(objs.indexOf(t), 1);
    objs.splice(objs.indexOf(f) + 1, 0, t);
  });
}
// Al seleccionar varias cosas, la forma y su texto (o un conector) se comportan como una sola pieza
let editandoCelda = false;
function incluirVinculados(){
  const sel0 = activo();
  if (sel0 && sel0.type !== 'activeSelection' && !sel0.isEditing && !editandoCelda){
    const f0 = nodoBase(sel0);
    if (f0 && f0.tabla){ seleccionarTabla(f0.tabla); return; }
  }
  const a = activo(); if (!a || a.type !== 'activeSelection') return;
  a.getObjects().slice().forEach(o => {
    const t = porId(o.formaTexto); if (t && !a.contains(t)) a.addWithUpdate(t);
    const f = porId(o.textoDe);    if (f && !a.contains(f)) a.addWithUpdate(f);
  });
  a.getObjects().filter(o => o.type === 'conector').forEach(c => a.removeWithUpdate(c));
}
// Mientras arrastras, escalas o giras: el texto sigue a su forma y los conectores se reajustan
function seguirVinculos(o){
  if (!o) return;
  const lista = o.type === 'activeSelection' ? o.getObjects() : [o];
  lista.forEach(x => {
    if (x.group) return;
    if (x.formaTexto){
      const t = porId(x.formaTexto);
      if (t && !t.group){ t.set('width', anchoTexto(x)); t.initDimensions(); centrarTexto(t, x); }
    }
    if (x.textoDe){
      const f = porId(x.textoDe);
      if (f && !f.group){
        const c = x.getCenterPoint(), fc = f.getCenterPoint();
        f.set({ left: f.left + (c.x - fc.x), top: f.top + (c.y - fc.y) }); f.setCoords();
        actualizarConexiones(f);
      }
    }
  });
  actualizarConexiones(o);
}
function vinculosAlModificar(o){
  if (!o) return;
  const lista = o.type === 'activeSelection' ? o.getObjects() : [o];
  lista.forEach(x => {
    if (x.group) return;
    if (x.formaTexto){
      const t = porId(x.formaTexto);
      // si tú cambias el tamaño de la forma, ese tamaño se respeta y el texto se acomoda dentro
      if (Math.abs(x.getScaledWidth() - (x.anchoBase || 0)) > 1 || Math.abs(x.getScaledHeight() - (x.altoBase || 0)) > 1){
        x.anchoBase = x.getScaledWidth(); x.altoBase = x.getScaledHeight(); x.anchoMax = anchoTexto(x);
      }
      if (t) ajustarFormaATexto(t);
    }
    if (x.textoDe) ajustarFormaATexto(x);
  });
  actualizarConexiones(o);
}
function limpiarVinculosClon(c){
  const lista = c.type === 'activeSelection' ? c.getObjects() : [c];
  const mapa = {};
  lista.forEach(x => { const n = nuevoId(); if (x.id) mapa[x.id] = n; x.id = n; });
  const mapaT = {};
  lista.forEach(x => {
    if (x.tabla) x.tabla = mapaT[x.tabla] || (mapaT[x.tabla] = nuevoId());
    x.formaTexto = mapa[x.formaTexto] || null;
    x.textoDe = mapa[x.textoDe] || null;
    if (x.type === 'conector'){
      x.conA = mapa[x.conA] || null; x.conB = mapa[x.conB] || null;
      if (!x.conA || !x.conB) x.set({ lockMovementX:false, lockMovementY:false, hasControls:true });
    }
  });
}


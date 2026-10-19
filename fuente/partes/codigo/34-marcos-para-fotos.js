/* =========================================================
   MARCOS PARA FOTOS
   ========================================================= */
const MARCOS = [['rect','Rectángulo'],['redondo','Redondeado'],['circulo','Círculo'],['arco','Arco'],['corazon','Corazón'],['estrella','Estrella'],['mancha','Mancha'],['nube','Nube']];
// Forma del marco centrada en (0,0) con tamaño w × h
function crearClipMarco(tipo, w, hh){
  const base = { originX:'center', originY:'center', left:0, top:0 };
  if (tipo === 'rect') return new fabric.Rect({ ...base, width:w, height:hh });
  if (tipo === 'redondo'){ const r = Math.min(w, hh) * 0.12; return new fabric.Rect({ ...base, width:w, height:hh, rx:r, ry:r }); }
  if (tipo === 'circulo') return new fabric.Ellipse({ ...base, rx:w/2, ry:hh/2 });
  let d;
  if (tipo === 'arco'){ const r = w/2, alto = Math.max(hh, r); d = `M 0 ${alto} L 0 ${r} A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${alto} Z`; }
  else d = { corazon: DECOS.corazon.d, estrella: DECOS.estrella.d, mancha: PATH_BLOB, nube: PATH_NUBE }[tipo] || null;
  if (!d) return new fabric.Rect({ ...base, width:w, height:hh });
  const pth = new fabric.Path(d, base);
  pth.set({ scaleX: w / pth.width, scaleY: hh / pth.height });
  return pth;
}
function crearMarcoVacio(tipo, w, hh){
  const forma = crearClipMarco(tipo, w, hh);
  forma.set({ fill:'#e5e7eb', stroke:'#9ca3af', strokeWidth:3, strokeDashArray:[12, 8], strokeUniform:true });
  const t = new fabric.Text('📷\nSuelta o sube\nuna foto', { fontSize: Math.max(12, Math.min(w, hh) * 0.085), fontFamily:'Poppins',
    fill:'#6b7280', textAlign:'center', originX:'center', originY:'center', left:0, top:0, lineHeight:1.25 });
  const g = new fabric.Group([forma, t], { originX:'center', originY:'center' });
  g.marcoVacio = { tipo, w, h: hh }; g.name = 'Marco de foto'; g.id = nuevoId();
  return g;
}
function marcoEn(q){
  return canvas.getObjects().slice().reverse().find(o => {
    if (!(o.marcoVacio || o.marco) || !o.visible) return false;
    const r = cajaAbs(o); return q.x >= r.left && q.x <= r.left + r.width && q.y >= r.top && q.y <= r.top + r.height;
  });
}
// Recorta la foto para que llene el marco (sin deformarla) según acercamiento y posición
function ajustarFoto(img){
  const m = img.marco; if (!m) return;
  const o = img.getOriginalSize(); if (!o.width || !o.height) return;
  const c = img.getCenterPoint();
  const w = img.width * img.scaleX, hh = img.height * img.scaleY;
  const esc = Math.max(w / o.width, hh / o.height) * Math.max(1, m.zoom || 1);
  const vw = w / esc, vh = hh / esc;
  img.set({ width:vw, height:vh, scaleX:esc, scaleY:esc,
    cropX: (o.width - vw) * (0.5 + (m.px || 0) / 2), cropY: (o.height - vh) * (0.5 + (m.py || 0) / 2) });
  img.clipPath = m.tipo === 'rect' ? null : crearClipMarco(m.tipo, vw, vh);
  img.setPositionByOrigin(c, 'center', 'center'); img.setCoords(); img.dirty = true;
}
function llenarMarco(m, url){
  const tipo = m.marcoVacio ? m.marcoVacio.tipo : m.marco.tipo;
  const w = m.marcoVacio ? m.marcoVacio.w * m.scaleX : m.width * m.scaleX;
  const hh = m.marcoVacio ? m.marcoVacio.h * m.scaleY : m.height * m.scaleY;
  const c = m.getCenterPoint(), ang = m.angle || 0;
  fabric.Image.fromURL(url, img => {
    img.set({ originX:'center', originY:'center', name:'Foto', id: m.id || nuevoId(), angle:ang, opacity:m.opacity, shadow:m.shadow,
      scaleX: w / img.width, scaleY: hh / img.height, fx:{ b:0, c:0, s:0, bl:0, gris:false, sepia:false, inv:false } });
    img.marco = { tipo, zoom:1, px:0, py:0 };
    ajustarFoto(img);
    img.setPositionByOrigin(c, 'center', 'center'); img.setCoords();
    const idx = canvas.getObjects().indexOf(m);
    restaurando = true; canvas.remove(m); canvas.insertAt(img, idx >= 0 ? idx : canvas.getObjects().length); restaurando = false;
    canvas.setActiveObject(img); canvas.requestRenderAll(); renderCapas(); guardarEstado();
  });
}
function sacarDeMarco(){
  const o = activo(); if (!o || !o.marco) return;
  const c = o.getCenterPoint(), og = o.getOriginalSize(), esc = o.scaleX;
  o.set({ cropX:0, cropY:0, width:og.width, height:og.height }); o.clipPath = null; o.marco = null;
  const f = Math.min(1, (W * 0.8) / (og.width * esc), (H * 0.8) / (og.height * esc));
  o.set({ scaleX: esc * f, scaleY: esc * f }); o.setPositionByOrigin(c, 'center', 'center'); o.setCoords();
  canvas.requestRenderAll(); actualizarPanel(); guardarEstado();
}
(function(){
  $('mTipo').innerHTML = MARCOS.map(([t, n]) => `<option value="${t}">${esc(n)}</option>`).join('');
  const cambio = (campo, valor, guardar) => {
    const o = activo(); if (!o || !o.marco) return;
    o.marco[campo] = valor; ajustarFoto(o); canvas.requestRenderAll();
    if (guardar) guardarEstado();
  };
  [['mZoom','zoom'],['mPx','px'],['mPy','py']].forEach(([id, campo]) => {
    $(id).addEventListener('input', e => cambio(campo, +e.target.value, false));
    $(id).addEventListener('change', e => cambio(campo, +e.target.value, true));
  });
  $('mTipo').addEventListener('change', e => cambio('tipo', e.target.value, true));
  $('archivoMarco').onchange = e => {
    const o = activo(), f = e.target.files[0]; e.target.value = '';
    if (!o || !(o.marco || o.marcoVacio) || !f) return;
    leerArchivo(f, url => { miniatura(url); llenarMarco(o, url); });
  };
  MARCOS.forEach(([tipo, nombre]) => {
    const b = document.createElement('button'); b.className = 'nodoBtn'; b.title = nombre;
    const muestra = crearClipMarco(tipo, 40, tipo === 'arco' ? 30 : 26);
    const svg = muestra.toSVG().replace(/fill="[^"]*"|style="[^"]*"/g, '');
    b.innerHTML = `<svg viewBox="-24 -17 48 34" style="fill:#c4c6ce;stroke:#6d6f7b;stroke-width:1.5;stroke-dasharray:3 2">${svg}</svg>${esc(nombre)}`;
    b.onclick = () => {
      const k = s(), w = (tipo === 'circulo' || tipo === 'estrella' || tipo === 'corazon') ? 420 * k : 520 * k, hh = tipo === 'arco' ? 620 * k : 420 * k;
      const g = crearMarcoVacio(tipo, w, hh); g.setPositionByOrigin(new fabric.Point(W/2, H/2), 'center', 'center');
      agregar(g, 'Marco de foto');
    };
    $('gridMarcos').appendChild(b);
  });
})();


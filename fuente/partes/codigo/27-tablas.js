/* =========================================================
   TABLAS
   ========================================================= */
function celdasDe(id){ return canvas.getObjects().filter(o => o.tabla === id); }
// Acomoda las celdas en filas y columnas; cada fila toma la altura de su celda con más texto
function reorganizarTabla(id){
  const cs = celdasDe(id); if (!cs.length || cs.some(c => c.group)) return;
  const pad = PAD() * 0.55, sep = cs[0].sepTabla || 0;
  const x0 = Math.min(...cs.map(c => c.getCenterPoint().x - c.width * c.scaleX / 2));
  const y0 = Math.min(...cs.map(c => c.getCenterPoint().y - c.height * c.scaleY / 2));
  const anchos = [], altos = [];
  cs.forEach(c => { anchos[c.col] = Math.max(anchos[c.col] || 0, c.anchoBase || c.width); });
  cs.forEach(c => {
    let nec = c.altoBase || 60; const t = porId(c.formaTexto);
    if (t){ t.set('width', Math.max(30, anchos[c.col] - 2 * pad)); t.initDimensions(); nec = Math.max(nec, t.height * t.scaleY + 2 * pad); }
    altos[c.fila] = Math.max(altos[c.fila] || 0, nec);
  });
  const xs = [], ys = []; let acc = x0;
  for (let i = 0; i < anchos.length; i++){ xs[i] = acc; acc += (anchos[i] || 0) + sep; }
  acc = y0;
  for (let i = 0; i < altos.length; i++){ ys[i] = acc; acc += (altos[i] || 0) + sep; }
  cs.forEach(c => {
    c.set({ width: anchos[c.col] / c.scaleX, height: altos[c.fila] / c.scaleY });
    c.setPositionByOrigin(new fabric.Point(xs[c.col] + anchos[c.col] / 2, ys[c.fila] + altos[c.fila] / 2), 'center', 'center');
    c.setCoords();
    const t = porId(c.formaTexto); if (t) centrarTexto(t, c);
  });
}
function crearTabla(cx, cy, filas, cols, est, textos = []){
  const id = nuevoId(), sep = est.sep || 0;
  const total = est.ancho || cols * 300;
  const anchos = est.anchos ? est.anchos.slice() : Array(cols).fill((total - (cols - 1) * sep) / cols);
  while (anchos.length < cols) anchos.push(anchos[anchos.length - 1]);
  const alto = est.alto || 80, altoEnc = est.altoEnc || alto;
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++){
    const enc = f === 0 && est.enc != null, col1 = c === 0 && f > 0;
    let fill = est.celda || '#ffffff';
    if (enc) fill = Array.isArray(est.enc) ? est.enc[c % est.enc.length] : est.enc;
    else if (col1 && (est.filasColores || est.col1)) fill = est.filasColores ? est.filasColores[(f - 1) % est.filasColores.length] : est.col1;
    else if (f > 0 && est.celdasFila) fill = est.celdasFila[(f - 1) % est.celdasFila.length];
    const cel = new fabric.Rect({ originX:'center', originY:'center', left:cx, top:cy, width:anchos[c], height: f === 0 ? altoEnc : alto,
      rx: est.rx || 0, ry: est.rx || 0, fill, stroke: est.borde || null, strokeWidth: est.borde ? (est.grosor || 2) : 0, strokeUniform:true,
      tabla:id, fila:f, col:c, sepTabla:sep, anchoBase:anchos[c], altoBase: f === 0 ? altoEnc : alto, id:nuevoId(), name:'Celda' });
    canvas.add(cel);
    const def = enc ? 'Título ' + (c + 1) : (col1 ? 'Fila ' + f : '');
    const txt = textos[f] && textos[f][c] != null ? textos[f][c] : def;
    const t = crearTextoVinculado(cel, txt, {
      fontSize: enc ? (est.tamEnc || 28) : (est.tam || 24),
      fontFamily: enc ? (est.fuenteEnc || est.fuente || 'Poppins') : (est.fuente || 'Poppins'),
      fontWeight: (enc || col1) ? '700' : '400',
      fill: enc && est.encTexto ? est.encTexto : (esOscuro(fill) ? '#ffffff' : '#1f2330') });
    canvas.add(t);
  }
  reorganizarTabla(id);
  const cs = celdasDe(id), rs = cs.map(c => cajaAbs(c));
  const L = Math.min(...rs.map(r => r.left)), R = Math.max(...rs.map(r => r.left + r.width));
  const T0 = Math.min(...rs.map(r => r.top)), B = Math.max(...rs.map(r => r.top + r.height));
  const dx = cx - (L + R) / 2, dy = cy - (T0 + B) / 2;
  cs.forEach(c => { c.set({ left: c.left + dx, top: c.top + dy }); c.setCoords(); const t = porId(c.formaTexto); if (t) centrarTexto(t, c); });
  ordenarVinculos();
  return id;
}
function seleccionarTabla(id){
  const objs = celdasDe(id).flatMap(c => [c, porId(c.formaTexto)].filter(Boolean));
  if (!objs.length) return;
  const sel = new fabric.ActiveSelection(objs, { canvas });
  sel.set({ lockScalingX:true, lockScalingY:true, lockRotation:true, hasControls:false });
  sel.esTabla = id;
  canvas.setActiveObject(sel); canvas.requestRenderAll();
}
function editarCelda(c){
  editandoCelda = true;
  canvas.discardActiveObject();
  const t = porId(c.formaTexto); if (!t){ editandoCelda = false; return; }
  canvas.setActiveObject(t); t.enterEditing(); t.selectAll(); canvas.requestRenderAll();
}
canvas.on('text:editing:exited', () => { editandoCelda = false; });
function tablaActual(){
  const a = activo(); if (!a) return null;
  if (a.esTabla) return a.esTabla;
  const f = nodoBase(a.type === 'activeSelection' ? a.getObjects()[0] : a);
  return (f && f.tabla) || null;
}
function editarTabla(fn){
  const id = tablaActual(); if (!id) return;
  canvas.discardActiveObject();
  restaurando = true; fn(id, celdasDe(id)); reorganizarTabla(id); ordenarVinculos(); restaurando = false;
  seleccionarTabla(id); renderCapas(); guardarEstado(); revisarAuto();
}
function quitarCeldas(lista){ lista.forEach(c => { const t = porId(c.formaTexto); if (t) canvas.remove(t); canvas.remove(c); }); }
function copiarCelda(base, cambios){
  const bt = porId(base.formaTexto);
  base.clone(n => {
    n.set({ ...cambios, id: nuevoId(), formaTexto: null });
    canvas.add(n);
    canvas.add(crearTextoVinculado(n, '', bt ? { fontSize:bt.fontSize, fontFamily:bt.fontFamily, fontWeight:bt.fontWeight, fill:bt.fill } : {}));
  }, EXTRA);
}
function tablaFila(d){
  editarTabla((id, cs) => {
    const n = Math.max(...cs.map(c => c.fila)) + 1;
    if (d > 0) cs.filter(c => c.fila === n - 1).forEach(b => copiarCelda(b, { fila: n }));
    else if (n > 1) quitarCeldas(cs.filter(c => c.fila === n - 1));
  });
}
function tablaCol(d){
  editarTabla((id, cs) => {
    const n = Math.max(...cs.map(c => c.col)) + 1;
    if (d > 0) cs.filter(c => c.col === n - 1).forEach(b => copiarCelda(b, { col: n }));
    else if (n > 1) quitarCeldas(cs.filter(c => c.col === n - 1));
  });
}
function tablaAncho(f){ editarTabla((id, cs) => cs.forEach(c => { c.anchoBase = (c.anchoBase || c.width) * f; })); }
function colorTabla(cual, color){
  const id = tablaActual(); if (!id) return;
  celdasDe(id).forEach(c => {
    const ok = cual === 'enc' ? c.fila === 0 : cual === 'col1' ? (c.col === 0 && c.fila > 0) : (c.fila > 0 && c.col > 0);
    if (!ok) return;
    c.set('fill', color);
    const t = porId(c.formaTexto); if (t) t.set('fill', esOscuro(color) ? '#ffffff' : '#1f2330');
  });
  const a = activo(); if (a) a.dirty = true;
  canvas.requestRenderAll();
}
[['tColEnc','enc'],['tColCol1','col1'],['tColCeldas','celdas']].forEach(([id, cual]) => {
  $(id).addEventListener('input', e => colorTabla(cual, e.target.value));
  $(id).addEventListener('change', guardarEstado);
});
const ESTILOS_TABLA = {
  'Clásica':  { sep:0,  rx:0,  borde:'#334155', grosor:2, enc:'#1e3a8a', encTexto:'#ffffff', col1:'#e0e7ff', celda:'#ffffff', fuente:'Inter' },
  'Tarjetas': { sep:10, rx:14, enc:'#7c3aed', encTexto:'#ffffff', col1:'#ede9fe', celda:'#f5f3ff', fuente:'Poppins' },
  'Pastel a mano': { sep:10, rx:10, borde:'#1f2330', grosor:2.5, enc:['#c4b5fd','#fbcfe8','#bbf7d0','#fde68a','#a5f3fc'], encTexto:'#1f2330', col1:'#fef3c7', celda:'#ffffff', fuente:'Patrick Hand', fuenteEnc:'Fredoka' },
  'Por categorías': { sep:8, rx:12, enc:'#f3f4f6', encTexto:'#1f2330', filasColores:['#fbcfe8','#bbf7d0','#bfdbfe','#ddd6fe','#fde68a'], celdasFila:['#fdf2f8','#f0fdf4','#eff6ff','#f5f3ff','#fefce8'], fuente:'Poppins', fuenteEnc:'Fredoka' }
};
Object.entries(ESTILOS_TABLA).forEach(([nombre, est]) => {
  const b = document.createElement('button'); b.className = 'bigbtn'; b.style.margin = '0';
  const muestra = [0,1,2].map(i => {
    const enc = Array.isArray(est.enc) ? est.enc[i] : est.enc;
    return `<span style="display:inline-block;width:22px;height:10px;margin-right:2px;border-radius:${est.rx ? 3 : 0}px;background:${enc};border:1px solid ${est.borde || 'transparent'}"></span>`;
  }).join('');
  b.innerHTML = `${muestra}<span style="margin-left:6px">${esc(nombre)}</span>`;
  b.onclick = () => insertarTabla(est);
  $('estilosTabla').appendChild(b);
});
function insertarTabla(est){
  const f = Math.max(1, Math.min(20, +$('tFilas').value || 4)), c = Math.max(1, Math.min(10, +$('tCols').value || 3)), k = s();
  restaurando = true;
  const id = crearTabla(W/2, H/2, f, c, { ...est, ancho: Math.min(W * 0.85, c * 300 * k), alto: 80 * k, tam: 24 * k, tamEnc: 28 * k,
    sep: (est.sep || 0) * k, rx: (est.rx || 0) * k, grosor: (est.grosor || 2) * k });
  restaurando = false;
  seleccionarTabla(id); renderCapas(); guardarEstado(); revisarAuto();
}


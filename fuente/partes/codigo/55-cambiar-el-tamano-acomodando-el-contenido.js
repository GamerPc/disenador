/* =========================================================
   CAMBIAR EL TAMAÑO ACOMODANDO EL CONTENIDO
   ========================================================= */
function escalarContenido(objs, w1, h1, w2, h2){
  const sx = w2 / w1, sy = h2 / h1, k = Math.min(sx, sy);
  const nuevoCentro = c => new fabric.Point(c.x * sx, c.y * sy);
  // las celdas de una tabla se mueven juntas para no encimarse ni separarse
  const tablas = {};
  objs.forEach(o => { if (o.tabla){ const r = o.getBoundingRect(true, true); const t = tablas[o.tabla] || (tablas[o.tabla] = { x0:Infinity, y0:Infinity, x1:-Infinity, y1:-Infinity });
    t.x0 = Math.min(t.x0, r.left); t.y0 = Math.min(t.y0, r.top); t.x1 = Math.max(t.x1, r.left + r.width); t.y1 = Math.max(t.y1, r.top + r.height); } });
  const porIdL = {}; objs.forEach(o => { if (o.id) porIdL[o.id] = o; });
  const centros = new Map(); objs.forEach(o => centros.set(o, o.getCenterPoint()));
  objs.forEach(o => {
    if (o.esFondo || o.type === 'conector') return;
    let c = centros.get(o), destino;
    if (o.tabla){ const t = tablas[o.tabla], tc = new fabric.Point((t.x0 + t.x1) / 2, (t.y0 + t.y1) / 2), nc = nuevoCentro(tc);
      destino = new fabric.Point(nc.x + (c.x - tc.x) * k, nc.y + (c.y - tc.y) * k); }
    else if (o.textoDe && porIdL[o.textoDe]){ const f = porIdL[o.textoDe], fc = centros.get(f), nc = nuevoCentro(fc);
      destino = new fabric.Point(nc.x + (c.x - fc.x) * k, nc.y + (c.y - fc.y) * k); }
    else destino = nuevoCentro(c);
    if (esTexto(o) && o.type !== 'text'){
      o.set({ fontSize:o.fontSize * k, width:(o.width || 0) * k });
      if (o.anchoBase) o.anchoBase *= k;
    } else {
      o.set({ scaleX:o.scaleX * k, scaleY:o.scaleY * k });
      ['anchoBase', 'altoBase', 'anchoMax'].forEach(p => { if (o[p]) o[p] *= k; });
    }
    if (o.initDimensions) o.initDimensions();
    o.setPositionByOrigin(destino, 'center', 'center'); o.setCoords();
  });
  objs.forEach(o => {
    if (o.esFondo){ try { ajustarRectFondo(o); } catch(e){} }
    if (o.type === 'conector'){ o.set('strokeWidth', o.strokeWidth * k); try { actualizarConector(o); } catch(e){} }
  });
}
async function redimensionarTodo(w2, h2){
  w2 = Math.round(w2); h2 = Math.round(h2);
  if (w2 === W && h2 === H) return;
  const w1 = W, h1 = H;
  cargando(true);
  try {
    W = w2; H = h2;   // el fondo se ajusta al tamaño nuevo
    await recorrerPaginas(objs => escalarContenido(objs, w1, h1, w2, h2), () => fijarTamano(w2, h2));
    toast('Se cambió a ' + w2 + ' × ' + h2 + ' y se acomodó el contenido de ' + paginas.length + (paginas.length === 1 ? ' página' : ' páginas'));
  } catch (e) { console.error(e); toast('No se pudo cambiar el tamaño: ' + e.message); }
  finally { cargando(false); }
}
function aplicarTamano(w, h){
  cerrarModal('mTamano');
  if ($('tAcomodar').checked) redimensionarTodo(w, h); else cambiarTamano(w, h);
}


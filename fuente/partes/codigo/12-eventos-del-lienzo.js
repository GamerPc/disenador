/* =========================================================
   EVENTOS DEL LIENZO
   ========================================================= */
['selection:created','selection:updated','selection:cleared'].forEach(ev => canvas.on(ev, () => { incluirVinculados(); actualizarPanel(); renderCapas(); }));
canvas.on('object:added', () => { renderCapas(); guardarEstado(); revisarAuto(); });
canvas.on('object:removed', () => { renderCapas(); guardarEstado(); });
canvas.on('object:modified', e => {
  const o = e.target;
  // Al escalar un texto desde las esquinas se convierte en tamaño de fuente (como en Canva)
  if (esTexto(o) && (o.scaleX !== 1 || o.scaleY !== 1)){
    o.set({ fontSize: o.fontSize * o.scaleY, width: o.width * o.scaleX, scaleX:1, scaleY:1 });
    o.initDimensions(); o.setCoords();
  }
  if (o && o.marco) ajustarFoto(o);   // al estirar una foto enmarcada se recorta, no se deforma
  vinculosAlModificar(o);
  guardarEstado(); actualizarPanel(); revisarAuto();
});
['object:moving','object:scaling','object:rotating','object:resizing'].forEach(ev => canvas.on(ev, e => { seguirVinculos(e.target); crecerAlArrastrar(e.target); }));
canvas.on('mouse:dblclick', e => {
  const o = e.target;
  if (o && o.type === 'activeSelection' && o.esTabla){
    const q = canvas.getPointer(e.e);
    const c = celdasDe(o.esTabla).find(c => { const r = cajaAbs(c); return q.x >= r.left && q.x <= r.left + r.width && q.y >= r.top && q.y <= r.top + r.height; });
    if (c) editarCelda(c);
    return;
  }
  if (o && o.type === 'conector'){ canvas.setActiveObject(o); actualizarPanel(); setTimeout(() => $('pEtiqueta').focus(), 50); return; }
  if (o && puedeTenerTexto(o)) textoEnForma(o);
});
canvas.on('text:changed', e => {
  const t = e.target;
  if (t && t.curva) aplicarCurva(t, t.curva, true);
  if (t && t.textoDe){ ajustarFormaATexto(t); actualizarConexiones(porId(t.textoDe)); canvas.requestRenderAll(); }
  revisarAuto(); clearTimeout(canvas._tc); canvas._tc = setTimeout(() => { guardarEstado(); renderCapas(); }, 500); });

// Guías inteligentes: al mover algo se "pega" a los bordes y centros de otras formas y del lienzo
let guias = [];
canvas.on('object:moving', e => {
  const o = e.target; guias = [];
  if (!o) return;
  const r = cajaAbs(o), umbral = 7 / zoom;
  const propios = { x:[r.left, r.left + r.width/2, r.left + r.width], y:[r.top, r.top + r.height/2, r.top + r.height] };
  const excluir = new Set(o.type === 'activeSelection' ? o.getObjects() : [o]);
  [...excluir].forEach(x => { const t = porId(x.formaTexto); if (t) excluir.add(t); const f = porId(x.textoDe); if (f) excluir.add(f); });
  const refs = { x:[0, W/2, W], y:[0, H/2, H] };
  canvas.getObjects().forEach(x => {
    if (excluir.has(x) || !x.visible || x.esFondo || x.textoDe || x.type === 'conector') return;
    const q = cajaAbs(x);
    refs.x.push(q.left, q.left + q.width/2, q.left + q.width);
    refs.y.push(q.top, q.top + q.height/2, q.top + q.height);
  });
  const mejor = eje => {
    let m = null;
    refs[eje].forEach(v => propios[eje].forEach(pp => { const d = v - pp; if (Math.abs(d) < umbral && (!m || Math.abs(d) < Math.abs(m.d))) m = { d, v }; }));
    return m;
  };
  const mx = mejor('x'), my = mejor('y');
  if (mx){ o.set('left', o.left + mx.d); guias.push({ x: mx.v }); }
  if (my){ o.set('top', o.top + my.d); guias.push({ y: my.v }); }
  if (mx || my){ o.setCoords(); seguirVinculos(o); }
});
canvas.on('mouse:up', () => { if (guias.length){ guias = []; canvas.requestRenderAll(); } });
canvas.on('after:render', () => {
  if (!guias.length) return;
  const ctx = canvas.contextContainer;
  ctx.save(); ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 1; ctx.setLineDash([6, 4]);
  guias.forEach(g => {
    ctx.beginPath();
    if (g.x !== undefined){ const x = Math.round(g.x*zoom) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, H*zoom); }
    else { const y = Math.round(g.y*zoom) + 0.5; ctx.moveTo(0, y); ctx.lineTo(W*zoom, y); }
    ctx.stroke();
  });
  ctx.restore();
});


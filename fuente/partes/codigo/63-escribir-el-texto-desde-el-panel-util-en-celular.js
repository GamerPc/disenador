/* =========================================================
   ESCRIBIR EL TEXTO DESDE EL PANEL (útil en celular y tablet)
   ========================================================= */
function textoUnico(){
  const ts = textos(); if (ts.length === 1) return ts[0];
  const o = activo();                       // una forma con texto adentro: se edita su texto
  if (ts.length === 0 && o && o.type !== 'activeSelection' && o.id) return canvas.getObjects().find(x => x.textoDe === o.id && esTexto(x)) || null;
  return null;
}
$('pContenido').addEventListener('input', e => {
  const t = textoUnico(); if (!t) return;
  t.set('text', e.target.value);
  t.initDimensions && t.initDimensions();
  if (t.textoDe) ajustarFormaATexto(t);
  if (t.curva && typeof aplicarCurva === 'function') aplicarCurva(t, t.curva, true);
  t.setCoords(); t.dirty = true; canvas.requestRenderAll();
});
$('pContenido').addEventListener('change', () => { guardarEstado(); renderCapas && renderCapas(); });
$('pContenido').addEventListener('keydown', e => e.stopPropagation());   // que Supr o Ctrl+Z no actúen sobre el lienzo
alActualizarPanel(function(){
  if (generandoVista || !activo()) return;
  const t = textoUnico(), c = $('pContenido');
  $('filaContenido').hidden = !t;
  if (t && document.activeElement !== c) c.value = t.text || '';
});
canvas.on('text:changed', e => { if (document.activeElement !== $('pContenido') && e.target === textoUnico()) $('pContenido').value = e.target.text || ''; });
// Cambiar la fuente: carga el grosor y estilo que de verdad usa cada texto (antes solo se pedía la negrita
// y en algunas computadoras se quedaba dibujada la letra anterior hasta recargar)
$('pFuente').onchange = e => {
  const f = e.target.value, ts = textos();
  if (!ts.length) return;
  ts.forEach(t => { t.set('fontFamily', f); t.initDimensions && t.initDimensions(); });
  aplicar('dirty', true);
  const pedidos = ts.flatMap(t => [`${t.fontStyle === 'italic' ? 'italic ' : ''}${t.fontWeight || 400} 40px "${f}"`, `400 40px "${f}"`, `700 40px "${f}"`]);
  Promise.all([...new Set(pedidos)].map(q => document.fonts.load(q).catch(() => null))).then(() => redibujarTextos(f));
};
function redibujarTextos(familia){
  if (familia) fabric.util.clearFabricFontCache(familia); else fabric.util.clearFabricFontCache();
  canvas.getObjects().forEach(o => (o.getObjects ? o.getObjects() : [o]).forEach(t => {
    if (!esTexto(t) || (familia && t.fontFamily !== familia)) return;
    t.initDimensions && t.initDimensions(); t.dirty = true;
    if (t.textoDe) ajustarFormaATexto(t);
  }));
  canvas.requestRenderAll();
}
// Cuando termina de descargarse cualquier fuente, se vuelven a dibujar los textos (así no se quedan con la letra provisional)
if (document.fonts && document.fonts.addEventListener){
  let pendiente = null;
  document.fonts.addEventListener('loadingdone', () => { clearTimeout(pendiente); pendiente = setTimeout(() => redibujarTextos(), 60); });
}


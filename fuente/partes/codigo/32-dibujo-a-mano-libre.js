/* =========================================================
   DIBUJO A MANO LIBRE
   ========================================================= */
let pincelActual = null;
function configurarPincel(){
  if (!pincelActual) return;
  const b = new fabric.PencilBrush(canvas), c = $('colorPincel').value, g = +$('grosorPincel').value * s();
  b.color = pincelActual === 'resaltador' ? hexAlpha(c, 0.38) : c;
  b.width = g * (pincelActual === 'marcador' ? 2.5 : pincelActual === 'resaltador' ? 5 : 1);
  b.strokeLineCap = pincelActual === 'resaltador' ? 'square' : 'round';
  b.decimate = 1.5;
  canvas.freeDrawingBrush = b;
}
function activarDibujo(tipo){
  if (tipo && modoConector) activarModoConector(false);
  pincelActual = tipo;
  canvas.isDrawingMode = !!tipo;
  document.querySelectorAll('#pinceles .pb').forEach(b => b.classList.toggle('on', b.dataset.p === tipo));
  $('dibujoAviso').style.display = tipo ? 'block' : 'none';
  if (tipo === 'resaltador' && esOscuro($('colorPincel').value)) $('colorPincel').value = '#fde047';
  if (tipo){ if (activo() && activo().isEditing) activo().exitEditing(); canvas.discardActiveObject(); configurarPincel(); }
  canvas.requestRenderAll(); actualizarPuntos();
}
document.querySelectorAll('#pinceles .pb').forEach(b => b.onclick = () => activarDibujo(pincelActual === b.dataset.p ? null : b.dataset.p));
['colorPincel','grosorPincel'].forEach(id => $(id).addEventListener('input', configurarPincel));
['#1f2330','#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#7c3aed','#ec4899','#ffffff','#fde047','#86efac'].forEach(c => {
  const d = document.createElement('div'); d.className = 'sw'; d.style.background = c;
  d.onclick = () => { $('colorPincel').value = c; configurarPincel(); };
  $('swPincel').appendChild(d);
});
canvas.on('path:created', e => {
  const pth = e.path;
  pth.set({ name: pincelActual === 'resaltador' ? 'Resaltado' : 'Dibujo', id: nuevoId(), trazoLibre: true });
  if (pincelActual === 'resaltador') pth.set('globalCompositeOperation', 'multiply');
  guardarEstado(); renderCapas();
});


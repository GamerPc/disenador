/* =========================================================
   CELULAR Y TABLET
   ========================================================= */
const esTel = () => matchMedia('(max-width: 820px)').matches;          // teléfono: paneles abajo
const esCompacto = () => matchMedia('(max-width: 1180px)').matches;    // tablet o teléfono: propiedades como panel flotante
const esTactil = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (esTactil){
  // asas más grandes para el dedo
  fabric.Object.prototype.set({ cornerSize:16, touchCornerSize:42, padding:8 });
  document.body.classList.add('tactil');
}
function abrirLateral(abrir){ $('lateral').classList.toggle('abierto', abrir); if (abrir) $('props').classList.remove('abierto'); }
function alternarProps(abrir){
  const ab = abrir ?? !$('props').classList.contains('abierto');
  $('props').classList.toggle('abierto', ab);
  if (ab && esTel()) $('lateral').classList.remove('abierto');
  $('fabEditar').classList.toggle('on', ab);
  $('accMovil').classList.toggle('oculto', ab);
}
function actualizarBotonesMovil(){
  const hay = !!canvas.getActiveObject();
  $('accMovil').classList.toggle('ver', hay);
  if (!hay) alternarProps(false);
}
['selection:created','selection:updated','selection:cleared'].forEach(ev => canvas.on(ev, actualizarBotonesMovil));
// En el teléfono, al agregar algo desde el panel se cierra para que veas el lienzo
$('lateral').addEventListener('click', e => {
  if (!esTel()) return;
  if (e.target.closest('.tarjetaPl,.forma,.nodoBtn,.emojiBtn,.tituloBtn,#misImagenes img,.plantilla,.bigbtn:not([data-queda])')) setTimeout(() => abrirLateral(false), 120);
});
// Pellizcar con dos dedos = acercar/alejar; mover con dos dedos = desplazarse
(function gestosTactiles(){
  const area = $('area'); let g = null;
  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const medio = (a, b) => ({ x:(a.clientX + b.clientX) / 2, y:(a.clientY + b.clientY) / 2 });
  area.addEventListener('touchstart', e => {
    if (e.touches.length !== 2) return;
    e.preventDefault(); e.stopPropagation();
    const tr = canvas._currentTransform;                 // se cancela lo que hacía el primer dedo
    if (tr && tr.target && tr.original){ tr.target.set(tr.original); tr.target.setCoords(); }
    canvas._currentTransform = null; canvas._groupSelector = null;
    const [a, b] = e.touches, m = medio(a, b), r = $('envoltura').getBoundingClientRect();
    g = { d:Math.max(10, dist(a, b)), z:zoom, px:(m.x - r.left) / zoom, py:(m.y - r.top) / zoom };
    canvas.requestRenderAll();
  }, { capture:true, passive:false });
  window.addEventListener('touchmove', e => {
    if (!g) return;
    e.preventDefault(); e.stopPropagation();
    if (e.touches.length < 2) return;
    const [a, b] = e.touches, m = medio(a, b);
    establecerZoom(g.z * dist(a, b) / g.d);
    const r = $('envoltura').getBoundingClientRect();
    area.scrollLeft += (r.left + g.px * zoom) - m.x;
    area.scrollTop += (r.top + g.py * zoom) - m.y;
  }, { capture:true, passive:false });
  const fin = e => { if (g && e.touches.length === 0){ g = null; e.stopPropagation(); canvas.requestRenderAll(); } };
  window.addEventListener('touchend', fin, { capture:true });
  window.addEventListener('touchcancel', fin, { capture:true });
})();
// En la presentación: deslizar a la izquierda/derecha cambia de diapositiva
(function deslizarPresentacion(){
  let x0 = null, y0 = 0;
  $('presentacion').addEventListener('touchstart', e => { if (e.touches.length === 1){ x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive:true });
  $('presentacion').addEventListener('touchend', e => {
    if (x0 == null) return;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3){ e.preventDefault(); dx < 0 ? presSiguiente() : presAnterior(); }
  });
})();


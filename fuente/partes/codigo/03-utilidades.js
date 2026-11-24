/* =========================================================
   UTILIDADES
   ========================================================= */
function toast(msg){
  const t = $('toast'); t.textContent = msg; t.classList.add('ver');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('ver'), 2600);
}
function cargando(v){ $('cargando').style.display = v ? 'flex' : 'none'; }
const focoOrigenModal = new WeakMap();
function elementosEnFoco(contenedor){
  return [...contenedor.querySelectorAll('a[href],area[href],button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]')]
    .filter(e => !e.closest('[hidden],[inert],[aria-hidden="true"]') && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
}
function prepararDialogoModal(modal){
  const dialogo = modal.querySelector('[role="dialog"],.caja') || modal.firstElementChild;
  if (!dialogo) return null;
  if (!dialogo.hasAttribute('role')) dialogo.setAttribute('role', 'dialog');
  if (!dialogo.hasAttribute('aria-modal')) dialogo.setAttribute('aria-modal', 'true');
  if (!dialogo.hasAttribute('aria-label') && !dialogo.hasAttribute('aria-labelledby')){
    const titulo = dialogo.querySelector('h1,h2,h3,h4,[data-dialog-title]');
    if (titulo && titulo.textContent.trim()){
      if (!titulo.id) titulo.id = modal.id + '-titulo';
      dialogo.setAttribute('aria-labelledby', titulo.id);
    } else dialogo.setAttribute('aria-label', 'Ventana de diálogo');
  }
  return dialogo;
}
function focoVisible(el){
  return !!el && el.isConnected && !el.disabled && !el.closest('[hidden],[inert],[aria-hidden="true"]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
}
function abrirModal(id){
  const modal = $(id); if (!modal) return;
  const dialogo = prepararDialogoModal(modal);
  if (!modal.classList.contains('abierto') && document.activeElement !== document.body){
    let origen = document.activeElement;
    const modalCerrado = origen.closest('.modal');
    if (modalCerrado && !modalCerrado.classList.contains('abierto')){
      const origenAnterior = focoOrigenModal.get(modalCerrado);
      if (focoVisible(origenAnterior)) origen = origenAnterior;
    }
    focoOrigenModal.set(modal, origen);
  }
  modal.classList.add('abierto');
  requestAnimationFrame(() => {
    if (!modal.classList.contains('abierto') || modal.contains(document.activeElement)) return;
    const focables = dialogo && elementosEnFoco(dialogo);
    if (focables && focables.length) focables[0].focus();
    else if (dialogo){ dialogo.tabIndex = -1; dialogo.focus(); }
  });
}
function cerrarModal(id){
  const modal = $(id); if (!modal) return;
  const estabaAbierto = modal.classList.contains('abierto');
  modal.classList.remove('abierto');
  if (!estabaAbierto) return;
  const origen = focoOrigenModal.get(modal);
  requestAnimationFrame(() => {
    focoOrigenModal.delete(modal);
    const abiertos = [...document.querySelectorAll('.modal.abierto')];
    const destino = focoVisible(origen) ? origen : elementosEnFoco($('barra') || document.body)[0];
    if (!destino || (abiertos.length && !abiertos.some(m => m.contains(destino)))) return;
    destino.focus();
  });
}
document.addEventListener('click', e => { const modal = e.target.closest('.modal'); if (modal && e.target === modal) cerrarModal(modal.id); });
document.addEventListener('keydown', e => {
  const modal = [...document.querySelectorAll('.modal.abierto')].pop(); if (!modal || e.key !== 'Tab') return;
  const dialogo = prepararDialogoModal(modal), focables = dialogo && elementosEnFoco(dialogo);
  if (!focables || !focables.length){ e.preventDefault(); if (dialogo){ dialogo.tabIndex = -1; dialogo.focus(); } return; }
  const primero = focables[0], ultimo = focables[focables.length - 1];
  if (e.shiftKey && (e.target === primero || !focables.includes(e.target))){ e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && (e.target === ultimo || !focables.includes(e.target))){ e.preventDefault(); primero.focus(); }
}, true);
addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  const modal = [...document.querySelectorAll('.modal.abierto')].pop();
  if (modal){ e.preventDefault(); cerrarModal(modal.id); }
});
// Relaciona las etiquetas visibles con su campo cuando una fila contiene un solo control.
document.querySelectorAll('.fila').forEach(fila => {
  const campos = [...fila.querySelectorAll('input[id],select[id],textarea[id]')].filter(c => c.closest('.fila') === fila);
  const etiquetas = [...fila.children].filter(e => e.tagName === 'LABEL' && !e.querySelector('input,select,textarea'));
  if (campos.length === 1 && etiquetas.length === 1 && !etiquetas[0].htmlFor) etiquetas[0].htmlFor = campos[0].id;
});
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function aHex(c){
  if (!c || typeof c !== 'string') return '#000000';
  try { return '#' + new fabric.Color(c).toHex(); } catch(e){ return '#000000'; }
}
const esTexto = o => o && ['textbox','i-text','text'].includes(o.type);
const activo = () => canvas.getActiveObject();
function objetivos(){
  const o = activo(); if (!o) return [];
  if (o.type === 'activeSelection') return o.getObjects();
  return [o];
}
function hojas(o){ return (o.type === 'group') ? o.getObjects().flatMap(hojas) : [o]; }
const s = () => W / 1080; // escala relativa al tamaño

const nuevoId = () => 'o' + Math.random().toString(36).slice(2, 10);
// Caja de un elemento en coordenadas del lienzo, aunque esté dentro de una selección múltiple
function cajaAbs(o){
  if (!o.group) return o.getBoundingRect(true, true);
  const m = o.calcTransformMatrix(), d = o._getNonTransformedDimensions();
  const pts = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx, sy]) => fabric.util.transformPoint(new fabric.Point(sx*d.x/2, sy*d.y/2), m));
  const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
  const left = Math.min(...xs), top = Math.min(...ys);
  return { left, top, width: Math.max(...xs) - left, height: Math.max(...ys) - top };
}
const porId = id => id ? canvas.getObjects().find(o => o.id === id) : null;
const esLinea = o => !!o && (o.type === 'line' || o.type === 'conector');
function agregar(o, nombre){
  o.id = o.id || nuevoId();
  o.name = o.name || nombre || o.type;
  canvas.add(o);
  canvas.setActiveObject(o);
  canvas.requestRenderAll();
}


/* =========================================================
   UTILIDADES
   ========================================================= */
function toast(msg){
  const t = $('toast'); t.textContent = msg; t.classList.add('ver');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('ver'), 2600);
}
function cargando(v){ $('cargando').style.display = v ? 'flex' : 'none'; }
function abrirModal(id){ $(id).classList.add('abierto'); }
function cerrarModal(id){ $(id).classList.remove('abierto'); }
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('abierto'); }));
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


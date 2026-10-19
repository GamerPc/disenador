/* =========================================================
   LIENZO FLEXIBLE
   ========================================================= */
let lienzoAuto = true;
try { lienzoAuto = localStorage.getItem('disenador_auto2') !== '0'; } catch(e){}
$('lienzoAuto').checked = lienzoAuto;
$('bAuto').classList.toggle('on', lienzoAuto);
$('bAuto').onclick = () => { $('lienzoAuto').checked = !lienzoAuto; $('lienzoAuto').onchange({ target:$('lienzoAuto') });
  toast(lienzoAuto ? 'Lienzo automático: crece solo cuando algo se sale' : 'Lienzo automático apagado'); };
$('lienzoAuto').onchange = e => {
  lienzoAuto = e.target.checked;
  $('bAuto').classList.toggle('on', lienzoAuto);
  try { localStorage.setItem('disenador_auto2', lienzoAuto ? '1' : '0'); } catch(_){}
  if (lienzoAuto) ajustarLienzoAContenido(true);
};
// Mientras arrastras algo hacia la derecha o hacia abajo, el lienzo crece contigo
function crecerAlArrastrar(o){
  if (!lienzoAuto || !o) return;
  const r = cajaAbs(o), m = 40 * s();
  let nw = W, nh = H;
  if (r.left + r.width > W) nw = Math.ceil(r.left + r.width + m);
  if (r.top + r.height > H) nh = Math.ceil(r.top + r.height + m);
  if (nw === W && nh === H) return;
  W = Math.min(8000, nw); H = Math.min(8000, nh);
  canvas.setDimensions({ width: Math.round(W*zoom), height: Math.round(H*zoom) });
  $('tamTxt').textContent = W + ' × ' + H;
  const f = canvas.getObjects().find(x => x.esFondo); if (f) ajustarRectFondo(f);
  miniaturas = []; crecioArrastrando = true;
}
let crecioArrastrando = false;
// al soltar, se reajusta el zoom para ver todo el lienzo
canvas.on('mouse:up', () => { if (crecioArrastrando){ crecioArrastrando = false; setTimeout(() => { ajustarZoom(); guardarEstado(); }, 320); } });
function revisarAuto(){
  if (!lienzoAuto || restaurando || generandoVista) return;
  clearTimeout(revisarAuto._t);
  revisarAuto._t = setTimeout(() => ajustarLienzoAContenido(true), 300);
}
function limitesContenido(){
  const objs = canvas.getObjects().filter(o => !o.esFondo && o.visible);
  if (!objs.length) return null;
  const b = { x1:Infinity, y1:Infinity, x2:-Infinity, y2:-Infinity };
  objs.forEach(o => {
    const r = cajaAbs(o);
    b.x1 = Math.min(b.x1, r.left); b.y1 = Math.min(b.y1, r.top);
    b.x2 = Math.max(b.x2, r.left + r.width); b.y2 = Math.max(b.y2, r.top + r.height);
  });
  return b;
}
function moverTodo(dx, dy){
  const a = activo();
  if (a && a.type === 'activeSelection'){ a.set({ left: a.left + dx, top: a.top + dy }); a.setCoords(); }
  canvas.getObjects().filter(o => !o.esFondo && !o.group).forEach(o => { o.set({ left: o.left + dx, top: o.top + dy }); o.setCoords(); });
  actualizarTodasConexiones();
}
// soloCrecer = true: solo agranda si algo se sale. false: recorta/ajusta el lienzo justo al contenido con margen
function ajustarLienzoAContenido(soloCrecer){
  const b = limitesContenido();
  if (!b){ if (!soloCrecer) toast('Agrega algo al diseño primero'); return; }
  const m = Math.round(40 * s());
  let dx = 0, dy = 0, nw, nh;
  if (soloCrecer){
    if (b.x1 < -1) dx = Math.ceil(-b.x1) + m;
    if (b.y1 < -1) dy = Math.ceil(-b.y1) + m;
    nw = b.x2 > W + 1 ? Math.ceil(b.x2 + dx + m) : W + dx;
    nh = b.y2 > H + 1 ? Math.ceil(b.y2 + dy + m) : H + dy;
  } else {
    dx = Math.round(m - b.x1); dy = Math.round(m - b.y1);
    nw = Math.ceil(b.x2 - b.x1 + 2*m); nh = Math.ceil(b.y2 - b.y1 + 2*m);
  }
  nw = Math.max(50, Math.min(8000, nw)); nh = Math.max(50, Math.min(8000, nh));
  if (!dx && !dy && nw === W && nh === H) return;
  if (dx || dy) moverTodo(dx, dy);
  cambiarTamano(nw, nh);
}
// Asas para cambiar el tamaño del lienzo desde cualquier lado o esquina
document.querySelectorAll('.asa').forEach(asa => {
  let ini = null;
  asa.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); asa.setPointerCapture(e.pointerId);
    canvas.discardActiveObject();
    ini = { x:e.clientX, y:e.clientY, w:W, h:H, d:asa.dataset.d, ox:0, oy:0 };
  });
  asa.addEventListener('pointermove', e => {
    if (!ini) return;
    const dx = (e.clientX - ini.x) / zoom, dy = (e.clientY - ini.y) / zoom, d = ini.d;
    let w = ini.w, hh = ini.h;
    if (d.includes('e')) w = ini.w + dx;
    if (d.includes('w')) w = ini.w - dx;
    if (d.includes('s')) hh = ini.h + dy;
    if (d.includes('n')) hh = ini.h - dy;
    w = Math.round(Math.max(50, Math.min(8000, w))); hh = Math.round(Math.max(50, Math.min(8000, hh)));
    // al jalar desde la izquierda o arriba, el contenido se queda en su lugar
    ini.ox = d.includes('w') ? w - ini.w : 0;
    ini.oy = d.includes('n') ? hh - ini.h : 0;
    W = w; H = hh;
    canvas.setDimensions({ width: Math.round(W*zoom), height: Math.round(H*zoom) });
    canvas.setViewportTransform([zoom, 0, 0, zoom, ini.ox*zoom, ini.oy*zoom]);
    $('tamTxt').textContent = W + ' × ' + H;
  });
  const soltar = () => {
    if (!ini) return;
    const { ox, oy } = ini; ini = null;
    canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
    if (ox || oy) moverTodo(ox, oy);
    cambiarTamano(W, H);
  };
  asa.addEventListener('pointerup', soltar);
  asa.addEventListener('pointercancel', soltar);
});


/* =========================================================
   MENÚ DE CLIC DERECHO (y dejando el dedo presionado en celular/tablet)
   ========================================================= */
const ICO_CTX = {
  copiar:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  pegar:'<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h4"/>',
  duplicar:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10M14 11v6M11 14h6"/>',
  eliminar:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  estilo:'<path d="M4 20l6-6M14 4l6 6-8 8-6-6z"/>',
  frente:'<rect x="8" y="8" width="12" height="12" rx="1" fill="currentColor" fill-opacity=".25"/><path d="M4 16V4h12"/>',
  fondo:'<rect x="4" y="4" width="12" height="12" rx="1"/><path d="M20 8v12H8" />',
  arriba:'<path d="M12 19V5M6 11l6-6 6 6"/>',
  abajo:'<path d="M12 5v14M6 13l6 6 6-6"/>',
  grupo:'<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M11 7h4v4M13 17H9v-4"/>',
  candado:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  abierto:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
  voltearH:'<path d="M12 3v18M8 7L3 12l5 5zM16 7l5 5-5 5z"/>',
  voltearV:'<path d="M3 12h18M7 8l5-5 5 5zM7 16l5 5 5-5z"/>',
  centrar:'<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  texto:'<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  imagen:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>',
  recortar:'<path d="M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14"/>',
  varita:'<path d="M15 4V2M15 10V8M11 6h2M17 6h2M4 20l11-11"/>',
  deshacer:'<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  rehacer:'<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
  todo:'<path d="M4 4h4M4 4v4M20 4h-4M20 4v4M4 20h4M4 20v-4M20 20h-4M20 20v-4"/>',
  forma:'<rect x="4" y="4" width="16" height="16" rx="3"/>',
  fondoPag:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l6-6 12 12"/>'
};
const icoCtx = k => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICO_CTX[k] || ''}</svg>`;
let menuCtxPunto = null;          // dónde se abrió el menú (en coordenadas del diseño)
(function(){
  const m = document.createElement('div'); m.id = 'menuCtx'; m.setAttribute('role', 'menu'); m.hidden = true; document.body.appendChild(m);
})();
function cerrarMenuCtx(){ const m = $('menuCtx'); if (!m.hidden){ m.hidden = true; m.innerHTML = ''; } }
function opcionesMenuCtx(){
  const o = activo(), varios = o && o.type === 'activeSelection', esTexto = o && /text/i.test(o.type || '') && !varios;
  const L = [];
  if (o){
    L.push({ t:'Copiar', a:'Ctrl+C', i:'copiar', f:() => clonar(o, c => { portapapeles = c; if (typeof marcarCopiaInterna === 'function') marcarCopiaInterna(); toast('Copiado'); }) });
    L.push({ t:'Pegar', a:'Ctrl+V', i:'pegar', des:!portapapeles, f:() => clonar(portapapeles, pegarClon) });
    L.push({ t:'Duplicar', a:'Ctrl+D', i:'duplicar', f:duplicar });
    L.push({ t:'Eliminar', a:'Supr', i:'eliminar', peligro:true, des:!!o.bloqueado, f:eliminar });
    L.push('-');
    if (esTexto) L.push({ t:'Editar el texto', a:'Doble clic', i:'texto', des:!!o.bloqueado, f:() => { canvas.setActiveObject(o); o.enterEditing(); o.selectAll(); canvas.requestRenderAll(); } });
    if (o.type === 'image'){
      if (typeof iniciarRecorteRect === 'function') L.push({ t:'Recortar', i:'recortar', f:iniciarRecorteRect });
      if (typeof quitarFondoIA === 'function') L.push({ t:'Quitar el fondo (IA)', i:'varita', f:quitarFondoIA });
      if (typeof convertirImagenSeleccionada === 'function') L.push({ t:'Convertir en diagrama editable (IA)', i:'grupo', f:convertirImagenSeleccionada });
    }
    L.push({ t:'Copiar estilo', a:'Ctrl+Alt+C', i:'estilo', des:varios, f:copiarEstilo });
    L.push({ t:'Pegar estilo', a:'Ctrl+Alt+V', i:'estilo', f:pegarEstilo });
    L.push('-');
    L.push({ t:'Traer al frente', a:'Ctrl+Shift+↑', i:'frente', des:varios, f:() => orden('frente') });
    L.push({ t:'Traer adelante', a:'Ctrl+↑', i:'arriba', des:varios, f:() => orden('adelante') });
    L.push({ t:'Enviar atrás', a:'Ctrl+↓', i:'abajo', des:varios, f:() => orden('atras') });
    L.push({ t:'Enviar al fondo', a:'Ctrl+Shift+↓', i:'fondo', des:varios, f:() => orden('fondo') });
    L.push('-');
    if (varios && !o.esTabla) L.push({ t:'Agrupar', a:'Ctrl+G', i:'grupo', f:agruparToggle });
    else if (o.type === 'group') L.push({ t:'Desagrupar', a:'Ctrl+G', i:'grupo', f:agruparToggle });
    L.push({ t:'Centrar en la página', i:'centrar', f:() => { alinear('centroH'); alinear('centroV'); } });
    L.push({ t:'Voltear horizontal', i:'voltearH', des:varios, f:() => voltear('flipX') });
    L.push({ t:'Voltear vertical', i:'voltearV', des:varios, f:() => voltear('flipY') });
    L.push({ t:o.bloqueado ? 'Desbloquear' : 'Bloquear', a:'Ctrl+Shift+L', i:o.bloqueado ? 'abierto' : 'candado', f:bloquearSel });
    L.push('-');
    L.push({ t:'Copiar como imagen', i:'imagen', f:() => copiarComoImagen(o) });
  } else {
    L.push({ t:'Pegar aquí', a:'Ctrl+V', i:'pegar', des:!portapapeles, f:() => clonar(portapapeles, c => { pegarClon(c); moverAlPunto(c); }) });
    L.push({ t:'Seleccionar todo', a:'Ctrl+A', i:'todo', f:() => { const objs = canvas.getObjects().filter(x => x.selectable && x.visible); if (objs.length){ canvas.setActiveObject(new fabric.ActiveSelection(objs, { canvas })); canvas.requestRenderAll(); } } });
    L.push('-');
    L.push({ t:'Agregar un texto aquí', a:'T', i:'texto', f:() => { agregarTexto('cuerpo'); moverAlPunto(activo()); } });
    L.push({ t:'Agregar un rectángulo aquí', a:'R', i:'forma', f:() => { agregarForma('rect'); moverAlPunto(activo()); } });
    L.push({ t:'Cambiar el fondo', i:'fondoPag', f:() => { const b = document.querySelector('#pestanas button[data-tab="tFondo"]'); if (b) b.click(); if (window.innerWidth <= 820 && typeof abrirLateral === 'function') abrirLateral(true); } });
    L.push('-');
    L.push({ t:'Deshacer', a:'Ctrl+Z', i:'deshacer', des:hi <= 0, f:deshacer });
    L.push({ t:'Rehacer', a:'Ctrl+Y', i:'rehacer', des:hi >= historial.length - 1, f:rehacer });
  }
  // sin separadores repetidos ni al final
  return L.filter((x, i, a) => x !== '-' || (i > 0 && a[i - 1] !== '-' && i < a.length - 1));
}
function moverAlPunto(o){
  if (!o || !menuCtxPunto) return;
  // que quede completo dentro de la página
  const w = Math.min(o.getScaledWidth(), W), h = Math.min(o.getScaledHeight(), H);
  const x = Math.max(w / 2, Math.min(W - w / 2, menuCtxPunto.x)), y = Math.max(h / 2, Math.min(H - h / 2, menuCtxPunto.y));
  o.setPositionByOrigin(new fabric.Point(x, y), 'center', 'center');
  o.setCoords(); canvas.requestRenderAll(); guardarEstado();
}
async function copiarComoImagen(o){
  try {
    const url = o.toDataURL({ format:'png', multiplier:Math.min(4, Math.max(1, 1200 / Math.max(o.getScaledWidth(), o.getScaledHeight()))) });
    const blob = await (await fetch(url)).blob();
    if (!navigator.clipboard || !window.ClipboardItem) throw new Error('sin portapapeles');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png':blob })]);
    toast('Imagen copiada: pégala en Word, WhatsApp, Docs…');
  } catch (e) { toast('Tu navegador no deja copiar imágenes. Usa ⬇ Exportar.'); }
}
function abrirMenuCtx(x, y){
  const m = $('menuCtx'), ops = opcionesMenuCtx();
  m.innerHTML = ops.map((op, i) => op === '-' ? '<div class="sepCtx" role="separator"></div>'
    : `<button role="menuitem" data-i="${i}" class="${op.peligro ? 'peligro' : ''}"${op.des ? ' disabled aria-disabled="true"' : ''}>${icoCtx(op.i)}<span>${esc(op.t)}</span>${op.a ? `<kbd>${esc(op.a)}</kbd>` : ''}</button>`).join('');
  m.querySelectorAll('button').forEach(b => b.onclick = () => { const op = ops[+b.dataset.i]; cerrarMenuCtx(); try { op.f(); } catch (e) { console.error(e); } });
  m.hidden = false;
  const r = m.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
  m.style.left = Math.max(6, Math.min(x, vw - r.width - 6)) + 'px';
  m.style.top = Math.max(6, (y + r.height > vh - 6 ? Math.max(6, y - r.height) : y)) + 'px';
  const pri = m.querySelector('button:not([disabled])'); if (pri) pri.focus({ preventScroll:true });
}
function puntoDiseno(e){ const p = canvas.getPointer(e); return { x:p.x, y:p.y }; }
// Clic derecho sobre el lienzo: selecciona lo que está debajo (si no estaba ya seleccionado) y abre el menú
function menuCtxEnLienzo(e, x, y){
  if (canvas.isDrawingMode || (typeof modoConector !== 'undefined' && modoConector)) return false;
  const o = activo(); if (o && o.isEditing) return false;
  const t = canvas.findTarget(e, false);
  if (t && !canvas.getActiveObjects().includes(t) && t !== o){ canvas.setActiveObject(t); canvas.requestRenderAll(); }
  else if (!t && o && !(o.containsPoint && o.containsPoint(canvas.getPointer(e, true)))){ canvas.discardActiveObject(); canvas.requestRenderAll(); }
  menuCtxPunto = puntoDiseno(e);
  abrirMenuCtx(x, y);
  return true;
}
(function(){
  const sup = canvas.upperCanvasEl, cont = sup.parentNode;
  cont.addEventListener('contextmenu', e => { if (menuCtxEnLienzo(e, e.clientX, e.clientY)) e.preventDefault(); });
  // celular y tablet: dejar el dedo presionado
  let tToque = null, inicio = null;
  sup.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) { clearTimeout(tToque); return; }
    const t = e.touches[0]; inicio = { x:t.clientX, y:t.clientY };
    clearTimeout(tToque);
    tToque = setTimeout(() => {
      const ev = { clientX:inicio.x, clientY:inicio.y, target:sup, touches:[], changedTouches:[{ clientX:inicio.x, clientY:inicio.y }], type:'touchend', preventDefault(){} };
      const o = activo();
      if (o && (o.isMoving || o.isEditing)) return;
      if (menuCtxEnLienzo(ev, inicio.x, inicio.y)){ if (navigator.vibrate) try { navigator.vibrate(12); } catch (er) {} }
    }, 560);
  }, { passive:true });
  sup.addEventListener('touchmove', e => { const t = e.touches[0]; if (inicio && t && Math.hypot(t.clientX - inicio.x, t.clientY - inicio.y) > 10) clearTimeout(tToque); }, { passive:true });
  ['touchend', 'touchcancel'].forEach(n => sup.addEventListener(n, () => clearTimeout(tToque), { passive:true }));
  canvas.on('object:moving', () => clearTimeout(tToque));
})();
// cerrar: clic afuera, Esc, rueda, cambiar tamaño de ventana
document.addEventListener('pointerdown', e => { const m = $('menuCtx'); if (!m.hidden && !m.contains(e.target)) cerrarMenuCtx(); }, true);
window.addEventListener('resize', cerrarMenuCtx);
window.addEventListener('blur', cerrarMenuCtx);
document.addEventListener('wheel', e => { const m = $('menuCtx'); if (!m.hidden && !m.contains(e.target)) cerrarMenuCtx(); }, { passive:true, capture:true });
document.addEventListener('keydown', e => {
  const m = $('menuCtx');
  if (!m.hidden){
    const bs = [...m.querySelectorAll('button:not([disabled])')], k = bs.indexOf(document.activeElement);
    if (e.key === 'Escape'){ e.preventDefault(); e.stopImmediatePropagation(); cerrarMenuCtx(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); e.stopImmediatePropagation(); const n = bs.length; if (n) bs[(k + (e.key === 'ArrowDown' ? 1 : -1) + n) % n].focus(); }
    else if (e.key === 'Tab'){ cerrarMenuCtx(); }
    else if (e.key !== 'Enter' && e.key !== ' ') { e.stopImmediatePropagation(); }
    return;
  }
  // tecla «menú» o Shift+F10: abre el menú de lo seleccionado (útil sin mouse)
  if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')){
    const tag = (document.activeElement || {}).tagName;
    if (['INPUT','SELECT','TEXTAREA'].includes(tag) || document.querySelector('.modal.abierto')) return;
    const o = activo(); if (o && o.isEditing) return;
    e.preventDefault();
    const r = canvas.upperCanvasEl.getBoundingClientRect(), k = r.width / canvas.getWidth();
    let x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (o){ const b = o.getBoundingRect(); x = r.left + (b.left + b.width / 2) * k; y = r.top + (b.top + b.height / 2) * k; }
    menuCtxPunto = o ? { x:o.getCenterPoint().x, y:o.getCenterPoint().y } : { x:W / 2, y:H / 2 };
    abrirMenuCtx(x, y);
  }
}, true);

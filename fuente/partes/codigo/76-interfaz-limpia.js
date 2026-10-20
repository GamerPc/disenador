/* =========================================================
   INTERFAZ LIMPIA (más espacio para el diseño, como Canva o Figma)
   - Arriba solo lo esencial; lo demás va en el menú «Archivo».
   - El panel izquierdo se oculta y se muestra (clic en la pestaña activa o en la flecha).
   - El panel derecho flota y solo aparece cuando seleccionas algo (o abres Capas).
   - Barra flotante junto a lo seleccionado: duplicar, bloquear, eliminar y más.
   - Abajo: notas, páginas (se pueden ocultar) y zoom, como en Canva.
   - Modo enfoque (Ctrl + \): solo el lienzo.
   Todo se puede regresar a la «interfaz clásica» desde el menú Archivo.
   ========================================================= */
const ICO_UI = {
  chevron:'<path d="M6 9l6 6 6-6"/>', izq:'<path d="M15 18l-6-6 6-6"/>', der:'<path d="M9 18l6-6-6-6"/>',
  capas:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>', enfoque:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  paginas:'<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  cerrar:'<path d="M6 6l12 12M18 6L6 18"/>', interfaz:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M3 9h6"/>',
  mas:'<path d="M5 12h.01M12 12h.01M19 12h.01" style="stroke-width:3.2"/>'
};
const icoUI = k => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICO_UI[k] || ICO_CTX[k] || ''}</svg>`;
const esEscritorio = () => window.innerWidth > 820;
function interfazLimpia(){ return document.documentElement.classList.contains('limpia'); }

/* ---------- menú «Archivo» ---------- */
(function(){
  const barra = $('barra'), logo = barra.querySelector('.logo');
  const b = document.createElement('button'); b.className = 'tb'; b.id = 'bArchivo';
  b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false'); b.title = 'Archivo: nuevo, abrir, buscar, ayuda y más';
  b.innerHTML = `<svg class="ico icoMenuArch" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>Archivo ${icoUI('chevron')}`;
  logo.after(b);
  const m = document.createElement('div'); m.id = 'menuArchivo'; m.setAttribute('role', 'menu'); m.hidden = true;
  m.innerHTML = '<div id="maPrincipal"></div><div class="sepMenu"></div><div id="maVista"></div><div class="sepMenu"></div><div id="maExtra"></div>';
  document.body.appendChild(m);
  const abrir = v => {
    m.hidden = !v; b.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (v){
      const r = b.getBoundingClientRect(); m.style.top = (r.bottom + 6) + 'px'; m.style.left = Math.max(8, Math.min(r.left, innerWidth - m.offsetWidth - 8)) + 'px';
      const f = m.querySelector('button:not([hidden])'); f && f.focus({ preventScroll:true });
    }
  };
  b.onclick = e => { e.stopPropagation(); abrir(m.hidden); };
  m.addEventListener('click', e => { const t = e.target.closest('button'); if (t && t.id !== 'bAuto') abrir(false); });
  document.addEventListener('click', e => { if (!m.hidden && !m.contains(e.target) && !b.contains(e.target)) abrir(false); });
  document.addEventListener('keydown', e => {
    if (m.hidden) return;
    if (e.key === 'Escape'){ abrir(false); b.focus(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      const bs = [...m.querySelectorAll('button')].filter(x => x.offsetParent), k = bs.indexOf(document.activeElement);
      e.preventDefault(); if (bs.length) bs[(k + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus();
    }
  });
  window.cerrarMenuArchivo = () => abrir(false);
  // botón para volver a la interfaz clásica (o a la limpia)
  const bi = document.createElement('button'); bi.className = 'tb'; bi.id = 'bInterfaz';
  bi.onclick = () => ponerInterfaz(!interfazLimpia());
  $('maVista').appendChild(bi);
})();
// qué se mueve al menú Archivo y qué se va abajo, junto al zoom
function elementosArchivo(){
  const enBarra = sel => [...document.querySelectorAll(sel)].find(e => e.closest('#barra, #menuMas, #menuArchivo'));
  return {
    principal:[enBarra('button[onclick="nuevoDiseno()"]'), enBarra('button[onclick^="abrirModal(\'mProyectos\')"]'), enBarra('button[onclick="abrirBuscar()"]'),
      enBarra('button[onclick^="ajustarLienzoAContenido"]'), $('bAuto')],
    vista:[$('bTema')],
    extra:[enBarra('button[onclick="abrirModal(\'mAyuda\')"]'), $('bInstalar'), enBarra('.tb.donar')]
  };
}
function etiquetarMenu(b){
  if (b.id === 'tamTxt' || b.querySelector('.etqMenu')) return;
  if ((b.textContent || '').replace(/\s/g, '').match(/[\p{L}]{3,}/u)) return;
  const s = document.createElement('span'); s.className = 'etqMenu'; s.textContent = ' ' + (b.title || '').replace(/\s*\(.*\)$/, ''); b.appendChild(s);
}
function moverAlArchivo(){
  const g = elementosArchivo();
  const au = $('bAuto'); if (au && !au.querySelector('.etqMenu')){ au.dataset.txt = au.textContent; au.innerHTML = '<span class="etqMenu">Agrandar el lienzo solo (Auto)</span>'; }
  [['principal', 'maPrincipal'], ['vista', 'maVista'], ['extra', 'maExtra']].forEach(([k, id]) => g[k].filter(Boolean).forEach(e => {
    e.dataset.fuera = '1'; etiquetarMenu(e);
    if (id === 'maVista') $(id).insertBefore(e, $('bInterfaz')); else $(id).appendChild(e);
  }));
  // zoom y «Ajustar» bajan al pie, a la derecha (como Canva)
  const zoom = $('grupoZoom'), aj = [...document.querySelectorAll('button[onclick="ajustarZoom()"]')].find(e => e.closest('#barra, #menuMas, #pieDer'));
  [zoom, aj].filter(Boolean).forEach(e => { e.dataset.fuera = '1'; $('pieZoom').appendChild(e); });
  if (window.acomodarBarra) acomodarBarra();
}
function regresarABarra(){
  const au = $('bAuto'); if (au && au.dataset.txt){ au.textContent = au.dataset.txt; delete au.dataset.txt; }
  document.querySelectorAll('[data-fuera]').forEach(e => { delete e.dataset.fuera; $('barra').appendChild(e); });
  if (window.acomodarBarra) acomodarBarra();
}

/* ---------- pie: notas · páginas · zoom · enfoque ---------- */
(function(){
  const pie = $('barraNotas');
  const der = document.createElement('div'); der.id = 'pieDer';
  der.innerHTML = `<button class="pb" id="bPaginasPie" title="Mostrar u ocultar las páginas" aria-expanded="true">${icoUI('paginas')}<span id="txtPaginasPie">Páginas</span></button>
    <div id="pieZoom"></div>
    <button class="pb" id="bEnfoque" title="Modo enfoque: solo el lienzo (Ctrl + \\)" aria-label="Modo enfoque">${icoUI('enfoque')}</button>`;
  pie.appendChild(der);
  $('bPaginasPie').onclick = () => ponerPaginasOcultas(!document.documentElement.classList.contains('sinPaginas'));
  $('bEnfoque').onclick = () => ponerEnfoque(true);
  const salir = document.createElement('button'); salir.id = 'salirEnfoque'; salir.className = 'btnS';
  salir.innerHTML = `${icoUI('cerrar')} Salir del modo enfoque <kbd>Esc</kbd>`; salir.onclick = () => ponerEnfoque(false);
  document.body.appendChild(salir);
  const pinta = () => { const t = $('txtPaginasPie'); if (t) t.textContent = 'Página ' + (actual + 1) + ' de ' + paginas.length; };
  new MutationObserver(pinta).observe($('paginas'), { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  pinta();
})();
function ponerPaginasOcultas(v, guardar = true){
  document.documentElement.classList.toggle('sinPaginas', !!v);
  $('bPaginasPie').setAttribute('aria-expanded', v ? 'false' : 'true');
  if (guardar) try { localStorage.setItem('disenador_sinPaginas', v ? '1' : ''); } catch (e) {}
  medirPie(); setTimeout(ajustarZoom, 30);
}
function ponerEnfoque(v){
  document.documentElement.classList.toggle('enfoque', !!v);
  cerrarMenuCtx(); medirPie();
  setTimeout(ajustarZoom, 30);
  if (v) toast('Modo enfoque · Esc o Ctrl + \\ para salir');
}
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && (e.key === '\\' || e.code === 'Backslash' || e.code === 'IntlBackslash')){ e.preventDefault(); ponerEnfoque(!document.documentElement.classList.contains('enfoque')); }
  else if (e.key === 'Escape' && document.documentElement.classList.contains('enfoque') && !document.querySelector('.modal.abierto') && !(activo() && activo().isEditing) && !canvas.getActiveObject()) ponerEnfoque(false);
});

/* ---------- panel izquierdo que se oculta ---------- */
(function(){
  const asa = document.createElement('button'); asa.id = 'asaLateral'; asa.title = 'Ocultar el panel'; asa.setAttribute('aria-label', 'Ocultar el panel');
  asa.innerHTML = icoUI('izq'); asa.onclick = () => ponerLateral($('app').classList.contains('sinLateral'));
  $('app').appendChild(asa);
  // clic en la pestaña activa: oculta o muestra el panel (en computadora)
  $('pestanas').addEventListener('click', e => {
    const b = e.target.closest('button[data-tab]'); if (!b || !interfazLimpia() || !esEscritorio()) return;
    const oculto = $('app').classList.contains('sinLateral');
    if (b.classList.contains('activa') && !oculto){ e.stopImmediatePropagation(); ponerLateral(false); }
    else if (oculto) ponerLateral(true);
  }, true);
})();
function ponerLateral(v, guardar = true){
  $('app').classList.toggle('sinLateral', !v);
  const a = $('asaLateral'); a.innerHTML = icoUI(v ? 'izq' : 'der'); a.title = v ? 'Ocultar el panel' : 'Mostrar el panel'; a.setAttribute('aria-label', a.title);
  if (guardar) try { localStorage.setItem('disenador_sinLateral', v ? '0' : '1'); } catch (e) {}
  ubicarAsa(); setTimeout(ajustarZoom, 30);
}
function ubicarAsa(){
  const a = $('asaLateral'), app = $('app').getBoundingClientRect(), lat = $('lateral'), pes = $('pestanas');
  const r = (lat.offsetParent && lat.getBoundingClientRect().width > 0 ? lat : pes).getBoundingClientRect();
  a.style.left = (r.right - app.left) + 'px';
}
window.addEventListener('resize', ubicarAsa);

/* ---------- panel derecho flotante ---------- */
(function(){
  const bc = document.createElement('button'); bc.id = 'bCapasFlot'; bc.className = 'btnS'; bc.title = 'Ver las capas del diseño';
  bc.innerHTML = `${icoUI('capas')} Capas`;
  bc.onclick = () => abrirOpcionesCompletas(bc, 'capas');
  $('centro').appendChild(bc);
  const x = document.createElement('button'); x.id = 'bCerrarProps'; x.title = 'Cerrar el panel'; x.setAttribute('aria-label', 'Cerrar el panel'); x.innerHTML = icoUI('cerrar');
  x.onclick = () => { $('app').classList.remove('propsFijo'); revisarProps(); ajustarZoom(); };
  const tabs = document.querySelector('#props .tabsProps'); if (tabs) tabs.appendChild(x);
})();
function revisarProps(){
  // con la interfaz limpia el panel completo solo se abre a propósito (la barra rápida tiene lo más usado)
  const fijo = $('app').classList.contains('propsFijo');
  $('app').classList.toggle('conProps', fijo || (!!canvas.getActiveObject() && !interfazLimpia()));
}
['selection:created', 'selection:updated', 'selection:cleared'].forEach(ev => canvas.on(ev, () => setTimeout(revisarProps, 0)));
// el panel no tapa el pie (notas, páginas y zoom)
function medirPie(){
  const n = $('barraNotas'), p = $('paginas'), np = $('notasPagina');
  const alto = (n && n.offsetParent ? n.offsetHeight : 0) + (p && p.offsetParent ? p.offsetHeight : 0) + (np && !np.hidden && np.offsetParent ? np.offsetHeight : 0);
  document.documentElement.style.setProperty('--altoPie', alto + 'px');
}
if (window.ResizeObserver){ const ro = new ResizeObserver(medirPie); ['barraNotas', 'paginas', 'notasPagina'].forEach(id => $(id) && ro.observe($(id))); }

/* ---------- barra flotante junto a lo seleccionado ---------- */
(function(){
  const d = document.createElement('div'); d.id = 'barraSel'; d.setAttribute('role', 'toolbar'); d.setAttribute('aria-label', 'Acciones rápidas'); d.hidden = true;
  d.innerHTML = `<button data-acc="duplicar" title="Duplicar (Ctrl+D)" aria-label="Duplicar">${icoCtx('duplicar')}</button>
    <button data-acc="bloquear" title="Bloquear (Ctrl+Shift+L)" aria-label="Bloquear">${icoCtx('candado')}</button>
    <button data-acc="eliminar" title="Eliminar (Supr)" aria-label="Eliminar">${icoCtx('eliminar')}</button>
    <button data-acc="mas" title="Más opciones (clic derecho)" aria-label="Más opciones">${icoUI('mas')}</button>`;
  $('centro').appendChild(d);
  d.addEventListener('mousedown', e => e.preventDefault());
  d.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; const o = activo(); if (!o) return;
    const acc = b.dataset.acc;
    if (acc === 'duplicar') duplicar();
    else if (acc === 'bloquear') bloquearSel();
    else if (acc === 'eliminar') eliminar();
    else if (acc === 'mas'){ const r = b.getBoundingClientRect(); const c = o.getCenterPoint(); menuCtxPunto = { x:c.x, y:c.y }; abrirMenuCtx(r.left, r.bottom + 6); }
    setTimeout(ponerBarraSel, 30);
  };
})();
let selMoviendo = false, rafSel = 0;
function ponerBarraSel(){
  const d = $('barraSel'), o = activo();
  if (!d) return;
  if (!o || !interfazLimpia() || !esEscritorio() || selMoviendo || o.isEditing || canvas.isDrawingMode || document.documentElement.classList.contains('enfoque') || (typeof recorte !== 'undefined' && recorte)){ d.hidden = true; return; }
  const bl = d.querySelector('[data-acc="bloquear"]');
  bl.innerHTML = icoCtx(o.bloqueado ? 'abierto' : 'candado'); bl.title = (o.bloqueado ? 'Desbloquear' : 'Bloquear') + ' (Ctrl+Shift+L)'; bl.setAttribute('aria-label', o.bloqueado ? 'Desbloquear' : 'Bloquear');
  d.querySelector('[data-acc="eliminar"]').disabled = !!o.bloqueado;
  d.hidden = false;
  const r = rectObjetoPP(o), c = $('centro').getBoundingClientRect(), a = $('area').getBoundingClientRect();
  const w = d.offsetWidth, h = d.offsetHeight;
  let x = r.left + r.width / 2 - w / 2, y = r.top - h - 44;          // arriba (deja espacio a la manija de girar)
  if (o.type === 'conector') y = r.top + r.height + 24;              // en las líneas va abajo, para no tapar el punto de doblar
  const br = $('barraRapida'), tope = Math.max(a.top + 6, br && !br.hidden ? br.getBoundingClientRect().bottom + 8 : 0);
  if (y < tope) y = r.top + r.height + 30;                           // si no cabe, abajo
  if (y + h > a.bottom - 6) y = Math.max(a.top + 6, Math.min(a.bottom - h - 6, r.top + 8));
  x = Math.max(a.left + 6, Math.min(a.right - w - 6, x));
  d.style.left = (x - c.left) + 'px'; d.style.top = (y - c.top) + 'px';
}
const pedirBarraSel = () => { cancelAnimationFrame(rafSel); rafSel = requestAnimationFrame(ponerBarraSel); };
['selection:created', 'selection:updated', 'selection:cleared', 'object:modified', 'text:editing:entered', 'text:editing:exited'].forEach(ev => canvas.on(ev, () => { selMoviendo = false; pedirBarraSel(); }));
['object:moving', 'object:scaling', 'object:rotating', 'object:resizing'].forEach(ev => canvas.on(ev, () => { if (!selMoviendo){ selMoviendo = true; $('barraSel').hidden = true; } }));
canvas.on('mouse:up', () => { if (selMoviendo){ selMoviendo = false; pedirBarraSel(); } });
canvas.on('after:render', () => { if (!$('barraSel').hidden || activo()) pedirBarraSel(); });
$('area').addEventListener('scroll', pedirBarraSel, { passive:true });
window.addEventListener('resize', pedirBarraSel);

/* ---------- encender / apagar la interfaz limpia ---------- */
function ponerInterfaz(limpia, guardar = true){
  document.documentElement.classList.toggle('limpia', !!limpia);
  if (guardar) try { localStorage.setItem('disenador_interfaz', limpia ? 'limpia' : 'clasica'); } catch (e) {}
  if (limpia) moverAlArchivo(); else { regresarABarra(); document.documentElement.classList.remove('sinPaginas', 'enfoque'); $('app').classList.remove('sinLateral'); }
  if (limpia){
    let sl = '', sp = ''; try { sl = localStorage.getItem('disenador_sinLateral'); sp = localStorage.getItem('disenador_sinPaginas'); } catch (e) {}
    ponerLateral(sl === '0', false); ponerPaginasOcultas(sp === '1', false);   // como Canva: el panel empieza cerrado y se abre al elegir una herramienta
  }
  const bi = $('bInterfaz');
  bi.innerHTML = `${icoUI('interfaz')}<span class="etqMenu"> ${limpia ? 'Interfaz clásica (todo a la vista)' : 'Interfaz limpia (más espacio)'}</span>`;
  bi.title = limpia ? 'Volver a ver todos los botones y paneles como antes' : 'Más espacio para el diseño: menos botones a la vista';
  $('bArchivo').hidden = !limpia;
  revisarProps(); medirPie(); pedirBarraSel();
  setTimeout(() => { if (window.acomodarBarra) acomodarBarra(); ajustarZoom(); }, 40);
}
(function(){
  let v = null; try { v = localStorage.getItem('disenador_interfaz'); } catch (e) {}
  ponerInterfaz(v !== 'clasica', false);
  // botones que llegan después (cuenta, instalar app…) también se acomodan
  document.addEventListener('barra-cambio', () => { if (interfazLimpia()) setTimeout(moverAlArchivo, 0); });
  setTimeout(() => { if (interfazLimpia()) moverAlArchivo(); medirPie(); }, 1500);
})();
// el zoom automático deja libre el lugar del panel flotante, para que nunca tape la página
const ajustarZoomBase = ajustarZoom;
ajustarZoom = function(){
  if (!(interfazLimpia() && esEscritorio())) return ajustarZoomBase();
  const a = $('area'), cs = getComputedStyle(a), extra = Math.max(0, parseFloat(cs.paddingRight) - 30), extraY = Math.max(0, parseFloat(cs.paddingTop) - 30);
  establecerZoom(Math.min((a.clientWidth - 80 - extra) / W, (a.clientHeight - 80 - extraY) / H));
  a.scrollLeft = a.scrollTop = 0;
};

/* =========================================================
   MODO CLARO / OSCURO, ATAJOS VISIBLES Y PRIMEROS PASOS (PRÁCTICA GUIADA)
   ========================================================= */

/* ---------- Modo claro / oscuro ---------- */
const ICO_SOL = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const ICO_LUNA = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
function temaClaro(){ return document.documentElement.classList.contains('claro'); }
function ponerTema(claro, guardar = true){
  document.documentElement.classList.toggle('claro', !!claro);
  if (guardar) try { localStorage.setItem('disenador_tema', claro ? 'claro' : 'oscuro'); } catch (e) {}
  const b = $('bTema'); if (!b) return;
  b.innerHTML = (claro ? ICO_LUNA : ICO_SOL) + `<span class="etqMenu"> ${claro ? 'Modo oscuro' : 'Modo claro'}</span>`;
  b.title = claro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro (se ve mejor en el proyector)';
  b.setAttribute('aria-label', b.title);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = claro ? '#ffffff' : '#05070d';
}
(function(){
  const ayuda = document.querySelector('#barra [onclick="abrirModal(\'mAyuda\')"]');
  const b = document.createElement('button'); b.className = 'tb'; b.id = 'bTema';
  b.onclick = () => { ponerTema(!temaClaro()); toast(temaClaro() ? 'Modo claro' : 'Modo oscuro'); };
  if (ayuda) ayuda.before(b); else $('barra').appendChild(b);
  let t = null; try { t = localStorage.getItem('disenador_tema'); } catch (e) {}
  ponerTema(t === 'claro', false);
})();

/* ---------- Atajos de teclado nuevos ---------- */
function hayModalAbierto(){ return !!document.querySelector('.modal.abierto') || (typeof pasoRec !== 'undefined' && pasoRec >= 0); }
function alternarEstiloTexto(prop){
  const o = activo(); if (!o || !/text/i.test(o.type || '')) return false;
  const v = { fontWeight:['bold', 'normal'], fontStyle:['italic', 'normal'], underline:[true, false] }[prop];
  const on = prop === 'fontWeight' ? (o.fontWeight === 'bold' || +o.fontWeight >= 600) : o[prop] === v[0];
  o.set(prop, on ? v[1] : v[0]); if (o.initDimensions) o.initDimensions();
  canvas.requestRenderAll(); guardarEstado(); try { actualizarPanel(); } catch (e) {}
  return true;
}
document.addEventListener('keydown', e => {
  const tag = (document.activeElement || {}).tagName;
  if (['INPUT','SELECT','TEXTAREA'].includes(tag) || (document.activeElement && document.activeElement.isContentEditable)) return;
  const o = activo(); if (o && o.isEditing) return;
  if (hayModalAbierto()) return;
  const ctrl = e.ctrlKey || e.metaKey, k = (e.key || '').toLowerCase();
  let hecho = true;
  if (ctrl && !e.altKey && (k === 'arrowup' || k === 'arrowdown') && o){ orden(k === 'arrowup' ? (e.shiftKey ? 'frente' : 'adelante') : (e.shiftKey ? 'fondo' : 'atras')); }
  else if (ctrl && !e.altKey && (e.code === 'BracketRight' || e.code === 'BracketLeft') && o){ orden(e.code === 'BracketRight' ? (e.shiftKey ? 'frente' : 'adelante') : (e.shiftKey ? 'fondo' : 'atras')); }
  else if (ctrl && !e.altKey && k === 'e'){ abrirModal('mExportar'); }
  else if (ctrl && e.shiftKey && k === 'l' && o){ bloquearSel(); }
  else if (ctrl && !e.shiftKey && !e.altKey && k === 'b' && o){ hecho = alternarEstiloTexto('fontWeight'); }
  else if (ctrl && !e.shiftKey && !e.altKey && k === 'i' && o){ hecho = alternarEstiloTexto('fontStyle'); }
  else if (ctrl && !e.shiftKey && !e.altKey && k === 'u' && o){ hecho = alternarEstiloTexto('underline'); }
  else if (!ctrl && !e.altKey && !e.shiftKey && !canvas.isDrawingMode){
    if (k === 't') agregarTexto('cuerpo');
    else if (k === 'r') agregarForma('rect');
    else if (k === 'o') agregarForma('circulo');
    else if (k === 'l') agregarForma('linea');
    else if (k === 'i'){ const a = $('archivoImg'); if (a) a.click(); }
    else hecho = false;
  }
  else hecho = false;
  if (hecho){ e.preventDefault(); e.stopImmediatePropagation(); }
}, true);

/* ---------- Atajos visibles: en los botones, en el menú «Más» y en la ayuda ---------- */
const ATAJOS_BOTONES = [
  ['guardarDrive()', 'Ctrl+S'], ["abrirModal('mExportar')", 'Ctrl+E'], ['duplicar()', 'Ctrl+D'], ['eliminar()', 'Supr'],
  ['agruparToggle()', 'Ctrl+G'], ['copiarEstilo()', 'Ctrl+Alt+C'], ['pegarEstilo()', 'Ctrl+Alt+V'], ['bloquearSel()', 'Ctrl+Shift+L'],
  ["orden('frente')", 'Ctrl+Shift+↑'], ["orden('adelante')", 'Ctrl+↑'], ["orden('atras')", 'Ctrl+↓'], ["orden('fondo')", 'Ctrl+Shift+↓'],
  ["agregarTexto('cuerpo')", 'T'], ["agregarForma('rect')", 'R'], ["agregarForma('circulo')", 'O'], ["agregarForma('linea')", 'L'],
  ['deshacer()', 'Ctrl+Z'], ['rehacer()', 'Ctrl+Y'], ['abrirBuscar()', 'Ctrl+F'], ["abrirModal('mAyuda')", '?']
];
function marcarAtajos(raiz = document){
  ATAJOS_BOTONES.forEach(([f, a]) => raiz.querySelectorAll(`button[onclick="${f.replace(/"/g, '\\"')}"]`).forEach(b => {
    b.dataset.atajo = a;
    const base = (b.getAttribute('title') || b.textContent || '').replace(/\s*\([^()]*\)\s*$/, '').trim();
    if (base) b.title = base + ' (' + a + ')';
  }));
  const archivo = document.querySelector('[onclick*="archivoImg"]'); if (archivo){ archivo.dataset.atajo = 'I'; }
}
marcarAtajos();
alActualizarPanel(() => marcarAtajos($('props')));

const GRUPOS_ATAJOS = [
  ['Lo básico', [['Ctrl + Z', 'Deshacer'], ['Ctrl + Y', 'Rehacer'], ['Ctrl + S', 'Guardar'], ['Ctrl + E', 'Exportar / descargar'], ['Ctrl + F', 'Buscar y reemplazar texto'], ['?', 'Abrir esta ayuda'], ['Esc', 'Salir del modo actual / quitar selección'], ['Clic derecho', 'Menú: copiar, duplicar, eliminar, orden… (en celular, deja el dedo presionado)'], ['Shift + F10', 'Abrir ese menú con el teclado']]],
  ['Agregar', [['T', 'Un texto'], ['R', 'Un rectángulo'], ['O', 'Un círculo'], ['L', 'Una línea'], ['I', 'Una imagen de tu equipo'], ['C', 'Modo conector (unir formas)'], ['Tab', 'Una idea conectada (en mapas)']]],
  ['Editar lo seleccionado', [['Ctrl + C / Ctrl + V', 'Copiar y pegar'], ['Ctrl + D', 'Duplicar'], ['Supr', 'Eliminar'], ['Ctrl + A', 'Seleccionar todo'], ['Ctrl + G', 'Agrupar / desagrupar'], ['Ctrl + Shift + L', 'Bloquear / desbloquear'], ['Ctrl + Alt + C / V', 'Copiar y pegar solo el estilo'], ['Flechas', 'Mover 1 px (con Shift, 10 px)']]],
  ['Orden', [['Ctrl + ↑', 'Traer adelante'], ['Ctrl + ↓', 'Enviar atrás'], ['Ctrl + Shift + ↑', 'Traer al frente'], ['Ctrl + Shift + ↓', 'Enviar al fondo']]],
  ['Texto', [['Doble clic', 'Escribir en un texto'], ['Ctrl + B', 'Negrita'], ['Ctrl + I', 'Cursiva'], ['Ctrl + U', 'Subrayado']]],
  ['Vista y presentación', [['Ctrl + rueda del mouse', 'Acercar / alejar'], ['→ ← Esc N', 'En la presentación: avanzar, regresar, salir y ver tus notas']]]
];
(function(){
  const kbd = t => t.split(/\s*\+\s*/).map(p => p.split(' / ').map(x => `<kbd>${esc(x)}</kbd>`).join(' / ')).join('<i>+</i>');
  $('listaAtajos').className = 'gruposAtajos';
  $('listaAtajos').innerHTML = GRUPOS_ATAJOS.map(([g, l]) => `<div class="grupoAtajo"><b>${esc(g)}</b>${l.map(([t, d]) => `<div class="atajo"><span class="teclas">${kbd(t)}</span><span>${esc(d)}</span></div>`).join('')}</div>`).join('');
})();

// Si usas el mouse para algo que tiene atajo, te lo sugiere una vez (solo con teclado físico)
(function(){
  const conTeclado = window.matchMedia && matchMedia('(pointer:fine)').matches;
  let vistos = {}; try { vistos = JSON.parse(localStorage.getItem('disenador_tips') || '{}'); } catch (e) {}
  const cuenta = {};
  document.addEventListener('click', e => {
    if (!conTeclado) return;
    const b = e.target.closest && e.target.closest('[data-atajo]'); if (!b) return;
    const a = b.dataset.atajo; if (vistos[a] || a === '?') return;
    cuenta[a] = (cuenta[a] || 0) + 1;
    if (cuenta[a] === 3){
      vistos[a] = 1; try { localStorage.setItem('disenador_tips', JSON.stringify(vistos)); } catch (er) {}
      setTimeout(() => toast('💡 Tip: también puedes usar ' + a.replace(/\+/g, ' + ') + ' en tu teclado'), 400);
    }
  }, true);
})();

/* ---------- Primeros pasos: práctica guiada que avanza cuando tú lo haces ---------- */
const PASOS_PP = [
  { id:'plantilla', t:'Elige una plantilla', d:'Abre Plantillas y haz clic en la que más te guste.', tab:'tPlantillas', foco:'#lateral .tarjetaPl' },
  { id:'texto', t:'Cambia un texto', d:'Haz doble clic en un texto del lienzo y escribe lo que quieras.', foco:'texto' },
  { id:'color', t:'Cambia un color', d:'Con algo seleccionado, toca el color en la barra de arriba y elige otro.', foco:'#props' },
  { id:'mover', t:'Mueve o agranda algo', d:'Arrastra un elemento o jala una de sus esquinas.', foco:'objeto' },
  { id:'agregar', t:'Agrega algo nuevo', d:'En Elementos, Formas, Texto o Imágenes, toca algo para ponerlo en tu diseño.', tab:'tElementos', foco:'#pestanas [data-tab="tElementos"]' },
  { id:'exportar', t:'Descarga tu diseño', d:'Toca ⬇ Exportar y elige PNG, PDF o PowerPoint.', foco:'#barra [onclick*="mExportar"], #menuMas [onclick*="mExportar"]' }
];
let PP = { hechos:[], activo:false, mini:false };
try { PP = { ...PP, ...JSON.parse(localStorage.getItem('disenador_pp') || '{}') }; } catch (e) {}
const guardarPP = () => { try { localStorage.setItem('disenador_pp', JSON.stringify(PP)); } catch (e) {} };
(function(){
  const d = document.createElement('div'); d.id = 'pp'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Primeros pasos'); d.hidden = true;
  document.body.appendChild(d);
  const f = document.createElement('div'); f.id = 'ppFoco'; f.hidden = true; document.body.appendChild(f);
})();
function iniciarPrimerosPasos(desdeCero){
  cerrarModal('mAyuda'); $('bienvenida').style.display = 'none';
  try { localStorage.setItem('disenador_recorrido', '1'); } catch (e) {}
  if (desdeCero || PP.hechos.length >= PASOS_PP.length) PP.hechos = [];
  PP.activo = true; PP.mini = false; guardarPP(); pintarPP();
}
function cerrarPrimerosPasos(){ PP.activo = false; guardarPP(); $('pp').hidden = true; quitarFocoPP(); }
function pasoActualPP(){ return PASOS_PP.find(p => !PP.hechos.includes(p.id)); }
function hechoPP(id){
  if (!PP.activo || PP.hechos.includes(id)) return;
  PP.hechos.push(id); guardarPP(); quitarFocoPP();
  const sig = pasoActualPP();
  toast(sig ? '✓ ¡Bien! Ahora: ' + sig.t.toLowerCase() : '🎉 ¡Listo! Ya sabes lo básico');
  pintarPP();
}
function ubicarPP(){
  const d = $('pp'), a = $('area');
  if (!d || window.innerWidth <= 820 || !a){ if (d){ d.style.left = ''; d.style.bottom = ''; } return; }
  const r = a.getBoundingClientRect();
  if (r.width < 380){ d.style.left = ''; d.style.bottom = ''; return; }
  d.style.left = (r.left + 16) + 'px'; d.style.bottom = Math.max(16, window.innerHeight - r.bottom + 16) + 'px';
}
window.addEventListener('resize', ubicarPP);
function pintarPP(){
  const d = $('pp'); if (!PP.activo){ d.hidden = true; return; }
  d.hidden = false; ubicarPP();
  const n = PP.hechos.length, total = PASOS_PP.length, act = pasoActualPP();
  d.classList.toggle('mini', !!PP.mini);
  if (PP.mini){
    d.innerHTML = `<button class="ppPildora" id="ppAbrir" aria-label="Abrir primeros pasos">🚀 Primeros pasos · ${n}/${total}</button>`;
    $('ppAbrir').onclick = () => { PP.mini = false; guardarPP(); pintarPP(); };
    return;
  }
  if (!act){
    d.innerHTML = `<div class="ppCab"><b>🎉 ¡Terminaste!</b><button class="ppX" id="ppCerrar" aria-label="Cerrar">✕</button></div>
      <p class="ppTxt">Ya sabes elegir, editar, agregar y descargar. Lo demás funciona igual: selecciona algo y mira sus opciones a la derecha.</p>
      <div class="ppAcc">${typeof abrirEscuela === 'function' ? '<button class="btnS" id="ppEscuela">🎓 Ver el modo escuela</button>' : ''}<button class="btnS" onclick="abrirModal('mAyuda')">Ver atajos</button><button class="btnP" id="ppFin">Cerrar</button></div>`;
    $('ppCerrar').onclick = $('ppFin').onclick = cerrarPrimerosPasos;
    if ($('ppEscuela')) $('ppEscuela').onclick = () => { cerrarPrimerosPasos(); abrirEscuela(); };
    return;
  }
  d.innerHTML = `<div class="ppCab"><b>🚀 Primeros pasos</b><span>${n} de ${total}</span><button class="ppX" id="ppMin" aria-label="Minimizar" title="Minimizar">–</button><button class="ppX" id="ppCerrar" aria-label="Cerrar" title="Cerrar">✕</button></div>
    <div class="ppBarra"><i style="width:${Math.round(n / total * 100)}%"></i></div>
    <ol class="ppLista">${PASOS_PP.map(p => `<li class="${PP.hechos.includes(p.id) ? 'ok' : p === act ? 'act' : ''}"><span class="ppCheck">${PP.hechos.includes(p.id) ? '✓' : ''}</span><span><b>${esc(p.t)}</b>${p === act ? `<small>${esc(p.d)}</small>` : ''}</span></li>`).join('')}</ol>
    <div class="ppAcc"><button class="btnS" id="ppSaltar">Saltar este</button><button class="btnP" id="ppMuestra">👀 Muéstrame</button></div>`;
  $('ppMin').onclick = () => { PP.mini = true; guardarPP(); pintarPP(); quitarFocoPP(); };
  $('ppCerrar').onclick = cerrarPrimerosPasos;
  $('ppSaltar').onclick = () => hechoPP(act.id);
  $('ppMuestra').onclick = () => mostrarPasoPP(act);
}
let tFocoPP = null, focoPP = null;
function quitarFocoPP(){ clearTimeout(tFocoPP); focoPP = null; const f = $('ppFoco'); if (f) f.hidden = true; }
function rectObjetoPP(o){
  const el = canvas.upperCanvasEl, r = el.getBoundingClientRect(), k = r.width / canvas.getWidth(), b = o.getBoundingRect();
  return { left:r.left + b.left * k, top:r.top + b.top * k, width:b.width * k, height:b.height * k };
}
function objetoParaPP(soloTexto){
  const objs = canvas.getObjects().filter(o => o.visible !== false && o.selectable !== false && !o.esFondo && !o.esTemporal);
  return (soloTexto ? objs.filter(o => /text/i.test(o.type || '')) : objs).sort((a, b) => b.getScaledWidth() * b.getScaledHeight() - a.getScaledWidth() * a.getScaledHeight())[0]
    || (soloTexto ? null : objs[0]);
}
function mostrarPasoPP(p){
  if (p.tab){ const b = document.querySelector(`#pestanas button[data-tab="${p.tab}"]`); if (b && !b.classList.contains('activa')) b.click(); if (window.innerWidth <= 820 && typeof abrirLateral === 'function') abrirLateral(true); }
  let objetivo = null;
  if (p.foco === 'texto' || p.foco === 'objeto' || p.foco === '#props'){
    let o = activo();
    if (!o || (p.foco === 'texto' && !/text/i.test(o.type || ''))){ o = objetoParaPP(p.foco === 'texto'); if (o){ canvas.setActiveObject(o); canvas.requestRenderAll(); } }
    if (!o){ toast(p.foco === 'texto' ? 'Primero agrega un texto (pestaña Texto) o elige una plantilla' : 'Primero agrega algo a tu diseño'); return; }
    if (p.foco === '#props' && document.querySelector('#barraRapida:not([hidden]) [data-k="color"]')){ objetivo = () => { const q = document.querySelector('#barraRapida:not([hidden]) [data-k="color"]'); return q ? q.getBoundingClientRect() : rectObjetoPP(o); }; }
    else if (p.foco === '#props'){ if (window.innerWidth <= 820 && typeof alternarProps === 'function') try { alternarProps(true); } catch (e) {} objetivo = () => { const el = $('props'); const r = el.getBoundingClientRect(); return r.width > 0 ? r : rectObjetoPP(o); }; }
    else objetivo = () => rectObjetoPP(o);
  } else {
    objetivo = () => { const el = [...document.querySelectorAll(p.foco)].find(x => x.getBoundingClientRect().width > 0); return el ? el.getBoundingClientRect() : null; };
  }
  setTimeout(() => {
    focoPP = objetivo; ponerFocoPP();
    const r = focoPP && focoPP(); if (!r) toast(p.d);
    clearTimeout(tFocoPP); tFocoPP = setTimeout(quitarFocoPP, 6000);
  }, p.tab ? 250 : 30);
}
function ponerFocoPP(){
  const f = $('ppFoco'), r = focoPP && focoPP(); if (!r){ f.hidden = true; return; }
  f.hidden = false;
  Object.assign(f.style, { left:(r.left - 6) + 'px', top:(r.top - 6) + 'px', width:(r.width + 12) + 'px', height:(r.height + 12) + 'px' });
}
window.addEventListener('resize', () => { if (focoPP) ponerFocoPP(); });
// Lo que hace avanzar cada paso
document.addEventListener('click', e => {
  if (!PP.activo || !e.target.closest) return;
  const t = e.target;
  if (t.closest('.tarjetaPl')) setTimeout(() => hechoPP('plantilla'), 600);
  if (t.closest('#mExportar button') && !/cerrar|cancelar/i.test(t.textContent || '')) setTimeout(() => hechoPP('exportar'), 300);
  if (t.closest('#tElementos, #tFormas, #tTexto, #tImagenes, #tDiagramas') && t.closest('button, img, .forma, .icoBanco, svg')){
    const antes = canvas.getObjects().length;
    setTimeout(() => { if (canvas.getObjects().length > antes) hechoPP('agregar'); }, 900);
  }
  if (t.closest('#props, #popRapido') && t.closest('.sw, .swatch, [data-color]')) setTimeout(() => hechoPP('color'), 200);
}, true);
document.addEventListener('input', e => {
  if (!PP.activo) return;
  if (e.target.type === 'color' && e.target.closest('#props, #accMovil, #popRapido')) hechoPP('color');
  if (e.target.id === 'pContenido') hechoPP('texto');
}, true);
canvas.on('text:changed', () => hechoPP('texto'));
canvas.on('object:modified', e => { if (e && e.e && e.target && !e.target.isEditing) hechoPP('mover'); });
canvas.on('object:moving', () => { if (focoPP) quitarFocoPP(); });
if (PP.activo) setTimeout(pintarPP, 1200);

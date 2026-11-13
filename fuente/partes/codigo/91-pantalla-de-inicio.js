/* =========================================================
   PANTALLA DE INICIO: «¿Qué quieres crear hoy?»
   Aparece al abrir la app sin diseño y al empezar uno nuevo. Busca plantillas escribiendo o
   dictando con la voz, elige un tamaño mirando su forma real y llega a lo más usado en un toque.
   ========================================================= */
const INICIO_IDEAS = ['Tarea', 'Mapa mental', 'Cartel escolar', 'Línea del tiempo', 'Presentación', 'Portada', 'Menú', 'Lona', 'Sublimación'];
// [título, detalle, ancho, alto, cm (medida real) o null]
const INICIO_FORMATOS = [
  ['Publicación', 'Cuadrada 1080 × 1080', 1080, 1080, null],
  ['Historia o reel', 'Vertical 1080 × 1920', 1080, 1920, null],
  ['Presentación', 'Horizontal 16:9', 1920, 1080, null],
  ['Hoja carta', 'Tareas e impresos', 21.59, 27.94, 'impresion'],
  ['Lona 2 × 1 m', 'Lista para imprenta', 200, 100, 'lona'],
  ['Taza 11 oz', 'Sublimación', 20, 9.5, 'sublimacion']
];
const INICIO_ATAJOS = [
  ['📂', 'Abrir un diseño', 'Los que guardaste o un archivo', () => { abrirModal('mProyectos'); if (typeof listar === 'function') listar(); }],
  ['🎓', 'Mi escuela', 'Grupos, tareas y entregas', () => typeof abrirEscuela === 'function' ? abrirEscuela() : abrirInicioPestana('tPlantillas')],
  ['🧠', 'Mapa mental', 'Ideas conectadas en minutos', () => abrirInicioPestana('tDiagramas')],
  ['🪄', 'Quitar fondo', 'De una foto, con un toque', () => abrirInicioPestana('tImagenes')],
  ['🔳', 'Código QR', 'Para carteles e invitaciones', () => abrirInicioPestana('tElementos')],
  ['🎬', 'Video', 'Reels y videos con tu diseño', () => { if (typeof irAlEstudioEV === 'function') irAlEstudioEV(); }]
];
function abrirInicioPestana(id){
  const b = document.querySelector(`#pestanas button[data-tab="${id}"]`);
  if (!b) return;
  if (!b.classList.contains('activa') || !$('lateral').classList.contains('abierto')) b.click();
}
function inicioSilueta(w, h){
  const k = 46 / Math.max(w, h);
  return `<span class="inSil" aria-hidden="true"><i style="width:${Math.max(10, Math.round(w * k))}px;height:${Math.max(10, Math.round(h * k))}px"></i></span>`;
}
(function(){
  const d = document.createElement('div'); d.id = 'inicioApp'; d.hidden = true;
  d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'inTitulo');
  const voz = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  d.innerHTML = `<div class="inCaja">
    <button class="inCerrar" id="inCerrar" aria-label="Cerrar e ir al lienzo" title="Ir al lienzo">✕</button>
    <section class="inHeroe">
      <h2 id="inTitulo">¿Qué quieres crear hoy?</h2>
      <p>Escribe ${voz ? 'o dicta ' : ''}lo que necesitas y te mostramos diseños listos para cambiar a tu gusto.</p>
      <form class="inBusca" id="inForm" role="search">
        <input id="inTexto" type="search" placeholder="Ej.: tarea de ciencias, línea del tiempo, menú…" aria-label="¿Qué quieres crear?" autocomplete="off" enterkeyhint="search">
        ${voz ? '<button type="button" class="inVoz" id="inVoz" aria-label="Dictar con la voz" title="Dictar con la voz">🎙</button>' : ''}
        <button type="submit" class="inIr">Buscar</button>
      </form>
      <div class="inIdeas" aria-label="Ideas">${INICIO_IDEAS.map(t => `<button type="button" data-idea="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    </section>
    <section aria-labelledby="inTitTam">
      <h3 id="inTitTam">O empieza en blanco con un tamaño</h3>
      <div class="inFormatos">${INICIO_FORMATOS.map(([t, s, w, h], i) => `<button type="button" class="inFormato" data-fmt="${i}">${inicioSilueta(w, h)}<b>${esc(t)}</b><small>${esc(s)}</small></button>`).join('')}
        <button type="button" class="inFormato" id="inOtro"><span class="inSil" aria-hidden="true"><i class="otro">⋯</i></span><b>Otro tamaño</b><small>Redes, lonas, playeras…</small></button></div>
    </section>
    <section aria-labelledby="inTitAt">
      <h3 id="inTitAt">Lo más usado</h3>
      <div class="inAtajos">${INICIO_ATAJOS.map(([ico, t, s], i) => `<button type="button" data-at="${i}"><span class="inIco" aria-hidden="true">${ico}</span><span><b>${esc(t)}</b><small>${esc(s)}</small></span></button>`).join('')}</div>
    </section>
    <footer class="inPie">
      <button type="button" class="inLink" id="inPasos">🚀 ¿Primera vez? Te guío paso a paso</button>
      <button type="button" class="inLink" id="inLetras" aria-pressed="false">Aa Letras grandes</button>
      <button type="button" class="inBlanco" id="inBlanco">Ir al lienzo →</button>
    </footer>
  </div>`;
  document.body.appendChild(d);
  const texto = $('inTexto');
  const buscar = q => {
    q = String(q || '').trim(); cerrarInicio();
    abrirInicioPestana('tPlantillas');
    const todas = [...document.querySelectorAll('#chipsCat .chip')].find(c => /todas/i.test(c.textContent));
    if (todas && !todas.classList.contains('on')) todas.click();
    $('buscarPlantilla').value = q; renderCatalogo();
    // que se vean los resultados, no la lista de categorías
    setTimeout(() => { const c = $('catalogo'); if (c && c.firstElementChild) c.scrollIntoView({ block:'start', behavior:'smooth' }); }, 80);
  };
  $('inForm').onsubmit = e => { e.preventDefault(); buscar(texto.value); };
  d.querySelectorAll('[data-idea]').forEach(b => b.onclick = () => buscar(b.dataset.idea));
  d.querySelectorAll('[data-fmt]').forEach(b => b.onclick = () => {
    const [t, , w, h, tipo] = INICIO_FORMATOS[+b.dataset.fmt];
    cerrarInicio();
    if (tipo) aplicarTamanoFisico(w, h, tipo === 'sublimacion' ? 'impresion' : tipo);
    else { aplicarTamano(w, h); medidaReal = null; if (typeof pintarMedida === 'function') pintarMedida(); toast('Listo: ' + t + ' de ' + w + ' × ' + h); }
    abrirInicioPestana('tTexto');
  });
  $('inOtro').onclick = () => { cerrarInicio(); abrirModal('mTamano'); };
  d.querySelectorAll('[data-at]').forEach(b => b.onclick = () => { cerrarInicio(); INICIO_ATAJOS[+b.dataset.at][3](); });
  $('inPasos').onclick = () => { cerrarInicio(); iniciarPrimerosPasos(true); };
  $('inLetras').onclick = () => { const on = !document.documentElement.classList.contains('letraGrande'); ponerLetrasGrandes(on); $('inLetras').setAttribute('aria-pressed', on ? 'true' : 'false'); };
  $('inBlanco').onclick = $('inCerrar').onclick = () => cerrarInicio();
  d.addEventListener('click', e => { if (e.target === d) cerrarInicio(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !d.hidden){ e.preventDefault(); e.stopPropagation(); cerrarInicio(); } }, true);
  d.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;          // el foco se queda dentro de la ventana
    const bs = [...d.querySelectorAll('button,input')].filter(x => x.offsetParent);
    const i = bs.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0){ e.preventDefault(); bs[bs.length - 1].focus(); }
    else if (!e.shiftKey && i === bs.length - 1){ e.preventDefault(); bs[0].focus(); }
  });
  // dictado con la voz (Chrome, Edge, Safari y la mayoría de celulares)
  if (voz){
    let rec = null;
    $('inVoz').onclick = () => {
      if (rec){ rec.stop(); return; }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      rec = new SR(); rec.lang = 'es-MX'; rec.interimResults = true; rec.maxAlternatives = 1;
      const b = $('inVoz'); b.classList.add('oyendo'); b.setAttribute('aria-label', 'Escuchando… toca para terminar');
      texto.placeholder = 'Te escucho… di qué quieres crear';
      let final = '';
      rec.onresult = e => { final = [...e.results].map(r => r[0].transcript).join(' '); texto.value = final; };
      rec.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Permite el micrófono para dictar, o escribe lo que necesitas'); };
      rec.onend = () => {
        rec = null; b.classList.remove('oyendo'); b.setAttribute('aria-label', 'Dictar con la voz');
        texto.placeholder = 'Ej.: tarea de ciencias, línea del tiempo, menú…';
        if (final.trim()) buscar(final.replace(/[.¿?¡!]+$/g, ''));
      };
      try { rec.start(); } catch (e) { rec = null; b.classList.remove('oyendo'); }
    };
  }
  // «Inicio» en el menú Archivo y al tocar el logo
  const bi = document.createElement('button'); bi.className = 'tb'; bi.id = 'bInicio'; bi.type = 'button';
  bi.textContent = '🏠 Inicio'; bi.title = 'Ver la pantalla de inicio';
  bi.onclick = () => abrirInicio();
  const mp = $('maPrincipal'); if (mp) mp.prepend(bi);
  const logo = document.querySelector('#barra .logo');
  if (logo){ logo.style.cursor = 'pointer'; logo.title = 'Inicio'; logo.addEventListener('click', () => abrirInicio()); }
})();
function esTelInicio(){ return matchMedia('(max-width: 820px)').matches; }
let focoAntesInicio = null;
function abrirInicio(){
  const d = $('inicioApp'); if (!d || !d.hidden) return;
  focoAntesInicio = document.activeElement;
  document.querySelectorAll('.modal.abierto').forEach(m => m.classList.remove('abierto'));
  if (typeof cerrarMenuArchivo === 'function') cerrarMenuArchivo();
  $('inTexto').value = '';
  $('inLetras').setAttribute('aria-pressed', document.documentElement.classList.contains('letraGrande') ? 'true' : 'false');
  d.hidden = false; document.body.classList.add('conInicio', 'inicioVisto');
  if (!esTelInicio()) setTimeout(() => $('inTexto').focus(), 30); else setTimeout(() => $('inCerrar').focus({ preventScroll:true }), 30);
}
function cerrarInicio(){
  const d = $('inicioApp'); if (!d || d.hidden) return;
  d.hidden = true; document.body.classList.remove('conInicio');
  try { localStorage.setItem('disenador_recorrido', '1'); } catch (e) {}   // ya no hace falta el aviso de «¿Primera vez aquí?»
  if (focoAntesInicio && focoAntesInicio.focus && document.contains(focoAntesInicio)) focoAntesInicio.focus({ preventScroll:true });
}
// al empezar un diseño nuevo, se ofrece elegir qué crear
{ const antes = nuevoDiseno; nuevoDiseno = function(){ const r = antes.apply(this, arguments); if (!canvas.getObjects().length && paginas.length <= 1) abrirInicio(); return r; }; }
// al abrir la app sin diseño (ni enlace a otro diseño, equipo o grupo)
setTimeout(() => {
  if (location.search.length > 1) return;   // llegó por un enlace (diseño compartido, equipo, grupo, aviso…)
  if (document.querySelector('.modal.abierto') || ($('presentacion') && $('presentacion').classList.contains('abierta'))) return;
  if (!canvas.getObjects().length && paginas.length <= 1) abrirInicio();
}, 1200);

/* =========================================================
   PÁGINA DE INICIO (antes de entrar al diseñador)
   Una página completa, no una ventana encima del editor: buscar escribiendo o con la voz,
   todas las plantillas con su vista previa por categoría, tamaños en blanco y lo más usado.
   ========================================================= */
const INICIO_IDEAS = ['Tarea', 'Mapa mental', 'Cartel escolar', 'Línea del tiempo', 'Presentación', 'Portada', 'Menú', 'Lona', 'Sublimación'];
// [título, detalle, ancho, alto, tipo de medida real o null (píxeles)]
const INICIO_FORMATOS = [
  ['Publicación', '1080 × 1080', 1080, 1080, null],
  ['Historia o reel', '1080 × 1920', 1080, 1920, null],
  ['Presentación', '16:9', 1920, 1080, null],
  ['Hoja carta', 'Tareas e impresos', 21.59, 27.94, 'impresion'],
  ['Lona 2 × 1 m', 'Para imprenta', 200, 100, 'lona'],
  ['Taza 11 oz', 'Sublimación', 20, 9.5, 'impresion']
];
const INICIO_ATAJOS = [
  ['🧠', 'Mapa mental', () => abrirInicioPestana('tDiagramas')],
  ['🪄', 'Quitar fondo', () => abrirInicioPestana('tImagenes')],
  ['🔳', 'Código QR', () => abrirInicioPestana('tElementos')],
  ['🎬', 'Video', () => { if (typeof irAlEstudioEV === 'function') irAlEstudioEV(); }],
  ['📉', 'Reducir un PDF', () => abrirReducirPDF()]
];
// orden y nombre con dibujito de cada categoría en la página de inicio
const INICIO_CATS = [
  ['Mis plantillas', '★'], ['Carteles escolares', '📣'], ['Actividades escolares', '📚'], ['Presentaciones', '▶'], ['Mapas conceptuales y mentales', '🧠'],
  ['Esquemas y líneas de tiempo', '🕒'], ['Ciencias y matemáticas', '🔬'], ['Portadas, carteles y redes', '🖼'], ['Infografías y fotos', '📌'],
  ['Lonas y sublimación', '🖨'], ['Negocio y redes', '🛍'], ['Logos y tarjetas', '🪪'], ['Derecho', '⚖'], ['Tablas y cuadros', '📊'],
  ['Procesos y análisis', '🔁'], ['Neón y tecnología', '✨'], ['Web, apps y sistemas', '🖥']
];
function categoriasInicio(){
  const conocidas = INICIO_CATS.map(c => c[0]);
  return [...INICIO_CATS.filter(([c]) => CATEGORIAS.includes(c)), ...CATEGORIAS.filter(c => !conocidas.includes(c)).map(c => [c, '•'])]
    .filter(([c]) => CATALOGO.some(it => it.cat === c));
}
function abrirInicioPestana(id){
  const b = document.querySelector(`#pestanas button[data-tab="${id}"]`);
  if (!b) return;
  if (!b.classList.contains('activa') || !$('lateral').classList.contains('abierto')) b.click();
}
function inicioSilueta(w, h){
  const k = 40 / Math.max(w, h);
  return `<span class="inSil" aria-hidden="true"><i style="width:${Math.max(9, Math.round(w * k))}px;height:${Math.max(9, Math.round(h * k))}px"></i></span>`;
}
function hayDisenoInicio(){ return canvas.getObjects().length > 0 || paginas.length > 1; }
// deja el diseño en blanco sin preguntar (ya se preguntó antes)
function disenoEnBlanco(){
  enDrive = false; setTimeout(() => indicadorGuardado('nuevo'), 50);
  restaurando = true; canvas.clear(); canvas.backgroundColor = '#ffffff'; restaurando = false;
  $('nombreDiseno').value = 'Mi diseño'; historial = []; hi = -1;
  paginas = [null]; actual = 0; miniaturas = []; notaPagina = ''; mostrarNotas();
  medidaReal = null; if (typeof pintarMedida === 'function') pintarMedida();
  canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado();
}
function empezarNuevoInicio(que){
  if (!hayDisenoInicio()) return true;
  const nom = ($('nombreDiseno').value || 'Mi diseño').trim();
  if (!confirm(`Vas a empezar ${que}.\n\nTu diseño «${nom}» se va a cambiar. Si lo quieres conservar, toca «Cancelar», luego «Seguir con mi diseño» y guárdalo.`)) return false;
  disenoEnBlanco(); return true;
}
(function(){
  const d = document.createElement('div'); d.id = 'inicioApp'; d.hidden = true;
  d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'inTitulo');
  const voz = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const logo = document.querySelector('#barra .logoImg');
  d.innerHTML = `<header class="inCab">
      <div class="inMarca">${logo ? `<img src="${logo.src}" alt="">` : ''}<span><b>Diseñador</b><small>APIK-DESING</small></span></div>
      <div class="inModos" role="group" aria-label="Cómo quieres ver el Diseñador">
        <button type="button" data-modo="sencillo" title="Lo básico, botones grandes y ayuda paso a paso">😊 <span>Sencillo</span></button>
        <button type="button" data-modo="completo" title="Todas las herramientas, para quien ya diseña">🎨 <span>Completo</span></button>
      </div>
      <nav class="inNav" aria-label="Accesos">
        <button type="button" id="inAbrir">📂 <span>Abrir</span></button>
        <button type="button" id="inEscuela" hidden>🎓 <span>Mi escuela</span></button>
        <button type="button" class="inEntrar" id="inEntrar">Ir al diseñador →</button>
      </nav>
    </header>
    <main class="inCuerpo">
      <section class="inHeroe">
        <div class="inHeroeTxt">
          <h1 id="inTitulo">¿Qué quieres crear hoy?</h1>
          <p>Escribe ${voz ? 'o dicta ' : ''}lo que necesitas y elige un diseño listo para cambiar a tu gusto.</p>
          <form class="inBusca" id="inForm" role="search">
            <input id="inTexto" type="search" placeholder="Ej.: tarea de ciencias, línea del tiempo, menú…" aria-label="¿Qué quieres crear?" autocomplete="off" enterkeyhint="search">
            ${voz ? '<button type="button" class="inVoz" id="inVoz" aria-label="Dictar con la voz" title="Dictar con la voz">🎙</button>' : ''}
            <button type="submit" class="inIr">Buscar</button>
          </form>
          <div class="inIdeas" aria-label="Ideas">${INICIO_IDEAS.map(t => `<button type="button" data-idea="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        </div>
        <div class="inSeguir" id="inSeguir" hidden>
          <span class="inEtq">Tu último diseño</span>
          <div class="inSeguirMini"><img id="inSeguirImg" alt=""></div>
          <b id="inSeguirNom"></b>
          <button type="button" class="inEntrar" id="inSeguirBtn">✏ Seguir con mi diseño</button>
        </div>
      </section>
      <section class="inFila" aria-labelledby="inTitTam">
        <h2 id="inTitTam">Empieza en blanco</h2>
        <div class="inFormatos">${INICIO_FORMATOS.map(([t, s, w, h], i) => `<button type="button" class="inFormato" data-fmt="${i}">${inicioSilueta(w, h)}<span><b>${esc(t)}</b><small>${esc(s)}</small></span></button>`).join('')}
          <button type="button" class="inFormato" id="inOtro"><span class="inSil" aria-hidden="true"><i class="otro">⋯</i></span><span><b>Otro tamaño</b><small>Tú eliges</small></span></button></div>
        <div class="inAtajos"><span>O ve directo a:</span>${INICIO_ATAJOS.map(([ico, t], i) => `<button type="button" data-at="${i}">${ico} ${esc(t)}</button>`).join('')}</div>
      </section>
      <section class="inGaleria" aria-labelledby="inTitPl">
        <div class="inGalCab">
          <h2 id="inTitPl">Plantillas</h2>
          <span id="inCuenta" class="inCuenta" aria-live="polite"></span>
        </div>
        <div class="inCats" id="inCats" role="group" aria-label="Categorías"></div>
        <div id="inLista"></div>
      </section>
      <footer class="inPie">
        <button type="button" class="inLink" id="inPasos">🚀 ¿Primera vez? Te guío paso a paso</button>
        <button type="button" class="inLink" id="inLetras" aria-pressed="false">Aa Letras grandes</button>
      </footer>
    </main>`;
  document.body.appendChild(d);
  const texto = $('inTexto');
  let cat = 'Todas', consulta = '';
  // ---------- galería ----------
  const tarjeta = it => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'inTpl'; b.title = it.nombre;
    const [w, h] = it.tam || [1080, 1080];
    b.innerHTML = `<span class="inTplMini" style="--ar:${(w / h).toFixed(3)}">${it.vista ? `<img src="${it.vista}" alt="" loading="lazy">` : '<i class="inCargando" aria-hidden="true"></i>'}</span><span class="inTplNom">${esc(it.nombre)}</span>`;
    b.onclick = () => usarPlantillaInicio(it);
    if (!it.vista){ it.botonInicio = b; pedirVista(it, b); }
    return b;
  };
  function pintarGaleria(){
    const lista = $('inLista'); lista.innerHTML = '';
    const palabras = palabrasBusquedaCatalogo(consulta);
    const cats = categoriasInicio();
    $('inCats').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.cat === cat ? 'true' : 'false'));
    if (cat === 'Todas' && !palabras.length){
      let total = 0;
      cats.forEach(([c, ico]) => {
        const items = CATALOGO.filter(it => it.cat === c); if (!items.length) return; total += items.length;
        const s = document.createElement('div'); s.className = 'inGrupo';
        s.innerHTML = `<div class="inGrupoCab"><h3>${ico} ${esc(c)}</h3>${items.length > 6 ? `<button type="button" class="inVerTodas">Ver las ${items.length} →</button>` : ''}</div>`;
        const g = document.createElement('div'); g.className = 'inRejilla inUna'; items.slice(0, 6).forEach(it => g.appendChild(tarjeta(it)));
        s.appendChild(g); lista.appendChild(s);
        const v = s.querySelector('.inVerTodas'); if (v) v.onclick = () => { cat = c; pintarGaleria(); $('inCats').scrollIntoView({ block:'start', behavior:'smooth' }); };
      });
      $('inCuenta').textContent = total + ' diseños para empezar';
      return;
    }
    const items = CATALOGO.filter(it => (cat === 'Todas' || it.cat === cat) && coincideBusquedaCatalogo(it, palabras));
    $('inCuenta').textContent = consulta ? `${items.length} ${items.length === 1 ? 'resultado' : 'resultados'} para «${consulta}»` : `${items.length} diseños`;
    if (!items.length){
      lista.innerHTML = `<div class="inVacio"><p>No encontramos «${esc(consulta)}». Prueba con otra palabra, como <b>tarea</b>, <b>cartel</b> o <b>mapa</b>, o empieza en blanco.</p></div>`;
      return;
    }
    const g = document.createElement('div'); g.className = 'inRejilla'; items.forEach(it => g.appendChild(tarjeta(it))); lista.appendChild(g);
  }
  function pintarCats(){
    const cats = [['Todas', '⭐'], ...categoriasInicio()];
    $('inCats').innerHTML = cats.map(([c, ico]) => `<button type="button" data-cat="${esc(c)}">${c === 'Todas' ? 'Todas' : ico + ' ' + esc(c)}</button>`).join('');
    $('inCats').querySelectorAll('button').forEach(x => x.onclick = () => { cat = x.dataset.cat; pintarGaleria(); });
  }
  window.repintarInicio = () => { pintarCats(); pintarGaleria(); };
  const buscar = (q, bajar) => {
    consulta = String(q || '').trim(); texto.value = consulta; cat = 'Todas'; pintarGaleria();
    if (bajar) document.querySelector('#inicioApp .inGaleria').scrollIntoView({ block:'start', behavior:'smooth' });
  };
  let espera = 0;
  texto.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => buscar(texto.value, false), 250); });
  $('inForm').onsubmit = e => { e.preventDefault(); buscar(texto.value, true); };
  d.querySelectorAll('[data-idea]').forEach(b => b.onclick = () => buscar(b.dataset.idea, true));
  // ---------- en blanco, atajos y botones de arriba ----------
  d.querySelectorAll('[data-fmt]').forEach(b => b.onclick = () => {
    const [t, , w, h, tipo] = INICIO_FORMATOS[+b.dataset.fmt];
    if (!empezarNuevoInicio('un diseño en blanco (' + t + ')')) return;
    cerrarInicio();
    if (tipo) aplicarTamanoFisico(w, h, tipo);
    else { aplicarTamano(w, h); toast('Listo: ' + t + ' de ' + w + ' × ' + h + ' px'); }
    abrirInicioPestana('tTexto');
  });
  $('inOtro').onclick = () => { if (!empezarNuevoInicio('un diseño en blanco')) return; cerrarInicio(); abrirModal('mTamano'); };
  d.querySelectorAll('[data-at]').forEach(b => b.onclick = () => { cerrarInicio(); INICIO_ATAJOS[+b.dataset.at][2](); });
  $('inAbrir').onclick = () => { cerrarInicio(); abrirModal('mProyectos'); if (typeof listar === 'function') listar(); };
  $('inEscuela').onclick = () => { cerrarInicio(); if (typeof abrirEscuela === 'function') abrirEscuela(); };
  $('inEntrar').onclick = $('inSeguirBtn').onclick = () => cerrarInicio();
  $('inPasos').onclick = () => { cerrarInicio(); iniciarPrimerosPasos(true); };
  $('inLetras').onclick = () => { const on = !document.documentElement.classList.contains('letraGrande'); ponerLetrasGrandes(on); $('inLetras').setAttribute('aria-pressed', on ? 'true' : 'false'); };
  d.querySelectorAll('.inModos [data-modo]').forEach(x => x.onclick = () => { if (typeof ponerModo === 'function') ponerModo(x.dataset.modo); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !d.hidden && !document.querySelector('.modal.abierto')){ e.preventDefault(); e.stopPropagation(); cerrarInicio(); }
  }, true);
  // ---------- dictado con la voz (Chrome, Edge, Safari y la mayoría de celulares) ----------
  if (voz){
    let rec = null;
    $('inVoz').onclick = () => {
      if (rec){ rec.stop(); return; }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      rec = new SR(); rec.lang = 'es-MX'; rec.interimResults = true; rec.maxAlternatives = 1;
      const b = $('inVoz'); b.classList.add('oyendo'); b.setAttribute('aria-label', 'Escuchando… toca para terminar');
      const ph = texto.placeholder; texto.placeholder = 'Te escucho… di qué quieres crear';
      let final = '';
      rec.onresult = e => { final = [...e.results].map(r => r[0].transcript).join(' '); texto.value = final; };
      rec.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Permite el micrófono para dictar, o escribe lo que necesitas'); };
      rec.onend = () => {
        rec = null; b.classList.remove('oyendo'); b.setAttribute('aria-label', 'Dictar con la voz'); texto.placeholder = ph;
        if (final.trim()) buscar(final.replace(/[.¿?¡!]+$/g, ''), true);
      };
      try { rec.start(); } catch (e) { rec = null; b.classList.remove('oyendo'); }
    };
  }
  // ---------- «Inicio» en el menú Archivo y al tocar el logo ----------
  const bi = document.createElement('button'); bi.className = 'tb'; bi.id = 'bInicio'; bi.type = 'button';
  bi.textContent = '🏠 Inicio'; bi.title = 'Ir a la página de inicio';
  bi.onclick = () => abrirInicio();
  const mp = $('maPrincipal'); if (mp) mp.prepend(bi);
  const lg = document.querySelector('#barra .logo');
  if (lg){ lg.style.cursor = 'pointer'; lg.title = 'Inicio'; lg.addEventListener('click', () => abrirInicio()); }
})();
function usarPlantillaInicio(it){
  if (!empezarNuevoInicio('un diseño nuevo con «' + it.nombre + '»')) return;
  cerrarInicio();
  it.usar();
  if (typeof modoSencillo === 'function' && modoSencillo()) setTimeout(() => toast('👆 Toca lo que quieras cambiar. Toca dos veces un texto para escribir.'), 900);
}
let focoAntesInicio = null;
// «Seguir con mi diseño» si hay algo hecho (el último diseño se carga solo al abrir la app)
function actualizarSeguirInicio(){
  const hay = hayDisenoInicio(); $('inSeguir').hidden = !hay;
  $('inicioApp').classList.toggle('conSeguir', hay);
  if (!hay) return;
  $('inSeguirNom').textContent = ($('nombreDiseno').value || 'Mi diseño').trim();
  try { miniDeJSON(jsonPagina(), u => { $('inSeguirImg').src = u; }); } catch (e) {}
}
function abrirInicio(){
  const d = $('inicioApp'); if (!d || !d.hidden) return;
  focoAntesInicio = document.activeElement;
  document.querySelectorAll('.modal.abierto').forEach(m => m.classList.remove('abierto'));
  if (typeof cerrarMenuArchivo === 'function') cerrarMenuArchivo();
  $('inTexto').value = '';
  $('inLetras').setAttribute('aria-pressed', document.documentElement.classList.contains('letraGrande') ? 'true' : 'false');
  actualizarSeguirInicio();
  $('inEscuela').hidden = typeof abrirEscuela !== 'function';
  repintarInicio();
  d.hidden = false; d.scrollTop = 0; document.body.classList.add('conInicio', 'inicioVisto');
  setTimeout(() => (matchMedia('(max-width: 820px)').matches ? $('inEntrar') : $('inTexto')).focus({ preventScroll:true }), 30);
}
function cerrarInicio(){
  const d = $('inicioApp'); if (!d || d.hidden) return;
  d.hidden = true; document.body.classList.remove('conInicio');
  try { localStorage.setItem('disenador_recorrido', '1'); } catch (e) {}   // ya no hace falta el aviso de «¿Primera vez aquí?»
  if (focoAntesInicio && focoAntesInicio.focus && document.contains(focoAntesInicio)) focoAntesInicio.focus({ preventScroll:true });
}
// «Nuevo» lleva a la página de inicio para elegir qué crear
{ const antes = nuevoDiseno; nuevoDiseno = function(){ const r = antes.apply(this, arguments); if (!hayDisenoInicio()) abrirInicio(); return r; }; }
// la app siempre abre en la página de inicio (salvo si se llegó por un enlace a un diseño, equipo, grupo o aviso)
setTimeout(() => {
  if (location.search.length > 1) return;
  if (document.querySelector('.modal.abierto') || ($('presentacion') && $('presentacion').classList.contains('abierta'))) return;
  abrirInicio();
  setTimeout(() => { if (!$('inicioApp').hidden) actualizarSeguirInicio(); }, 2200);
}, 900);

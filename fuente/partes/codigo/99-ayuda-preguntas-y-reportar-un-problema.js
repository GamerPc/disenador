/* =========================================================
   AYUDA: PREGUNTAS FRECUENTES Y «REPORTAR UN PROBLEMA»
   - Preguntas con respuesta corta y, cuando se puede, un botón «Muéstrame» que lo hace.
   - Reportar: la persona cuenta qué pasó y se arma un mensaje con la versión, el equipo,
     los últimos errores y (si quiere) una imagen del diseño. Se manda por correo o se
     comparte (en el celular, la imagen va adjunta). No se sube nada a ningún servidor.
   Se abre desde la página de inicio, Archivo, el buscador de herramientas y con F1.
   ========================================================= */
Object.assign(ICONOS_UI, {
  pregunta:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01',
  bicho:'M8 8V6a4 4 0 0 1 8 0v2M6 10h12v4a6 6 0 0 1-12 0zM12 10v10M3 12h3M18 12h3M4 18l3-2M20 18l-3-2M4 6l3 3M20 6l-3 3',
  correo:'M3 5h18v14H3zM3 6l9 7 9-7'
});
const ERRORES_RECIENTES = [];
addEventListener('error', e => { ERRORES_RECIENTES.push(String((e && e.message) || e).slice(0, 160)); if (ERRORES_RECIENTES.length > 5) ERRORES_RECIENTES.shift(); });
addEventListener('unhandledrejection', e => { const r = e && e.reason; ERRORES_RECIENTES.push(String((r && r.message) || r).slice(0, 160)); if (ERRORES_RECIENTES.length > 5) ERRORES_RECIENTES.shift(); });
const correoAyuda = () => (CONFIG.legal && CONFIG.legal.correo) || 'apik.desing@gmail.com';
const alEditor = f => () => { cerrarModal('mPreguntas'); if (typeof cerrarInicio === 'function') cerrarInicio(); setTimeout(f, 60); };
const PREGUNTAS_AYUDA = [
  { q:'¿De verdad es gratis?', a:'Sí. Todas las herramientas son gratis, sin anuncios y sin marca de agua. Si te sirve, puedes apoyar con una donación (es opcional).' },
  { q:'¿Dónde se guardan mis diseños?', a:'En este navegador, en tu propio equipo: no se suben a internet. Toca <b>Guardar</b> para conservarlo. Si borras los datos del navegador o cambias de equipo, primero descarga una copia con <b>Archivo → Descargar el diseño como archivo</b> y ábrela en el otro con <b>Abrir → Abrir un archivo</b>.',
    t:'Ver mis diseños', f:alEditor(() => { abrirModal('mProyectos'); if (typeof listar === 'function') listar(); }) },
  { q:'¿Cómo lo mando por WhatsApp o lo subo a redes?', a:'Toca <b>Descargar</b> (arriba a la derecha) y elige <b>Para compartir</b>. En el celular se abre directo la ventana para mandarlo; en la computadora se descarga una imagen.',
    t:'Muéstrame', f:alEditor(() => abrirModal('mExportar')) },
  { q:'¿Cómo lo imprimo?', a:'Toca <b>Descargar</b> y elige <b>Para imprimir</b>. Se descarga un PDF con buena calidad: ábrelo y elige «Imprimir».',
    t:'Muéstrame', f:alEditor(() => abrirModal('mExportar')) },
  { q:'Me equivoqué, ¿cómo regreso?', a:'Toca <b>Deshacer</b> (la flecha curva de arriba) o Ctrl+Z. Para regresar varios pasos de golpe abre el <b>Historial</b> y toca el momento al que quieres volver.',
    t:'Abrir el historial', f:alEditor(() => typeof abrirHistorial === 'function' && abrirHistorial()) },
  { q:'¿Cómo cambio un texto en el celular?', a:'Toca el texto una vez y abajo salen botones grandes: <b>Escribir</b> para cambiar las palabras, <b>Color</b>, <b>Letra</b> y <b>Más grande / Más chico</b>. Para moverlo, arrástralo con el dedo.' },
  { q:'¿Cómo le quito el fondo a una foto?', a:'Toca la foto y elige <b>Quitar fondo</b>. La primera vez tarda un poco porque se descarga la herramienta; después funciona incluso sin internet.' },
  { q:'Mi PDF pesa mucho y no lo puedo subir', a:'Usa <b>Reducir un PDF</b>: eliges el archivo y te regresa uno más ligero que se ve igual. Sirve con cualquier PDF, no solo los de aquí.',
    t:'Reducir un PDF', f:alEditor(() => typeof abrirReducirPDF === 'function' && abrirReducirPDF()) },
  { q:'Hay demasiados botones, ¿se puede más fácil?', a:'Sí: elige <b>Modo sencillo</b>. Deja solo lo básico, con botones grandes, nombres escritos y una ayuda que te dice qué hacer en cada paso. Cuando quieras todo, cambia a <b>Modo completo</b>.',
    t:'Poner el modo sencillo', f:() => { cerrarModal('mPreguntas'); if (typeof ponerModo === 'function') ponerModo('sencillo'); } },
  { q:'¿Funciona sin internet?', a:'Sí. Después de abrirlo una vez con internet, sigue funcionando sin conexión. En el celular puedes «Agregarlo a la pantalla de inicio» para abrirlo como una app.' },
  { q:'Soy maestro, ¿cómo uso los grupos?', a:'En <b>Mi escuela</b> creas un grupo y compartes su código con tus alumnos. Ahí dejas actividades, ves quién entregó y pones calificación.',
    t:'Abrir Mi escuela', f:alEditor(() => typeof abrirEscuela === 'function' && abrirEscuela()) },
  { q:'¿Qué pasa con mis datos?', a:'Tus diseños se quedan en tu equipo. Solo si usas Mi escuela o el trabajo en equipo se guarda en la nube lo necesario para compartirlo. Lee el <a href="privacidad.html" target="_blank" rel="noopener">Aviso de privacidad</a>.' }
];
(function(){
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'mPreguntas';
  m.innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="ayTitulo">
    <h3 id="ayTitulo">${svgIcono('pregunta')} Preguntas frecuentes</h3>
    <label class="ayBusca" aria-label="Busca tu duda">${svgIcono('buscar')}<input type="search" id="ayBuscar" placeholder="Escribe tu duda: imprimir, fondo, WhatsApp…" autocomplete="off"></label>
    <div id="ayLista" class="ayLista"></div>
    <p id="ayNada" class="ayNada" hidden>No encontré esa duda. Cuéntanos qué necesitas con «Reportar un problema».</p>
    <div class="acciones"><button class="btnS" id="ayReportar">${svgIcono('bicho')} Reportar un problema</button><button class="btnS" id="ayCerrar">Cerrar</button></div>
  </div>`;
  document.body.appendChild(m);
  const lista = $('ayLista');
  PREGUNTAS_AYUDA.forEach((p, i) => {
    const d = document.createElement('details'); d.className = 'ayPreg'; d.dataset.buscar = sinAcentos((p.q + ' ' + p.a).replace(/<[^>]+>/g, ' ')).toLowerCase();
    d.innerHTML = `<summary>${esc(p.q)}</summary><div class="ayResp"><p>${p.a}</p>${p.t ? `<button type="button" class="btnS ayAccion" data-i="${i}">${esc(p.t)} →</button>` : ''}</div>`;
    lista.appendChild(d);
  });
  lista.querySelectorAll('.ayAccion').forEach(b => b.onclick = () => PREGUNTAS_AYUDA[+b.dataset.i].f());
  $('ayBuscar').oninput = () => {
    const q = sinAcentos($('ayBuscar').value).toLowerCase().trim(), pal = q.split(/\s+/).filter(x => x.length > 2);
    let vistas = 0;
    lista.querySelectorAll('.ayPreg').forEach(d => { const ok = !pal.length || pal.some(w => d.dataset.buscar.includes(w)); d.hidden = !ok; if (ok) vistas++; d.open = !!pal.length && ok && vistas === 1; });
    $('ayNada').hidden = vistas > 0;
  };
  m.addEventListener('click', e => { if (e.target === m) cerrarModal('mPreguntas'); });
  $('ayCerrar').onclick = () => cerrarModal('mPreguntas');
  $('ayReportar').onclick = () => { cerrarModal('mPreguntas'); abrirReporte(); };

  const r = document.createElement('div'); r.className = 'modal'; r.id = 'mReporte';
  r.innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="rpTitulo">
    <h3 id="rpTitulo">${svgIcono('bicho')} Reportar un problema</h3>
    <p class="rpNota">Cuéntanos qué pasó con tus palabras. Lo leemos para arreglarlo.</p>
    <label class="rpCampo" for="rpQue">¿Qué pasó?</label>
    <textarea id="rpQue" rows="4" placeholder="Ej.: toqué «Descargar» y no pasó nada"></textarea>
    <label class="rpCampo" for="rpTipo">Es sobre…</label>
    <select id="rpTipo"><option>Algo no funciona</option><option>No entiendo cómo hacer algo</option><option>Tengo una idea o sugerencia</option><option>Una plantilla tiene un error</option><option>Otra cosa</option></select>
    <label class="rpOpcion"><input type="checkbox" id="rpImagen" checked><span>Incluir una imagen de mi diseño (ayuda a ver el problema)</span></label>
    <label class="rpOpcion"><input type="checkbox" id="rpDatos" checked><span>Incluir datos del equipo (versión, navegador y tamaño de pantalla)</span></label>
    <details class="rpVer"><summary>Ver lo que se va a mandar</summary><pre id="rpVista"></pre></details>
    <p class="rpNota" id="rpAviso" role="status" aria-live="polite"></p>
    <div class="acciones rpAcciones">
      <button class="btnS" id="rpCompartir">${svgIcono('celular')} Compartir</button>
      <button class="btnS" id="rpCopiar">${svgIcono('duplicar')} Copiar</button>
      <button class="btnP" id="rpCorreo">${svgIcono('correo')} Enviar por correo</button>
      <button class="btnS" id="rpCerrar">Cerrar</button>
    </div>
  </div>`;
  document.body.appendChild(r);
  r.addEventListener('click', e => { if (e.target === r) cerrarModal('mReporte'); });
  $('rpCerrar').onclick = () => cerrarModal('mReporte');
  ['rpQue', 'rpTipo', 'rpDatos'].forEach(id => $(id).addEventListener('input', () => { $('rpVista').textContent = textoReporte(); if (id === 'rpQue') $('rpAviso').textContent = ''; }));
  $('rpDatos').addEventListener('change', () => { $('rpVista').textContent = textoReporte(); });
  $('rpCorreo').onclick = async () => {
    if (!revisarReporte()) return;
    const t = textoReporte(), asunto = 'Reporte del Diseñador: ' + $('rpTipo').value;
    if ($('rpImagen').checked){ const b = await imagenReporte(); if (b){ bajarBlob(b, 'reporte-diseno.png'); } }
    location.href = 'mailto:' + correoAyuda() + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(t.slice(0, 1800));
    $('rpAviso').textContent = $('rpImagen').checked ? 'Se abrió tu correo. También se descargó «reporte-diseno.png»: adjúntala al mensaje antes de enviarlo.' : 'Se abrió tu correo con el mensaje listo: solo toca «Enviar».';
    if (typeof hechoPP === 'function') hechoPP('reporte');
  };
  $('rpCompartir').onclick = async () => {
    if (!revisarReporte()) return;
    const t = 'Para: ' + correoAyuda() + '\n\n' + textoReporte(), datos = { title:'Reporte del Diseñador', text:t };
    if ($('rpImagen').checked){ const b = await imagenReporte(); if (b){ const f = new File([b], 'reporte-diseno.png', { type:'image/png' }); if (navigator.canShare && navigator.canShare({ files:[f] })) datos.files = [f]; } }
    try { await navigator.share(datos); $('rpAviso').textContent = '¡Gracias! Si lo mandaste a otra app, envíalo a ' + correoAyuda() + '.'; }
    catch (e) { if (!e || e.name !== 'AbortError') $('rpAviso').textContent = 'Este equipo no deja compartir desde aquí: usa «Enviar por correo» o «Copiar».'; }
  };
  $('rpCopiar').onclick = async () => {
    if (!revisarReporte()) return;
    try { await navigator.clipboard.writeText('Para: ' + correoAyuda() + '\n\n' + textoReporte()); $('rpAviso').textContent = 'Copiado. Pégalo en un correo a ' + correoAyuda() + '.'; }
    catch (e) { document.querySelector('#mReporte .rpVer').open = true; $('rpAviso').textContent = 'No se pudo copiar solo: selecciona el texto de «Ver lo que se va a mandar» y cópialo.'; }
  };
  $('rpCompartir').hidden = !navigator.share;
})();
function revisarReporte(){
  if ($('rpQue').value.trim().length < 3){ $('rpAviso').textContent = 'Escribe primero qué pasó (con pocas palabras basta).'; $('rpQue').focus(); return false; }
  return true;
}
function textoReporte(){
  const L = ['Tipo: ' + $('rpTipo').value, '', $('rpQue').value.trim() || '(sin descripción)'];
  if ($('rpDatos').checked){
    const v = document.querySelector('#barra .ver, .ver'), modo = typeof modoSencillo === 'function' ? (modoSencillo() ? 'sencillo' : 'completo') : '';
    L.push('', '— Datos del equipo —', 'Versión: ' + (v ? v.textContent.trim() : '?') + (modo ? ' · modo ' + modo : ''),
      'Navegador: ' + navigator.userAgent, 'Pantalla: ' + innerWidth + '×' + innerHeight + ' (' + (devicePixelRatio || 1) + 'x)' + (typeof esTactil !== 'undefined' && esTactil ? ' · táctil' : ''),
      'Diseño: ' + W + '×' + H + ' px · ' + paginas.length + ' página(s) · ' + canvas.getObjects().length + ' elementos');
    if (ERRORES_RECIENTES.length) L.push('Errores recientes:', ...ERRORES_RECIENTES.map(x => '  - ' + x));
  }
  return L.join('\n');
}
async function imagenReporte(){
  try { canvas.discardActiveObject(); canvas.requestRenderAll(); const u = canvas.toDataURL({ format:'png', multiplier:Math.min(1, 1200 / Math.max(W, H)) }); return await (await fetch(u)).blob(); }
  catch (e) { return null; }
}
function abrirPreguntas(){
  $('ayBuscar').value = ''; $('ayBuscar').oninput();
  abrirModal('mPreguntas'); setTimeout(() => $('ayBuscar').focus(), 40);
}
function abrirReporte(){
  $('rpAviso').textContent = ''; $('rpVista').textContent = textoReporte();
  abrirModal('mReporte'); setTimeout(() => $('rpQue').focus(), 40);
}
// entradas: página de inicio, menú Archivo y F1
(function(){
  const nav = document.querySelector('#inicioApp .inNav');
  if (nav){ const b = document.createElement('button'); b.type = 'button'; b.id = 'inAyuda'; b.innerHTML = `${svgIcono('pregunta')}<span>Ayuda</span>`; b.title = 'Preguntas frecuentes y reportar un problema';
    b.onclick = () => abrirPreguntas(); nav.insertBefore(b, $('inEntrar')); }
  const mp = $('maPrincipal');
  if (mp){
    const a = document.createElement('button'); a.className = 'tb'; a.type = 'button'; a.id = 'bAyuda'; a.innerHTML = `${svgIcono('pregunta')} Preguntas frecuentes`; a.onclick = () => abrirPreguntas();
    const r = document.createElement('button'); r.className = 'tb'; r.type = 'button'; r.id = 'bReportar'; r.innerHTML = `${svgIcono('bicho')} Reportar un problema`; r.onclick = () => abrirReporte();
    mp.append(a, r);
  }
  const vieja = document.querySelector('#mAyuda .caja h3');
  if (vieja){ const f = document.createElement('div'); f.className = 'filaAyuda ayEnlaces';
    f.innerHTML = `<button type="button" class="btnS" id="ayVerPreguntas">${svgIcono('pregunta')} Preguntas frecuentes</button><button type="button" class="btnS" id="ayVerReporte">${svgIcono('bicho')} Reportar un problema</button>`;
    vieja.after(f);
    $('ayVerPreguntas').onclick = () => { cerrarModal('mAyuda'); abrirPreguntas(); };
    $('ayVerReporte').onclick = () => { cerrarModal('mAyuda'); abrirReporte(); }; }
  document.addEventListener('keydown', e => { if (e.key === 'F1'){ e.preventDefault(); abrirPreguntas(); } });
})();

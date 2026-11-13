/* =========================================================
   MODO SENCILLO Y MODO COMPLETO (para todas las edades)
   Sencillo: solo lo básico, botones con su nombre escrito, palabras fáciles y una ayudita que
   dice qué hacer en cada momento. Completo: todas las herramientas, como siempre.
   ========================================================= */
function modoSencillo(){ return document.documentElement.classList.contains('sencillo'); }
// el modo se elige una vez; quien ya usaba la app sigue en el completo, quien llega nuevo empieza en el sencillo
function modoGuardado(){
  try {
    const m = localStorage.getItem('disenador_modo'); if (m === 'sencillo' || m === 'completo') return m;
    return localStorage.getItem('disenador_borrador') || localStorage.getItem('disenador_recorrido') === '1' ? 'completo' : 'sencillo';
  } catch (e) { return 'completo'; }
}
// palabras más fáciles en el modo sencillo: [qué buscar, texto normal, texto sencillo]
const PALABRAS_SENCILLAS = [
  ['#tabFormas', 'Formas', 'Figuras'], ['#tabImagenes', 'Imágenes', 'Fotos'], ['#tabElementos', 'Íconos', 'Stickers'],
  ['#barra button[onclick*="mExportar"]', 'Exportar', 'Descargar']
];
// nombres que se ven debajo de los botones que solo tienen dibujito
const ETIQUETAS_BR = { fuente:'Letra', color:'Color', bNegrita:'Negrita', bCursiva:'Cursiva', alinear:'Alinear', voltear:'Voltear', todo:'Más', borde:'Borde' };
function ponerModo(m, avisar = true){
  const s = m === 'sencillo';
  document.documentElement.classList.toggle('sencillo', s);
  try { localStorage.setItem('disenador_modo', s ? 'sencillo' : 'completo'); } catch (e) {}
  PALABRAS_SENCILLAS.forEach(([sel, normal, facil]) => {
    const b = document.querySelector(sel); if (!b) return;
    const nodo = [...b.childNodes].reverse().find(n => n.nodeType === 3 && n.textContent.trim());
    if (nodo) nodo.textContent = nodo.textContent.replace(s ? normal : facil, s ? facil : normal);
  });
  const b = $('bModo');
  if (b){ b.innerHTML = s ? '😊<span> Sencillo</span>' : '🎨<span> Completo</span>'; b.title = s ? 'Estás en el modo sencillo. Toca para ver todas las herramientas' : 'Estás en el modo completo. Toca para usar el modo sencillo'; b.setAttribute('aria-pressed', s ? 'true' : 'false'); b.setAttribute('aria-label', b.title); }
  document.querySelectorAll('[data-modo]').forEach(x => x.setAttribute('aria-pressed', x.dataset.modo === (s ? 'sencillo' : 'completo') ? 'true' : 'false'));
  if (s){                                     // en sencillo no se ven las herramientas escondidas: si estabas en una, vuelves a Plantillas
    const act = document.querySelector('#pestanas button.activa');
    if (act && getComputedStyle(act).display === 'none') $('tabPlantillas').click();
  }
  if (typeof construirBarraRapida === 'function' && activo()) construirBarraRapida();
  dispatchEvent(new Event('resize'));
  pintarAyudaS();
  if (avisar) toast(s ? '😊 Modo sencillo: solo lo básico y con ayuda. Puedes volver al completo cuando quieras.' : '🎨 Modo completo: todas las herramientas a la vista.');
}
(function(){
  // botón en la barra de arriba (en la compu) y en el menú Archivo
  const b = document.createElement('button'); b.className = 'tb'; b.id = 'bModo'; b.type = 'button';
  b.onclick = () => ponerModo(modoSencillo() ? 'completo' : 'sencillo');
  const nombre = $('nombreDiseno'); if (nombre) nombre.after(b);
  const vista = $('maVista');
  if (vista){ ['sencillo', 'completo'].forEach(m => { const x = document.createElement('button'); x.className = 'tb'; x.type = 'button'; x.dataset.modo = m;
    x.textContent = m === 'sencillo' ? '😊 Modo sencillo (lo básico, con ayuda)' : '🎨 Modo completo (todas las herramientas)'; x.onclick = () => ponerModo(m); vista.prepend(x); }); }
  // nombres escritos en Deshacer / Rehacer y en la barra que aparece al seleccionar
  [['bDeshacer', 'Deshacer'], ['bRehacer', 'Rehacer']].forEach(([id, t]) => { const x = $(id); if (x){ const s = document.createElement('span'); s.className = 'etqS'; s.textContent = t; x.appendChild(s); } });
  const sel = $('barraSel');
  if (sel) sel.querySelectorAll('button[data-acc]').forEach(x => { const s = document.createElement('span'); s.className = 'etqS'; s.textContent = { duplicar:'Copiar', bloquear:'Fijar', eliminar:'Borrar', mas:'Más' }[x.dataset.acc] || ''; x.appendChild(s); });
  // la barra rápida se arma de nuevo con cada selección: se le ponen sus nombres cada vez
  const br = $('barraRapida');
  if (br) new MutationObserver(() => {
    br.querySelectorAll('button[data-k]').forEach(x => { const t = ETIQUETAS_BR[x.dataset.k]; if (t && !x.querySelector('.etqS')){ const s = document.createElement('span'); s.className = 'etqS'; s.textContent = t; x.appendChild(s); } });
    const tam = br.querySelector('.tamBR'); if (tam && !tam.querySelector('.etqS')){ const s = document.createElement('span'); s.className = 'etqS'; s.textContent = 'Tamaño'; tam.appendChild(s); }
  }).observe(br, { childList:true });
  // la ayudita de abajo
  const a = document.createElement('div'); a.id = 'ayudaS'; a.setAttribute('role', 'status'); a.setAttribute('aria-live', 'polite');
  a.innerHTML = '<span id="ayudaSTexto"></span><button type="button" id="ayudaSCerrar" aria-label="Ocultar la ayuda" title="Ocultar la ayuda">✕</button>';
  const pieN = $('barraNotas'); if (pieN) pieN.prepend(a); else ($('centro') || document.body).appendChild(a);   // abajo, donde no tapa el diseño
  $('ayudaSCerrar').onclick = () => { try { localStorage.setItem('disenador_ayudaS', 'no'); } catch (e) {} pintarAyudaS(); toast('Ayuda oculta. Vuelve a verla en Archivo → «Mostrar la ayuda de cada paso».'); };
  if (vista){ const x = document.createElement('button'); x.className = 'tb'; x.type = 'button'; x.id = 'bAyudaS'; x.textContent = '💡 Mostrar la ayuda de cada paso';
    x.onclick = () => { try { localStorage.removeItem('disenador_ayudaS'); } catch (e) {} pintarAyudaS(); }; vista.appendChild(x); }
  ['selection:created', 'selection:updated', 'selection:cleared', 'text:editing:entered', 'text:editing:exited', 'object:added', 'object:removed', 'path:created', 'mouse:up']
    .forEach(ev => canvas.on(ev, () => setTimeout(pintarAyudaS, 0)));
  ponerModo(modoGuardado(), false);
})();
function textoAyudaS(){
  const o = activo(), tel = matchMedia('(max-width: 820px)').matches;
  if (canvas.isDrawingMode) return '🖍 Dibuja con el dedo o con el ratón. Cuando acabes, toca otra herramienta de la izquierda.';
  if (o && o.isEditing) return '⌨️ Escribe tu texto. Cuando termines, toca afuera, en cualquier parte vacía.';
  if (o){
    if (o.type === 'activeSelection') return '👥 Elegiste varias cosas: muévelas juntas o toca «Agrupar» para que no se separen.';
    if (/text/.test(o.type)) return tel ? '✏️ Toca dos veces el texto para escribir. Con «Editar» cambias la letra y el color.' : '✏️ Toca dos veces el texto para escribir. Arrástralo para moverlo y jala una esquina para hacerlo más grande.';
    if (o.type === 'image') return '🖼 Arrastra la foto para moverla y jala una esquina para cambiar su tamaño. Arriba puedes recortarla o quitarle el fondo.';
    return '🎨 Arrastra para moverlo y jala una esquina para cambiar su tamaño. Arriba cambias el color.';
  }
  if (!canvas.getObjects().length) return tel ? '👇 Para empezar, toca «Plantillas» abajo para elegir un diseño, o «Texto» para escribir.' : '👈 Para empezar, elige una plantilla o toca «Texto» para escribir algo.';
  return '👆 Toca cualquier cosa de tu diseño para cambiarla. ¿Te equivocaste? Toca «Deshacer». Cuando termines, toca «Descargar».';
}
function pintarAyudaS(){
  const a = $('ayudaS'); if (!a) return;
  let oculta = false; try { oculta = localStorage.getItem('disenador_ayudaS') === 'no'; } catch (e) {}
  const ver = modoSencillo() && !oculta && !document.documentElement.classList.contains('enfoque');
  a.hidden = !ver; const b = $('bAyudaS'); if (b) b.hidden = !modoSencillo() || !oculta;
  if (!ver) return;
  const t = textoAyudaS(); if ($('ayudaSTexto').textContent !== t) $('ayudaSTexto').textContent = t;
}

/* =========================================================
   CATÁLOGO DE PLANTILLAS CON VISTA PREVIA
   ========================================================= */
// Dibuja una plantilla en un lienzo invisible y devuelve su miniatura (no toca tu diseño)
function vistaDe(tam, crear){
  const el = document.createElement('canvas');
  const tmp = new fabric.Canvas(el, { width:tam[0], height:tam[1], enableRetinaScaling:false, renderOnAddRemove:false, preserveObjectStacking:true });
  const prev = { canvas, W, H, zoom, restaurando };
  generandoVista = true; canvas = tmp; W = tam[0]; H = tam[1]; zoom = 1; restaurando = true;
  let url = '';
  try {
    tmp.backgroundColor = '#ffffff';
    crear(); ordenarVinculos(); tmp.discardActiveObject(); tmp.renderAll();
    url = tmp.toDataURL({ format:'jpeg', quality:0.85, multiplier: 520 / Math.max(tam[0], tam[1]) });
  } catch (e) { console.warn('No se pudo generar la vista previa', e); }
  finally {
    canvas = prev.canvas; W = prev.W; H = prev.H; zoom = prev.zoom; restaurando = prev.restaurando; generandoVista = false;
    try { tmp.dispose(); } catch(_){}
  }
  return url;
}
// Las miniaturas se dibujan solo cuando su tarjeta se ve en pantalla (antes se hacían todas al abrir y trababan el celular)
let fuentesVistas = null;
function fuentesParaVistas(){   // las letras de las plantillas se bajan la primera vez que hace falta una miniatura
  if (!fuentesVistas) fuentesVistas = Promise.race([
    Promise.all(FUENTES.filter(f => !['Arial','Georgia','Times New Roman','Courier New','Verdana'].includes(f)).flatMap(f => [document.fonts.load(`400 40px "${f}"`), document.fonts.load(`700 40px "${f}"`)])).catch(() => {}),
    new Promise(r => setTimeout(r, 6000))]);
  return fuentesVistas;
}
const colaVistas = [];
let haciendoVistas = false;
const pausaVista = () => new Promise(r => ('requestIdleCallback' in window) ? requestIdleCallback(() => r(), { timeout:400 }) : setTimeout(r, 30));
async function hacerVistas(){
  if (haciendoVistas) return; haciendoVistas = true;
  try {
    await fuentesParaVistas();
    while (colaVistas.length){
      const it = colaVistas.shift();
      if (it.vista || !it.crear) continue;
      await pausaVista();
      it.vista = vistaDe(it.tam, it.crear);
      if (it.boton && it.vista) it.boton.querySelector('.mini').innerHTML = `<img src="${it.vista}" alt="">`;
      if (it.botonInicio && it.vista){ const m = it.botonInicio.querySelector('.inTplMini'); if (m) m.innerHTML = `<img src="${it.vista}" alt="">`; }
    }
  } finally { haciendoVistas = false; }
}
const vigiaVistas = ('IntersectionObserver' in window) ? new IntersectionObserver(ents => {
  ents.forEach(e => {
    if (!e.isIntersecting) return;
    vigiaVistas.unobserve(e.target);
    const it = e.target.__it; if (it && !it.vista && it.crear && !colaVistas.includes(it)) colaVistas.push(it);
  });
  hacerVistas();
}, { rootMargin:'300px 0px' }) : null;
function pedirVista(it, b){
  if (it.vista || !it.crear) return;
  if (vigiaVistas){ b.__it = it; vigiaVistas.observe(b); }
  else { colaVistas.push(it); hacerVistas(); }
}
function generarVistas(){ hacerVistas(); }
const CATALOGO = [];
ORGANIZADORES.forEach(o => CATALOGO.push({ nombre:o.nombre, cat:o.cat, tam:o.tam, crear:o.crear, usar:() => usarOrganizador(o) }));
DIAGRAMAS.forEach((d, i) => CATALOGO.push({ nombre:d.nombre, cat: d.nombre.startsWith('Mapa') ? CAT_MAPAS : CAT_PROC, tam:d.tam, crear:d.crear,
  usar:() => $('listaDiagramas').children[i].click() }));
PLANTILLAS.forEach((p, i) => CATALOGO.push({ nombre:p.nombre, cat:CAT_PORT, tam:p.tam || [1080,1080], crear:p.crear,
  usar:() => $('listaPlantillas').children[i].click() }));
Object.values(TEMAS_PRES).forEach(t => CATALOGO.push({ nombre:t.nombre + ' · ' + DIAPOS.length + ' diapositivas', cat:CAT_PRES, tam:[1920,1080],
  crear:() => DIAPOS[0].crear(t), usar:() => usarPresentacion(t) }));
const CAT_MIAS = 'Mis plantillas';
const CATEGORIAS = [CAT_MIAS, CAT_PRES, CAT_DER, CAT_MAPAS, CAT_TABLAS, CAT_PROC, CAT_INFO, CAT_PORT];
let catActiva = 'Todas';
const sinAcentos = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ALIAS_CATALOGO = {
  'Presentaciones':'diapositiva diapositivas exposición exposicion exponer clase escolar',
  'Actividades escolares':'tarea tareas actividad actividades ejercicio ejercicios escuela escolar alumno alumnos estudiante estudiantes maestro maestros cuestionario examen ficha',
  'Derecho':'legal jurídico juridico abogacía abogacia abogado abogada juicio penal jurisprudencia',
  'Mapas conceptuales y mentales':'mapa mapas mental mentales conceptual conceptuales lluvia ideas concepto conceptos',
  'Tablas y cuadros':'tabla tablas cuadro cuadros comparar comparación comparacion comparativo comparativa',
  'Procesos y análisis':'proceso procesos pasos procedimiento procedimientos análisis analisis flujo esquema',
  'Infografías y fotos':'infografía infografia infografías infografias foto fotos imagen imágenes imagenes datos',
  'Portadas, carteles y redes':'portada portadas tarea trabajo cartel carteles póster poster redes publicación publicacion',
  'Logos y tarjetas':'logo logos tarjeta tarjetas negocio marca presentación presentacion',
  'Negocio y redes':'negocio restaurante menú menu comida cafetería cafeteria venta tienda precio promoción promocion facebook instagram',
  'Web, apps y sistemas':'web página páginaweb sitio sitios app apps aplicación aplicaciones sistema sistemas celular móvil movil',
  'Neón y tecnología':'neón neon tecnología tecnologia futurista gaming gamer',
  'Esquemas y líneas de tiempo':'esquema esquemas línea líneas tiempo cronología cronologia',
  'Ciencias y matemáticas':'ciencia ciencias matemática matemáticas matematica matematicas biología biologia física fisica química quimica',
  'Carteles escolares':'cartel carteles escuela escolar tarea tareas ciencias',
  'Lonas y sublimación':'lona lonas sublimación sublimacion imprenta impresión impresion vinil'
};
const PALABRAS_PUENTE = new Set(['de','del','para','con','por','el','la','las','los','y','un','una','mis','mi','en']);
function palabrasBusquedaCatalogo(consulta){
  return [...new Set(sinAcentos(consulta.trim()).split(/\s+/).filter(p => p && !PALABRAS_PUENTE.has(p)))];
}
function coincideBusquedaCatalogo(it, palabras){
  if (!palabras.length) return true;
  const texto = sinAcentos([it.nombre, it.cat, ALIAS_CATALOGO[it.cat] || ''].join(' '));
  return palabras.every(p => texto.includes(p));
}
function textoEstadoCatalogo(encontrados, consulta, categoria){
  return consulta
    ? `${encontrados} ${encontrados === 1 ? 'resultado' : 'resultados'} para “${consulta}”.`
    : `${encontrados} diseños ${categoria === 'Todas' ? 'disponibles' : 'en esta categoría'}.`;
}
function mostrarCatalogoVacio(cont, consulta){
  const caja = document.createElement('div'); caja.className = 'vacioCatalogo'; caja.setAttribute('role', 'status');
  const mensaje = document.createElement('p'); mensaje.className = 'hint';
  mensaje.textContent = consulta
    ? `No encontramos diseños con “${consulta}”. Prueba con otras palabras o muestra todo el catálogo.`
    : 'Esta categoría no tiene diseños disponibles. Puedes volver a ver todo el catálogo.';
  caja.appendChild(mensaje);
  const limpiar = document.createElement('button'); limpiar.className = 'bigbtn'; limpiar.type = 'button'; limpiar.textContent = 'Borrar búsqueda';
  limpiar.onclick = () => { $('buscarPlantilla').value = ''; renderCatalogo(); $('buscarPlantilla').focus(); };
  caja.appendChild(limpiar);
  const todas = document.createElement('button'); todas.className = 'bigbtn'; todas.type = 'button'; todas.textContent = 'Ver todo el catálogo';
  todas.onclick = () => {
    $('buscarPlantilla').value = ''; catActiva = 'Todas';
    document.querySelectorAll('#chipsCat .chip').forEach((x, i) => { const activa = i === 0; x.classList.toggle('on', activa); x.setAttribute('aria-pressed', activa ? 'true' : 'false'); });
    renderCatalogo(); $('buscarPlantilla').focus();
  };
  caja.appendChild(todas); cont.appendChild(caja);
}
function renderCatalogo(){
  const consulta = $('buscarPlantilla').value.trim(), palabras = palabrasBusquedaCatalogo(consulta);
  const cont = $('catalogo'); cont.innerHTML = '';
  let encontrados = 0;
  CATEGORIAS.forEach(cat => {
    if (catActiva !== 'Todas' && catActiva !== cat) return;
    const items = CATALOGO.filter(it => it.cat === cat && coincideBusquedaCatalogo(it, palabras));
    encontrados += items.length;
    if (!items.length){
      if (cat === CAT_MIAS && !palabras.length && catActiva === CAT_MIAS) cont.innerHTML = '<p class="hint">Aún no tienes plantillas propias. Diseña algo y pulsa “Guardar esta página como mi plantilla”.</p>';
      return;
    }
    const h4 = document.createElement('h4'); h4.textContent = cat; cont.appendChild(h4);
    if (cat === CAT_PRES){
      const bd = document.createElement('button'); bd.className = 'bigbtn'; bd.dataset.queda = '1'; bd.style.textAlign = 'center';
      bd.textContent = '＋ Agregar una diapositiva con diseño'; bd.onclick = abrirDiapositivas; cont.appendChild(bd);
    }
    const grid = document.createElement('div'); grid.className = 'gridPl';
    items.forEach(it => {
      const b = document.createElement('button'); b.className = 'tarjetaPl'; b.title = it.nombre;
      b.innerHTML = `<div class="mini">${it.vista ? `<img src="${it.vista}" alt="">` : 'Preparando…'}</div><span>${esc(it.nombre)}</span>`;
      b.onclick = () => { $('vistaGrande').style.display = 'none'; it.usar(); };
      if (it.borrar){
        const x = document.createElement('span'); x.className = 'borrar'; x.textContent = '✕'; x.title = 'Eliminar mi plantilla';
        x.onclick = ev => { ev.stopPropagation(); it.borrar(); };
        b.appendChild(x);
      }
      b.onmouseenter = () => {
        if (!it.vista) return;
        const vg = $('vistaGrande'), r = b.getBoundingClientRect();
        vg.querySelector('img').src = it.vista; vg.querySelector('div').textContent = it.nombre;
        vg.style.display = 'block';
        vg.style.top = Math.max(10, Math.min(window.innerHeight - vg.offsetHeight - 10, r.top - 40)) + 'px';
      };
      b.onmouseleave = () => { $('vistaGrande').style.display = 'none'; };
      it.boton = b;
      grid.appendChild(b);
      pedirVista(it, b);
    });
    cont.appendChild(grid);
  });
  const estado = $('estadoCatalogo');
  if (estado) estado.textContent = textoEstadoCatalogo(encontrados, consulta, catActiva);
  if (!cont.children.length) mostrarCatalogoVacio(cont, $('buscarPlantilla').value.trim());
}
['Todas', ...CATEGORIAS].forEach(cat => {
  const c = document.createElement('button'); c.className = 'chip' + (cat === 'Todas' ? ' on' : '');
  c.setAttribute('aria-pressed', cat === 'Todas' ? 'true' : 'false');
  c.textContent = cat === CAT_MAPAS ? 'Mapas' : cat === CAT_TABLAS ? 'Tablas' : cat === CAT_PROC ? 'Procesos' : cat === CAT_PORT ? 'Portadas' : cat === CAT_INFO ? 'Infografías' : cat === CAT_MIAS ? '★ Mías' : cat === CAT_PRES ? '▶ Presentaciones' : cat === CAT_DER ? '⚖ Derecho' : cat;
  c.onclick = () => { catActiva = cat; document.querySelectorAll('#chipsCat .chip').forEach(x => { const activa = x === c; x.classList.toggle('on', activa); x.setAttribute('aria-pressed', activa ? 'true' : 'false'); }); renderCatalogo(); };
  $('chipsCat').appendChild(c);
});
const chipsCat = $('chipsCat');
function completarEstadoChips(){ chipsCat.querySelectorAll('.chip').forEach(b => { if (!b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', b.classList.contains('on') ? 'true' : 'false'); }); }
completarEstadoChips();
new MutationObserver(completarEstadoChips).observe(chipsCat, { childList:true });
chipsCat.addEventListener('click', e => {
  const elegida = e.target.closest('.chip'); if (!elegida) return;
  chipsCat.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b === elegida ? 'true' : 'false'));
});
$('buscarPlantilla').addEventListener('input', renderCatalogo);
renderCatalogo();
// Genera las miniaturas poco a poco para no trabar la app


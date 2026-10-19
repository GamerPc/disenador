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
function renderCatalogo(){
  const q = sinAcentos($('buscarPlantilla').value.trim());
  const cont = $('catalogo'); cont.innerHTML = '';
  CATEGORIAS.forEach(cat => {
    if (catActiva !== 'Todas' && catActiva !== cat) return;
    const items = CATALOGO.filter(it => it.cat === cat && (!q || sinAcentos(it.nombre + ' ' + it.cat).includes(q)));
    if (!items.length){
      if (cat === CAT_MIAS && !q && catActiva === CAT_MIAS) cont.innerHTML = '<p class="hint">Aún no tienes plantillas propias. Diseña algo y pulsa “Guardar esta página como mi plantilla”.</p>';
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
    });
    cont.appendChild(grid);
  });
  if (!cont.children.length) cont.innerHTML = '<p class="hint">No hay plantillas con ese nombre.</p>';
}
['Todas', ...CATEGORIAS].forEach(cat => {
  const c = document.createElement('button'); c.className = 'chip' + (cat === 'Todas' ? ' on' : '');
  c.textContent = cat === CAT_MAPAS ? 'Mapas' : cat === CAT_TABLAS ? 'Tablas' : cat === CAT_PROC ? 'Procesos' : cat === CAT_PORT ? 'Portadas' : cat === CAT_INFO ? 'Infografías' : cat === CAT_MIAS ? '★ Mías' : cat === CAT_PRES ? '▶ Presentaciones' : cat === CAT_DER ? '⚖ Derecho' : cat;
  c.onclick = () => { catActiva = cat; document.querySelectorAll('#chipsCat .chip').forEach(x => x.classList.toggle('on', x === c)); renderCatalogo(); };
  $('chipsCat').appendChild(c);
});
$('buscarPlantilla').addEventListener('input', renderCatalogo);
renderCatalogo();
// Genera las miniaturas poco a poco para no trabar la app
async function generarVistas(){
  for (const it of CATALOGO){
    if (it.vista || !it.crear) continue;
    await new Promise(r => setTimeout(r, 25));
    it.vista = vistaDe(it.tam, it.crear);
    if (it.boton && it.vista) it.boton.querySelector('.mini').innerHTML = `<img src="${it.vista}" alt="">`;
  }
}


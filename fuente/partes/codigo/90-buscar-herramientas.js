/* =========================================================
   BÚSQUEDA RÁPIDA DE HERRAMIENTAS Y ACCIONES
   ========================================================= */
const ALIAS_HERRAMIENTAS = {
  tPlantillas:'diseños tareas portadas carteles publicaciones redes presentaciones',
  tTexto:'escribir título subtítulo letras tipografía fuente',
  tFormas:'cuadros círculos líneas flechas figuras',
  tElementos:'iconos íconos stickers qr código barras adornos',
  tDibujar:'pluma dibujo a mano trazo firma',
  tImagenes:'fotos imágenes quitar fondo recortar banco fotos libres',
  tDiagramas:'mapa mental mapas mentales conceptos organigrama flujo cronología',
  tFondo:'colores textura color fondo página',
  tMarca:'logo marca colores identidad visual',
  tWeb:'página sitio web app aplicación celular sistema interfaz'
};
const normalizarBusquedaHerramienta = texto => sinAcentos(String(texto || '')).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const PUENTE_BUSQUEDA_HERRAMIENTA = new Set(['de','del','para','con','por','el','la','las','los','y','un','una','mi','en','hacer','haz','crear','crea','diseñar','diseña','quiero','necesito']);
let focoAntesBuscarHerramienta = null;

function listarHerramientasBuscables(){
  const items = [...document.querySelectorAll('#pestanas button[data-tab]')].map(b => {
    const panel = $(b.dataset.tab); if (!panel) return null;
    const detalle = [...panel.querySelectorAll('h4,button')].map(x => (x.textContent || x.title || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    return { tipo:'panel', id:b.dataset.tab, titulo:(b.getAttribute('aria-label') || b.textContent).replace(/\s+/g, ' ').trim(),
      detalle, buscar:normalizarBusquedaHerramienta([b.title, b.getAttribute('aria-label'), panel.textContent, ALIAS_HERRAMIENTAS[b.dataset.tab] || ''].join(' ')), boton:b };
  }).filter(Boolean);
  const agregar = (titulo, detalle, buscar, ejecutar) => items.push({ tipo:'acción', titulo, detalle, buscar:normalizarBusquedaHerramienta(titulo + ' ' + detalle + ' ' + buscar), ejecutar });
  agregar('Exportar o descargar', 'PNG, JPG, PDF, PowerPoint y video MP4', 'guardar imprimir bajar archivo', () => abrirModal('mExportar'));
  agregar('Presentar o proyectar', 'Muestra tus diapositivas en pantalla completa', 'exposición exposición diapositivas clase', () => abrirModal('mPresentar'));
  agregar('Buscar texto en el diseño', 'Encuentra y reemplaza palabras', 'buscar reemplazar texto', () => abrirBuscar());
  if (typeof abrirEscuela === 'function') agregar('Modo escuela', 'Grupos, tareas, actividades y entregas', 'maestro alumno clase escolar', () => abrirEscuela());
  if (typeof irAlEstudioEV === 'function') agregar('Estudio de video', 'Graba, edita y prepara videos', 'cámara grabar música reels mp4', () => irAlEstudioEV());
  return items;
}

function cerrarBuscarHerramienta(devolverFoco = true){
  cerrarModal('mHerramientas');
  const foco = focoAntesBuscarHerramienta; focoAntesBuscarHerramienta = null;
  if (devolverFoco && foco && foco.isConnected && foco.focus) foco.focus();
}
function abrirBuscarHerramienta(consulta = ''){
  focoAntesBuscarHerramienta = document.activeElement;
  abrirModal('mHerramientas');
  const input = $('buscarHerramienta'); input.value = consulta; pintarResultadosHerramientas();
  requestAnimationFrame(() => input.focus());
}
function ejecutarHerramientaBuscada(item){
  cerrarBuscarHerramienta(false);
  if (item.ejecutar){ item.ejecutar(); return; }
  const app = $('app');
  if (item.boton.classList.contains('activa')){
    if (window.innerWidth <= 820 && typeof abrirLateral === 'function') abrirLateral(true);
    else if (app.classList.contains('sinLateral') && typeof ponerLateral === 'function') ponerLateral(true);
    return;
  }
  item.boton.click();
}
function pintarResultadosHerramientas(){
  const consulta = normalizarBusquedaHerramienta($('buscarHerramienta').value);
  const palabras = consulta.split(' ').filter(p => p && !PUENTE_BUSQUEDA_HERRAMIENTA.has(p));
  const items = listarHerramientasBuscables().filter(x => !palabras.length || palabras.every(p => x.buscar.includes(p)))
    .map((item, orden) => ({ item, orden, titulo:normalizarBusquedaHerramienta(item.titulo) }))
    .sort((a, b) => {
      const puntaje = x => palabras.reduce((n, p) => n + (x.titulo.includes(p) ? 2 : 0), 0);
      return puntaje(b) - puntaje(a) || a.orden - b.orden;
    }).map(x => x.item);
  const lista = $('resultadoHerramientas'); lista.replaceChildren();
  const visibles = items.slice(0, consulta ? 8 : 6);
  if (!visibles.length){ const p = document.createElement('p'); p.className = 'hint'; p.textContent = 'No encontramos esa herramienta. Prueba con “foto”, “mapa”, “video” o “descargar”.'; lista.appendChild(p); return; }
  visibles.forEach(item => {
    const relevantes = Array.isArray(item.detalle) ? item.detalle.filter(t => palabras.some(p => normalizarBusquedaHerramienta(t).includes(p))).slice(0, 2) : [];
    const b = document.createElement('button'); b.type = 'button'; b.className = 'bigbtn toolResultado';
    const nombre = document.createElement('span'); nombre.textContent = item.titulo; b.appendChild(nombre);
    const detalle = document.createElement('small');
    detalle.textContent = Array.isArray(item.detalle)
      ? relevantes.join(' · ') || item.detalle.slice(0, 3).join(' · ') || 'Abre esta herramienta'
      : item.detalle || 'Abre esta herramienta';
    b.appendChild(detalle); b.setAttribute('aria-label', item.titulo + (detalle.textContent ? ': ' + detalle.textContent : ''));
    b.onclick = () => ejecutarHerramientaBuscada(item); lista.appendChild(b);
  });
}
$('buscarHerramienta').addEventListener('input', pintarResultadosHerramientas);
$('bBuscarHerramienta').onclick = () => abrirBuscarHerramienta();
$('mHerramientas').addEventListener('click', e => { if (e.target === $('mHerramientas')) cerrarBuscarHerramienta(); });
document.addEventListener('keydown', e => {
  if (!$('mHerramientas').classList.contains('abierto')) return;
  if (e.key === 'Escape'){ e.preventDefault(); cerrarBuscarHerramienta(); }
  else if (e.key === 'Tab'){
    const focables = [...$('mHerramientas').querySelectorAll('input:not([disabled]),button:not([disabled])')].filter(x => !x.closest('[hidden]'));
    if (!focables.length) return;
    const primero = focables[0], ultimo = focables[focables.length - 1];
    if (e.shiftKey && (e.target === primero || !focables.includes(e.target))){ e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && e.target === ultimo){ e.preventDefault(); primero.focus(); }
  }
  else if (e.key === 'ArrowDown' && e.target === $('buscarHerramienta')){
    const primero = $('resultadoHerramientas').querySelector('button'); if (primero){ e.preventDefault(); primero.focus(); }
  } else if (e.key === 'Enter' && e.target === $('buscarHerramienta')){
    const primero = $('resultadoHerramientas').querySelector('button'); if (primero){ e.preventDefault(); primero.click(); }
  }
}, true);

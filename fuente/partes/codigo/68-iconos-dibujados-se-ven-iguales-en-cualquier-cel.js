/* =========================================================
   ÍCONOS DIBUJADOS (se ven iguales en cualquier celular o computadora)
   ========================================================= */
const ICONOS_UI = {
  carpeta:'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  guardar:'M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 3v5h7V3M7 21v-7h10v7',
  deshacer:'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3', rehacer:'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
  buscar:'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM21 21l-5-5',
  corazon:'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  enlace:'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  play:'M7 5v14l11-7z', descargar:'M12 4v11M7 10l5 5 5-5M5 20h14', subir:'M12 20V9M7 14l5-5 5 5M5 4h14',
  ajustar:'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  basura:'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6', duplicar:'M8 8h11v11H8zM5 16V5h11',
  lapiz:'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', izq:'M15 5l-7 7 7 7', der:'M9 5l7 7-7 7',
  notas:'M6 3h9l4 4v14H6zM9 12h7M9 16h5', mas:'M12 5v14M5 12h14', menos:'M5 12h14',
  plantillas:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', texto:'M5 7V4h14v3M12 4v16M9 20h6',
  formas:'M4 13h7v7H4zM16.5 4a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7zM7.5 3l3.5 6H4z',
  elementos:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z',
  dibujar:'M4 20c0-3 1-4.5 3-5l9-9 3 3-9 9c-.5 2-2 3-6 2zM14 8l2 2',
  imagen:'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 8.5h.01', diagramas:'M4 4h6v5H4zM14 15h6v5h-6zM7 9v3h10v3',
  fondo:'M4 4h16v16H4zM4 15l5-5 11 11M14 4l6 6', marca:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  monitor:'M3 4h18v12H3zM8 20h8M12 16v4', listo:'M5 12l5 5 9-10', cerrar:'M6 6l12 12M18 6 6 18'
};
const GLIFO_ICONO = { '📂':'carpeta', '💾':'guardar', '↶':'deshacer', '↷':'rehacer', '🔍':'buscar', '❤':'corazon', '❤️':'corazon', '🔗':'enlace', '▶':'play',
  '⬇':'descargar', '⬆':'subir', '⤢':'ajustar', '🗑':'basura', '🗑️':'basura', '⧉':'duplicar', '✎':'lapiz', '◀':'izq', '📝':'notas', '＋':'mas', '+':'mas', '−':'menos', '▦':'plantillas' };
const GLIFO_PESTANA = { tPlantillas:'plantillas', tTexto:'texto', tFormas:'formas', tElementos:'elementos', tDibujar:'dibujar', tImagenes:'imagen',
  tDiagramas:'diagramas', tFondo:'fondo', tMarca:'marca', tWeb:'monitor' };
function svgIcono(n){ return `<svg class="ico${n === 'play' ? ' relleno' : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONOS_UI[n]}"/></svg>`; }
(function(){
  const ZONAS = '#barra, #pestanas, #accMovil, #paginas, #barraNotas, #props .grupoBtns, #props .fila, #fila3D, #lateral .bigbtn';
  const glifos = Object.keys(GLIFO_ICONO).sort((a, b) => b.length - a.length);
  function convertir(b){
    if (b.querySelector('svg.ico')) return;
    const tab = b.closest('#pestanas') && b.dataset.tab;
    if (tab && GLIFO_PESTANA[tab]){ const s = b.querySelector('span'); if (s){ s.innerHTML = svgIcono(GLIFO_PESTANA[tab]); } return; }
    const n = [...b.childNodes].find(x => x.nodeType === 3 && x.textContent.trim());
    if (!n || n !== [...b.childNodes].find(x => x.nodeType !== 3 || x.textContent.trim())) return;
    const t = n.textContent.replace(/^\s+/, '');
    const g = glifos.find(x => t.startsWith(x) && (t.length === x.length || /\s|️/.test(t[x.length])));
    if (!g) return;
    if ((g === '+' || g === '−') && t.trim().length > 1 && !/^[+−]\s/.test(t)) return;
    const resto = t.slice(g.length).replace(/^️/, '');
    const sp = document.createElement('span'); sp.className = 'icoCaja'; sp.innerHTML = svgIcono(GLIFO_ICONO[g]);
    b.insertBefore(sp, n); n.textContent = resto.trim() ? ' ' + resto.trim() : '';
    if (!resto.trim() && !b.getAttribute('aria-label') && b.title) b.setAttribute('aria-label', b.title);
  }
  const todos = raiz => raiz.querySelectorAll('button').forEach(b => { if (b.matches(ZONAS.split(',').map(z => z.trim() + ' button, ' + z.trim()).join(','))) convertir(b); });
  todos(document);
  let pend = false;
  new MutationObserver(() => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; todos(document); }); })
    .observe(document.body, { childList:true, subtree:true, characterData:true });
})();


/* =========================================================
   ÍCONOS DIBUJADOS TAMBIÉN EN LA PÁGINA DE INICIO, LA DESCARGA Y EL EDITOR DE FOTOS
   Los emojis se ven distintos en cada celular (y en equipos viejos salen como cuadritos).
   Aquí se cambian por dibujos del mismo estilo que los de la barra (`ICONOS_UI` de 68-…).
   Solo se tocan los textos de estas ventanas; lo que está dentro de los diseños no cambia.
   ========================================================= */
Object.assign(ICONOS_UI, {
  cerebro:'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V6a2 2 0 0 0-3-2zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1',
  varita:'M4 20 16 8M15 3v3M21 9h-3M19.5 4.5l-2 2M13 6l5 5',
  qr:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 20h2M20 14v2',
  video:'M3 6h12v12H3zM15 10l6-3v10l-6-3',
  reducir:'M6 3h8l4 4v14H6zM14 3v4h4M12 10v7M9 14l3 3 3-3',
  megafono:'M3 10v4h3l8 5V5l-8 5zM18 9a4 4 0 0 1 0 6M6 14l1 6h3l-1-5',
  libros:'M4 19V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13',
  reloj:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 2',
  microscopio:'M6 21h12M9 17h6M12 17v-3M10 3l4 2-3 6-4-2zM14 9a5 5 0 0 1-1 9',
  pin:'M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 8a2 2 0 1 0 0 4a2 2 0 1 0 0-4z',
  impresora:'M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7z',
  bolsa:'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2',
  credencial:'M3 5h18v14H3zM7 10a2 2 0 1 0 4 0a2 2 0 1 0-4 0M6 16c1-2 5-2 6 0M14 9h4M14 13h4',
  balanza:'M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z',
  grafica:'M4 4v16h16M8 16v-5M12 16V8M16 16v-3',
  ciclo:'M20 11a8 8 0 0 0-14-5L4 8M4 4v4h4M4 13a8 8 0 0 0 14 5l2-2M20 20v-4h-4',
  carita:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  paleta:'M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2 0-1.5-1-2 0-3 .7-.7 2-.5 3-.5a4 4 0 0 0 4-4c0-4.5-4-8.5-9-8.5zM7.5 11h.01M10 7h.01M15 7.5h.01',
  birrete:'M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v5',
  microfono:'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  dinero:'M3 6h18v12H3zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM6 9h.01M18 15h.01',
  candado:'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4', candadoAbierto:'M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2',
  senal:'M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M12 20h.01',
  prohibido:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM5.6 5.6l12.8 12.8',
  cohete:'M12 15l-3-3c1-5 4-8 10-9-1 6-4 9-7 12zM9 12l-4 1-2 3 4 1M12 15l-1 4 3 2 1-4M5 19l2-2',
  casa:'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  mano:'M9 11V4a1.5 1.5 0 0 1 3 0v6M12 10V8.5a1.5 1.5 0 0 1 3 0V11M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L9 15',
  flechaAbajo:'M12 4v16M6 14l6 6 6-6', flechaIzq:'M20 12H4M10 6l-6 6 6 6',
  foco:'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
  teclado:'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  personas:'M9 11a3 3 0 1 0 0-6a3 3 0 1 0 0 6zM3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 6',
  documento:'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6',
  gota:'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  borrador:'M16 3l5 5-11 11H5l-3-3zM9 10l5 5M10 21h11',
  curita:'M4.5 14.5l10-10a3.5 3.5 0 0 1 5 5l-10 10a3.5 3.5 0 0 1-5-5zM9 9l6 6M11 12h.01M13 11h.01',
  ojo:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z',
  deslizador:'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M16 4v4M10 10v4M18 16v4',
  pincel:'M18 3l3 3-9 9-3-3zM9 12c-3 0-5 2-5 5 0 1-1 2-2 2 2 2 7 2 9-1 1-1.5 1-3 1-3',
  tijeras:'M6 3a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM6 15a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM8.5 7.5 20 19M8.5 16.5 20 5',
  girar:'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  celular:'M7 2h10v20H7zM11 18h2',
  fabrica:'M3 21V10l6 4V10l6 4V4h5v17zM7 17h2M13 17h2',
  engrane:'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1',
  calendario:'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
  fiesta:'M4 20l4-12 8 8zM14 4v2M19 9h2M17 4l-1 2M20 13l-2-1M10 3c.5 2 0 3-1 4',
  regla:'M3 16 16 3l5 5L8 21zM7 12l2 2M10 9l2 2M13 6l2 2'
});
const EMOJI_ICONO = {
  '🧠':'cerebro', '🪄':'varita', '🔳':'qr', '🎬':'video', '📉':'reducir', '★':'marca', '⭐':'marca', '📣':'megafono', '📚':'libros',
  '▶':'play', '🕒':'reloj', '🕓':'reloj', '🕗':'reloj', '🕘':'reloj', '🔬':'microscopio', '🖼':'imagen', '📌':'pin', '📍':'pin',
  '🖨':'impresora', '🛍':'bolsa', '🪪':'credencial', '⚖':'balanza', '📊':'grafica', '🔁':'ciclo', '✨':'elementos', '🖥':'monitor',
  '😊':'carita', '🎨':'paleta', '📂':'carpeta', '📁':'carpeta', '🎓':'birrete', '🎙':'microfono', '✏':'lapiz', '🖍':'lapiz',
  '💸':'dinero', '🔒':'candado', '🔓':'candadoAbierto', '📶':'senal', '🚫':'prohibido', '🚀':'cohete', '🏠':'casa', '👆':'mano',
  '👇':'flechaAbajo', '👈':'flechaIzq', '💡':'foco', '⌨':'teclado', '👥':'personas', '📄':'documento', '💧':'gota', '🧽':'borrador',
  '🩹':'curita', '👁':'ojo', '🎚':'deslizador', '🖌':'pincel', '✂':'tijeras', '↺':'girar', '↩':'girar', '📱':'celular', '🏭':'fabrica',
  '⚙':'engrane', '📅':'calendario', '🎉':'fiesta', '📏':'regla', '⬇':'descargar', '✓':'listo', '✕':'cerrar', '↶':'deshacer', '↷':'rehacer',
  '▦':'plantillas', '🗑':'basura', '🔍':'buscar'
};
const ZONAS_EMOJI = ['#inicioApp', '#mDescargaFacil', '#editorFoto', '#mReducirPDF', '#mHistorial', '#ayudaS', '#bModo'];
const RX_EMOJI = new RegExp('(' + Object.keys(EMOJI_ICONO).sort((a, b) => b.length - a.length).join('|') + ')️?', 'gu');
function iconizarEmojis(raiz){
  if (!raiz || raiz.nodeType !== 1 || raiz.closest('svg, canvas, textarea, [contenteditable="true"]')) return;
  const tw = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode: n =>
    !RX_EMOJI.test(n.data) ? NodeFilter.FILTER_REJECT
      : (RX_EMOJI.lastIndex = 0, n.parentElement.closest('svg, script, style, textarea, option, [contenteditable="true"]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  const lista = []; for (let n; (n = tw.nextNode());) lista.push(n);
  RX_EMOJI.lastIndex = 0;
  lista.forEach(n => {
    const frag = document.createDocumentFragment(); let ult = 0;
    n.data.replace(RX_EMOJI, (m, g, pos) => {
      if (pos > ult) frag.appendChild(document.createTextNode(n.data.slice(ult, pos)));
      const sp = document.createElement('span'); sp.className = 'icoCaja icoE'; sp.innerHTML = svgIcono(EMOJI_ICONO[g]);
      frag.appendChild(sp); ult = pos + m.length; return m;
    });
    if (ult < n.data.length) frag.appendChild(document.createTextNode(n.data.slice(ult)));
    n.parentNode.replaceChild(frag, n);
  });
}
(function(){
  const vistas = new WeakSet();
  const vigilar = el => {
    if (!el || vistas.has(el)) return; vistas.add(el);
    iconizarEmojis(el);
    let pend = new Set(), prog = false;
    new MutationObserver(muts => {
      muts.forEach(m => {
        if (m.type === 'characterData'){ if (m.target.parentElement) pend.add(m.target.parentElement); return; }
        m.addedNodes.forEach(x => pend.add(x.nodeType === 1 ? x : x.parentElement));
      });
      if (prog) return; prog = true;
      requestAnimationFrame(() => { const l = [...pend]; pend = new Set(); prog = false; l.forEach(x => x && x.isConnected && iconizarEmojis(x)); });
    }).observe(el, { childList:true, subtree:true, characterData:true });
  };
  const buscar = () => ZONAS_EMOJI.forEach(s => vigilar(document.querySelector(s)));
  buscar();
  // algunas ventanas se crean después (al abrirlas por primera vez)
  new MutationObserver(buscar).observe(document.body, { childList:true });
})();

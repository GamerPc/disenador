/* =========================================================
   HISTORIAL (deshacer / rehacer) + borrador automático
   ========================================================= */
let notaPagina = '';   // notas del presentador de la página actual
function jsonPagina(){ const j = canvas.toJSON(EXTRA); if (notaPagina) j.notas = notaPagina; return j; }
function serializar(){
  paginas[actual] = jsonPagina();
  return JSON.stringify({ v:2, w:W, h:H, p:paginas, i:actual, pres:presConfig, ...(medidaReal ? { med:medidaReal } : {}) });
}

// qué pasó en cada paso del historial (para el panel «Historial de cambios»)
let historialInfo = [], accionHist = '';
function tomarAccion(){
  let a = accionHist;
  if (!a){ const o = typeof activo === 'function' && activo(); a = o && typeof nombreCorto === 'function' ? 'Cambiar ' + nombreCorto(o) : 'Cambio'; }
  accionHist = ''; return a;
}
function guardarEstado(){
  if (restaurando || generandoVista || (typeof recorte !== 'undefined' && recorte)) return;   // durante un recorte no se guarda el recuadro temporal
  try { autoGuardado(); } catch(e){}
  const j = serializar();
  if (historial[hi] === j) return;
  if (historialInfo.length !== historial.length) historialInfo = historial.map((_, i) => historialInfo[i] || { t:Date.now(), txt:'Cambio' });
  historial = historial.slice(0, hi+1); historialInfo = historialInfo.slice(0, hi+1);
  historial.push(j); historialInfo.push({ t:Date.now(), txt:tomarAccion() });
  // hasta 200 pasos, pero sin pasar de unos 40 millones de letras guardadas (los diseños con muchas fotos pesan más)
  let tam = 0; for (const x of historial) tam += x.length;
  while (historial.length > 20 && (historial.length > 200 || tam > 4e7)){ tam -= historial[0].length; historial.shift(); historialInfo.shift(); }
  hi = historial.length - 1;
  botonesHist();
  renderPaginas();
  clearTimeout(guardarEstado._b);
  guardarEstado._b = setTimeout(() => {
    try { localStorage.setItem('disenador_borrador', j); localStorage.setItem('disenador_nombre', $('nombreDiseno').value); } catch(e){}
  }, 800);
}
function botonesHist(){ $('bDeshacer').disabled = hi <= 0; $('bRehacer').disabled = hi >= historial.length-1; }

function cargarJSON(txt, conHistorial, alTerminar){
  const d = JSON.parse(txt);
  restaurando = true;
  W = d.w; H = d.h; $('tamTxt').textContent = W + ' × ' + H;
  if (d.pres) presConfig = { ...presConfig, ...d.pres };
  medidaReal = d.med || null;
  if (d.p){ paginas = d.p; actual = Math.min(d.i || 0, paginas.length - 1); }
  else { paginas = [d.c]; actual = 0; }
  miniaturas = [];
  canvas.discardActiveObject();
  notaPagina = (paginas[actual] && paginas[actual].notas) || ''; if (typeof mostrarNotas === 'function') mostrarNotas();
  canvas.loadFromJSON(paginas[actual] || PAGINA_VACIA(), () => {
    canvas.renderAll(); normalizarVinculos();
    restaurando = false;
    establecerZoom(zoom); ajustarZoom();
    renderCapas(); actualizarPanel();
    if (conHistorial) guardarEstado();
    botonesHist(); renderPaginas();
    if (alTerminar) alTerminar();
  });
}
function deshacer(){ if (hi > 0){ hi--; cargarJSON(historial[hi], false); } }
function rehacer(){ if (hi < historial.length-1){ hi++; cargarJSON(historial[hi], false); } }


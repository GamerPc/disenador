/* =========================================================
   HISTORIAL (deshacer / rehacer) + borrador automático
   ========================================================= */
let notaPagina = '';   // notas del presentador de la página actual
function jsonPagina(){ const j = canvas.toJSON(EXTRA); if (notaPagina) j.notas = notaPagina; return j; }
function serializar(){
  paginas[actual] = jsonPagina();
  return JSON.stringify({ v:2, w:W, h:H, p:paginas, i:actual, pres:presConfig });
}

function guardarEstado(){
  if (restaurando || generandoVista || (typeof recorte !== 'undefined' && recorte)) return;   // durante un recorte no se guarda el recuadro temporal
  try { autoGuardado(); } catch(e){}
  const j = serializar();
  if (historial[hi] === j) return;
  historial = historial.slice(0, hi+1);
  historial.push(j);
  if (historial.length > 60) historial.shift();
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


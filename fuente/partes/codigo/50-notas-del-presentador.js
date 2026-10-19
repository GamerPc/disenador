/* =========================================================
   NOTAS DEL PRESENTADOR
   ========================================================= */
// Editor de notas debajo del lienzo (cada página tiene las suyas; se guardan dentro de la página)
let notasAbiertas = false;
try { notasAbiertas = localStorage.getItem('disenador_notas') === '1'; } catch(e){}
function mostrarNotas(){
  const ta = $('notasPagina');
  if (ta.value !== notaPagina) ta.value = notaPagina;
  ta.hidden = !notasAbiertas;
  $('bNotas').classList.toggle('on', notasAbiertas);
  const r = notaPagina.trim().replace(/\s+/g, ' ');
  $('notasResumen').textContent = notasAbiertas ? 'Solo tú las ves al presentar (vista del presentador o botón 📝).' : (r ? '“' + (r.length > 90 ? r.slice(0, 90) + '…' : r) + '”' : 'Sin notas en esta página');
}
function alternarNotas(){
  notasAbiertas = !notasAbiertas;
  try { localStorage.setItem('disenador_notas', notasAbiertas ? '1' : '0'); } catch(e){}
  mostrarNotas(); ajustarZoom();
  if (notasAbiertas) $('notasPagina').focus();
}
$('notasPagina').addEventListener('input', e => {
  notaPagina = e.target.value;
  clearTimeout(alternarNotas._t);
  alternarNotas._t = setTimeout(() => { guardarEstado(); renderPaginas(); }, 700);
});
$('notasPagina').addEventListener('keydown', e => e.stopPropagation());   // que Supr o Ctrl+Z no actúen sobre el lienzo
mostrarNotas();

// ---------- Tiempo de la presentación ----------
const tiempoPres = { inicio:0, acumulado:0, pausado:false };
function reiniciarTiempo(){ tiempoPres.inicio = Date.now(); tiempoPres.acumulado = 0; tiempoPres.pausado = false; pintarTiempo(); }
function pausarTiempo(){
  if (tiempoPres.pausado){ tiempoPres.inicio = Date.now(); tiempoPres.pausado = false; }
  else { tiempoPres.acumulado += Date.now() - tiempoPres.inicio; tiempoPres.pausado = true; }
  pintarTiempo();
}
function textoTiempo(){
  const ms = tiempoPres.acumulado + (tiempoPres.pausado ? 0 : Date.now() - tiempoPres.inicio), s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60), h = Math.floor(m / 60), d2 = n => String(n).padStart(2, '0');
  return (h ? h + ':' + d2(m % 60) : d2(m)) + ':' + d2(s % 60);
}
function pintarTiempo(){
  const t = textoTiempo();
  $('pnTiempo').textContent = t;
  const v = ventanaAbierta();
  if (v){
    v.document.getElementById('tiempo').textContent = t;
    v.document.getElementById('hora').textContent = new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
    v.document.getElementById('bPausa').textContent = tiempoPres.pausado ? '▶ Continuar' : '⏸ Pausar';
  }
}
const notaDe = p => (paginas[p] && paginas[p].notas) || '';

// ---------- Notas dentro de la presentación (una sola pantalla) ----------
function alternarNotasPres(forzar){
  if (!pres) return;
  pres.verNotas = forzar ?? !pres.verNotas;
  $('presNotas').style.display = pres.verNotas ? 'block' : 'none';
  actualizarPresentador();
}

// ---------- Ventana del presentador (para una segunda pantalla) ----------
let ventanaPres = null;
const ventanaAbierta = () => { try { return ventanaPres && !ventanaPres.closed && ventanaPres.document.getElementById('notas') ? ventanaPres : null; } catch(e){ return null; } };
const HTML_PRESENTADOR = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Vista del presentador</title><style>
*{box-sizing:border-box}
body{margin:0;background:#111827;color:#f3f4f6;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;height:100vh;display:grid;
  grid-template-columns:1.45fr 1fr;grid-template-rows:auto minmax(0,1fr) minmax(130px,34vh);gap:12px;padding:14px}
header{grid-column:1/3;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#tiempo{font:700 34px ui-monospace,Menlo,Consolas,monospace;min-width:120px}
#hora{opacity:.65;font-size:14px}#num{font-weight:600}.esp{flex:1}
button{background:#374151;color:#fff;border:0;border-radius:8px;padding:9px 14px;font-size:15px;cursor:pointer}
button:hover{background:#4b5563}#bSig{background:#ff4b2b}#bSig:hover{background:#ff6a3d}
.caja{display:flex;flex-direction:column;gap:6px;min-height:0}
.caja img{width:100%;height:100%;min-height:0;object-fit:contain;border-radius:8px;background:#000}
#sig img{opacity:.85}
small{opacity:.6;text-transform:uppercase;letter-spacing:.06em;font-size:11px}
#notas{grid-column:1/3;background:#1f2937;border-radius:10px;padding:14px 20px;font-size:24px;line-height:1.45;overflow:auto;white-space:pre-wrap}
#notas.vacio{color:#9ca3af;font-size:18px}
</style></head><body>
<header><span id="tiempo">00:00</span><button id="bPausa">⏸ Pausar</button><button id="bReinicio">↺ Reiniciar</button><span id="hora"></span>
<span class="esp"></span><span id="num"></span><button id="bAnt">◀ Anterior</button><button id="bSig">Siguiente ▶</button><button id="bSalir">✕ Terminar</button></header>
<div class="caja"><small>Ahora</small><img id="imgAct" alt=""></div>
<div class="caja" id="sig"><small id="sigTit">Siguiente</small><img id="imgSig" alt=""></div>
<div id="notas"></div></body></html>`;
function abrirVentanaPresentador(){
  try {
    ventanaPres = window.open('', 'vistaPresentador', 'width=1100,height=720');
    if (!ventanaPres) throw new Error('bloqueada');
    const d = ventanaPres.document; d.open(); d.write(HTML_PRESENTADOR); d.close();
    const el = id => d.getElementById(id);
    el('bSig').onclick = () => presSiguiente();
    el('bAnt').onclick = () => presAnterior();
    el('bSalir').onclick = () => salirPresentacion();
    el('bPausa').onclick = pausarTiempo;
    el('bReinicio').onclick = reiniciarTiempo;
    ventanaPres.addEventListener('keydown', e => {
      const k = e.key;
      if (['ArrowRight','PageDown',' ','Enter','ArrowDown'].includes(k)){ e.preventDefault(); presSiguiente(); }
      else if (['ArrowLeft','PageUp','ArrowUp','Backspace'].includes(k)){ e.preventDefault(); presAnterior(); }
      else if (k === 'Escape'){ e.preventDefault(); salirPresentacion(); }
    });
    return true;
  } catch (e) {
    ventanaPres = null;
    toast('El navegador bloqueó la ventana del presentador. Permite las ventanas emergentes, o usa el botón 📝 durante la presentación.');
    return false;
  }
}
function prepararImagenesPres(){
  const yo = pres; yo.imgs = {};
  (async () => {
    for (const p of yo.lista){
      if (pres !== yo) return;
      try { yo.imgs[p] = await renderPagina(paginas[p], 'jpeg', 720 / Math.max(W, H), false); } catch(e){}
      if (pres === yo) actualizarPresentador();
    }
  })();
}
function actualizarPresentador(){
  if (!pres) return;
  const n = pres.lista.length, i = Math.min(Math.max(pres.i, 0), n - 1), p = pres.lista[i], sig = pres.lista[i + 1];
  const nota = pres.fin ? '' : notaDe(p);
  const num = pres.fin ? 'Fin' : 'Página ' + (i + 1) + ' de ' + n;
  $('pnNum').textContent = num;
  $('pnTexto').textContent = nota || 'Esta página no tiene notas. Escríbelas en “📝 Notas del presentador”, debajo del lienzo.';
  $('pnTexto').classList.toggle('vacio', !nota);
  const v = ventanaAbierta(); if (!v) return;
  const d = v.document;
  d.getElementById('num').textContent = num;
  d.getElementById('notas').textContent = pres.fin ? 'Terminaste. Pulsa Siguiente o Terminar para salir.' : (nota || 'Esta página no tiene notas.');
  d.getElementById('notas').className = nota ? '' : 'vacio';
  d.getElementById('imgAct').src = (!pres.fin && pres.imgs && pres.imgs[p]) || '';
  d.getElementById('imgSig').src = (!pres.fin && sig != null && pres.imgs && pres.imgs[sig]) || '';
  d.getElementById('sigTit').textContent = pres.fin ? '' : (sig != null ? 'Siguiente' : 'Siguiente: fin de la presentación');
  d.title = 'Presentador · ' + num;
}


/* =========================================================
   PESTAÑAS E INICIO
   ========================================================= */
document.querySelectorAll('#pestanas button[data-tab]').forEach(b => b.onclick = () => {   // solo las pestañas de panel (🎬 Video tiene su propio botón)
  if (esTel()){
    const abierto = $('lateral').classList.contains('abierto');
    if (abierto && b.classList.contains('activa')){ abrirLateral(false); return; }
    abrirLateral(true);
  }
  document.querySelectorAll('#pestanas button').forEach(x => x.classList.remove('activa'));
  document.querySelectorAll('.panelTab').forEach(x => x.classList.remove('activa'));
  b.classList.add('activa'); $(b.dataset.tab).classList.add('activa');
});

(async function iniciar(){
  let borrador = null;
  try { borrador = localStorage.getItem('disenador_borrador'); } catch(e){}
  // solo se esperan las letras que usa tu último diseño (las demás se bajan cuando se usan): así abre más rápido
  const usadas = new Set(['Inter']);
  if (borrador) for (const m of borrador.matchAll(/fontFamily\\*":\\*"([^"\\]+)/g)) usadas.add(m[1].replace(/^'|'$/g, ''));
  try { await Promise.race([Promise.all([...usadas].filter(f => FUENTES.includes(f) && !['Arial','Georgia','Times New Roman','Courier New','Verdana'].includes(f)).flatMap(f => [document.fonts.load(`400 40px "${f}"`), document.fonts.load(`700 40px "${f}"`)])), new Promise(r => setTimeout(r, 4000))]); } catch(e){}
  cargarMisPlantillas();
  if (await abrirCompartidoSiHay()) return;
  if (borrador){
    try { $('nombreDiseno').value = localStorage.getItem('disenador_nombre') || 'Mi diseño'; } catch(e){}
    cargarJSON(borrador, true, () => toast('Se recuperó tu último diseño'));
  } else {
    ajustarZoom(); guardarEstado();
  }
})();
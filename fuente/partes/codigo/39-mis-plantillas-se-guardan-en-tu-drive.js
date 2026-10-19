/* =========================================================
   MIS PLANTILLAS (se guardan en tu Drive)
   ========================================================= */
async function guardarComoPlantilla(){
  const nombre = (prompt('Nombre de tu plantilla:', $('nombreDiseno').value || 'Mi plantilla') || '').trim();
  if (!nombre) return;
  canvas.discardActiveObject(); canvas.requestRenderAll();
  const pagina = jsonPagina();
  cargando(true);
  try {
    const vista = await renderPagina(pagina, 'jpeg', 520 / Math.max(W, H), false);
    await gs('guardarPlantilla', nombre, JSON.stringify({ v:1, w:W, h:H, pagina, vista }));
    toast('Plantilla “' + nombre + '” guardada');
    await cargarMisPlantillas();
    catActiva = CAT_MIAS; document.querySelectorAll('#chipsCat .chip').forEach(x => x.classList.toggle('on', x.textContent === '★ Mías')); renderCatalogo();
  } catch (e) { toast('No se pudo guardar: ' + e.message); }
  finally { cargando(false); }
}
function usarMiPlantilla(it){
  if (canvas.getObjects().length && !confirm('Esto reemplazará el contenido de esta página. ¿Continuar?')) return;
  cargando(true);
  gs('cargarProyecto', it.id).then(txt => {
    const d = JSON.parse(txt);
    fijarTamano(d.w, d.h);
    restaurando = true;
    canvas.loadFromJSON(d.pagina, () => {
      normalizarVinculos(); restaurando = false;
      canvas.renderAll(); renderCapas(); guardarEstado(); cargando(false);
      toast('Plantilla aplicada');
    });
  }).catch(e => { cargando(false); toast('No se pudo abrir: ' + e.message); });
}
function agregarMisPlantillas(lista){
  for (let i = CATALOGO.length - 1; i >= 0; i--) if (CATALOGO[i].cat === CAT_MIAS) CATALOGO.splice(i, 1);
  lista.slice().reverse().forEach(p => {
    const it = { nombre:p.nombre, cat:CAT_MIAS, vista:p.vista || '', id:p.id };
    it.usar = () => usarMiPlantilla(it);
    it.borrar = () => {
      if (!confirm('¿Eliminar tu plantilla “' + p.nombre + '”? (Se manda a la papelera de Drive)')) return;
      gs('eliminarProyecto', p.id).then(() => { agregarMisPlantillas(lista.filter(x => x.id !== p.id)); toast('Plantilla eliminada'); });
    };
    CATALOGO.unshift(it);
  });
  renderCatalogo();
}
async function cargarMisPlantillas(){
  try { const lista = await gs('listarPlantillas'); if (Array.isArray(lista)) agregarMisPlantillas(lista); } catch(e){}
}


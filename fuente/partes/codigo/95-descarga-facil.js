/* =========================================================
   DESCARGAR EN UN PASO: «¿Para qué lo quieres?»
   En lugar de hablar de PNG, JPG, PDF o escalas, se pregunta para qué es y se elige todo solo.
   «Más opciones» abre la ventana completa de siempre (para quien ya sabe lo que quiere).
   ========================================================= */
function escalaPara(ladoMax){ return Math.max(0.25, Math.min(3, ladoMax / Math.max(W, H))); }
async function blobDePagina(it, fmt, escala, transp){ return (await fetch(await renderPagina(it.p, fmt, escala, transp))).blob(); }
function paginasElegidasDF(){
  const todas = document.querySelector('#mDescargaFacil [name="dfPag"]:checked');
  $('ePaginas').value = todas && todas.value === 'todas' ? 'todas' : 'actual';
  return paginasAExportar();
}
const OPCIONES_DESCARGA = [
  { id:'compartir', ico:'📱', t:'Para compartir', d:'WhatsApp, redes sociales o correo', async f(){
      const lista = paginasElegidasDF(), esc = escalaPara(1600), archivos = [];
      for (const it of lista){ const b = await blobDePagina(it, 'jpeg', esc, false); archivos.push(new File([b], nombreArchivo() + (lista.length > 1 ? '-' + (it.i + 1) : '') + '.jpg', { type:'image/jpeg' })); }
      if (navigator.canShare && navigator.canShare({ files:archivos })){
        try { await navigator.share({ files:archivos, title:nombreArchivo() }); return 'Listo para compartir'; }
        catch (e) { if (e && e.name === 'AbortError') return ''; }
      }
      for (const f of archivos){ bajarBlob(f, f.name); await new Promise(r => setTimeout(r, 400)); }
      return 'Imagen descargada: ya la puedes mandar por WhatsApp o subir a tus redes';
    } },
  { id:'imprimir', ico:'🖨', t:'Para imprimir', d:'PDF con buena calidad, listo para la impresora', async f(){
      const lista = paginasElegidasDF(), pdf = await crearPDF(lista, escalaPara(3300));
      bajarBlob(pdf.output('blob'), nombreArchivo() + '.pdf'); return 'PDF descargado: ábrelo y elige «Imprimir»';
    } },
  { id:'entregar', ico:'🎓', t:'Para entregar una tarea', d:'Un PDF ligero para subir a la plataforma', async f(){
      const lista = paginasElegidasDF(), pdf = await crearPDF(lista, escalaPara(2000));
      bajarBlob(pdf.output('blob'), nombreArchivo() + '.pdf'); return 'PDF descargado: ya lo puedes subir o mandar a tu maestro';
    } },
  { id:'calidad', ico:'🖼', t:'Imagen en alta calidad', d:'PNG nítido, para editar o usar en otro lado', async f(){
      const lista = paginasElegidasDF(), esc = escalaPara(3000);
      for (const it of lista){ bajarBlob(await blobDePagina(it, 'png', esc, false), nombreArchivo() + (lista.length > 1 ? '-' + (it.i + 1) : '') + '.png'); await new Promise(r => setTimeout(r, 400)); }
      return 'Imagen descargada';
    } },
  { id:'presentar', ico:'📊', t:'Para presentar', d:'PowerPoint que se puede editar', soloVarias:true, async f(){
      const lista = paginasElegidasDF(), pptx = await crearPPTX(lista, 1, true);
      bajarBlob(await pptx.write({ outputType:'blob' }), nombreArchivo() + '.pptx'); return 'PowerPoint descargado';
    } },
  { id:'video', ico:'🎬', t:'Video', d:'MP4 con las animaciones, para reels o estados', async f(){
      paginasElegidasDF(); $('eFormato').value = 'video';
      const v = await obtenerVideo(); bajarBlob(v.blob, nombreArchivo() + '.' + v.ext); return avisoVideo(v);
    } },
  { id:'imprenta', ico:'🏭', t:'Para la imprenta', d:'Lona o sublimación a medida real (PDF, TIFF, PSD…)', soloMedida:true, async f(){
      cerrarModal('mDescargaFacil'); abrirModal.directo('mExportar'); $('eFormato').value = 'imprenta'; $('eFormato').dispatchEvent(new Event('change')); return '';
    } }
];
(function(){
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'mDescargaFacil';
  m.innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="dfTitulo">
    <h3 id="dfTitulo">⬇ ¿Para qué lo quieres?</h3>
    <div class="dfPaginas" id="dfPaginas" role="radiogroup" aria-label="Qué páginas">
      <label><input type="radio" name="dfPag" value="actual"><span>Solo esta página</span></label>
      <label><input type="radio" name="dfPag" value="todas" checked><span>Todas las páginas (<b id="dfNum"></b>)</span></label>
    </div>
    <div class="dfOpciones" id="dfOpciones"></div>
    <div class="acciones"><button class="btnS" id="dfMas">⚙ Más opciones</button><button class="btnS" id="dfCerrar">Cerrar</button></div>
  </div>`;
  document.body.appendChild(m);
  m.addEventListener('click', e => { if (e.target === m) cerrarModal('mDescargaFacil'); });
  $('dfCerrar').onclick = () => cerrarModal('mDescargaFacil');
  $('dfMas').onclick = () => { cerrarModal('mDescargaFacil'); abrirModal.directo('mExportar'); };
})();
function abrirDescargaFacil(){
  canvas.discardActiveObject(); canvas.requestRenderAll();
  const varias = paginas.length > 1;
  $('dfPaginas').hidden = !varias; $('dfNum').textContent = paginas.length;
  const cont = $('dfOpciones'); cont.innerHTML = '';
  OPCIONES_DESCARGA.filter(o => (!o.soloVarias || varias) && (!o.soloMedida || (typeof medidaReal !== 'undefined' && medidaReal))).forEach(o => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'dfOpcion';
    b.innerHTML = `<span class="dfIco" aria-hidden="true">${o.ico}</span><span><b>${esc(o.t)}</b><small>${esc(o.d)}</small></span>`;
    b.onclick = async () => {
      if (b.disabled) return;
      cont.querySelectorAll('button').forEach(x => x.disabled = true); b.classList.add('trabajando');
      const det = b.querySelector('small'), antes = det.textContent; det.textContent = 'Preparando…';
      try { const msj = await o.f(); if (msj){ toast('✓ ' + msj); cerrarModal('mDescargaFacil'); if (typeof hechoPP === 'function') hechoPP('exportar'); } }
      catch (e) { console.error(e); toast('No se pudo descargar: ' + ((e && e.message) || e)); }
      finally { det.textContent = antes; b.classList.remove('trabajando'); cont.querySelectorAll('button').forEach(x => x.disabled = false); }
    };
    cont.appendChild(b);
  });
  abrirModal.directo('mDescargaFacil');
  setTimeout(() => { const f = cont.querySelector('button'); f && f.focus(); }, 30);
}
// «Exportar» (botón, Ctrl+E y buscador) abre primero esta ventana; «Más opciones» abre la completa
{ const orig = abrirModal;
  abrirModal = function(id){ if (id === 'mExportar') return abrirDescargaFacil(); return orig.apply(this, arguments); };
  abrirModal.directo = orig;
}

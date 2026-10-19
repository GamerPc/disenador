/* =========================================================
   EXPORTAR
   ========================================================= */
// Otras partes agregan formatos (SVG, página web…) con FORMATO('svg').descargar = …, .vista = …, .drive = …
const FORMATOS_EXTRA = {};
const FORMATO = f => FORMATOS_EXTRA[f] || (FORMATOS_EXTRA[f] = {});
const formatoExtra = acc => { const f = FORMATOS_EXTRA[$('eFormato').value]; return f && f[acc]; };
function nombreArchivo(){ return ($('nombreDiseno').value || 'diseño').trim(); }
function gs(fn, ...args){
  return new Promise((ok, mal) => google.script.run.withSuccessHandler(ok).withFailureHandler(mal)[fn](...args));
}
function paginasAExportar(){
  paginas[actual] = jsonPagina();
  return $('ePaginas').value === 'todas' ? paginas.map((p, i) => ({ p, i })) : [{ p: paginas[actual], i: actual }];
}
// Dibuja una página fuera de pantalla y devuelve su imagen
function renderPagina(json, fmt, escala, transp){
  return new Promise(ok => {
    const el = document.createElement('canvas');
    const sc = new fabric.StaticCanvas(el, { width:W, height:H, enableRetinaScaling:false });
    const j = JSON.parse(JSON.stringify(json || PAGINA_VACIA()));
    if (transp) j.background = null;
    if (fmt === 'jpeg' && !j.background) j.background = '#ffffff';
    sc.loadFromJSON(j, () => {
      sc.renderAll();
      const url = sc.toDataURL({ format: fmt, quality: 0.95, multiplier: escala });
      sc.dispose(); ok(url);
    });
  });
}
async function crearPDF(lista, escala){
  if ($('iPapel') && $('iPapel').value !== 'diseno') return crearPDFHojas(lista);
  const { jsPDF } = window.jspdf;
  const dpi = Math.max(W, H) >= 2000 ? 300 : 96;          // carta/A4 a 300 dpi salen a su tamaño real
  const pw = W * 72 / dpi, ph = H * 72 / dpi, ori = W > H ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation: ori, unit: 'pt', format: [pw, ph], compress: true });
  for (let k = 0; k < lista.length; k++){
    if (k) pdf.addPage([pw, ph], ori);
    const url = await renderPagina(lista[k].p, 'jpeg', escala, false);
    pdf.addImage(url, 'JPEG', 0, 0, pw, ph, undefined, 'FAST');
  }
  return pdf;
}
function bajarBlob(blob, nombre){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombre; a.target = '_self';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 8000);
}
function opcionesExport(){
  const fmt = $('eFormato').value;
  return { fmt, escala: +$('eEscala').value, transp: $('eTransp').checked && fmt === 'png', lista: paginasAExportar() };
}
let ultimoVideo = null;
async function obtenerVideo(){
  canvas.discardActiveObject(); canvas.requestRenderAll();
  const lista = paginasAExportar();
  const clave = JSON.stringify([serializar(), $('vSeg').value, $('vCalidad').value, $('ePaginas').value, presConfig.transicion]);
  if (ultimoVideo && ultimoVideo.clave === clave) return ultimoVideo.v;
  const v = await videoConProgreso(lista);
  ultimoVideo = { clave, v };
  return v;
}
function avisoVideo(v){
  const mb = (v.blob.size / 1048576).toFixed(1) + ' MB';
  if (v.ext !== 'mp4') return 'Video listo (' + mb + ', formato WebM). Para WhatsApp conviene crearlo desde Chrome.';
  if (v.codec === 'vp9') return 'Video listo (' + mb + '). Tu navegador no tiene el formato H.264; si WhatsApp no lo acepta, créalo desde Chrome.';
  return 'Video listo (' + mb + ').';
}
async function descargarImagen(){
  if (formatoExtra('descargar')) return formatoExtra('descargar')();
  if ($('eFormato').value === 'video'){
    try { const v = await obtenerVideo(); bajarBlob(v.blob, nombreArchivo() + '.' + v.ext); toast(avisoVideo(v)); }
    catch (e) { console.error(e); toast('No se pudo crear el video: ' + e.message); }
    return;
  }
  canvas.discardActiveObject(); canvas.requestRenderAll();
  const { fmt, escala, transp, lista } = opcionesExport();
  cargando(true);
  try {
    if (fmt === 'pptx'){
      const pptx = await crearPPTX(lista, escala, $('ePptEditable').checked);
      bajarBlob(await pptx.write({ outputType:'blob' }), nombreArchivo() + '.pptx');
    } else if (fmt === 'pdf'){
      const pdf = await crearPDF(lista, escala);
      bajarBlob(pdf.output('blob'), nombreArchivo() + '.pdf');
    } else {
      const ext = fmt === 'jpeg' ? 'jpg' : 'png';
      for (const it of lista){
        const url = await renderPagina(it.p, fmt, escala, transp);
        const suf = lista.length > 1 ? '-' + (it.i + 1) : '';
        bajarBlob(await (await fetch(url)).blob(), nombreArchivo() + suf + '.' + ext);
        await new Promise(r => setTimeout(r, 500));
      }
    }
    toast('Descarga iniciada. Si no aparece, usa “Vista previa” o “Guardar en Drive”.');
  } catch (e) { toast('Error al exportar: ' + e.message); }
  finally { cargando(false); }
}
async function vistaPrevia(){
  if (formatoExtra('vista')) return formatoExtra('vista')();
  if ($('eFormato').value === 'video'){
    try {
      const v = await obtenerVideo();
      $('vista').innerHTML = `<p class="hint">${esc(avisoVideo(v))} Revísalo aquí antes de descargarlo.</p><video controls autoplay muted playsinline style="width:100%;border-radius:8px;background:#000"></video>`;
      $('vista').querySelector('video').src = URL.createObjectURL(v.blob);
    } catch (e) { console.error(e); toast('No se pudo crear el video: ' + e.message); }
    return;
  }
  const { fmt, escala, transp, lista } = opcionesExport();
  cargando(true);
  try {
    if (fmt === 'pdf' && $('iPapel').value !== 'diseno'){
      const hojas = await vistaHojas(lista);
      $('vista').innerHTML = '<p class="hint">Así saldrán las hojas' + (hojas.length >= 6 ? ' (se muestran las primeras 6)' : '') + '.</p>' + hojas.map(u => `<img src="${u}" style="margin-bottom:8px;box-shadow:0 1px 6px rgba(0,0,0,.2)">`).join('');
      return;
    }
    const f = (fmt === 'pdf' || fmt === 'pptx') ? 'png' : fmt, imgs = [];
    for (const it of lista) imgs.push(await renderPagina(it.p, f, Math.min(escala, 1), transp));
    $('vista').innerHTML = `<p class="hint">${fmt === 'pdf' ? 'Así se verá cada página del PDF.' : 'Clic derecho sobre la imagen → “Guardar imagen como…”'}</p>` +
      imgs.map(u => `<img src="${u}" style="margin-bottom:8px">`).join('');
  } finally { cargando(false); }
}
async function exportarDrive(){
  if (formatoExtra('drive')) return formatoExtra('drive')();
  if ($('eFormato').value === 'video'){
    try {
      const v = await obtenerVideo();
      if (v.blob.size > 35 * 1048576){ toast('El video pesa ' + (v.blob.size / 1048576).toFixed(0) + ' MB: es muy grande para mandarlo a Drive desde aquí. Usa “Descargar” o baja la calidad / los segundos.'); return; }
      cargando(true);
      const r = await gs('guardarImagen', nombreArchivo(), await blobADataURL(v.blob));
      $('eInfo').innerHTML = 'Guardado en Drive: <a href="' + r.url + '" target="_blank">' + esc(r.nombre) + '</a>';
      toast('Video guardado en Drive');
    } catch (e) { toast('Error: ' + e.message); }
    finally { cargando(false); }
    return;
  }
  const { fmt, escala, transp, lista } = opcionesExport();
  cargando(true);
  try {
    const hechos = [];
    if (fmt === 'pptx'){
      const pptx = await crearPPTX(lista, escala, $('ePptEditable').checked);
      const b64 = await pptx.write({ outputType:'base64' });
      hechos.push(await gs('guardarImagen', nombreArchivo(), 'data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,' + b64));
    } else if (fmt === 'pdf'){
      const pdf = await crearPDF(lista, escala);
      hechos.push(await gs('guardarImagen', nombreArchivo(), pdf.output('datauristring')));
    } else {
      for (const it of lista){
        const url = await renderPagina(it.p, fmt, escala, transp);
        const suf = lista.length > 1 ? '-' + (it.i + 1) : '';
        hechos.push(await gs('guardarImagen', nombreArchivo() + suf, url));
      }
    }
    $('eInfo').innerHTML = 'Guardado en Drive: ' + hechos.map(r => `<a href="${r.url}" target="_blank">${esc(r.nombre)}</a>`).join(', ');
    toast('Guardado en Drive');
  } catch (e) { toast('Error: ' + e.message); }
  finally { cargando(false); }
}


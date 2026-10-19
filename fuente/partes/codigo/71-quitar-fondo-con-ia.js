/* =========================================================
   QUITAR FONDO CON IA (funciona en tu navegador; la foto no se sube a ningún lado)
   ========================================================= */
const URL_TRANSFORMERS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
const MODELO_FONDO = 'd30social/ormbg-ortweb';   // ORMBG, licencia Apache-2.0, ~84 MB la primera vez
let segmentadorFondo = null;
function avisoProgresoIA(txt, pct){
  let a = $('progresoIA');
  if (txt === null){ if (a) a.remove(); return; }
  if (!a){ a = document.createElement('div'); a.id = 'progresoIA'; a.setAttribute('role', 'status'); a.innerHTML = '<div class="txt"></div><div class="barraIA"><i></i></div>'; document.body.appendChild(a); }
  a.querySelector('.txt').textContent = txt; a.querySelector('i').style.width = Math.max(2, Math.min(100, pct || 0)) + '%';
}
async function cargarSegmentador(){
  if (segmentadorFondo) return segmentadorFondo;
  avisoProgresoIA('Preparando la IA… (solo la primera vez descarga unos 85 MB; después queda guardada)', 2);
  const tf = await import(/* webpackIgnore: true */ URL_TRANSFORMERS);
  tf.env.allowLocalModels = false;
  const archivos = {};
  const progreso = p => {
    if (p.status === 'progress' && p.total){ archivos[p.file] = [p.loaded, p.total];
      const t = Object.values(archivos).reduce((s, [l, tt]) => [s[0] + l, s[1] + tt], [0, 0]);
      avisoProgresoIA('Descargando la IA para quitar fondos… ' + (t[0] / 1048576).toFixed(0) + ' de ' + (t[1] / 1048576).toFixed(0) + ' MB', 5 + 85 * t[0] / t[1]); }
  };
  const intentos = navigator.gpu ? [{ device:'webgpu', dtype:'fp16' }, { device:'wasm', dtype:'fp16' }] : [{ device:'wasm', dtype:'fp16' }];
  let ultimo;
  for (const op of intentos){
    try { segmentadorFondo = await tf.pipeline('image-segmentation', MODELO_FONDO, { ...op, progress_callback:progreso }); segmentadorFondo.tf = tf; return segmentadorFondo; }
    catch (e) { ultimo = e; console.warn('IA de fondo con', op.device, 'falló:', e); }
  }
  throw ultimo || new Error('No se pudo preparar la IA');
}
async function quitarFondoIA(){
  const img = imagenActiva(); if (!img) return;
  terminarRecorte(false);
  try {
    const seg = await cargarSegmentador();
    avisoProgresoIA('Buscando lo principal de la foto…', 92);
    const src = img._originalElement || img._element;
    const nw = src.naturalWidth || src.width, nh = src.naturalHeight || src.height;
    const k = Math.min(1, 2400 / Math.max(nw, nh)), cw = Math.round(nw * k), ch = Math.round(nh * k);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d', { willReadFrequently:true }); g.drawImage(src, 0, 0, cw, ch);
    try { g.getImageData(0, 0, 1, 1); } catch (e) { throw new Error('Esta imagen viene de otro sitio y no se puede editar. Descárgala y súbela desde tu computadora.'); }
    const blob = await new Promise(ok => cv.toBlob(ok, 'image/png'));
    const url = URL.createObjectURL(blob);
    let salida; try { salida = await seg(url); } finally { URL.revokeObjectURL(url); }
    const m = (Array.isArray(salida) ? salida[0] : salida).mask;
    // la máscara (gris) se vuelve la transparencia de la foto
    const mc = document.createElement('canvas'); mc.width = m.width; mc.height = m.height;
    const mg = mc.getContext('2d'), md = mg.createImageData(m.width, m.height), ch1 = m.channels || 1;
    for (let i = 0, j = 0; i < m.width * m.height; i++, j += ch1){ const a = m.data[j]; md.data[i * 4 + 3] = a; }
    mg.putImageData(md, 0, 0);
    g.globalCompositeOperation = 'destination-in'; g.imageSmoothingQuality = 'high'; g.drawImage(mc, 0, 0, cw, ch); g.globalCompositeOperation = 'source-over';
    // ¿quedó algo?
    const d = g.getImageData(0, 0, cw, ch).data; let opacos = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 30) opacos++;
    if (opacos < (cw * ch / 4) * 0.01) throw new Error('No encontré una persona u objeto claro en la foto. Prueba con «🪄 Quitar fondo».');
    const antes = { c:img.getCenterPoint(), cropX:img.cropX || 0, cropY:img.cropY || 0, width:img.width, height:img.height, sx:img.scaleX, sy:img.scaleY };
    await new Promise(ok => img.setSrc(cv.toDataURL('image/png'), ok));
    img.set({ cropX:antes.cropX * k, cropY:antes.cropY * k, width:antes.width * k, height:antes.height * k, scaleX:antes.sx / k, scaleY:antes.sy / k });
    if (img.filters && img.filters.length) img.applyFilters();
    img.setPositionByOrigin(antes.c, 'center', 'center'); img.setCoords(); img.dirty = true;
    canvas.requestRenderAll(); guardarEstado(); actualizarPanel();
    avisoProgresoIA(null); toast('¡Listo! Fondo quitado. Si algo quedó mal, deshaz con Ctrl+Z.');
  } catch (e) {
    console.error(e); avisoProgresoIA(null);
    toast((e && e.message && /fetch|network|Failed to/.test(e.message)) ? 'No se pudo descargar la IA. Revisa tu internet e intenta de nuevo.' : 'No se pudo quitar el fondo: ' + (e.message || e));
  }
}

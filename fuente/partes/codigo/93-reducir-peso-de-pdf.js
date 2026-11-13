/* =========================================================
   REDUCIR EL PESO DE UN PDF (todo en el navegador: el archivo no sale del equipo)
   Las letras, líneas y dibujos se quedan igual (siguen siendo vectores y se pueden seleccionar);
   solo se vuelven a comprimir las fotos e imágenes que traiga, y se comprimen las partes que
   venían sin comprimir. Si el resultado no pesa menos, se avisa y se conserva el original.
   ========================================================= */
const URL_PDFLIB = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
// [nombre, lado máximo de cada imagen en píxeles, calidad JPG]
const NIVELES_PDF = {
  alta:   ['Alta calidad', 2400, 0.85],
  media:  ['Recomendada', 1700, 0.74],
  maxima: ['Máxima reducción', 1200, 0.6]
};
let promesaPdfLib = null;
function cargarPdfLib(){
  if (window.PDFLib) return Promise.resolve();
  if (!promesaPdfLib) promesaPdfLib = new Promise((ok, mal) => {
    const sc = document.createElement('script'); sc.src = URL_PDFLIB; sc.onload = ok;
    sc.onerror = () => { promesaPdfLib = null; mal(new Error('No se pudo cargar la herramienta de PDF. Revisa tu internet.')); };
    document.head.appendChild(sc);
  });
  return promesaPdfLib;
}
const pesoTxt = b => b >= 1048576 ? (b / 1048576).toFixed(b >= 10485760 ? 0 : 1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
async function flujoBytes(bytes, tipo, comprimir){
  const cs = comprimir ? new CompressionStream(tipo) : new DecompressionStream(tipo);
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(cs)).arrayBuffer());
}
// quita los «predictores PNG» que usan muchas imágenes FlateDecode
function quitarPredictorPNG(datos, ancho, comps){
  const fila = ancho * comps, alto = Math.floor(datos.length / (fila + 1)), sal = new Uint8Array(fila * alto);
  for (let y = 0; y < alto; y++){
    const t = datos[y * (fila + 1)], ent = y * (fila + 1) + 1, o = y * fila, p = o - fila;
    for (let x = 0; x < fila; x++){
      const a = x >= comps ? sal[o + x - comps] : 0, b = y ? sal[p + x] : 0, c = y && x >= comps ? sal[p + x - comps] : 0, v = datos[ent + x];
      let r = v;
      if (t === 1) r = v + a; else if (t === 2) r = v + b; else if (t === 3) r = v + ((a + b) >> 1);
      else if (t === 4){ const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      sal[o + x] = r;          // Uint8Array se queda solo con 0-255
    }
  }
  return sal;
}
function deASCII85(b){
  const sal = []; let tupla = 0, n = 0, i = 0;
  if (b[0] === 60 && b[1] === 126) i = 2;                       // «<~»
  for (; i < b.length; i++){
    const c = b[i];
    if (c === 126) break;                                          // «~>»
    if (c <= 32) continue;
    if (c === 122 && n === 0){ sal.push(0, 0, 0, 0); continue; }   // «z»
    tupla = tupla * 85 + (c - 33); n++;
    if (n === 5){ sal.push((tupla >>> 24) & 255, (tupla >>> 16) & 255, (tupla >>> 8) & 255, tupla & 255); tupla = 0; n = 0; }
  }
  if (n){ for (let k = n; k < 5; k++) tupla = tupla * 85 + 84; const t = [(tupla >>> 24) & 255, (tupla >>> 16) & 255, (tupla >>> 8) & 255, tupla & 255]; sal.push(...t.slice(0, n - 1)); }
  return new Uint8Array(sal);
}
function deASCIIHex(b){
  const h = new TextDecoder().decode(b).replace(/>[\s\S]*$/, '').replace(/[^0-9a-f]/gi, ''), sal = new Uint8Array(Math.ceil(h.length / 2));
  for (let i = 0; i < sal.length; i++) sal[i] = parseInt((h.substr(i * 2, 2) + '0').slice(0, 2), 16);
  return sal;
}
// convierte una imagen del PDF en algo que se pueda dibujar; null si es de un tipo que mejor no se toca
async function imagenDelPDF(obj, L){
  const d = obj.dict, nom = k => d.get(L.PDFName.of(k));
  // los filtros de texto (ASCII85 / ASCIIHex) que van antes del de imagen se quitan primero
  let filtro = nom('Filter'), datosImg = obj.contents;
  if (filtro instanceof L.PDFArray){
    const fs = filtro.asArray().map(x => x.toString());
    for (const pre of fs.slice(0, -1)){
      if (pre === '/ASCII85Decode' || pre === '/A85') datosImg = deASCII85(datosImg);
      else if (pre === '/ASCIIHexDecode' || pre === '/AHx') datosImg = deASCIIHex(datosImg);
      else return null;
    }
    filtro = filtro.get(fs.length - 1);
  }
  const f = filtro ? filtro.toString() : '', ancho = +(nom('Width') || 0).toString(), alto = +(nom('Height') || 0).toString();
  if (!ancho || !alto || nom('ImageMask') || nom('Decode') || nom('Mask')) return null;
  let cs = nom('ColorSpace'); if (cs instanceof L.PDFRef) cs = obj.dict.context.lookup(cs);
  let comps = 0;
  if (cs instanceof L.PDFName) comps = { '/DeviceRGB':3, '/DeviceGray':1 }[cs.toString()] || 0;
  else if (cs instanceof L.PDFArray && cs.get(0).toString() === '/ICCBased'){ const icc = obj.dict.context.lookup(cs.get(1)); const n = icc && icc.dict && icc.dict.get(L.PDFName.of('N')); comps = n ? +n.toString() : 0; if (comps !== 1 && comps !== 3) comps = 0; }
  if (!comps) return null;                     // CMYK, indexadas, Lab…: se dejan como están
  if (f === '/DCTDecode'){
    try { return { fuente:await createImageBitmap(new Blob([datosImg], { type:'image/jpeg' })), ancho, alto }; } catch (e) { return null; }
  }
  if (f === '/FlateDecode'){
    if (+(nom('BitsPerComponent') || 8).toString() !== 8) return null;
    let datos = await flujoBytes(datosImg, 'deflate', false);
    const parm = nom('DecodeParms'), pred = parm && parm.get ? +((parm.get(L.PDFName.of('Predictor')) || 1).toString()) : 1;
    if (pred >= 10) datos = quitarPredictorPNG(datos, ancho, comps); else if (pred !== 1) return null;
    if (datos.length < ancho * alto * comps) return null;
    const id = new ImageData(ancho, alto), px = id.data;
    for (let i = 0, j = 0; i < ancho * alto; i++, j += comps){ const k = i * 4; if (comps === 1) px[k] = px[k + 1] = px[k + 2] = datos[j]; else { px[k] = datos[j]; px[k + 1] = datos[j + 1]; px[k + 2] = datos[j + 2]; } px[k + 3] = 255; }
    return { fuente:await createImageBitmap(id), ancho, alto };
  }
  return null;
}
async function reducirPDF(bytes, nivel, avance){
  await cargarPdfLib();
  const L = window.PDFLib, [, lado, calidad] = NIVELES_PDF[nivel];
  let doc;
  try { doc = await L.PDFDocument.load(bytes, { updateMetadata:false }); }
  catch (e) { throw new Error(/encrypt/i.test(e.message) ? 'Este PDF tiene contraseña o está protegido. Quítale la protección y vuelve a intentarlo.' : 'No se pudo leer este PDF. Puede estar dañado.'); }
  const ctx = doc.context, N = k => L.PDFName.of(k);
  const objs = ctx.enumerateIndirectObjects().filter(([, o]) => o instanceof L.PDFRawStream);
  const imgs = objs.filter(([, o]) => o.dict.get(N('Subtype')) === N('Image') && o.contents.length > 30000);
  let hechas = 0, cambiadas = 0;
  for (const [ref, o] of imgs){
    avance(hechas++ / Math.max(1, imgs.length), `Comprimiendo imágenes (${hechas} de ${imgs.length})…`);
    const im = await imagenDelPDF(o, L).catch(() => null); if (!im) continue;
    const k = Math.min(1, lado / Math.max(im.ancho, im.alto)), w = Math.max(1, Math.round(im.ancho * k)), h = Math.max(1, Math.round(im.alto * k));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c2 = cv.getContext('2d'); c2.fillStyle = '#fff'; c2.fillRect(0, 0, w, h); c2.imageSmoothingQuality = 'high'; c2.drawImage(im.fuente, 0, 0, w, h);
    if (im.fuente.close) im.fuente.close();
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', calidad)); if (!blob) continue;
    const nuevo = new Uint8Array(await blob.arrayBuffer());
    if (nuevo.length > o.contents.length * 0.9) continue;          // si casi no baja, se deja la original
    const dict = L.PDFDict.withContext(ctx);
    for (const [clave, valor] of o.dict.entries()){
      if (!['/Filter', '/DecodeParms', '/Length', '/Width', '/Height', '/ColorSpace', '/BitsPerComponent', '/Decode'].includes(clave.toString())) dict.set(clave, valor);
    }
    dict.set(N('Filter'), N('DCTDecode')); dict.set(N('Width'), L.PDFNumber.of(w)); dict.set(N('Height'), L.PDFNumber.of(h));
    dict.set(N('ColorSpace'), N('DeviceRGB')); dict.set(N('BitsPerComponent'), L.PDFNumber.of(8));
    ctx.assign(ref, L.PDFRawStream.of(dict, nuevo)); cambiadas++;
  }
  // lo que venía sin comprimir (textos de las páginas, fuentes…) se comprime sin perder nada
  avance(0.96, 'Ordenando el archivo…');
  for (const [ref, o] of objs){
    if (o.dict.get(N('Filter')) || o.contents.length < 2048 || o.dict.get(N('Type')) === N('Metadata')) continue;
    const z = await flujoBytes(o.contents, 'deflate', true);
    if (z.length < o.contents.length * 0.9){ const dict = L.PDFDict.withContext(ctx); for (const [c, v] of o.dict.entries()) if (c.toString() !== '/Length') dict.set(c, v); dict.set(N('Filter'), N('FlateDecode')); ctx.assign(ref, L.PDFRawStream.of(dict, z)); }
  }
  const sal = await doc.save({ useObjectStreams:true });
  return { bytes:sal, imagenes:imgs.length, cambiadas };
}
// ---------- ventana ----------
(function(){
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'mReducirPDF';
  m.innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="rpTitulo">
    <h3 id="rpTitulo">📉 Reducir el peso de un PDF</h3>
    <p class="hint" style="padding-top:0">Hazlo más ligero para mandarlo por WhatsApp o correo, o subirlo a una plataforma con límite. <b>Las letras quedan exactamente igual</b>; solo se comprimen las fotos e imágenes. Tu archivo no sale de tu equipo.</p>
    <label class="rpZona" id="rpZona"><input type="file" id="rpArchivo" accept="application/pdf,.pdf" multiple hidden>
      <span class="rpIco" aria-hidden="true">📄</span><b>Elige tus PDF</b><small>o arrástralos aquí · puedes elegir varios</small></label>
    <fieldset class="rpNiveles"><legend>¿Cuánto lo quieres reducir?</legend>
      <label><input type="radio" name="rpNivel" value="alta"><span><b>Poco · se ve igual</b><small>Para imprimir o cuando la calidad importa mucho</small></span></label>
      <label><input type="radio" name="rpNivel" value="media" checked><span><b>Recomendado</b><small>Se ve muy bien en pantalla e impreso normal</small></span></label>
      <label><input type="radio" name="rpNivel" value="maxima"><span><b>Lo más posible</b><small>Para WhatsApp o plataformas con límite de tamaño</small></span></label>
    </fieldset>
    <div id="rpLista" class="rpLista" aria-live="polite"></div>
    <div class="acciones"><button class="btnS" id="rpCerrar">Cerrar</button><button class="btnP" id="rpTodos" hidden>⬇ Descargar todos</button></div>
  </div>`;
  document.body.appendChild(m);
  m.addEventListener('click', e => { if (e.target === m) cerrarModal('mReducirPDF'); });
  $('rpCerrar').onclick = () => cerrarModal('mReducirPDF');
  const listos = [];
  const procesar = async archivos => {
    archivos = [...archivos].filter(f => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
    if (!archivos.length) return toast('Elige un archivo PDF');
    const nivel = (m.querySelector('[name="rpNivel"]:checked') || {}).value || 'media';
    for (const f of archivos){
      const fila = document.createElement('div'); fila.className = 'rpFila';
      fila.innerHTML = `<div class="rpNom"><b>${esc(f.name)}</b><small>${pesoTxt(f.size)} · preparando…</small></div><div class="rpBarra"><i></i></div>`;
      $('rpLista').prepend(fila);
      const det = fila.querySelector('small'), barra = fila.querySelector('.rpBarra i');
      try {
        const r = await reducirPDF(new Uint8Array(await f.arrayBuffer()), nivel, (p, t) => { barra.style.width = Math.round(p * 100) + '%'; det.textContent = pesoTxt(f.size) + ' · ' + t; });
        barra.parentNode.remove();
        if (r.bytes.length >= f.size * 0.97){
          det.innerHTML = r.imagenes && !r.cambiadas ? `${pesoTxt(f.size)} · Sus imágenes están en un formato especial (por ejemplo, CMYK de imprenta). <b>No las comprimimos para no cambiar sus colores.</b>` : `${pesoTxt(f.size)} · <b>Ya estaba ligero</b>: no se puede reducir más sin perder calidad.`;
          fila.classList.add('rpIgual'); continue;
        }
        const menos = Math.round((1 - r.bytes.length / f.size) * 100);
        const nombre = f.name.replace(/\.pdf$/i, '') + ' (reducido).pdf';
        const url = URL.createObjectURL(new Blob([r.bytes], { type:'application/pdf' }));
        det.innerHTML = `${pesoTxt(f.size)} → <b>${pesoTxt(r.bytes.length)}</b> <span class="rpMenos">${menos}% menos</span>`;
        const a = document.createElement('a'); a.className = 'btnP rpBajar'; a.href = url; a.download = nombre; a.textContent = '⬇ Descargar';
        fila.appendChild(a); listos.push(a);
        if (r.imagenes && !r.cambiadas && nivel !== 'maxima') det.insertAdjacentHTML('beforeend', '<br><span class="rpNota">Para que pese aún menos, prueba «Lo más posible».</span>');
      } catch (e) {
        barra.parentNode.remove(); fila.classList.add('rpError'); det.textContent = e.message || 'No se pudo reducir este PDF';
      }
    }
    $('rpTodos').hidden = listos.length < 2;
  };
  $('rpTodos').onclick = () => listos.forEach((a, i) => setTimeout(() => a.click(), i * 400));
  $('rpArchivo').onchange = e => { procesar(e.target.files); e.target.value = ''; };
  const z = $('rpZona');
  z.addEventListener('dragover', e => { e.preventDefault(); z.classList.add('encima'); });
  z.addEventListener('dragleave', () => z.classList.remove('encima'));
  z.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); z.classList.remove('encima'); procesar(e.dataTransfer.files); });
  // en el menú Archivo
  const b = document.createElement('button'); b.className = 'tb'; b.type = 'button'; b.textContent = '📉 Reducir el peso de un PDF';
  b.onclick = () => abrirReducirPDF();
  const extra = $('maExtra'); if (extra) extra.prepend(b);
})();
function abrirReducirPDF(){
  if (!('CompressionStream' in window)) return toast('Tu navegador es antiguo para esta herramienta. Actualízalo (Chrome, Edge, Safari o Firefox recientes).');
  abrirModal('mReducirPDF'); cargarPdfLib().catch(() => {});
}

/* =========================================================
   IMÁGENES
   ========================================================= */
function reducirImagen(dataUrl, max, cb){
  const img = new Image();
  img.onload = () => {
    const f = Math.min(1, max / Math.max(img.width, img.height));
    if (f === 1) return cb(dataUrl);
    const c = document.createElement('canvas');
    c.width = Math.round(img.width*f); c.height = Math.round(img.height*f);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const png = /^data:image\/(png|gif|webp|svg)/.test(dataUrl);
    cb(c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.9));
  };
  img.src = dataUrl;
}
function leerArchivo(file, cb){
  if (!file || !file.type.startsWith('image/')) return;
  const r = new FileReader();
  r.onload = e => reducirImagen(e.target.result, 2400, cb);
  r.readAsDataURL(file);
}
function agregarImagenURL(url){
  fabric.Image.fromURL(url, img => {
    const f = Math.min((W*0.6)/img.width, (H*0.6)/img.height, 1);
    img.set({ left:W/2, top:H/2, originX:'center', originY:'center', scaleX:f, scaleY:f,
      fx:{ b:0, c:0, s:0, bl:0, gris:false, sepia:false, inv:false } });
    agregar(img, 'Imagen');
  });
}
function miniatura(url){
  const im = document.createElement('img'); im.src = url; im.title = 'Agregar al diseño';
  im.onclick = () => { const sel = activo(); if (sel && (sel.marco || sel.marcoVacio)) llenarMarco(sel, url); else agregarImagenURL(url); };
  $('misImagenes').prepend(im);
}
function procesarArchivos(files){
  [...files].forEach(f => leerArchivo(f, url => { miniatura(url); agregarImagenURL(url); }));
}
$('archivoImg').onchange = e => { procesarArchivos(e.target.files); e.target.value = ''; };

// Arrastrar y soltar
$('area').addEventListener('dragover', e => e.preventDefault());
$('area').addEventListener('drop', e => {
  e.preventDefault();
  const archivos = [...(e.dataTransfer.files || [])].filter(f => f.type.startsWith('image/'));
  const m = archivos.length ? marcoEn(canvas.getPointer(e)) : null;
  if (m){ leerArchivo(archivos[0], url => { miniatura(url); llenarMarco(m, url); }); return; }   // soltar sobre un marco lo llena
  procesarArchivos(e.dataTransfer.files);
});
// Pegar imágenes
document.addEventListener('paste', e => {
  const o = activo(); if (o && o.isEditing) return;
  const items = [...(e.clipboardData || {}).items || []].filter(i => i.type.startsWith('image/'));
  if (items.length){ e.preventDefault(); procesarArchivos(items.map(i => i.getAsFile())); }
});

/* Filtros de imagen */
function aplicarFiltros(){
  const o = activo(); if (!o || o.type !== 'image') return;
  const F = fabric.Image.filters, fx = o.fx || (o.fx = {});
  fx.b = +$('fBrillo').value; fx.c = +$('fContraste').value; fx.s = +$('fSaturacion').value; fx.bl = +$('fBlur').value;
  o.filters = [];
  if (fx.b) o.filters.push(new F.Brightness({ brightness: fx.b/100 }));
  if (fx.c) o.filters.push(new F.Contrast({ contrast: fx.c/100 }));
  if (fx.s) o.filters.push(new F.Saturation({ saturation: fx.s/100 }));
  if (fx.bl) o.filters.push(new F.Blur({ blur: fx.bl/200 }));
  if (fx.gris) o.filters.push(new F.Grayscale());
  if (fx.sepia) o.filters.push(new F.Sepia());
  if (fx.inv) o.filters.push(new F.Invert());
  o.applyFilters(); canvas.requestRenderAll();
}
['fBrillo','fContraste','fSaturacion','fBlur'].forEach(id => {
  $(id).addEventListener('input', aplicarFiltros);
  $(id).addEventListener('change', guardarEstado);
});
function toggleFx(k){ const o = activo(); if (!o || o.type !== 'image') return; o.fx = o.fx || {}; o.fx[k] = !o.fx[k]; aplicarFiltros(); actualizarPanel(); guardarEstado(); }
$('fGris').onclick = () => toggleFx('gris');
$('fSepia').onclick = () => toggleFx('sepia');
$('fInvertir').onclick = () => toggleFx('inv');
$('fReset').onclick = () => {
  const o = activo(); if (!o || o.type !== 'image') return;
  o.fx = { b:0, c:0, s:0, bl:0, gris:false, sepia:false, inv:false };
  ['fBrillo','fContraste','fSaturacion','fBlur'].forEach(id => $(id).value = 0);
  aplicarFiltros(); actualizarPanel(); guardarEstado();
};


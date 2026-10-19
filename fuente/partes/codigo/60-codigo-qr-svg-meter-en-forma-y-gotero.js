/* =========================================================
   CÓDIGO QR, SVG, METER EN FORMA Y GOTERO
   ========================================================= */
EXTRA.push('qr', 'mascara');
// ---------- Código QR (se dibuja con figuras: se ve nítido a cualquier tamaño) ----------
const URL_QR = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
function cargarQR(){
  return new Promise((ok, mal) => {
    if (window.qrcode) return ok();
    const sc = document.createElement('script'); sc.src = URL_QR; sc.onload = ok;
    sc.onerror = () => mal(new Error('No se pudo cargar el generador de QR. Revisa tu conexión a internet.'));
    document.head.appendChild(sc);
  });
}
function crearObjetoQR(texto, color, fondo, transp, tam){
  const qr = window.qrcode(0, 'M');
  qr.stringToBytes = window.qrcode.stringToBytesFuncs['UTF-8'];
  window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs['UTF-8'];
  qr.addData(texto); qr.make();
  const n = qr.getModuleCount(), borde = 2, total = n + borde * 2, c = tam / total;
  let d = '';
  for (let r = 0; r < n; r++){
    let col = 0;
    while (col < n){
      if (!qr.isDark(r, col)){ col++; continue; }
      let fin = col; while (fin < n && qr.isDark(r, fin)) fin++;
      const x = (col + borde) * c, y = (r + borde) * c;
      d += `M${x.toFixed(2)} ${y.toFixed(2)}h${((fin - col) * c).toFixed(2)}v${c.toFixed(2)}h${(-(fin - col) * c).toFixed(2)}z`;
      col = fin;
    }
  }
  const caja = new fabric.Rect({ left:0, top:0, width:tam, height:tam, fill: transp ? 'rgba(0,0,0,0)' : fondo, rx:tam * 0.03, ry:tam * 0.03, name:'Fondo del QR' });
  const puntos = new fabric.Path(d, { fill:color, name:'Puntos del QR' });   // sin left/top: queda en su lugar exacto
  const g = new fabric.Group([caja, puntos], { name:'Código QR' });
  g.qr = { texto, color, fondo, transp:!!transp };
  return g;
}
async function crearQR(){
  const texto = $('qrTexto').value.trim();
  if (!texto) return toast('Escribe el enlace, teléfono o texto para el código QR');
  if (texto.length > 900) return toast('El texto es muy largo para un código QR (máximo unas 900 letras)');
  try { await cargarQR(); } catch (e) { return toast(e.message); }
  const sel = activo(), k = s();
  let g;
  try { g = crearObjetoQR(texto, $('qrColor').value, $('qrFondo').value, $('qrTransp').checked, 520 * k); }
  catch (e) { return toast('No se pudo crear el QR: ' + e.message); }
  if (sel && sel.qr){                         // si hay un QR seleccionado, se reemplaza en el mismo lugar y tamaño
    const c = sel.getCenterPoint(), lado = sel.getScaledWidth(), idx = canvas.getObjects().indexOf(sel);
    g.scaleToWidth(lado); g.set({ angle:sel.angle || 0 });
    g.setPositionByOrigin(c, 'center', 'center');
    restaurando = true; canvas.remove(sel); restaurando = false;
    g.id = nuevoId(); canvas.insertAt(g, idx); canvas.setActiveObject(g);
    canvas.requestRenderAll(); renderCapas(); guardarEstado();
    return toast('Código QR actualizado');
  }
  g.setPositionByOrigin(new fabric.Point(W / 2, H / 2), 'center', 'center');
  agregar(g, 'Código QR'); renderCapas(); guardarEstado();
  toast('Código QR listo. Pruébalo con la cámara de tu celular antes de imprimir.');
}

// ---------- Exportar en SVG (vectorial: para logos, imprenta, lonas y playeras) ----------
function fuentesDe(objs){
  const f = {};
  const peso = w => w === 'bold' ? 700 : w === 'normal' || !w ? 400 : Math.round(+w / 100) * 100 || 400;
  const ver = o => {
    if (o.fontFamily && !['Arial','Georgia','Times New Roman','Courier New','Verdana'].includes(o.fontFamily)) (f[o.fontFamily] = f[o.fontFamily] || new Set()).add(peso(o.fontWeight));
    if (o.getObjects) o.getObjects().forEach(ver);
  };
  objs.forEach(ver);
  return f;
}
// Mete las letras dentro del SVG (así se ve igual en otra computadora). Si no hay internet, solo deja el enlace.
const cacheFuentesSVG = {};
const aDataURL = blob => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
async function cssDeFuente(familia, pesos){
  const base = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(familia).replace(/%20/g, '+');
  const clave = familia + '|' + pesos.join(';');
  if (cacheFuentesSVG[clave]) return cacheFuentesSVG[clave];
  let res = pesos.length && !(pesos.length === 1 && pesos[0] === 400) ? await fetch(base + ':wght@' + pesos.join(';') + '&display=swap') : null;
  if (!res || !res.ok) res = await fetch(base + '&display=swap');        // la fuente no tiene esos grosores: se usa la normal
  if (!res.ok) throw new Error('sin fuente');
  let css = (await res.text()).split(/(?=\/\*)/).filter(b => /\/\* (latin|latin-ext) \*\//.test(b) || !/\/\*/.test(b)).join('');
  for (const u of [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]))])
    css = css.split(u).join(await aDataURL(await (await fetch(u)).blob()));
  return (cacheFuentesSVG[clave] = css);
}
async function incrustarFuentes(fuentes){
  let css = '';
  for (const [f, pesos] of Object.entries(fuentes)){
    try { css += await cssDeFuente(f, [...pesos].sort((a, b) => a - b)); }
    catch (e) { css += `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, '+')}&amp;display=swap');`; }
  }
  return css;
}
function crearSVG(json, transp){
  return new Promise(ok => {
    const sc = new fabric.StaticCanvas(document.createElement('canvas'), { width:W, height:H, enableRetinaScaling:false, renderOnAddRemove:false });
    const j = JSON.parse(JSON.stringify(json || PAGINA_VACIA()));
    if (transp) j.background = null;
    sc.loadFromJSON(j, () => {
      let svg = sc.toSVG({ width:W, height:H, viewBox:{ x:0, y:0, width:W, height:H } });
      const fs = fuentesDe(sc.getObjects());
      sc.dispose();
      if (!Object.keys(fs).length) return ok(svg);
      incrustarFuentes(fs).then(css => {
        const i = svg.indexOf('>', svg.indexOf('<svg'));
        ok(svg.slice(0, i + 1) + `\n<style>${css}</style>` + svg.slice(i + 1));
      });
      return;
    });
  });
}
// fabric no pasa al SVG el giro ni la escala de las rayas: aquí se escribe el patrón completo
fabric.Pattern.prototype.toSVG = function(object){
  const src = typeof this.source === 'function' ? this.source() : this.source;
  const url = src.src || (src.toDataURL ? src.toDataURL() : '');
  const po = (object.type === 'path' && object.pathOffset) ? object.pathOffset : { x:0, y:0 };
  const ox = -object.width / 2 + po.x + (this.offsetX || 0), oy = -object.height / 2 + po.y + (this.offsetY || 0);
  const m = this.patternTransform ? ' matrix(' + this.patternTransform.join(' ') + ')' : '';
  return '<pattern id="SVGID_' + this.id + '" patternUnits="userSpaceOnUse" x="0" y="0" width="' + src.width + '" height="' + src.height +
    '" patternTransform="translate(' + ox + ' ' + oy + ')' + m + '">\n<image x="0" y="0" width="' + src.width + '" height="' + src.height +
    '" xlink:href="' + url + '"></image>\n</pattern>\n';
};
const svgADataURL = t => 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(t)));
FORMATO('svg').descargar = async function(){
  canvas.discardActiveObject(); canvas.requestRenderAll();
  const lista = paginasAExportar(), transp = $('eTransp').checked;
  cargando(true);
  try {
    for (const it of lista){
      const svg = await crearSVG(it.p, transp), suf = lista.length > 1 ? '-' + (it.i + 1) : '';
      bajarBlob(new Blob([svg], { type:'image/svg+xml' }), nombreArchivo() + suf + '.svg');
      await new Promise(r => setTimeout(r, 400));
    }
    toast('SVG descargado. Las letras se ven igual si la computadora o la imprenta tiene esa fuente; si no, pide que lo abran con internet o usa PDF.');
  } catch (e) { toast('Error al exportar: ' + e.message); }
  finally { cargando(false); }
};
FORMATO('svg').vista = async function(){
  const lista = paginasAExportar(), transp = $('eTransp').checked;
  cargando(true);
  try {
    const imgs = []; for (const it of lista) imgs.push(svgADataURL(await crearSVG(it.p, transp)));
    $('vista').innerHTML = '<p class="hint">Vista del SVG (vectorial: puedes agrandarlo sin que pierda calidad).</p>' +
      imgs.map(u => `<img src="${u}" style="margin-bottom:8px;background:repeating-conic-gradient(#ccc 0 25%,#fff 0 50%) 0 0/16px 16px">`).join('');
  } finally { cargando(false); }
};
FORMATO('svg').drive = async function(){
  const lista = paginasAExportar(), transp = $('eTransp').checked;
  cargando(true);
  try {
    const hechos = [];
    for (const it of lista){
      const suf = lista.length > 1 ? ' (' + (it.i + 1) + ')' : '';
      hechos.push(await gs('guardarImagen', nombreArchivo() + suf, svgADataURL(await crearSVG(it.p, transp))));
    }
    $('eInfo').innerHTML = 'Guardado: ' + hechos.map(r => `<a href="${r.url}" target="_blank">${esc(r.nombre)}</a>`).join(', ');
    toast('SVG guardado');
  } catch (e) { toast('Error: ' + e.message); }
  finally { cargando(false); }
};
(function(){
  const op = document.createElement('option'); op.value = 'svg'; op.textContent = 'SVG (vectorial, para logos e imprenta)';
  const pdf = $('eFormato').querySelector('option[value="pdf"]'); pdf.after(op);
  $('eFormato').addEventListener('change', () => { if ($('eFormato').value === 'svg') $('eTransp').disabled = false; });
})();

// ---------- Meter en una forma (lo de abajo solo se ve dentro de la forma de arriba) ----------
async function meterEnForma(){
  const sel = activo();
  if (!sel || sel.type !== 'activeSelection' || sel.getObjects().length < 2)
    return toast('Selecciona lo que quieres meter y la forma que va encima (Shift + clic en los dos)');
  const orden = o => canvas.getObjects().indexOf(o);
  const objs = sel.getObjects().slice().sort((a, b) => orden(a) - orden(b));
  const forma = objs[objs.length - 1], contenido = objs.slice(0, -1);
  if (forma.type === 'image' || forma.esFondo) return toast('Pon encima una forma (círculo, estrella, letra…): esa será el molde');
  canvas.discardActiveObject();
  const idx = orden(contenido[0]);
  const datosForma = forma.toObject(EXTRA);
  const molde = await clonarPromesa(forma);
  restaurando = true;
  [...contenido, forma].forEach(o => canvas.remove(o));
  const g = new fabric.Group(contenido, { name:'Dentro de ' + (forma.name || 'una forma') });
  const c = g.getCenterPoint(), fc = forma.getCenterPoint();
  molde.set({ originX:'center', originY:'center', left:fc.x - c.x, top:fc.y - c.y, shadow:null, opacity:1 });
  g.clipPath = molde; g.mascara = datosForma; g.id = nuevoId();
  canvas.insertAt(g, idx);
  restaurando = false;
  canvas.setActiveObject(g); canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado();
  toast('Listo. Para mover lo de adentro o cambiar la forma, pulsa “Sacar de la forma”.');
}
function sacarDeForma(){
  const g = activo();
  if (!g || !g.mascara) return;
  const datos = g.mascara, idx = canvas.getObjects().indexOf(g);
  restaurando = true;
  g.clipPath = null; g.mascara = null;
  const sel = g.toActiveSelection();
  restaurando = false;
  fabric.util.enlivenObjects([datos], ([forma]) => {
    restaurando = true;
    canvas.insertAt(forma, idx + sel.getObjects().length);
    restaurando = false;
    canvas.discardActiveObject(); canvas.setActiveObject(forma);
    canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado();
  });
}
const agruparToggleBase23 = agruparToggle;
agruparToggle = function(){ const o = activo(); if (o && o.mascara) return sacarDeForma(); return agruparToggleBase23.apply(this, arguments); };

// ---------- Gotero: tomar un color del diseño o de la pantalla ----------
function ponerColorTomado(hex){
  hex = aHex(hex);
  if (activo()){
    $('pRelleno').value = hex;
    $('pRelleno').dispatchEvent(new Event('input')); $('pRelleno').dispatchEvent(new Event('change'));
    toast('Color aplicado: ' + hex.toUpperCase());
  } else {
    $('colorForma').value = hex;
    toast('Color tomado: ' + hex.toUpperCase() + '. Se usará en las formas nuevas.');
  }
}
async function gotero(){
  if (window.EyeDropper){
    try { const r = await new window.EyeDropper().open(); return ponerColorTomado(r.sRGBHex); }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  // Sin gotero del navegador (celular, Firefox, Safari): toca un punto de tu diseño
  const el = canvas.lowerCanvasEl, r = el.getBoundingClientRect();
  const capa = document.createElement('div');
  capa.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:60;cursor:crosshair;touch-action:none`;
  const salir = () => { capa.remove(); document.removeEventListener('keydown', esc_); };
  const esc_ = e => { if (e.key === 'Escape') salir(); };
  capa.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    try {
      const x = Math.floor((e.clientX - r.left) * el.width / r.width), y = Math.floor((e.clientY - r.top) * el.height / r.height);
      const d = el.getContext('2d').getImageData(x, y, 1, 1).data;
      ponerColorTomado(d[3] < 10 ? '#ffffff' : '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''));
    } catch (err) { toast('No se pudo leer ese color (imagen de otra página). Prueba en otra parte del diseño.'); }
    salir();
  });
  document.addEventListener('keydown', esc_);
  document.body.appendChild(capa);
  if (document.body.classList.contains('tactil')) alternarProps(false);
  toast('Toca o haz clic en el lugar de tu diseño del que quieres el color (Esc para cancelar)');
}

// ---------- Panel: mostrar los botones que tocan según lo seleccionado ----------
alActualizarPanel(function(){
  if (generandoVista) return;
  const o = activo(); if (!o) return;
  $('bMeterForma').hidden = !(o.type === 'activeSelection' && o.getObjects().length >= 2);
  $('bSacarForma').hidden = !o.mascara;
  if (o.mascara) $('bAgrupar').hidden = true;
  if (o.qr){ $('qrTexto').value = o.qr.texto; $('qrColor').value = aHex(o.qr.color); $('qrFondo').value = aHex(o.qr.fondo); $('qrTransp').checked = !!o.qr.transp; }
  $('bEditarQR').hidden = !o.qr;
});
function editarQRSeleccionado(){
  const b = document.querySelector('#pestanas button[data-tab="tElementos"]'); if (b) b.click();
  setTimeout(() => { const t = $('qrTexto'); t.scrollIntoView({ block:'center' }); t.focus(); t.select(); }, 150);
}


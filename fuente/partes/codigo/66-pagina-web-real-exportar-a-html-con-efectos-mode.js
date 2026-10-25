/* =========================================================
   PÁGINA WEB REAL: EXPORTAR A HTML CON EFECTOS, MODELOS 3D Y CAMBIADOR DE PRODUCTOS
   ========================================================= */
EXTRA.push('hover', 'scrollFx', 'modelo3d', 'variantes');
const URL_MV = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.3.1/dist/model-viewer-umd.min.js';
const URL_MODELOS = 'https://gamerpc.github.io/disenador/modelos/';
let promesaMV = null;
function cargarModelViewer(){
  if (customElements.get('model-viewer')) return Promise.resolve();
  return promesaMV = promesaMV || new Promise((ok, mal) => {
    const s = document.createElement('script'); s.src = URL_MV;
    s.onload = () => customElements.whenDefined('model-viewer').then(ok);
    s.onerror = () => { promesaMV = null; mal(new Error('No se pudo cargar el visor 3D. Revisa tu conexión a internet.')); };
    document.head.appendChild(s);
  });
}
// ---------- modelo 3D: en el editor se ve como una foto (póster) y en la página web gira de verdad ----------
function posterVacio3D(w, h, texto, comoCanvas){
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(99,102,241,.18)'); g.addColorStop(1, 'rgba(236,72,153,.18)');
  x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(99,102,241,.6)'; x.setLineDash([12, 8]); x.lineWidth = 3; x.strokeRect(2, 2, w - 4, h - 4);
  x.fillStyle = '#4f46e5'; x.textAlign = 'center'; x.font = `${Math.round(Math.min(w, h) / 5)}px sans-serif`; x.fillText('🧊', w / 2, h / 2);
  x.font = `600 ${Math.max(14, Math.round(Math.min(w, h) / 16))}px Inter, sans-serif`; x.fillText(texto || 'Cargando modelo 3D…', w / 2, h / 2 + Math.min(w, h) / 8);
  return comoCanvas ? c : c.toDataURL('image/png');
}
async function fotoDeModelo(cfg, w, h, color){
  await cargarModelViewer();
  const k = Math.min(1, 700 / Math.max(w, h)), mv = document.createElement('model-viewer');
  mv.style.cssText = `position:fixed;left:0;top:0;width:${Math.round(w * k)}px;height:${Math.round(h * k)}px;opacity:.01;pointer-events:none;z-index:-1;background:transparent`;
  mv.setAttribute('src', cfg.src); mv.setAttribute('camera-orbit', cfg.camara || '30deg 75deg auto'); mv.setAttribute('shadow-intensity', '1');
  mv.setAttribute('exposure', '1.1'); mv.setAttribute('interaction-prompt', 'none'); mv.setAttribute('disable-tap', '');
  document.body.appendChild(mv);
  try {
    await new Promise((ok, mal) => { mv.addEventListener('load', ok, { once:true }); mv.addEventListener('error', () => mal(new Error('No se pudo abrir el modelo 3D (usa un archivo .glb)')), { once:true }); setTimeout(() => mal(new Error('El modelo 3D tardó demasiado')), 25000); });
    if (color) pintarModelo(mv, color, cfg.material);
    await new Promise(r => setTimeout(r, 500));
    for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r));
    const animaciones = mv.availableAnimations || [];
    return { url: mv.toDataURL('image/png'), animaciones };
  } finally { mv.style.visibility = 'hidden'; setTimeout(() => mv.remove(), 3000); }
}
function pintarModelo(mv, color, mat){
  const mats = mv.model ? mv.model.materials : [];
  const m = mats.find(x => x.name === mat) || mats[+mat || 0]; if (!m) return;
  const c = new fabric.Color(color).getSource(); m.pbrMetallicRoughness.setBaseColorFactor([c[0] / 255, c[1] / 255, c[2] / 255, 1]);
}
function crearObjeto3D(cfg, cx, cy, w, h){
  const el = posterVacio3D(Math.round(w), Math.round(h), null, true);
  const img = new fabric.Image(el, { originX:'center', originY:'center', left:cx, top:cy, name:'Modelo 3D', id:nuevoId() });
  img.modelo3d = Object.assign({ giro:true, scroll:'no', camara:'30deg 75deg auto', colores:[], material:0, animacion:'' }, cfg);
  if (!generandoVista) actualizarPoster(img, w, h);
  return img;
}
async function actualizarPoster(o, w, h){
  w = w || o.getScaledWidth(); h = h || o.getScaledHeight();
  try {
    const col = o.modelo3d.colores && o.modelo3d.colores[0];
    const r = await fotoDeModelo(o.modelo3d, w, h, col && col.color);
    if (!o.modelo3d.animacion && r.animaciones.length) o.modelo3d.animacion = r.animaciones[0];
    o.modelo3d.listaAnim = r.animaciones;
    await new Promise(ok => o.setSrc(r.url, ok));
  } catch (e) {
    await new Promise(ok => o.setSrc(posterVacio3D(Math.round(w), Math.round(h), 'Modelo 3D (se ve en la página web)'), ok));
    toast(e.message);
  }
  o.set({ scaleX:w / o.width, scaleY:h / o.height }); o.setCoords();
  const c = o.canvas; if (c && c.contextContainer) c.requestRenderAll();
  if (o.canvas === canvas && !generandoVista){ actualizarPanel(); guardarEstado(); }
}
const MAX_GLB = 8 * 1024 * 1024;
function subirModelo3D(file){
  if (!file) return;
  if (!/\.(glb|gltf)$/i.test(file.name)) return toast('Usa un modelo 3D en formato .glb');
  if (file.size > MAX_GLB) return toast('El modelo pesa ' + (file.size / 1048576).toFixed(1) + ' MB. Usa uno de menos de 8 MB, o pega su dirección web con «🔗 Modelo desde internet».');
  const r = new FileReader();
  r.onload = () => insertarModelo3D({ src:r.result, nombre:file.name.replace(/\.[^.]+$/, '') });
  r.readAsDataURL(file);
}
function modeloDesdeURL(){
  const u = prompt('Pega la dirección del modelo 3D (.glb). Debe permitir abrirse desde otras páginas, por ejemplo uno subido a tu GitHub Pages.');
  if (u && /^https:\/\//i.test(u.trim())) insertarModelo3D({ src:u.trim(), nombre:'Modelo 3D' });
}
function insertarModelo3D(cfg){
  const s = Math.min(W, H) * 0.6;
  const o = crearObjeto3D(cfg, W / 2, H / 2, s, s);
  agregar(o, 'Modelo 3D'); renderCapas(); guardarEstado();
  toast('Modelo 3D agregado. En «Presentar» y en la página web (Descargar → Página web) se puede girar con el dedo o el mouse.');
}
const EJEMPLOS_3D = {
  audifonos:{ src:URL_MODELOS + 'audifonos-demo.glb', nombre:'Audífonos (se desarman)', camara:'25deg 80deg auto', scroll:'ambos' },
  lata:{ src:URL_MODELOS + 'lata-demo.glb', nombre:'Lata de bebida', camara:'0deg 80deg auto', material:'lata',
    colores:[{ nombre:'Cereza', color:'#d61f1f', fondo:'#ffe1e1' }, { nombre:'Limón', color:'#3fae2a', fondo:'#e6f9dc' }, { nombre:'Mango', color:'#f08c00', fondo:'#fff0d6' }] }
};
// ---------- cambiador de productos (fotos que se cambian y el fondo cambia de color) ----------
function colorDominante(img){
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  try { x.drawImage(img, 0, 0, 32, 32); const d = x.getImageData(0, 0, 32, 32).data; let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4){ if (d[i + 3] < 128) continue; const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
      const w = (mx - mn) + 8; if (mx > 245 && mn > 235) continue; r += d[i] * w; g += d[i + 1] * w; b += d[i + 2] * w; n += w; }
    if (!n) return '#f3f4f6';
    const mez = v => Math.round(v / n * 0.35 + 255 * 0.65);
    return '#' + [mez(r), mez(g), mez(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  } catch (e) { return '#f3f4f6'; }
}
function grupoCambiador(variantes, w, h, i0){
  return new Promise(ok => {
    const v = variantes[i0 || 0];
    fabric.Image.fromURL(v.src, img => {
      const zona = h - 40, k = Math.min(w / img.width, zona / img.height);
      img.set({ originX:'center', originY:'center', left:0, top:-20, scaleX:k, scaleY:k });
      const partes = [new fabric.Rect({ originX:'center', originY:'center', left:0, top:0, width:w, height:h, fill:'rgba(0,0,0,0)' }), img];
      const n = variantes.length, sep = 22;
      variantes.forEach((x, i) => partes.push(new fabric.Circle({ originX:'center', originY:'center', left:(i - (n - 1) / 2) * sep, top:h / 2 - 10, radius: i === (i0 || 0) ? 7 : 5, fill: i === (i0 || 0) ? '#111827' : 'rgba(17,24,39,.3)' })));
      partes.push(new fabric.Text('‹', { originX:'center', originY:'center', left:-w / 2 + 18, top:-20, fontSize:54, fill:'rgba(17,24,39,.55)', fontFamily:'Inter' }),
        new fabric.Text('›', { originX:'center', originY:'center', left:w / 2 - 18, top:-20, fontSize:54, fill:'rgba(17,24,39,.55)', fontFamily:'Inter' }));
      const g = new fabric.Group(partes, { name:'Cambiador de productos', id:nuevoId() });
      g.variantes = variantes.map(x => ({ src:x.src, fondo:x.fondo, nombre:x.nombre || '' }));
      ok(g);
    }, { crossOrigin:'anonymous' });
  });
}
async function crearCambiador(){
  const sel = canvas.getActiveObjects().filter(o => o.type === 'image' && !o.modelo3d);
  if (sel.length < 2) return toast('Selecciona 2 o más fotos de tus productos (con Shift o arrastrando un recuadro) y vuelve a pulsar «Cambiador de productos».');
  const variantes = sel.sort((a, b) => a.left - b.left).map(o => {
    const el = o.getElement(); return { src:o.toDataURL({ format:'png', multiplier:Math.min(2, 900 / Math.max(o.getScaledWidth(), o.getScaledHeight())) }), fondo:colorDominante(el), nombre:o.name || '' }; });
  const w = Math.max(...sel.map(o => o.getScaledWidth())) * 1.25, h = Math.max(...sel.map(o => o.getScaledHeight())) + 60;
  const c = canvas.getActiveObject().getCenterPoint();
  canvas.discardActiveObject(); sel.forEach(o => canvas.remove(o));
  const g = await grupoCambiador(variantes, w, h);
  g.setPositionByOrigin(c, 'center', 'center');
  agregar(g, 'Cambiador de productos'); fondoColor(variantes[0].fondo); renderCapas(); guardarEstado();
  toast('¡Listo! En la página web cada producto aparece con una animación y el fondo cambia de color. Cambia los colores con «🎨 Fondos».');
}
function editarFondosCambiador(){
  const o = activo(); if (!o) return;
  const lista = o.variantes || (o.modelo3d && o.modelo3d.colores);
  if (!lista || !lista.length) return;
  const r = prompt('Color de fondo de cada producto, separados por comas (en orden):', lista.map(x => x.fondo).join(', '));
  if (r === null) return;
  const cs = r.split(',').map(s => s.trim()).filter(Boolean);
  if (cs.some(c => !/^#[0-9a-f]{3,8}$/i.test(c))) return toast('Escribe colores como #ffe1e1');
  lista.forEach((x, i) => { if (cs[i]) x.fondo = cs[i]; });
  if (cs[0]) fondoColor(cs[0]); guardarEstado(); toast('Fondos actualizados');
}
function editarColores3D(){
  const o = activo(); if (!o || !o.modelo3d) return;
  const m = o.modelo3d;
  const r = prompt('Colores del producto (la persona los elige en la página web). Escribe nombre=color de producto/color de fondo, separados por comas.\nEjemplo: Cereza=#d61f1f/#ffe1e1, Limón=#3fae2a/#e6f9dc\nDéjalo vacío para quitar los colores.',
    (m.colores || []).map(c => `${c.nombre}=${c.color}/${c.fondo}`).join(', '));
  if (r === null) return;
  const res = [];
  for (const parte of r.split(',').map(s => s.trim()).filter(Boolean)){
    const mm = parte.match(/^(.*?)=\s*(#[0-9a-f]{3,8})\s*(?:\/\s*(#[0-9a-f]{3,8}))?$/i);
    if (!mm) return toast('No entendí «' + parte + '». Usa nombre=#color/#fondo');
    res.push({ nombre:mm[1].trim(), color:mm[2], fondo:mm[3] || '#ffffff' });
  }
  m.colores = res; if (res[0]) fondoColor(res[0].fondo);
  actualizarPoster(o); toast(res.length ? 'Colores guardados: en la página web aparecen botones para cambiarlo' : 'Colores quitados');
}
function vista3DEnVivo(){
  const o = activo(); if (!o || !o.modelo3d) return;
  cargarModelViewer().then(() => {
    const m = o.modelo3d, fondo = document.createElement('div');
    fondo.id = 'vivo3D'; fondo.innerHTML = `<div class="caja3D"><model-viewer src="${esc(m.src)}" camera-controls camera-orbit="${esc(m.camara)}" shadow-intensity="1" exposure="1.1" style="width:100%;height:60vh;background:#f3f4f6;border-radius:12px"></model-viewer>
      <p class="hint">Gira el modelo con el mouse o el dedo hasta el ángulo que quieras.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btnP" id="v3Usar">✔ Usar este ángulo</button>${(m.listaAnim || []).length ? '<button class="pb" id="v3Anim">▶ Ver animación</button>' : ''}<button class="pb" id="v3Cerrar">Cerrar</button></div></div>`;
    document.body.appendChild(fondo);
    const mv = fondo.querySelector('model-viewer');
    if (m.colores && m.colores[0]) mv.addEventListener('load', () => pintarModelo(mv, m.colores[0].color, m.material), { once:true });
    fondo.querySelector('#v3Cerrar').onclick = () => fondo.remove();
    const ba = fondo.querySelector('#v3Anim'); if (ba) ba.onclick = () => { mv.animationName = m.animacion; mv.play({ repetitions:1, pingpong:true }); };
    fondo.querySelector('#v3Usar').onclick = () => { const c = mv.getCameraOrbit(); m.camara = `${(c.theta * 180 / Math.PI).toFixed(1)}deg ${(c.phi * 180 / Math.PI).toFixed(1)}deg auto`; fondo.remove(); actualizarPoster(o); };
  }, e => toast(e.message));
}
// ---------- panel de propiedades: efectos para la página web ----------
alActualizarPanel(function(){
  if (generandoVista) return;
  const o = activo(); if (!o) return;
  $('pHover').value = o.hover || ''; $('pScrollFx').value = o.scrollFx || '';
  const es3D = !!o.modelo3d;
  $('fila3D').hidden = !es3D;
  if (es3D){ $('p3Giro').checked = o.modelo3d.giro !== false; $('p3Scroll').value = o.modelo3d.scroll || 'no';
    $('p3Scroll').querySelectorAll('option[data-anim]').forEach(op => op.disabled = !(o.modelo3d.listaAnim || []).length && !o.modelo3d.animacion); }
  $('bFondosCamb').hidden = !(o.variantes || (es3D && o.modelo3d.colores && o.modelo3d.colores.length));
});
$('pHover').onchange = e => { const o = activo(); if (!o) return; o.hover = e.target.value || null; guardarEstado(); };
$('pScrollFx').onchange = e => { const o = activo(); if (!o) return; o.scrollFx = e.target.value || null; guardarEstado(); };
$('p3Giro').onchange = e => { const o = activo(); if (o && o.modelo3d){ o.modelo3d.giro = e.target.checked; guardarEstado(); } };
$('p3Scroll').onchange = e => { const o = activo(); if (o && o.modelo3d){ o.modelo3d.scroll = e.target.value; guardarEstado(); } };
$('archivo3D').addEventListener('change', e => { subirModelo3D(e.target.files[0]); e.target.value = ''; });

// ---------- en «Presentar» los modelos 3D se pueden girar ----------
const construirDiapositivaBase29 = construirDiapositiva;
construirDiapositiva = function(i, cb){
  construirDiapositivaBase29(i, d => {
    const objs = d.sc.getObjects().filter(o => o.modelo3d);
    if (objs.length) cargarModelViewer().then(() => {
      const z = d.sc.getZoom(), el = d.wrap.querySelector('canvas');
      objs.forEach(o => {
        const r = o.getBoundingRect(true, true), m = o.modelo3d, mv = document.createElement('model-viewer');
        mv.className = 'mv3DPres'; mv.setAttribute('src', m.src); mv.setAttribute('camera-orbit', m.camara); mv.setAttribute('camera-controls', '');
        if (m.giro !== false) mv.setAttribute('auto-rotate', ''); mv.setAttribute('shadow-intensity', '1'); mv.setAttribute('interaction-prompt', 'none');
        mv.style.cssText = `position:absolute;left:${el.offsetLeft + r.left * z}px;top:${el.offsetTop + r.top * z}px;width:${r.width * z}px;height:${r.height * z}px;background:transparent`;
        mv.addEventListener('load', () => { if (m.colores && m.colores[0]) pintarModelo(mv, m.colores[0].color, m.material); o.visible = false; d.sc.requestRenderAll(); }, { once:true });
        mv.addEventListener('click', e => e.stopPropagation());
        d.wrap.appendChild(mv);
      });
    }, () => {});
    cb(d);
  });
};

/* ---------- convertir el diseño en una página web ---------- */
function textoHTMLSimple(o){
  if (!['textbox', 'i-text', 'text'].includes(o.type) || typeof o.fill !== 'string' || o.path || o.clipPath || o.skewX || o.skewY) return false;
  const st = o.styles || {}; if (Object.values(st).some(l => l && Object.keys(l).length)) return false;
  return !(o.fill.toLive || (o.stroke && o.stroke.toLive));
}
const escH = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function htmlDeTexto(o, bx, by){
  const m = o.calcTransformMatrix(); m[4] -= bx; m[5] -= by;
  const fs = o.fontSize, lh = fs * o.lineHeight * o._fontSizeMult;
  const crudas = o.textLines || String(o.text).split('\n');
  const lineas = crudas.map(l => escH(l).replace(/ /g, '&#32;') || '&nbsp;');
  const duro = i => o.type !== 'textbox' || !o.isEndOfWrapping || o.isEndOfWrapping(i);
  const sombra = o.shadow ? `text-shadow:${o.shadow.offsetX || 0}px ${o.shadow.offsetY || 0}px ${o.shadow.blur || 0}px ${o.shadow.color};` : '';
  const borde = o.stroke && o.strokeWidth ? `-webkit-text-stroke:${o.strokeWidth}px ${o.stroke};paint-order:stroke fill;` : '';
  const deco = [o.underline && 'underline', o.linethrough && 'line-through', o.overline && 'overline'].filter(Boolean).join(' ');
  const css = `position:absolute;left:0;top:0;width:${o.width}px;height:${o.height}px;transform-origin:0 0;transform:matrix(${m.map(v => +v.toFixed(4)).join(',')}) translate(-50%,-50%);` +
    `font-family:'${o.fontFamily}',sans-serif;font-size:${fs}px;font-weight:${o.fontWeight};font-style:${o.fontStyle || 'normal'};line-height:${lh}px;color:${o.fill};` +
    `text-align:${o.textAlign === 'justify' ? 'justify' : o.textAlign};letter-spacing:${(o.charSpacing || 0) / 1000}em;white-space:nowrap;` +
    (deco ? `text-decoration:${deco};` : '') + (o.backgroundColor ? `background:${o.backgroundColor};` : '') + sombra + borde +
    (o.opacity < 1 ? `opacity:${o.opacity};` : '');
  return `<div class="t" style="${css}">${lineas.map((l, i) => l + (i < lineas.length - 1 ? (duro(i) ? '<br>' : ' <br class="w">') : '')).join('')}</div>`;
}
function rectSimple(o){
  return o.type === 'rect' && typeof o.fill === 'string' && !((o.angle || 0) % 360) && !o.skewX && !o.skewY && !o.clipPath && !(o.stroke && o.stroke.toLive);
}
function htmlDeRect(o){
  const sx = o.scaleX || 1, sy = o.scaleY || 1, sw = o.stroke && o.strokeWidth ? o.strokeWidth * (o.strokeUniform ? 1 : sx) : 0;
  const sh = o.shadow ? `box-shadow:${o.shadow.offsetX || 0}px ${o.shadow.offsetY || 0}px ${o.shadow.blur || 0}px ${o.shadow.color};` : '';
  return `<div class="r" style="position:absolute;inset:0;background:${o.fill};border-radius:${(o.rx || 0) * sx}px/${(o.ry || o.rx || 0) * sy}px;` +
    (sw ? `border:${sw}px ${o.strokeDashArray ? 'dashed' : 'solid'} ${o.stroke};` : '') + sh + (o.opacity < 1 ? `opacity:${o.opacity};` : '') + '"></div>';
}
function svgDeObjeto(o, r){
  const svg = o.toSVG();
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%" height="100%" viewBox="${r.left} ${r.top} ${r.width} ${r.height}" style="overflow:visible;display:block">${svg}</svg>`;
}
function cajaDe(o){
  const r = o.getBoundingRect(true, true), pad = Math.ceil((o.shadow ? (o.shadow.blur || 0) + Math.max(Math.abs(o.shadow.offsetX || 0), Math.abs(o.shadow.offsetY || 0)) : 0) + (o.strokeWidth || 0) + 2);
  return { left:Math.floor(r.left - pad), top:Math.floor(r.top - pad), width:Math.ceil(r.width + 2 * pad), height:Math.ceil(r.height + 2 * pad) };
}
const ANIM_CSS = { arriba:'arriba', abajo:'abajo', izquierda:'izquierda', derecha:'derecha', zoom:'zoom', rebote:'rebote', girar:'girar', aparecer:'aparecer', escribir:'aparecer', caer:'abajo', voltear:'zoom', diagonal:'izquierda', encoger:'aparecer' };
async function paginaAHTML(json, num, ctx){
  const sc = new fabric.StaticCanvas(document.createElement('canvas'), { width:W, height:H, enableRetinaScaling:false, renderOnAddRemove:false });
  const j = JSON.parse(JSON.stringify(json || PAGINA_VACIA()));
  await new Promise(ok => sc.loadFromJSON(j, ok));
  let fondo = typeof sc.backgroundColor === 'string' && sc.backgroundColor ? sc.backgroundColor : '#ffffff', fondoImg = '';
  if ((sc.backgroundColor && typeof sc.backgroundColor !== 'string') || sc.backgroundImage){
    const objs = sc.getObjects().slice(); objs.forEach(o => o.visible = false); sc.renderAll();
    fondoImg = sc.toDataURL({ format:'jpeg', quality:.9 }); objs.forEach(o => o.visible = true); fondo = '#ffffff';
  }
  Object.assign(ctx.fuentes, fuentesDe(sc.getObjects()));
  const animados = sc.getObjects().filter(o => o.anim && o.anim.tipo && o.anim.tipo !== 'ninguna').sort((a, b) => (a.anim.orden || 0) - (b.anim.orden || 0));
  const items = [];
  let primerCambio = null, idx = 0;
  for (const o of sc.getObjects()){
    idx++;
    if (o.visible === false) continue;
    if (o.marcoVacio){ ctx.vacios++; continue; }
    if (o.type === 'conector' && (o.opacity === 0)) continue;
    const esRect = rectSimple(o);
    const r = o.modelo3d || esRect ? o.getBoundingRect(true, true) : cajaDe(o);
    let dentro, tipo = 'otro';
    if (o.modelo3d){
      const m = o.modelo3d; ctx.usa3D = true;
      const at = [`src="${escH(m.src)}"`, `camera-orbit="${escH(m.camara)}"`, 'shadow-intensity="1"', 'exposure="1.1"', 'interaction-prompt="none"', 'camera-controls', 'disable-zoom', 'touch-action="pan-y"'];
      if (m.giro !== false && !['girar', 'ambos'].includes(m.scroll)) at.push('auto-rotate', 'auto-rotate-delay="0"', 'rotation-per-second="20deg"');
      if (m.animacion) at.push(`animation-name="${escH(m.animacion)}"`);
      const cols = m.colores || [];
      dentro = `<model-viewer ${at.join(' ')} data-scroll="${m.scroll || 'no'}" data-material="${escH(m.material ?? 0)}" data-colores='${escH(JSON.stringify(cols))}' poster="${o.getSrc ? o.getSrc() : ''}" style="width:100%;height:100%;background:transparent;--poster-color:transparent"></model-viewer>` +
        (cols.length > 1 ? `<div class="colores3d">${cols.map((c, i) => `<button aria-label="${escH(c.nombre)}" title="${escH(c.nombre)}" data-i="${i}" class="${i ? '' : 'on'}" style="background:${escH(c.color)}"></button>`).join('')}</div>` : '');
      if (cols.length && !primerCambio) primerCambio = cols[0].fondo;
    } else if (o.variantes){
      ctx.usaCambiador = true;
      dentro = `<div class="camb" data-fondos='${escH(JSON.stringify(o.variantes.map(v => v.fondo)))}'>` +
        o.variantes.map((v, i) => `<img src="${v.src}" alt="${escH(v.nombre || 'Producto ' + (i + 1))}" class="${i ? '' : 'on'}">`).join('') +
        `<button class="ant" aria-label="Anterior">‹</button><button class="sig" aria-label="Siguiente">›</button><div class="pts">${o.variantes.map((v, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div></div>`;
      if (!primerCambio) primerCambio = o.variantes[0].fondo;
    } else if (textoHTMLSimple(o)){ dentro = htmlDeTexto(o, r.left, r.top); tipo = 'texto'; }
    else if (esRect){ dentro = htmlDeRect(o); tipo = 'rect'; }
    else dentro = svgDeObjeto(o, r);
    if (o.modelo3d) tipo = '3d'; else if (o.variantes) tipo = 'camb';
    const a = o.anim && ANIM_CSS[o.anim.tipo] ? o.anim : null;
    const retraso = a ? Math.min(1500, (a.retraso || 0) + Math.max(0, animados.indexOf(o)) * 110) : 0;
    let html = `<div class="h${o.hover ? ' h-' + o.hover : ''}">${dentro}</div>`;
    html = `<div class="a${a ? ' a-' + ANIM_CSS[a.tipo] : ''}"${a ? ` style="--d:${a.duracion || 700}ms;--r:${retraso}ms"` : ''}>${html}</div>`;
    if (o.enlace){
      const href = o.enlace.startsWith('p:') ? '#p' + o.enlace.slice(2) : o.enlace;
      html = `<a href="${escH(href)}"${o.enlace.startsWith('p:') ? '' : ' target="_blank" rel="noopener"'} class="lnk">${html}</a>`;
    }
    const fs = tipo === 'texto' ? o.fontSize * (o.scaleY || 1) : 0;
    const rt = o.getBoundingRect(true, true);   // caja justa, sin margen para sombras
    items.push({ r:{ left:Math.round(r.left), top:Math.round(r.top), width:Math.round(r.width), height:Math.round(r.height) }, rt, html, tipo, idx, fs,
      al:o.textAlign || 'left', scrollFx:o.scrollFx || '', hijos:[], padre:null, enlace:!!o.enlace });
  }
  sc.dispose();
  // ¿qué está dentro de qué? (una tarjeta y su texto, un botón y su letrero…)
  const dentroDe = (a, b) => a.rt.left >= b.rt.left - 3 && a.rt.top >= b.rt.top - 3 && a.rt.left + a.rt.width <= b.rt.left + b.rt.width + 3 && a.rt.top + a.rt.height <= b.rt.top + b.rt.height + 3;
  const area = x => Math.max(1, x.rt.width * x.rt.height);
  items.forEach(c => {
    let mejor = null;
    items.forEach(p => {
      if (p === c || p.idx > c.idx || p.tipo === 'texto' || p.tipo === '3d' || p.tipo === 'camb') return;
      if (area(p) < area(c) * 1.2 || !dentroDe(c, p)) return;
      if (!mejor || area(p) < area(mejor)) mejor = p;
    });
    if (mejor){ c.padre = mejor; mejor.hijos.push(c); }
  });
  // orden de lectura (corte en X y Y): primero renglones separados por espacios en blanco; dentro de cada uno, columnas de izquierda a derecha
  const ordenar = lista => {
    if (lista.length <= 1) return lista.slice();
    const caja = x => x.rt;
    const cortar = (eje) => {
      const ini = eje === 'y' ? (x => caja(x).top) : (x => caja(x).left), tam = eje === 'y' ? (x => caja(x).height) : (x => caja(x).width);
      const l = lista.slice().sort((a, b) => ini(a) - ini(b)), grupos = []; let g = [], fin = -Infinity;
      l.forEach(x => { if (g.length && ini(x) >= fin - 2){ grupos.push(g); g = []; } g.push(x); fin = Math.max(fin, ini(x) + tam(x)); });
      grupos.push(g); return grupos;
    };
    let gr = cortar('y');
    if (gr.length > 1) return gr.flatMap(ordenar);
    gr = cortar('x');
    if (gr.length > 1) return gr.flatMap(ordenar);
    return lista.slice().sort((a, b) => (caja(a).top - caja(b).top) || (caja(a).left - caja(b).left));
  };
  // cosas pequeñas en el mismo renglón (botones, tallas, colores, íconos) se quedan juntas en el celular
  const chico = x => x.rt.height <= 90 && x.rt.width <= (x.tipo === 'texto' ? 220 : W * 0.3);
  const juntar = (lista, base) => {
    const out = []; let run = [];
    const soltar = () => { if (run.length >= 2) out.push('<div class="filaM">' + run.map(x => nodo(x, base)).join('') + '</div>'); else run.forEach(x => out.push(nodo(x, base))); run = []; };
    lista.forEach(x => {
      const u = run[run.length - 1];
      const mismo = u && chico(x) && Math.min(u.rt.top + u.rt.height, x.rt.top + x.rt.height) - Math.max(u.rt.top, x.rt.top) > Math.min(u.rt.height, x.rt.height) * 0.5;
      if (chico(x) && (!u || mismo)) run.push(x); else { soltar(); if (chico(x)) run.push(x); else out.push(nodo(x, base)); }
    });
    soltar(); return out.join('');
  };
  const nodo = (x, base) => {
    const cls = ['o'], st = [`left:${x.r.left - base.left}px`, `top:${x.r.top - base.top}px`, `width:${x.r.width}px`, `height:${x.r.height}px`, `z-index:${x.idx}`];
    if (x.hijos.length){ cls.push('cont'); if (x.r.height <= 140 && x.r.width / x.r.height > 2.5) cls.push('fila');
      st.push(`--pad:${Math.round(Math.min(18, x.r.height * 0.22, x.r.width * 0.08))}px`); }
    else if (x.tipo === 'texto'){ cls.push('tx'); if (!x.enlace) cls.push('sinClic');
      const f = x.fs, m = f >= 40 ? Math.max(26, f * 0.55) : f >= 22 ? Math.max(18, f * 0.75) : Math.max(13, f * 0.95);
      st.push(`--fsm:${Math.round(m)}px`, `--al:${x.al === 'center' ? 'center' : x.al === 'right' ? 'flex-end' : 'stretch'}`); }
    else { const w0 = x.r.width, mw = w0 >= W * 0.5 || x.tipo === '3d' || x.tipo === 'camb' ? '100%' : Math.round(Math.max(Math.min(w0, 64), w0 * 0.62)) + 'px';
      st.push(`--mw:${mw}`, `--ar:${x.r.width}/${Math.max(1, x.r.height)}`); }
    const at = x.scrollFx ? ` data-scroll="${x.scrollFx}"` : '';
    return `<div class="${cls.join(' ')}" style="${st.join(';')}"${at}>${x.html}${juntar(ordenar(x.hijos), x.r)}</div>`;
  };
  const partes = [juntar(ordenar(items.filter(x => !x.padre)), { left:0, top:0 })];
  const flujo = W > 900 && ctx.modo !== 'pantallas';
  return `<section class="pag${flujo ? ' flujo' : ''}" id="p${num}" data-w="${W}" data-h="${H}" style="--w:${W};--h:${H};background:${primerCambio || fondo}">` +
    `<div class="lienzo" style="width:${W}px;height:${H}px${fondoImg ? `;background:url(${fondoImg}) center/cover` : ''}">${partes.join('\n')}</div></section>`;
}
async function crearHTML(lista, modo){
  const ctx = { fuentes:{}, vacios:0, usa3D:false, usaCambiador:false, modo };
  const secciones = []; for (const it of lista) secciones.push(await paginaAHTML(it.p, it.i + 1, ctx));
  const fams = Object.entries(ctx.fuentes);
  let cssFuentes = '', linkFuentes = '';
  const google = fams.filter(([f]) => !misFuentes[f]);
  if (google.length) linkFuentes = `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${google.map(([f, p]) => 'family=' + encodeURIComponent(f).replace(/%20/g, '+') + ':wght@' + [...p].sort((a, b) => a - b).join(';')).join('&')}&display=swap">`;
  for (const [f] of fams.filter(([f]) => misFuentes[f])) cssFuentes += await cssDeFuente(f, [400]);
  const titulo = escH(nombreArchivo() || 'Mi página');
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo}</title><meta name="generator" content="Diseñador · Apik-Desing">
${linkFuentes}
${ctx.usa3D ? `<script type="module" src="${URL_MV.replace('-umd', '')}"><\/script>` : ''}
<style>${cssFuentes}
*{box-sizing:border-box}html,body{margin:0;padding:0}body{background:${modo === 'pantallas' ? '#0f172a' : '#fff'};overflow-x:hidden;-webkit-font-smoothing:antialiased}
.pag{position:relative;overflow:hidden;height:calc(var(--h) * var(--k,1) * 1px);transition:background-color .8s ease}
.lienzo{position:absolute;top:0;left:50%;transform-origin:0 0;transform:translateX(calc(var(--w) * var(--k,1) * -.5px)) scale(var(--k,1))}
.o{position:absolute;will-change:transform}.a,.h{width:100%;height:100%;position:relative}.t{pointer-events:none}.o svg{position:absolute;inset:0}
a.lnk{display:block;width:100%;height:100%;color:inherit;text-decoration:none}
.a[class*="a-"]{opacity:0;transition:opacity var(--d) ease var(--r),transform var(--d) cubic-bezier(.2,.8,.2,1) var(--r)}
.a-arriba{transform:translateY(80px)}.a-abajo{transform:translateY(-80px)}.a-izquierda{transform:translateX(-120px)}.a-derecha{transform:translateX(120px)}
.a-zoom{transform:scale(.4)}.a-rebote{transform:scale(.1);transition-timing-function:ease,cubic-bezier(.34,1.56,.64,1)!important}.a-girar{transform:rotate(-180deg) scale(.2)}
.a.visto{opacity:1;transform:none}
.h{transition:transform .35s cubic-bezier(.2,.8,.2,1),filter .35s}
.h-crecer:hover{transform:scale(1.07)}.h-elevar:hover{transform:translateY(-10px);filter:drop-shadow(0 18px 22px rgba(0,0,0,.22))}
.h-brillo:hover{filter:brightness(1.12) drop-shadow(0 0 18px rgba(255,255,255,.75))}.h-girar:hover{transform:rotate(-4deg) scale(1.04)}
.h-sacudir:hover{animation:sacudir .45s}@keyframes sacudir{25%{transform:translateX(-6px) rotate(-2deg)}75%{transform:translateX(6px) rotate(2deg)}}
.h-latido{animation:latido 1.6s ease-in-out infinite}@keyframes latido{50%{transform:scale(1.06)}}
.lnk .h,.camb button,.colores3d button{cursor:pointer}
.camb{position:relative;width:100%;height:100%}.camb img{position:absolute;left:0;top:0;width:100%;height:calc(100% - 40px);object-fit:contain;opacity:0;transform:translateY(60%) rotate(18deg) scale(.7);transition:transform .8s cubic-bezier(.2,.8,.2,1),opacity .6s}
.camb img.on{opacity:1;transform:none}.camb img.sale{opacity:0;transform:translateY(-60%) rotate(-18deg) scale(.7)}
.camb button{position:absolute;top:calc(50% - 50px);width:56px;height:56px;border-radius:50%;border:0;background:rgba(255,255,255,.75);font-size:34px;line-height:1;color:#111;box-shadow:0 6px 16px rgba(0,0,0,.15)}
.camb .ant{left:0}.camb .sig{right:0}.camb .pts{position:absolute;bottom:6px;left:0;right:0;display:flex;gap:10px;justify-content:center}.camb .pts i{width:10px;height:10px;border-radius:50%;background:rgba(17,24,39,.3);transition:.3s}.camb .pts i.on{background:#111827;transform:scale(1.4)}
model-viewer::part(default-progress-bar){display:none}
.colores3d{position:absolute;bottom:-10px;left:0;right:0;display:flex;gap:14px;justify-content:center}.colores3d button{width:38px;height:38px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);transition:transform .2s}.colores3d button.on{transform:scale(1.25);outline:2px solid #111;outline-offset:2px}
${modo === 'pantallas' ? '.pag{display:none;margin:0 auto}.pag.activa{display:block}' : ''}
@media (prefers-reduced-motion:reduce){.a[class*="a-"]{opacity:1;transform:none;transition:none}.h-latido{animation:none}}
/* en el celular, las páginas anchas se reacomodan en una columna */
@media (max-width:700px){
 .pag.flujo{height:auto!important}
 .pag.flujo>.lienzo{position:relative;left:auto;top:auto;transform:none!important;width:auto!important;height:auto!important;display:flex;flex-direction:column;gap:16px;padding:28px 18px 36px}
 .pag.flujo .o{position:relative!important;left:auto!important;top:auto!important;width:auto!important;height:auto!important;transform:none!important;z-index:auto!important;will-change:auto}
 .pag.flujo .o:not(.cont):not(.tx){width:min(100%,var(--mw))!important;aspect-ratio:var(--ar);align-self:center}
 .pag.flujo .o.tx{align-self:var(--al,stretch)}.pag.flujo .o.tx .a,.pag.flujo .o.tx .h,.pag.flujo .o.tx a.lnk{height:auto}
 .pag.flujo .o.tx .t{position:static!important;transform:none!important;width:auto!important;height:auto!important;white-space:normal!important;font-size:var(--fsm)!important;line-height:1.3!important;letter-spacing:normal!important;overflow-wrap:anywhere}
 .pag.flujo .o.tx .t br.w{display:none}
 .pag.flujo .o.cont{display:flex;flex-direction:column;gap:10px;padding:var(--pad,14px)}
 .pag.flujo .o.cont>.a,.pag.flujo .o.cont>a.lnk{position:absolute;inset:0;width:auto;height:auto;z-index:0}
 .pag.flujo .o.cont>.o{z-index:1!important}
 .pag.flujo .o.cont.fila{flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 14px}
 .pag.flujo .o.fila>.o.tx{align-self:center}
 .pag.flujo .filaM{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center}
 .pag.flujo .filaM>.o:not(.cont):not(.tx){width:var(--mw)!important;max-width:100%}
 .pag.flujo .filaM>.o.cont{min-width:44px}
 .pag.flujo .o.fila>.o:not(.cont):not(.tx){width:min(100%,var(--mw),48px)!important}
}
.filaM{display:contents}.o.sinClic{pointer-events:none}.o.sinClic .o{pointer-events:auto}
</style></head><body>
${secciones.join('\n')}
<script>
(function(){
var MODO=${JSON.stringify(modo)};
var pags=[].slice.call(document.querySelectorAll('.pag'));
function ajustar(){var vw=document.documentElement.clientWidth,vh=innerHeight;pags.forEach(function(p){var w=+p.dataset.w,h=+p.dataset.h,k;
 if(MODO==='pantallas')k=Math.min(vw/w,vh/h);else k=w<=900?Math.min(1.25,vw/w):vw/w;p.style.setProperty('--k',k);p._k=k;});scroll();}
function ir(n){if(MODO!=='pantallas')return;pags.forEach(function(p){p.classList.toggle('activa',p.id==='p'+n);});revelar();scrollTo(0,0);}
if(MODO==='pantallas'){addEventListener('hashchange',function(){ir((location.hash||'#p1').slice(2));});ir((location.hash||'#p1').slice(2)||1);}
var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visto');io.unobserve(e.target);}});},{threshold:.15}):null;
function revelar(){[].forEach.call(document.querySelectorAll('.a[class*="a-"]:not(.visto)'),function(a){if(io)io.observe(a);else a.classList.add('visto');});}
revelar();
var conScroll=[].slice.call(document.querySelectorAll('.o[data-scroll]'));
var mvs=[].slice.call(document.querySelectorAll('model-viewer'));
function cl(v,a,b){return Math.max(a,Math.min(b,v));}
function progresoElem(el){var r=el.getBoundingClientRect(),vh=innerHeight;return cl((vh-r.top)/(vh+r.height),0,1);}
function progresoSeccion(el){var p=el.closest('.pag'),r=p.getBoundingClientRect(),vh=innerHeight;return r.height<=vh?cl((vh-r.top)/(vh+r.height),0,1):cl(-r.top/(r.height-vh),0,1);}
var mqFlujo=matchMedia('(max-width:700px)');
function scroll(){var vh=innerHeight;
 conScroll.forEach(function(o){if(mqFlujo.matches&&o.closest('.pag.flujo')){o.style.transform='';return;}var p=o.closest('.pag'),k=p._k||1,fx=o.dataset.scroll,r=o.getBoundingClientRect(),c=(r.top+r.height/2-vh/2)/vh,t='';
  if(fx==='paralaje')t='translateY('+(c*-120)+'px)';
  else if(fx==='girar')t='rotate('+(c*-90)+'deg)';
  else if(fx==='acercar')t='scale('+cl(1.25-Math.abs(c)*0.6,0.6,1.25)+')';
  else if(fx==='fijo'){var pr=p.getBoundingClientRect(),top=parseFloat(o.style.top),h=parseFloat(o.style.height),H=+p.dataset.h;var desea=(-pr.top)/k+(vh/k-h)/2;t='translateY('+(cl(desea,top,H-h)-top)+'px)';}
  o.style.transform=t;});
 mvs.forEach(function(mv){var fx=mv.dataset.scroll;if(!fx||fx==='no')return;var p=(mqFlujo.matches&&mv.closest('.pag.flujo'))?progresoElem(mv):progresoSeccion(mv);
  if((fx==='girar'||fx==='ambos')&&mv._orb){mv.cameraOrbit=(mv._orb[0]+p*360)+'deg '+mv._orb[1]+' '+mv._orb[2];}
  if((fx==='animar'||fx==='ambos')&&mv.duration){mv.currentTime=Math.min(mv.duration-0.001,p*mv.duration*1.15);}});
}
mvs.forEach(function(mv){var orb=(mv.getAttribute('camera-orbit')||'0deg 75deg auto').split(/\\s+/);mv._orb=[parseFloat(orb[0])||0,orb[1]||'75deg',orb[2]||'auto'];
 mv.addEventListener('load',function(){var cols=JSON.parse(mv.dataset.colores||'[]');if(cols[0])pintar(mv,cols[0].color);
  if(mv.dataset.scroll==='animar'||mv.dataset.scroll==='ambos'){mv.play();mv.pause();}scroll();});
 var caja=mv.parentNode.querySelector('.colores3d');if(caja)[].forEach.call(caja.children,function(b){b.addEventListener('click',function(e){e.preventDefault();var cols=JSON.parse(mv.dataset.colores);var c=cols[+b.dataset.i];
  pintar(mv,c.color);var p=mv.closest('.pag');if(c.fondo)p.style.background=c.fondo;[].forEach.call(caja.children,function(x){x.classList.toggle('on',x===b);});});});});
function pintar(mv,hex){if(!mv.model)return;var mats=mv.model.materials,m=mv.dataset.material;var mt=null;for(var i=0;i<mats.length;i++)if(mats[i].name===m)mt=mats[i];mt=mt||mats[+m||0];if(!mt)return;
 var n=parseInt(hex.slice(1).length===3?hex.slice(1).replace(/./g,'$&$&'):hex.slice(1,7),16);mt.pbrMetallicRoughness.setBaseColorFactor([(n>>16&255)/255,(n>>8&255)/255,(n&255)/255,1]);}
[].forEach.call(document.querySelectorAll('.camb'),function(c){var imgs=[].slice.call(c.querySelectorAll('img')),pts=[].slice.call(c.querySelectorAll('.pts i')),f=JSON.parse(c.dataset.fondos||'[]'),i=0;
 function a(n){var v=imgs[i];v.classList.remove('on');v.classList.add('sale');setTimeout(function(){v.classList.remove('sale');},800);i=(n+imgs.length)%imgs.length;imgs[i].classList.add('on');
  pts.forEach(function(p,j){p.classList.toggle('on',j===i);});if(f[i])c.closest('.pag').style.background=f[i];}
 c.querySelector('.ant').addEventListener('click',function(e){e.preventDefault();a(i-1);});c.querySelector('.sig').addEventListener('click',function(e){e.preventDefault();a(i+1);});
 pts.forEach(function(p,j){p.addEventListener('click',function(){a(j);});});
 var x0=null;c.addEventListener('touchstart',function(e){x0=e.touches[0].clientX;},{passive:true});c.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)a(i+(dx<0?1:-1));x0=null;});});
if(MODO!=='pantallas'&&pags[0])document.body.style.background=getComputedStyle(pags[pags.length-1]).backgroundColor;
addEventListener('resize',ajustar);addEventListener('scroll',scroll,{passive:true});ajustar();
})();
<\/script>
</body></html>`;
  return { html, ctx };
}
const modoHTML = () => $('eModoHTML').value === 'auto' ? (W <= 900 ? 'pantallas' : 'scroll') : $('eModoHTML').value;
async function htmlParaExportar(){
  canvas.discardActiveObject(); canvas.requestRenderAll();
  const lista = paginasAExportar();
  const r = await crearHTML(lista, modoHTML());
  if (r.ctx.vacios) toast(r.ctx.vacios + (r.ctx.vacios === 1 ? ' marco de foto vacío no se incluyó' : ' marcos de foto vacíos no se incluyeron') + ' en la página. Sube tus fotos para que aparezcan.');
  return r.html;
}
FORMATO('html').descargar = async function(){
  cargando(true);
  try { const h = await htmlParaExportar(); bajarBlob(new Blob([h], { type:'text/html' }), nombreArchivo() + '.html');
    toast('Página web descargada. Ábrela con doble clic, o súbela gratis a GitHub Pages o Netlify para tener tu sitio en internet.'); }
  catch (e) { console.error(e); toast('Error al crear la página: ' + e.message); }
  finally { cargando(false); }
};
FORMATO('html').vista = async function(){
  cargando(true);
  try {
    const h = await htmlParaExportar(), url = URL.createObjectURL(new Blob([h], { type:'text/html' }));
    $('vista').innerHTML = `<p class="hint">Así se verá tu página. Haz scroll dentro del recuadro, pasa el mouse por los elementos y toca los botones. <a href="${url}" target="_blank">Abrir en otra pestaña ↗</a></p>` +
      `<iframe id="vistaHTML" src="${url}" style="width:100%;height:70vh;border:1px solid var(--borde,#ddd);border-radius:8px;background:#fff"></iframe>`;
  } finally { cargando(false); }
};
FORMATO('html').drive = async function(){
  cargando(true);
  try {
    const h = await htmlParaExportar();
    const r = await gs('guardarImagen', nombreArchivo(), 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(h))));
    $('eInfo').innerHTML = `Guardado: <a href="${r.url}" target="_blank">${esc(r.nombre)}</a>`; toast('Página web guardada');
  } catch (e) { toast('No se pudo guardar: ' + e.message); }
  finally { cargando(false); }
};
(function(){
  const sel = $('eFormato'), op = document.createElement('option'); op.value = 'html'; op.textContent = '🌐 Página web (HTML con efectos y 3D)';
  sel.appendChild(op);
  const fila = document.createElement('div'); fila.className = 'fila'; fila.id = 'filaModoHTML'; fila.hidden = true;
  fila.innerHTML = '<label>Páginas</label><select id="eModoHTML"><option value="auto">Automático</option><option value="scroll">Una debajo de otra (sitio web)</option><option value="pantallas">Una pantalla a la vez (prototipo de app)</option></select>';
  sel.closest('.fila').after(fila);
  const ver = () => { fila.hidden = sel.value !== 'html'; };
  sel.addEventListener('change', ver); ver();
})();

/* ---------- plantillas con 3D y cambiador ---------- */
function dibujoProducto(tipo, color, color2){
  const c = document.createElement('canvas'); c.width = 400; c.height = 640; const x = c.getContext('2d');
  const g = x.createLinearGradient(60, 0, 340, 0); g.addColorStop(0, color2); g.addColorStop(0.45, color); g.addColorStop(1, color2);
  x.fillStyle = g;
  if (tipo === 'botella'){
    x.beginPath(); x.moveTo(165, 20); x.lineTo(235, 20); x.lineTo(235, 110); x.bezierCurveTo(235, 170, 320, 180, 320, 260); x.lineTo(320, 580);
    x.quadraticCurveTo(320, 620, 280, 620); x.lineTo(120, 620); x.quadraticCurveTo(80, 620, 80, 580); x.lineTo(80, 260); x.bezierCurveTo(80, 180, 165, 170, 165, 110); x.closePath(); x.fill();
    x.fillStyle = '#ffffff'; x.globalAlpha = .9; x.fillRect(80, 330, 240, 150); x.globalAlpha = 1;
    x.fillStyle = color2; x.font = '800 44px Poppins, sans-serif'; x.textAlign = 'center'; x.fillText('FRESH', 200, 420);
    x.fillStyle = '#222'; x.fillRect(160, 0, 80, 34);
  } else {
    x.beginPath(); x.roundRect(80, 60, 240, 540, 36); x.fill();
    x.fillStyle = '#d9dde3'; x.beginPath(); x.ellipse(200, 66, 112, 18, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,.92)'; x.font = '900 64px Poppins, sans-serif'; x.textAlign = 'center'; x.save(); x.translate(200, 340); x.rotate(-Math.PI / 2); x.fillText('SODA', 0, 22); x.restore();
  }
  x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(120, 70, 26, 520);
  return c.toDataURL('image/png');
}
const PLANTILLAS_3D = [
  { nombre:'Web 3D: audífonos que se desarman con el scroll', tam:[1440, 3200], crear(){
    FONDO('#0b0b10');
    PON(COMP.navbar(120, 16, 1, { w:1200, marca:'SONIQ', links:['Producto', 'Sonido', 'Batería'], boton:'Comprar', oscuro:true, acento:'#ef4444' }));
    const m = crearObjeto3D(EJEMPLOS_3D.audifonos, 470, 560, 780, 780); m.scrollFx = 'fijo'; canvas.add(m);
    const bloques = [['Sonido que se siente', 'Bocinas de 40 mm con imanes de neodimio. Graves profundos y agudos limpios.', 260],
      ['Mira lo que hay adentro', 'Al bajar, el audífono se desarma pieza por pieza: copa, cojín, bocina y circuito.', 980],
      ['40 horas de batería', 'Carga rápida: 10 minutos te dan 5 horas de música.', 1700],
      ['Cómodos todo el día', 'Cojines de espuma con memoria y diadema ajustable.', 2420]];
    bloques.forEach(([t, d, y], i) => { const a = [uiT(t, 900, y, { w:440, s:46, b:'800', c:'#ffffff', f:'Poppins', lh:1.1 }), uiT(d, 900, y + 130, { w:420, s:19, c:'#9ca3af', lh:1.55 })];
      a.forEach((o, k) => { o.anim = { tipo:'arriba', inicio:'despues', duracion:800, retraso:k * 150, orden:i * 2 + k + 1 }; }); PON(a); });
    PON([uiT('Tip: el modelo de ejemplo se cambia por el tuyo. Selecciónalo y pulsa «🔁 Cambiar modelo».', 900, 3080, { w:440, s:13, c:'#4b5563' })]);
    const b = COMP.boton(900, 2680, 1, { t:'Comprar · $1,499', w:240, h:58, fill:'#ef4444' }); b.forEach(o => o.hover = 'crecer'); PON(b);
  }},
  { nombre:'Web 3D: bebida que cambia de sabor', tam:[1440, 1000], crear(){
    FONDO('#ffe1e1');
    PON(COMP.navbar(120, 16, 1, { w:1200, marca:'Burbuja', links:['Sabores', 'Nosotros', 'Tiendas'], boton:'Pedir', acento:'#d61f1f' }));
    const t = [uiT('REFRESCO ARTESANAL', 120, 230, { w:560, s:15, b:'700', c:'#d61f1f', cs:250 }), uiT('Elige tu sabor favorito', 120, 270, { w:560, s:72, b:'900', f:'Poppins', lh:1.02 }),
      uiT('Toca los colores debajo de la lata: cambia el sabor, el color y el fondo de la página. Gira la lata con el dedo.', 120, 470, { w:500, s:19, c:'#4b5563', lh:1.55 })];
    t.forEach((o, i) => o.anim = { tipo:'izquierda', inicio:'despues', duracion:800, retraso:0, orden:i + 1 }); PON(t);
    const b = COMP.boton(120, 590, 1, { t:'Comprar 6-pack', w:220, h:58, fill:'#111827' }); b.forEach(o => o.hover = 'elevar'); PON(b);
    const m = crearObjeto3D(EJEMPLOS_3D.lata, 1010, 560, 560, 700); m.hover = null; canvas.add(m);
  }},
  { nombre:'Web: cambiador de productos (fotos)', tam:[1440, 1000], crear(){
    FONDO('#e8f7ff');
    PON(COMP.navbar(120, 16, 1, { w:1200, marca:'Fresh', links:['Bebidas', 'Promos', 'Contacto'], boton:'Ordenar', acento:'#0ea5e9' }));
    const t = [uiT('Nuevos sabores', 120, 260, { w:560, s:76, b:'900', f:'Poppins', lh:1.02 }),
      uiT('Usa las flechas para ver cada bebida: el fondo cambia de color. Cambia las fotos por las tuyas: desagrupa, pon tus fotos, selecciónalas y pulsa «Cambiador de productos».', 120, 440, { w:500, s:19, c:'#4b5563', lh:1.55 })];
    t.forEach((o, i) => o.anim = { tipo:'arriba', inicio:'despues', duracion:800, retraso:0, orden:i + 1 }); PON(t);
    const vs = [['#0ea5e9', '#0369a1', '#e0f2fe', 'Mora azul'], ['#22c55e', '#15803d', '#dcfce7', 'Limón'], ['#f97316', '#c2410c', '#ffedd5', 'Mandarina'], ['#e11d48', '#9f1239', '#ffe4e6', 'Frutos rojos']]
      .map(([c, c2, f, n], i) => ({ src:dibujoProducto(i % 2 ? 'lata' : 'botella', c, c2), fondo:f, nombre:n }));
    FONDO(vs[0].fondo);
    const lienzo = canvas, esVista = generandoVista;   // se guarda a qué lienzo va: si es la vista previa del catálogo, no debe caer en tu diseño
    grupoCambiador(vs, 520, 760).then(g => {
      if (!lienzo.contextContainer) return;
      g.setPositionByOrigin(new fabric.Point(1000, 560), 'center', 'center'); lienzo.add(g); lienzo.requestRenderAll();
      if (!esVista && lienzo === canvas && !restaurando) guardarEstado(); });
  }}
];
PLANTILLAS_3D.forEach(p => {
  CATALOGO.push({ nombre:p.nombre, cat:CAT_WEB, tam:p.tam, crear:p.crear, usar:() => usarPlantillaLogo(p) });
  const b = document.createElement('button'); b.className = 'bigbtn'; b.textContent = '✨ ' + p.nombre; b.onclick = () => usarPlantillaLogo(p);
  $('listaPlantillasWeb').prepend(b);
});
function cambiarModelo(){
  const o = activo(); if (!o || !o.modelo3d) return;
  $('archivo3D').dataset.reemplazar = '1'; $('archivo3D').click();
}
const subirModelo3DBase = subirModelo3D;
subirModelo3D = function(file){
  const o = activo();
  if ($('archivo3D').dataset.reemplazar && o && o.modelo3d && file){
    delete $('archivo3D').dataset.reemplazar;
    if (file.size > MAX_GLB) return toast('El modelo pesa demasiado (máximo 8 MB)');
    const r = new FileReader(); r.onload = () => { Object.assign(o.modelo3d, { src:r.result, nombre:file.name, animacion:'', colores:[], material:0 }); actualizarPoster(o); }; r.readAsDataURL(file);
    return;
  }
  delete $('archivo3D').dataset.reemplazar;
  return subirModelo3DBase(file);
};
renderCatalogo();


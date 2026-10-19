/* =========================================================
   CONFIGURACIÓN
   ========================================================= */
const $ = id => document.getElementById(id);
const FUENTES = ['Inter','Montserrat','Poppins','Roboto','Raleway','Oswald','Bebas Neue','Anton',
  'Playfair Display','Lobster','Pacifico','Dancing Script','Fredoka','Patrick Hand','Caveat','Gochi Hand','Amatic SC',
  'Permanent Marker','Shadows Into Light','Gloria Hallelujah','Orbitron','Audiowide','Exo 2','Righteous','UnifrakturMaguntia','Arial','Georgia','Times New Roman','Courier New','Verdana'];
const TAMANOS = [
  ['Publicación de Instagram', 1080, 1080],
  ['Historia de Instagram / TikTok', 1080, 1920],
  ['Publicación de Facebook', 1200, 630],
  ['Portada de Facebook', 1640, 624],
  ['Miniatura de YouTube', 1280, 720],
  ['Presentación 16:9', 1920, 1080],
  ['Hoja carta (300 dpi)', 2550, 3300],
  ['A4 (300 dpi)', 2480, 3508],
  ['Póster vertical', 1800, 2700],
  ['Logo', 500, 500],
  ['Tarjeta de presentación', 1050, 600],
  ['Invitación 5×7', 1500, 2100]
];
const COLORES = ['#ffffff','#000000','#f3f4f6','#9ca3af','#374151','#7c3aed','#a78bfa','#2563eb','#06b6d4','#10b981',
  '#84cc16','#facc15','#f59e0b','#f97316','#ef4444','#ec4899','#fde2e4','#e0f2fe'];
const DEGRADADOS = [['#7c3aed','#06b6d4'],['#f97316','#ec4899'],['#10b981','#3b82f6'],['#facc15','#f97316'],
  ['#0f172a','#334155'],['#fbc2eb','#a6c1ee'],['#ff9a9e','#fecfef'],['#43e97b','#38f9d7'],['#fa709a','#fee140'],
  ['#30cfd0','#330867'],['#a18cd1','#fbc2eb'],['#232526','#414345']];
const EXTRA = ['name','bloqueado','fx','selectable','evented','lockMovementX','lockMovementY',
  'lockScalingX','lockScalingY','lockRotation','hasControls','editable','esFondo',
  'id','formaTexto','textoDe','altoBase','anchoBase','anchoMax','conA','conB','flecha','perPixelTargetFind','objectCaching',
  'estilo','etiqueta','dir','forma','orient','horiz','ladoA','ladoB','modo','inicio','fin','patron','fijo','tabla','fila','col','sepTabla','esDeco','grafica','trazoLibre','marco','marcoVacio','anim','nombrePropio','curva','efectoTexto','rellenoOriginal'];

let W = 1080, H = 1080, zoom = 1;
let historial = [], hi = -1, restaurando = false;
let portapapeles = null;
let paginas = [null], actual = 0, miniaturas = [];
let generandoVista = false;
let presConfig = { transicion:'desvanecer', avance:'manual', segundos:6 };   // mientras se dibujan las miniaturas de plantillas no se toca el diseño
const PAGINA_VACIA = () => ({ version: fabric.version, objects: [], background: '#ffffff' });

/* =========================================================
   LIENZO
   ========================================================= */
fabric.filterBackend = new fabric.Canvas2dFilterBackend();
Object.assign(fabric.Object.prototype, {
  transparentCorners:false, cornerColor:'#0f1218', cornerStrokeColor:'#19c8ff',
  borderColor:'#19c8ff', cornerStyle:'circle', cornerSize:11, padding:4
});
let canvas = new fabric.Canvas('lienzo', {
  preserveObjectStacking:true, backgroundColor:'#ffffff', selectionColor:'rgba(25,200,255,.08)',
  selectionBorderColor:'#19c8ff'
});

/* Conector: une dos elementos. Tipos: recta, curva, codo. Puntas: nada, flecha, abierta, círculo, rombo.
   Trazo: sólido, guiones o puntos. Puede llevar un texto (palabra de enlace) a la mitad. */
fabric.Conector = fabric.util.createClass(fabric.Line, {
  type: 'conector',
  _render(ctx){
    const p = this.calcLinePoints(), est = this.estilo || 'recta';
    const mx = (p.x1 + p.x2) / 2, my = (p.y1 + p.y2) / 2;
    let ax = p.x1, ay = p.y1, bx = p.x2, by = p.y2;   // a: antes del final · b: después del inicio
    ctx.beginPath(); ctx.moveTo(p.x1, p.y1);
    if (this.modo && est !== 'recta'){
      const cx = this.modo === 'vh' ? p.x1 : p.x2, cy = this.modo === 'vh' ? p.y2 : p.y1;
      if (est === 'codo') this._poli(ctx, [{x:p.x1,y:p.y1}, {x:cx,y:cy}, {x:p.x2,y:p.y2}]);
      else ctx.quadraticCurveTo(cx, cy, p.x2, p.y2);
      ax = bx = cx; ay = by = cy;
    } else if (est === 'codo'){
      if (this.horiz){ this._poli(ctx, [{x:p.x1,y:p.y1}, {x:mx,y:p.y1}, {x:mx,y:p.y2}, {x:p.x2,y:p.y2}]); bx = mx; by = p.y1; ax = mx; ay = p.y2; }
      else { this._poli(ctx, [{x:p.x1,y:p.y1}, {x:p.x1,y:my}, {x:p.x2,y:my}, {x:p.x2,y:p.y2}]); bx = p.x1; by = my; ax = p.x2; ay = my; }
    } else if (est === 'curva'){
      if (this.horiz){ ctx.bezierCurveTo(mx, p.y1, mx, p.y2, p.x2, p.y2); bx = mx; by = p.y1; ax = mx; ay = p.y2; }
      else { ctx.bezierCurveTo(p.x1, my, p.x2, my, p.x2, p.y2); bx = p.x1; by = my; ax = p.x2; ay = my; }
    } else ctx.lineTo(p.x2, p.y2);
    if (ax === p.x2 && ay === p.y2){ ax = p.x1; ay = p.y1; }
    if (bx === p.x1 && by === p.y1){ bx = p.x2; by = p.y2; }
    const sw = this.strokeWidth;
    if (this.patron) this.strokeDashArray = this.patron === 'guiones' ? [sw * 3, sw * 2] : this.patron === 'puntos' ? [0.01, sw * 2] : null;
    ctx.lineJoin = 'round';
    this._renderStroke(ctx);
    const fin = this.fin || (this.flecha ? 'flecha' : 'nada');
    this._punta(ctx, fin, p.x2, p.y2, Math.atan2(p.y2 - ay, p.x2 - ax));
    this._punta(ctx, this.inicio || 'nada', p.x1, p.y1, Math.atan2(p.y1 - by, p.x1 - bx));
    if (this.etiqueta){
      const tam = Math.max(14, this.etiquetaTam || sw * 5 + 14);
      ctx.save();
      ctx.font = `600 ${tam}px Inter, Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(this.etiqueta).width + tam * 0.8, hh = tam * 1.5;
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fillRect(mx - w/2, my - hh/2, w, hh);
      ctx.fillStyle = this.stroke; ctx.fillText(this.etiqueta, mx, my + 1);
      ctx.restore();
    }
  },
  // dibuja una línea quebrada con las vueltas redondeadas
  _poli(ctx, pts){
    const r0 = Math.max(10, this.strokeWidth * 3 + 8);
    for (let i = 1; i < pts.length - 1; i++){
      const a = pts[i-1], b = pts[i], c = pts[i+1];
      const r = Math.min(r0, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2);
      if (r < 0.5) ctx.lineTo(b.x, b.y); else ctx.arcTo(b.x, b.y, c.x, c.y, r);
    }
    ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
  },
  _punta(ctx, tipo, x, y, ang){
    if (!tipo || tipo === 'nada') return;
    const t = Math.max(14, this.strokeWidth * 4);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = this.stroke; ctx.strokeStyle = this.stroke; ctx.lineWidth = this.strokeWidth;
    ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (tipo === 'flecha'){ ctx.moveTo(0, 0); ctx.lineTo(-t, t*0.55); ctx.lineTo(-t, -t*0.55); ctx.closePath(); ctx.fill(); }
    else if (tipo === 'abierta'){ ctx.moveTo(-t, t*0.6); ctx.lineTo(0, 0); ctx.lineTo(-t, -t*0.6); ctx.stroke(); }
    else if (tipo === 'circulo'){ ctx.arc(-t*0.42, 0, t*0.42, 0, Math.PI * 2); ctx.fill(); }
    else if (tipo === 'rombo'){ ctx.moveTo(0, 0); ctx.lineTo(-t*0.6, t*0.45); ctx.lineTo(-t*1.2, 0); ctx.lineTo(-t*0.6, -t*0.45); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
});
fabric.Conector.fromObject = function(obj, cb){
  const o = fabric.util.object.clone(obj, true);
  const l = new fabric.Conector([o.x1, o.y1, o.x2, o.y2], o);
  cb && cb(l); return l;
};

function establecerZoom(z){
  zoom = Math.max(0.05, Math.min(z, 4));
  canvas.setZoom(zoom);
  canvas.setDimensions({ width: Math.round(W*zoom), height: Math.round(H*zoom) });
  $('zoomTxt').textContent = Math.round(zoom*100) + '%';
}
function ajustarZoom(){
  const a = $('area');
  establecerZoom(Math.min((a.clientWidth-80)/W, (a.clientHeight-80)/H));
  a.scrollLeft = a.scrollTop = 0;
}
function cambiarZoom(d){ establecerZoom(zoom + d); }
window.addEventListener('resize', () => { const o = canvas.getActiveObject(); if (o && o.isEditing) return; ajustarZoom(); });  // no se mueve mientras escribes (teclado del celular)

function fijarTamano(w, h){
  W = Math.round(w); H = Math.round(h);
  $('tamTxt').textContent = W + ' × ' + H;
  ajustarZoom(); miniaturas = [];
}
function cambiarTamano(w, h){
  fijarTamano(w, h);
  const f = canvas.getObjects().find(o => o.esFondo);
  if (f) ajustarRectFondo(f);
  canvas.requestRenderAll();
  guardarEstado();
}

/* =========================================================
   UTILIDADES
   ========================================================= */
function toast(msg){
  const t = $('toast'); t.textContent = msg; t.classList.add('ver');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('ver'), 2600);
}
function cargando(v){ $('cargando').style.display = v ? 'flex' : 'none'; }
function abrirModal(id){ $(id).classList.add('abierto'); }
function cerrarModal(id){ $(id).classList.remove('abierto'); }
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('abierto'); }));
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function aHex(c){
  if (!c || typeof c !== 'string') return '#000000';
  try { return '#' + new fabric.Color(c).toHex(); } catch(e){ return '#000000'; }
}
const esTexto = o => o && ['textbox','i-text','text'].includes(o.type);
const activo = () => canvas.getActiveObject();
function objetivos(){
  const o = activo(); if (!o) return [];
  if (o.type === 'activeSelection') return o.getObjects();
  return [o];
}
function hojas(o){ return (o.type === 'group') ? o.getObjects().flatMap(hojas) : [o]; }
const s = () => W / 1080; // escala relativa al tamaño

const nuevoId = () => 'o' + Math.random().toString(36).slice(2, 10);
// Caja de un elemento en coordenadas del lienzo, aunque esté dentro de una selección múltiple
function cajaAbs(o){
  if (!o.group) return o.getBoundingRect(true, true);
  const m = o.calcTransformMatrix(), d = o._getNonTransformedDimensions();
  const pts = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx, sy]) => fabric.util.transformPoint(new fabric.Point(sx*d.x/2, sy*d.y/2), m));
  const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
  const left = Math.min(...xs), top = Math.min(...ys);
  return { left, top, width: Math.max(...xs) - left, height: Math.max(...ys) - top };
}
const porId = id => id ? canvas.getObjects().find(o => o.id === id) : null;
const esLinea = o => !!o && (o.type === 'line' || o.type === 'conector');
function agregar(o, nombre){
  o.id = o.id || nuevoId();
  o.name = o.name || nombre || o.type;
  canvas.add(o);
  canvas.setActiveObject(o);
  canvas.requestRenderAll();
}

/* =========================================================
   HISTORIAL (deshacer / rehacer) + borrador automático
   ========================================================= */
let notaPagina = '';   // notas del presentador de la página actual
function jsonPagina(){ const j = canvas.toJSON(EXTRA); if (notaPagina) j.notas = notaPagina; return j; }
function serializar(){
  paginas[actual] = jsonPagina();
  return JSON.stringify({ v:2, w:W, h:H, p:paginas, i:actual, pres:presConfig });
}

function guardarEstado(){
  if (restaurando || generandoVista || (typeof recorte !== 'undefined' && recorte)) return;   // durante un recorte no se guarda el recuadro temporal
  try { autoGuardado(); } catch(e){}
  const j = serializar();
  if (historial[hi] === j) return;
  historial = historial.slice(0, hi+1);
  historial.push(j);
  if (historial.length > 60) historial.shift();
  hi = historial.length - 1;
  botonesHist();
  renderPaginas();
  clearTimeout(guardarEstado._b);
  guardarEstado._b = setTimeout(() => {
    try { localStorage.setItem('disenador_borrador', j); localStorage.setItem('disenador_nombre', $('nombreDiseno').value); } catch(e){}
  }, 800);
}
function botonesHist(){ $('bDeshacer').disabled = hi <= 0; $('bRehacer').disabled = hi >= historial.length-1; }

function cargarJSON(txt, conHistorial, alTerminar){
  const d = JSON.parse(txt);
  restaurando = true;
  W = d.w; H = d.h; $('tamTxt').textContent = W + ' × ' + H;
  if (d.pres) presConfig = { ...presConfig, ...d.pres };
  if (d.p){ paginas = d.p; actual = Math.min(d.i || 0, paginas.length - 1); }
  else { paginas = [d.c]; actual = 0; }
  miniaturas = [];
  canvas.discardActiveObject();
  notaPagina = (paginas[actual] && paginas[actual].notas) || ''; if (typeof mostrarNotas === 'function') mostrarNotas();
  canvas.loadFromJSON(paginas[actual] || PAGINA_VACIA(), () => {
    canvas.renderAll(); normalizarVinculos();
    restaurando = false;
    establecerZoom(zoom); ajustarZoom();
    renderCapas(); actualizarPanel();
    if (conHistorial) guardarEstado();
    botonesHist(); renderPaginas();
    if (alTerminar) alTerminar();
  });
}
function deshacer(){ if (hi > 0){ hi--; cargarJSON(historial[hi], false); } }
function rehacer(){ if (hi < historial.length-1){ hi++; cargarJSON(historial[hi], false); } }

/* =========================================================
   TEXTO
   ========================================================= */
function agregarTexto(tipo, opciones){
  const cfg = {
    titulo:   { text:'Agrega un título', fontSize:96, fontWeight:'700', fontFamily:'Montserrat' },
    subtitulo:{ text:'Agrega un subtítulo', fontSize:56, fontWeight:'600', fontFamily:'Poppins' },
    cuerpo:   { text:'Agrega un poco de texto', fontSize:36, fontWeight:'400', fontFamily:'Inter' }
  }[tipo];
  const t = new fabric.Textbox(cfg.text, Object.assign({
    left:W/2, top:H/2, originX:'center', originY:'center', width:W*0.75,
    fontFamily:cfg.fontFamily, fontSize:cfg.fontSize*s(), fontWeight:cfg.fontWeight,
    fill:'#1f2330', textAlign:'center', lineHeight:1.15, splitByGrapheme:false
  }, opciones || {}));
  agregar(t, 'Texto');
  return t;
}
function agregarCombo(f1, f2){
  const a = agregarTexto('titulo', { fontFamily:f1, top:H/2 - 50*s(), text: f1 === 'Pacifico' || f1 === 'Playfair Display' ? 'Tu título aquí' : 'TU TÍTULO AQUÍ' });
  const b = agregarTexto('cuerpo', { fontFamily:f2, top:H/2 + 50*s(), text:'Escribe aquí un texto complementario' });
  const sel = new fabric.ActiveSelection([a, b], { canvas });
  canvas.setActiveObject(sel); canvas.requestRenderAll();
}

/* =========================================================
   FORMAS
   ========================================================= */
function puntosEstrella(n, R, r){
  const p = [];
  for (let i = 0; i < n*2; i++){
    const rad = i % 2 ? r : R, a = Math.PI/n*i - Math.PI/2;
    p.push({ x: rad*Math.cos(a), y: rad*Math.sin(a) });
  }
  return p;
}
function puntosPoligono(n, R){
  const p = [];
  for (let i = 0; i < n; i++){ const a = 2*Math.PI/n*i - Math.PI/2; p.push({ x:R*Math.cos(a), y:R*Math.sin(a) }); }
  return p;
}
function agregarForma(tipo){
  const k = s(), color = $('colorForma').value;
  const base = { left:W/2, top:H/2, originX:'center', originY:'center', fill:color, strokeWidth:0, stroke:null };
  let o, nombre;
  switch (tipo){
    case 'rect': o = new fabric.Rect({ ...base, width:320*k, height:320*k }); nombre='Rectángulo'; break;
    case 'redondo': o = new fabric.Rect({ ...base, width:320*k, height:320*k, rx:40*k, ry:40*k }); nombre='Rectángulo'; break;
    case 'circulo': o = new fabric.Circle({ ...base, radius:160*k }); nombre='Círculo'; break;
    case 'triangulo': o = new fabric.Triangle({ ...base, width:320*k, height:280*k }); nombre='Triángulo'; break;
    case 'estrella': o = new fabric.Polygon(puntosEstrella(5, 170*k, 70*k), base); nombre='Estrella'; break;
    case 'hexagono': o = new fabric.Polygon(puntosPoligono(6, 160*k), base); nombre='Hexágono'; break;
    case 'flecha': o = new fabric.Polygon([{x:0,y:90},{x:220,y:90},{x:220,y:20},{x:360,y:150},{x:220,y:280},{x:220,y:210},{x:0,y:210}].map(p=>({x:p.x*k,y:p.y*k})), base); nombre='Flecha'; break;
    case 'corazon':
      o = new fabric.Path('M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 47 14 50 22 C53 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z', base);
      o.scaleToWidth(320*k); nombre='Corazón'; break;
    case 'linea':
      o = new fabric.Line([0, 0, 420*k, 0], { ...base, fill:null, stroke:color, strokeWidth:8*k, strokeLineCap:'round' });
      nombre='Línea'; break;
  }
  agregar(o, nombre);
}

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

/* =========================================================
   FONDO
   ========================================================= */
function quitarRectFondo(){ canvas.getObjects().filter(o => o.esFondo).forEach(o => canvas.remove(o)); }
function ajustarRectFondo(r){
  if (r.type === 'image'){
    const f = Math.max(W / r.width, H / r.height);
    r.set({ scaleX:f, scaleY:f, left:W/2, top:H/2, originX:'center', originY:'center' });
  } else {
    r.set({ width:W, height:H, left:0, top:0 });
    if (r.fill && r.fill.colorStops) r.set('fill', crearDegradado(r.fill.colorStops[0].color, r.fill.colorStops[r.fill.colorStops.length-1].color));
  }
  r.setCoords();
}
function crearDegradado(a, b){
  return new fabric.Gradient({ type:'linear', gradientUnits:'pixels', coords:{ x1:0, y1:0, x2:W, y2:H },
    colorStops:[{ offset:0, color:a }, { offset:1, color:b }] });
}
function fijarFondo(o){
  o.set({ selectable:false, evented:false, esFondo:true, name:'Fondo', hasControls:false });
  canvas.add(o); canvas.sendToBack(o); canvas.requestRenderAll();
}
function fondoColor(c){
  restaurando = true; quitarRectFondo(); restaurando = false;
  canvas.backgroundColor = c; $('colorFondo').value = aHex(c);
  canvas.requestRenderAll(); renderCapas(); guardarEstado();
}
function fondoDegradado(a, b){
  restaurando = true; quitarRectFondo();
  fijarFondo(new fabric.Rect({ left:0, top:0, width:W, height:H, fill:crearDegradado(a, b) }));
  restaurando = false; guardarEstado();
}
function fondoImagen(url){
  fabric.Image.fromURL(url, img => {
    restaurando = true; quitarRectFondo();
    ajustarRectFondo(img); img.fx = { b:0, c:0, s:0, bl:0 };
    fijarFondo(img); restaurando = false; guardarEstado(); renderCapas();
  });
}
function quitarFondo(){
  restaurando = true; quitarRectFondo(); restaurando = false;
  canvas.backgroundColor = null; canvas.requestRenderAll(); renderCapas(); guardarEstado();
  toast('El fondo ahora es transparente');
}
function usarComoFondo(){
  const o = activo(); if (!o || o.type !== 'image') return;
  restaurando = true; quitarRectFondo(); canvas.remove(o);
  o.set({ angle:0, flipX:false, flipY:false });
  ajustarRectFondo(o); fijarFondo(o); restaurando = false;
  canvas.discardActiveObject(); guardarEstado(); renderCapas();
}
$('colorFondo').addEventListener('input', e => { canvas.backgroundColor = e.target.value; canvas.requestRenderAll(); });
$('colorFondo').addEventListener('change', e => fondoColor(e.target.value));
$('archivoFondo').onchange = e => { leerArchivo(e.target.files[0], fondoImagen); e.target.value = ''; };

COLORES.forEach(c => { const d = document.createElement('div'); d.className='sw'; d.style.background=c; d.onclick=()=>fondoColor(c); $('swFondo').appendChild(d); });
DEGRADADOS.forEach(([a,b]) => { const d = document.createElement('div'); d.className='sw'; d.style.background=`linear-gradient(135deg,${a},${b})`; d.onclick=()=>fondoDegradado(a,b); $('swDegradado').appendChild(d); });

/* =========================================================
   PANEL DE PROPIEDADES
   ========================================================= */
function aplicar(prop, valor, sinGuardar){
  objetivos().forEach(o => hojas(o).forEach(x => {
    if (prop === 'fill' && x.type === 'image') return;
    if (prop === 'fill' && x.textoDe && objetivos().includes(porId(x.textoDe))) return;   // no pintar el texto del mismo color que su forma
    if (prop === 'fill' && (esLinea(x) || x.trazoLibre)) { x.set('stroke', valor); return; }
    x.set(prop, valor);
    if (esTexto(x) && x.initDimensions) x.initDimensions();
  }));
  objetivos().forEach(o => { o.dirty = true; if (o.type === 'group' && o.addWithUpdate) o.addWithUpdate(); });
  const a = activo(); if (a && a.type === 'activeSelection') a.addWithUpdate();
  objetivos().flatMap(hojas).filter(x => x.textoDe).forEach(ajustarFormaATexto);
  canvas.requestRenderAll();
  if (!sinGuardar) guardarEstado();
}
function textos(){ return objetivos().flatMap(hojas).filter(esTexto); }

function actualizarPanel(){
  if (generandoVista) return;
  const o = activo();
  $('sinSel').hidden = !!o; $('propsCont').hidden = !o;
  if (!o) return;
  const hs = objetivos().flatMap(hojas);
  const ref = hs[0] || o;
  const hayTexto = hs.some(esTexto);
  const soloImagen = hs.every(x => x.type === 'image');
  $('secTexto').hidden = !hayTexto;
  $('secImagen').hidden = !(o.type === 'image');
  $('secEsquinas').hidden = !(o.type === 'rect');
  $('secRelleno').hidden = soloImagen;
  $('secBorde').hidden = false;

  if (!soloImagen) $('pRelleno').value = aHex(esLinea(ref) || ref.trazoLibre ? ref.stroke : ref.fill);
  $('pBorde').value = aHex(ref.stroke || '#000000');
  $('pGrosor').value = esLinea(ref) ? ref.strokeWidth : (ref.stroke ? ref.strokeWidth : 0);
  $('pOpac').value = Math.round((o.opacity ?? 1) * 100);
  $('pSombra').checked = !!ref.shadow;
  if (ref.shadow){ $('pSombraColor').value = aHex(ref.shadow.color); $('pSombraBlur').value = ref.shadow.blur; }
  if (o.type === 'rect') $('pRadio').value = o.rx || 0;

  if (hayTexto){
    const t = hs.find(esTexto);
    $('pFuente').value = t.fontFamily;
    $('pTam').value = Math.round(t.fontSize * (o === t ? t.scaleY : 1));
    $('bNegrita').classList.toggle('on', String(t.fontWeight) === 'bold' || +t.fontWeight >= 600);
    $('bCursiva').classList.toggle('on', t.fontStyle === 'italic');
    $('bSubrayado').classList.toggle('on', !!t.underline);
    $('bTachado').classList.toggle('on', !!t.linethrough);
    document.querySelectorAll('#alineaciones .pb').forEach(b => b.classList.toggle('on', b.dataset.al === t.textAlign));
    $('pInter').value = t.lineHeight; $('pEsp').value = t.charSpacing || 0;
    $('filaCurva').hidden = !(o === t && !t.textoDe && !t.tabla && !t.esDeco);
    $('pCurva').value = t.curva || 0;
    document.querySelectorAll('#efectosTexto .efectoBtn').forEach(b => b.classList.toggle('on', b.dataset.e === (t.efectoTexto || 'ninguno')));
  }
  if (o.type === 'image'){
    const fx = o.fx || {};
    $('fBrillo').value = fx.b || 0; $('fContraste').value = fx.c || 0; $('fSaturacion').value = fx.s || 0; $('fBlur').value = fx.bl || 0;
    $('fGris').classList.toggle('on', !!fx.gris); $('fSepia').classList.toggle('on', !!fx.sepia); $('fInvertir').classList.toggle('on', !!fx.inv);
  }
  $('bAgrupar').hidden = !(o.type === 'activeSelection' || o.type === 'group');
  $('bAgrupar').textContent = o.type === 'group' ? 'Desagrupar' : 'Agrupar';
  $('bBloquear').textContent = o.bloqueado ? '🔓 Desbloquear' : '🔒 Bloquear';
  $('bConectar').hidden = !(o.type === 'activeSelection' && candidatosConexion().length === 2);
  $('bFlecha').hidden = true;
  $('secConector').hidden = o.type !== 'conector';
  $('grupoMulti').hidden = o.type !== 'activeSelection' || !!o.esTabla;
  $('secTabla').hidden = !tablaActual();
  if (o.type !== 'activeSelection' && puedeTenerTexto(nodoBase(o))) $('pTipoForma').value = nodoBase(o).forma || '';
  $('secDiagrama').hidden = !(o.type !== 'activeSelection' && puedeTenerTexto(nodoBase(o)));
  if (o.type === 'conector'){
    document.querySelectorAll('#estilosCon .pb').forEach(b => b.classList.toggle('on', b.dataset.e === (o.estilo || 'recta')));
    $('pInicio').value = o.inicio || 'nada';
    $('pFin').value = o.fin || (o.flecha ? 'flecha' : 'nada');
    const pat = o.patron || (o.strokeDashArray ? 'guiones' : 'solida');
    document.querySelectorAll('#patronesCon .pb').forEach(b => b.classList.toggle('on', b.dataset.p === pat));
    if (document.activeElement !== $('pEtiqueta')) $('pEtiqueta').value = o.etiqueta || '';
  }
  $('bTextoDentro').hidden = !puedeTenerTexto(o);
  $('secGrafica').hidden = !o.grafica;
  const esMarco = !!(o.marco || o.marcoVacio);
  $('secMarco').hidden = !esMarco;
  if (esMarco){
    $('ajustesFoto').hidden = !o.marco;
    $('bSubirFoto').textContent = o.marco ? '📷 Cambiar foto' : '📷 Subir foto';
    if (o.marco){ $('mZoom').value = o.marco.zoom; $('mPx').value = o.marco.px; $('mPy').value = o.marco.py; $('mTipo').value = o.marco.tipo; $('secEsquinas').hidden = true; }
    if (o.marcoVacio){ ['secTexto','secRelleno','secBorde','secEsquinas'].forEach(id => $(id).hidden = true); $('bAgrupar').hidden = true; }
  }
  if (o.grafica){
    ['secTexto','secRelleno','secBorde','secEsquinas'].forEach(id => $(id).hidden = true);
    $('bAgrupar').hidden = true;
    const d = o.grafica;
    document.querySelectorAll('#tiposGraf .pb').forEach(b => b.classList.toggle('on', b.dataset.t === d.tipo));
    if (document.activeElement !== $('gTitulo')) $('gTitulo').value = d.titulo || '';
    if (document.activeElement !== $('gDatos')) $('gDatos').value = d.datos.map(x => `${x.e}, ${x.v}`).join('\n');
    $('gPaleta').value = d.paleta; $('gValores').checked = !!d.valores;
  }
}

// Fuentes
FUENTES.forEach(f => { const op = document.createElement('option'); op.value = f; op.textContent = f; op.style.fontFamily = f; $('pFuente').appendChild(op); });
$('pFuente').onchange = e => {
  const f = e.target.value;
  const fin = () => { fabric.util.clearFabricFontCache(f); textos().forEach(t => { t.set('fontFamily', f); t.initDimensions(); }); aplicar('dirty', true); };
  document.fonts.load(`700 40px "${f}"`).then(fin).catch(fin);
};
$('pTam').addEventListener('change', e => {
  const v = +e.target.value; if (!v) return;
  textos().forEach(t => t.set('fontSize', v / (t === activo() ? t.scaleY : 1)));
  aplicar('dirty', true);
});
$('bNegrita').onclick = () => { const on = !$('bNegrita').classList.contains('on'); textos().forEach(t => t.set('fontWeight', on ? '700' : '400')); aplicar('dirty', true); actualizarPanel(); };
$('bCursiva').onclick = () => { const on = !$('bCursiva').classList.contains('on'); textos().forEach(t => t.set('fontStyle', on ? 'italic' : 'normal')); aplicar('dirty', true); actualizarPanel(); };
$('bSubrayado').onclick = () => { const on = !$('bSubrayado').classList.contains('on'); textos().forEach(t => t.set('underline', on)); aplicar('dirty', true); actualizarPanel(); };
$('bTachado').onclick = () => { const on = !$('bTachado').classList.contains('on'); textos().forEach(t => t.set('linethrough', on)); aplicar('dirty', true); actualizarPanel(); };
$('bMayus').onclick = () => {
  textos().forEach(t => { const up = t.text === t.text.toUpperCase(); t.set('text', up ? t.text.toLowerCase().replace(/(^|[.!?]\s+)(\p{L})/gu, (m,a,b)=>a+b.toUpperCase()) : t.text.toUpperCase()); });
  aplicar('dirty', true);
};
document.querySelectorAll('#alineaciones .pb').forEach(b => b.onclick = () => { textos().forEach(t => t.set('textAlign', b.dataset.al)); aplicar('dirty', true); actualizarPanel(); });
$('pInter').addEventListener('input', e => { textos().forEach(t => { t.set('lineHeight', +e.target.value); t.initDimensions(); if (t.textoDe) ajustarFormaATexto(t); }); canvas.requestRenderAll(); });
$('pInter').addEventListener('change', guardarEstado);
$('pEsp').addEventListener('input', e => { textos().forEach(t => { t.set('charSpacing', +e.target.value); t.initDimensions(); if (t.textoDe) ajustarFormaATexto(t); }); canvas.requestRenderAll(); });
$('pEsp').addEventListener('change', guardarEstado);
$('pResalte').addEventListener('input', e => { textos().forEach(t => t.set('textBackgroundColor', e.target.value)); aplicar('dirty', true, true); });
$('pResalte').addEventListener('change', guardarEstado);
$('bSinResalte').onclick = () => { textos().forEach(t => t.set('textBackgroundColor', '')); aplicar('dirty', true); };

// Color, borde, esquinas, opacidad, sombra
$('pRelleno').addEventListener('input', e => aplicar('fill', e.target.value, true));
$('pRelleno').addEventListener('change', guardarEstado);
$('pBorde').addEventListener('input', e => { aplicar('stroke', e.target.value, true); });
$('pBorde').addEventListener('change', guardarEstado);
$('pGrosor').addEventListener('input', e => {
  const v = +e.target.value;
  objetivos().flatMap(hojas).forEach(x => { if (!x.stroke) x.set('stroke', $('pBorde').value); x.set({ strokeWidth:v, paintFirst: esTexto(x) ? 'stroke' : 'fill', strokeUniform: !esTexto(x) }); if (esTexto(x)) x.initDimensions(); });
  aplicar('dirty', true, true);
});
$('pGrosor').addEventListener('change', guardarEstado);
$('pRadio').addEventListener('input', e => { aplicar('rx', +e.target.value, true); aplicar('ry', +e.target.value, true); });
$('pRadio').addEventListener('change', guardarEstado);
$('pOpac').addEventListener('input', e => { objetivos().forEach(o => o.set('opacity', e.target.value/100)); canvas.requestRenderAll(); });
$('pOpac').addEventListener('change', guardarEstado);
function aplicarSombra(){
  const on = $('pSombra').checked, k = s();
  const sh = on ? new fabric.Shadow({ color: hexAlpha($('pSombraColor').value, 0.45), blur: +$('pSombraBlur').value * k, offsetX: 8*k, offsetY: 8*k }) : null;
  objetivos().forEach(o => o.set('shadow', sh)); canvas.requestRenderAll();
}
function hexAlpha(h, a){ const c = new fabric.Color(h); c.setAlpha(a); return c.toRgba(); }
$('pSombra').addEventListener('change', () => { aplicarSombra(); guardarEstado(); });
$('pSombraColor').addEventListener('input', aplicarSombra);
$('pSombraColor').addEventListener('change', guardarEstado);
$('pSombraBlur').addEventListener('input', aplicarSombra);
$('pSombraBlur').addEventListener('change', guardarEstado);

/* =========================================================
   ORGANIZAR
   ========================================================= */
function orden(acc){
  const o = activo(); if (!o) return;
  const f = { frente:'bringToFront', adelante:'bringForward', atras:'sendBackwards', fondo:'sendToBack' }[acc];
  canvas[f](o);
  // El fondo siempre debe quedar hasta atrás
  canvas.getObjects().filter(x => x.esFondo).forEach(x => canvas.sendToBack(x));
  ordenarVinculos();
  canvas.requestRenderAll(); renderCapas(); guardarEstado();
}
// Ejecuta cambios sobre los elementos sueltos de una selección múltiple y la vuelve a armar
function enSeleccion(fn){
  const a = activo(); if (!a || a.type !== 'activeSelection') return false;
  const objs = a.getObjects().filter(x => !x.textoDe && x.type !== 'conector');
  canvas.discardActiveObject();
  fn(objs);
  objs.forEach(o => { o.setCoords(); seguirVinculos(o); });
  actualizarTodasConexiones();
  canvas.setActiveObject(new fabric.ActiveSelection(objs.slice(), { canvas })); incluirVinculados();
  canvas.requestRenderAll(); guardarEstado();
  return true;
}
const mover = (o, dx, dy) => o.set({ left: o.left + dx, top: o.top + dy });
function alinear(d){
  const o = activo(); if (!o) return;
  if (o.type === 'activeSelection' && o.getObjects().filter(x => !x.textoDe && x.type !== 'conector').length > 1){
    enSeleccion(objs => {
      const rs = objs.map(x => cajaAbs(x));
      const L = Math.min(...rs.map(r => r.left)), R = Math.max(...rs.map(r => r.left + r.width));
      const T = Math.min(...rs.map(r => r.top)), B = Math.max(...rs.map(r => r.top + r.height));
      objs.forEach((x, i) => {
        const r = rs[i];
        if (d === 'izq') mover(x, L - r.left, 0);
        if (d === 'der') mover(x, R - (r.left + r.width), 0);
        if (d === 'centroH') mover(x, (L + R)/2 - (r.left + r.width/2), 0);
        if (d === 'arriba') mover(x, 0, T - r.top);
        if (d === 'abajo') mover(x, 0, B - (r.top + r.height));
        if (d === 'centroV') mover(x, 0, (T + B)/2 - (r.top + r.height/2));
      });
    });
    return;
  }
  const r = cajaAbs(o);
  let dx = 0, dy = 0;
  if (d === 'izq') dx = -r.left;
  if (d === 'der') dx = W - (r.left + r.width);
  if (d === 'centroH') dx = W/2 - (r.left + r.width/2);
  if (d === 'arriba') dy = -r.top;
  if (d === 'abajo') dy = H - (r.top + r.height);
  if (d === 'centroV') dy = H/2 - (r.top + r.height/2);
  o.set({ left: o.left + dx, top: o.top + dy }); o.setCoords();
  seguirVinculos(o);
  canvas.requestRenderAll(); guardarEstado();
}
function distribuir(eje){
  enSeleccion(objs => {
    if (objs.length < 3){ toast('Selecciona 3 o más elementos para distribuirlos'); return; }
    const info = objs.map(x => ({ x, r: cajaAbs(x) }));
    const k = eje === 'h' ? 'left' : 'top', tam = eje === 'h' ? 'width' : 'height';
    info.sort((a, b) => (a.r[k] + a.r[tam]/2) - (b.r[k] + b.r[tam]/2));
    const ini = info[0].r[k], fin = info[info.length-1].r[k] + info[info.length-1].r[tam];
    const hueco = (fin - ini - info.reduce((s, i) => s + i.r[tam], 0)) / (info.length - 1);
    let pos = ini;
    info.forEach(i => { const d = pos - i.r[k]; eje === 'h' ? mover(i.x, d, 0) : mover(i.x, 0, d); pos += i.r[tam] + hueco; });
  });
}
function igualarTamano(){
  enSeleccion(objs => {
    const w = Math.max(...objs.map(x => x.getScaledWidth())), hh = Math.max(...objs.map(x => x.getScaledHeight()));
    objs.forEach(x => {
      const c = x.getCenterPoint();
      if (puedeTenerTexto(x)) fijarTamanoForma(x, w, hh); else x.set({ scaleX: w / x.width, scaleY: hh / x.height });
      x.setPositionByOrigin(c, 'center', 'center');
      x.anchoBase = w; x.altoBase = hh; x.anchoMax = null;
      const t = porId(x.formaTexto); if (t){ t.set('width', anchoTexto(x)); ajustarFormaATexto(t); }
    });
  });
}

/* ---------- Copiar y pegar estilo ---------- */
let estiloCopiado = null;
function copiarEstilo(){
  const o = activo(); if (!o) return;
  if (o.type === 'conector'){ estiloCopiado = { conector: heredarConector(o) }; }
  else {
    const f = nodoBase(o.type === 'activeSelection' ? o.getObjects()[0] : o);
    const t = esTexto(f) ? f : porId(f.formaTexto);
    estiloCopiado = {
      forma: esTexto(f) ? null : { fill:f.fill, stroke:f.stroke, strokeWidth:f.strokeWidth, opacity:f.opacity, shadow:f.shadow ? f.shadow.toObject() : null },
      texto: t ? { fontFamily:t.fontFamily, fontSize:t.fontSize, fontWeight:t.fontWeight, fontStyle:t.fontStyle, fill:t.fill, underline:t.underline, textAlign:t.textAlign } : null
    };
  }
  $('bPegarEstilo').classList.add('on');
  toast('Estilo copiado. Selecciona otro elemento y pulsa “Pegar estilo”');
}
function pegarEstilo(){
  if (!estiloCopiado){ toast('Primero copia un estilo'); return; }
  const lista = canvas.getActiveObjects(); if (!lista.length) return;
  lista.forEach(o => {
    if (o.type === 'conector'){ if (estiloCopiado.conector){ const c = estiloCopiado.conector; o.set({ estilo:c.estilo, inicio:c.inicio, fin:c.fin, patron:c.patron, stroke:c.color, strokeWidth:c.ancho, fijo:false }); actualizarConector(o); } return; }
    const f = nodoBase(o);
    if (estiloCopiado.forma && !esTexto(f) && f.type !== 'image'){
      const e = estiloCopiado.forma;
      f.set({ fill:e.fill, stroke:e.stroke, strokeWidth:e.strokeWidth, opacity:e.opacity, shadow: e.shadow ? new fabric.Shadow(e.shadow) : null });
    }
    const t = esTexto(f) ? f : porId(f.formaTexto);
    if (t && estiloCopiado.texto){ t.set(estiloCopiado.texto); t.initDimensions(); if (t.textoDe) ajustarFormaATexto(t); }
  });
  canvas.requestRenderAll(); actualizarPanel(); guardarEstado();
}

function voltear(p){ const o = activo(); if (!o) return; o.set(p, !o[p]); canvas.requestRenderAll(); guardarEstado(); }
function agruparToggle(){
  const o = activo(); if (!o) return;
  if (o.type === 'activeSelection'){ const g = o.toGroup(); g.name = 'Grupo'; }
  else if (o.type === 'group'){ o.toActiveSelection(); }
  canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado();
}
function bloquear(o, v){
  o.set({ bloqueado:v, lockMovementX:v, lockMovementY:v, lockScalingX:v, lockScalingY:v, lockRotation:v, hasControls:!v, editable:!v });
}
function bloquearSel(){
  const o = activo(); if (!o) return;
  const v = !o.bloqueado;
  if (o.type === 'activeSelection') o.getObjects().forEach(x => bloquear(x, v));
  bloquear(o, v);
  canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado();
}
function eliminar(){
  let objs = canvas.getActiveObjects().filter(o => !o.bloqueado);
  if (!objs.length) return;
  canvas.discardActiveObject();
  // Al borrar una forma se borra su texto; al borrar un extremo se borra su conector
  objs.forEach(o => { const t = porId(o.formaTexto); if (t && !objs.includes(t)) objs.push(t); });
  objs.forEach(o => { if (o.textoDe){ const f = porId(o.textoDe); if (f && !objs.includes(f)) f.formaTexto = null; } });
  const ids = new Set(objs.map(o => o.id).filter(Boolean));
  canvas.getObjects().forEach(c => { if (c.type === 'conector' && !objs.includes(c) && (ids.has(c.conA) || ids.has(c.conB))) objs.push(c); });
  restaurando = true; objs.forEach(o => canvas.remove(o)); restaurando = false;
  canvas.requestRenderAll(); renderCapas(); guardarEstado();
}
function clonar(o, cb){ o.clone(cb, EXTRA); }
function pegarClon(c){
  limpiarVinculosClon(c);
  c.set({ left: c.left + 30*s(), top: c.top + 30*s(), evented:true });
  if (c.type === 'activeSelection'){
    c.canvas = canvas;
    restaurando = true; c.forEachObject(x => canvas.add(x)); restaurando = false;
    c.setCoords();
  } else { restaurando = true; canvas.add(c); restaurando = false; }
  canvas.setActiveObject(c); canvas.requestRenderAll(); renderCapas(); guardarEstado();
}
function duplicar(){ const o = activo(); if (o) clonar(o, pegarClon); }

/* =========================================================
   CAPAS
   ========================================================= */
const iconoCapa = o => o.esFondo ? '▧' : o.tabla ? '▦' : o.grafica ? '📊' : (o.marco || o.marcoVacio) ? '📷' : o.type === 'image' ? '🖼' :
  o.trazoLibre ? '✎' : o.type === 'conector' ? '↗' : esTexto(o) ? 'T' : o.esDeco ? '✿' : o.type === 'group' ? '⧉' : '◆';
function nombreCapa(o){
  if (o.nombrePropio) return o.nombrePropio;
  if (o.esFondo) return 'Fondo';
  if (o.tabla){ const cs = celdasDe(o.tabla); return `Tabla ${Math.max(...cs.map(c => c.fila)) + 1} × ${Math.max(...cs.map(c => c.col)) + 1}`; }
  if (o.grafica) return 'Gráfica: ' + (o.grafica.titulo || o.grafica.tipo);
  if (o.type === 'conector'){
    const t = id => { const f = porId(id); if (!f) return '?'; const tt = porId(f.formaTexto); return tt && tt.text ? tt.text.split('\n')[0].slice(0, 14) : nombreCapa(f); };
    return `${t(o.conA)} → ${t(o.conB)}`;
  }
  const t = o.formaTexto ? porId(o.formaTexto) : (esTexto(o) ? o : null);
  if (t && t.text && t.text.trim()) return t.text.replace(/\n/g, ' ').slice(0, 28);
  return o.name || o.type;
}
// Lo que se mueve, oculta o bloquea junto con una capa (la forma con su texto, o la tabla completa)
function miembrosCapa(o){
  if (o.tabla) return celdasDe(o.tabla).flatMap(c => [c, porId(c.formaTexto)].filter(Boolean));
  return [o, porId(o.formaTexto)].filter(Boolean);
}
let conectoresAbiertos = false;
function renderCapas(){
  if (generandoVista) return;
  clearTimeout(renderCapas._t);
  renderCapas._t = setTimeout(() => {
    const ul = $('capas'); if (!ul) return;
    ul.innerHTML = '';
    const sel = new Set(canvas.getActiveObjects().map(nodoBase).filter(Boolean));
    const tablasSel = new Set([...sel].map(x => x.tabla).filter(Boolean));
    const tablasVistas = new Set(), conectores = [];
    let total = 0;
    canvas.getObjects().slice().reverse().forEach(o => {
      if (o.textoDe && porId(o.textoDe)) return;                 // el texto va junto con su forma
      if (o.type === 'conector'){ conectores.push(o); return; }
      if (o.tabla){ if (tablasVistas.has(o.tabla)) return; tablasVistas.add(o.tabla); }
      total++;
      ul.appendChild(filaCapa(o, sel.has(o) || (o.tabla && tablasSel.has(o.tabla))));
    });
    if (conectores.length){
      const li = document.createElement('li'); li.className = 'grupoCapa';
      li.innerHTML = `<span class="ic">${conectoresAbiertos ? '▾' : '▸'}</span><span class="cn">Líneas y conectores (${conectores.length})</span>`;
      li.onclick = () => { conectoresAbiertos = !conectoresAbiertos; renderCapas(); };
      ul.appendChild(li);
      if (conectoresAbiertos || conectores.some(c => sel.has(c))) conectores.forEach(c => { const f = filaCapa(c, sel.has(c)); f.classList.add('sub'); f.draggable = false; ul.appendChild(f); });
      total += conectores.length;
    }
    const n = $('numCapas'); if (n) n.textContent = `(${total})`;
  }, 40);
}
function filaCapa(o, seleccionado){
  o.id = o.id || nuevoId();
  const li = document.createElement('li');
  if (seleccionado) li.className = 'sel';
  li.draggable = !o.esFondo;
  li.innerHTML = `<span class="ic">${iconoCapa(o)}</span><span class="cn" title="Clic para seleccionar · doble clic para renombrar">${esc(nombreCapa(o))}</span>
    <button title="Mostrar / ocultar">${o.visible ? '👁' : '◌'}</button>
    <button title="${o.esFondo ? 'Quitar fondo' : 'Bloquear'}">${o.bloqueado || o.esFondo ? '🔒' : '🔓'}</button>`;
  const cn = li.querySelector('.cn');
  cn.onclick = () => {
    if (!o.visible || o.esFondo) return;
    if (o.tabla) seleccionarTabla(o.tabla); else { canvas.setActiveObject(o); canvas.requestRenderAll(); }
  };
  cn.ondblclick = () => {
    const nombre = prompt('Nombre de la capa:', nombreCapa(o));
    if (nombre === null) return;
    o.nombrePropio = nombre.trim() || null; renderCapas(); guardarEstado();
  };
  const [bv, bl] = li.querySelectorAll('button');
  bv.onclick = e => {
    e.stopPropagation();
    const v = !o.visible; miembrosCapa(o).forEach(x => x.visible = v);
    if (!v) canvas.discardActiveObject();
    canvas.requestRenderAll(); renderCapas(); guardarEstado();
  };
  bl.onclick = e => {
    e.stopPropagation();
    if (o.esFondo){ if (confirm('¿Quitar este fondo?')){ restaurando = true; canvas.remove(o); restaurando = false; renderCapas(); guardarEstado(); } return; }
    const v = !o.bloqueado; miembrosCapa(o).forEach(x => bloquear(x, v));
    canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado();
  };
  if (!o.esFondo){
    li.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', o.id); e.dataTransfer.effectAllowed = 'move'; li.classList.add('arrastrando'); });
    li.addEventListener('dragend', () => li.classList.remove('arrastrando'));
  }
  li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('destino'); });
  li.addEventListener('dragleave', () => li.classList.remove('destino'));
  li.addEventListener('drop', e => {
    e.preventDefault(); li.classList.remove('destino');
    const mov = porId(e.dataTransfer.getData('text/plain'));
    if (mov && mov !== o) moverCapaSobre(mov, o);
  });
  return li;
}
// Pone una capa (con su texto o su tabla completa) justo encima de otra
function moverCapaSobre(mov, destino){
  const grupo = miembrosCapa(mov), objs = canvas._objects;
  if (destino.tabla && grupo.includes(destino)) return;
  grupo.forEach(x => { const i = objs.indexOf(x); if (i >= 0) objs.splice(i, 1); });
  const ref = miembrosCapa(destino).map(x => objs.indexOf(x)).filter(i => i >= 0);
  const idx = destino.esFondo ? (ref.length ? Math.max(...ref) + 1 : 0) : Math.max(...ref) + 1;
  objs.splice(idx, 0, ...grupo);
  ordenarVinculos();
  canvas.getObjects().filter(x => x.esFondo).forEach(x => canvas.sendToBack(x));
  canvas.requestRenderAll(); renderCapas(); guardarEstado();
}

/* =========================================================
   EVENTOS DEL LIENZO
   ========================================================= */
['selection:created','selection:updated','selection:cleared'].forEach(ev => canvas.on(ev, () => { incluirVinculados(); actualizarPanel(); renderCapas(); }));
canvas.on('object:added', () => { renderCapas(); guardarEstado(); revisarAuto(); });
canvas.on('object:removed', () => { renderCapas(); guardarEstado(); });
canvas.on('object:modified', e => {
  const o = e.target;
  // Al escalar un texto desde las esquinas se convierte en tamaño de fuente (como en Canva)
  if (esTexto(o) && (o.scaleX !== 1 || o.scaleY !== 1)){
    o.set({ fontSize: o.fontSize * o.scaleY, width: o.width * o.scaleX, scaleX:1, scaleY:1 });
    o.initDimensions(); o.setCoords();
  }
  if (o && o.marco) ajustarFoto(o);   // al estirar una foto enmarcada se recorta, no se deforma
  vinculosAlModificar(o);
  guardarEstado(); actualizarPanel(); revisarAuto();
});
['object:moving','object:scaling','object:rotating','object:resizing'].forEach(ev => canvas.on(ev, e => { seguirVinculos(e.target); crecerAlArrastrar(e.target); }));
canvas.on('mouse:dblclick', e => {
  const o = e.target;
  if (o && o.type === 'activeSelection' && o.esTabla){
    const q = canvas.getPointer(e.e);
    const c = celdasDe(o.esTabla).find(c => { const r = cajaAbs(c); return q.x >= r.left && q.x <= r.left + r.width && q.y >= r.top && q.y <= r.top + r.height; });
    if (c) editarCelda(c);
    return;
  }
  if (o && o.type === 'conector'){ canvas.setActiveObject(o); actualizarPanel(); setTimeout(() => $('pEtiqueta').focus(), 50); return; }
  if (o && puedeTenerTexto(o)) textoEnForma(o);
});
canvas.on('text:changed', e => {
  const t = e.target;
  if (t && t.curva) aplicarCurva(t, t.curva, true);
  if (t && t.textoDe){ ajustarFormaATexto(t); actualizarConexiones(porId(t.textoDe)); canvas.requestRenderAll(); }
  revisarAuto(); clearTimeout(canvas._tc); canvas._tc = setTimeout(() => { guardarEstado(); renderCapas(); }, 500); });

// Guías inteligentes: al mover algo se "pega" a los bordes y centros de otras formas y del lienzo
let guias = [];
canvas.on('object:moving', e => {
  const o = e.target; guias = [];
  if (!o) return;
  const r = cajaAbs(o), umbral = 7 / zoom;
  const propios = { x:[r.left, r.left + r.width/2, r.left + r.width], y:[r.top, r.top + r.height/2, r.top + r.height] };
  const excluir = new Set(o.type === 'activeSelection' ? o.getObjects() : [o]);
  [...excluir].forEach(x => { const t = porId(x.formaTexto); if (t) excluir.add(t); const f = porId(x.textoDe); if (f) excluir.add(f); });
  const refs = { x:[0, W/2, W], y:[0, H/2, H] };
  canvas.getObjects().forEach(x => {
    if (excluir.has(x) || !x.visible || x.esFondo || x.textoDe || x.type === 'conector') return;
    const q = cajaAbs(x);
    refs.x.push(q.left, q.left + q.width/2, q.left + q.width);
    refs.y.push(q.top, q.top + q.height/2, q.top + q.height);
  });
  const mejor = eje => {
    let m = null;
    refs[eje].forEach(v => propios[eje].forEach(pp => { const d = v - pp; if (Math.abs(d) < umbral && (!m || Math.abs(d) < Math.abs(m.d))) m = { d, v }; }));
    return m;
  };
  const mx = mejor('x'), my = mejor('y');
  if (mx){ o.set('left', o.left + mx.d); guias.push({ x: mx.v }); }
  if (my){ o.set('top', o.top + my.d); guias.push({ y: my.v }); }
  if (mx || my){ o.setCoords(); seguirVinculos(o); }
});
canvas.on('mouse:up', () => { if (guias.length){ guias = []; canvas.requestRenderAll(); } });
canvas.on('after:render', () => {
  if (!guias.length) return;
  const ctx = canvas.contextContainer;
  ctx.save(); ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 1; ctx.setLineDash([6, 4]);
  guias.forEach(g => {
    ctx.beginPath();
    if (g.x !== undefined){ const x = Math.round(g.x*zoom) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, H*zoom); }
    else { const y = Math.round(g.y*zoom) + 0.5; ctx.moveTo(0, y); ctx.lineTo(W*zoom, y); }
    ctx.stroke();
  });
  ctx.restore();
});

/* =========================================================
   ATAJOS DE TECLADO
   ========================================================= */
document.addEventListener('keydown', e => {
  const tag = (document.activeElement || {}).tagName;
  if (['INPUT','SELECT','TEXTAREA'].includes(tag)) return;
  const o = activo(); if (o && o.isEditing) return;
  const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (k === 'delete' || k === 'backspace'){ e.preventDefault(); eliminar(); }
  else if (ctrl && k === 'z' && !e.shiftKey){ e.preventDefault(); deshacer(); }
  else if (ctrl && (k === 'y' || (k === 'z' && e.shiftKey))){ e.preventDefault(); rehacer(); }
  else if (ctrl && k === 'd'){ e.preventDefault(); duplicar(); }
  else if (ctrl && e.altKey && k === 'c'){ e.preventDefault(); copiarEstilo(); }
  else if (ctrl && e.altKey && k === 'v'){ e.preventDefault(); pegarEstilo(); }
  else if (ctrl && k === 'c' && o){ clonar(o, c => portapapeles = c); }
  else if (ctrl && k === 'v' && portapapeles){ e.preventDefault(); clonar(portapapeles, pegarClon); }
  else if (ctrl && k === 'g'){ e.preventDefault(); agruparToggle(); }
  else if (ctrl && k === 's'){ e.preventDefault(); guardarDrive(); }
  else if (ctrl && k === 'a'){ e.preventDefault(); const objs = canvas.getObjects().filter(x => x.selectable && x.visible); if (objs.length){ canvas.setActiveObject(new fabric.ActiveSelection(objs, { canvas })); canvas.requestRenderAll(); } }
  else if (o && k.startsWith('arrow')){
    e.preventDefault(); const p = e.shiftKey ? 10 : 1;
    if (k === 'arrowleft') o.left -= p; if (k === 'arrowright') o.left += p;
    if (k === 'arrowup') o.top -= p; if (k === 'arrowdown') o.top += p;
    o.setCoords(); canvas.requestRenderAll(); clearTimeout(canvas._ar); canvas._ar = setTimeout(guardarEstado, 400);
  }
  else if (k === 'tab' && o && o.type !== 'activeSelection' && puedeTenerTexto(nodoBase(o))){ e.preventDefault(); agregarHijo(e.shiftKey ? 'aba' : 'der'); }
  else if (k === 'escape'){ if (modoConector) activarModoConector(false); if (canvas.isDrawingMode) activarDibujo(null); canvas.discardActiveObject(); canvas.requestRenderAll(); }
  else if (k === 'c' && !ctrl){ activarModoConector(!modoConector); }
});

/* =========================================================
   PLANTILLAS
   ========================================================= */
const PLANTILLAS = [
  { nombre:'Portada de trabajo escolar', tam:[2550, 3300], bg:'linear-gradient(180deg,#1e3a8a 0 18%,#ffffff 18% 82%,#1e3a8a 82%)', txt:'Portada', oscuro:true, crear(){
    fondoColor('#ffffff'); const k = s();
    agregar(new fabric.Rect({ left:0, top:0, width:W, height:H*0.05, fill:'#1e3a8a' }), 'Franja superior');
    agregar(new fabric.Rect({ left:0, top:H*0.95, width:W, height:H*0.05, fill:'#1e3a8a' }), 'Franja inferior');
    agregarTexto('subtitulo', { text:'NOMBRE DE LA UNIVERSIDAD', top:H*0.13, fill:'#1e3a8a', fontFamily:'Montserrat', fontWeight:'700', fontSize:46*k, width:W*0.85 });
    agregarTexto('cuerpo', { text:'Licenciatura en …', top:H*0.175, fill:'#374151', fontFamily:'Raleway', fontSize:34*k });
    agregar(new fabric.Rect({ left:W/2, top:H*0.215, width:W*0.22, height:5*k, originX:'center', originY:'center', fill:'#1e3a8a' }), 'Línea');
    agregarTexto('titulo', { text:'Título del trabajo', top:H*0.40, fill:'#111827', fontFamily:'Playfair Display', fontSize:96*k, width:W*0.8 });
    agregarTexto('cuerpo', { text:'Asignatura / Módulo', top:H*0.50, fill:'#4b5563', fontFamily:'Raleway', fontSize:36*k });
    agregarTexto('cuerpo', { text:'Presenta:\nNombre completo del alumno(a)\n\nDocente:\nNombre del profesor(a)', top:H*0.70, fill:'#1f2330', fontFamily:'Inter', fontSize:32*k, width:W*0.7, lineHeight:1.3 });
    agregarTexto('cuerpo', { text:'Ciudad de México, fecha', top:H*0.88, fill:'#6b7280', fontFamily:'Inter', fontSize:28*k });
  }},
  { nombre:'Cartel para exposición', tam:[1800, 2700], bg:'linear-gradient(180deg,#7f1d1d 0 35%,#fdf6ec 35%)', txt:'Cartel', oscuro:true, crear(){
    fondoColor('#fdf6ec'); const k = s();
    agregar(new fabric.Rect({ left:0, top:0, width:W, height:H*0.33, fill:'#7f1d1d' }), 'Encabezado');
    agregarTexto('cuerpo', { text:'EXPOSICIÓN · EQUIPO 1', top:H*0.08, fill:'#fde68a', fontFamily:'Montserrat', fontWeight:'700', charSpacing:250, fontSize:34*k });
    agregarTexto('titulo', { text:'TEMA DE LA EXPOSICIÓN', top:H*0.19, fill:'#ffffff', fontFamily:'Bebas Neue', fontSize:150*k, width:W*0.85, lineHeight:0.95 });
    const puntos = ['Idea principal número uno, explicada en pocas palabras.', 'Segundo punto clave con un dato importante.', 'Tercer punto: conclusión o propuesta.'];
    puntos.forEach((t, i) => {
      const y = H*(0.43 + i*0.14);
      agregar(new fabric.Circle({ left:W*0.14, top:y, radius:42*k, originX:'center', originY:'center', fill:'#7f1d1d' }), 'Viñeta');
      agregarTexto('subtitulo', { text:String(i+1), left:W*0.14, top:y, fill:'#fff', fontFamily:'Montserrat', fontSize:44*k, width:80*k });
      agregarTexto('cuerpo', { text:t, left:W*0.22, top:y, originX:'left', textAlign:'left', fill:'#1f2330', fontFamily:'Poppins', fontSize:40*k, width:W*0.68 });
    });
    agregar(new fabric.Rect({ left:W/2, top:H*0.9, width:W*0.84, height:3*k, originX:'center', originY:'center', fill:'#7f1d1d' }), 'Línea');
    agregarTexto('cuerpo', { text:'Fecha · Salón · Grupo', top:H*0.94, fill:'#7f1d1d', fontFamily:'Inter', fontWeight:'600', fontSize:34*k });
  }},
  { nombre:'Infografía (3 pasos)', tam:[1080, 1920], bg:'linear-gradient(180deg,#0e7490,#164e63)', txt:'Infografía', crear(){
    fondoDegradado('#0e7490','#164e63'); const k = s();
    agregarTexto('cuerpo', { text:'INFOGRAFÍA', top:H*0.06, fill:'#a5f3fc', fontFamily:'Montserrat', fontWeight:'700', charSpacing:300 });
    agregarTexto('titulo', { text:'Título de tu tema', top:H*0.13, fill:'#ffffff', fontFamily:'Montserrat', fontWeight:'900', fontSize:88*k, width:W*0.85 });
    ['Primer paso','Segundo paso','Tercer paso'].forEach((t, i) => {
      const y = H*(0.32 + i*0.21);
      agregar(new fabric.Rect({ left:W/2, top:y + 60*k, width:W*0.86, height:300*k, rx:28*k, ry:28*k, originX:'center', originY:'center', fill:'rgba(255,255,255,.95)' }), 'Tarjeta');
      agregar(new fabric.Circle({ left:W*0.17, top:y + 60*k, radius:58*k, originX:'center', originY:'center', fill:'#f59e0b' }), 'Número');
      agregarTexto('subtitulo', { text:String(i+1), left:W*0.17, top:y + 60*k, fill:'#fff', fontFamily:'Montserrat', fontSize:64*k, width:100*k });
      agregarTexto('subtitulo', { text:t, left:W*0.28, top:y + 10*k, originX:'left', textAlign:'left', fill:'#164e63', fontFamily:'Montserrat', fontSize:44*k, width:W*0.6 });
      agregarTexto('cuerpo', { text:'Describe aquí este punto con una o dos oraciones claras.', left:W*0.28, top:y + 95*k, originX:'left', textAlign:'left', fill:'#374151', fontFamily:'Inter', fontSize:30*k, width:W*0.6 });
    });
    agregarTexto('cuerpo', { text:'Fuente: autor, año', top:H*0.95, fill:'#a5f3fc', fontFamily:'Inter', fontSize:26*k });
  }},
  { nombre:'Reconocimiento / constancia', tam:[3300, 2550], bg:'#fffdf7', txt:'Reconocimiento', oscuro:true, crear(){
    fondoColor('#fffdf7'); const k = s();
    agregar(new fabric.Rect({ left:W/2, top:H/2, width:W*0.94, height:H*0.92, originX:'center', originY:'center', fill:null, stroke:'#b45309', strokeWidth:14*k }), 'Marco exterior');
    agregar(new fabric.Rect({ left:W/2, top:H/2, width:W*0.91, height:H*0.88, originX:'center', originY:'center', fill:null, stroke:'#b45309', strokeWidth:3*k }), 'Marco interior');
    agregarTexto('titulo', { text:'RECONOCIMIENTO', top:H*0.2, fill:'#78350f', fontFamily:'Playfair Display', fontSize:84*k, charSpacing:120, width:W*0.8 });
    agregarTexto('cuerpo', { text:'Se otorga a', top:H*0.33, fill:'#57534e', fontFamily:'Raleway', fontSize:34*k });
    agregarTexto('titulo', { text:'Nombre de la persona', top:H*0.45, fill:'#1f2330', fontFamily:'Dancing Script', fontSize:110*k, width:W*0.8 });
    agregar(new fabric.Rect({ left:W/2, top:H*0.53, width:W*0.45, height:3*k, originX:'center', originY:'center', fill:'#b45309' }), 'Línea');
    agregarTexto('cuerpo', { text:'Por su destacada participación en …', top:H*0.62, fill:'#44403c', fontFamily:'Raleway', fontSize:34*k, width:W*0.65 });
    [0.3, 0.7].forEach((x, i) => {
      agregar(new fabric.Rect({ left:W*x, top:H*0.82, width:W*0.24, height:2*k, originX:'center', originY:'center', fill:'#44403c' }), 'Firma');
      agregarTexto('cuerpo', { text: i ? 'Nombre y cargo' : 'Nombre y cargo', left:W*x, top:H*0.86, fill:'#44403c', fontFamily:'Inter', fontSize:26*k, width:W*0.26 });
    });
  }},
  { nombre:'Promoción / oferta', bg:'linear-gradient(135deg,#f97316,#ec4899)', txt:'50% OFF', crear(){
    fondoDegradado('#f97316','#ec4899'); const k = s();
    agregar(new fabric.Circle({ left:W*0.85, top:H*0.15, radius:220*k, originX:'center', originY:'center', fill:'rgba(255,255,255,.15)' }), 'Círculo');
    agregar(new fabric.Circle({ left:W*0.1, top:H*0.9, radius:160*k, originX:'center', originY:'center', fill:'rgba(255,255,255,.12)' }), 'Círculo');
    agregarTexto('cuerpo', { text:'SOLO ESTE FIN DE SEMANA', top:H*0.3, fill:'#fff', fontFamily:'Montserrat', fontWeight:'700', charSpacing:200 });
    agregarTexto('titulo', { text:'50% OFF', top:H*0.48, fill:'#fff', fontFamily:'Anton', fontSize:260*k });
    const r = new fabric.Rect({ left:W/2, top:H*0.72, width:420*k, height:100*k, rx:50*k, ry:50*k, originX:'center', originY:'center', fill:'#fff' });
    agregar(r, 'Botón');
    agregarTexto('subtitulo', { text:'Compra ahora', top:H*0.72, fill:'#ec4899', fontFamily:'Poppins', fontSize:44*k, width:400*k });
  }},
  { nombre:'Frase / cita', bg:'#0f172a', txt:'“Cita”', crear(){
    fondoColor('#0f172a'); const k = s();
    agregarTexto('titulo', { text:'“', top:H*0.25, fill:'#facc15', fontFamily:'Playfair Display', fontSize:300*k });
    agregarTexto('subtitulo', { text:'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', top:H*0.5, fill:'#fff', fontFamily:'Playfair Display', fontStyle:'italic', fontSize:64*k, width:W*0.8 });
    agregarTexto('cuerpo', { text:'— Robert Collier', top:H*0.72, fill:'#facc15', fontFamily:'Raleway', fontSize:36*k });
  }},
  { nombre:'Invitación / evento', bg:'linear-gradient(135deg,#a18cd1,#fbc2eb)', txt:'Evento', crear(){
    fondoDegradado('#a18cd1','#fbc2eb'); const k = s();
    agregar(new fabric.Rect({ left:W/2, top:H/2, width:W*0.82, height:H*0.82, originX:'center', originY:'center', fill:'rgba(255,255,255,.85)', rx:30*k, ry:30*k }), 'Tarjeta');
    agregarTexto('cuerpo', { text:'ESTÁS INVITADO A', top:H*0.25, fill:'#6b21a8', fontFamily:'Raleway', fontWeight:'700', charSpacing:300 });
    agregarTexto('titulo', { text:'Mi Fiesta', top:H*0.4, fill:'#6b21a8', fontFamily:'Pacifico', fontSize:150*k });
    agregarTexto('subtitulo', { text:'Sábado 20 de diciembre · 7:00 p.m.', top:H*0.58, fill:'#374151', fontFamily:'Poppins', fontSize:44*k });
    agregarTexto('cuerpo', { text:'Lugar del evento, Ciudad', top:H*0.68, fill:'#6b7280', fontFamily:'Poppins' });
  }},
  { nombre:'Anuncio minimalista', bg:'#f3f4f6', txt:'Aa', crear(){
    fondoColor('#f3f4f6'); const k = s();
    agregar(new fabric.Rect({ left:W*0.08, top:H*0.12, width:12*k, height:H*0.3, fill:'#7c3aed' }), 'Barra');
    agregarTexto('titulo', { text:'NUEVA COLECCIÓN', left:W*0.12, top:H*0.12, originX:'left', originY:'top', textAlign:'left', fill:'#111827', fontFamily:'Bebas Neue', fontSize:160*k, width:W*0.8 });
    agregarTexto('cuerpo', { text:'Descubre los diseños de esta temporada.', left:W*0.12, top:H*0.5, originX:'left', originY:'top', textAlign:'left', fill:'#4b5563', width:W*0.7 });
    agregarTexto('cuerpo', { text:'www.tusitio.com', left:W*0.12, top:H*0.85, originX:'left', originY:'top', textAlign:'left', fill:'#7c3aed', fontWeight:'700', width:W*0.6 });
  }}
];
PLANTILLAS.forEach(p => {
  const b = document.createElement('button'); b.className = 'plantilla';
  b.innerHTML = `<div class="prev" style="background:${p.bg};color:${p.oscuro || p.bg === '#f3f4f6' ? '#111' : '#fff'}">${esc(p.txt)}</div><div class="t">${esc(p.nombre)}</div>`;
  b.onclick = () => {
    if (canvas.getObjects().length && !confirm('Esto reemplazará el contenido actual. ¿Continuar?')) return;
    if (p.tam) fijarTamano(p.tam[0], p.tam[1]);
    restaurando = true; canvas.clear(); canvas.backgroundColor = '#ffffff'; restaurando = false;
    restaurando = true; p.crear(); restaurando = false;
    canvas.discardActiveObject(); canvas.requestRenderAll(); renderCapas(); guardarEstado();
  };
  $('listaPlantillas').appendChild(b);
});

/* =========================================================
   TAMAÑOS
   ========================================================= */
TAMANOS.forEach(([n, w, h]) => {
  const b = document.createElement('button'); b.className = 'bigbtn';
  b.innerHTML = `${esc(n)} <span style="float:right;color:#6b7280">${w} × ${h}</span>`;
  b.onclick = () => aplicarTamano(w, h);
  $('listaTamanos').appendChild(b);
});
function aplicarTamanoPers(){
  const w = +$('tamW').value, h = +$('tamH').value;
  if (w < 50 || h < 50 || w > 8000 || h > 8000) return toast('Usa medidas entre 50 y 8000 px');
  aplicarTamano(w, h);
}

/* =========================================================
   EXPORTAR
   ========================================================= */
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
    toast('Descarga iniciada. Si no aparece, usa “Vista previa” o “Guardar en este navegador”.');
  } catch (e) { toast('Error al exportar: ' + e.message); }
  finally { cargando(false); }
}
async function vistaPrevia(){
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
  if ($('eFormato').value === 'video'){
    try {
      const v = await obtenerVideo();
      if (v.blob.size > 35 * 1048576){ toast('El video pesa ' + (v.blob.size / 1048576).toFixed(0) + ' MB: es muy grande para mandarlo a este navegador desde aquí. Usa “Descargar” o baja la calidad / los segundos.'); return; }
      cargando(true);
      const r = await gs('guardarImagen', nombreArchivo(), await blobADataURL(v.blob));
      $('eInfo').innerHTML = 'Guardado en este navegador: <a href="' + r.url + '" target="_blank">' + esc(r.nombre) + '</a>';
      toast('Video guardado en este navegador');
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
    $('eInfo').innerHTML = 'Guardado en este navegador: ' + hechos.map(r => `<a href="${r.url}" target="_blank">${esc(r.nombre)}</a>`).join(', ');
    toast('Guardado en este navegador');
  } catch (e) { toast('Error: ' + e.message); }
  finally { cargando(false); }
}

/* =========================================================
   PROYECTOS EN DRIVE
   ========================================================= */
function guardarDrive(){
  cargando(true);
  clearTimeout(autoGuardado._t);
  indicadorGuardado('guardando');
  google.script.run
    .withSuccessHandler(r => { cargando(false); enDrive = true; indicadorGuardado('ok'); toast('Diseño “' + r.nombre + '” guardado en este navegador'); })
    .withFailureHandler(e => { cargando(false); indicadorGuardado('error'); toast('Error al guardar: ' + e.message); })
    .guardarProyecto(nombreArchivo(), serializar());
}
function listar(){
  $('listaProy').innerHTML = 'Cargando…';
  google.script.run
    .withSuccessHandler(lista => {
      if (!lista.length){ $('listaProy').innerHTML = '<p class="hint">Aún no tienes diseños guardados.</p>'; return; }
      $('listaProy').innerHTML = '';
      lista.forEach(p => {
        const d = document.createElement('div'); d.className = 'proy';
        d.innerHTML = `<div class="n"><b>${esc(p.nombre)}</b><small>${new Date(p.fecha).toLocaleString('es-MX')} · ${p.tamKB} KB</small></div>
          <button class="btnP">Abrir</button><button class="btnS" title="Versiones anteriores">🕘</button><button class="btnS" title="Eliminar">🗑</button>`;
        const [ba, bv, be] = d.querySelectorAll('button');
        bv.onclick = () => verVersiones(p, d);
        ba.onclick = () => abrirProyecto(p);
        be.onclick = () => { if (confirm('¿Mandar “' + p.nombre + '” a la papelera (se borra de este navegador)?')) google.script.run.withSuccessHandler(listar).eliminarProyecto(p.id); };
        $('listaProy').appendChild(d);
      });
    })
    .withFailureHandler(e => $('listaProy').textContent = 'Error: ' + e.message)
    .listarProyectos();
}
// Muestra las versiones anteriores de un diseño (se guardan solas en este navegador, una cada 10 minutos como máximo)
function verVersiones(p, fila){
  const sig = fila.nextElementSibling;
  if (sig && sig.classList.contains('versiones')){ sig.remove(); return; }
  const cont = document.createElement('div'); cont.className = 'versiones';
  cont.style.cssText = 'background:#f8f7fc;border-radius:8px;margin:4px 0 8px 12px;padding:6px 10px;font-size:12.5px';
  cont.textContent = 'Buscando versiones…';
  fila.after(cont);
  gs('listarVersiones', p.id).then(lista => {
    if (!lista || !lista.length){ cont.innerHTML = '<span class="hint">Todavía no hay versiones anteriores. Se crean solas cuando guardas cambios (máximo una cada 10 minutos).</span>'; return; }
    cont.innerHTML = '<b style="display:block;margin-bottom:4px">Versiones anteriores</b>';
    lista.forEach(v => {
      const r = document.createElement('div'); r.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 0;border-top:1px solid #ece9f6';
      r.innerHTML = `<span style="flex:1">${new Date(v.fecha).toLocaleString('es-MX')} · ${v.tamKB} KB</span><button class="btnS" style="padding:5px 10px">Abrir esta versión</button>`;
      r.querySelector('button').onclick = () => {
        if (!confirm('Se abrirá la versión del ' + new Date(v.fecha).toLocaleString('es-MX') + '.\nTu diseño en este navegador no cambia hasta que pulses 💾 Guardar. ¿Abrir?')) return;
        abrirProyecto({ id:v.id, nombre:p.nombre }, true);
      };
      cont.appendChild(r);
    });
  }).catch(e => { cont.textContent = 'No se pudieron cargar las versiones: ' + e.message; });
}
function abrirProyecto(p, esVersion){
  cargando(true);
  google.script.run
    .withSuccessHandler(txt => {
      $('nombreDiseno').value = p.nombre;
      historial = []; hi = -1; miniaturas = [];
      cargarJSON(txt, true, () => { cargando(false); cerrarModal('mProyectos'); enDrive = !esVersion; indicadorGuardado(esVersion ? 'cambios' : 'ok'); toast(esVersion ? 'Versión anterior abierta. Pulsa 💾 Guardar para quedarte con ella.' : 'Diseño abierto'); });
    })
    .withFailureHandler(e => { cargando(false); toast('Error: ' + e.message); })
    .cargarProyecto(p.id);
}
function nuevoDiseno(){
  enDrive = false; setTimeout(() => indicadorGuardado('nuevo'), 50);
  if (canvas.getObjects().length && !confirm('¿Empezar un diseño nuevo? Lo que no hayas guardado en este navegador se perderá.')) return;
  restaurando = true; canvas.clear(); canvas.backgroundColor = '#ffffff'; restaurando = false;
  $('nombreDiseno').value = 'Mi diseño'; historial = []; hi = -1;
  paginas = [null]; actual = 0; miniaturas = []; notaPagina = ''; mostrarNotas();
  canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado();
}

/* =========================================================
   PÁGINAS
   ========================================================= */
function miniCanvas(){
  try { return canvas.toDataURL({ format:'png', multiplier: (152 / H) / zoom }); } catch(e){ return ''; }
}
function miniDeJSON(json, cb){
  const el = document.createElement('canvas');
  const sc = new fabric.StaticCanvas(el, { width:W, height:H, enableRetinaScaling:false });
  sc.loadFromJSON(json || PAGINA_VACIA(), () => { sc.renderAll(); const u = sc.toDataURL({ format:'png', multiplier:152 / H }); sc.dispose(); cb(u); });
}
function renderPaginas(){
  if (generandoVista) return;
  clearTimeout(renderPaginas._t);
  renderPaginas._t = setTimeout(() => {
    miniaturas[actual] = miniCanvas();
    const bar = $('paginas'); bar.innerHTML = '';
    paginas.forEach((p, i) => {
      const d = document.createElement('div');
      d.className = 'pag' + (i === actual ? ' act' : '');
      d.style.aspectRatio = W + ' / ' + H; d.title = 'Página ' + (i + 1);
      const img = document.createElement('img');
      if (miniaturas[i]) img.src = miniaturas[i];
      else miniDeJSON(p, u => { miniaturas[i] = u; img.src = u; });
      d.appendChild(img);
      d.insertAdjacentHTML('beforeend', `<span class="num">${i + 1}</span>`);
      if (i === actual ? notaPagina.trim() : (p && p.notas)) d.insertAdjacentHTML('beforeend', '<span class="tieneNota" title="Tiene notas">📝</span>');
      d.onclick = () => { if (i !== actual) irPagina(i); };
      bar.appendChild(d);
    });
    const acc = document.createElement('div'); acc.className = 'pagAcc';
    acc.innerHTML = `<div style="display:flex;gap:4px"><button class="pb" onclick="agregarPagina()">＋ Página</button><button class="pb" title="Agregar diapositiva con diseño" onclick="abrirDiapositivas()">▦ Diapositiva</button></div>
      <div style="display:flex;gap:4px">
        <button class="pb" title="Duplicar página" onclick="duplicarPagina()">⧉</button>
        <button class="pb" title="Mover a la izquierda" onclick="moverPagina(-1)">◀</button>
        <button class="pb" title="Mover a la derecha" onclick="moverPagina(1)">▶</button>
        <button class="pb peligro" title="Eliminar página" onclick="eliminarPagina()">🗑</button>
      </div>`;
    bar.appendChild(acc);
  }, 150);
}
function cargarPaginaActual(conHist){
  restaurando = true; canvas.discardActiveObject();
  notaPagina = (paginas[actual] && paginas[actual].notas) || ''; mostrarNotas();
  canvas.loadFromJSON(paginas[actual] || PAGINA_VACIA(), () => {
    canvas.renderAll(); normalizarVinculos(); restaurando = false;
    renderCapas(); actualizarPanel(); renderPaginas();
    if (conHist) guardarEstado();
  });
}
function guardarPaginaActual(){ paginas[actual] = jsonPagina(); miniaturas[actual] = miniCanvas(); }
function irPagina(i){
  if (i < 0 || i >= paginas.length) return;
  guardarPaginaActual(); actual = i; cargarPaginaActual(true);
}
function agregarPagina(){
  guardarPaginaActual();
  paginas.splice(actual + 1, 0, PAGINA_VACIA()); miniaturas.splice(actual + 1, 0, undefined);
  actual++; cargarPaginaActual(true);
}
function duplicarPagina(){
  guardarPaginaActual();
  paginas.splice(actual + 1, 0, JSON.parse(JSON.stringify(paginas[actual])));
  miniaturas.splice(actual + 1, 0, miniaturas[actual]);
  actual++; cargarPaginaActual(true);
}
function eliminarPagina(){
  if (paginas.length === 1){ toast('El diseño necesita al menos una página'); return; }
  if (!confirm('¿Eliminar la página ' + (actual + 1) + '?')) return;
  paginas.splice(actual, 1); miniaturas.splice(actual, 1);
  actual = Math.min(actual, paginas.length - 1); cargarPaginaActual(true);
}
function moverPagina(d){
  const j = actual + d; if (j < 0 || j >= paginas.length) return;
  guardarPaginaActual();
  [paginas[actual], paginas[j]] = [paginas[j], paginas[actual]];
  [miniaturas[actual], miniaturas[j]] = [miniaturas[j], miniaturas[actual]];
  actual = j; guardarEstado(); renderPaginas();
}

/* =========================================================
   ÍCONOS
   ========================================================= */
const ICONOS = {
  'Palomita':   'M9 16.2 L4.8 12 L3.4 13.4 L9 19 L21 7 L19.6 5.6 Z',
  'Tache':      'M6.4 5 L5 6.4 L10.6 12 L5 17.6 L6.4 19 L12 13.4 L17.6 19 L19 17.6 L13.4 12 L19 6.4 L17.6 5 L12 10.6 Z',
  'Flecha':     'M4 11 L16.2 11 L10.6 5.4 L12 4 L20 12 L12 20 L10.6 18.6 L16.2 13 L4 13 Z',
  'Ubicación':  'M12 2 C8.1 2 5 5.1 5 9 C5 14.2 12 22 12 22 C12 22 19 14.2 19 9 C19 5.1 15.9 2 12 2 Z M12 6.5 A2.5 2.5 0 1 1 12 11.5 A2.5 2.5 0 1 1 12 6.5 Z',
  'Correo':     'M2 5 L22 5 L22 19 L2 19 Z M4 7.5 L4 17 L20 17 L20 7.5 L12 13 Z',
  'Calendario': 'M3 4 L21 4 L21 21 L3 21 Z M5 9 L19 9 L19 19 L5 19 Z M7 1.5 L9 1.5 L9 4 L7 4 Z M15 1.5 L17 1.5 L17 4 L15 4 Z',
  'Reloj':      'M12 2 A10 10 0 1 0 12 22 A10 10 0 1 0 12 2 Z M12 4 A8 8 0 1 1 12 20 A8 8 0 1 1 12 4 Z M11 6 L13 6 L13 11.4 L16.8 13.6 L15.8 15.3 L11 12.5 Z',
  'Información':'M12 2 A10 10 0 1 0 12 22 A10 10 0 1 0 12 2 Z M11 10 L13 10 L13 17 L11 17 Z M11 6.5 L13 6.5 L13 8.5 L11 8.5 Z',
  'Persona':    'M12 3 A4 4 0 1 1 12 11 A4 4 0 1 1 12 3 Z M4 21 C4 16.6 7.6 13.5 12 13.5 C16.4 13.5 20 16.6 20 21 Z',
  'Libro':      'M3 4.5 L10 4.5 C11 4.5 11.5 5.2 11.5 6 L11.5 20 C11.5 19.2 11 18.5 10 18.5 L3 18.5 Z M21 4.5 L14 4.5 C13 4.5 12.5 5.2 12.5 6 L12.5 20 C12.5 19.2 13 18.5 14 18.5 L21 18.5 Z',
  'Birrete':    'M12 3 L1 9 L12 15 L21 10.1 L21 17 L23 17 L23 9 Z M5 13.2 L5 17 C5 18.7 8.1 20 12 20 C15.9 20 19 18.7 19 17 L19 13.2 L12 17 Z',
  'Balanza':    'M11 2 L13 2 L13 5 L19 5 L19 7 L18.2 7 L21 13.5 C21 15.2 19.7 16.5 18 16.5 C16.3 16.5 15 15.2 15 13.5 L17.8 7 L13 7 L13 20 L17 20 L17 22 L7 22 L7 20 L11 20 L11 7 L6.2 7 L9 13.5 C9 15.2 7.7 16.5 6 16.5 C4.3 16.5 3 15.2 3 13.5 L5.8 7 L5 7 L5 5 L11 5 Z',
  'Foco':       'M12 2 C8.1 2 5 5.1 5 9 C5 11.4 6.2 13.5 8 14.7 L8 17 L16 17 L16 14.7 C17.8 13.5 19 11.4 19 9 C19 5.1 15.9 2 12 2 Z M9 18 L15 18 L15 20 L9 20 Z M10 21 L14 21 L14 22 L10 22 Z',
  'Advertencia':'M12 2 L1 21 L23 21 Z M11 9 L13 9 L13 15 L11 15 Z M11 17 L13 17 L13 19 L11 19 Z',
  'Diálogo':    'M3 3 L21 3 L21 16 L9 16 L4 20.5 L4 16 L3 16 Z'
};
function agregarIcono(nombre, d){
  const p = new fabric.Path(d, { fill: $('colorForma').value, fillRule:'evenodd', strokeWidth:0, stroke:null,
    originX:'center', originY:'center', left:W/2, top:H/2 });
  p.scaleToWidth(200 * s());
  agregar(p, nombre);
}
Object.entries(ICONOS).forEach(([n, d]) => {
  const b = document.createElement('button'); b.className = 'forma'; b.title = n;
  b.innerHTML = `<svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="${d}"/></svg>`;
  b.onclick = () => agregarIcono(n, d);
  $('gridIconos').appendChild(b);
});

/* =========================================================
   ÍCONOS POR MATERIA (dibujados con figuras simples, cuadrícula de 24 × 24)
   ========================================================= */
const IC = (() => {
  const f = n => +n.toFixed(2);
  const pol = pts => 'M' + pts.map(([x, y]) => f(x) + ' ' + f(y)).join(' L') + ' Z';
  const rot = (pts, ang, cx = 12, cy = 12) => { const a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); };
  const rect = (x, y, w, h, ang = 0, cx, cy) => pol(rot([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], ang, cx ?? x + w / 2, cy ?? y + h / 2));
  const circ = (cx, cy, r) => `M${f(cx - r)} ${f(cy)} A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)} A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)} Z`;
  const elip = (cx, cy, rx, ry) => `M${f(cx - rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)} Z`;
  const anillo = (cx, cy, r, g) => circ(cx, cy, r) + ' ' + circ(cx, cy, r - g);
  const rr = (x, y, w, h, r) => `M${f(x + r)} ${f(y)} L${f(x + w - r)} ${f(y)} Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)} L${f(x + w)} ${f(y + h - r)} Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)} L${f(x + r)} ${f(y + h)} Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)} L${f(x)} ${f(y + r)} Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)} Z`;
  const estrella = (cx, cy, R, r, n = 5) => pol(Array.from({ length:n * 2 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; return [cx + q * Math.cos(a), cy + q * Math.sin(a)]; }));
  return { pol, rot, rect, circ, elip, anillo, rr, estrella, j:(...p) => p.join(' ') };
})();
const ICONOS_MATERIA = {
  'Derecho': {
    'Mazo': IC.j(IC.pol(IC.rot([[6,4],[15,4],[15,9],[6,9]], -45, 12, 10)), IC.pol(IC.rot([[9.6,9],[11.4,9],[11.4,19],[9.6,19]], -45, 12, 10)), IC.rr(12,19,10,3,1)),
    'Tribunal': IC.j(IC.pol([[12,1.5],[22.5,7],[1.5,7]]), IC.rect(2.5,8,19,1.8), IC.rect(4,11,2.2,7), IC.rect(8.6,11,2.2,7), IC.rect(13.2,11,2.2,7), IC.rect(17.8,11,2.2,7), IC.rect(2,19,20,2.5)),
    'Ley (artículo)': IC.j(IC.rr(4,2,16,20,2), 'M12.2 5.5 C9.8 5.5 9 6.6 9 7.6 C9 8.4 9.5 9 10.3 9.4 C9.4 9.9 9 10.6 9 11.4 C9 13 10.6 13.6 12 14.1 C13.2 14.5 13.8 14.8 13.8 15.5 C13.8 16.2 13.1 16.6 12 16.6 C10.9 16.6 10.2 16.1 10 15.2 L8.6 15.6 C8.9 17.1 10.2 18 12 18 C14 18 15.2 17 15.2 15.6 C15.2 14.8 14.8 14.2 14 13.8 C14.9 13.3 15.2 12.6 15.2 11.9 C15.2 10.3 13.7 9.7 12.3 9.2 C11.1 8.8 10.4 8.5 10.4 7.8 C10.4 7.2 11.1 6.9 12.1 6.9 C13 6.9 13.6 7.3 13.8 8 L15.1 7.6 C14.8 6.3 13.7 5.5 12.2 5.5 Z M11 10.4 C10.6 10.6 10.4 11 10.4 11.4 C10.4 12 11 12.4 12.2 12.8 C12.7 13 13.1 13.1 13.4 13.3 C13.7 13 13.8 12.6 13.8 12.2 C13.8 11.5 13.1 11.2 12 10.8 C11.6 10.7 11.3 10.5 11 10.4 Z'),
    'Documento legal': IC.j('M4 2 L15 2 L20 7 L20 22 L4 22 Z M14 3.6 L14 8 L18.4 8 Z', IC.rect(6.5,10,8,1.4), IC.rect(6.5,13,11,1.4), IC.rect(6.5,16,6,1.4), IC.circ(16,18,2.3)),
    'Escudo': IC.j('M12 1.5 L21 5 L21 11 C21 16.5 17 20.6 12 22.5 C7 20.6 3 16.5 3 11 L3 5 Z M12 4 L5.2 6.6 L5.2 11 C5.2 15.2 8.2 18.6 12 20.1 C15.8 18.6 18.8 15.2 18.8 11 L18.8 6.6 Z', 'M10.6 15.4 L7.4 12.2 L8.8 10.8 L10.6 12.6 L15.2 8 L16.6 9.4 Z'),
    'Placa policial': IC.j(IC.estrella(12,12.5,10.5,5.6,6), IC.circ(12,12.5,3.2)),
    'Esposas': IC.j(IC.anillo(6.5,15,4.8,1.7), IC.anillo(17.5,15,4.8,1.7), IC.rect(11.3,14.2,1.4,1.6), IC.rect(5.7,7.4,1.6,2.8), IC.rect(16.7,7.4,1.6,2.8), IC.rect(5.7,5.6,12.6,1.4)),
    'Huella': IC.j(IC.elip(12,12.5,9,10.5), IC.elip(12,12.5,7.6,9.1), IC.elip(12,12.5,6,7.5), IC.elip(12,12.5,4.6,6.1), IC.elip(12,12.5,3,4.5), IC.elip(12,12.5,1.6,3.1)),
    'Lupa': IC.j(IC.anillo(10,10,7.5,2.2), IC.rect(15.5,14.2,2.6,8.4,-45)),
    'Candado': IC.j(IC.rr(4,10,16,12,2), IC.circ(12,15.2,1.8), IC.rect(11.2,15.5,1.6,3.5), 'M7 10 L7 7 C7 4.2 9.2 2 12 2 C14.8 2 17 4.2 17 7 L17 10 L14.8 10 L14.8 7 C14.8 5.5 13.5 4.2 12 4.2 C10.5 4.2 9.2 5.5 9.2 7 L9.2 10 Z'),
    'Rejas': IC.j(IC.rect(2,2,20,2.2), IC.rect(2,19.8,20,2.2), IC.rect(3.5,4.2,2,15.6), IC.rect(8.2,4.2,2,15.6), IC.rect(13.8,4.2,2,15.6), IC.rect(18.5,4.2,2,15.6)),
    'Firma': IC.j(IC.pol(IC.rot([[11,1],[14,1],[14,14],[12.5,17],[11,14]], 35, 12.5, 9)), 'M2 20 C4 17 5.5 17 6 19 C6.4 20.5 7.6 20.5 8.6 19.2 C9.6 18 10.6 18 11 19.5 C11.3 20.6 12.5 20.6 14 19.6 L22 19.6 L22 21 L14.4 21 C12.4 22.2 10.4 22 9.8 20.8 C8.6 22.2 5.6 22.6 4.8 20.2 C4.5 19.4 4 19.6 3.2 20.8 Z'),
    'Pergamino': IC.j('M6 3 L18 3 C19.7 3 21 4.3 21 6 L21 7 L18 7 L18 18 C18 19.7 16.7 21 15 21 L5 21 C3.3 21 2 19.7 2 18 L2 17 L5 17 L5 6 C5 4.3 5.4 3 6 3 Z M7.2 5.2 C7.1 5.5 7 5.7 7 6 L7 17 L13 17 L13 18 C13 18.4 13.1 18.7 13.2 19 L15 19 C15.6 19 16 18.6 16 18 L16 6 C16 5.7 16 5.4 16.2 5.2 Z', IC.rect(8.6,8,5.6,1.3), IC.rect(8.6,10.8,5.6,1.3), IC.rect(8.6,13.6,4,1.3))
  },
  'Ciencias': {
    'Matraz': IC.j('M9 2 L15 2 L15 3.6 L14 3.6 L14 8.6 L20.4 19.4 C21.2 20.8 20.2 22 18.8 22 L5.2 22 C3.8 22 2.8 20.8 3.6 19.4 L10 8.6 L10 3.6 L9 3.6 Z M7.2 15 L5.6 18 C5.2 18.8 5.6 19.6 6.4 19.6 L17.6 19.6 C18.4 19.6 18.8 18.8 18.4 18 L16.8 15 Z'),
    'Tubo de ensayo': IC.j(IC.pol(IC.rot([[9.5,1.5],[14.5,1.5],[14.5,3],[13.6,3],[13.6,18],[13.4,19.2],[12,20.4],[10.6,19.2],[10.4,18],[10.4,3],[9.5,3]], 30)), IC.circ(18,6,1.6), IC.circ(19.5,10.5,1.1)),
    'Átomo': IC.j(IC.elip(12,12,10.5,4.6), IC.elip(12,12,8.6,2.9), IC.circ(12,12,2.1), IC.circ(12,4.6,1.7), IC.circ(12,19.4,1.7), IC.circ(4.6,5.6,1.2), IC.circ(19.4,18.4,1.2)),
    'ADN': (() => {
      const xA = y => 12 + 6 * Math.sin((y - 2) * Math.PI / 10), xB = y => 24 - xA(y), g = 1, partes = [];
      const banda = (fx, y0, y1) => { const ys = []; for (let y = y0; y <= y1 + 1e-6; y += 0.5) ys.push(y);
        return IC.pol([...ys.map(y => [fx(y) - g, y]), ...ys.reverse().map(y => [fx(y) + g, y])]); };
      partes.push(banda(xA, 2, 22));
      [[2, 5.2], [8.8, 15.2], [18.8, 22]].forEach(([a, b]) => partes.push(banda(xB, a, b)));
      [4.5, 6.6, 15.5, 17.6].forEach(y => { const a = Math.min(xA(y), xB(y)) + g + 0.6, b = Math.max(xA(y), xB(y)) - g - 0.6; if (b - a > 1) partes.push(IC.rect(a, y - 0.55, b - a, 1.1)); });
      return IC.j(...partes);
    })(),    'Planeta': IC.j(IC.circ(12,12,6.4), 'M2 17.6 C1 16 3.6 13.6 6.2 12 L6.3 13.8 C4.4 15.1 3.4 16.2 3.7 16.7 C4.3 17.7 9.8 16.4 15 13.4 C20.2 10.4 21 8 20.3 7.3 C19.9 6.9 18.8 7.1 17.6 7.4 L16.8 6 C19.3 5.3 21.4 5.2 22 6.4 C23 8.2 19.8 11.6 15.9 14.4 C10.5 18.2 3.4 19.8 2 17.6 Z'),
    'Hoja': IC.j('M20.5 3 C10 3 4 7.5 4 14.5 C4 16.2 4.4 17.6 5 18.8 L3 21 L4.4 22.4 L6.3 20.4 C7.5 21.1 9 21.5 10.5 21.5 C17.5 21.5 21 15 20.5 3 Z M7.6 18.8 C10.5 15 13.2 12 17 8.2 L16 7.2 C12.2 11 9.5 14 6.6 17.6 Z'),
    'Imán': 'M3 3 L9 3 L9 12 C9 13.7 10.3 15 12 15 C13.7 15 15 13.7 15 12 L15 3 L21 3 L21 12 C21 17 17 21 12 21 C7 21 3 17 3 12 Z M3 5.8 L9 5.8 L9 7.2 L3 7.2 Z M15 5.8 L21 5.8 L21 7.2 L15 7.2 Z',
    'Termómetro': IC.j('M9.5 4.5 C9.5 3.1 10.6 2 12 2 C13.4 2 14.5 3.1 14.5 4.5 L14.5 14 C15.9 14.9 16.8 16.4 16.8 18.2 C16.8 20.8 14.6 23 12 23 C9.4 23 7.2 20.8 7.2 18.2 C7.2 16.4 8.1 14.9 9.5 14 Z M11.2 4.5 L11.2 15 C9.8 15.4 8.9 16.7 8.9 18.2 C8.9 19.9 10.3 21.3 12 21.3 C13.7 21.3 15.1 19.9 15.1 18.2 C15.1 16.7 14.2 15.4 12.8 15 L12.8 4.5 C12.8 4 12.4 3.7 12 3.7 C11.6 3.7 11.2 4 11.2 4.5 Z', IC.circ(12,18.2,2.2), IC.rect(11.4,9,1.2,8), IC.rect(16,5,3,1.2), IC.rect(16,8,3,1.2), IC.rect(16,11,3,1.2)),
    'Gota': 'M12 2 C12 2 4.5 10.5 4.5 15 C4.5 19.1 7.9 22.5 12 22.5 C16.1 22.5 19.5 19.1 19.5 15 C19.5 10.5 12 2 12 2 Z M7.4 15.2 C7.4 17.6 9.3 19.6 11.6 19.8 L11.6 18.4 C10 18.2 8.8 16.8 8.8 15.2 Z',
    'Rayo': 'M13.5 1.5 L4.5 13.5 L11 13.5 L9.5 22.5 L19.5 9.5 L12.8 9.5 Z',
    'Microscopio': IC.j(IC.pol(IC.rot([[9,1.5],[13,1.5],[13,11.5],[9,11.5]], -25, 11, 7)), IC.rect(4,20,17,2.5), 'M6 20 C6 15.4 8.8 12.4 12.2 11.6 L12.8 13.4 C10 14.2 8 16.6 8 20 Z', IC.rect(11,16,9,1.6), IC.rect(14.6,12.6,1.8,2.2))
  },
  'Matemáticas': {
    'Más': 'M10.5 3 L13.5 3 L13.5 10.5 L21 10.5 L21 13.5 L13.5 13.5 L13.5 21 L10.5 21 L10.5 13.5 L3 13.5 L3 10.5 L10.5 10.5 Z',
    'Menos': IC.rect(3,10.5,18,3),
    'Por': IC.j(IC.rect(10.5,2.5,3,19,45), IC.pol(IC.rot([[10.5,2.5],[13.5,2.5],[13.5,10.5],[10.5,10.5]], -45)), IC.pol(IC.rot([[10.5,13.5],[13.5,13.5],[13.5,21.5],[10.5,21.5]], -45))),
    'Entre': IC.j(IC.rect(3,10.6,18,2.8), IC.circ(12,5.5,2.2), IC.circ(12,18.5,2.2)),
    'Igual': IC.j(IC.rect(3,7,18,3), IC.rect(3,14,18,3)),
    'Porcentaje': IC.j(IC.anillo(6.5,6.5,4,1.8), IC.anillo(17.5,17.5,4,1.8), IC.rect(10.8,1.5,2.4,21,40)),
    'Pi': 'M3 4 L21 4 L21 7 L17.5 7 L17.5 17 C17.5 18.1 18.1 18.6 19 18.6 C19.6 18.6 20.2 18.4 20.6 18.1 L21.2 20.6 C20.5 21.1 19.6 21.4 18.5 21.4 C15.9 21.4 14.5 19.9 14.5 17.5 L14.5 7 L9.6 7 C9.4 12.5 8.5 17.6 6.5 21 L3.4 21 C5.7 17.4 6.5 12.6 6.6 7 L3 7 Z',
    'Raíz': 'M2 13 L5.6 11.6 L8.6 18.6 L13.6 3 L22 3 L22 5.6 L15.6 5.6 L9.8 22.5 L7.2 22.5 L4.4 15.4 L3 15.9 Z',
    'Infinito': 'M7 7 C4.2 7 2 9.2 2 12 C2 14.8 4.2 17 7 17 C9 17 10.6 15.6 12 14.1 C13.4 15.6 15 17 17 17 C19.8 17 22 14.8 22 12 C22 9.2 19.8 7 17 7 C15 7 13.4 8.4 12 9.9 C10.6 8.4 9 7 7 7 Z M7 9.3 C5.5 9.3 4.3 10.5 4.3 12 C4.3 13.5 5.5 14.7 7 14.7 C8.3 14.7 9.4 13.6 10.5 12 C9.4 10.4 8.3 9.3 7 9.3 Z M17 9.3 C15.7 9.3 14.6 10.4 13.5 12 C14.6 13.6 15.7 14.7 17 14.7 C18.5 14.7 19.7 13.5 19.7 12 C19.7 10.5 18.5 9.3 17 9.3 Z',
    'Triángulo': 'M12 2.5 L22.5 21 L1.5 21 Z M12 7.4 L5.6 18.6 L18.4 18.6 Z',
    'Regla': IC.j(IC.pol(IC.rot([[1,8],[23,8],[23,16],[1,16]], -30)), IC.pol(IC.rot([[4,8],[5.2,8],[5.2,11.5],[4,11.5]], -30)), IC.pol(IC.rot([[8,8],[9.2,8],[9.2,10.4],[8,10.4]], -30)), IC.pol(IC.rot([[12,8],[13.2,8],[13.2,11.5],[12,11.5]], -30)), IC.pol(IC.rot([[16,8],[17.2,8],[17.2,10.4],[16,10.4]], -30)), IC.pol(IC.rot([[20,8],[21.2,8],[21.2,11.5],[20,11.5]], -30))),
    'Calculadora': IC.j(IC.rr(4,1.5,16,21,2), IC.rect(6.5,4,11,4.5), ...[0,1,2].flatMap(fila => [0,1,2].map(col => IC.rect(6.5 + col * 4, 10.5 + fila * 3.8, 3, 2.6)))),
    'Gráfica': IC.j(IC.rect(2,20,20,2), IC.rect(3.5,13,4,6), IC.rect(10,8,4,11), IC.rect(16.5,3,4,16)),
    'Compás': IC.j(IC.circ(12,3.6,2.2), IC.pol([[10.6,5.6],[12.2,6],[7.2,21.5],[5.2,21]]), IC.pol([[13.4,5.6],[11.8,6],[16.8,21.5],[18.8,21]]), IC.rect(7.6,14,8.8,1.4))
  },
  'Historia y geografía': {
    'Globo terráqueo': IC.j(IC.anillo(12,12,10,1.6), 'M8 5.4 C9.6 5 10.6 6 10.2 7.4 C9.8 8.8 7.8 8.6 7.6 10.2 C7.4 11.6 9.6 12 10 13.6 C10.4 15.2 9 16.8 8 18.4 C6 17 4.4 14.6 4.2 12 C4 9.2 5.6 6.6 8 5.4 Z M15.6 6 C17.6 7.2 19.2 9.2 19.6 11.6 C18.4 11.8 17.6 11 16.6 11.2 C15.6 11.4 15.8 13 14.8 13.2 C13.6 13.4 13 12 13.4 10.8 C13.8 9.6 15.2 9.4 15.2 8.2 C15.2 7.4 15 6.6 15.6 6 Z M14.6 15.6 C15.6 15 17 15.2 17.8 16 C16.8 17.6 15.4 18.8 13.6 19.4 C13.6 18 13.6 16.2 14.6 15.6 Z'),
    'Mapa': 'M2 5 L8 2.5 L16 5 L22 2.5 L22 19 L16 21.5 L8 19 L2 21.5 Z M8.8 4.6 L8.8 17.6 L15.2 19.6 L15.2 6.6 Z',
    'Bandera': IC.j(IC.rect(3,2,2,20.5), 'M6 3 C9 1.6 11.6 4.4 14.6 3.4 C16.4 2.8 18 2.4 21 3 L21 13 C18 12.4 16.4 12.8 14.6 13.4 C11.6 14.4 9 11.6 6 13 Z'),
    'Castillo': 'M2 6 L5 6 L5 8 L7 8 L7 6 L10 6 L10 8 L14 8 L14 6 L17 6 L17 8 L19 8 L19 6 L22 6 L22 22 L14.5 22 L14.5 17 C14.5 15.6 13.4 14.5 12 14.5 C10.6 14.5 9.5 15.6 9.5 17 L9.5 22 L2 22 Z M5 12 L7 12 L7 15 L5 15 Z M17 12 L19 12 L19 15 L17 15 Z',
    'Columna griega': IC.j(IC.rect(3,2,18,2.2), 'M4 5 L20 5 L18.5 7.4 L5.5 7.4 Z', IC.rect(6.5,8.2,2,10.6), IC.rect(9.6,8.2,1.6,10.6), IC.rect(12.8,8.2,1.6,10.6), IC.rect(15.5,8.2,2,10.6), 'M5.5 19.6 L18.5 19.6 L20 22 L4 22 Z'),
    'Brújula': IC.j(IC.anillo(12,12,10,1.8), IC.pol([[12,4.5],[14.2,12],[12,19.5],[9.8,12]]), IC.circ(12,12,1)),
    'Montaña': 'M1.5 21 L9 7 L12.6 13.4 L15.5 9 L22.5 21 Z M9 10.4 L7.2 13.8 L8.6 13 L9.8 14 L10.8 12.6 Z',
    'Reloj de arena': IC.j(IC.rect(4,1.5,16,2.2), IC.rect(4,20.3,16,2.2), 'M6 4.2 L18 4.2 C18 8 16 10.4 13.6 12 C16 13.6 18 16 18 19.8 L6 19.8 C6 16 8 13.6 10.4 12 C8 10.4 6 8 6 4.2 Z M8.6 18 L15.4 18 C14.8 16.2 13.4 15.2 12 15.2 C10.6 15.2 9.2 16.2 8.6 18 Z'),
    'Corona': 'M2 7 L7 11.5 L12 3.5 L17 11.5 L22 7 L20 18 L4 18 Z M4 19.5 L20 19.5 L20 22 L4 22 Z',
    'Pirámide': 'M12 3 L23 21 L1 21 Z M12 7.6 L13.2 20 L19.6 20 Z',
    'Ancla': IC.j(IC.anillo(12,4.5,2.6,1.4), IC.rect(11,7,2,13), IC.rect(7.5,9,9,1.8), 'M3 12.5 L6.2 11 C6.2 15.6 8.6 18.6 11 19.4 L11 21.6 C6.6 20.8 3.6 17 3 12.5 Z M21 12.5 L17.8 11 C17.8 15.6 15.4 18.6 13 19.4 L13 21.6 C17.4 20.8 20.4 17 21 12.5 Z')
  },
  'Escuela': {
    'Lápiz': IC.j(IC.pol(IC.rot([[5,9.5],[16.5,9.5],[21.5,12],[16.5,14.5],[5,14.5]], -45)), IC.pol(IC.rot([[1.5,9.5],[3.8,9.5],[3.8,14.5],[1.5,14.5]], -45))),
    'Mochila': IC.j('M9 2.5 L15 2.5 C15.8 2.5 16.5 3.2 16.5 4 L16.5 5.2 C19 6 20.5 8.2 20.5 11 L20.5 20 C20.5 21.4 19.4 22.5 18 22.5 L6 22.5 C4.6 22.5 3.5 21.4 3.5 20 L3.5 11 C3.5 8.2 5 6 7.5 5.2 L7.5 4 C7.5 3.2 8.2 2.5 9 2.5 Z M9.2 4.2 L9.2 5 L14.8 5 L14.8 4.2 Z M7 13.5 L7 18.6 C7 19.4 7.6 20 8.4 20 L15.6 20 C16.4 20 17 19.4 17 18.6 L17 13.5 Z', IC.rect(11,15,2,2.4)),
    'Trofeo': IC.j('M6 2 L18 2 L18 3.5 L21.5 3.5 L21.5 6.5 C21.5 9.2 19.6 11.2 17.2 11.5 C16.2 13.6 14.4 15 12.8 15.3 L12.8 18 L16 18 L16 20 L8 20 L8 18 L11.2 18 L11.2 15.3 C9.6 15 7.8 13.6 6.8 11.5 C4.4 11.2 2.5 9.2 2.5 6.5 L2.5 3.5 L6 3.5 Z M4.4 5.4 L4.4 6.5 C4.4 7.9 5.2 9.1 6.3 9.5 C6.1 8.6 6 7.7 6 6.8 L6 5.4 Z M19.6 5.4 L18 5.4 L18 6.8 C18 7.7 17.9 8.6 17.7 9.5 C18.8 9.1 19.6 7.9 19.6 6.5 Z', IC.rect(6,21,12,1.8)),
    'Estrella': IC.estrella(12,12.6,10.5,4.4),
    'Corazón': 'M12 21.5 C6 17 2 13.4 2 8.8 C2 5.6 4.4 3.2 7.4 3.2 C9.4 3.2 11 4.3 12 6 C13 4.3 14.6 3.2 16.6 3.2 C19.6 3.2 22 5.6 22 8.8 C22 13.4 18 17 12 21.5 Z',
    'Computadora': IC.j('M2 4 L22 4 L22 17 L2 17 Z M4 6 L4 15 L20 15 L20 6 Z', IC.rect(10,17,4,3), IC.rect(6.5,20,11,2)),
    'Nota musical': IC.j(IC.elip(7.5,18,4,3.2), IC.elip(17.5,15.5,4,3.2), IC.rect(10.2,3.5,1.8,14.5), IC.rect(20.2,2,1.8,13.5), IC.pol([[10.2,3.5],[22,1],[22,4.6],[10.2,7.2]])),
    'Paleta de pintura': 'M12 2 C6.5 2 2 6 2 11.2 C2 16.4 6.4 20.5 11.6 20.5 C13.2 20.5 13.8 19.6 13.6 18.6 C13.4 17.4 12.6 16.6 13 15.6 C13.4 14.6 14.4 14.4 15.6 14.4 L17.6 14.4 C20.2 14.4 22 12.6 22 10 C22 5.6 17.6 2 12 2 Z M6.5 9 A1.6 1.6 0 1 0 6.5 12.2 A1.6 1.6 0 1 0 6.5 9 Z M9.6 5 A1.6 1.6 0 1 0 9.6 8.2 A1.6 1.6 0 1 0 9.6 5 Z M14.6 5 A1.6 1.6 0 1 0 14.6 8.2 A1.6 1.6 0 1 0 14.6 5 Z M18 8.4 A1.6 1.6 0 1 0 18 11.6 A1.6 1.6 0 1 0 18 8.4 Z M7.6 14 A1.6 1.6 0 1 0 7.6 17.2 A1.6 1.6 0 1 0 7.6 14 Z',
    'Balón': IC.j(IC.anillo(12,12,10,1.6), IC.pol(IC.rot([[12,8.4],[15.4,10.9],[14.1,14.9],[9.9,14.9],[8.6,10.9]], 0)), IC.rect(11.2,4,1.6,4.4), IC.rect(15.2,13,1.6,4.6,-35), IC.rect(7.2,13,1.6,4.6,35), IC.rect(16.4,8.6,1.4,4.2,72), IC.rect(6.2,8.6,1.4,4.2,-72)),
    'Manzana': IC.j('M12 7 C10.6 6 9.2 5.6 7.8 5.6 C4.6 5.6 2.5 8.4 2.5 12 C2.5 17 6 22.5 9 22.5 C10.2 22.5 10.8 21.8 12 21.8 C13.2 21.8 13.8 22.5 15 22.5 C18 22.5 21.5 17 21.5 12 C21.5 8.4 19.4 5.6 16.2 5.6 C14.8 5.6 13.4 6 12 7 Z', 'M12.6 5.6 C12.6 3.4 14.2 1.6 16.6 1.5 C16.6 3.8 15 5.4 12.6 5.6 Z'),
    'Campana': IC.j('M12 2 C12.8 2 13.4 2.6 13.4 3.4 L13.4 4.2 C16.4 4.8 18.5 7.4 18.5 10.5 L18.5 15.5 L21 18 L21 19 L3 19 L3 18 L5.5 15.5 L5.5 10.5 C5.5 7.4 7.6 4.8 10.6 4.2 L10.6 3.4 C10.6 2.6 11.2 2 12 2 Z', 'M9.6 20 L14.4 20 C14.4 21.4 13.3 22.5 12 22.5 C10.7 22.5 9.6 21.4 9.6 20 Z'),
    'Megáfono': IC.j('M3 9 L9 9 L19 3.5 L19 20.5 L9 15 L3 15 Z', IC.rect(5,15.6,3.2,6), IC.rect(20.4,10.8,2.4,2.4)),
    'Grupo de personas': IC.j(IC.circ(12,6.5,3.4), 'M5.5 20 C5.5 15.6 8.4 12.4 12 12.4 C15.6 12.4 18.5 15.6 18.5 20 Z', IC.circ(4.8,9,2.4), IC.circ(19.2,9,2.4), 'M0.8 18 C0.8 15 2.6 12.8 4.8 12.8 C5.8 12.8 6.6 13.2 7.2 13.8 C5.6 15 4.6 16.4 4.2 18 Z M23.2 18 C23.2 15 21.4 12.8 19.2 12.8 C18.2 12.8 17.4 13.2 16.8 13.8 C18.4 15 19.4 16.4 19.8 18 Z')
  }
};
Object.entries(ICONOS_MATERIA).forEach(([mat, lista]) => {
  const cont = $('gridIconosMateria');
  const h = document.createElement('h4'); h.textContent = mat; h.dataset.mat = mat; cont.appendChild(h);
  const g = document.createElement('div'); g.className = 'grid gridIco'; g.dataset.mat = mat; cont.appendChild(g);
  Object.entries(lista).forEach(([n, d]) => {
    const b = document.createElement('button'); b.className = 'forma'; b.title = n; b.dataset.n = sinAcentosIco(n + ' ' + mat);
    b.innerHTML = `<svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="${d}"/></svg>`;
    b.onclick = () => agregarIcono(n, d);
    g.appendChild(b);
  });
});
function sinAcentosIco(t){ return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function filtrarIconos(){
  const q = sinAcentosIco($('buscarIcono').value.trim());
  document.querySelectorAll('#gridIconos button, #gridIconosMateria .forma').forEach(b => {
    b.hidden = !!q && !(b.dataset.n || sinAcentosIco(b.title)).includes(q);
  });
  document.querySelectorAll('#gridIconosMateria h4').forEach(h => {
    const g = h.nextElementSibling; h.hidden = g.hidden = ![...g.children].some(b => !b.hidden);
  });
}
$('buscarIcono').addEventListener('input', filtrarIconos);
Object.assign(ICONOS, ...Object.values(ICONOS_MATERIA));   // también se pueden usar en plantillas con ICONO()

/* =========================================================
   RECORTAR IMAGEN EN FORMA
   ========================================================= */
function recortar(forma){
  const o = activo(); if (!o || o.type !== 'image') return;
  if (o.marco){ o.marco.tipo = { circulo:'circulo', cuadrado:'rect', redondo:'redondo', estrella:'estrella' }[forma] || 'rect'; ajustarFoto(o); canvas.requestRenderAll(); actualizarPanel(); guardarEstado(); return; }
  const w = o.width, h = o.height, m = Math.min(w, h);
  const base = { originX:'center', originY:'center', left:0, top:0 };
  let c = null;
  if (forma === 'circulo')  c = new fabric.Circle({ ...base, radius: m/2 });
  if (forma === 'cuadrado') c = new fabric.Rect({ ...base, width: m, height: m });
  if (forma === 'redondo')  c = new fabric.Rect({ ...base, width: w, height: h, rx: m*0.12, ry: m*0.12 });
  if (forma === 'estrella') c = new fabric.Polygon(puntosEstrella(5, m/2, m/4.6), base);
  o.clipPath = c; o.dirty = true;
  canvas.requestRenderAll(); guardarEstado();
}

/* =========================================================
   RECORTAR A MANO Y QUITAR FONDO
   ========================================================= */
let recorte = null;   // modo activo: { tipo:'rect'|'libre'|'zona', img, ov?, pts? }
function imagenActiva(){
  const o = activo();
  if (!o || o.type !== 'image'){ toast('Primero selecciona una imagen'); return null; }
  if (o.marco){ toast('Esta foto está dentro de un marco: usa “Sacar del marco” para recortarla a mano.'); return null; }
  return o;
}
function avisoRecorte(html){ const a = $('recorteAviso'); a.innerHTML = html; a.style.display = html ? 'flex' : 'none'; }
function bloquearOtros(img, si){
  canvas.getObjects().forEach(o => {
    if (recorte && o === recorte.ov) return;
    if (si){ if (!('__ev' in o)) o.__ev = o.evented; o.evented = false; }
    else if ('__ev' in o){ o.evented = o.__ev; delete o.__ev; }
  });
  canvas.selection = !si;
}
function terminarRecorte(guardar){
  if (!recorte) return;
  const { img, ov } = recorte;
  recorte = null;
  if (ov){ restaurando = true; canvas.remove(ov); restaurando = false; }
  canvas.off('after:render', sombraRecorte);
  bloquearOtros(img, false);
  canvas.defaultCursor = 'default'; canvas.clearContext(canvas.contextTop);
  avisoRecorte('');
  if (canvas.getObjects().includes(img)) canvas.setActiveObject(img);
  canvas.requestRenderAll(); renderCapas(); actualizarPanel();
  if (guardar) guardarEstado();
}
// ---------- Recorte con recuadro ----------
function iniciarRecorteRect(){
  const img = imagenActiva(); if (!img) return;
  terminarRecorte(false);
  const c = img.getCenterPoint();
  const ov = new fabric.Rect({ width:img.getScaledWidth(), height:img.getScaledHeight(), angle:img.angle, originX:'center', originY:'center', left:c.x, top:c.y,
    fill:'rgba(255,255,255,0.001)', stroke:'#19c8ff', strokeWidth:2, strokeDashArray:[8, 6], strokeUniform:true, lockRotation:true,
    esDeco:true, name:'Recorte', cornerColor:'#19c8ff', cornerStrokeColor:'#0f1218', transparentCorners:false });
  ov.setControlVisible('mtr', false);
  recorte = { tipo:'rect', img, ov };
  restaurando = true; canvas.add(ov); restaurando = false;
  bloquearOtros(img, true);
  canvas.setActiveObject(ov); canvas.on('after:render', sombraRecorte); canvas.requestRenderAll();
  avisoRecorte('✂ Mueve y ajusta el recuadro sobre lo que quieres conservar <button onclick="aplicarRecorteRect()">✓ Recortar</button><button onclick="terminarRecorte(false)">Cancelar</button>');
}
function sombraRecorte(){
  if (!recorte || recorte.tipo !== 'rect') return;
  const ctx = canvas.contextContainer, v = canvas.viewportTransform;
  const a = recorte.img.calcACoords(), b = recorte.ov.calcACoords();
  ctx.save(); ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
  ctx.beginPath();
  [a.tl, a.tr, a.br, a.bl].forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
  [b.tl, b.bl, b.br, b.tr].forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
  ctx.fillStyle = 'rgba(15,17,25,.55)'; ctx.fill('evenodd');
  ctx.restore();
}
function aplicarRecorteRect(){
  if (!recorte || recorte.tipo !== 'rect') return;
  const { img, ov } = recorte, m = img.calcTransformMatrix(), inv = fabric.util.invertTransform(m);
  const c = ov.calcACoords();
  const pts = [c.tl, c.tr, c.br, c.bl].map(p => fabric.util.transformPoint(p, inv));
  const w = img.width, h = img.height;
  const x0 = Math.max(-w / 2, Math.min(...pts.map(p => p.x))), x1 = Math.min(w / 2, Math.max(...pts.map(p => p.x)));
  const y0 = Math.max(-h / 2, Math.min(...pts.map(p => p.y))), y1 = Math.min(h / 2, Math.max(...pts.map(p => p.y)));
  if (x1 - x0 < 4 || y1 - y0 < 4){ toast('El recuadro quedó fuera de la imagen'); return; }
  const centro = fabric.util.transformPoint(new fabric.Point((x0 + x1) / 2, (y0 + y1) / 2), m);
  img.set({ cropX:(img.cropX || 0) + x0 + w / 2, cropY:(img.cropY || 0) + y0 + h / 2, width:x1 - x0, height:y1 - y0 });
  img.clipPath = null;
  img.setPositionByOrigin(centro, 'center', 'center'); img.setCoords(); img.dirty = true;
  terminarRecorte(true);
  toast('Imagen recortada. “⤢ Ver completa” la regresa a como estaba.');
}
function verImagenCompleta(){
  const img = imagenActiva(); if (!img) return;
  const og = img.getOriginalSize();
  // la parte visible se queda en su lugar y la imagen completa se extiende a su alrededor
  const local = new fabric.Point(og.width / 2 - (img.cropX || 0) - img.width / 2, og.height / 2 - (img.cropY || 0) - img.height / 2);
  const c = fabric.util.transformPoint(local, img.calcTransformMatrix());
  img.set({ cropX:0, cropY:0, width:og.width, height:og.height }); img.clipPath = null;
  img.setPositionByOrigin(c, 'center', 'center'); img.setCoords(); img.dirty = true;
  canvas.requestRenderAll(); guardarEstado();
}
// ---------- Recorte libre (dibujar el contorno) ----------
function iniciarRecorteLibre(){
  const img = imagenActiva(); if (!img) return;
  terminarRecorte(false);
  recorte = { tipo:'libre', img, pts:null };
  bloquearOtros(img, true); canvas.discardActiveObject(); canvas.defaultCursor = 'crosshair'; canvas.requestRenderAll();
  avisoRecorte('✏ Dibuja con el mouse o el dedo el contorno de lo que quieres conservar <button onclick="terminarRecorte(false)">Cancelar</button>');
}
function dibujarLazo(){
  const ctx = canvas.contextTop, pts = recorte.pts; canvas.clearContext(ctx);
  ctx.save(); ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p.x * zoom, p.y * zoom) : ctx.moveTo(p.x * zoom, p.y * zoom));
  ctx.fillStyle = 'rgba(25,200,255,.12)'; ctx.fill();
  ctx.strokeStyle = '#19c8ff'; ctx.lineWidth = 3; ctx.setLineDash([7, 5]); ctx.stroke();
  ctx.restore();
}
function aplicarLazo(pts){
  const img = recorte.img, inv = fabric.util.invertTransform(img.calcTransformMatrix());
  const loc = [];
  pts.forEach(p => { const q = fabric.util.transformPoint(p, inv), u = loc[loc.length - 1]; if (!u || Math.hypot(q.x - u.x, q.y - u.y) > 1.5) loc.push({ x:q.x, y:q.y }); });
  if (loc.length < 6){ toast('Dibuja un contorno más grande'); return; }
  img.clipPath = new fabric.Polygon(loc, { fill:'#000', stroke:null, strokeWidth:0, objectCaching:false });
  img.dirty = true;
  terminarRecorte(true);
  toast('Recorte libre aplicado. “Quitar recorte” lo deshace.');
}
// ---------- Quitar fondo ----------
const distColor = (d, i, r, g, b) => Math.sqrt((d[i] - r) ** 2 + (d[i + 1] - g) ** 2 + (d[i + 2] - b) ** 2);
async function procesarFondo(img, semillas){
  const tol = +$('bgTol').value;
  const src = img._originalElement || img._element;
  const nw = src.naturalWidth || src.width, nh = src.naturalHeight || src.height;
  const k = Math.min(1, 2400 / Math.max(nw, nh));
  const cw = Math.max(1, Math.round(nw * k)), ch = Math.max(1, Math.round(nh * k));
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d', { willReadFrequently:true }); g.drawImage(src, 0, 0, cw, ch);
  let data;
  try { data = g.getImageData(0, 0, cw, ch); }
  catch (e) { toast('Esta imagen no se puede editar porque viene de otro sitio. Descárgala y súbela desde tu computadora.'); return null; }
  const d = data.data, N = cw * ch;
  // colores de referencia
  let refs = [], inicio = [];
  if (semillas){
    semillas.forEach(s => {
      const x = Math.max(0, Math.min(cw - 1, Math.round(s.x * k))), y = Math.max(0, Math.min(ch - 1, Math.round(s.y * k)));
      const i = (y * cw + x) * 4;
      if (d[i + 3] < 20){ return; }
      refs.push([d[i], d[i + 1], d[i + 2]]); inicio.push(y * cw + x);
    });
    if (!refs.length){ toast('Esa zona ya es transparente'); return null; }
  } else {
    const cuenta = new Map(), borde = [];
    for (let x = 0; x < cw; x++){ borde.push(x, (ch - 1) * cw + x); }
    for (let y = 1; y < ch - 1; y++){ borde.push(y * cw, y * cw + cw - 1); }
    let opacos = 0;
    borde.forEach(p => { const i = p * 4; if (d[i + 3] < 20) return; opacos++; const q = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4); cuenta.set(q, (cuenta.get(q) || 0) + 1); });
    if (!opacos){ toast('Esta imagen ya no tiene fondo en los bordes'); return null; }
    [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([q, n]) => {
      if (n / opacos < 0.08 && refs.length) return;
      refs.push([((q >> 8) & 15) * 16 + 8, ((q >> 4) & 15) * 16 + 8, (q & 15) * 16 + 8]);
    });
    inicio = borde;
  }
  const lim = tol * 1.6;
  const parecido = p => { const i = p * 4; if (d[i + 3] < 20) return true; for (const [r, gg, b] of refs) if (distColor(d, i, r, gg, b) <= lim) return true; return false; };
  // relleno por inundación desde las semillas
  const quitar = new Uint8Array(N), pila = new Int32Array(N); let tope = 0;
  inicio.forEach(p => { if (!quitar[p] && parecido(p)){ quitar[p] = 1; pila[tope++] = p; } });
  while (tope){
    const p = pila[--tope], x = p % cw;
    const vec = [x > 0 ? p - 1 : -1, x < cw - 1 ? p + 1 : -1, p - cw, p + cw];
    for (const q of vec){ if (q >= 0 && q < N && !quitar[q] && parecido(q)){ quitar[q] = 1; pila[tope++] = q; } }
  }
  let borrados = 0;
  for (let p = 0; p < N; p++) if (quitar[p]){ if (d[p * 4 + 3] >= 20) borrados++; d[p * 4 + 3] = 0; }
  // bordes suaves: los pixeles junto a lo borrado y parecidos al fondo quedan semitransparentes
  for (let p = 0; p < N; p++){
    if (quitar[p]) continue;
    const x = p % cw;
    if (!((x > 0 && quitar[p - 1]) || (x < cw - 1 && quitar[p + 1]) || (p >= cw && quitar[p - cw]) || (p + cw < N && quitar[p + cw]))) continue;
    const i = p * 4; let m = Infinity;
    for (const [r, gg, b] of refs) m = Math.min(m, distColor(d, i, r, gg, b));
    const f = Math.max(0.2, Math.min(1, (m - lim) / lim));
    d[i + 3] = Math.round(d[i + 3] * f);
  }
  if (!borrados){ toast('No encontré fondo para quitar con esa tolerancia. Prueba subirla.'); return null; }
  g.putImageData(data, 0, 0);
  const antes = { c:img.getCenterPoint(), cropX:img.cropX || 0, cropY:img.cropY || 0, width:img.width, height:img.height, sx:img.scaleX, sy:img.scaleY };
  await new Promise(ok => img.setSrc(cv.toDataURL('image/png'), ok));
  img.set({ cropX:antes.cropX * k, cropY:antes.cropY * k, width:antes.width * k, height:antes.height * k, scaleX:antes.sx / k, scaleY:antes.sy / k });
  if (img.filters && img.filters.length) img.applyFilters();
  img.setPositionByOrigin(antes.c, 'center', 'center'); img.setCoords(); img.dirty = true;
  canvas.requestRenderAll();
  return borrados / N;
}
async function quitarFondoImagen(){
  const img = imagenActiva(); if (!img) return;
  terminarRecorte(false);
  cargando(true);
  try {
    const f = await procesarFondo(img, null);
    if (f != null){ guardarEstado(); actualizarPanel(); toast('Fondo quitado (' + Math.round(f * 100) + '% de la imagen). Si quitó de más, deshaz con Ctrl+Z y baja la tolerancia.'); }
  } catch (e) { console.error(e); toast('No se pudo quitar el fondo: ' + e.message); }
  finally { cargando(false); }
}
function iniciarBorrarZona(){
  const img = imagenActiva(); if (!img) return;
  terminarRecorte(false);
  recorte = { tipo:'zona', img };
  bloquearOtros(img, true); canvas.discardActiveObject(); canvas.defaultCursor = 'crosshair'; canvas.requestRenderAll();
  avisoRecorte('👆 Toca o haz clic en la zona de color que quieres borrar (puedes tocar varias) <button onclick="terminarRecorte(true)">✓ Listo</button>');
}
async function borrarZonaEn(p){
  const img = recorte.img, q = fabric.util.transformPoint(p, fabric.util.invertTransform(img.calcTransformMatrix()));
  if (Math.abs(q.x) > img.width / 2 || Math.abs(q.y) > img.height / 2){ toast('Toca dentro de la imagen'); return; }
  cargando(true);
  try {
    const f = await procesarFondo(img, [{ x:(img.cropX || 0) + q.x + img.width / 2, y:(img.cropY || 0) + q.y + img.height / 2 }]);
    if (f != null) toast('Zona borrada. Toca otra o pulsa ✓ Listo.');
  } catch (e) { console.error(e); toast('No se pudo borrar: ' + e.message); }
  finally { cargando(false); }
}
// ---------- Eventos del lienzo durante los modos ----------
canvas.on('mouse:down', e => {
  if (!recorte || recorte.tipo === 'rect') return;
  const p = canvas.getPointer(e.e);
  if (recorte.tipo === 'zona'){ borrarZonaEn(p); return; }
  recorte.pts = [p];
});
canvas.on('mouse:move', e => {
  if (!recorte || recorte.tipo !== 'libre' || !recorte.pts) return;
  const p = canvas.getPointer(e.e), u = recorte.pts[recorte.pts.length - 1];
  if (Math.hypot(p.x - u.x, p.y - u.y) > 2 / zoom){ recorte.pts.push(p); dibujarLazo(); }
});
canvas.on('mouse:up', () => {
  if (!recorte || recorte.tipo !== 'libre' || !recorte.pts) return;
  const pts = recorte.pts; recorte.pts = null; canvas.clearContext(canvas.contextTop);
  if (pts.length < 8){ toast('Dibuja un contorno más grande alrededor de lo que quieres conservar'); return; }
  aplicarLazo(pts);
});
canvas.on('selection:cleared', () => { if (recorte && recorte.tipo === 'rect') canvas.setActiveObject(recorte.ov); });
window.addEventListener('keydown', e => {
  if (!recorte) return;
  if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); terminarRecorte(recorte.tipo === 'zona'); }
  else if (e.key === 'Enter' && recorte.tipo === 'rect'){ e.preventDefault(); e.stopPropagation(); aplicarRecorteRect(); }
  else if (['Delete', 'Backspace'].includes(e.key)){ e.preventDefault(); e.stopPropagation(); }
}, true);

/* =========================================================
   MIS COLORES
   ========================================================= */
let misColores = [];
try { misColores = JSON.parse(localStorage.getItem('disenador_colores') || '[]'); } catch(e){}
if (!misColores.length) misColores = ['#7c3aed', '#06b6d4', '#1f2330', '#ffffff'];
function guardarColores(){
  try { localStorage.setItem('disenador_colores', JSON.stringify(misColores)); } catch(e){}
  renderMisColores();
}
function renderMisColores(){
  const c = $('misColores'); c.innerHTML = '';
  misColores.forEach((col, i) => {
    const d = document.createElement('div'); d.className = 'sw'; d.style.background = col; d.title = col;
    d.onclick = () => { $('pRelleno').value = col; aplicar('fill', col); };
    d.ondblclick = () => { misColores.splice(i, 1); guardarColores(); };
    c.appendChild(d);
  });
  const mas = document.createElement('button'); mas.className = 'pb'; mas.textContent = '+'; mas.title = 'Guardar el color actual';
  mas.onclick = () => { const v = $('pRelleno').value; if (!misColores.includes(v)){ misColores.push(v); guardarColores(); } };
  c.appendChild(mas);
}
renderMisColores();

/* =========================================================
   TEXTO DENTRO DE FORMAS (la forma crece con el texto)
   ========================================================= */
const PAD = () => 24 * Math.min(W, H) / 1080;   // margen interior proporcional al lado corto del lienzo
const PATH_NUBE = 'M25 60 C10 60 5 45 18 38 C15 22 35 15 45 25 C52 10 78 12 80 30 C95 28 100 48 88 56 C90 66 75 70 68 63 C60 72 40 72 35 63 C30 66 25 64 25 60 Z';
const PATH_BLOB = 'M60 5 C85 5 100 25 95 50 C90 75 70 95 45 92 C20 89 2 70 5 45 C8 20 35 5 60 5 Z';
function puedeTenerTexto(o){
  return !!o && !esTexto(o) && !esLinea(o) && !['image','group','activeSelection'].includes(o.type) && !o.esFondo && !o.esDeco;
}
function anchoUtil(f){
  const porForma = { rombo:0.5, paralelo:0.72, documento:0.92, elipse:0.72, nube:0.6, blob:0.66 }[f.forma];
  if (porForma) return porForma;
  return f.type === 'rect' ? 1 : (f.type === 'circle' || f.type === 'ellipse') ? 0.72 : f.type === 'triangle' ? 0.55 : 0.68;
}
function esOscuro(c){
  if (typeof c !== 'string') return false;
  try { const [r, g, b] = new fabric.Color(c).getSource(); return (0.299*r + 0.587*g + 0.114*b) < 150; } catch(e){ return false; }
}
function anchoTexto(f){ return Math.max(60, f.getScaledWidth() * anchoUtil(f) - 2 * PAD()); }
function centrarTexto(t, f){
  const c = f.getCenterPoint();
  t.set({ originX:'center', originY:'center', left:c.x, top:c.y, angle:f.angle }); t.setCoords();
}
// Crea el texto vinculado a una forma (no lo agrega al lienzo)
function crearTextoVinculado(f, texto, est = {}){
  f.id = f.id || nuevoId();
  if (!f.anchoBase) f.anchoBase = f.getScaledWidth();
  if (!f.altoBase) f.altoBase = f.getScaledHeight();
  const t = new fabric.Textbox(texto, {
    width: anchoTexto(f), fontFamily: est.fontFamily || 'Poppins', fontSize: est.fontSize || 40 * s(),
    fontWeight: est.fontWeight || '400', fontStyle: est.fontStyle || 'normal', textAlign: 'center', lineHeight: 1.15,
    fill: est.fill || (esOscuro(f.fill) ? '#ffffff' : '#1f2330'), textoDe: f.id, id: nuevoId(), name: 'Texto de forma'
  });
  prepararTextoVinculado(t);
  f.formaTexto = t.id;
  centrarTexto(t, f);
  return t;
}
// El texto de una forma no tiene asas propias: se redimensiona la forma
function prepararTextoVinculado(t){
  t.set({ hasControls:false, lockScalingX:true, lockScalingY:true, lockRotation:true });
}
function normalizarVinculos(){
  canvas.getObjects().forEach(o => { if (o.textoDe && porId(o.textoDe)) prepararTextoVinculado(o); });
}
function textoEnForma(f){
  if (!puedeTenerTexto(f)) return;
  const ya = porId(f.formaTexto);
  if (ya){ canvas.setActiveObject(ya); ya.enterEditing(); ya.selectAll(); canvas.requestRenderAll(); return; }
  const t = crearTextoVinculado(f, 'Escribe aquí');
  canvas.add(t); ajustarFormaATexto(t); ordenarVinculos();
  canvas.setActiveObject(t); t.enterEditing(); t.selectAll(); canvas.requestRenderAll();
}
function agregarCuadroTexto(){
  const k = s();
  const r = new fabric.Rect({ left:W/2, top:H/2, originX:'center', originY:'center', width:520*k, height:160*k,
    rx:24*k, ry:24*k, fill:$('colorForma').value, strokeWidth:0 });
  agregar(r, 'Cuadro de texto');
  textoEnForma(r);
}
// Ancho que ocuparía el texto en una sola línea por renglón (sin cortes automáticos)
function anchoNatural(t){
  const m = new fabric.Text(t.text || ' ', { fontSize:t.fontSize, fontFamily:t.fontFamily, fontWeight:t.fontWeight,
    fontStyle:t.fontStyle, charSpacing:t.charSpacing, lineHeight:t.lineHeight });
  return m.width + 4;
}
// Cambia el tamaño visible de una forma según su tipo
function fijarTamanoForma(f, w, hgt){
  if (f.type === 'rect'){
    f.set({ width: w / f.scaleX, height: hgt / f.scaleY });
    if (f.forma === 'pildora'){ const r = Math.min(w, hgt) / 2; f.set({ rx: r / f.scaleX, ry: r / f.scaleY }); }
  } else if (f.type === 'circle'){
    f.set('radius', Math.max(w, hgt) / 2 / f.scaleX);
  } else if (f.type === 'ellipse'){
    f.set({ rx: w / 2 / f.scaleX, ry: hgt / 2 / f.scaleY });
  } else {
    f.set({ scaleX: w / f.width, scaleY: hgt / f.height });
  }
}
// La forma se adapta al texto: primero se ensancha (hasta un límite) y luego crece hacia abajo.
// Nunca queda más chica que el tamaño que tú le diste.
function ajustarFormaATexto(t){
  const f = porId(t.textoDe); if (!f || f.group || t.group) return;
  if (f.tabla){ reorganizarTabla(f.tabla); return; }
  const pad = PAD(), fac = anchoUtil(f), facAlto = f.type === 'rect' ? 1 : fac;
  const base = f.anchoBase || f.getScaledWidth(), baseAlto = f.altoBase || f.getScaledHeight();
  const minTexto = Math.max(40, base * fac - 2 * pad);
  const limite = f.forma === 'rombo' ? minTexto * 1.5 : Math.min(720 * s(), W * 0.85);
  const maxTexto = Math.max(minTexto, f.anchoMax || limite);
  const tw = Math.min(maxTexto, Math.max(minTexto, anchoNatural(t)));
  if (Math.abs(t.width - tw) > 0.5){ t.set('width', tw); }
  t.initDimensions();
  let ancho = Math.max(base, (tw + 2 * pad) / fac);
  let alto = Math.max(baseAlto, (t.height * t.scaleY + 2 * pad) / facAlto);
  if (f.type === 'circle'){ ancho = alto = Math.max(ancho, alto); }
  if (Math.abs(ancho - f.getScaledWidth()) > 0.5 || Math.abs(alto - f.getScaledHeight()) > 0.5){
    const c = f.getCenterPoint(), altoAntes = f.getScaledHeight();
    fijarTamanoForma(f, ancho, alto);
    // crece hacia abajo (el borde de arriba se queda en su lugar) y parejo a los lados
    const nuevoC = f.angle ? c : new fabric.Point(c.x, c.y - altoAntes / 2 + f.getScaledHeight() / 2);
    f.setPositionByOrigin(nuevoC, 'center', 'center');
    f.setCoords();
  }
  centrarTexto(t, f);
  actualizarConexiones(f);
}
// Mantiene el texto encima de su forma en el orden de capas
function ordenarVinculos(){
  const objs = canvas._objects;
  objs.filter(o => o.formaTexto).forEach(f => {
    const t = porId(f.formaTexto); if (!t) return;
    objs.splice(objs.indexOf(t), 1);
    objs.splice(objs.indexOf(f) + 1, 0, t);
  });
}
// Al seleccionar varias cosas, la forma y su texto (o un conector) se comportan como una sola pieza
let editandoCelda = false;
function incluirVinculados(){
  const sel0 = activo();
  if (sel0 && sel0.type !== 'activeSelection' && !sel0.isEditing && !editandoCelda){
    const f0 = nodoBase(sel0);
    if (f0 && f0.tabla){ seleccionarTabla(f0.tabla); return; }
  }
  const a = activo(); if (!a || a.type !== 'activeSelection') return;
  a.getObjects().slice().forEach(o => {
    const t = porId(o.formaTexto); if (t && !a.contains(t)) a.addWithUpdate(t);
    const f = porId(o.textoDe);    if (f && !a.contains(f)) a.addWithUpdate(f);
  });
  a.getObjects().filter(o => o.type === 'conector').forEach(c => a.removeWithUpdate(c));
}
// Mientras arrastras, escalas o giras: el texto sigue a su forma y los conectores se reajustan
function seguirVinculos(o){
  if (!o) return;
  const lista = o.type === 'activeSelection' ? o.getObjects() : [o];
  lista.forEach(x => {
    if (x.group) return;
    if (x.formaTexto){
      const t = porId(x.formaTexto);
      if (t && !t.group){ t.set('width', anchoTexto(x)); t.initDimensions(); centrarTexto(t, x); }
    }
    if (x.textoDe){
      const f = porId(x.textoDe);
      if (f && !f.group){
        const c = x.getCenterPoint(), fc = f.getCenterPoint();
        f.set({ left: f.left + (c.x - fc.x), top: f.top + (c.y - fc.y) }); f.setCoords();
        actualizarConexiones(f);
      }
    }
  });
  actualizarConexiones(o);
}
function vinculosAlModificar(o){
  if (!o) return;
  const lista = o.type === 'activeSelection' ? o.getObjects() : [o];
  lista.forEach(x => {
    if (x.group) return;
    if (x.formaTexto){
      const t = porId(x.formaTexto);
      // si tú cambias el tamaño de la forma, ese tamaño se respeta y el texto se acomoda dentro
      if (Math.abs(x.getScaledWidth() - (x.anchoBase || 0)) > 1 || Math.abs(x.getScaledHeight() - (x.altoBase || 0)) > 1){
        x.anchoBase = x.getScaledWidth(); x.altoBase = x.getScaledHeight(); x.anchoMax = anchoTexto(x);
      }
      if (t) ajustarFormaATexto(t);
    }
    if (x.textoDe) ajustarFormaATexto(x);
  });
  actualizarConexiones(o);
}
function limpiarVinculosClon(c){
  const lista = c.type === 'activeSelection' ? c.getObjects() : [c];
  const mapa = {};
  lista.forEach(x => { const n = nuevoId(); if (x.id) mapa[x.id] = n; x.id = n; });
  const mapaT = {};
  lista.forEach(x => {
    if (x.tabla) x.tabla = mapaT[x.tabla] || (mapaT[x.tabla] = nuevoId());
    x.formaTexto = mapa[x.formaTexto] || null;
    x.textoDe = mapa[x.textoDe] || null;
    if (x.type === 'conector'){
      x.conA = mapa[x.conA] || null; x.conB = mapa[x.conB] || null;
      if (!x.conA || !x.conB) x.set({ lockMovementX:false, lockMovementY:false, hasControls:true });
    }
  });
}

/* =========================================================
   CONECTORES
   ========================================================= */
function candidatosConexion(){
  return canvas.getActiveObjects().filter(o => o.type !== 'conector' && !o.textoDe);
}
function puntoBorde(r, hacia, obj){
  const cx = r.left + r.width/2, cy = r.top + r.height/2, dx = hacia.x - cx, dy = hacia.y - cy;
  if (!dx && !dy) return { x:cx, y:cy };
  if (obj && (obj.type === 'circle' || obj.type === 'ellipse')){   // borde redondo real
    const rx = r.width/2, ry = r.height/2, t = 1 / Math.sqrt((dx*dx)/(rx*rx) + (dy*dy)/(ry*ry));
    return { x: cx + dx*Math.min(t, 1), y: cy + dy*Math.min(t, 1) };
  }
  const sx = dx ? (r.width/2) / Math.abs(dx) : Infinity, sy = dy ? (r.height/2) / Math.abs(dy) : Infinity;
  const t = Math.min(sx, sy, 1);
  return { x: cx + dx*t, y: cy + dy*t };
}
// Elige los lados que se "miran" entre dos formas, según dónde está cada una
function ladosAuto(ra, rb){
  const gx = Math.max(rb.left - (ra.left + ra.width), ra.left - (rb.left + rb.width));
  const gy = Math.max(rb.top - (ra.top + ra.height), ra.top - (rb.top + rb.height));
  const ca = { x: ra.left + ra.width/2, y: ra.top + ra.height/2 }, cb = { x: rb.left + rb.width/2, y: rb.top + rb.height/2 };
  if (gx >= gy && gx > 0) return cb.x > ca.x ? ['der','izq'] : ['izq','der'];
  if (gy > 0) return cb.y > ca.y ? ['aba','arr'] : ['arr','aba'];
  const l = ladoHacia(ra, cb);
  return [l, { der:'izq', izq:'der', arr:'aba', aba:'arr' }[l]];
}
// Recalcula por dónde pasa el conector cada vez que algo se mueve
function actualizarConector(c){
  if (c.group) return;
  const a = porId(c.conA), b = porId(c.conB); if (!a || !b) return;
  const ra = cajaAbs(a), rb = cajaAbs(b);
  const [la, lb] = (c.fijo && c.ladoA && c.ladoB) ? [c.ladoA, c.ladoB] : ladosAuto(ra, rb);
  const redonda = o => ['circle','ellipse'].includes(o.type) || ['nube','blob'].includes(o.forma);
  const ca = { x: ra.left + ra.width/2, y: ra.top + ra.height/2 }, cb = { x: rb.left + rb.width/2, y: rb.top + rb.height/2 };
  const recta = (c.estilo || 'recta') === 'recta' && !c.fijo;
  const p1 = recta && redonda(a) ? puntoBorde(ra, cb, a) : ladoPunto(ra, la);
  const p2 = recta && redonda(b) ? puntoBorde(rb, ca, b) : ladoPunto(rb, lb);
  const vA = la === 'arr' || la === 'aba', vB = lb === 'arr' || lb === 'aba';
  c.modo = vA !== vB ? (vA ? 'vh' : 'hv') : null;
  c.horiz = !vA;
  if (!c.fijo){ c.ladoA = la; c.ladoB = lb; }
  c.set({ x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y }); c.setCoords();
}
function actualizarConexiones(o){
  if (!o) return;
  const ids = new Set();
  (o.type === 'activeSelection' ? o.getObjects() : [o]).forEach(x => {
    if (x.id) ids.add(x.id);
    if (x.textoDe) ids.add(x.textoDe);
  });
  canvas.getObjects().forEach(c => { if (c.type === 'conector' && (ids.has(c.conA) || ids.has(c.conB))) actualizarConector(c); });
}
function actualizarTodasConexiones(){ canvas.getObjects().filter(o => o.type === 'conector').forEach(actualizarConector); }
const conectorDef = { estilo:'codo', inicio:'nada', fin:'flecha', patron:'solida', color:'#1f2330' };
function unir(a, b, o = {}){
  a.id = a.id || nuevoId(); b.id = b.id || nuevoId();
  const c = new fabric.Conector([0, 0, 1, 1], {
    stroke: o.color || conectorDef.color, strokeWidth: o.ancho || 5 * s(), strokeLineCap:'round',
    estilo: o.estilo || conectorDef.estilo, inicio: o.inicio || conectorDef.inicio,
    fin: o.fin || (o.flecha === false ? 'nada' : conectorDef.fin),
    patron: o.patron || (o.punteada ? 'guiones' : conectorDef.patron),
    etiqueta: o.etiqueta || '', orient: o.orient || null, dir: o.dir || null,
    ladoA: o.lados ? o.lados[0] : null, ladoB: o.lados ? o.lados[1] : null, fijo: !!o.lados,
    conA: a.id, conB: b.id, objectCaching:false, perPixelTargetFind:true,
    lockMovementX:true, lockMovementY:true, hasControls:false, id: nuevoId(), name:'Conector'
  });
  actualizarConector(c);
  canvas.add(c); canvas.sendToBack(c);
  canvas.getObjects().filter(x => x.esFondo).forEach(x => canvas.sendToBack(x));
  return c;
}
function heredarConector(c){
  if (!c) return {};
  return { estilo:c.estilo, inicio:c.inicio || 'nada', fin:c.fin || (c.flecha ? 'flecha' : 'nada'),
    patron:c.patron || (c.strokeDashArray ? 'guiones' : 'solida'), color:c.stroke, ancho:c.strokeWidth };
}
function conectar(){
  const sel = candidatosConexion();
  if (sel.length !== 2){ toast('Selecciona exactamente dos elementos (Shift + clic) para conectarlos'); return; }
  canvas.discardActiveObject();
  restaurando = true; const c = unir(sel[0], sel[1]); restaurando = false;
  canvas.setActiveObject(c); canvas.requestRenderAll(); renderCapas(); guardarEstado();
}
function conSel(){ const o = activo(); return o && o.type === 'conector' ? o : null; }
function cambiarConector(cambios){
  const o = conSel(); if (!o) return;
  o.set(cambios); o.dirty = true; actualizarConector(o);
  canvas.requestRenderAll(); actualizarPanel(); guardarEstado();
}
function togglePunteada(){ const o = conSel(); if (o) cambiarConector({ patron: o.patron === 'guiones' ? 'solida' : 'guiones', strokeDashArray:null }); }
document.querySelectorAll('#estilosCon .pb').forEach(b => b.onclick = () => cambiarConector({ estilo:b.dataset.e, orient:null, ladoA:null, ladoB:null, fijo:false }));
document.querySelectorAll('#patronesCon .pb').forEach(b => b.onclick = () => cambiarConector({ patron:b.dataset.p, strokeDashArray:null }));
const PUNTAS = [['nada','Sin punta'],['flecha','Flecha'],['abierta','Flecha abierta'],['circulo','Círculo'],['rombo','Rombo']];
['pInicio','pFin'].forEach(id => {
  PUNTAS.forEach(([v, n]) => { const op = document.createElement('option'); op.value = v; op.textContent = n; $(id).appendChild(op); });
  $(id).onchange = e => cambiarConector(id === 'pInicio' ? { inicio:e.target.value } : { fin:e.target.value, flecha: e.target.value !== 'nada' });
});
function invertirConector(){
  const o = conSel(); if (!o) return;
  cambiarConector({ conA:o.conB, conB:o.conA, ladoA:o.ladoB, ladoB:o.ladoA,
    inicio: o.fin || (o.flecha ? 'flecha' : 'nada'), fin: o.inicio || 'nada' });
}
function usarComoPredeterminado(){
  const o = conSel(); if (!o) return;
  Object.assign(conectorDef, heredarConector(o)); delete conectorDef.ancho;
  toast('Las líneas nuevas usarán este estilo');
}
$('pEtiqueta').addEventListener('input', e => { const o = conSel(); if (o){ o.set('etiqueta', e.target.value); canvas.requestRenderAll(); } });
$('pEtiqueta').addEventListener('change', guardarEstado);

/* =========================================================
   MAPAS Y DIAGRAMAS
   ========================================================= */
const nodoBase = o => (o && o.textoDe) ? porId(o.textoDe) : o;
function crearForma(tipo, o = {}){
  const w = o.w || 320 * s(), hh = o.h || 130 * s();
  const base = { originX:'center', originY:'center', left:0, top:0, fill: o.fill || $('colorForma').value,
    stroke: o.stroke || null, strokeWidth: o.stroke ? (o.grosor || 4 * s()) : 0, strokeUniform:true, forma: tipo };
  switch (tipo){
    case 'redondo':  return new fabric.Rect({ ...base, width:w, height:hh, rx:Math.min(w, hh) * 0.2, ry:Math.min(w, hh) * 0.2 });
    case 'pildora':  return new fabric.Rect({ ...base, width:w, height:hh, rx:hh/2, ry:hh/2 });
    case 'rombo':    return new fabric.Polygon([{x:w/2,y:0},{x:w,y:hh/2},{x:w/2,y:hh},{x:0,y:hh/2}], base);
    case 'paralelo': { const d = hh * 0.35; return new fabric.Polygon([{x:d,y:0},{x:w,y:0},{x:w-d,y:hh},{x:0,y:hh}], base); }
    case 'documento':return new fabric.Path(`M0 0 L${w} 0 L${w} ${hh*0.85} C${w*0.75} ${hh*0.68} ${w*0.5} ${hh*1.04} ${w*0.25} ${hh} C${w*0.12} ${hh*0.98} ${w*0.05} ${hh*0.9} 0 ${hh*0.85} Z`, base);
    case 'circulo':  return new fabric.Circle({ ...base, radius: w/2 });
    case 'elipse':   return new fabric.Ellipse({ ...base, rx: w/2, ry: hh/2 });
    case 'nota':     return new fabric.Rect({ ...base, width:w, height:hh, fill: o.fill || '#fde68a', shadow: new fabric.Shadow({ color:'rgba(0,0,0,.18)', blur:14*s(), offsetX:4*s(), offsetY:6*s() }) });
    case 'nube': case 'blob': {
      const pth = new fabric.Path(tipo === 'nube' ? PATH_NUBE : PATH_BLOB, base);
      pth.set({ scaleX: w / pth.width, scaleY: hh / pth.height }); return pth;
    }
    default:         return new fabric.Rect({ ...base, width:w, height:hh });
  }
}
// Crea un nodo (forma + texto) centrado en x, y
function nodo(tipo, texto, x, y, o = {}){
  const f = crearForma(tipo, o);
  f.id = nuevoId(); f.name = o.nombre || 'Nodo';
  if (o.anchoMax) f.anchoMax = o.anchoMax;
  f.setPositionByOrigin(new fabric.Point(x, y), 'center', 'center'); f.setCoords();
  canvas.add(f);
  if (texto != null){
    const t = crearTextoVinculado(f, texto, { fontSize:o.tam, fill:o.color, fontWeight:o.peso, fontFamily:o.fuente });
    canvas.add(t); ajustarFormaATexto(t);
  }
  return f;
}
const TIPOS_NODO = [
  ['pildora','Inicio / fin','<rect x="3" y="8" width="40" height="14" rx="7"/>'],
  ['proceso','Proceso','<rect x="5" y="5" width="36" height="20"/>'],
  ['rombo','Decisión','<polygon points="23,2 44,15 23,28 2,15"/>'],
  ['paralelo','Datos','<polygon points="11,5 43,5 35,25 3,25"/>'],
  ['documento','Documento','<path d="M5 4 H41 V22 C32 18 24 28 14 25 C10 24 7 23 5 22 Z"/>'],
  ['elipse','Idea','<ellipse cx="23" cy="15" rx="20" ry="11"/>'],
  ['redondo','Concepto','<rect x="5" y="5" width="36" height="20" rx="6"/>'],
  ['circulo','Círculo','<circle cx="23" cy="15" r="12"/>'],
  ['nube','Nube','<path transform="translate(1,-3) scale(.45)" d="M25 60 C10 60 5 45 18 38 C15 22 35 15 45 25 C52 10 78 12 80 30 C95 28 100 48 88 56 C90 66 75 70 68 63 C60 72 40 72 35 63 C30 66 25 64 25 60 Z"/>'],
  ['blob','Mancha','<path transform="translate(8,1) scale(.29)" d="M60 5 C85 5 100 25 95 50 C90 75 70 95 45 92 C20 89 2 70 5 45 C8 20 35 5 60 5 Z"/>'],
  ['nota','Nota','<rect x="8" y="3" width="30" height="24" fill="#fde68a"/>']
];
TIPOS_NODO.forEach(([tipo, nombre, svg]) => {
  const b = document.createElement('button'); b.className = 'nodoBtn'; b.title = nombre;
  b.innerHTML = `<svg viewBox="0 0 46 30" style="fill:#6d6f7b">${svg}</svg>${esc(nombre)}`;
  b.onclick = () => {
    const k = s(), dims = { circulo:[200,200], rombo:[320,200], nota:[280,240] }[tipo] || [320,130];
    restaurando = true;
    const f = nodo(tipo, nombre === 'Círculo' ? 'Texto' : nombre, W/2, H/2, { w:dims[0]*k, h:dims[1]*k, nombre });
    ordenarVinculos(); restaurando = false;
    const t = porId(f.formaTexto);
    canvas.setActiveObject(t); t.enterEditing(); t.selectAll();
    canvas.requestRenderAll(); renderCapas(); guardarEstado();
  };
  $('gridNodos').appendChild(b);
});

const nodoConectable = o => !!o && !esLinea(o) && !['activeSelection','group'].includes(o.type) && !o.esFondo && !o.textoDe && !o.esDeco && !o.tabla;
// Copia una forma (con su estilo) en x, y y le pone texto nuevo
function clonarNodo(p, x, y, cb){
  const tp = porId(p.formaTexto);
  p.clone(n => {
    n.set({ id: nuevoId(), formaTexto: null, textoDe: null, angle: 0, name: p.name || 'Nodo' });
    n.setPositionByOrigin(new fabric.Point(x, y), 'center', 'center'); n.setCoords();
    canvas.add(n);
    let t = null;
    if (puedeTenerTexto(n)){
      t = crearTextoVinculado(n, 'Nueva idea', tp ? { fontSize:tp.fontSize, fill:tp.fill, fontWeight:tp.fontWeight, fontFamily:tp.fontFamily, fontStyle:tp.fontStyle } : {});
      canvas.add(t); ajustarFormaATexto(t);
    }
    cb(n, t);
  }, EXTRA);
}
function crearNodoConectado(p, x, y, opc = {}){
  if (activo() && activo().isEditing) activo().exitEditing();
  canvas.discardActiveObject();
  p.id = p.id || nuevoId();
  const previo = canvas.getObjects().find(o => o.type === 'conector' && o.conB === p.id)
              || canvas.getObjects().find(o => o.type === 'conector' && o.conA === p.id);
  restaurando = true;
  clonarNodo(p, x, y, (n, t) => {
    unir(p, n, { ...heredarConector(previo), ...opc });
    ordenarVinculos();
    restaurando = false;
    if (t){ canvas.setActiveObject(t); t.enterEditing(); t.selectAll(); } else canvas.setActiveObject(n);
    canvas.requestRenderAll(); renderCapas(); guardarEstado(); revisarAuto();
  });
}
// Agrega una idea nueva conectada a la forma seleccionada, en la dirección indicada
function agregarHijo(dir, desde){
  const p = desde || nodoBase(activo());
  if (!nodoConectable(p)){ toast('Selecciona una forma para agregarle ideas conectadas'); return; }
  p.id = p.id || nuevoId();
  const n0 = canvas.getObjects().filter(c => c.type === 'conector' && c.conA === p.id && c.dir === dir).length;
  const pr = cajaAbs(p), c = p.getCenterPoint(), sep = 110 * s(), hueco = 40 * s();
  const k = n0 === 0 ? 0 : (n0 % 2 ? 1 : -1) * Math.ceil(n0 / 2);   // 0, +1, -1, +2, -2…
  let x = c.x, y = c.y;
  if (dir === 'der'){ x += pr.width + sep; y += k * (pr.height + hueco); }
  if (dir === 'izq'){ x -= pr.width + sep; y += k * (pr.height + hueco); }
  if (dir === 'aba'){ y += pr.height + sep; x += k * (pr.width + hueco); }
  if (dir === 'arr'){ y -= pr.height + sep; x += k * (pr.width + hueco); }
  crearNodoConectado(p, x, y, { dir });
}

/* ---------- Conexión arrastrando (círculos +, extremos de líneas y modo conector) ---------- */
const OPUESTO = { der:'izq', izq:'der', arr:'aba', aba:'arr' };
const puntosCon = [...document.querySelectorAll('.puntoCon')], puntosFin = [...document.querySelectorAll('.puntoFin')];
let transformando = false, arrastreCon = null, modoConector = false, trazo = null;
function ladoPunto(r, l){
  return { arr:{x:r.left+r.width/2, y:r.top}, aba:{x:r.left+r.width/2, y:r.top+r.height},
           izq:{x:r.left, y:r.top+r.height/2}, der:{x:r.left+r.width, y:r.top+r.height/2} }[l];
}
// lado de una forma que mira hacia un punto
function ladoHacia(r, q){
  const cx = r.left + r.width/2, cy = r.top + r.height/2, dx = (q.x - cx) / (r.width || 1), dy = (q.y - cy) / (r.height || 1);
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'der' : 'izq') : (dy > 0 ? 'aba' : 'arr');
}
function puntoLienzo(e){
  const r = canvas.upperCanvasEl.getBoundingClientRect();
  return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom };
}
function objetivoEn(q, excluir){
  return canvas.getObjects().slice().reverse().find(o => {
    if (!o.visible || !nodoConectable(o) || o === excluir) return false;
    const r = cajaAbs(o);
    return q.x >= r.left && q.x <= r.left + r.width && q.y >= r.top && q.y <= r.top + r.height;
  });
}
function extremosConector(c){
  const p = c.calcLinePoints(), m = c.calcTransformMatrix();
  return { a: fabric.util.transformPoint(new fabric.Point(p.x1, p.y1), m), b: fabric.util.transformPoint(new fabric.Point(p.x2, p.y2), m) };
}
function dibujarGuia(inicio, q, objetivo){
  const ctx = canvas.contextTop; canvas.clearContext(ctx);
  ctx.save();
  if (objetivo){
    const r = cajaAbs(objetivo);
    ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 3; ctx.setLineDash([]);
    ctx.strokeRect(r.left*zoom - 4, r.top*zoom - 4, r.width*zoom + 8, r.height*zoom + 8);
  }
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]);
  ctx.beginPath(); ctx.moveTo(inicio.x*zoom, inicio.y*zoom); ctx.lineTo(q.x*zoom, q.y*zoom); ctx.stroke();
  ctx.setLineDash([]); ctx.fillStyle = '#7c3aed';
  ctx.beginPath(); ctx.arc(q.x*zoom, q.y*zoom, 6, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
function limpiarGuia(){ canvas.clearContext(canvas.contextTop); canvas.requestRenderAll(); }
// Termina una conexión: sobre otra forma las une; en el vacío crea una idea nueva conectada
function terminarConexion(origen, lado, q){
  const t = objetivoEn(q, origen);
  const ro = cajaAbs(origen);
  const ladoA = lado || ladoHacia(ro, q);
  if (t){
    const ladoB = ladoHacia(cajaAbs(t), ladoPunto(ro, ladoA));
    restaurando = true; const c = unir(origen, t); restaurando = false;
    canvas.setActiveObject(c); canvas.requestRenderAll(); renderCapas(); guardarEstado();
    return 'unido';
  }
  crearNodoConectado(origen, q.x, q.y, {});
  return 'nuevo';
}
function actualizarPuntos(){
  const o = activo(), n = nodoBase(o);
  const verNodo = !transformando && !arrastreCon && !modoConector && o && !o.isEditing && o.type !== 'activeSelection' && nodoConectable(n) && !n.bloqueado;
  const r = verNodo ? cajaAbs(n) : null, sep = 30 / zoom;
  puntosCon.forEach(el => {
    if (!verNodo){ el.style.display = 'none'; return; }
    const l = el.dataset.l, q = ladoPunto(r, l);
    const dx = l === 'der' ? sep : l === 'izq' ? -sep : 0, dy = l === 'aba' ? sep : l === 'arr' ? -sep : 0;
    el.style.left = (q.x + dx) * zoom + 'px'; el.style.top = (q.y + dy) * zoom + 'px'; el.style.display = 'block';
  });
  const verFin = !transformando && !arrastreCon && o && o.type === 'conector';
  const ex = verFin ? extremosConector(o) : null;
  puntosFin.forEach(el => {
    if (!verFin){ el.style.display = 'none'; return; }
    const q = ex[el.dataset.e];
    el.style.left = q.x * zoom + 'px'; el.style.top = q.y * zoom + 'px'; el.style.display = 'block';
  });
}
canvas.on('after:render', actualizarPuntos);
['object:moving','object:scaling','object:rotating'].forEach(ev => canvas.on(ev, () => { transformando = true; }));
canvas.on('mouse:up', () => { if (transformando){ transformando = false; actualizarPuntos(); } });
// El control de giro va en la esquina para no estorbar a los círculos "+"
Object.assign(fabric.Object.prototype.controls.mtr, { x:0.5, y:-0.5, offsetX:18, offsetY:-18, withConnection:false });

puntosCon.forEach(el => {
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    const n = nodoBase(activo()); if (!n) return;
    if (activo().isEditing) activo().exitEditing();
    el.setPointerCapture(e.pointerId);
    arrastreCon = { origen:n, lado:el.dataset.l, x0:e.clientX, y0:e.clientY, movio:false };
  });
  el.addEventListener('pointermove', e => {
    const a = arrastreCon; if (!a) return;
    if (!a.movio && Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > 6){ a.movio = true; actualizarPuntos(); }
    if (a.movio){ const q = puntoLienzo(e); dibujarGuia(ladoPunto(cajaAbs(a.origen), a.lado), q, objetivoEn(q, a.origen)); }
  });
  const soltar = e => {
    const a = arrastreCon; if (!a) return; arrastreCon = null; limpiarGuia();
    if (!a.movio) agregarHijo(a.lado, a.origen);
    else terminarConexion(a.origen, a.lado, puntoLienzo(e));
  };
  el.addEventListener('pointerup', soltar);
  el.addEventListener('pointercancel', () => { arrastreCon = null; limpiarGuia(); });
});
// Arrastrar el extremo de una línea para conectarla a otra forma
puntosFin.forEach(el => {
  let arr = null;
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); el.setPointerCapture(e.pointerId);
    const c = conSel(); if (!c) return;
    arr = { c, extremo: el.dataset.e }; arrastreCon = arr; actualizarPuntos();
  });
  el.addEventListener('pointermove', e => {
    if (!arr) return;
    const q = puntoLienzo(e), ex = extremosConector(arr.c), fijo = arr.extremo === 'a' ? ex.b : ex.a;
    const otro = porId(arr.extremo === 'a' ? arr.c.conB : arr.c.conA);
    dibujarGuia(fijo, q, objetivoEn(q, otro));
  });
  el.addEventListener('pointerup', e => {
    if (!arr) return;
    const { c, extremo } = arr; arr = null; arrastreCon = null; limpiarGuia();
    const otro = porId(extremo === 'a' ? c.conB : c.conA), t = objetivoEn(puntoLienzo(e), otro);
    if (!t){ toast('Suelta el extremo sobre una forma para conectarlo'); actualizarPuntos(); return; }
    t.id = t.id || nuevoId();
    c.set(extremo === 'a' ? { conA:t.id } : { conB:t.id }); c.set({ ladoA:null, ladoB:null, orient:null, fijo:false });
    actualizarConector(c); canvas.setActiveObject(c); canvas.requestRenderAll(); guardarEstado();
  });
});

// Modo conector: arrastrar de forma a forma directamente en el lienzo
function activarModoConector(v){
  modoConector = v; trazo = null;
  canvas.skipTargetFind = v; canvas.selection = !v;
  $('area').classList.toggle('modoCon', v);
  $('modoAviso').style.display = v ? 'block' : 'none';
  if (!v) document.querySelectorAll('.conBtn').forEach(b => b.classList.remove('on'));
  if (v){ if (activo() && activo().isEditing) activo().exitEditing(); canvas.discardActiveObject(); }
  canvas.requestRenderAll(); actualizarPuntos();
}
canvas.on('mouse:down', e => {
  if (!modoConector) return;
  const q = canvas.getPointer(e.e), o = objetivoEn(q, null);
  trazo = o ? { origen:o } : null;
});
canvas.on('mouse:move', e => {
  if (!modoConector || !trazo) return;
  const q = canvas.getPointer(e.e), r = cajaAbs(trazo.origen);
  dibujarGuia(ladoPunto(r, ladoHacia(r, q)), q, objetivoEn(q, trazo.origen));
});
canvas.on('mouse:up', e => {
  if (!modoConector || !trazo) return;
  const a = trazo; trazo = null; limpiarGuia();
  const q = canvas.getPointer(e.e);
  const r = cajaAbs(a.origen);
  if (q.x >= r.left && q.x <= r.left + r.width && q.y >= r.top && q.y <= r.top + r.height) return;   // fue solo un clic
  if (terminarConexion(a.origen, null, q) === 'nuevo') activarModoConector(false);
});
const PRESETS_CON = [
  { n:'Recta',        c:{ estilo:'recta', inicio:'nada',   fin:'flecha', patron:'solida'  }, svg:'<path d="M5 25 L46 7"/><path d="M38 6 L47 6.5 L42 14" fill="#4b5563"/>' },
  { n:'Curva',        c:{ estilo:'curva', inicio:'nada',   fin:'flecha', patron:'solida'  }, svg:'<path d="M4 25 C26 25 26 7 46 7"/><path d="M40 3 L48 7 L40 11" fill="#4b5563"/>' },
  { n:'Codo',         c:{ estilo:'codo',  inicio:'nada',   fin:'flecha', patron:'solida'  }, svg:'<path d="M4 25 H25 V7 H46"/><path d="M40 3 L48 7 L40 11" fill="#4b5563"/>' },
  { n:'Doble flecha', c:{ estilo:'recta', inicio:'flecha', fin:'flecha', patron:'solida'  }, svg:'<path d="M8 15 H44"/><path d="M12 10 L4 15 L12 20" fill="#4b5563"/><path d="M40 10 L48 15 L40 20" fill="#4b5563"/>' },
  { n:'Sin flecha',   c:{ estilo:'curva', inicio:'nada',   fin:'nada',   patron:'solida'  }, svg:'<path d="M4 25 C26 25 26 5 48 5"/>' },
  { n:'Punteada',     c:{ estilo:'recta', inicio:'nada',   fin:'flecha', patron:'guiones' }, svg:'<path d="M5 15 H42" stroke-dasharray="5 4"/><path d="M40 10 L48 15 L40 20" fill="#4b5563"/>' },
  { n:'Relación',     c:{ estilo:'codo',  inicio:'rombo',  fin:'abierta',patron:'solida'  }, svg:'<path d="M12 23 H26 V7 H46"/><path d="M4 23 L8 20 L12 23 L8 26 Z" fill="#4b5563"/><path d="M41 3 L47 7 L41 11"/>' },
  { n:'Punto a punto',c:{ estilo:'recta', inicio:'circulo',fin:'circulo',patron:'solida'  }, svg:'<path d="M8 15 H44"/><circle cx="7" cy="15" r="3.5" fill="#4b5563"/><circle cx="45" cy="15" r="3.5" fill="#4b5563"/>' },
  { n:'Puntos',       c:{ estilo:'curva', inicio:'nada',   fin:'flecha', patron:'puntos'  }, svg:'<path d="M4 25 C26 25 26 7 44 7" stroke-dasharray="0.5 5"/><path d="M40 3 L48 7 L40 11" fill="#4b5563"/>' }
];
PRESETS_CON.forEach(pr => {
  const b = document.createElement('button'); b.className = 'conBtn'; b.title = pr.n;
  b.innerHTML = `<svg viewBox="0 0 52 30">${pr.svg}</svg>${esc(pr.n)}`;
  b.onclick = () => {
    Object.assign(conectorDef, pr.c);
    if (candidatosConexion().length === 2){ conectar(); return; }
    const c = conSel();
    if (c){ cambiarConector({ ...pr.c, strokeDashArray:null, orient:null, ladoA:null, ladoB:null, fijo:false }); return; }
    activarModoConector(true);
    document.querySelectorAll('.conBtn').forEach(x => x.classList.toggle('on', x === b));
  };
  $('gridConectores').appendChild(b);
});

/* ---------- Cambiar el tipo de forma sin perder texto ni conexiones ---------- */
(function(){
  const sel = $('pTipoForma');
  sel.innerHTML = '<option value="">—</option>' + TIPOS_NODO.map(([t, n]) => `<option value="${t}">${esc(n)}</option>`).join('');
  sel.onchange = e => { if (e.target.value) cambiarTipoForma(e.target.value); };
})();
function cambiarTipoForma(tipo){
  const f = nodoBase(activo()); if (!puedeTenerTexto(f)) return;
  const w = f.getScaledWidth(), hh = f.getScaledHeight(), lado = Math.max(w, hh);
  const n = crearForma(tipo, { w: tipo === 'circulo' ? lado : w, h: tipo === 'circulo' ? lado : hh,
    fill: f.fill, stroke: f.stroke, grosor: f.strokeWidth });
  n.set({ id:f.id, formaTexto:f.formaTexto, name:f.name, opacity:f.opacity, shadow:f.shadow, angle:f.angle,
    anchoBase: tipo === 'circulo' ? lado : f.anchoBase, altoBase: tipo === 'circulo' ? lado : f.altoBase, anchoMax: null, bloqueado: f.bloqueado });
  n.setPositionByOrigin(f.getCenterPoint(), 'center', 'center'); n.setCoords();
  const idx = canvas.getObjects().indexOf(f);
  restaurando = true; canvas.remove(f); canvas.insertAt(n, idx); restaurando = false;
  const t = porId(n.formaTexto); if (t){ t.set('width', anchoTexto(n)); ajustarFormaATexto(t); }
  actualizarConexiones(n);
  canvas.setActiveObject(n); canvas.requestRenderAll(); renderCapas(); guardarEstado();
}

/* ---------- Organizar automáticamente (árbol horizontal, vertical o mapa mental) ---------- */
// Centra el contenido en el lienzo; si no cabe, agranda el lienzo
function encuadrarContenido(){
  const b = limitesContenido(); if (!b) return;
  const m = 60 * s(), bw = b.x2 - b.x1, bh = b.y2 - b.y1;
  const nw = Math.min(8000, Math.max(W, Math.ceil(bw + 2*m))), nh = Math.min(8000, Math.max(H, Math.ceil(bh + 2*m)));
  if (nw !== W || nh !== H) cambiarTamano(nw, nh);
  moverTodo(W/2 - (b.x1 + bw/2), H/2 - (b.y1 + bh/2));
}
function grafoConexiones(){
  const hijos = {}, padres = {};
  canvas.getObjects().forEach(c => {
    if (c.type !== 'conector' || !porId(c.conA) || !porId(c.conB)) return;
    (hijos[c.conA] = hijos[c.conA] || []).push(c.conB);
    (padres[c.conB] = padres[c.conB] || []).push(c.conA);
  });
  return { hijos, padres };
}
function moverNodoA(n, x, y){
  n.setPositionByOrigin(new fabric.Point(x, y), 'center', 'center'); n.setCoords();
  const t = porId(n.formaTexto); if (t) centrarTexto(t, n);
}
function organizar(modo){
  if (activo() && activo().isEditing) activo().exitEditing();
  const { hijos, padres } = grafoConexiones();
  const nodos = canvas.getObjects().filter(o => nodoConectable(o) && o.visible && (hijos[o.id] || padres[o.id]));
  if (nodos.length < 2){ toast('Conecta algunas formas primero'); return; }
  const elegido = nodoBase(activo());
  canvas.discardActiveObject();
  let raices = elegido && nodos.includes(elegido) ? [elegido] : nodos.filter(n => !padres[n.id]);
  if (!raices.length) raices = [nodos[0]];
  if (modo === 'mental') raices = [raices[0]];
  const visto = new Set();
  const construir = n => {
    visto.add(n.id);
    const t = { n, hijos: [] };
    (hijos[n.id] || []).forEach(id => { const x = porId(id); if (x && nodos.includes(x) && !visto.has(id)){ visto.add(id); t.hijos.push(id); } });
    t.hijos = t.hijos.map(id => construir(porId(id)));
    return t;
  };
  const eje = modo === 'v' ? 'v' : 'h';
  const sepPrin = 130 * s(), sepSec = 40 * s();
  const medir = t => {
    const r = cajaAbs(t.n);
    t.prin = eje === 'h' ? r.width : r.height; t.sec = eje === 'h' ? r.height : r.width;
    t.hijos.forEach(medir);
    const suma = t.hijos.reduce((a, x) => a + x.ext, 0) + Math.max(0, t.hijos.length - 1) * sepSec;
    t.ext = Math.max(t.sec, suma);
  };
  // coloca un bosque de árboles; prof 0 empieza a "inicio" (distancia desde el origen) con signo +/-
  const colocarBosque = (lista, inicio, signo, centroSec) => {
    const anchos = [];
    const niveles = (t, d) => { anchos[d] = Math.max(anchos[d] || 0, t.prin); t.hijos.forEach(x => niveles(x, d + 1)); };
    lista.forEach(t => niveles(t, 0));
    const dist = []; let acc = inicio;
    anchos.forEach((a, d) => { dist[d] = acc + a/2; acc += a + sepPrin; });
    const total = lista.reduce((a, t) => a + t.ext, 0) + Math.max(0, lista.length - 1) * sepSec;
    const poner = (t, d, desde) => {
      const prin = signo * dist[d], sec = desde + t.ext/2;
      eje === 'h' ? moverNodoA(t.n, prin, sec) : moverNodoA(t.n, sec, prin);
      const sumaH = t.hijos.reduce((a, x) => a + x.ext, 0) + Math.max(0, t.hijos.length - 1) * sepSec;
      let cur = desde + (t.ext - sumaH) / 2;
      t.hijos.forEach(x => { poner(x, d + 1, cur); cur += x.ext + sepSec; });
    };
    let cur = centroSec - total/2;
    lista.forEach(t => { poner(t, 0, cur); cur += t.ext + sepSec; });
  };
  const arboles = raices.filter(r => !visto.has(r.id)).map(construir);
  arboles.forEach(medir);
  if (modo === 'mental'){
    const raiz = arboles[0];
    moverNodoA(raiz.n, 0, 0);
    const der = raiz.hijos.filter((_, i) => i % 2 === 0), izq = raiz.hijos.filter((_, i) => i % 2 === 1);
    colocarBosque(der, raiz.prin/2 + sepPrin, 1, 0);
    colocarBosque(izq, raiz.prin/2 + sepPrin, -1, 0);
  } else colocarBosque(arboles, 0, 1, 0);
  actualizarTodasConexiones();
  encuadrarContenido();
  canvas.requestRenderAll(); guardarEstado();
  toast('Diagrama organizado');
}

/* ---------- Paletas de color para todo el diagrama ---------- */
const PALETAS = [
  ['Vibrante',  ['#7c3aed','#f97316','#06b6d4','#10b981','#ec4899','#eab308'], '#334155'],
  ['Escolar',   ['#1e3a8a','#2563eb','#0891b2','#0d9488','#4f46e5','#0284c7'], '#1e293b'],
  ['Pastel',    ['#c4b5fd','#fdba74','#a5f3fc','#a7f3d0','#fbcfe8','#fde68a'], '#64748b'],
  ['Elegante',  ['#0f172a','#7f1d1d','#334155','#78350f','#1e3a8a','#365314'], '#0f172a'],
  ['Natural',   ['#166534','#65a30d','#ca8a04','#9a3412','#0f766e','#4d7c0f'], '#3f3f46']
];
PALETAS.forEach(([nombre, cols, linea]) => {
  const b = document.createElement('button'); b.className = 'bigbtn'; b.style.cssText = 'display:flex;align-items:center;gap:8px;margin:0;padding:7px 10px';
  b.innerHTML = cols.map(c => `<span style="width:16px;height:16px;border-radius:4px;background:${c}"></span>`).join('') + `<span style="margin-left:4px">${esc(nombre)}</span>`;
  b.onclick = () => aplicarPaleta(cols, linea);
  $('paletasDiagrama').appendChild(b);
});
// Colorea por ramas: la idea principal con el primer color y cada rama con su propio color
function aplicarPaleta(cols, linea){
  const { hijos, padres } = grafoConexiones();
  const nodos = canvas.getObjects().filter(o => nodoConectable(o) && (hijos[o.id] || padres[o.id]));
  if (!nodos.length){ toast('Conecta algunas formas primero'); return; }
  const colorDe = {}, raices = nodos.filter(n => !padres[n.id]);
  (raices.length ? raices : [nodos[0]]).forEach(r => {
    colorDe[r.id] = cols[0];
    (hijos[r.id] || []).forEach((id, i) => {
      const c = cols[1 + (i % (cols.length - 1))];
      const pila = [id];
      while (pila.length){ const x = pila.pop(); if (colorDe[x]) continue; colorDe[x] = c; (hijos[x] || []).forEach(y => pila.push(y)); }
    });
  });
  nodos.forEach(n => {
    const c = colorDe[n.id] || cols[0];
    n.set('fill', c); if (n.stroke) n.set('stroke', c);
    const t = porId(n.formaTexto); if (t) t.set('fill', esOscuro(c) ? '#ffffff' : '#1f2330');
  });
  canvas.getObjects().filter(o => o.type === 'conector').forEach(c => {
    const destino = colorDe[c.conB];
    c.set('stroke', destino && (c.fin || (c.flecha ? 'flecha' : 'nada')) === 'nada' ? destino : linea);
  });
  canvas.requestRenderAll(); guardarEstado();
}
// Zoom con Ctrl + rueda del mouse (o pellizco en el touchpad)
$('area').addEventListener('wheel', e => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  establecerZoom(zoom * (e.deltaY < 0 ? 1.1 : 1/1.1));
}, { passive:false });

/* =========================================================
   TABLAS
   ========================================================= */
function celdasDe(id){ return canvas.getObjects().filter(o => o.tabla === id); }
// Acomoda las celdas en filas y columnas; cada fila toma la altura de su celda con más texto
function reorganizarTabla(id){
  const cs = celdasDe(id); if (!cs.length || cs.some(c => c.group)) return;
  const pad = PAD() * 0.55, sep = cs[0].sepTabla || 0;
  const x0 = Math.min(...cs.map(c => c.getCenterPoint().x - c.width * c.scaleX / 2));
  const y0 = Math.min(...cs.map(c => c.getCenterPoint().y - c.height * c.scaleY / 2));
  const anchos = [], altos = [];
  cs.forEach(c => { anchos[c.col] = Math.max(anchos[c.col] || 0, c.anchoBase || c.width); });
  cs.forEach(c => {
    let nec = c.altoBase || 60; const t = porId(c.formaTexto);
    if (t){ t.set('width', Math.max(30, anchos[c.col] - 2 * pad)); t.initDimensions(); nec = Math.max(nec, t.height * t.scaleY + 2 * pad); }
    altos[c.fila] = Math.max(altos[c.fila] || 0, nec);
  });
  const xs = [], ys = []; let acc = x0;
  for (let i = 0; i < anchos.length; i++){ xs[i] = acc; acc += (anchos[i] || 0) + sep; }
  acc = y0;
  for (let i = 0; i < altos.length; i++){ ys[i] = acc; acc += (altos[i] || 0) + sep; }
  cs.forEach(c => {
    c.set({ width: anchos[c.col] / c.scaleX, height: altos[c.fila] / c.scaleY });
    c.setPositionByOrigin(new fabric.Point(xs[c.col] + anchos[c.col] / 2, ys[c.fila] + altos[c.fila] / 2), 'center', 'center');
    c.setCoords();
    const t = porId(c.formaTexto); if (t) centrarTexto(t, c);
  });
}
function crearTabla(cx, cy, filas, cols, est, textos = []){
  const id = nuevoId(), sep = est.sep || 0;
  const total = est.ancho || cols * 300;
  const anchos = est.anchos ? est.anchos.slice() : Array(cols).fill((total - (cols - 1) * sep) / cols);
  while (anchos.length < cols) anchos.push(anchos[anchos.length - 1]);
  const alto = est.alto || 80, altoEnc = est.altoEnc || alto;
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++){
    const enc = f === 0 && est.enc != null, col1 = c === 0 && f > 0;
    let fill = est.celda || '#ffffff';
    if (enc) fill = Array.isArray(est.enc) ? est.enc[c % est.enc.length] : est.enc;
    else if (col1 && (est.filasColores || est.col1)) fill = est.filasColores ? est.filasColores[(f - 1) % est.filasColores.length] : est.col1;
    else if (f > 0 && est.celdasFila) fill = est.celdasFila[(f - 1) % est.celdasFila.length];
    const cel = new fabric.Rect({ originX:'center', originY:'center', left:cx, top:cy, width:anchos[c], height: f === 0 ? altoEnc : alto,
      rx: est.rx || 0, ry: est.rx || 0, fill, stroke: est.borde || null, strokeWidth: est.borde ? (est.grosor || 2) : 0, strokeUniform:true,
      tabla:id, fila:f, col:c, sepTabla:sep, anchoBase:anchos[c], altoBase: f === 0 ? altoEnc : alto, id:nuevoId(), name:'Celda' });
    canvas.add(cel);
    const def = enc ? 'Título ' + (c + 1) : (col1 ? 'Fila ' + f : '');
    const txt = textos[f] && textos[f][c] != null ? textos[f][c] : def;
    const t = crearTextoVinculado(cel, txt, {
      fontSize: enc ? (est.tamEnc || 28) : (est.tam || 24),
      fontFamily: enc ? (est.fuenteEnc || est.fuente || 'Poppins') : (est.fuente || 'Poppins'),
      fontWeight: (enc || col1) ? '700' : '400',
      fill: enc && est.encTexto ? est.encTexto : (esOscuro(fill) ? '#ffffff' : '#1f2330') });
    canvas.add(t);
  }
  reorganizarTabla(id);
  const cs = celdasDe(id), rs = cs.map(c => cajaAbs(c));
  const L = Math.min(...rs.map(r => r.left)), R = Math.max(...rs.map(r => r.left + r.width));
  const T0 = Math.min(...rs.map(r => r.top)), B = Math.max(...rs.map(r => r.top + r.height));
  const dx = cx - (L + R) / 2, dy = cy - (T0 + B) / 2;
  cs.forEach(c => { c.set({ left: c.left + dx, top: c.top + dy }); c.setCoords(); const t = porId(c.formaTexto); if (t) centrarTexto(t, c); });
  ordenarVinculos();
  return id;
}
function seleccionarTabla(id){
  const objs = celdasDe(id).flatMap(c => [c, porId(c.formaTexto)].filter(Boolean));
  if (!objs.length) return;
  const sel = new fabric.ActiveSelection(objs, { canvas });
  sel.set({ lockScalingX:true, lockScalingY:true, lockRotation:true, hasControls:false });
  sel.esTabla = id;
  canvas.setActiveObject(sel); canvas.requestRenderAll();
}
function editarCelda(c){
  editandoCelda = true;
  canvas.discardActiveObject();
  const t = porId(c.formaTexto); if (!t){ editandoCelda = false; return; }
  canvas.setActiveObject(t); t.enterEditing(); t.selectAll(); canvas.requestRenderAll();
}
canvas.on('text:editing:exited', () => { editandoCelda = false; });
function tablaActual(){
  const a = activo(); if (!a) return null;
  if (a.esTabla) return a.esTabla;
  const f = nodoBase(a.type === 'activeSelection' ? a.getObjects()[0] : a);
  return (f && f.tabla) || null;
}
function editarTabla(fn){
  const id = tablaActual(); if (!id) return;
  canvas.discardActiveObject();
  restaurando = true; fn(id, celdasDe(id)); reorganizarTabla(id); ordenarVinculos(); restaurando = false;
  seleccionarTabla(id); renderCapas(); guardarEstado(); revisarAuto();
}
function quitarCeldas(lista){ lista.forEach(c => { const t = porId(c.formaTexto); if (t) canvas.remove(t); canvas.remove(c); }); }
function copiarCelda(base, cambios){
  const bt = porId(base.formaTexto);
  base.clone(n => {
    n.set({ ...cambios, id: nuevoId(), formaTexto: null });
    canvas.add(n);
    canvas.add(crearTextoVinculado(n, '', bt ? { fontSize:bt.fontSize, fontFamily:bt.fontFamily, fontWeight:bt.fontWeight, fill:bt.fill } : {}));
  }, EXTRA);
}
function tablaFila(d){
  editarTabla((id, cs) => {
    const n = Math.max(...cs.map(c => c.fila)) + 1;
    if (d > 0) cs.filter(c => c.fila === n - 1).forEach(b => copiarCelda(b, { fila: n }));
    else if (n > 1) quitarCeldas(cs.filter(c => c.fila === n - 1));
  });
}
function tablaCol(d){
  editarTabla((id, cs) => {
    const n = Math.max(...cs.map(c => c.col)) + 1;
    if (d > 0) cs.filter(c => c.col === n - 1).forEach(b => copiarCelda(b, { col: n }));
    else if (n > 1) quitarCeldas(cs.filter(c => c.col === n - 1));
  });
}
function tablaAncho(f){ editarTabla((id, cs) => cs.forEach(c => { c.anchoBase = (c.anchoBase || c.width) * f; })); }
function colorTabla(cual, color){
  const id = tablaActual(); if (!id) return;
  celdasDe(id).forEach(c => {
    const ok = cual === 'enc' ? c.fila === 0 : cual === 'col1' ? (c.col === 0 && c.fila > 0) : (c.fila > 0 && c.col > 0);
    if (!ok) return;
    c.set('fill', color);
    const t = porId(c.formaTexto); if (t) t.set('fill', esOscuro(color) ? '#ffffff' : '#1f2330');
  });
  const a = activo(); if (a) a.dirty = true;
  canvas.requestRenderAll();
}
[['tColEnc','enc'],['tColCol1','col1'],['tColCeldas','celdas']].forEach(([id, cual]) => {
  $(id).addEventListener('input', e => colorTabla(cual, e.target.value));
  $(id).addEventListener('change', guardarEstado);
});
const ESTILOS_TABLA = {
  'Clásica':  { sep:0,  rx:0,  borde:'#334155', grosor:2, enc:'#1e3a8a', encTexto:'#ffffff', col1:'#e0e7ff', celda:'#ffffff', fuente:'Inter' },
  'Tarjetas': { sep:10, rx:14, enc:'#7c3aed', encTexto:'#ffffff', col1:'#ede9fe', celda:'#f5f3ff', fuente:'Poppins' },
  'Pastel a mano': { sep:10, rx:10, borde:'#1f2330', grosor:2.5, enc:['#c4b5fd','#fbcfe8','#bbf7d0','#fde68a','#a5f3fc'], encTexto:'#1f2330', col1:'#fef3c7', celda:'#ffffff', fuente:'Patrick Hand', fuenteEnc:'Fredoka' },
  'Por categorías': { sep:8, rx:12, enc:'#f3f4f6', encTexto:'#1f2330', filasColores:['#fbcfe8','#bbf7d0','#bfdbfe','#ddd6fe','#fde68a'], celdasFila:['#fdf2f8','#f0fdf4','#eff6ff','#f5f3ff','#fefce8'], fuente:'Poppins', fuenteEnc:'Fredoka' }
};
Object.entries(ESTILOS_TABLA).forEach(([nombre, est]) => {
  const b = document.createElement('button'); b.className = 'bigbtn'; b.style.margin = '0';
  const muestra = [0,1,2].map(i => {
    const enc = Array.isArray(est.enc) ? est.enc[i] : est.enc;
    return `<span style="display:inline-block;width:22px;height:10px;margin-right:2px;border-radius:${est.rx ? 3 : 0}px;background:${enc};border:1px solid ${est.borde || 'transparent'}"></span>`;
  }).join('');
  b.innerHTML = `${muestra}<span style="margin-left:6px">${esc(nombre)}</span>`;
  b.onclick = () => insertarTabla(est);
  $('estilosTabla').appendChild(b);
});
function insertarTabla(est){
  const f = Math.max(1, Math.min(20, +$('tFilas').value || 4)), c = Math.max(1, Math.min(10, +$('tCols').value || 3)), k = s();
  restaurando = true;
  const id = crearTabla(W/2, H/2, f, c, { ...est, ancho: Math.min(W * 0.85, c * 300 * k), alto: 80 * k, tam: 24 * k, tamEnc: 28 * k,
    sep: (est.sep || 0) * k, rx: (est.rx || 0) * k, grosor: (est.grosor || 2) * k });
  restaurando = false;
  seleccionarTabla(id); renderCapas(); guardarEstado(); revisarAuto();
}

/* =========================================================
   DECORACIONES (estilo dibujado a mano)
   ========================================================= */
function pathLlave(alto, ancho){
  const a = ancho, hh = alto;
  return `M ${a} 0 C ${a*0.45} 0 ${a*0.5} ${hh*0.04} ${a*0.5} ${hh*0.12} L ${a*0.5} ${hh*0.4} C ${a*0.5} ${hh*0.47} ${a*0.3} ${hh*0.5} 0 ${hh*0.5} ` +
         `C ${a*0.3} ${hh*0.5} ${a*0.5} ${hh*0.53} ${a*0.5} ${hh*0.6} L ${a*0.5} ${hh*0.88} C ${a*0.5} ${hh*0.96} ${a*0.45} ${hh} ${a} ${hh}`;
}
const pathFlor = (() => {
  const circ = (x, y, r) => `M ${x - r} ${y} A ${r} ${r} 0 1 0 ${x + r} ${y} A ${r} ${r} 0 1 0 ${x - r} ${y} Z `;
  return [[50,22],[78,42],[67,75],[33,75],[22,42]].map(([x, y]) => circ(x, y, 17)).join('') + circ(50, 52, 12);
})();
const pathEstrella5 = 'M ' + puntosEstrella(5, 50, 21).map(q => `${(q.x + 50).toFixed(1)} ${(q.y + 50).toFixed(1)}`).join(' L ') + ' Z';
const DECOS = {
  destello:  { n:'Destello', d:'M50 0 C53 35 65 47 100 50 C65 53 53 65 50 100 C47 65 35 53 0 50 C35 47 47 35 50 0 Z' },
  estrella:  { n:'Estrella', d:pathEstrella5 },
  corazon:   { n:'Corazón', d:'M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 47 14 50 22 C53 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z' },
  flor:      { n:'Flor', d:pathFlor },
  nube:      { n:'Nube', d:PATH_NUBE },
  mancha:    { n:'Mancha', d:PATH_BLOB },
  foco:      { n:'Foco', d:'M12 2 C8.1 2 5 5.1 5 9 C5 11.4 6.2 13.5 8 14.7 L8 17 L16 17 L16 14.7 C17.8 13.5 19 11.4 19 9 C19 5.1 15.9 2 12 2 Z M9 18 L15 18 L15 20 L9 20 Z M10 21 L14 21 L14 22 L10 22 Z' },
  confeti:   { n:'Confeti', d:'M10 10 L18 10 L18 18 L10 18 Z M40 5 L46 15 L34 15 Z M65 15 A5 5 0 1 0 75 15 A5 5 0 1 0 65 15 Z M25 40 L35 40 L35 44 L25 44 Z M60 45 L68 49 L60 53 Z M85 35 L89 31 L93 35 L89 39 Z' },
  flecha:    { n:'Flecha dibujada', trazo:true, d:'M5 60 C30 15 70 10 92 42 M80 40 L92 42 L90 29' },
  rizo:      { n:'Flecha con rizo', trazo:true, d:'M5 70 C25 70 40 55 35 40 C30 25 10 35 20 48 C30 60 60 60 75 35 M66 35 L76 33 L78 43' },
  subrayado: { n:'Subrayado', trazo:true, d:'M0 10 Q10 0 20 10 T40 10 T60 10 T80 10 T100 10' },
  marcador:  { n:'Círculo de marcador', trazo:true, d:'M50 8 C80 6 98 22 96 42 C94 62 70 72 45 70 C18 68 2 52 6 34 C9 18 30 6 58 10' },
  llave:     { n:'Llave', trazo:true, d:pathLlave(100, 30) },
  enfasis:   { n:'Énfasis', trazo:true, d:'M10 30 L2 16 M22 24 L19 4 M34 28 L42 12' },
  espiral:   { n:'Espiral', trazo:true, d:'M50 50 C50 44 58 44 58 50 C58 60 42 60 42 50 C42 36 66 36 66 50 C66 68 34 68 34 50 C34 28 74 28 74 50' },
  cinta:     { n:'Cinta adhesiva', rect:true }
};
function crearDeco(tipo, o = {}){
  const def = DECOS[tipo], color = o.c || $('colorDeco').value, w = o.w || 200 * s();
  let obj;
  if (def.rect) obj = new fabric.Rect({ width:w, height:w * 0.27, fill:color, opacity: o.op ?? 0.6, angle: o.ang ?? -6, originX:'center', originY:'center' });
  else {
    obj = new fabric.Path(def.d, { originX:'center', originY:'center', fill: def.trazo ? null : color, stroke: def.trazo ? color : null,
      strokeWidth: def.trazo ? (o.sw || 5 * s()) : 0, strokeLineCap:'round', strokeLineJoin:'round', strokeUniform:true,
      opacity: o.op ?? 1, angle: o.ang || 0 });
    obj.scaleToWidth(w);
  }
  obj.set({ name: def.n, esDeco: true });
  return obj;
}
Object.entries(DECOS).forEach(([tipo, def]) => {
  const b = document.createElement('button'); b.className = 'forma'; b.title = def.n;
  let svg;
  if (def.rect) svg = '<svg viewBox="0 0 100 100"><rect x="8" y="36" width="84" height="26" transform="rotate(-8 50 50)" style="fill:#f9a8d4;opacity:.8"/></svg>';
  else {
    const tmp = new fabric.Path(def.d);
    const vb = `${(tmp.pathOffset.x - tmp.width/2 - 8).toFixed(1)} ${(tmp.pathOffset.y - tmp.height/2 - 8).toFixed(1)} ${(tmp.width + 16).toFixed(1)} ${(tmp.height + 16).toFixed(1)}`;
    const est = def.trazo ? `fill:none;stroke:#6d6f7b;stroke-width:${Math.max(tmp.width, tmp.height) / 18};stroke-linecap:round;stroke-linejoin:round` : 'fill:#6d6f7b';
    svg = `<svg viewBox="${vb}"><path d="${def.d}" style="${est}"/></svg>`;
  }
  b.innerHTML = svg;
  b.onclick = () => { const d = crearDeco(tipo); d.setPositionByOrigin(new fabric.Point(W/2, H/2), 'center', 'center'); agregar(d, def.n); };
  $('gridDecos').appendChild(b);
});

/* ---------- Fondos de papel ---------- */
function fondoPapel(tipo, base){
  base = base || $('colorFondo').value || '#ffffff';
  const k = s(), t = Math.max(12, Math.round(40 * k));
  const cv = document.createElement('canvas'); cv.width = cv.height = t;
  const g = cv.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, t, t);
  g.strokeStyle = esOscuro(base) ? 'rgba(255,255,255,.18)' : 'rgba(30,58,138,.15)'; g.lineWidth = Math.max(1, k);
  if (tipo === 'cuadros'){ g.beginPath(); g.moveTo(0, 0.5); g.lineTo(t, 0.5); g.moveTo(0.5, 0); g.lineTo(0.5, t); g.stroke(); }
  if (tipo === 'rayas'){ g.beginPath(); g.moveTo(0, t - 0.5); g.lineTo(t, t - 0.5); g.stroke(); }
  if (tipo === 'puntos'){ g.fillStyle = esOscuro(base) ? 'rgba(255,255,255,.3)' : 'rgba(30,41,59,.25)'; g.beginPath(); g.arc(t/2, t/2, Math.max(1.5, 2.2 * k), 0, Math.PI * 2); g.fill(); }
  const antes = restaurando;
  restaurando = true; quitarRectFondo();
  canvas.backgroundColor = base;
  fijarFondo(new fabric.Rect({ left:0, top:0, width:W, height:H, fill: new fabric.Pattern({ source: cv, repeat: 'repeat' }) }));
  restaurando = antes;
  if (!antes){ guardarEstado(); renderCapas(); }
}

/* =========================================================
   ORGANIZADORES ESCOLARES (plantillas)
   ========================================================= */
// utilidades para armar plantillas
function T(texto, x, y, o = {}){
  const t = new fabric.Textbox(texto, { left:x, top:y, originX:'center', originY:'center', width:o.w || 600,
    fontFamily:o.f || 'Poppins', fontSize:o.s || 32, fontWeight:o.b || '400', fill:o.c || '#1f2330', textAlign:o.al || 'center',
    lineHeight:o.lh || 1.2, charSpacing:o.cs || 0, angle:o.ang || 0, fontStyle:o.it ? 'italic' : 'normal' });
  t.id = nuevoId(); t.name = 'Texto'; canvas.add(t); return t;
}
function DECO(tipo, x, y, w, o = {}){
  const d = crearDeco(tipo, { ...o, w }); d.setPositionByOrigin(new fabric.Point(x, y), 'center', 'center'); d.setCoords();
  d.id = nuevoId(); canvas.add(d); return d;
}
function LLAVE(x, y, alto, ancho, color, grosor){
  const p = new fabric.Path(pathLlave(alto, ancho), { left:x, top:y, fill:null, stroke:color, strokeWidth:grosor,
    strokeLineCap:'round', strokeLineJoin:'round', strokeUniform:true, esDeco:true, name:'Llave', id:nuevoId() });
  canvas.add(p); return p;
}
function FONDO(c){ canvas.backgroundColor = c; }
function DEGRADADO(a, b){ fijarFondo(new fabric.Rect({ left:0, top:0, width:W, height:H, fill: crearDegradado(a, b) })); }

const ORGANIZADORES = [
  { nombre:'Análisis FODA', tam:[1920,1080], prev:'linear-gradient(135deg,#fdf4ff,#ddd6fe)', txt:'FODA', f:'Fredoka', c:'#6b21a8', crear(){
    DEGRADADO('#fdf4ff', '#ede9fe');
    T('ANÁLISIS FODA', 960, 105, { f:'Fredoka', s:96, b:'700', c:'#3b0764', w:1400, cs:60 });
    DECO('subrayado', 960, 172, 440, { c:'#c026d3', sw:6 });
    [['F','#a855f7',820,440],['O','#ec4899',1100,440],['D','#c026d3',820,720],['A','#f472b6',1100,720]].forEach(([l, c, x, y]) => {
      const n = nodo('circulo', l, x, y, { w:300, h:300, fill:c, color:'#ffffff', tam:130, peso:'700', fuente:'Fredoka' });
      n.set('opacity', 0.9);
    });
    [['FORTALEZAS','¿Qué hacemos bien?\n¿Qué recursos y habilidades nos distinguen?',360,360,'left'],
     ['OPORTUNIDADES','¿Qué tendencias o apoyos externos podemos aprovechar?',1560,360,'right'],
     ['DEBILIDADES','¿Qué podemos mejorar?\n¿Qué nos hace falta?',360,790,'left'],
     ['AMENAZAS','¿Qué obstáculos externos enfrentamos?\n¿Qué riesgos hay en el entorno?',1560,790,'right']].forEach(([tit, txt, x, y, al]) => {
      T(tit, x, y - 70, { f:'Montserrat', s:34, b:'800', c:'#6b21a8', w:480, al, cs:150 });
      T(txt, x, y + 40, { f:'Poppins', s:26, c:'#374151', w:480, al, lh:1.35 });
    });
    DECO('destello', 1730, 150, 90, { c:'#ffffff' }); DECO('destello', 1650, 230, 45, { c:'#c084fc' });
    DECO('destello', 230, 960, 70, { c:'#c084fc' }); DECO('estrella', 1700, 960, 56, { c:'#7c3aed' });
    DECO('confeti', 230, 140, 120, { c:'#f472b6' });
  }},
  { nombre:'Ciclo de 4 pasos', tam:[1920,1080], prev:'#f0fdfa', txt:'Ciclo ↻', f:'Caveat', c:'#0f766e', crear(){
    FONDO('#f0fdfa'); fondoPapel('puntos', '#f0fdfa');
    T('Ciclo de', 960, 450, { f:'Caveat', s:72, c:'#0f766e', w:400 });
    T('aprendizaje', 960, 545, { f:'Fredoka', s:80, b:'700', c:'#0d9488', w:540 });
    DECO('subrayado', 960, 615, 380, { c:'#5eead4', sw:7 });
    const datos = [
      ['Planea\nDefine tu meta y organiza tus tiempos.', 960, 175, '#ccfbf1', '1'],
      ['Investiga\nBusca fuentes confiables y toma notas.', 1530, 540, '#e0e7ff', '2'],
      ['Practica\nAplica lo aprendido con ejercicios.', 960, 905, '#fce7f3', '3'],
      ['Evalúa\nRevisa qué funcionó y qué mejorar.', 390, 540, '#fef9c3', '4']];
    const n = datos.map(([txt, x, y, col, num]) => {
      const f = nodo('redondo', txt, x, y, { anchoMax:420, w:500, h:160, fill:col, color:'#134e4a', tam:30, fuente:'Poppins' });
      T(num, x > 960 ? x + 310 : x - 310, y, { f:'Amatic SC', s:130, b:'700', c:'#0f766e', w:90 });
      return f;
    });
    const op = { estilo:'curva', fin:'flecha', color:'#5eead4', ancho:7 };
    unir(n[0], n[1], { ...op, lados:['der','arr'] }); unir(n[1], n[2], { ...op, lados:['aba','der'] });
    unir(n[2], n[3], { ...op, lados:['izq','aba'] }); unir(n[3], n[0], { ...op, lados:['arr','izq'] });
    DECO('destello', 1700, 160, 70, { c:'#2dd4bf' }); DECO('destello', 220, 930, 60, { c:'#a78bfa' });
  }},
  { nombre:'Tabla comparativa', tam:[1920,1080], prev:'#fefce8', txt:'Tabla comparativa', f:'Caveat', c:'#1f2330', crear(){
    FONDO('#fefce8'); fondoPapel('cuadros', '#fefce8');
    T('Tabla comparativa', 960, 110, { f:'Caveat', s:110, b:'700', w:1200 });
    DECO('foco', 520, 105, 80, { c:'#facc15' }); DECO('enfasis', 470, 55, 60, { c:'#1f2330', sw:4 });
    DECO('estrella', 1410, 85, 60, { c:'#facc15' }); DECO('estrella', 1480, 145, 34, { c:'#facc15' });
    crearTabla(960, 600, 5, 4, { ...ESTILOS_TABLA['Pastel a mano'], anchos:[300,430,430,430], alto:120, tam:28, tamEnc:34 },
      [['Aspecto','Opción A','Opción B','Opción C'], ['Definición'], ['Características'], ['Ventajas'], ['Desventajas']]);
    DECO('destello', 150, 980, 60, { c:'#a3e635' }); DECO('flecha', 1790, 960, 120, { c:'#1f2330', sw:4, ang:-20 });
  }},
  { nombre:'Cuadro sinóptico', tam:[1920,1080], prev:'#fffbeb', txt:'{ Sinóptico', f:'Playfair Display', c:'#92400e', crear(){
    FONDO('#fffbeb'); fondoPapel('rayas', '#fffbeb');
    T('Cuadro sinóptico', 230, 120, { f:'Caveat', s:58, c:'#92400e', w:380 });
    T('Tema\nprincipal', 230, 540, { f:'Playfair Display', s:66, b:'700', c:'#78350f', w:360 });
    LLAVE(420, 130, 820, 60, '#92400e', 6);
    [220, 420, 640, 860].forEach((y, i) => {
      T('Subtema ' + (i + 1), 615, y, { f:'Fredoka', s:40, b:'600', c:'#b45309', w:300 });
      LLAVE(790, y - 75, 150, 34, '#d97706', 4);
      T('• Idea o característica importante\n• Ejemplo o dato que lo explique', 1240, y, { f:'Patrick Hand', s:34, al:'left', w:760 });
    });
    DECO('destello', 1760, 110, 70, { c:'#f59e0b' }); DECO('flor', 1790, 980, 90, { c:'#fcd34d' });
  }},
  { nombre:'Mapa conceptual', tam:[1920,1080], prev:'#ffffff', txt:'Mapa conceptual', f:'Gochi Hand', c:'#db2777', crear(){
    FONDO('#ffffff'); fondoPapel('cuadros', '#ffffff');
    DECO('cinta', 960, 105, 640, { c:'#f9a8d4', op:0.55, ang:-2 });
    T('Mapa conceptual', 960, 105, { f:'Gochi Hand', s:80, w:900 });
    const est = { stroke:'#1f2330', grosor:3, color:'#1f2330', fuente:'Fredoka', peso:'600' };
    const main = nodo('redondo', 'Concepto principal', 960, 290, { ...est, w:460, h:110, fill:'#fbcfe8', tam:40 });
    const cols = ['#fde68a', '#bbf7d0', '#bae6fd'], enl = ['se define como', 'incluye', 'permite'];
    [420, 960, 1500].forEach((x, i) => {
      const n2 = nodo('redondo', 'Idea ' + (i + 1), x, 560, { ...est, w:320, h:100, fill:cols[i], tam:34 });
      unir(main, n2, { estilo:'codo', fin:'flecha', color:'#1f2330', ancho:4, etiqueta:enl[i] });
      const n3 = nodo('nota', 'Explica aquí la idea con tus propias palabras.', x, 855, { anchoMax:300, w:380, h:150, fill:'#ffffff', stroke:'#1f2330', grosor:2, color:'#374151', tam:28, fuente:'Patrick Hand' });
      unir(n2, n3, { estilo:'recta', fin:'flecha', color:'#1f2330', ancho:3 });
    });
    DECO('estrella', 1700, 120, 60, { c:'#facc15' }); DECO('destello', 220, 140, 70, { c:'#f472b6' });
    DECO('foco', 1760, 900, 90, { c:'#facc15' }); DECO('enfasis', 1700, 830, 70, { c:'#1f2330', sw:4 });
  }},
  { nombre:'Mapa mental de nubes', tam:[1920,1080], prev:'#ffffff', txt:'MAPA MENTAL', f:'Fredoka', c:'#1f2330', crear(){
    FONDO('#ffffff'); fondoPapel('puntos', '#ffffff');
    const centro = nodo('blob', 'MAPA\nMENTAL', 960, 540, { w:480, h:370, fill:'#fef3c7', color:'#1f2330', tam:96, peso:'700', fuente:'Fredoka' });
    const nombres = ['Idea creativa','Idea genial','Idea práctica','Idea fantástica','Idea técnica','Idea brillante'];
    const cols = ['#ddd6fe','#bbf7d0','#fbcfe8','#bae6fd','#fde68a','#fecaca'];
    [[290,210],[290,540],[290,870],[1630,210],[1630,540],[1630,870]].forEach(([x, y], i) => {
      const n = nodo('nube', nombres[i], x, y, { w:400, h:230, fill:cols[i], color:'#1f2330', tam:36, peso:'700', fuente:'Fredoka' });
      unir(centro, n, { estilo:'curva', fin:'abierta', color:'#1f2330', ancho:4 });
    });
    DECO('destello', 960, 150, 70, { c:'#a78bfa' }); DECO('destello', 960, 940, 60, { c:'#f472b6' });
  }},
  { nombre:'Planeación de proyecto', tam:[1920,1080], prev:'#f5f0e6', txt:'Planeación', f:'Bebas Neue', c:'#1f2330', crear(){
    FONDO('#f5f0e6');
    nodo('redondo', 'Planeación\nde proyecto', 250, 540, { w:330, h:150, fill:'#ffffff', stroke:'#1f2330', grosor:3, color:'#1f2330', tam:46, fuente:'Bebas Neue' });
    LLAVE(450, 150, 780, 50, '#1f2330', 5);
    const etapas = ['Planteamiento','Investigación','Ejecución','Gestión','Seguimiento'];
    const cols = ['#fde68a','#bbf7d0','#c7d2fe','#a5f3fc','#fbcfe8'];
    etapas.forEach((e, i) => {
      const y = 180 + i * 180;
      const a = nodo('pildora', e, 690, y, { w:300, h:90, fill:cols[i], stroke:'#1f2330', grosor:3, color:'#1f2330', tam:36, fuente:'Bebas Neue' });
      const d = nodo('redondo', 'Describe qué harás en esta etapa, quién participa y en qué fecha.', 1320, y, { anchoMax:660, w:760, h:120, fill:'#ffffff', stroke:'#1f2330', grosor:2, color:'#374151', tam:26, fuente:'Poppins' });
      unir(a, d, { estilo:'recta', inicio:'circulo', fin:'flecha', color:'#1f2330', ancho:3 });
    });
  }},
  { nombre:'Portada de proyecto', tam:[1240,1754], prev:'linear-gradient(135deg,#ede9fe,#fdf2f8)', txt:'PROYECTO', f:'Permanent Marker', c:'#7c3aed', crear(){
    FONDO('#fffdf8');
    DECO('mancha', 120, 150, 460, { c:'#c4b5fd', op:0.75 }); DECO('mancha', 1160, 280, 320, { c:'#fde68a', op:0.85 });
    DECO('mancha', 1110, 1620, 520, { c:'#fbcfe8', op:0.8 }); DECO('mancha', 140, 1600, 340, { c:'#a5f3fc', op:0.8 });
    DECO('flor', 1120, 1450, 110, { c:'#f472b6' }); DECO('flor', 230, 1430, 80, { c:'#a78bfa' });
    DECO('destello', 1050, 520, 60, { c:'#7c3aed' }); DECO('destello', 200, 470, 44, { c:'#ec4899' });
    nodo('pildora', 'Fecha de entrega', 620, 560, { w:340, h:70, fill:'#ec4899', color:'#ffffff', tam:28, fuente:'Poppins', peso:'600' });
    T('PORTADA DE', 620, 700, { f:'Fredoka', s:80, b:'600', w:1000, cs:100 });
    T('PROYECTO', 620, 830, { f:'Permanent Marker', s:150, c:'#7c3aed', w:1100 });
    T('Escribe aquí una breve descripción del proyecto o el nombre de la asignatura.', 620, 990, { f:'Poppins', s:30, c:'#6b7280', w:820, lh:1.4 });
    T('Nombre del alumno(a)', 620, 1160, { f:'Caveat', s:60, w:800 });
    DECO('subrayado', 620, 1210, 400, { c:'#ec4899', sw:5 });
    T('Grupo · Docente · Escuela', 620, 1275, { f:'Poppins', s:28, c:'#6b7280', w:800 });
  }},
  { nombre:'Tabla por categorías', tam:[1920,1080], prev:'#ffffff', txt:'Categorías', f:'Fredoka', c:'#7c3aed', crear(){
    FONDO('#ffffff');
    T('Clasificación por categorías', 960, 100, { f:'Fredoka', s:66, b:'700', w:1500 });
    DECO('rizo', 1590, 110, 140, { c:'#a78bfa', sw:5 }); DECO('destello', 330, 95, 60, { c:'#f472b6' });
    crearTabla(960, 600, 6, 4, { ...ESTILOS_TABLA['Por categorías'], anchos:[320,420,420,420], alto:115, tam:26, tamEnc:32 },
      [['Categoría','Características','Elementos','Ejemplo'], ['Categoría 1'], ['Categoría 2'], ['Categoría 3'], ['Categoría 4'], ['Categoría 5']]);
  }}
];
function usarOrganizador(p){
  if (canvas.getObjects().length && !confirm('Esto reemplazará el contenido de esta página. ¿Continuar?')) return;
  fijarTamano(p.tam[0], p.tam[1]);
  restaurando = true;
  canvas.clear(); canvas.backgroundColor = '#ffffff';
  p.crear(); ordenarVinculos();
  restaurando = false;
  canvas.discardActiveObject(); canvas.requestRenderAll(); renderCapas(); guardarEstado();
}
function ICONO(nombre, x, y, w, color){
  const pth = new fabric.Path(ICONOS[nombre], { fill:color, fillRule:'evenodd', originX:'center', originY:'center', esDeco:true, name:nombre, id:nuevoId() });
  pth.scaleToWidth(w); pth.setPositionByOrigin(new fabric.Point(x, y), 'center', 'center'); canvas.add(pth); return pth;
}
function LINEA(x1, y1, x2, y2, color, grosor){
  const l = new fabric.Line([x1, y1, x2, y2], { stroke:color, strokeWidth:grosor, strokeLineCap:'round', name:'Línea', id:nuevoId() });
  canvas.add(l); return l;
}
const CAT_MAPAS = 'Mapas conceptuales y mentales', CAT_TABLAS = 'Tablas y cuadros', CAT_PROC = 'Procesos y análisis', CAT_PORT = 'Portadas, carteles y redes';
const CATEGORIA_ORG = { 'Análisis FODA':CAT_PROC, 'Ciclo de 4 pasos':CAT_PROC, 'Tabla comparativa':CAT_TABLAS, 'Cuadro sinóptico':CAT_TABLAS,
  'Mapa conceptual':CAT_MAPAS, 'Mapa mental de nubes':CAT_MAPAS, 'Planeación de proyecto':CAT_PROC, 'Portada de proyecto':CAT_PORT, 'Tabla por categorías':CAT_TABLAS };
ORGANIZADORES.forEach(o => { o.cat = o.cat || CATEGORIA_ORG[o.nombre] || CAT_MAPAS; });

ORGANIZADORES.push(
  { nombre:'Mapa conceptual jerárquico', cat:CAT_MAPAS, tam:[1920,1080], crear(){
    FONDO('#f5f3ff'); fondoPapel('cuadros', '#f5f3ff');
    const borde = { stroke:'#1f2330', grosor:3, color:'#1f2330' };
    const tit = nodo('redondo', 'Título aquí', 960, 95, { ...borde, w:420, h:90, fill:'#ecfccb', tam:40, fuente:'Fredoka', peso:'700' });
    const def = nodo('redondo', 'Escribe aquí la definición del tema principal con tus propias palabras, de forma breve y clara.', 960, 300,
      { anchoMax:880, w:1000, h:130, fill:'#ffffff', stroke:'#1f2330', grosor:2, color:'#374151', tam:28, fuente:'Poppins' });
    unir(tit, def, { estilo:'recta', fin:'flecha', color:'#1f2330', ancho:3, etiqueta:'¿Qué es?' });
    [390, 770, 1150, 1530].forEach((x, i) => {
      const idea = nodo('redondo', 'Idea ' + (i + 1), x, 500, { ...borde, w:280, h:80, fill:'#ecfccb', tam:32, fuente:'Fredoka', peso:'700' });
      unir(def, idea, { estilo:'codo', fin:'flecha', color:'#1f2330', ancho:3 });
      const d = nodo('redondo', 'Explica la idea en dos o tres renglones.', x, 690, { anchoMax:260, w:330, h:150, fill:'#ffffff', stroke:'#1f2330', grosor:2, color:'#374151', tam:24, fuente:'Poppins' });
      unir(idea, d, { estilo:'recta', fin:'flecha', color:'#1f2330', ancho:3 });
      const ej = nodo('pildora', 'ejemplo', x, 865, { w:170, h:54, fill:'#ddd6fe', color:'#4c1d95', tam:30, fuente:'Caveat', peso:'700' });
      unir(d, ej, { estilo:'recta', fin:'nada', color:'#1f2330', ancho:2 });
      T('Escribe un ejemplo concreto.', x, 960, { f:'Poppins', s:22, c:'#4b5563', w:300 });
    });
    DECO('destello', 1760, 90, 60, { c:'#a78bfa' }); DECO('destello', 160, 980, 50, { c:'#84cc16' });
  }},
  { nombre:'Mapa de 8 ideas', cat:CAT_MAPAS, tam:[1920,1080], crear(){
    FONDO('#ffffff'); fondoPapel('cuadros', '#ffffff');
    const centro = nodo('proceso', 'MAPA\nCONCEPTUAL', 960, 540, { w:300, h:150, fill:'#fde047', stroke:'#1f2330', grosor:3, color:'#1f2330', tam:46, fuente:'Bebas Neue' });
    const nombres = ['NOVEDOSA','ECOLÓGICA','ECONÓMICA','EFICIENTE','TECNOLÓGICA','EDUCATIVA','MODERNA','SOSTENIBLE'];
    const cols = ['#d9f99d','#fbcfe8','#fde68a','#bae6fd','#a7f3d0','#fecaca','#ddd6fe','#e5e7eb'];
    [165, 415, 665, 915].forEach((y, i) => [0, 1].forEach(lado => {
      const n = i + lado * 4, x = lado ? 1490 : 430;
      const c = nodo('proceso', 'IDEA ' + nombres[n] + '\nEscribe aquí una breve explicación de esta idea.', x, y,
        { anchoMax:560, w:640, h:190, fill:cols[n], stroke:'#1f2330', grosor:3, color:'#1f2330', tam:26, fuente:'Poppins' });
      T(String(n + 1), lado ? 1860 : 60, y, { f:'Bebas Neue', s:96, w:80 });
      unir(centro, c, { estilo:'curva', fin:'flecha', color:'#1f2330', ancho:3, lados: lado ? ['der','izq'] : ['izq','der'] });
    }));
  }},
  { nombre:'Mapa de columnas de colores', cat:CAT_MAPAS, tam:[1920,1080], crear(){
    FONDO('#fffdf7');
    T('MAPA CONCEPTUAL', 960, 105, { f:'Fredoka', s:80, b:'700', w:1100 });
    DECO('foco', 520, 95, 70, { c:'#facc15' }); DECO('rizo', 1400, 105, 120, { c:'#1f2330', sw:4 });
    T('Escribe aquí una introducción breve que explique de qué trata el tema y por qué es importante.', 960, 215, { f:'Poppins', s:26, c:'#4b5563', w:1300 });
    const fuertes = ['#bae6fd','#fed7aa','#fbcfe8','#ddd6fe','#bbf7d0'], suaves = ['#f0f9ff','#fff7ed','#fdf2f8','#f5f3ff','#f0fdf4'];
    [260, 610, 960, 1310, 1660].forEach((x, i) => {
      const pill = nodo('pildora', 'IDEA ' + (i + 1), x, 340, { w:300, h:72, fill:fuertes[i], stroke:'#1f2330', grosor:2, color:'#1f2330', tam:30, fuente:'Fredoka', peso:'700' });
      const col = nodo('redondo', 'Desarrolla aquí la idea: qué es, cómo funciona y un ejemplo que la explique.', x, 630,
        { anchoMax:240, w:300, h:400, fill:suaves[i], color:'#1f2330', tam:28, fuente:'Patrick Hand' });
      unir(pill, col, { estilo:'recta', fin:'nada', color:'#1f2330', ancho:3 });
    });
    DECO('estrella', 160, 980, 46, { c:'#facc15' }); DECO('destello', 1760, 980, 54, { c:'#f472b6' });
  }},
  { nombre:'Mapa de burbujas', cat:CAT_MAPAS, tam:[1920,1080], crear(){
    FONDO('#ffffff'); fondoPapel('puntos', '#ffffff');
    const centro = nodo('circulo', 'MAPA\nCONCEPTUAL', 960, 540, { w:300, h:300, fill:'#ffffff', stroke:'#0f766e', grosor:6, color:'#0f766e', tam:40, fuente:'Fredoka', peso:'700' });
    const nombres = ['SIMPLE','SENCILLA','CREATIVA','BONITA','BÁSICA','DIVERTIDA'];
    const cols = ['#fbcfe8','#bbf7d0','#fde68a','#bae6fd','#ddd6fe','#fecaca'];
    [[620,250],[1300,250],[420,560],[1500,560],[620,860],[1300,860]].forEach(([x, y], i) => {
      const b = nodo('circulo', 'IDEA ' + nombres[i] + '\nUna frase corta que la explique.', x, y, { anchoMax:190, w:320, h:320, fill:cols[i], color:'#1f2330', tam:23, fuente:'Poppins' });
      unir(centro, b, { estilo:'recta', fin:'nada', color:'#0f766e', ancho:4 });
    });
    DECO('destello', 960, 160, 60, { c:'#14b8a6' }); DECO('espiral', 960, 930, 90, { c:'#0f766e', sw:4 });
  }},
  { nombre:'Mapa conceptual con notas', cat:CAT_MAPAS, tam:[1920,1080], crear(){
    FONDO('#fafaf9'); fondoPapel('cuadros', '#fafaf9');
    DECO('cinta', 960, 95, 620, { c:'#a5f3fc', op:0.6, ang:-2 });
    T('Mapa conceptual', 960, 95, { f:'Gochi Hand', s:76, w:900 });
    const main = nodo('nota', 'Tema principal', 960, 265, { w:380, h:120, fill:'#fde68a', color:'#1f2330', tam:42, fuente:'Gochi Hand' });
    const cols = ['#fbcfe8','#bbf7d0','#bae6fd'];
    [430, 960, 1490].forEach((x, i) => {
      const sub = nodo('nota', 'Subtema ' + (i + 1), x, 520, { w:320, h:110, fill:cols[i], color:'#1f2330', tam:38, fuente:'Gochi Hand' });
      unir(main, sub, { estilo:'curva', fin:'abierta', color:'#1f2330', ancho:4 });
      [-135, 135].forEach(dx => {
        const det = nodo('nota', 'Detalle o ejemplo', x + dx, 820, { anchoMax:180, w:230, h:170, fill:'#ffffff', color:'#374151', tam:30, fuente:'Patrick Hand' });
        unir(sub, det, { estilo:'codo', fin:'flecha', color:'#1f2330', ancho:3 });
      });
    });
    DECO('estrella', 1720, 120, 56, { c:'#facc15' }); DECO('foco', 200, 130, 80, { c:'#facc15' }); DECO('espiral', 1780, 960, 90, { c:'#1f2330', sw:4 });
  }},
  { nombre:'Cuadro comparativo de ideas', cat:CAT_TABLAS, tam:[1920,1080], crear(){
    FONDO('#fefce8'); fondoPapel('cuadros', '#fefce8');
    T('CUADRO COMPARATIVO', 960, 95, { f:'Amatic SC', s:100, b:'700', w:1200 });
    DECO('estrella', 1400, 80, 50, { c:'#1f2330' }); DECO('destello', 1460, 125, 40, { c:'#f472b6' }); DECO('destello', 470, 90, 50, { c:'#a78bfa' });
    crearTabla(960, 590, 5, 4, { sep:12, rx:12, borde:'#1f2330', grosor:2.5, enc:['#ede9fe','#fed7aa','#bbf7d0','#bae6fd'], encTexto:'#1f2330',
      filasColores:['#c7d2fe'], celda:'#ffffff', fuente:'Patrick Hand', fuenteEnc:'Amatic SC', anchos:[300,440,440,440], alto:130, altoEnc:110, tam:26, tamEnc:46 },
      [['', 'IDEA GRANDIOSA', 'IDEA BRILLANTE', 'IDEA FANTÁSTICA'], ['DEFINICIÓN'], ['OBJETIVOS'], ['INDICADORES'], ['EJEMPLOS']]);
  }},
  { nombre:'Cuadro S·Q·A', cat:CAT_TABLAS, tam:[1920,1080], crear(){
    FONDO('#ffffff'); fondoPapel('rayas', '#ffffff');
    T('Cuadro S · Q · A', 960, 95, { f:'Fredoka', s:72, b:'700', w:1200 });
    T('Tema: ______________________', 960, 175, { f:'Patrick Hand', s:38, c:'#4b5563', w:900 });
    crearTabla(960, 620, 2, 3, { sep:16, rx:18, borde:'#cbd5e1', grosor:2, enc:['#bae6fd','#fde68a','#bbf7d0'], encTexto:'#1f2330', celda:'#ffffff',
      fuente:'Patrick Hand', fuenteEnc:'Fredoka', anchos:[540,540,540], alto:560, altoEnc:130, tam:30, tamEnc:34 },
      [['S · Lo que sé', 'Q · Lo que quiero saber', 'A · Lo que aprendí'], ['', '', '']]);
    DECO('destello', 1760, 90, 56, { c:'#38bdf8' }); DECO('foco', 160, 100, 70, { c:'#facc15' });
  }},
  { nombre:'Pros y contras', cat:CAT_TABLAS, tam:[1920,1080], crear(){
    FONDO('#f8fafc');
    T('Pros y contras', 960, 95, { f:'Fredoka', s:72, b:'700', w:1200 });
    T('Decisión o tema a analizar', 960, 175, { f:'Caveat', s:50, c:'#475569', w:900 });
    [[520,'A FAVOR','#22c55e','#f0fdf4','#86efac','#14532d','Palomita','✓'],[1400,'EN CONTRA','#ef4444','#fef2f2','#fca5a5','#7f1d1d','Tache','✗']]
      .forEach(([x, tit, fuerte, suave, borde, txtc, icono, marca]) => {
        nodo('pildora', tit, x, 290, { w:320, h:84, fill:fuerte, color:'#ffffff', tam:38, fuente:'Fredoka', peso:'700' });
        ICONO(icono, x - 230, 290, 60, fuerte);
        const lista = nodo('redondo', `${marca} Primer punto\n${marca} Segundo punto\n${marca} Tercer punto\n${marca} Cuarto punto`, x, 640,
          { anchoMax:600, w:720, h:520, fill:suave, stroke:borde, grosor:3, color:txtc, tam:46, fuente:'Patrick Hand' });
        porId(lista.formaTexto).set('textAlign', 'left');
      });
  }},
  { nombre:'Proceso en 5 pasos', cat:CAT_PROC, tam:[1920,1080], crear(){
    FONDO('#ffffff');
    T('Proceso en 5 pasos', 960, 115, { f:'Fredoka', s:72, b:'700', w:1200 });
    DECO('subrayado', 960, 180, 360, { c:'#f97316', sw:6 });
    const cols = ['#f97316','#eab308','#22c55e','#06b6d4','#8b5cf6'];
    const c = [240, 600, 960, 1320, 1680].map((x, i) => {
      const n = nodo('circulo', String(i + 1), x, 420, { w:150, h:150, fill:cols[i], color:'#ffffff', tam:64, fuente:'Fredoka', peso:'700' });
      T('Paso ' + (i + 1), x, 560, { f:'Fredoka', s:38, b:'600', c:cols[i], w:300 });
      T('Describe brevemente qué se hace en este paso.', x, 650, { f:'Poppins', s:24, c:'#4b5563', w:290 });
      return n;
    });
    for (let i = 0; i < 4; i++) unir(c[i], c[i + 1], { estilo:'recta', fin:'flecha', color:'#cbd5e1', ancho:6, patron:'guiones' });
    nodo('redondo', 'Resultado final: escribe aquí lo que se logra al terminar el proceso.', 960, 880, { anchoMax:1000, w:1100, h:110, fill:'#f1f5f9', color:'#1f2330', tam:28, fuente:'Poppins' });
  }},
  { nombre:'Diagrama de Venn', cat:CAT_PROC, tam:[1920,1080], crear(){
    FONDO('#ffffff');
    T('Diagrama de Venn', 960, 100, { f:'Fredoka', s:72, b:'700', w:1200 });
    [[760,'#60a5fa'],[1160,'#f472b6']].forEach(([x, c]) => canvas.add(new fabric.Circle({ left:x, top:575, radius:330, originX:'center', originY:'center', fill:c, opacity:0.4, name:'Conjunto', id:nuevoId() })));
    T('TEMA A', 650, 360, { f:'Fredoka', s:46, b:'700', c:'#1e40af', w:300 });
    T('TEMA B', 1270, 360, { f:'Fredoka', s:46, b:'700', c:'#9d174d', w:300 });
    T('Características que solo tiene A', 610, 580, { f:'Poppins', s:28, w:260 });
    T('Lo que tienen en común', 960, 580, { f:'Poppins', s:28, b:'600', w:170 });
    T('Características que solo tiene B', 1310, 580, { f:'Poppins', s:28, w:260 });
    DECO('destello', 1760, 110, 60, { c:'#a78bfa' }); DECO('destello', 170, 960, 50, { c:'#60a5fa' });
  }},
  { nombre:'Causa y efecto (espina de pescado)', cat:CAT_PROC, tam:[1920,1080], crear(){
    FONDO('#f8fafc');
    T('Diagrama de causa y efecto', 820, 90, { f:'Fredoka', s:60, b:'700', w:1400 });
    LINEA(180, 540, 1480, 540, '#1f2330', 8);
    nodo('redondo', 'Problema o efecto', 1670, 540, { anchoMax:260, w:330, h:200, fill:'#ef4444', color:'#ffffff', tam:34, fuente:'Fredoka', peso:'700' });
    const cats = ['Métodos','Materiales','Personas','Entorno','Tiempo','Recursos'];
    const cols = ['#bae6fd','#fde68a','#bbf7d0','#fbcfe8','#ddd6fe','#fed7aa'];
    [420, 820, 1220].forEach((x, i) => [0, 1].forEach(abajo => {
      const n = i + abajo * 3, yE = abajo ? 820 : 260;
      LINEA(x - 140, yE, x + 60, 540, '#1f2330', 5);
      nodo('pildora', cats[n], x - 140, abajo ? 870 : 210, { w:230, h:62, fill:cols[n], color:'#1f2330', tam:28, fuente:'Fredoka', peso:'600' });
      T('• Causa principal\n• Otra causa', x + 95, abajo ? 690 : 390, { f:'Patrick Hand', s:28, al:'left', w:200 });
    }));
  }}
);

ORGANIZADORES.forEach(p => {
  const b = document.createElement('button'); b.className = 'plantilla';
  b.innerHTML = `<div class="t">${esc(p.nombre)}</div>`;
  b.onclick = () => usarOrganizador(p);
  $('listaOrganizadores').appendChild(b);
});

const DIAGRAMAS = [
  { nombre:'Mapa mental', desc:'Idea central con ramas de colores', tam:[1920, 1080], crear(){
    const centro = nodo('elipse', 'Idea central', 960, 540, { w:460, h:230, fill:'#7c3aed', color:'#ffffff', tam:56, peso:'700', fuente:'Montserrat' });
    const colores = ['#f97316','#06b6d4','#10b981','#ec4899','#eab308','#3b82f6'];
    [[1480,230],[1520,540],[1480,850],[440,230],[400,540],[440,850]].forEach(([x, y], i) => {
      const r = nodo('redondo', 'Idea ' + (i+1), x, y, { w:320, h:110, fill:colores[i], color:'#ffffff', tam:38, peso:'600' });
      unir(centro, r, { estilo:'curva', flecha:false, color:colores[i], ancho:9, orient:'h', dir: x > 960 ? 'der' : 'izq' });
    });
  }},
  { nombre:'Mapa conceptual', desc:'Conceptos unidos con palabras de enlace', tam:[1920, 1080], crear(){
    const est = { fill:'#eef2ff', stroke:'#1e3a8a', grosor:4, color:'#1e3a8a', tam:34, peso:'600' };
    const raiz = nodo('redondo', 'Concepto principal', 960, 130, { ...est, w:440, h:110, fill:'#1e3a8a', color:'#ffffff', tam:40, peso:'700' });
    const n2 = [400, 960, 1520].map((x, i) => nodo('redondo', 'Concepto ' + (i+1), x, 470, { ...est, w:320, h:100 }));
    const enlaces = ['se divide en', 'incluye', 'se relaciona con'];
    n2.forEach((n, i) => unir(raiz, n, { etiqueta:enlaces[i], color:'#334155', ancho:4 }));
    [[230, 0], [570, 0], [1350, 2], [1690, 2]].forEach(([x, i], j) => {
      const h3 = nodo('redondo', 'Ejemplo', x, 840, { ...est, w:280, h:96, fill:'#ffffff' });
      unir(n2[i], h3, { etiqueta: j % 2 ? 'como' : 'por ejemplo', color:'#334155', ancho:4 });
    });
  }},
  { nombre:'Diagrama de flujo', desc:'Inicio, procesos, decisión y fin', tam:[1400, 1920], crear(){
    const blanco = { color:'#ffffff', tam:38, peso:'600' };
    const ini = nodo('pildora', 'Inicio', 600, 160, { ...blanco, w:340, h:110, fill:'#10b981' });
    const p1 = nodo('proceso', 'Proceso', 600, 420, { ...blanco, w:380, h:130, fill:'#3b82f6' });
    const dec = nodo('rombo', '¿Condición?', 600, 760, { ...blanco, w:440, h:260, fill:'#f59e0b', tam:34 });
    const otra = nodo('proceso', 'Otra acción', 1170, 760, { ...blanco, w:300, h:120, fill:'#64748b' });
    const p2 = nodo('proceso', 'Siguiente paso', 600, 1120, { ...blanco, w:380, h:130, fill:'#3b82f6' });
    const dat = nodo('paralelo', 'Resultado', 600, 1420, { ...blanco, w:400, h:130, fill:'#8b5cf6' });
    const fin = nodo('pildora', 'Fin', 600, 1720, { ...blanco, w:340, h:110, fill:'#ef4444' });
    const lin = { estilo:'codo', color:'#1f2330', ancho:5 };
    unir(ini, p1, { ...lin, orient:'v' }); unir(p1, dec, { ...lin, orient:'v' });
    unir(dec, p2, { ...lin, orient:'v', etiqueta:'Sí' }); unir(dec, otra, { ...lin, orient:'h', etiqueta:'No' });
    unir(otra, dat, { ...lin, lados:['aba','der'] });
    unir(p2, dat, { ...lin, orient:'v' }); unir(dat, fin, { ...lin, orient:'v' });
  }},
  { nombre:'Organigrama / árbol', desc:'Jerarquía de arriba hacia abajo', tam:[1920, 1080], crear(){
    const raiz = nodo('redondo', 'Dirección', 960, 150, { w:360, h:110, fill:'#0f172a', color:'#ffffff', tam:40, peso:'700' });
    const cols = ['#2563eb', '#0891b2', '#7c3aed'];
    [400, 960, 1520].forEach((x, i) => {
      const n = nodo('redondo', 'Área ' + (i+1), x, 480, { w:300, h:100, fill:cols[i], color:'#ffffff', tam:34, peso:'600' });
      unir(raiz, n, { estilo:'codo', flecha:false, orient:'v', color:'#475569', ancho:4 });
      [-140, 140].forEach(dx => {
        const m = nodo('redondo', 'Puesto', x + dx, 820, { w:250, h:92, fill:'#f1f5f9', stroke:cols[i], grosor:4, color:'#1f2330', tam:30 });
        unir(n, m, { estilo:'codo', flecha:false, orient:'v', color:'#94a3b8', ancho:4 });
      });
    });
  }},
  { nombre:'Línea del tiempo', desc:'Acontecimientos en orden', tam:[1920, 1080], crear(){
    agregar(new fabric.Rect({ left:960, top:540, originX:'center', originY:'center', width:1640, height:12, rx:6, ry:6, fill:'#334155' }), 'Línea');
    [260, 610, 960, 1310, 1660].forEach((x, i) => {
      const punto = nodo('circulo', String(2020 + i), x, 540, { w:130, h:130, fill:'#7c3aed', color:'#ffffff', tam:30, peso:'700' });
      const y = i % 2 ? 820 : 260;
      const caja = nodo('redondo', 'Acontecimiento importante', x, y, { w:300, h:130, fill:'#f1f5f9', stroke:'#cbd5e1', grosor:3, color:'#1f2330', tam:30 });
      unir(punto, caja, { flecha:false, color:'#94a3b8', ancho:4 });
    });
  }}
];
DIAGRAMAS.forEach(d => {
  const b = document.createElement('button'); b.className = 'bigbtn';
  b.innerHTML = `<b>${esc(d.nombre)}</b><br><span style="color:#6b7280;font-size:12px">${esc(d.desc)}</span>`;
  b.onclick = () => {
    if (canvas.getObjects().length && !confirm('Esto reemplazará el contenido de esta página. ¿Continuar?')) return;
    fijarTamano(d.tam[0], d.tam[1]);
    restaurando = true;
    canvas.clear(); canvas.backgroundColor = '#ffffff';
    d.crear(); ordenarVinculos();
    restaurando = false;
    canvas.discardActiveObject(); canvas.requestRenderAll(); renderCapas(); guardarEstado();
  };
  $('listaDiagramas').appendChild(b);
});
canvas.targetFindTolerance = 8;

function toggleFlecha(){
  const o = conSel(); if (!o) return;
  const fin = (o.fin || (o.flecha ? 'flecha' : 'nada')) === 'nada' ? 'flecha' : 'nada';
  cambiarConector({ fin, flecha: fin !== 'nada' });
}

/* =========================================================
   LIENZO FLEXIBLE
   ========================================================= */
let lienzoAuto = true;
try { lienzoAuto = localStorage.getItem('disenador_auto2') !== '0'; } catch(e){}
$('lienzoAuto').checked = lienzoAuto;
$('bAuto').classList.toggle('on', lienzoAuto);
$('bAuto').onclick = () => { $('lienzoAuto').checked = !lienzoAuto; $('lienzoAuto').onchange({ target:$('lienzoAuto') });
  toast(lienzoAuto ? 'Lienzo automático: crece solo cuando algo se sale' : 'Lienzo automático apagado'); };
$('lienzoAuto').onchange = e => {
  lienzoAuto = e.target.checked;
  $('bAuto').classList.toggle('on', lienzoAuto);
  try { localStorage.setItem('disenador_auto2', lienzoAuto ? '1' : '0'); } catch(_){}
  if (lienzoAuto) ajustarLienzoAContenido(true);
};
// Mientras arrastras algo hacia la derecha o hacia abajo, el lienzo crece contigo
function crecerAlArrastrar(o){
  if (!lienzoAuto || !o) return;
  const r = cajaAbs(o), m = 40 * s();
  let nw = W, nh = H;
  if (r.left + r.width > W) nw = Math.ceil(r.left + r.width + m);
  if (r.top + r.height > H) nh = Math.ceil(r.top + r.height + m);
  if (nw === W && nh === H) return;
  W = Math.min(8000, nw); H = Math.min(8000, nh);
  canvas.setDimensions({ width: Math.round(W*zoom), height: Math.round(H*zoom) });
  $('tamTxt').textContent = W + ' × ' + H;
  const f = canvas.getObjects().find(x => x.esFondo); if (f) ajustarRectFondo(f);
  miniaturas = []; crecioArrastrando = true;
}
let crecioArrastrando = false;
// al soltar, se reajusta el zoom para ver todo el lienzo
canvas.on('mouse:up', () => { if (crecioArrastrando){ crecioArrastrando = false; setTimeout(() => { ajustarZoom(); guardarEstado(); }, 320); } });
function revisarAuto(){
  if (!lienzoAuto || restaurando || generandoVista) return;
  clearTimeout(revisarAuto._t);
  revisarAuto._t = setTimeout(() => ajustarLienzoAContenido(true), 300);
}
function limitesContenido(){
  const objs = canvas.getObjects().filter(o => !o.esFondo && o.visible);
  if (!objs.length) return null;
  const b = { x1:Infinity, y1:Infinity, x2:-Infinity, y2:-Infinity };
  objs.forEach(o => {
    const r = cajaAbs(o);
    b.x1 = Math.min(b.x1, r.left); b.y1 = Math.min(b.y1, r.top);
    b.x2 = Math.max(b.x2, r.left + r.width); b.y2 = Math.max(b.y2, r.top + r.height);
  });
  return b;
}
function moverTodo(dx, dy){
  const a = activo();
  if (a && a.type === 'activeSelection'){ a.set({ left: a.left + dx, top: a.top + dy }); a.setCoords(); }
  canvas.getObjects().filter(o => !o.esFondo && !o.group).forEach(o => { o.set({ left: o.left + dx, top: o.top + dy }); o.setCoords(); });
  actualizarTodasConexiones();
}
// soloCrecer = true: solo agranda si algo se sale. false: recorta/ajusta el lienzo justo al contenido con margen
function ajustarLienzoAContenido(soloCrecer){
  const b = limitesContenido();
  if (!b){ if (!soloCrecer) toast('Agrega algo al diseño primero'); return; }
  const m = Math.round(40 * s());
  let dx = 0, dy = 0, nw, nh;
  if (soloCrecer){
    if (b.x1 < -1) dx = Math.ceil(-b.x1) + m;
    if (b.y1 < -1) dy = Math.ceil(-b.y1) + m;
    nw = b.x2 > W + 1 ? Math.ceil(b.x2 + dx + m) : W + dx;
    nh = b.y2 > H + 1 ? Math.ceil(b.y2 + dy + m) : H + dy;
  } else {
    dx = Math.round(m - b.x1); dy = Math.round(m - b.y1);
    nw = Math.ceil(b.x2 - b.x1 + 2*m); nh = Math.ceil(b.y2 - b.y1 + 2*m);
  }
  nw = Math.max(50, Math.min(8000, nw)); nh = Math.max(50, Math.min(8000, nh));
  if (!dx && !dy && nw === W && nh === H) return;
  if (dx || dy) moverTodo(dx, dy);
  cambiarTamano(nw, nh);
}
// Asas para cambiar el tamaño del lienzo desde cualquier lado o esquina
document.querySelectorAll('.asa').forEach(asa => {
  let ini = null;
  asa.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); asa.setPointerCapture(e.pointerId);
    canvas.discardActiveObject();
    ini = { x:e.clientX, y:e.clientY, w:W, h:H, d:asa.dataset.d, ox:0, oy:0 };
  });
  asa.addEventListener('pointermove', e => {
    if (!ini) return;
    const dx = (e.clientX - ini.x) / zoom, dy = (e.clientY - ini.y) / zoom, d = ini.d;
    let w = ini.w, hh = ini.h;
    if (d.includes('e')) w = ini.w + dx;
    if (d.includes('w')) w = ini.w - dx;
    if (d.includes('s')) hh = ini.h + dy;
    if (d.includes('n')) hh = ini.h - dy;
    w = Math.round(Math.max(50, Math.min(8000, w))); hh = Math.round(Math.max(50, Math.min(8000, hh)));
    // al jalar desde la izquierda o arriba, el contenido se queda en su lugar
    ini.ox = d.includes('w') ? w - ini.w : 0;
    ini.oy = d.includes('n') ? hh - ini.h : 0;
    W = w; H = hh;
    canvas.setDimensions({ width: Math.round(W*zoom), height: Math.round(H*zoom) });
    canvas.setViewportTransform([zoom, 0, 0, zoom, ini.ox*zoom, ini.oy*zoom]);
    $('tamTxt').textContent = W + ' × ' + H;
  });
  const soltar = () => {
    if (!ini) return;
    const { ox, oy } = ini; ini = null;
    canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
    if (ox || oy) moverTodo(ox, oy);
    cambiarTamano(W, H);
  };
  asa.addEventListener('pointerup', soltar);
  asa.addEventListener('pointercancel', soltar);
});

/* =========================================================
   GRÁFICAS EDITABLES
   ========================================================= */
const PALETAS_GRAF = {
  'Vibrante':['#7c3aed','#f97316','#06b6d4','#10b981','#ec4899','#eab308'],
  'Pastel':['#a78bfa','#fda4af','#7dd3fc','#86efac','#fcd34d','#f9a8d4'],
  'Escolar':['#1e3a8a','#2563eb','#0891b2','#0d9488','#4f46e5','#0284c7'],
  'Cálida':['#dc2626','#ea580c','#d97706','#ca8a04','#b45309','#9a3412'],
  'Natural':['#166534','#65a30d','#ca8a04','#0f766e','#4d7c0f','#a16207']
};
Object.keys(PALETAS_GRAF).forEach(n => { const op = document.createElement('option'); op.value = n; op.textContent = n; $('gPaleta').appendChild(op); });
function leerDatos(texto){
  return texto.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^(.*?)[,;:\t]\s*(-?[\d.]+)\s*%?\s*$/);
    return m ? { e: m[1].trim(), v: parseFloat(m[2]) || 0 } : null;
  }).filter(Boolean);
}
const numBonito = max => { if (max <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(max))), n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
const fmtNum = v => Number.isInteger(v) ? String(v) : v.toFixed(1);
function sector(cx, cy, R, r, a0, a1){
  if (a1 - a0 >= 2 * Math.PI - 1e-6) a1 = a0 + 2 * Math.PI - 0.0005;
  const grande = (a1 - a0) > Math.PI ? 1 : 0;
  const pt = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  if (r <= 0) return `M ${cx} ${cy} L ${pt(R, a0)} A ${R} ${R} 0 ${grande} 1 ${pt(R, a1)} Z`;
  return `M ${pt(R, a0)} A ${R} ${R} 0 ${grande} 1 ${pt(R, a1)} L ${pt(r, a1)} A ${r} ${r} 0 ${grande} 0 ${pt(r, a0)} Z`;
}
// Arma todas las piezas de una gráfica dentro de una tarjeta de w × h
function construirGrafica(d){
  const w = d.w, hh = d.h, cols = PALETAS_GRAF[d.paleta] || PALETAS_GRAF.Vibrante;
  const datos = d.datos.length ? d.datos : [{ e:'Dato', v:1 }];
  const fs = Math.max(13, hh * 0.042), objs = [];
  const txt = (t, x, y, o = {}) => new fabric.Text(String(t), { left:x, top:y, originX:o.ox || 'center', originY:'center',
    fontFamily:'Poppins', fontSize:o.s || fs, fill:o.c || '#374151', fontWeight:o.b || '400' });
  objs.push(new fabric.Rect({ left:0, top:0, width:w, height:hh, fill:'#ffffff', rx:16, ry:16, stroke:'#e5e7eb', strokeWidth:2 }));
  let arriba = fs * 1.3;
  if (d.titulo){ objs.push(txt(d.titulo, w/2, fs * 1.5, { s: fs * 1.35, b:'700', c:'#1f2330' })); arriba = fs * 3.1; }
  if (d.tipo === 'barras' || d.tipo === 'lineas'){
    const L = fs * 3.4, R = w - fs * 1.4, T = arriba + fs * 0.6, B = hh - fs * 2.6;
    const max = numBonito(Math.max(0, ...datos.map(x => x.v)));
    for (let i = 0; i <= 4; i++){
      const y = B - (B - T) * i / 4;
      objs.push(new fabric.Line([L, y, R, y], { stroke: i ? '#eef0f3' : '#cbd5e1', strokeWidth:2 }));
      objs.push(txt(fmtNum(max * i / 4), L - fs * 0.5, y, { ox:'right', s: fs * 0.8, c:'#6b7280' }));
    }
    const n = datos.length, slot = (R - L) / n;
    if (d.tipo === 'barras'){
      datos.forEach((x, i) => {
        const bh = (B - T) * Math.max(0, x.v) / max, bw = slot * 0.62, bx = L + slot * i + (slot - bw) / 2, rr = Math.min(10, bw / 4);
        objs.push(new fabric.Rect({ left:bx, top:B - Math.max(1, bh), width:bw, height:Math.max(1, bh), fill:cols[i % cols.length], rx:rr, ry:rr }));
        if (d.valores) objs.push(txt(fmtNum(x.v), bx + bw/2, B - bh - fs * 0.75, { b:'600', c:'#1f2330', s: fs * 0.9 }));
        objs.push(txt(x.e, L + slot * (i + 0.5), B + fs * 1.15, { s: fs * 0.85 }));
      });
    } else {
      const pts = datos.map((x, i) => ({ x: L + slot * (i + 0.5), y: B - (B - T) * Math.max(0, x.v) / max }));
      objs.push(new fabric.Polyline(pts, { fill:null, stroke:cols[0], strokeWidth:Math.max(3, fs * 0.22), strokeLineJoin:'round', strokeLineCap:'round', objectCaching:false }));
      pts.forEach((q, i) => {
        objs.push(new fabric.Circle({ left:q.x, top:q.y, radius:fs * 0.33, originX:'center', originY:'center', fill:'#ffffff', stroke:cols[0], strokeWidth:Math.max(2, fs * 0.16) }));
        if (d.valores) objs.push(txt(fmtNum(datos[i].v), q.x, q.y - fs * 0.95, { b:'600', c:'#1f2330', s: fs * 0.85 }));
        objs.push(txt(datos[i].e, q.x, B + fs * 1.15, { s: fs * 0.85 }));
      });
    }
  } else {
    const total = datos.reduce((t, x) => t + Math.max(0, x.v), 0) || 1;
    const R = Math.max(20, Math.min(w * 0.28, (hh - arriba) / 2 - fs * 0.6)), cx = w * 0.33, cy = arriba + (hh - arriba) / 2 - fs * 0.2;
    let a = -Math.PI / 2;
    datos.forEach((x, i) => {
      const frac = Math.max(0, x.v) / total; if (frac <= 0) return;
      const a1 = a + frac * 2 * Math.PI;
      objs.push(new fabric.Path(sector(cx, cy, R, d.tipo === 'dona' ? R * 0.56 : 0, a, a1), { fill:cols[i % cols.length], stroke:'#ffffff', strokeWidth:3 }));
      if (d.valores && frac > 0.045){
        const am = (a + a1) / 2, rr = d.tipo === 'dona' ? R * 0.78 : R * 0.62;
        objs.push(txt(Math.round(frac * 100) + '%', cx + Math.cos(am) * rr, cy + Math.sin(am) * rr, { c:'#ffffff', b:'700', s: fs * 0.85 }));
      }
      a = a1;
    });
    const x0 = w * 0.66, paso = Math.min(fs * 1.9, (hh - arriba - fs) / datos.length);
    datos.forEach((x, i) => {
      const y = arriba + fs * 0.9 + i * paso;
      objs.push(new fabric.Rect({ left:x0, top:y - fs * 0.4, width:fs * 0.8, height:fs * 0.8, rx:4, ry:4, fill:cols[i % cols.length] }));
      objs.push(txt(x.e + (d.valores ? ' (' + fmtNum(x.v) + ')' : ''), x0 + fs * 1.3, y, { ox:'left', s: fs * 0.85 }));
    });
  }
  return objs;
}
function grupoGrafica(d){
  const g = new fabric.Group(construirGrafica(d), { originX:'center', originY:'center' });
  g.grafica = d; g.name = 'Gráfica'; g.id = nuevoId();
  return g;
}
function insertarGrafica(tipo){
  const k = s();
  const d = { tipo, titulo:'Título de la gráfica', paleta:'Vibrante', valores:true, w:760 * k, h:500 * k,
    datos: tipo === 'pastel' || tipo === 'dona'
      ? [{e:'Opción A',v:40},{e:'Opción B',v:25},{e:'Opción C',v:20},{e:'Otras',v:15}]
      : [{e:'Ene',v:12},{e:'Feb',v:19},{e:'Mar',v:15},{e:'Abr',v:24},{e:'May',v:21}] };
  const g = grupoGrafica(d);
  g.setPositionByOrigin(new fabric.Point(W/2, H/2), 'center', 'center');
  agregar(g, 'Gráfica');
}
// Vuelve a dibujar la gráfica seleccionada con los cambios, en el mismo lugar y tamaño
function actualizarGrafica(cambios, guardar = true){
  const o = activo(); if (!o || !o.grafica) return;
  const g = grupoGrafica({ ...o.grafica, ...cambios });
  g.set({ scaleX:o.scaleX, scaleY:o.scaleY, angle:o.angle, opacity:o.opacity, shadow:o.shadow, id:o.id, flipX:o.flipX, flipY:o.flipY });
  g.setPositionByOrigin(o.getCenterPoint(), 'center', 'center'); g.setCoords();
  const idx = canvas.getObjects().indexOf(o);
  restaurando = true; canvas.remove(o); canvas.insertAt(g, idx); restaurando = false;
  canvas.setActiveObject(g); canvas.requestRenderAll(); actualizarPanel();
  clearTimeout(actualizarGrafica._t);
  if (guardar) actualizarGrafica._t = setTimeout(() => { guardarEstado(); renderCapas(); }, 400);
}
document.querySelectorAll('#tiposGraf .pb').forEach(b => b.onclick = () => actualizarGrafica({ tipo:b.dataset.t }));
$('gTitulo').addEventListener('input', e => actualizarGrafica({ titulo:e.target.value }));
$('gDatos').addEventListener('input', e => { const d = leerDatos(e.target.value); if (d.length) actualizarGrafica({ datos:d }); });
$('gPaleta').addEventListener('change', e => actualizarGrafica({ paleta:e.target.value }));
$('gValores').addEventListener('change', e => actualizarGrafica({ valores:e.target.checked }));

/* =========================================================
   DIBUJO A MANO LIBRE
   ========================================================= */
let pincelActual = null;
function configurarPincel(){
  if (!pincelActual) return;
  const b = new fabric.PencilBrush(canvas), c = $('colorPincel').value, g = +$('grosorPincel').value * s();
  b.color = pincelActual === 'resaltador' ? hexAlpha(c, 0.38) : c;
  b.width = g * (pincelActual === 'marcador' ? 2.5 : pincelActual === 'resaltador' ? 5 : 1);
  b.strokeLineCap = pincelActual === 'resaltador' ? 'square' : 'round';
  b.decimate = 1.5;
  canvas.freeDrawingBrush = b;
}
function activarDibujo(tipo){
  if (tipo && modoConector) activarModoConector(false);
  pincelActual = tipo;
  canvas.isDrawingMode = !!tipo;
  document.querySelectorAll('#pinceles .pb').forEach(b => b.classList.toggle('on', b.dataset.p === tipo));
  $('dibujoAviso').style.display = tipo ? 'block' : 'none';
  if (tipo === 'resaltador' && esOscuro($('colorPincel').value)) $('colorPincel').value = '#fde047';
  if (tipo){ if (activo() && activo().isEditing) activo().exitEditing(); canvas.discardActiveObject(); configurarPincel(); }
  canvas.requestRenderAll(); actualizarPuntos();
}
document.querySelectorAll('#pinceles .pb').forEach(b => b.onclick = () => activarDibujo(pincelActual === b.dataset.p ? null : b.dataset.p));
['colorPincel','grosorPincel'].forEach(id => $(id).addEventListener('input', configurarPincel));
['#1f2330','#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#7c3aed','#ec4899','#ffffff','#fde047','#86efac'].forEach(c => {
  const d = document.createElement('div'); d.className = 'sw'; d.style.background = c;
  d.onclick = () => { $('colorPincel').value = c; configurarPincel(); };
  $('swPincel').appendChild(d);
});
canvas.on('path:created', e => {
  const pth = e.path;
  pth.set({ name: pincelActual === 'resaltador' ? 'Resaltado' : 'Dibujo', id: nuevoId(), trazoLibre: true });
  if (pincelActual === 'resaltador') pth.set('globalCompositeOperation', 'multiply');
  guardarEstado(); renderCapas();
});

/* =========================================================
   EMOJIS Y LISTAS
   ========================================================= */
const EMOJIS = ['📚','✏️','📝','📌','📎','🔍','💡','⭐','✨','🎓','🧠','📊','📈','📅','⏰','✅','❌','⚠️','❓','❗','💬','👍','👏','🙌',
  '🎯','🏆','🌱','🌎','♻️','⚖️','🏛️','🔬','🧪','🧮','💻','📱','🎨','🎵','❤️','💜','💙','💚','💛','🧡','🌸','🌼','🍎','☀️'];
EMOJIS.forEach(em => {
  const b = document.createElement('button'); b.className = 'emojiBtn'; b.textContent = em; b.title = 'Agregar';
  b.onclick = () => {
    const t = new fabric.Text(em, { fontSize:140 * s(), fontFamily:'"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif',
      originX:'center', originY:'center', left:W/2, top:H/2, esDeco:true });
    agregar(t, 'Emoji');
  };
  $('gridEmojis').appendChild(b);
});
// Pone o quita viñetas / números al inicio de cada renglón
function hacerLista(tipo){
  const quitar = l => l.replace(/^\s*(•|–|-|\d+[.)])\s+/, '');
  textos().forEach(t => {
    const lineas = t.text.split('\n');
    const ya = lineas.every(l => !l.trim() || (tipo === 'v' ? /^\s*•\s/.test(l) : /^\s*\d+[.)]\s/.test(l)));
    let n = 0;
    t.set('text', lineas.map(l => !l.trim() ? l : ya ? quitar(l) : (tipo === 'v' ? '• ' : (++n) + '. ') + quitar(l)).join('\n'));
    if (!ya) t.set('textAlign', 'left');
    t.initDimensions(); if (t.textoDe) ajustarFormaATexto(t);
  });
  canvas.requestRenderAll(); guardarEstado();
}

/* =========================================================
   MARCOS PARA FOTOS
   ========================================================= */
const MARCOS = [['rect','Rectángulo'],['redondo','Redondeado'],['circulo','Círculo'],['arco','Arco'],['corazon','Corazón'],['estrella','Estrella'],['mancha','Mancha'],['nube','Nube']];
// Forma del marco centrada en (0,0) con tamaño w × h
function crearClipMarco(tipo, w, hh){
  const base = { originX:'center', originY:'center', left:0, top:0 };
  if (tipo === 'rect') return new fabric.Rect({ ...base, width:w, height:hh });
  if (tipo === 'redondo'){ const r = Math.min(w, hh) * 0.12; return new fabric.Rect({ ...base, width:w, height:hh, rx:r, ry:r }); }
  if (tipo === 'circulo') return new fabric.Ellipse({ ...base, rx:w/2, ry:hh/2 });
  let d;
  if (tipo === 'arco'){ const r = w/2, alto = Math.max(hh, r); d = `M 0 ${alto} L 0 ${r} A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${alto} Z`; }
  else d = { corazon: DECOS.corazon.d, estrella: DECOS.estrella.d, mancha: PATH_BLOB, nube: PATH_NUBE }[tipo] || null;
  if (!d) return new fabric.Rect({ ...base, width:w, height:hh });
  const pth = new fabric.Path(d, base);
  pth.set({ scaleX: w / pth.width, scaleY: hh / pth.height });
  return pth;
}
function crearMarcoVacio(tipo, w, hh){
  const forma = crearClipMarco(tipo, w, hh);
  forma.set({ fill:'#e5e7eb', stroke:'#9ca3af', strokeWidth:3, strokeDashArray:[12, 8], strokeUniform:true });
  const t = new fabric.Text('📷\nSuelta o sube\nuna foto', { fontSize: Math.max(12, Math.min(w, hh) * 0.085), fontFamily:'Poppins',
    fill:'#6b7280', textAlign:'center', originX:'center', originY:'center', left:0, top:0, lineHeight:1.25 });
  const g = new fabric.Group([forma, t], { originX:'center', originY:'center' });
  g.marcoVacio = { tipo, w, h: hh }; g.name = 'Marco de foto'; g.id = nuevoId();
  return g;
}
function marcoEn(q){
  return canvas.getObjects().slice().reverse().find(o => {
    if (!(o.marcoVacio || o.marco) || !o.visible) return false;
    const r = cajaAbs(o); return q.x >= r.left && q.x <= r.left + r.width && q.y >= r.top && q.y <= r.top + r.height;
  });
}
// Recorta la foto para que llene el marco (sin deformarla) según acercamiento y posición
function ajustarFoto(img){
  const m = img.marco; if (!m) return;
  const o = img.getOriginalSize(); if (!o.width || !o.height) return;
  const c = img.getCenterPoint();
  const w = img.width * img.scaleX, hh = img.height * img.scaleY;
  const esc = Math.max(w / o.width, hh / o.height) * Math.max(1, m.zoom || 1);
  const vw = w / esc, vh = hh / esc;
  img.set({ width:vw, height:vh, scaleX:esc, scaleY:esc,
    cropX: (o.width - vw) * (0.5 + (m.px || 0) / 2), cropY: (o.height - vh) * (0.5 + (m.py || 0) / 2) });
  img.clipPath = m.tipo === 'rect' ? null : crearClipMarco(m.tipo, vw, vh);
  img.setPositionByOrigin(c, 'center', 'center'); img.setCoords(); img.dirty = true;
}
function llenarMarco(m, url){
  const tipo = m.marcoVacio ? m.marcoVacio.tipo : m.marco.tipo;
  const w = m.marcoVacio ? m.marcoVacio.w * m.scaleX : m.width * m.scaleX;
  const hh = m.marcoVacio ? m.marcoVacio.h * m.scaleY : m.height * m.scaleY;
  const c = m.getCenterPoint(), ang = m.angle || 0;
  fabric.Image.fromURL(url, img => {
    img.set({ originX:'center', originY:'center', name:'Foto', id: m.id || nuevoId(), angle:ang, opacity:m.opacity, shadow:m.shadow,
      scaleX: w / img.width, scaleY: hh / img.height, fx:{ b:0, c:0, s:0, bl:0, gris:false, sepia:false, inv:false } });
    img.marco = { tipo, zoom:1, px:0, py:0 };
    ajustarFoto(img);
    img.setPositionByOrigin(c, 'center', 'center'); img.setCoords();
    const idx = canvas.getObjects().indexOf(m);
    restaurando = true; canvas.remove(m); canvas.insertAt(img, idx >= 0 ? idx : canvas.getObjects().length); restaurando = false;
    canvas.setActiveObject(img); canvas.requestRenderAll(); renderCapas(); guardarEstado();
  });
}
function sacarDeMarco(){
  const o = activo(); if (!o || !o.marco) return;
  const c = o.getCenterPoint(), og = o.getOriginalSize(), esc = o.scaleX;
  o.set({ cropX:0, cropY:0, width:og.width, height:og.height }); o.clipPath = null; o.marco = null;
  const f = Math.min(1, (W * 0.8) / (og.width * esc), (H * 0.8) / (og.height * esc));
  o.set({ scaleX: esc * f, scaleY: esc * f }); o.setPositionByOrigin(c, 'center', 'center'); o.setCoords();
  canvas.requestRenderAll(); actualizarPanel(); guardarEstado();
}
(function(){
  $('mTipo').innerHTML = MARCOS.map(([t, n]) => `<option value="${t}">${esc(n)}</option>`).join('');
  const cambio = (campo, valor, guardar) => {
    const o = activo(); if (!o || !o.marco) return;
    o.marco[campo] = valor; ajustarFoto(o); canvas.requestRenderAll();
    if (guardar) guardarEstado();
  };
  [['mZoom','zoom'],['mPx','px'],['mPy','py']].forEach(([id, campo]) => {
    $(id).addEventListener('input', e => cambio(campo, +e.target.value, false));
    $(id).addEventListener('change', e => cambio(campo, +e.target.value, true));
  });
  $('mTipo').addEventListener('change', e => cambio('tipo', e.target.value, true));
  $('archivoMarco').onchange = e => {
    const o = activo(), f = e.target.files[0]; e.target.value = '';
    if (!o || !(o.marco || o.marcoVacio) || !f) return;
    leerArchivo(f, url => { miniatura(url); llenarMarco(o, url); });
  };
  MARCOS.forEach(([tipo, nombre]) => {
    const b = document.createElement('button'); b.className = 'nodoBtn'; b.title = nombre;
    const muestra = crearClipMarco(tipo, 40, tipo === 'arco' ? 30 : 26);
    const svg = muestra.toSVG().replace(/fill="[^"]*"|style="[^"]*"/g, '');
    b.innerHTML = `<svg viewBox="-24 -17 48 34" style="fill:#c4c6ce;stroke:#6d6f7b;stroke-width:1.5;stroke-dasharray:3 2">${svg}</svg>${esc(nombre)}`;
    b.onclick = () => {
      const k = s(), w = (tipo === 'circulo' || tipo === 'estrella' || tipo === 'corazon') ? 420 * k : 520 * k, hh = tipo === 'arco' ? 620 * k : 420 * k;
      const g = crearMarcoVacio(tipo, w, hh); g.setPositionByOrigin(new fabric.Point(W/2, H/2), 'center', 'center');
      agregar(g, 'Marco de foto');
    };
    $('gridMarcos').appendChild(b);
  });
})();

/* =========================================================
   PLANTILLAS DE INFOGRAFÍAS Y FOTOS
   ========================================================= */
const CAT_INFO = 'Infografías y fotos';
function GRAFICA(tipo, x, y, w, hh, datos, o = {}){
  const g = grupoGrafica({ tipo, titulo:o.titulo || '', paleta:o.paleta || 'Vibrante', valores:o.valores !== false, w, h:hh, datos });
  g.setPositionByOrigin(new fabric.Point(x, y), 'center', 'center'); g.setCoords(); canvas.add(g); return g;
}
function MARCO(tipo, x, y, w, hh, ang = 0){
  const g = crearMarcoVacio(tipo, w, hh); g.set({ angle:ang });
  g.setPositionByOrigin(new fabric.Point(x, y), 'center', 'center'); g.setCoords(); canvas.add(g); return g;
}
const izquierda = n => { const t = porId(n.formaTexto); if (t) t.set('textAlign', 'left'); return n; };
ORGANIZADORES.push(
  { nombre:'Infografía con datos', cat:CAT_INFO, tam:[1080,1920], crear(){
    FONDO('#f8fafc');
    canvas.add(new fabric.Rect({ left:0, top:0, width:1080, height:400, fill:'#4f46e5', name:'Banda', id:nuevoId() }));
    DECO('destello', 960, 80, 60, { c:'#a5b4fc' }); DECO('destello', 110, 340, 44, { c:'#c7d2fe' });
    T('INFOGRAFÍA', 540, 105, { f:'Montserrat', s:30, b:'800', c:'#c7d2fe', cs:400, w:900 });
    T('Título del tema', 540, 200, { f:'Fredoka', s:84, b:'700', c:'#ffffff', w:950 });
    T('Una frase que resuma de qué trata esta infografía.', 540, 300, { f:'Poppins', s:30, c:'#e0e7ff', w:850 });
    [['75%',220,'#4f46e5'],['3/5',540,'#0891b2'],['+20',860,'#db2777']].forEach(([v, x, c]) => {
      nodo('circulo', v, x, 545, { w:190, h:190, fill:c, color:'#ffffff', tam:48, fuente:'Fredoka', peso:'700' });
      T('Dato importante que explica la cifra', x, 700, { s:24, w:260, c:'#475569' });
    });
    GRAFICA('barras', 540, 1040, 920, 520, [{e:'2021',v:35},{e:'2022',v:48},{e:'2023',v:62},{e:'2024',v:71}], { titulo:'Comparación de resultados', paleta:'Escolar' });
    MARCO('redondo', 280, 1535, 400, 330);
    T('Explica aquí la imagen o agrega un dato curioso relacionado con el tema.', 760, 1535, { s:30, w:500, al:'left', c:'#334155' });
    nodo('redondo', 'Conclusión: escribe aquí la idea más importante que debe recordar quien lea.', 540, 1805, { anchoMax:860, w:960, h:130, fill:'#e0e7ff', color:'#1e1b4b', tam:28, fuente:'Poppins' });
  }},
  { nombre:'Reporte de resultados', cat:CAT_INFO, tam:[1920,1080], crear(){
    FONDO('#ffffff');
    T('Reporte de resultados', 960, 90, { f:'Fredoka', s:68, b:'700', w:1400 });
    T('Encuesta aplicada a 30 estudiantes · Grupo 6A', 960, 160, { f:'Poppins', s:28, c:'#64748b', w:1200 });
    GRAFICA('dona', 500, 520, 820, 540, [{e:'Sí',v:18},{e:'No',v:7},{e:'No sé',v:5}], { titulo:'¿Te gusta leer?', paleta:'Pastel' });
    GRAFICA('barras', 1420, 520, 820, 540, [{e:'Novela',v:12},{e:'Cómic',v:9},{e:'Poesía',v:4},{e:'Ciencia',v:5}], { titulo:'Género favorito', paleta:'Vibrante' });
    [[340,'#ede9fe','#3b0764'],[960,'#fce7f3','#831843'],[1580,'#e0f2fe','#0c4a6e']].forEach(([x, f, c], i) =>
      nodo('redondo', `Hallazgo ${i + 1}: escribe aquí una conclusión de los datos.`, x, 935, { anchoMax:480, w:560, h:120, fill:f, color:c, tam:26, fuente:'Poppins' }));
  }},
  { nombre:'Sobre mí', cat:CAT_INFO, tam:[1080,1350], crear(){
    FONDO('#fff7ed'); fondoPapel('puntos', '#fff7ed');
    MARCO('circulo', 540, 320, 400, 400);
    DECO('destello', 810, 150, 60, { c:'#fb923c' }); DECO('flor', 270, 500, 70, { c:'#f472b6' }); DECO('estrella', 840, 470, 40, { c:'#facc15' });
    T('¡Hola! Soy', 540, 585, { f:'Caveat', s:56, c:'#9a3412' });
    T('Tu nombre', 540, 665, { f:'Fredoka', s:84, b:'700', w:900 });
    DECO('subrayado', 540, 725, 360, { c:'#fb923c', sw:6 });
    [['🎂\nEdad\n__ años',220,'#fed7aa'],['📍\nVivo en\nCiudad',540,'#fbcfe8'],['🎓\nEstudio\nCarrera',860,'#bbf7d0']].forEach(([t, x, f]) =>
      nodo('redondo', t, x, 925, { w:280, h:230, fill:f, color:'#1f2330', tam:30, fuente:'Poppins', peso:'600' }));
    izquierda(nodo('redondo', 'Me gusta: escribe tus pasatiempos, música o comida favorita.\nMi meta: algo que quieras lograr este año.', 540, 1190,
      { anchoMax:860, w:960, h:200, fill:'#ffffff', stroke:'#fdba74', grosor:3, color:'#431407', tam:32, fuente:'Patrick Hand' }));
  }},
  { nombre:'Biografía', cat:CAT_INFO, tam:[1920,1080], crear(){
    FONDO('#fdf6e3');
    MARCO('arco', 400, 560, 520, 720);
    T('BIOGRAFÍA', 1240, 110, { f:'Montserrat', s:30, b:'800', c:'#b45309', cs:500, w:900 });
    T('Nombre del personaje', 1240, 190, { f:'Playfair Display', s:72, b:'700', w:1100 });
    T('Lugar y fecha de nacimiento — fecha de fallecimiento', 1240, 265, { f:'Poppins', s:28, c:'#78716c', w:1100 });
    LINEA(880, 420, 1640, 420, '#d97706', 4);
    [[880,'1900'],[1133,'1920'],[1386,'1950'],[1640,'1980']].forEach(([x, a]) => {
      nodo('circulo', a, x, 420, { w:120, h:120, fill:'#f59e0b', color:'#ffffff', tam:28, fuente:'Fredoka', peso:'700' });
      T('Acontecimiento importante', x, 530, { s:24, w:220, c:'#57534e' });
    });
    nodo('pildora', 'Aportaciones', 900, 655, { w:270, h:64, fill:'#f59e0b', color:'#ffffff', tam:30, fuente:'Fredoka', peso:'700' });
    izquierda(nodo('redondo', '• Primera aportación importante\n• Segunda aportación\n• Por qué se le recuerda hoy', 1240, 850,
      { anchoMax:900, w:1000, h:260, fill:'#ffffff', stroke:'#f59e0b', grosor:3, color:'#292524', tam:34, fuente:'Patrick Hand' }));
    DECO('destello', 1820, 90, 60, { c:'#f59e0b' });
  }},
  { nombre:'Álbum de fotos', cat:CAT_INFO, tam:[1920,1080], crear(){
    FONDO('#fef3c7'); fondoPapel('cuadros', '#fef3c7');
    T('Nuestro álbum', 960, 100, { f:'Caveat', s:96, b:'700', c:'#92400e', w:900 });
    [[330,-6,'#f9a8d4'],[760,4,'#a5f3fc'],[1170,-3,'#bbf7d0'],[1600,6,'#fde68a']].forEach(([x, a, cinta]) => {
      canvas.add(new fabric.Rect({ left:x, top:575, width:380, height:470, originX:'center', originY:'center', fill:'#ffffff', angle:a,
        shadow:new fabric.Shadow({ color:'rgba(0,0,0,.18)', blur:18, offsetX:4, offsetY:8 }), name:'Polaroid', id:nuevoId() }));
      MARCO('rect', x, 535, 330, 330, a);
      T('Pie de foto', x, 760, { f:'Caveat', s:44, w:300, ang:a });
      DECO('cinta', x, 345, 170, { c:cinta, op:0.65, ang:a - 4 });
    });
    DECO('destello', 1820, 110, 60, { c:'#f59e0b' }); DECO('corazon', 110, 980, 60, { c:'#f472b6' });
  }},
  { nombre:'Ficha de lectura', cat:CAT_INFO, tam:[1240,1754], crear(){
    FONDO('#f0f9ff');
    T('FICHA DE LECTURA', 620, 110, { f:'Fredoka', s:70, b:'700', c:'#0c4a6e', w:1100 });
    DECO('subrayado', 620, 170, 420, { c:'#38bdf8', sw:6 });
    MARCO('rect', 300, 480, 380, 520);
    const campo = { anchoMax:520, w:600, h:90, fill:'#ffffff', stroke:'#7dd3fc', grosor:2, color:'#0c4a6e', tam:32, fuente:'Patrick Hand' };
    ['Título: ______________','Autor: ______________','Género: ______________','Calificación: ★★★★☆'].forEach((t, i) => izquierda(nodo('redondo', t, 870, 300 + i * 120, campo)));
    nodo('pildora', 'Resumen', 620, 820, { w:240, h:64, fill:'#0ea5e9', color:'#ffffff', tam:30, fuente:'Fredoka', peso:'700' });
    izquierda(nodo('redondo', 'Escribe aquí de qué trata el libro: inicio, problema principal y final.', 620, 1035,
      { anchoMax:1000, w:1100, h:330, fill:'#ffffff', stroke:'#7dd3fc', grosor:2, color:'#334155', tam:32, fuente:'Patrick Hand' }));
    [[340,'Personajes','• Protagonista:\n• Otros personajes:'],[900,'Mi opinión','¿Te gustó? ¿Lo recomendarías? ¿Por qué?']].forEach(([x, tit, txt]) => {
      nodo('pildora', tit, x, 1290, { w:250, h:60, fill:'#38bdf8', color:'#ffffff', tam:28, fuente:'Fredoka', peso:'700' });
      izquierda(nodo('redondo', txt, x, 1480, { anchoMax:440, w:520, h:310, fill:'#ffffff', stroke:'#7dd3fc', grosor:2, color:'#334155', tam:30, fuente:'Patrick Hand' }));
    });
  }}
);

/* =========================================================
   PRESENTACIONES (temas completos con varias diapositivas)
   ========================================================= */
const CAT_PRES = 'Presentaciones';
const TEMAS_PRES = {
  escolar: { nombre:'Escolar colorido', fondo:'#fffdf7', texto:'#1f2330', suave:'#64748b', pri:'#7c3aed', sec:'#f97316', acento:'#06b6d4',
    tarjeta:'#f5f3ff', textoTarjeta:'#2e1065', borde:null, tit:'Fredoka', titPeso:'700', cuerpo:'Poppins', paleta:'Vibrante', trans:'deslizar', anim:'dinamica' },
  formal: { nombre:'Formal (Derecho)', fondo:'#f8f6f1', texto:'#0f2747', suave:'#5b6b80', pri:'#0f2747', sec:'#b8862b', acento:'#b8862b',
    tarjeta:'#ffffff', textoTarjeta:'#0f2747', borde:'#d6c7a1', tit:'Playfair Display', titPeso:'700', cuerpo:'Inter', paleta:'Escolar', trans:'desvanecer', anim:'suave',
    zona:{ x:1240, w:1080 } },
  minimal: { nombre:'Minimalista', fondo:'#ffffff', texto:'#111827', suave:'#6b7280', pri:'#111827', sec:'#2563eb', acento:'#2563eb',
    tarjeta:'#f3f4f6', textoTarjeta:'#111827', borde:null, tit:'Montserrat', titPeso:'800', cuerpo:'Inter', paleta:'Escolar', trans:'desvanecer', anim:'suave' },
  oscuro: { nombre:'Moderno oscuro', fondo:'#0f172a', texto:'#f8fafc', suave:'#94a3b8', pri:'#22d3ee', sec:'#a78bfa', acento:'#f472b6',
    tarjeta:'#1e293b', textoTarjeta:'#e2e8f0', borde:'#334155', tit:'Montserrat', titPeso:'800', cuerpo:'Inter', paleta:'Vibrante', trans:'zoom', anim:'dinamica' },
  pizarron: { nombre:'Pizarrón', fondo:'#1f3b2d', texto:'#f8fafc', suave:'#d1dccb', pri:'#fde047', sec:'#f9a8d4', acento:'#7dd3fc',
    tarjeta:'#2a4d3b', textoTarjeta:'#f8fafc', borde:'#e2e8f0', tit:'Gochi Hand', titPeso:'400', cuerpo:'Patrick Hand', paleta:'Pastel', trans:'desvanecer', anim:'suave' },
  cuaderno: { nombre:'Cuaderno', fondo:'#fffef6', texto:'#1e293b', suave:'#475569', pri:'#2563eb', sec:'#ef4444', acento:'#16a34a',
    tarjeta:'#ffffff', textoTarjeta:'#1e293b', borde:'#93c5fd', tit:'Caveat', titPeso:'700', cuerpo:'Patrick Hand', paleta:'Escolar', trans:'deslizar', anim:'divertida' },
  pastel: { nombre:'Pastel', fondo:'#fdf4ff', texto:'#3b0764', suave:'#7e6a8a', pri:'#c084fc', sec:'#f472b6', acento:'#38bdf8',
    tarjeta:'#ffffff', textoTarjeta:'#3b0764', borde:'#f0abfc', tit:'Fredoka', titPeso:'600', cuerpo:'Poppins', paleta:'Pastel', trans:'deslizar', anim:'divertida' }
};
Object.entries(TEMAS_PRES).forEach(([id, t]) => { t.id = id; });
const sobre = c => esOscuro(c) ? '#ffffff' : '#1f2330';          // color de texto que se lee bien encima de c
function RECT(x, y, w, hh, fill, o = {}){
  const r = new fabric.Rect({ left:x, top:y, width:w, height:hh, fill, opacity:o.op ?? 1, rx:o.r || 0, ry:o.r || 0, angle:o.ang || 0,
    stroke:o.stroke || null, strokeWidth:o.sw || 0, esDeco:true, name:o.nombre || 'Decoración', id:nuevoId() });
  canvas.add(r); return r;
}
function CIRC(x, y, r, fill, o = {}){
  const c = new fabric.Circle({ left:x, top:y, radius:r, originX:'center', originY:'center', fill, opacity:o.op ?? 1,
    stroke:o.stroke || null, strokeWidth:o.sw || 0, esDeco:true, name:o.nombre || 'Círculo decorativo', id:nuevoId() });
  canvas.add(c); return c;
}
// Dibuja el fondo y los adornos del tema. Devuelve los colores que se leen bien en esa diapositiva.
function fondoPres(t, k){
  const c = { texto:t.texto, suave:t.suave, acento:t.pri };
  const portada = k === 'portada' || k === 'final', barra = k === 'normal';
  switch (t.id){
    case 'escolar':
      if (k === 'seccion'){ FONDO(t.pri); DECO('mancha', 1700, 160, 520, { c:'#8b5cf6' }); DECO('destello', 240, 860, 90, { c:'#fde047' });
        return { texto:'#ffffff', suave:'#ede9fe', acento:'#fde047' }; }
      FONDO(t.fondo);
      if (portada){
        DECO('mancha', 1720, 230, 640, { c:'#ede9fe' }); DECO('mancha', 170, 960, 520, { c:'#ffedd5' });
        DECO('destello', 1660, 860, 90, { c:t.sec }); DECO('destello', 250, 170, 70, { c:t.acento }); DECO('confeti', 1560, 180, 260, { c:t.pri });
      } else {
        RECT(0, 0, 1920, 16, t.pri); if (barra) RECT(120, 192, 120, 10, t.sec, { r:5 }); DECO('destello', 1830, 85, 56, { c:t.sec });
      }
      return c;
    case 'formal':
      if (k === 'seccion'){ FONDO(t.pri); RECT(0, 0, 1920, 1080, null, { stroke:t.sec, sw:6, nombre:'Marco' });
        return { texto:'#ffffff', suave:'#cbd5e1', acento:t.sec }; }
      FONDO(t.fondo);
      if (portada){
        RECT(0, 0, 640, 1080, t.pri, { nombre:'Banda' }); RECT(640, 0, 14, 1080, t.sec);
        ICONO(k === 'final' ? 'Libro' : 'Balanza', 320, 520, 250, t.sec);
        RECT(200, 720, 240, 3, t.sec);
      } else {
        if (barra){ RECT(120, 196, 180, 4, t.sec); RECT(120, 206, 90, 4, t.sec); } RECT(0, 1048, 1920, 32, t.pri, { nombre:'Banda' });
      }
      return { ...c, acento:t.sec };
    case 'minimal':
      if (k === 'seccion'){ FONDO('#111827'); RECT(120, 120, 16, 840, t.sec);
        return { texto:'#ffffff', suave:'#9ca3af', acento:'#60a5fa' }; }
      FONDO(t.fondo);
      if (portada){ RECT(160, 150, 1600, 2, '#e5e7eb'); RECT(160, 930, 1600, 2, '#e5e7eb'); CIRC(1760, 151, 10, t.sec); }
      else { if (barra) RECT(120, 192, 90, 8, t.sec); RECT(1700, 1000, 100, 2, '#d1d5db'); }
      return { ...c, acento:t.sec };
    case 'oscuro':
      if (k === 'seccion'){ DEGRADADO('#0e7490', '#312e81'); CIRC(1650, 260, 300, '#ffffff', { op:0.07 });
        return { texto:'#ffffff', suave:'#cffafe', acento:'#f0abfc' }; }
      DEGRADADO('#0f172a', '#1e1b4b');
      if (portada){ CIRC(1640, 300, 420, t.pri, { op:0.12 }); CIRC(260, 900, 260, t.sec, { op:0.15 }); CIRC(1500, 860, 70, t.acento, { op:0.5 }); }
      else { if (barra) RECT(120, 192, 110, 8, t.pri, { r:4 }); CIRC(1820, 90, 26, t.sec, { op:0.6 }); CIRC(1870, 140, 12, t.acento, { op:0.7 }); }
      return c;
    case 'pizarron':
      fijarFondo(new fabric.Rect({ left:0, top:0, width:1920, height:1080, fill:t.fondo, stroke:'#8b5a2b', strokeWidth:44 }));
      if (portada){ DECO('destello', 1650, 220, 80, { c:t.pri }); DECO('estrella', 280, 230, 60, { c:t.sec }); DECO('espiral', 1600, 850, 150, { c:t.acento, sw:5 }); DECO('flecha', 330, 860, 200, { c:t.pri, sw:6 }); }
      else if (k === 'seccion'){ DECO('marcador', 960, 400, 520, { c:t.pri, sw:6 }); }
      else { if (barra) DECO('subrayado', 330, 205, 420, { c:t.pri, sw:6 }); DECO('enfasis', 1800, 110, 70, { c:t.sec, sw:5 }); }
      return c;
    case 'cuaderno':
      fondoPapel('rayas', t.fondo);
      RECT(92, 0, 4, 1080, '#fca5a5', { nombre:'Margen' });
      [200, 540, 880].forEach(y => CIRC(44, y, 20, '#e5e7eb', { nombre:'Perforación' }));
      if (portada){ DECO('cinta', 470, 120, 260, { c:'#fde68a', op:0.8, ang:-8 }); DECO('cinta', 1650, 120, 260, { c:'#bae6fd', op:0.8, ang:7 }); DECO('rizo', 1620, 880, 200, { c:t.sec, sw:6 }); DECO('estrella', 420, 880, 70, { c:'#facc15' }); }
      else if (k === 'seccion'){ DECO('marcador', 960, 400, 520, { c:t.sec, sw:6 }); }
      else if (barra) DECO('subrayado', 350, 205, 420, { c:t.sec, sw:6 });
      return { ...c, acento:t.sec };
    case 'marca': return fondoMarca(t, k);
    case 'pastel':
      FONDO(k === 'seccion' ? '#f5d0fe' : t.fondo);
      DECO('mancha', 1760, 130, 460, { c:'#fbcfe8', op:0.8 }); DECO('mancha', 140, 990, 420, { c:'#bae6fd', op:0.8 });
      if (portada){ DECO('flor', 1600, 850, 120, { c:t.sec }); DECO('corazon', 330, 220, 70, { c:t.sec }); DECO('destello', 1500, 200, 60, { c:t.pri }); }
      else if (barra) RECT(120, 192, 110, 10, t.pri, { r:5 });
      return c;
  }
  FONDO(t.fondo); return c;
}
// Acomoda objetos uno debajo de otro (centrados verticalmente en "centro"); sirve para que nada se encime
function apilar(lst, centro, gap){
  const alto = lst.reduce((a, [o, g]) => a + o.getScaledHeight() + (g ?? gap), 0) - (lst.length ? (lst[lst.length - 1][1] ?? gap) : 0);
  let y = centro - alto / 2;
  lst.forEach(([o, g]) => { const hh = o.getScaledHeight(); o.set('top', y + hh / 2); o.setCoords(); y += hh + (g ?? gap); });
  return y;
}
const presTitulo = (t, c, txt, o = {}) => T(txt, o.x || 960, o.y || 125, { w:o.w || 1680, al:o.al || 'left', f:t.tit, s:o.s || 76, b:t.titPeso, c:c.texto, lh:1.1 });
const presTexto = (t, c, txt, x, y, w, o = {}) => T(txt, x, y, { w, al:o.al || 'left', f:t.cuerpo, s:o.s || 38, c:o.c || c.suave, lh:1.4, b:o.b });
function presCaja(t, txt, x, y, o = {}){
  const n = nodo(o.tipo || 'redondo', txt, x, y, { w:o.w || 500, h:o.h || 200, anchoMax:o.anchoMax || (o.w || 500) - 70, fill:o.fill || t.tarjeta,
    stroke:o.stroke !== undefined ? o.stroke : t.borde, grosor:3, color:o.color || t.textoTarjeta, tam:o.tam || 32, fuente:o.fuente || t.cuerpo, peso:o.peso });
  if (o.izq) izquierda(n);
  return n;
}
const DIAPOS = [
  { id:'portada', notas:'Saluda y di tu nombre.\nPresenta el tema en una sola frase y explica por qué es importante.', nombre:'Portada', crear(t){
    const c = fondoPres(t, 'portada'), z = t.zona || { x:960, w:1500 };
    const a = T('PRESENTACIÓN', z.x, 0, { f:t.cuerpo, s:30, b:'700', c:c.acento, cs:500, w:z.w });
    const b = T('Título de la presentación', z.x, 0, { f:t.tit, s:z.w < 1300 ? 100 : 120, b:t.titPeso, c:c.texto, w:z.w, lh:1.05 });
    const d = T('Una frase corta que explique el tema', z.x, 0, { f:t.cuerpo, s:38, c:c.suave, w:z.w });
    const y = apilar([[a, 34], [b, 34], [d, 60]], 500, 30);
    nodo('pildora', 'Materia · Tu nombre · Fecha', z.x, y + 38, { w:640, h:76, fill:c.acento, color:sobre(c.acento), tam:28, fuente:t.cuerpo, peso:'600' });
  }},
  { id:'indice', notas:'Cuenta en qué orden vas a exponer.\nNo leas la lista: menciona cada parte en pocas palabras.', nombre:'Contenido', crear(t){
    const c = fondoPres(t, 'normal');
    presTitulo(t, c, 'Contenido');
    ['Introducción al tema', 'Ideas principales', 'Ejemplos y datos', 'Conclusiones'].forEach((txt, i) => {
      const x = i % 2 ? 1060 : 200, y = i < 2 ? 470 : 760, col = [t.pri, t.sec, t.acento, t.pri][i];
      nodo('circulo', '0' + (i + 1), x + 70, y, { w:140, h:140, fill:col, color:sobre(col), tam:46, fuente:t.tit, peso:'700' });
      presTexto(t, c, txt + '\nUna línea que describa esta parte.', x + 180 + 290, y, 580, { s:38, c:c.texto });
    });
  }},
  { id:'seccion', notas:'Haz una pausa y anuncia esta nueva parte.\nConecta con lo que acabas de explicar.', nombre:'Separador de sección', crear(t){
    const c = fondoPres(t, 'seccion');
    const a = T('01', 960, 0, { f:t.tit, s:240, b:t.titPeso, c:c.acento, w:1200, lh:1 });
    const b = T('Nombre de la sección', 960, 0, { f:t.tit, s:100, b:t.titPeso, c:c.texto, w:1500, lh:1.05 });
    const d = T('Breve descripción de lo que veremos', 960, 0, { f:t.cuerpo, s:38, c:c.suave, w:1300 });
    apilar([[a, 30], [b, 30], [d]], 540, 30);
  }},
  { id:'contenido', notas:'Explica cada punto con tus palabras y da un ejemplo.\nIdea clave que deben recordar: …', nombre:'Título y viñetas', crear(t){
    const c = fondoPres(t, 'normal');
    presTitulo(t, c, 'Título de la diapositiva');
    presCaja(t, '• Primera idea importante del tema\n• Segunda idea con un ejemplo\n• Un dato curioso o una definición\n• Lo que debemos recordar',
      700, 620, { w:1160, h:560, anchoMax:1060, tam:50, izq:true });
    CIRC(1530, 620, 230, t.tarjeta, { stroke:t.borde, sw:t.borde ? 3 : 0 });
    ICONO('Foco', 1530, 620, 230, t.id === 'pizarron' || t.id === 'oscuro' ? t.pri : (t.id === 'formal' ? t.sec : t.pri));
  }},
  { id:'imagen', notas:'Describe lo que se ve en la imagen y relaciónalo con el tema.', nombre:'Imagen y texto', crear(t){
    const c = fondoPres(t, 'libre');
    MARCO('redondo', 560, 600, 800, 720);
    const a = T('Título de esta parte', 1430, 0, { w:760, al:'left', f:t.tit, s:76, b:t.titPeso, c:c.texto, lh:1.1 });
    const b = presTexto(t, c, 'Explica aquí lo que muestra la imagen. Usa frases cortas y claras para que tu público entienda la idea principal.', 1430, 0, 760, { s:38 });
    const y = apilar([[a, 40], [b]], 520, 40);
    presCaja(t, '💡 Dato clave: escribe aquí algo importante.', 1430, y + 120, { w:760, h:150, anchoMax:690, tam:36, peso:'600', izq:true });
  }},
  { id:'tres', notas:'Presenta las tres ideas en orden; dedica más tiempo a la más importante.', nombre:'Tres ideas', crear(t){
    const c = fondoPres(t, 'normal');
    presTitulo(t, c, 'Tres ideas principales');
    [['Foco', 'Primera idea'], ['Libro', 'Segunda idea'], ['Palomita', 'Tercera idea']].forEach(([ic, tit], i) => {
      const x = 400 + i * 560, col = [t.pri, t.sec, t.acento][i];
      presCaja(t, tit + '\nExplica aquí la idea con pocas palabras.', x, 690, { w:480, h:420, anchoMax:410, tam:38 });
      CIRC(x, 480, 80, col);
      ICONO(ic, x, 480, 90, sobre(col));
    });
  }},
  { id:'comparar', notas:'Explica primero en qué se parecen y después en qué se diferencian.\nCierra con tu conclusión.', nombre:'Comparación', crear(t){
    const c = fondoPres(t, 'normal');
    presTitulo(t, c, 'Comparación');
    [[520, 'Opción A', t.pri], [1400, 'Opción B', t.sec]].forEach(([x, tit, col]) => {
      presCaja(t, '• Característica importante\n• Ventaja o diferencia\n• Un ejemplo concreto', x, 650, { w:780, h:520, anchoMax:680, tam:46, izq:true });
      nodo('pildora', tit, x, 390, { w:320, h:84, fill:col, color:sobre(col), tam:36, fuente:t.tit, peso:'700' });
    });
  }},
  { id:'datos', notas:'Di de dónde salen los datos (fuente y fecha).\nSeñala el dato más importante y qué significa.', nombre:'Datos y gráfica', crear(t){
    const c = fondoPres(t, 'normal');
    presTitulo(t, c, 'Lo que dicen los datos');
    GRAFICA('barras', 700, 640, 1080, 640, [{e:'Grupo A',v:42},{e:'Grupo B',v:65},{e:'Grupo C',v:30},{e:'Grupo D',v:78}], { titulo:'Título de la gráfica', paleta:t.paleta });
    presCaja(t, '78%\nde los participantes dijo que sí', 1520, 470, { w:520, h:260, anchoMax:450, tam:44, peso:'600' });
    presCaja(t, '3 de cada 5\nprefieren la opción B', 1520, 810, { w:520, h:260, anchoMax:450, tam:44, peso:'600' });
  }},
  { id:'proceso', notas:'Recorre los pasos en orden. Menciona qué pasa si se omite alguno.', nombre:'Proceso en pasos', crear(t){
    const c = fondoPres(t, 'normal');
    presTitulo(t, c, '¿Cómo funciona?');
    const cols = [t.pri, t.sec, t.acento, t.pri], pasos = [];
    [330, 750, 1170, 1590].forEach((x, i) => {
      pasos.push(nodo('circulo', String(i + 1), x, 500, { w:190, h:190, fill:cols[i], color:sobre(cols[i]), tam:72, fuente:t.tit, peso:'700' }));
      presTexto(t, c, 'Paso ' + (i + 1) + '\nQué pasa en este paso.', x, 770, 380, { al:'center', s:38, c:c.texto });
    });
    for (let i = 0; i < 3; i++) unir(pasos[i], pasos[i + 1], { color:c.suave, ancho:6, estilo:'recta', lados:['der', 'izq'] });
  }},
  { id:'cita', notas:'Lee la cita despacio, di quién la dijo y por qué la elegiste.', nombre:'Frase o cita', crear(t){
    const c = fondoPres(t, 'libre');
    const a = T('“', 960, 0, { f:'Playfair Display', s:300, b:'700', c:c.acento, w:400, lh:0.8 });
    const b = T('Escribe aquí una frase importante, una definición o una cita que resuma tu tema.', 960, 0, { f:t.tit, s:68, b:t.titPeso, c:c.texto, w:1400, lh:1.2, it:t.id === 'formal' });
    const d = presTexto(t, c, '— Nombre del autor', 960, 0, 1000, { al:'center', s:38 });
    apilar([[a, 10], [b, 50], [d]], 560, 30);
  }},
  { id:'final', notas:'Resume en una frase lo más importante.\nAgradece y abre espacio para preguntas.', nombre:'Gracias / preguntas', crear(t){
    const c = fondoPres(t, 'final'), z = t.zona || { x:960, w:1500 };
    const a = T('¡Gracias!', z.x, 0, { f:t.tit, s:170, b:t.titPeso, c:c.texto, w:z.w, lh:1 });
    const b = T('¿Tienen alguna pregunta?', z.x, 0, { f:t.cuerpo, s:46, c:c.suave, w:z.w });
    const y = apilar([[a, 40], [b, 60]], 480, 30);
    nodo('pildora', 'tu.correo@escuela.edu.mx', z.x, y + 38, { w:620, h:76, fill:c.acento, color:sobre(c.acento), tam:28, fuente:t.cuerpo, peso:'600' });
  }}
];
// Crea una diapositiva en un lienzo invisible y devuelve su contenido (para insertarla como página)
function diapositivaJSON(tema, diapo, conAnim){
  const tam = [1920, 1080];
  const el = document.createElement('canvas');
  const tmp = new fabric.Canvas(el, { width:tam[0], height:tam[1], enableRetinaScaling:false, renderOnAddRemove:false, preserveObjectStacking:true });
  const prev = { canvas, W, H, zoom, restaurando };
  generandoVista = true; canvas = tmp; W = tam[0]; H = tam[1]; zoom = 1; restaurando = true;
  let json = null;
  try {
    tmp.backgroundColor = '#ffffff';
    diapo.crear(tema); ordenarVinculos(); tmp.discardActiveObject();
    if (conAnim) animarObjetos(tmp.getObjects(), PRESETS_ANIM[tema.anim] || PRESETS_ANIM.dinamica);
    json = tmp.toJSON(EXTRA);
    if (diapo.notas) json.notas = diapo.notas;
  } finally {
    canvas = prev.canvas; W = prev.W; H = prev.H; zoom = prev.zoom; restaurando = prev.restaurando; generandoVista = false;
    try { tmp.dispose(); } catch(_){}
  }
  return json;
}
function usarPresentacion(tema){
  const hayAlgo = paginas.length > 1 || canvas.getObjects().length;
  if (hayAlgo && !confirm('Se creará una presentación de ' + DIAPOS.length + ' diapositivas con el tema “' + tema.nombre + '”.\nEsto reemplazará TODO tu diseño actual (todas las páginas). ¿Continuar?')) return;
  cargando(true);
  setTimeout(() => {
    try {
      const nuevas = DIAPOS.map(d => diapositivaJSON(tema, d, true));
      fijarTamano(1920, 1080);
      paginas = nuevas; miniaturas = []; actual = 0;
      presConfig = { ...presConfig, tema:tema.id, transicion:tema.trans };
      if ($('nombreDiseno').value === 'Mi diseño') $('nombreDiseno').value = 'Mi presentación';
      cargarPaginaActual(true);
      setTimeout(ajustarZoom, 60);
      toast('Presentación lista: ' + nuevas.length + ' diapositivas con animaciones. Pulsa ▶ Presentar para verla.');
    } catch (e) { console.error(e); toast('No se pudo crear la presentación: ' + e.message); }
    finally { cargando(false); }
  }, 30);
}
// ---------- Ventana "Agregar diapositiva con diseño" ----------
let temaDiapo = null;
const vistasDiapo = {};
function abrirDiapositivas(){
  temaDiapo = TEMAS_PRES[presConfig.tema] || temaDiapo || TEMAS_PRES.escolar;
  $('temasDiapo').innerHTML = '';
  Object.values(TEMAS_PRES).forEach(t => {
    const ch = document.createElement('button'); ch.className = 'chip' + (t === temaDiapo ? ' on' : ''); ch.textContent = t.nombre;
    ch.onclick = () => { temaDiapo = t; [...$('temasDiapo').children].forEach(x => x.classList.toggle('on', x === ch)); renderDiapositivas(); };
    $('temasDiapo').appendChild(ch);
  });
  $('avisoDiapo').hidden = (W === 1920 && H === 1080);
  abrirModal('mDiapositiva'); renderDiapositivas();
}
function renderDiapositivas(){
  const g = $('gridDiapo'); g.innerHTML = '';
  const t = temaDiapo, pend = [];
  DIAPOS.forEach(d => {
    const b = document.createElement('button'); b.className = 'tarjetaPl'; b.title = d.nombre;
    const clave = t.id + '/' + d.id;
    b.innerHTML = `<div class="mini" style="aspect-ratio:16/9">${vistasDiapo[clave] ? `<img src="${vistasDiapo[clave]}" alt="">` : 'Preparando…'}</div><span>${esc(d.nombre)}</span>`;
    b.onclick = () => insertarDiapositiva(t, d);
    if (!vistasDiapo[clave]) pend.push([clave, d, b]);
    g.appendChild(b);
  });
  (async () => {
    for (const [clave, d, b] of pend){
      await new Promise(r => setTimeout(r, 20));
      if (temaDiapo !== t) return;
      vistasDiapo[clave] = vistaDe([1920, 1080], () => d.crear(t));
      if (vistasDiapo[clave]) b.querySelector('.mini').innerHTML = `<img src="${vistasDiapo[clave]}" alt="">`;
    }
  })();
}
function insertarDiapositiva(t, d){
  const vacio = paginas.length === 1 && !canvas.getObjects().length;
  if (!(W === 1920 && H === 1080)){
    if (!vacio && !confirm('Las diapositivas con diseño son de 16:9 (1920 × 1080) y tu diseño mide ' + W + ' × ' + H + '.\n¿Cambiar el tamaño de todo el diseño a 1920 × 1080?')) return;
    guardarPaginaActual(); cambiarTamano(1920, 1080);
  }
  guardarPaginaActual();
  const json = diapositivaJSON(t, d, true);
  if (vacio){ paginas[0] = json; miniaturas = []; }
  else { paginas.splice(actual + 1, 0, json); miniaturas.splice(actual + 1, 0, undefined); actual++; }
  if (!presConfig.tema) presConfig = { ...presConfig, tema:t.id };
  cerrarModal('mDiapositiva'); cargarPaginaActual(true);
  toast('Diapositiva “' + d.nombre + '” agregada');
}

/* =========================================================
   PLANTILLAS DE DERECHO
   ========================================================= */
const CAT_DER = 'Derecho';
const DER = { navy:'#0f2747', oro:'#b8862b', crema:'#f8f6f1', gris:'#5b6b80', claro:'#e8edf5', oroClaro:'#f3e7cf' };
function POLI(pts, fill, o = {}){
  const p = new fabric.Polygon(pts.map(([x, y]) => ({ x, y })), { fill, stroke:o.stroke || null, strokeWidth:o.sw || 0, name:o.nombre || 'Figura', id:nuevoId() });
  canvas.add(p); return p;
}
ORGANIZADORES.push(
  { nombre:'Proceso judicial (línea del tiempo)', cat:CAT_DER, tam:[1920,1080], crear(){
    FONDO(DER.crema);
    T('ETAPAS DEL PROCESO JUDICIAL', 960, 92, { f:'Playfair Display', s:64, b:'700', c:DER.navy, w:1500 });
    T('Juicio ordinario civil · cambia las etapas según la materia', 960, 160, { f:'Inter', s:28, c:DER.gris, w:1400 });
    ICONO('Balanza', 1810, 100, 90, DER.oro);
    LINEA(110, 560, 1810, 560, DER.navy, 8);
    const etapas = [['Demanda','El actor presenta su escrito inicial'], ['Emplazamiento','Se notifica y llama a juicio al demandado'], ['Contestación','El demandado responde y opone excepciones'],
      ['Pruebas','Ofrecimiento, admisión y desahogo'], ['Alegatos','Las partes formulan sus conclusiones'], ['Sentencia','El juez resuelve el fondo del asunto'], ['Recursos','Apelación o, en su caso, amparo']];
    etapas.forEach(([tit, txt], i) => {
      const x = 200 + i * 253, arriba = i % 2 === 0, col = arriba ? DER.navy : DER.oro;
      const punto = nodo('circulo', String(i + 1), x, 560, { w:96, h:96, fill:col, color:'#ffffff', tam:40, fuente:'Playfair Display', peso:'700' });
      const caja = nodo('redondo', tit + '\n' + txt, x, arriba ? 330 : 800, { w:240, h:200, anchoMax:210, fill:'#ffffff', stroke:col, grosor:3, color:DER.navy, tam:25, fuente:'Inter' });
      unir(punto, caja, { flecha:false, color:col, ancho:4 });
    });
    T('Escribe aquí el fundamento legal (por ejemplo, los artículos del código procesal aplicable).', 960, 1010, { f:'Inter', s:24, it:true, c:DER.gris, w:1500 });
  }},
  { nombre:'Ficha de jurisprudencia', cat:CAT_DER, tam:[1240,1754], crear(){
    FONDO('#ffffff');
    canvas.add(new fabric.Rect({ left:0, top:0, width:1240, height:230, fill:DER.navy, name:'Encabezado', id:nuevoId() }));
    RECT(0, 230, 1240, 10, DER.oro);
    ICONO('Ley (artículo)', 140, 115, 110, DER.oro);
    T('FICHA DE JURISPRUDENCIA', 680, 92, { f:'Playfair Display', s:60, b:'700', c:'#ffffff', w:900 });
    T('Materia · Nombre del alumno · Fecha', 680, 160, { f:'Inter', s:26, c:'#cbd5e1', w:900 });
    const campo = (t, x, y, w, h, tam) => izquierda(nodo('redondo', t, x, y, { w, h, anchoMax:w - 50, fill:'#ffffff', stroke:'#cbd5e1', grosor:2, color:DER.navy, tam:tam || 27, fuente:'Inter' }));
    campo('Rubro: escribe aquí el rubro (título) de la tesis', 620, 340, 1100, 120, 30);
    [['Registro digital:', 'Época:'], ['Instancia:', 'Tipo: tesis aislada / jurisprudencia'], ['Materia(s):', 'Tesis (clave):']].forEach((par, f) =>
      par.forEach((t, c) => campo(t, 340 + c * 560, 480 + f * 100, 540, 80)));
    const titulo = (t, y) => nodo('pildora', t, 230, y, { w:340, h:62, fill:DER.oro, color:'#ffffff', tam:26, fuente:'Inter', peso:'700' });
    titulo('Texto (resumen)', 820); campo('Resume con tus palabras qué dice la tesis: el supuesto, el criterio y la razón.', 620, 990, 1100, 270);
    titulo('Precedentes', 1180); campo('Asuntos de los que deriva (número de expediente, fecha, votación).', 620, 1290, 1100, 150);
    titulo('Mi comentario', 1420); campo('¿Cómo se aplica a tu caso o tema? ¿Estás de acuerdo con el criterio?', 620, 1560, 1100, 230);
  }},
  { nombre:'Mapa de un caso', cat:CAT_DER, tam:[1920,1080], crear(){
    FONDO(DER.crema); fondoPapel('puntos', DER.crema);
    T('ANÁLISIS DE CASO', 960, 80, { f:'Playfair Display', s:58, b:'700', c:DER.navy, w:1200 });
    const centro = nodo('circulo', 'Caso:\nnombre del caso', 960, 560, { w:300, h:300, fill:DER.navy, color:'#ffffff', tam:34, fuente:'Playfair Display', peso:'700' });
    const ramas = [['Hechos', '¿Qué pasó? Cronología breve', 420, 300], ['Partes', 'Actor, demandado, terceros', 1500, 300],
      ['Pretensiones', '¿Qué pide cada parte?', 330, 590], ['Problema jurídico', 'La pregunta que hay que resolver', 1590, 590],
      ['Normas aplicables', 'Artículos, leyes y tesis', 420, 870], ['Resolución', 'Cómo se resolvió y por qué', 1500, 870]];
    ramas.forEach(([tit, txt, x, y], i) => {
      const col = i % 2 ? DER.oro : '#1e3a8a';
      const n = nodo('redondo', tit + '\n' + txt, x, y, { w:430, h:170, anchoMax:380, fill:'#ffffff', stroke:col, grosor:4, color:DER.navy, tam:28, fuente:'Inter' });
      unir(centro, n, { flecha:false, color:col, ancho:5, estilo:'curva' });
    });
  }},
  { nombre:'Cuadro comparativo de normas', cat:CAT_DER, tam:[1920,1080], crear(){
    FONDO('#ffffff');
    T('CUADRO COMPARATIVO', 960, 90, { f:'Playfair Display', s:60, b:'700', c:DER.navy, w:1400 });
    T('Compara artículos, leyes o figuras jurídicas', 960, 155, { f:'Inter', s:28, c:DER.gris, w:1400 });
    crearTabla(960, 610, 5, 4, { sep:8, rx:10, borde:'#cbd5e1', grosor:2, enc:[DER.navy, DER.navy, DER.navy, DER.oro], encTexto:'#ffffff',
      filasColores:[DER.claro], celda:'#ffffff', fuente:'Inter', fuenteEnc:'Inter', anchos:[320,480,480,440], alto:150, altoEnc:96, tam:24, tamEnc:30 },
      [['Aspecto', 'Norma / Ley A', 'Norma / Ley B', 'Diferencia clave'], ['Artículo(s)'], ['Supuesto'], ['Consecuencia jurídica'], ['Sujetos']]);
  }},
  { nombre:'Teoría del delito', cat:CAT_DER, tam:[1920,1080], crear(){
    FONDO(DER.crema);
    T('TEORÍA DEL DELITO', 960, 90, { f:'Playfair Display', s:62, b:'700', c:DER.navy, w:1400 });
    T('Elementos positivos (escalones) y su aspecto negativo (abajo)', 960, 155, { f:'Inter', s:28, c:DER.gris, w:1400 });
    const el = [['Conducta','Ausencia de conducta'], ['Tipicidad','Atipicidad'], ['Antijuridicidad','Causas de justificación'], ['Culpabilidad','Inculpabilidad'], ['Punibilidad','Excusas absolutorias']];
    const cols = ['#1e3a8a', '#1d4ed8', '#0f2747', '#7c5a1e', DER.oro];
    el.forEach(([pos, neg], i) => {
      const x = 260 + i * 350, alto = 180 + i * 85, base = 820;
      nodo('redondo', pos, x, base - alto / 2, { w:330, h:alto, fill:cols[i], color:'#ffffff', tam:32, fuente:'Inter', peso:'700' });
      nodo('pildora', neg, x, 920, { w:320, h:76, anchoMax:290, fill:'#ffffff', stroke:cols[i], grosor:3, color:DER.navy, tam:22, fuente:'Inter' });
    });
    T('Si falta un elemento, no hay delito: analízalos en orden.', 960, 1020, { f:'Inter', s:24, it:true, c:DER.gris, w:1500 });
  }},
  { nombre:'Pirámide jurídica (jerarquía normativa)', cat:CAT_DER, tam:[1920,1080], crear(){
    FONDO('#ffffff');
    T('JERARQUÍA NORMATIVA', 960, 80, { f:'Playfair Display', s:58, b:'700', c:DER.navy, w:1400 });
    const niveles = ['Constitución y tratados internacionales de derechos humanos', 'Leyes generales y tratados internacionales', 'Leyes federales y leyes locales',
      'Reglamentos', 'Normas individualizadas (sentencias, contratos, resoluciones)'];
    const cols = [DER.oro, '#1e3a8a', '#1d4ed8', '#3b82f6', '#93c5fd'], top = 150, alto = 170, cx = 960, ancho0 = 300, ancho1 = 1700;
    niveles.forEach((t, i) => {
      const y0 = top + i * alto, y1 = y0 + alto - 8;
      const w0 = ancho0 + (ancho1 - ancho0) * (i / niveles.length), w1 = ancho0 + (ancho1 - ancho0) * ((i + 1) / niveles.length);
      if (i === 0) POLI([[cx, y0], [cx + w1 / 2, y1], [cx - w1 / 2, y1]], cols[i], { nombre:'Nivel 1' });
      else POLI([[cx - w0 / 2, y0], [cx + w0 / 2, y0], [cx + w1 / 2, y1], [cx - w1 / 2, y1]], cols[i], { nombre:'Nivel ' + (i + 1) });
      T(t, cx, i === 0 ? y0 + alto * 0.66 : (y0 + y1) / 2, { f:'Inter', s:i === 0 ? 22 : 28, b:'700', c:i >= 3 ? DER.navy : '#ffffff', w:i === 0 ? w1 * 0.55 : w0 * 0.9 });
    });
    T('Ajusta los niveles según el criterio que estudies en clase.', 960, 1030, { f:'Inter', s:22, it:true, c:DER.gris, w:1400 });
  }},
  { nombre:'Silogismo jurídico', cat:CAT_DER, tam:[1920,1080], crear(){
    FONDO(DER.crema);
    T('SILOGISMO JURÍDICO', 960, 85, { f:'Playfair Display', s:60, b:'700', c:DER.navy, w:1400 });
    const filas = [['Premisa mayor', 'La norma: “Al que cometa X se le impondrá Y” (artículo …)', DER.navy],
      ['Premisa menor', 'Los hechos: Juan realizó X el día … (pruebas …)', '#1e3a8a'],
      ['Conclusión', 'La consecuencia: a Juan se le debe imponer Y', DER.oro]];
    const cajas = filas.map(([tit, txt, col], i) => {
      nodo('pildora', tit, 390, 280 + i * 280, { w:400, h:90, fill:col, color:'#ffffff', tam:34, fuente:'Inter', peso:'700' });
      return izquierda(nodo('redondo', txt, 1180, 280 + i * 280, { w:1100, h:170, anchoMax:1020, fill:'#ffffff', stroke:col, grosor:3, color:DER.navy, tam:32, fuente:'Inter' }));
    });
    unir(cajas[0], cajas[1], { color:DER.gris, ancho:5, lados:['aba', 'arr'] });
    unir(cajas[1], cajas[2], { color:DER.gris, ancho:5, lados:['aba', 'arr'] });
  }},
  { nombre:'Portada de trabajo (Derecho)', cat:CAT_DER, tam:[1240,1754], crear(){
    FONDO('#ffffff');
    RECT(50, 50, 1140, 1654, null, { stroke:DER.navy, sw:6, nombre:'Marco' });
    RECT(72, 72, 1096, 1610, null, { stroke:DER.oro, sw:2, nombre:'Marco interior' });
    T('NOMBRE DE LA UNIVERSIDAD', 620, 210, { f:'Playfair Display', s:52, b:'700', c:DER.navy, w:1000 });
    T('Licenciatura en Derecho', 620, 290, { f:'Inter', s:32, c:DER.gris, w:1000 });
    ICONO('Balanza', 620, 470, 200, DER.oro);
    T('Materia', 620, 650, { f:'Inter', s:32, b:'600', c:DER.oro, w:1000, cs:300 });
    T('TÍTULO DEL TRABAJO', 620, 790, { f:'Playfair Display', s:72, b:'700', c:DER.navy, w:1000, lh:1.1 });
    DECO('subrayado', 620, 880, 300, { c:DER.oro, sw:5 });
    [['Presenta:', 'Nombre completo del alumno'], ['Docente:', 'Nombre del profesor'], ['Grupo:', '0000']].forEach(([a, b], i) => {
      T(a, 620, 1060 + i * 120, { f:'Inter', s:26, c:DER.gris, w:900 });
      T(b, 620, 1100 + i * 120, { f:'Inter', s:34, b:'600', c:DER.navy, w:900 });
    });
    T('Ciudad de México, fecha de entrega', 620, 1560, { f:'Inter', s:28, c:DER.gris, w:1000 });
  }}
);

/* =========================================================
   CATÁLOGO DE PLANTILLAS CON VISTA PREVIA
   ========================================================= */
// Dibuja una plantilla en un lienzo invisible y devuelve su miniatura (no toca tu diseño)
function vistaDe(tam, crear){
  const el = document.createElement('canvas');
  const tmp = new fabric.Canvas(el, { width:tam[0], height:tam[1], enableRetinaScaling:false, renderOnAddRemove:false, preserveObjectStacking:true });
  const prev = { canvas, W, H, zoom, restaurando };
  generandoVista = true; canvas = tmp; W = tam[0]; H = tam[1]; zoom = 1; restaurando = true;
  let url = '';
  try {
    tmp.backgroundColor = '#ffffff';
    crear(); ordenarVinculos(); tmp.discardActiveObject(); tmp.renderAll();
    url = tmp.toDataURL({ format:'jpeg', quality:0.85, multiplier: 520 / Math.max(tam[0], tam[1]) });
  } catch (e) { console.warn('No se pudo generar la vista previa', e); }
  finally {
    canvas = prev.canvas; W = prev.W; H = prev.H; zoom = prev.zoom; restaurando = prev.restaurando; generandoVista = false;
    try { tmp.dispose(); } catch(_){}
  }
  return url;
}
const CATALOGO = [];
ORGANIZADORES.forEach(o => CATALOGO.push({ nombre:o.nombre, cat:o.cat, tam:o.tam, crear:o.crear, usar:() => usarOrganizador(o) }));
DIAGRAMAS.forEach((d, i) => CATALOGO.push({ nombre:d.nombre, cat: d.nombre.startsWith('Mapa') ? CAT_MAPAS : CAT_PROC, tam:d.tam, crear:d.crear,
  usar:() => $('listaDiagramas').children[i].click() }));
PLANTILLAS.forEach((p, i) => CATALOGO.push({ nombre:p.nombre, cat:CAT_PORT, tam:p.tam || [1080,1080], crear:p.crear,
  usar:() => $('listaPlantillas').children[i].click() }));
Object.values(TEMAS_PRES).forEach(t => CATALOGO.push({ nombre:t.nombre + ' · ' + DIAPOS.length + ' diapositivas', cat:CAT_PRES, tam:[1920,1080],
  crear:() => DIAPOS[0].crear(t), usar:() => usarPresentacion(t) }));
const CAT_MIAS = 'Mis plantillas';
const CATEGORIAS = [CAT_MIAS, CAT_PRES, CAT_DER, CAT_MAPAS, CAT_TABLAS, CAT_PROC, CAT_INFO, CAT_PORT];
let catActiva = 'Todas';
const sinAcentos = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function renderCatalogo(){
  const q = sinAcentos($('buscarPlantilla').value.trim());
  const cont = $('catalogo'); cont.innerHTML = '';
  CATEGORIAS.forEach(cat => {
    if (catActiva !== 'Todas' && catActiva !== cat) return;
    const items = CATALOGO.filter(it => it.cat === cat && (!q || sinAcentos(it.nombre + ' ' + it.cat).includes(q)));
    if (!items.length){
      if (cat === CAT_MIAS && !q && catActiva === CAT_MIAS) cont.innerHTML = '<p class="hint">Aún no tienes plantillas propias. Diseña algo y pulsa “Guardar esta página como mi plantilla”.</p>';
      return;
    }
    const h4 = document.createElement('h4'); h4.textContent = cat; cont.appendChild(h4);
    if (cat === CAT_PRES){
      const bd = document.createElement('button'); bd.className = 'bigbtn'; bd.dataset.queda = '1'; bd.style.textAlign = 'center';
      bd.textContent = '＋ Agregar una diapositiva con diseño'; bd.onclick = abrirDiapositivas; cont.appendChild(bd);
    }
    const grid = document.createElement('div'); grid.className = 'gridPl';
    items.forEach(it => {
      const b = document.createElement('button'); b.className = 'tarjetaPl'; b.title = it.nombre;
      b.innerHTML = `<div class="mini">${it.vista ? `<img src="${it.vista}" alt="">` : 'Preparando…'}</div><span>${esc(it.nombre)}</span>`;
      b.onclick = () => { $('vistaGrande').style.display = 'none'; it.usar(); };
      if (it.borrar){
        const x = document.createElement('span'); x.className = 'borrar'; x.textContent = '✕'; x.title = 'Eliminar mi plantilla';
        x.onclick = ev => { ev.stopPropagation(); it.borrar(); };
        b.appendChild(x);
      }
      b.onmouseenter = () => {
        if (!it.vista) return;
        const vg = $('vistaGrande'), r = b.getBoundingClientRect();
        vg.querySelector('img').src = it.vista; vg.querySelector('div').textContent = it.nombre;
        vg.style.display = 'block';
        vg.style.top = Math.max(10, Math.min(window.innerHeight - vg.offsetHeight - 10, r.top - 40)) + 'px';
      };
      b.onmouseleave = () => { $('vistaGrande').style.display = 'none'; };
      it.boton = b;
      grid.appendChild(b);
    });
    cont.appendChild(grid);
  });
  if (!cont.children.length) cont.innerHTML = '<p class="hint">No hay plantillas con ese nombre.</p>';
}
['Todas', ...CATEGORIAS].forEach(cat => {
  const c = document.createElement('button'); c.className = 'chip' + (cat === 'Todas' ? ' on' : '');
  c.textContent = cat === CAT_MAPAS ? 'Mapas' : cat === CAT_TABLAS ? 'Tablas' : cat === CAT_PROC ? 'Procesos' : cat === CAT_PORT ? 'Portadas' : cat === CAT_INFO ? 'Infografías' : cat === CAT_MIAS ? '★ Mías' : cat === CAT_PRES ? '▶ Presentaciones' : cat === CAT_DER ? '⚖ Derecho' : cat;
  c.onclick = () => { catActiva = cat; document.querySelectorAll('#chipsCat .chip').forEach(x => x.classList.toggle('on', x === c)); renderCatalogo(); };
  $('chipsCat').appendChild(c);
});
$('buscarPlantilla').addEventListener('input', renderCatalogo);
renderCatalogo();
// Genera las miniaturas poco a poco para no trabar la app
async function generarVistas(){
  for (const it of CATALOGO){
    if (it.vista || !it.crear) continue;
    await new Promise(r => setTimeout(r, 25));
    it.vista = vistaDe(it.tam, it.crear);
    if (it.boton && it.vista) it.boton.querySelector('.mini').innerHTML = `<img src="${it.vista}" alt="">`;
  }
}

/* =========================================================
   MIS PLANTILLAS (se guardan en este navegador)
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
      if (!confirm('¿Eliminar tu plantilla “' + p.nombre + '”? (Se manda a la papelera (se borra de este navegador))')) return;
      gs('eliminarProyecto', p.id).then(() => { agregarMisPlantillas(lista.filter(x => x.id !== p.id)); toast('Plantilla eliminada'); });
    };
    CATALOGO.unshift(it);
  });
  renderCatalogo();
}
async function cargarMisPlantillas(){
  try { const lista = await gs('listarPlantillas'); if (Array.isArray(lista)) agregarMisPlantillas(lista); } catch(e){}
}

/* =========================================================
   ANIMACIONES (configuración)
   ========================================================= */
const TIPOS_ANIM = [['ninguna','Sin animación'],['aparecer','Aparecer'],['arriba','Deslizar hacia arriba'],['abajo','Deslizar hacia abajo'],
  ['izquierda','Entrar por la izquierda'],['derecha','Entrar por la derecha'],['zoom','Acercar'],['rebote','Rebotar'],['girar','Girar'],['escribir','Escribir (texto)']];
$('aTipo').innerHTML = TIPOS_ANIM.map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
function objetivosAnim(){
  const lst = [];
  canvas.getActiveObjects().forEach(x => { const b = nodoBase(x); if (b && !b.esFondo && !lst.includes(b)) lst.push(b); });
  return lst;
}
const ordenSiguiente = () => Math.max(0, ...canvas.getObjects().map(o => (o.anim && o.anim.orden) || 0)) + 1;
function aplicarAnimacion(campos){
  const lst = objetivosAnim(); if (!lst.length) return;
  const existente = lst.find(o => o.anim);
  const orden = existente ? existente.anim.orden : ordenSiguiente();
  lst.forEach(o => {
    if (campos.tipo === 'ninguna'){ o.anim = null; return; }
    o.anim = { tipo:'arriba', inicio:'despues', duracion:700, retraso:0, orden, ...(o.anim || {}), ...campos };
  });
  actualizarPanelAnim(); guardarEstado();
}
function actualizarPanelAnim(){
  const o = activo(); if (!o) return;
  const b = nodoBase(o.type === 'activeSelection' ? (o.getObjects().find(x => !x.textoDe) || o.getObjects()[0]) : o);
  const a = (b && b.anim) || null;
  $('aTipo').value = a ? a.tipo : 'ninguna';
  $('aDetalles').hidden = !a;
  if (a){ $('aInicio').value = a.inicio; $('aDur').value = a.duracion; $('aRet').value = a.retraso; $('aOrden').value = a.orden; }
}
$('aTipo').addEventListener('change', e => aplicarAnimacion({ tipo:e.target.value }));
$('aInicio').addEventListener('change', e => aplicarAnimacion({ inicio:e.target.value }));
$('aDur').addEventListener('change', e => aplicarAnimacion({ duracion:+e.target.value }));
$('aRet').addEventListener('change', e => aplicarAnimacion({ retraso:+e.target.value }));
$('aOrden').addEventListener('change', e => aplicarAnimacion({ orden:Math.max(1, +e.target.value || 1) }));
canvas.on('selection:created', actualizarPanelAnim);
canvas.on('selection:updated', actualizarPanelAnim);

const PRESETS_ANIM = {
  dinamica:  { tipo:'arriba',   inicio:'despues', duracion:650 },
  suave:     { tipo:'aparecer', inicio:'despues', duracion:600 },
  divertida: { tipo:'rebote',   inicio:'despues', duracion:700 },
  zoom:      { tipo:'zoom',     inicio:'despues', duracion:600 },
  clic:      { tipo:'arriba',   inicio:'clic',    duracion:600 }
};
// Pone animación a todo lo de una lista de objetos, de arriba hacia abajo y de izquierda a derecha
function animarObjetos(objs, preset){
  const cand = objs.filter(o => !o.esFondo && !o.textoDe && o.type !== 'conector' && o.visible !== false);
  const caja = o => o.getBoundingRect(true, true);
  cand.sort((a, b) => { const ra = caja(a), rb = caja(b); return (Math.round(ra.top / 60) - Math.round(rb.top / 60)) || ((a.esDeco ? 1 : 0) - (b.esDeco ? 1 : 0)) || (ra.left - rb.left); });
  const tablas = {};
  let n = 0;
  cand.forEach(o => {
    if (o.tabla){                                  // las celdas de una tabla aparecen juntas
      if (!tablas[o.tabla]) tablas[o.tabla] = ++n;
      o.anim = { ...preset, retraso:0, orden:tablas[o.tabla], inicio: preset.inicio === 'clic' ? 'clic' : 'despues' };
      return;
    }
    n++;
    o.anim = { ...preset, retraso:0, orden:n, inicio: o.esDeco && n > 1 ? 'con' : preset.inicio };   // las decoraciones salen junto con lo anterior
  });
}
function cambiarPaginas(todas, fn){
  paginas[actual] = jsonPagina();
  const indices = todas ? paginas.map((_, i) => i) : [actual];
  return Promise.all(indices.map(i => i === actual ? Promise.resolve() : new Promise(ok => {
    const sc = new fabric.StaticCanvas(document.createElement('canvas'), { width:W, height:H, renderOnAddRemove:false });
    sc.loadFromJSON(paginas[i] || PAGINA_VACIA(), () => { fn(sc.getObjects()); const nt = paginas[i] && paginas[i].notas; paginas[i] = sc.toJSON(EXTRA); if (nt) paginas[i].notas = nt; sc.dispose(); ok(); });
  }))).then(() => { fn(canvas.getObjects()); canvas.requestRenderAll(); guardarEstado(); actualizarPanelAnim(); });
}
function animarPaginas(todas){
  const preset = PRESETS_ANIM[$('pEstiloAnim').value];
  cambiarPaginas(todas, objs => animarObjetos(objs, preset)).then(() => toast(todas ? 'Se animaron todas las páginas' : 'Se animó esta página'));
}
function quitarAnimaciones(){
  cambiarPaginas(true, objs => objs.forEach(o => { o.anim = null; })).then(() => toast('Se quitaron las animaciones'));
}

/* =========================================================
   PRESENTACIÓN EN PANTALLA COMPLETA
   ========================================================= */
let pres = null;
function iniciarPresentacion(conVista){
  const vistaOk = conVista ? abrirVentanaPresentador() : false;   // se abre aquí, justo con el clic, para que el navegador lo permita
  presConfig = { ...presConfig, transicion:$('pTrans').value, avance:$('pAvance').value, segundos:Math.max(1, +$('pSeg').value || 6) };
  guardarEstado();
  cerrarModal('mPresentar');
  presentar($('pDesde').value === 'actual' ? actual : 0, false, conVista && !vistaOk);
}
['pAvance'].forEach(id => $(id).addEventListener('change', () => $('filaSeg').style.display = $('pAvance').value === 'auto' ? 'flex' : 'none'));
document.querySelector('[onclick="abrirModal(\'mPresentar\')"]').addEventListener('click', () => {
  $('pTrans').value = presConfig.transicion; $('pAvance').value = presConfig.avance; $('pSeg').value = presConfig.segundos;
  $('filaSeg').style.display = presConfig.avance === 'auto' ? 'flex' : 'none';
});
async function presentar(desde, soloEsta, verNotas){
  if (activo() && activo().isEditing) activo().exitEditing();
  if (canvas.isDrawingMode) activarDibujo(null);
  canvas.discardActiveObject(); canvas.requestRenderAll();
  paginas[actual] = jsonPagina();
  pres = { i:-1, cur:null, timers:[], fin:false, lista: soloEsta ? [desde] : paginas.map((_, k) => k) };
  reiniciarTiempo(); pres.reloj = setInterval(pintarTiempo, 500); prepararImagenesPres();
  pres.verNotas = !!verNotas; $('presNotas').style.display = pres.verNotas ? 'block' : 'none';
  $('presentacion').style.display = 'block'; $('presFin').style.display = 'none';
  const yo = pres;
  try { if (!document.fullscreenElement){ await $('presentacion').requestFullscreen(); yo.fs = true; } } catch(e){}
  await new Promise(r => setTimeout(r, 120));
  irA(soloEsta ? 0 : desde, false, 1);
  bucleRender();
  mostrarControles();
}
function salirPresentacion(){
  if (!pres) return;
  pres.timers.forEach(clearTimeout); clearTimeout(pres.auto); clearInterval(pres.reloj);
  const v = ventanaAbierta(); if (v) try { v.close(); } catch(e){}
  ventanaPres = null;
  if (pres.cur) pres.cur.sc.dispose();
  $('presEscenario').innerHTML = ''; $('presentacion').style.display = 'none';
  pres = null;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
// si la persona sale de pantalla completa (por ejemplo con Esc del navegador) se cierra la presentación
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && pres && pres.fs) salirPresentacion(); });
function bucleRender(){
  if (!pres) return;
  if (pres.cur && pres.cur.animando > 0) pres.cur.sc.renderAll();
  requestAnimationFrame(bucleRender);
}
// Crea la diapositiva i ajustada a la pantalla
function construirDiapositiva(i, cb){
  const sw = window.innerWidth, sh = window.innerHeight, z = Math.min(sw / W, sh / H);
  const wrap = document.createElement('div'); wrap.className = 'diapo';
  const el = document.createElement('canvas'); wrap.appendChild(el);
  $('presEscenario').appendChild(wrap);
  const sc = new fabric.StaticCanvas(el, { width:Math.round(W * z), height:Math.round(H * z), renderOnAddRemove:false });
  sc.loadFromJSON(paginas[i] || PAGINA_VACIA(), () => {
    sc.setZoom(z);
    const d = { i, wrap, sc, pasos:prepararPasos(sc), paso:0, animando:0 };
    sc.renderAll();
    cb(d);
  });
}
// Arma la secuencia de animaciones de la página: pasos que empiezan con clic y su línea de tiempo
function prepararPasos(sc){
  const objs = sc.getObjects(), porIdP = {};
  objs.forEach(o => { if (o.id) porIdP[o.id] = o; });
  const animados = objs.filter(o => o.anim && o.anim.tipo && o.anim.tipo !== 'ninguna' && !o.esFondo)
    .sort((a, b) => ((a.anim.orden || 0) - (b.anim.orden || 0)) || (objs.indexOf(a) - objs.indexOf(b)));
  const pasos = []; let paso = null, prevIni = 0, prevFin = 0, ordenPrevio = null;
  animados.forEach(o => {
    const a = o.anim, dur = a.duracion || 700, ret = a.retraso || 0;
    let ini;
    const mismoGrupo = ordenPrevio !== null && a.orden === ordenPrevio;   // mismo número de orden = al mismo tiempo
    if (!paso || (a.inicio === 'clic' && !mismoGrupo)){ paso = { items:[], clic: a.inicio === 'clic' }; pasos.push(paso); ini = ret; }
    else if (a.inicio === 'con' || mismoGrupo) ini = prevIni + ret;
    else ini = prevFin + ret;
    paso.items.push({ o, a, ini, dur });
    if (!mismoGrupo) prevIni = ini;
    prevFin = Math.max(mismoGrupo ? prevFin : 0, ini + dur);
    ordenPrevio = a.orden;
  });
  const lider = new Map();
  pasos.forEach(p => p.items.forEach(it => lider.set(it.o, { p, it })));
  objs.forEach(t => {                                    // el texto de una forma aparece con su forma
    const f = t.textoDe && porIdP[t.textoDe];
    if (f && lider.has(f) && !lider.has(t)){ const L = lider.get(f); const it = { o:t, a:L.it.a, ini:L.it.ini, dur:L.it.dur }; L.p.items.push(it); lider.set(t, { p:L.p, it }); }
  });
  objs.forEach(c => {                                    // las líneas aparecen después de las formas que unen
    if (c.type !== 'conector' || lider.has(c)) return;
    const cand = [lider.get(porIdP[c.conA]), lider.get(porIdP[c.conB])].filter(Boolean);
    if (!cand.length) return;
    const ult = cand.reduce((m, x) => {
      const pm = pasos.indexOf(m.p), px = pasos.indexOf(x.p);
      return px > pm || (px === pm && x.it.ini + x.it.dur > m.it.ini + m.it.dur) ? x : m;
    });
    const it = { o:c, a:{ tipo:'aparecer' }, ini:ult.it.ini + ult.it.dur * 0.7, dur:450 };
    ult.p.items.push(it); lider.set(c, { p:ult.p, it });
  });
  pasos.forEach(p => p.items.forEach(it => {
    const o = it.o;
    if (o.originX !== 'center' || o.originY !== 'center'){ const c = o.getCenterPoint(); o.set({ originX:'center', originY:'center' }); o.setPositionByOrigin(c, 'center', 'center'); }
    it.fin = { left:o.left, top:o.top, opacity:o.opacity ?? 1, scaleX:o.scaleX, scaleY:o.scaleY, angle:o.angle || 0, text:o.text };
  }));
  return pasos;
}
function estadoInicial(it){
  const { o, a, fin:f } = it, dx = W * 0.18, dy = H * 0.18;
  const base = { opacity:0 };
  switch (a.tipo){
    case 'arriba':    Object.assign(base, { top:f.top + dy }); break;
    case 'abajo':     Object.assign(base, { top:f.top - dy }); break;
    case 'izquierda': Object.assign(base, { left:f.left - dx }); break;
    case 'derecha':   Object.assign(base, { left:f.left + dx }); break;
    case 'zoom':      Object.assign(base, { scaleX:f.scaleX * 0.3, scaleY:f.scaleY * 0.3 }); break;
    case 'rebote':    Object.assign(base, { scaleX:f.scaleX * 0.05, scaleY:f.scaleY * 0.05 }); break;
    case 'girar':     Object.assign(base, { angle:f.angle - 200, scaleX:f.scaleX * 0.2, scaleY:f.scaleY * 0.2 }); break;
    case 'escribir':  if (typeof f.text === 'string' && f.text.length){ o.set({ text:'', opacity:f.opacity }); return; } break;
  }
  o.set(base);
}
function mostrarFinal(it){ const f = it.fin; it.o.set({ left:f.left, top:f.top, opacity:f.opacity, scaleX:f.scaleX, scaleY:f.scaleY, angle:f.angle }); if (typeof f.text === 'string' && it.o.text !== undefined) it.o.set('text', f.text); }
function animarItem(d, it){
  const { o, a, fin:f, dur } = it;
  d.animando++;
  const terminar = () => { mostrarFinal(it); d.animando = Math.max(0, d.animando - 1); if (d.sc.contextContainer) d.sc.renderAll(); };
  if (a.tipo === 'escribir' && typeof f.text === 'string' && f.text.length){
    fabric.util.animate({ startValue:0, endValue:f.text.length, duration:Math.max(dur, f.text.length * 35),
      onChange: v => o.set('text', f.text.slice(0, Math.round(v))), onComplete:terminar });
    return;
  }
  const ini = { left:o.left, top:o.top, opacity:o.opacity, scaleX:o.scaleX, scaleY:o.scaleY, angle:o.angle };
  const ease = a.tipo === 'rebote' ? fabric.util.ease.easeOutBack : fabric.util.ease.easeOutCubic;
  fabric.util.animate({ startValue:0, endValue:1, duration:dur, easing:ease,
    onChange: t => {
      ['left','top','scaleX','scaleY','angle'].forEach(k => o.set(k, ini[k] + (f[k] - ini[k]) * t));
      o.set('opacity', Math.max(0, Math.min(1, ini.opacity + (f.opacity - ini.opacity) * Math.min(1, t * 1.4))));
    },
    onComplete: terminar });
}
function ejecutarPaso(d, k){
  const p = d.pasos[k]; if (!p) return 0;
  p.items.forEach(it => pres.timers.push(setTimeout(() => { if (pres && pres.cur === d) animarItem(d, it); }, it.ini)));
  d.paso = k + 1;
  return Math.max(0, ...p.items.map(it => it.ini + Math.max(it.dur, it.a.tipo === 'escribir' && typeof it.fin.text === 'string' ? it.fin.text.length * 35 : 0)));
}
function irA(i, final, dir){
  const n = pres.lista.length, idx = i;
  if (idx >= n){ pres.fin = true; $('presFin').style.display = 'flex'; actualizarPresentador(); return; }
  if (idx < 0) return;
  pres.fin = false; $('presFin').style.display = 'none';
  pres.timers.forEach(clearTimeout); pres.timers = []; clearTimeout(pres.auto);
  const pagina = pres.lista[idx];
  construirDiapositiva(pagina, d => {
    if (!pres){ d.sc.dispose(); return; }
    const viejo = pres.cur, tr = presConfig.transicion, w = d.wrap;
    if (final) d.pasos.forEach(p => p.items.forEach(mostrarFinal)), d.paso = d.pasos.length;
    else d.pasos.forEach(p => p.items.forEach(estadoInicial));
    d.sc.renderAll();
    if (viejo && tr !== 'ninguna'){
      w.style.transition = 'none'; w.style.opacity = 0;
      if (tr === 'deslizar') w.style.transform = `translateX(${dir * 100}%)`;
      if (tr === 'zoom') w.style.transform = 'scale(.82)';
      void w.offsetWidth; w.style.transition = '';
      requestAnimationFrame(() => {
        w.style.opacity = 1; w.style.transform = 'none';
        viejo.wrap.style.opacity = 0;
        if (tr === 'deslizar') viejo.wrap.style.transform = `translateX(${-dir * 100}%)`;
        if (tr === 'zoom') viejo.wrap.style.transform = 'scale(1.12)';
      });
      setTimeout(() => { viejo.wrap.remove(); viejo.sc.dispose(); }, 700);
    } else if (viejo){ viejo.wrap.remove(); viejo.sc.dispose(); }
    pres.cur = d; pres.i = idx; pres.pagina = pagina;
    $('presNum').textContent = (idx + 1) + ' / ' + n;
    actualizarPresentador();
    if (final) return;
    const espera = viejo && tr !== 'ninguna' ? 450 : 150;
    pres.timers.push(setTimeout(() => {
      if (!pres || pres.cur !== d) return;
      if (presConfig.avance === 'auto'){
        let t = 0;
        d.pasos.forEach((p, k) => { pres.timers.push(setTimeout(() => { if (pres && pres.cur === d) t = ejecutarPaso(d, k); }, t)); t += Math.max(0, ...p.items.map(it => it.ini + it.dur)) + 350; });
        pres.auto = setTimeout(() => { if (pres && pres.cur === d) irA(pres.i + 1, false, 1); }, t + presConfig.segundos * 1000);
      } else if (d.pasos.length && !d.pasos[0].clic) ejecutarPaso(d, 0);
    }, espera));
  });
}
function presSiguiente(){
  if (!pres) return;
  if (pres.fin){ salirPresentacion(); return; }
  const d = pres.cur; if (!d) return;
  if (d.paso < d.pasos.length){
    if (d.animando > 0) d.pasos.slice(0, d.paso).forEach(p => p.items.forEach(mostrarFinal));   // termina lo anterior al instante
    ejecutarPaso(d, d.paso);
  } else irA(pres.i + 1, false, 1);
}
function presAnterior(){
  if (!pres) return;
  if (pres.fin){ pres.fin = false; $('presFin').style.display = 'none'; actualizarPresentador(); return; }
  if (pres.i > 0) irA(pres.i - 1, true, -1);
}
$('presentacion').addEventListener('click', e => { if (!e.target.closest('#presControles,#presNotas')) presSiguiente(); });
function alternarPantallaCompleta(){
  if (!pres) return;
  if (document.fullscreenElement){ pres.fs = false; document.exitFullscreen().catch(() => {}); }
  else $('presentacion').requestFullscreen().then(() => { if (pres) pres.fs = true; }).catch(() => toast('Este navegador no permite pantalla completa aquí'));
}
window.addEventListener('keydown', e => {
  if (!pres) return;
  const k = e.key;
  if (['ArrowRight','PageDown',' ','Enter','ArrowDown'].includes(k)){ e.preventDefault(); presSiguiente(); }
  else if (['ArrowLeft','PageUp','ArrowUp','Backspace'].includes(k)){ e.preventDefault(); presAnterior(); }
  else if (k === 'Escape'){ e.preventDefault(); salirPresentacion(); }
  else if (k === 'n' || k === 'N'){ e.preventDefault(); alternarNotasPres(); }
  else if (k === 'Home'){ e.preventDefault(); irA(0, false, -1); }
  else if (k === 'End'){ e.preventDefault(); irA(pres.lista.length - 1, true, 1); }
  e.stopPropagation();
}, true);
let ocultarCtl;
function mostrarControles(){
  $('presControles').classList.remove('oculto');
  clearTimeout(ocultarCtl); ocultarCtl = setTimeout(() => $('presControles').classList.add('oculto'), 2500);
}
$('presentacion').addEventListener('mousemove', mostrarControles);
window.addEventListener('resize', () => { if (pres && pres.cur) irA(pres.i, true, 1); });

/* =========================================================
   TEXTO CURVO
   ========================================================= */
// Fabric no vuelve a crear la curva al abrir un diseño guardado; aquí se la devolvemos
['IText','Textbox'].forEach(clase => {
  const original = fabric[clase].fromObject;
  fabric[clase].fromObject = function(object, callback){
    if (!object.path || object.path instanceof fabric.Path) return original.call(this, object, callback);
    const copia = Object.assign({}, object), datosCurva = copia.path; delete copia.path;
    return original.call(this, copia, t => fabric.Path.fromObject(datosCurva, pth => { t.set('path', pth); t.initDimensions(); t.setCoords(); callback && callback(t); }));
  };
});
// Curva un texto: valores positivos lo arquean hacia arriba (∩), negativos hacia abajo (∪)
function aplicarCurva(o, c, silencioso){
  let t = o;
  if (!esTexto(t) || t.textoDe || t.tabla) return;
  const centro = t.getCenterPoint();
  if (t.type === 'textbox' && c){           // un texto curvo es de un solo renglón
    const datos = t.toObject(EXTRA);
    ['type','width','height','path','styles','fill','shadow'].forEach(k => delete datos[k]);
    const nuevo = new fabric.IText(t.text.replace(/\n+/g, ' '), datos);
    nuevo.set({ fill:t.fill, shadow:t.shadow });
    nuevo.id = t.id || nuevoId(); nuevo.name = t.name;
    const idx = canvas.getObjects().indexOf(t);
    restaurando = true; canvas.remove(t); canvas.insertAt(nuevo, idx); restaurando = false;
    t = nuevo; canvas.setActiveObject(t);
  }
  t.curva = c || 0;
  t.set('path', null); t.initDimensions();
  if (c){
    const w = Math.max(10, t.width), th = Math.max(0.05, Math.abs(c) / 100 * Math.PI * 1.9), r = w / th;
    const pt = f => c > 0 ? [r * Math.sin(f), r - r * Math.cos(f)] : [r * Math.sin(f), -r + r * Math.cos(f)];
    const [x0, y0] = pt(-th / 2), [x1, y1] = pt(th / 2);
    const d = `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${th > Math.PI ? 1 : 0} ${c > 0 ? 1 : 0} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    t.set({ path: new fabric.Path(d, { fill:'', stroke:'', strokeWidth:0, objectCaching:false }), textAlign:'center', objectCaching:false, padding: t.fontSize * 0.6 });
  } else t.set({ objectCaching:true, padding:4 });
  t.setPositionByOrigin(centro, 'center', 'center'); t.setCoords();
  canvas.requestRenderAll();
  if (!silencioso){ actualizarPanel(); renderCapas(); }
}
$('pCurva').addEventListener('input', e => { const o = activo(); if (o && esTexto(o)) aplicarCurva(o, +e.target.value, true); });
$('pCurva').addEventListener('change', () => { actualizarPanel(); guardarEstado(); });
$('bSinCurva').onclick = () => { const o = activo(); if (o && esTexto(o)){ aplicarCurva(o, 0); $('pCurva').value = 0; guardarEstado(); } };

/* =========================================================
   EFECTOS DE TEXTO
   ========================================================= */
const EFECTOS_TEXTO = {
  ninguno:  { n:'Ninguno',  css:'' },
  sombra:   { n:'Sombra',   css:'text-shadow:2px 3px 5px rgba(0,0,0,.35)' },
  retro:    { n:'Retro',    css:'text-shadow:3px 3px 0 #f472b6' },
  contorno: { n:'Contorno', css:'-webkit-text-stroke:1.2px #1f2330' },
  hueco:    { n:'Hueco',    css:'color:transparent;-webkit-text-stroke:1.2px #7c3aed' },
  sticker:  { n:'Sticker',  css:'text-shadow:0 0 0 #fff,2px 0 #fff,-2px 0 #fff,0 2px #fff,0 -2px #fff,2px 2px #fff,-2px -2px #fff,2px -2px #fff,-2px 2px #fff,1px 3px 4px rgba(0,0,0,.4)' },
  neon:     { n:'Neón',     css:'text-shadow:0 0 6px #a855f7,0 0 12px #a855f7' },
  fondo:    { n:'Fondo',    css:'background:#fde047;padding:0 4px' }
};
function aplicarEfectoTexto(t, efecto){
  const fs = t.fontSize;
  if (t.efectoTexto === 'hueco' && t.rellenoOriginal) t.set('fill', t.rellenoOriginal);
  t.set({ shadow:null, stroke:null, strokeWidth:0, paintFirst:'fill', textBackgroundColor:'' });
  t.rellenoOriginal = null;
  const color = typeof t.fill === 'string' ? t.fill : '#7c3aed';
  switch (efecto){
    case 'sombra':   t.set('shadow', new fabric.Shadow({ color:'rgba(0,0,0,.35)', blur:fs * 0.22, offsetX:fs * 0.05, offsetY:fs * 0.07 })); break;
    case 'retro':    t.set('shadow', new fabric.Shadow({ color: esOscuro(color) ? '#f472b6' : '#1f2330', blur:0, offsetX:fs * 0.06, offsetY:fs * 0.06 })); break;
    case 'contorno': t.set({ stroke:'#1f2330', strokeWidth:Math.max(1, fs * 0.07), paintFirst:'stroke' }); break;
    case 'hueco':    t.rellenoOriginal = color; t.set({ fill:'rgba(0,0,0,0)', stroke:color, strokeWidth:Math.max(1, fs * 0.04) }); break;
    case 'sticker':  t.set({ stroke:'#ffffff', strokeWidth:Math.max(2, fs * 0.2), paintFirst:'stroke', strokeLineJoin:'round',
                       shadow:new fabric.Shadow({ color:'rgba(0,0,0,.28)', blur:fs * 0.14, offsetX:fs * 0.03, offsetY:fs * 0.05 }) }); break;
    case 'neon':     t.set('shadow', new fabric.Shadow({ color, blur:fs * 0.55, offsetX:0, offsetY:0 })); break;
    case 'fondo':    t.set('textBackgroundColor', '#fde047'); break;
  }
  t.efectoTexto = efecto === 'ninguno' ? null : efecto;
  t.initDimensions && t.initDimensions();
  t.dirty = true;
}
Object.entries(EFECTOS_TEXTO).forEach(([k, e]) => {
  const b = document.createElement('button'); b.className = 'efectoBtn'; b.dataset.e = k; b.title = e.n;
  b.innerHTML = `<b style="${e.css}">Aa</b>${e.n}`;
  b.onclick = () => { textos().forEach(t => aplicarEfectoTexto(t, k)); canvas.requestRenderAll(); actualizarPanel(); guardarEstado(); };
  $('efectosTexto').appendChild(b);
});

/* =========================================================
   ESTILOS DE TÍTULO DE UN CLIC
   ========================================================= */
const ESTILOS_TITULO = [
  { n:'Impacto',     f:'Anton',            s:120, c:'#1f2330', mayus:true, efecto:'sticker',  css:"font-family:Anton;font-size:26px;color:#1f2330;text-shadow:0 0 0 #fff,1px 2px 3px rgba(0,0,0,.3)" },
  { n:'Burbuja',     f:'Fredoka', b:'700', s:110, c:'#ec4899', efecto:'sticker', css:"font-family:Fredoka;font-weight:700;font-size:26px;color:#ec4899;text-shadow:1px 2px 3px rgba(0,0,0,.3)" },
  { n:'Retro',       f:'Bebas Neue',       s:130, c:'#f59e0b', efecto:'retro',    css:"font-family:'Bebas Neue';font-size:30px;color:#f59e0b;text-shadow:3px 3px 0 #1f2330" },
  { n:'Neón',        f:'Fredoka', b:'600', s:100, c:'#a855f7', efecto:'neon',     css:"font-family:Fredoka;font-weight:600;font-size:24px;color:#a855f7;text-shadow:0 0 6px #a855f7,0 0 12px #a855f7" },
  { n:'Manuscrito',  f:'Caveat',  b:'700', s:120, c:'#7c3aed',                   css:"font-family:Caveat;font-weight:700;font-size:28px;color:#7c3aed" },
  { n:'Marcador',    f:'Permanent Marker', s:100, c:'#1f2330', efecto:'fondo',    css:"font-family:'Permanent Marker';font-size:22px;color:#1f2330;background:#fde047;padding:0 6px" },
  { n:'Elegante',    f:'Playfair Display', b:'700', it:true, s:100, c:'#78350f', efecto:'sombra', css:"font-family:'Playfair Display';font-weight:700;font-style:italic;font-size:24px;color:#78350f;text-shadow:1px 2px 4px rgba(0,0,0,.25)" },
  { n:'Hueco',       f:'Anton',            s:120, c:'#7c3aed', mayus:true, efecto:'hueco', css:"font-family:Anton;font-size:26px;color:transparent;-webkit-text-stroke:1.4px #7c3aed" },
  { n:'Degradado',   f:'Fredoka', b:'700', s:110, grad:['#7c3aed','#ec4899'],      css:"font-family:Fredoka;font-weight:700;font-size:26px;background:linear-gradient(90deg,#7c3aed,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent" },
  { n:'En arco',     f:'Fredoka', b:'700', s:90,  c:'#0d9488', mayus:true, curva:45, css:"font-family:Fredoka;font-weight:700;font-size:22px;color:#0d9488" },
  { n:'Escolar',     f:'Gochi Hand',       s:110, c:'#1e3a8a', efecto:'contorno', css:"font-family:'Gochi Hand';font-size:26px;color:#1e3a8a" },
  { n:'Pizarra',     f:'Amatic SC', b:'700', s:130, c:'#ffffff', fondoPizarra:true, css:"font-family:'Amatic SC';font-weight:700;font-size:28px;color:#fff;background:#14532d;padding:0 8px;border-radius:4px" }
];
function agregarTitulo(e){
  const k = s();
  const texto = e.mayus ? 'TU TÍTULO AQUÍ' : 'Tu título aquí';
  if (e.fondoPizarra){                      // pizarrón con el texto adentro: se mueven y crecen juntos
    const caja = new fabric.Rect({ left:W/2, top:H/2, originX:'center', originY:'center', width:760 * k, height:210 * k, rx:18 * k, ry:18 * k,
      fill:'#14532d', stroke:'#a16207', strokeWidth:14 * k, strokeUniform:true });
    restaurando = true;
    agregar(caja, 'Pizarra');
    const tp = crearTextoVinculado(caja, texto, { fontFamily:e.f, fontSize:e.s * k, fontWeight:e.b || '400', fill:e.c });
    canvas.add(tp); ordenarVinculos();
    restaurando = false;
    const listo = () => { fabric.util.clearFabricFontCache(e.f); tp.initDimensions(); ajustarFormaATexto(tp); canvas.setActiveObject(caja); canvas.requestRenderAll(); renderCapas(); guardarEstado(); };
    document.fonts.load(`${e.b || 400} 40px "${e.f}"`).then(listo, listo);
    return;
  }
  const t = agregarTexto('titulo', { text:texto, fontFamily:e.f, fontSize:e.s * k, fontWeight:e.b || '400', fontStyle:e.it ? 'italic' : 'normal',
    fill: e.grad ? new fabric.Gradient({ type:'linear', gradientUnits:'percentage', coords:{ x1:0, y1:0, x2:1, y2:0 },
      colorStops:[{ offset:0, color:e.grad[0] }, { offset:1, color:e.grad[1] }] }) : e.c });
  const termina = () => {
    fabric.util.clearFabricFontCache(e.f); t.initDimensions();
    if (e.efecto) aplicarEfectoTexto(t, e.efecto);
    if (e.curva) aplicarCurva(t, e.curva, true);
    canvas.requestRenderAll(); actualizarPanel(); guardarEstado();
  };
  document.fonts.load(`${e.b || 400} 40px "${e.f}"`).then(termina, termina);
}
ESTILOS_TITULO.forEach(e => {
  const b = document.createElement('button'); b.className = 'tituloBtn'; b.title = e.n;
  b.innerHTML = `<span style="${e.css}">${e.n}</span>`;
  b.onclick = () => agregarTitulo(e);
  $('estilosTitulo').appendChild(b);
});

/* =========================================================
   EXPORTAR A POWERPOINT
   ========================================================= */
const URL_PPTX = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
function cargarScript(url){
  return new Promise((ok, mal) => {
    if (window.PptxGenJS) return ok();
    const sc = document.createElement('script'); sc.src = url; sc.onload = ok; sc.onerror = () => mal(new Error('No se pudo cargar la librería de PowerPoint'));
    document.head.appendChild(sc);
  });
}
// ¿Se puede pasar este texto como texto editable sin que cambie su aspecto?
const textoParaPPTX = o => esTexto(o) && o.visible !== false && !o.path && !o.group && !o.esDeco && typeof o.fill === 'string'
  && !(o.stroke && o.strokeWidth > 0) && !o.shadow && !o.textBackgroundColor && (o.text || '').trim();
// Fondo de la diapositiva (todo menos los textos editables) y la lista de textos con su posición
function prepararDiapositivaPPTX(json, escala, editable){
  return new Promise(ok => {
    const sc = new fabric.StaticCanvas(document.createElement('canvas'), { width:W, height:H, enableRetinaScaling:false, renderOnAddRemove:false });
    sc.loadFromJSON(json || PAGINA_VACIA(), () => {
      const textosP = [];
      if (editable) sc.getObjects().forEach(o => {
        if (!textoParaPPTX(o)) return;
        const c = o.getCenterPoint(), w = o.width * o.scaleX, hh = o.height * o.scaleY;
        textosP.push({ texto:o.text, x:c.x - w/2, y:c.y - hh/2, w, h:hh, px:o.fontSize * o.scaleY, fuente:o.fontFamily,
          color:aHex(o.fill).slice(1).toUpperCase(), bold: String(o.fontWeight) === 'bold' || +o.fontWeight >= 600, italic:o.fontStyle === 'italic',
          underline:!!o.underline, align: ['left','center','right','justify'].includes(o.textAlign) ? o.textAlign : 'left',
          valign: o.textoDe ? 'middle' : 'top', angle:o.angle || 0, lh:o.lineHeight || 1.16 });
        o.visible = false;
      });
      sc.renderAll();
      const fondo = sc.toDataURL({ format:'png', multiplier:escala });
      sc.dispose();
      ok({ fondo, textos:textosP });
    });
  });
}
async function crearPPTX(lista, escala, editable){
  await cargarScript(URL_PPTX);
  const pptx = new window.PptxGenJS();
  const mayor = Math.max(W, H), wIn = 13.333 * W / mayor, hIn = 13.333 * H / mayor, f = wIn / W;
  pptx.defineLayout({ name:'DISENO', width:wIn, height:hIn }); pptx.layout = 'DISENO';
  pptx.title = nombreArchivo();
  for (const it of lista){
    const { fondo, textos:ts } = await prepararDiapositivaPPTX(it.p, Math.max(1, escala), editable);
    const slide = pptx.addSlide();
    slide.addImage({ data:fondo, x:0, y:0, w:wIn, h:hIn });
    if (it.p && it.p.notas) slide.addNotes(it.p.notas);
    ts.forEach(t => slide.addText(t.texto, {
      x:t.x * f, y:t.y * f, w:Math.max(0.2, t.w * f), h:Math.max(0.2, t.h * f), margin:0,
      fontFace:t.fuente, fontSize:Math.max(6, Math.round(t.px * f * 72 * 10) / 10), color:t.color,
      bold:t.bold, italic:t.italic, underline: t.underline ? { style:'sng' } : undefined,
      align:t.align, valign:t.valign, rotate:t.angle, lineSpacingMultiple:t.lh, fit:'none', wrap:true }));
  }
  return pptx;
}
$('eFormato').addEventListener('change', () => {
  const f = $('eFormato').value;
  $('filaPptx').style.display = f === 'pptx' ? 'flex' : 'none';
  $('filaVideo').style.display = f === 'video' ? 'block' : 'none';
  $('filaImprimir').style.display = f === 'pdf' ? 'block' : 'none'; infoImpresion();
  $('eEscala').closest('.fila').style.display = f === 'video' ? 'none' : 'flex';
  $('eTransp').closest('.fila').style.display = f === 'video' ? 'none' : 'flex';
  $('eTransp').disabled = f !== 'png';
  if (f === 'video' && paginas.length > 1) $('ePaginas').value = 'todas';
});

/* =========================================================
   EXPORTAR VIDEO (MP4 con animaciones y transiciones)
   ========================================================= */
const URL_MP4MUXER = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.1/build/mp4-muxer.js';
function cargarMuxer(){
  return new Promise((ok, mal) => {
    if (window.Mp4Muxer) return ok();
    const sc = document.createElement('script'); sc.src = URL_MP4MUXER;
    sc.onload = ok; sc.onerror = () => mal(new Error('No se pudo cargar la librería de video (revisa tu conexión)'));
    document.head.appendChild(sc);
  });
}
const parVideo = n => Math.max(2, Math.round(n / 2) * 2);
// Tamaño del video: 720p o 1080p respetando la forma del diseño
function tamVideo(calidad){
  const largo = calidad === '1080' ? 1920 : 1280, corto = calidad === '1080' ? 1080 : 720;
  const k = Math.min(largo / Math.max(W, H), corto / Math.min(W, H));
  return [parVideo(W * k), parVideo(H * k)];
}
// Arma la línea de tiempo: cada página con sus animaciones (en orden, sin esperar clics) y unos segundos de pausa
async function lineaDeTiempoVideo(lista, VW, VH, segundos){
  const diapos = []; let inicio = 0;
  for (let k = 0; k < lista.length; k++){
    const el = document.createElement('canvas');
    const sc = new fabric.StaticCanvas(el, { width:VW, height:VH, renderOnAddRemove:false, enableRetinaScaling:false });
    await new Promise(ok => sc.loadFromJSON(lista[k].p || PAGINA_VACIA(), ok));
    sc.setZoom(VW / W);
    const pasos = prepararPasos(sc), items = [];
    let t = k ? 650 : 250;
    pasos.forEach(p => {
      let fin = t;
      p.items.forEach(it => {
        estadoInicial(it);
        const o = it.o;
        it.ini0 = { left:o.left, top:o.top, opacity:o.opacity, scaleX:o.scaleX, scaleY:o.scaleY, angle:o.angle, text:o.text };
        it.t0 = t + it.ini;
        it.largo = it.a.tipo === 'escribir' && typeof it.fin.text === 'string' && it.fin.text.length ? Math.max(it.dur, it.fin.text.length * 35) : it.dur;
        fin = Math.max(fin, it.t0 + it.largo);
        items.push(it);
      });
      t = fin + 350;
    });
    const dur = Math.max(t, 900) + segundos * 1000;
    diapos.push({ sc, items, inicio, dur });
    inicio += dur;
  }
  return { diapos, total:inicio + 400 };
}
// Pone cada elemento como se ve en el momento t (milisegundos desde que empezó la página)
function estadoEn(d, t){
  d.items.forEach(it => {
    const o = it.o, f = it.fin, i0 = it.ini0;
    if (t <= it.t0){ o.set({ left:i0.left, top:i0.top, opacity:i0.opacity, scaleX:i0.scaleX, scaleY:i0.scaleY, angle:i0.angle }); if (typeof i0.text === 'string' && o.text !== undefined && o.text !== i0.text) o.set('text', i0.text); return; }
    if (t >= it.t0 + it.largo){ mostrarFinal(it); return; }
    const p = (t - it.t0) / it.largo;
    if (it.a.tipo === 'escribir' && typeof f.text === 'string' && f.text.length){ o.set({ text:f.text.slice(0, Math.round(p * f.text.length)), opacity:f.opacity }); return; }
    const ease = it.a.tipo === 'rebote' ? fabric.util.ease.easeOutBack : fabric.util.ease.easeOutCubic;
    const e = ease(p * it.largo, 0, 1, it.largo);
    ['left','top','scaleX','scaleY','angle'].forEach(k => o.set(k, i0[k] + (f[k] - i0[k]) * e));
    o.set('opacity', Math.max(0, Math.min(1, i0.opacity + (f.opacity - i0.opacity) * Math.min(1, e * 1.4))));
  });
  d.sc.renderAll();
  return d.sc.lowerCanvasEl;
}
// Dibuja el cuadro del video en el momento t (incluye la transición entre páginas)
function cuadroVideo(ctx, lt, t){
  const VW = ctx.canvas.width, VH = ctx.canvas.height, ds = lt.diapos;
  let k = ds.findIndex(d => t < d.inicio + d.dur); if (k < 0) k = ds.length - 1;
  const d = ds[k], local = t - d.inicio, tr = presConfig.transicion || 'desvanecer';
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
  const dibujar = (img, alfa, dx, esc) => {
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, alfa));
    ctx.translate(VW / 2 + dx, VH / 2); ctx.scale(esc, esc); ctx.drawImage(img, -VW / 2, -VH / 2, VW, VH); ctx.restore();
  };
  if (k > 0 && tr !== 'ninguna' && local < 650){
    const p = fabric.util.ease.easeOutCubic(local, 0, 1, 650);
    const viejo = estadoEn(ds[k - 1], Infinity);
    if (tr === 'deslizar') dibujar(viejo, 1, -p * VW, 1);
    else if (tr === 'zoom') dibujar(viejo, 1 - p, 0, 1 + 0.12 * p);
    else dibujar(viejo, 1, 0, 1);
    const nuevo = estadoEn(d, local);
    if (tr === 'deslizar') dibujar(nuevo, 1, (1 - p) * VW, 1);
    else if (tr === 'zoom') dibujar(nuevo, p, 0, 0.82 + 0.18 * p);
    else dibujar(nuevo, p, 0, 1);
  } else dibujar(estadoEn(d, local), 1, 0, 1);
}
// Crea el video. Usa el codificador del navegador (rápido); si no existe, graba en tiempo real.
async function crearVideo(lista, opciones = {}){
  const segundos = Math.max(0.5, +($('vSeg') ? $('vSeg').value : 3) || 3);
  const [VW, VH] = tamVideo($('vCalidad') ? $('vCalidad').value : '720');
  const fps = 30, avisar = opciones.progreso || (() => {});
  const lt = await lineaDeTiempoVideo(lista, VW, VH, segundos);
  const rc = document.createElement('canvas'); rc.width = VW; rc.height = VH;
  const ctx = rc.getContext('2d');
  const totalCuadros = Math.ceil(lt.total / 1000 * fps);
  const liberar = () => lt.diapos.forEach(d => { try { d.sc.dispose(); } catch(e){} });
  try {
    if (window.VideoEncoder && window.VideoFrame){
      const bitrate = VH * VW >= 1920 * 1000 ? 8e6 : 4e6;
      let elegido = null;
      for (const [codec, tipo] of [['avc1.640028', 'avc'], ['avc1.4d4028', 'avc'], ['avc1.42e028', 'avc'], ['avc1.42001f', 'avc'], ['vp09.00.40.08', 'vp9']]){
        try { const r = await VideoEncoder.isConfigSupported({ codec, width:VW, height:VH, bitrate, framerate:fps }); if (r.supported){ elegido = { codec, tipo }; break; } } catch(e){}
      }
      if (elegido){
        await cargarMuxer();
        const muxer = new Mp4Muxer.Muxer({ target:new Mp4Muxer.ArrayBufferTarget(), video:{ codec:elegido.tipo, width:VW, height:VH, frameRate:fps }, fastStart:'in-memory' });
        let fallo = null;
        const enc = new VideoEncoder({ output:(chunk, meta) => muxer.addVideoChunk(chunk, meta), error:e => { fallo = e; } });
        enc.configure({ codec:elegido.codec, width:VW, height:VH, bitrate, framerate:fps, ...(elegido.tipo === 'avc' ? { avc:{ format:'avc' } } : {}) });
        for (let n = 0; n < totalCuadros; n++){
          if (fallo) throw fallo;
          cuadroVideo(ctx, lt, n * 1000 / fps);
          const fr = new VideoFrame(rc, { timestamp:Math.round(n * 1e6 / fps), duration:Math.round(1e6 / fps) });
          enc.encode(fr, { keyFrame: n % (fps * 2) === 0 }); fr.close();
          if (enc.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 5));
          if (n % 15 === 0){ avisar(n / totalCuadros); await new Promise(r => setTimeout(r, 0)); }
        }
        await enc.flush(); enc.close();
        if (fallo) throw fallo;
        muxer.finalize();
        avisar(1);
        return { blob:new Blob([muxer.target.buffer], { type:'video/mp4' }), ext:'mp4', codec:elegido.tipo };
      }
    }
    // Plan B: grabar en tiempo real lo que se dibuja
    if (!window.MediaRecorder || !rc.captureStream) throw new Error('Este navegador no puede crear videos. Prueba con Chrome.');
    const tipo = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(x => MediaRecorder.isTypeSupported(x)) || '';
    const stream = rc.captureStream(fps), partes = [];
    const rec = new MediaRecorder(stream, tipo ? { mimeType:tipo, videoBitsPerSecond:4e6 } : {});
    rec.ondataavailable = e => { if (e.data && e.data.size) partes.push(e.data); };
    const terminado = new Promise(ok => rec.onstop = ok);
    cuadroVideo(ctx, lt, 0); rec.start(500);
    const t0 = performance.now();
    await new Promise(ok => {
      const paso = () => {
        const t = performance.now() - t0;
        cuadroVideo(ctx, lt, Math.min(t, lt.total));
        avisar(t / lt.total);
        if (t >= lt.total) return ok();
        requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
    rec.stop(); await terminado;
    const mime = rec.mimeType || tipo || 'video/webm';
    return { blob:new Blob(partes, { type:mime.split(';')[0] }), ext:mime.includes('mp4') ? 'mp4' : 'webm', codec:'grabado' };
  } finally { liberar(); }
}
async function videoConProgreso(lista){
  const msg = $('cargando'), antes = msg.textContent;
  cargando(true);
  try {
    return await crearVideo(lista, { progreso:p => { msg.textContent = 'Creando video… ' + Math.min(100, Math.round(p * 100)) + '%'; } });
  } finally { msg.textContent = antes; cargando(false); }
}
const blobADataURL = blob => new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => mal(r.error); r.readAsDataURL(blob); });

/* =========================================================
   GUARDADO AUTOMÁTICO EN DRIVE
   ========================================================= */
let enDrive = false, guardandoDrive = false, cambiosPendientes = false;
let autoDrive = true;
try { autoDrive = localStorage.getItem('disenador_autodrive') !== '0'; } catch(e){}
$('autoDrive').checked = autoDrive;
$('autoDrive').onchange = e => {
  autoDrive = e.target.checked;
  try { localStorage.setItem('disenador_autodrive', autoDrive ? '1' : '0'); } catch(_){}
  if (autoDrive && enDrive && cambiosPendientes) autoGuardado();
};
function indicadorGuardado(estado){
  const el = $('estadoGuardado'); if (!el) return;
  const hora = new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
  if (estado === 'ok'){ cambiosPendientes = false; el.textContent = '✓ Guardado ' + hora; }
  else if (estado === 'guardando') el.textContent = 'Guardando…';
  else if (estado === 'cambios') el.textContent = enDrive ? (autoDrive ? 'Cambios sin guardar…' : '● Cambios sin guardar') : 'No guardado en este navegador';
  else if (estado === 'error') el.textContent = '⚠ No se pudo guardar';
  else el.textContent = 'No guardado en este navegador';
}
// Se llama con cada cambio: si el diseño ya está en este navegador, se guarda solo unos segundos después
function autoGuardado(){
  cambiosPendientes = true;
  indicadorGuardado('cambios');
  if (!autoDrive || !enDrive) return;
  clearTimeout(autoGuardado._t);
  autoGuardado._t = setTimeout(guardarDriveSilencioso, 15000);
}
function guardarDriveSilencioso(){
  if (!enDrive || !autoDrive || pres) return;
  if (guardandoDrive){ autoGuardado._t = setTimeout(guardarDriveSilencioso, 5000); return; }
  guardandoDrive = true; indicadorGuardado('guardando');
  gs('guardarProyecto', nombreArchivo(), serializar())
    .then(() => indicadorGuardado('ok'))
    .catch(() => indicadorGuardado('error'))
    .finally(() => { guardandoDrive = false; });
}
window.addEventListener('beforeunload', e => {
  if (enDrive && cambiosPendientes){ e.preventDefault(); e.returnValue = ''; }
});

/* =========================================================
   PANEL DERECHO CON PESTAÑAS Y SECCIONES PLEGABLES
   ========================================================= */
(function reorganizarPanel(){
  const props = $('props'), cont = $('propsCont');
  const barra = document.createElement('div'); barra.className = 'tabsProps';
  barra.innerHTML = [['diseno','Diseño'],['organizar','Organizar'],['animar','Animar'],['capas','Capas']]
    .map(([k, n]) => `<button data-pt="${k}">${n}</button>`).join('');
  const nueva = id => { const d = document.createElement('div'); d.className = 'ptab'; d.id = id; return d; };
  const tD = nueva('ptDiseno'), tO = nueva('ptOrganizar'), tA = nueva('ptAnimar'), tC = nueva('ptCapas');
  // Organizar: todo lo que va desde el título "Organizar" hasta el final
  const hOrg = [...cont.children].find(x => x.tagName === 'H4' && x.textContent.trim() === 'Organizar');
  const reqO = document.createElement('div'); reqO.className = 'reqSel';
  for (let n = hOrg; n; ){ const sig = n.nextElementSibling; reqO.appendChild(n); n = sig; }
  tO.appendChild(reqO);
  tO.insertAdjacentHTML('beforeend', '<p class="hint hintSel">Selecciona un elemento para alinearlo, ordenarlo, duplicarlo o eliminarlo.</p>');
  // Animar
  const reqA = document.createElement('div'); reqA.className = 'reqSel'; reqA.appendChild($('secAnim'));
  tA.appendChild(reqA);
  tA.insertAdjacentHTML('beforeend', '<p class="hint hintSel">Selecciona un elemento para animarlo, o usa <b>▶ Presentar → Animar esta página</b> para animar todo de una vez.</p>');
  // Capas
  const hC = [...props.children].find(x => x.tagName === 'H4' && x.textContent.trim() === 'Capas');
  hC.innerHTML = 'Capas <span id="numCapas" style="font-weight:400"></span>';
  tC.appendChild(hC); tC.appendChild($('capas'));
  tC.insertAdjacentHTML('beforeend', '<p class="hint" style="font-size:11px">Arrastra para cambiar el orden · doble clic en un nombre para renombrarlo.</p>');
  // Diseño
  tD.appendChild($('sinSel')); tD.appendChild(cont);
  const cierre = props.querySelector('.cerrarHoja');
  props.innerHTML = ''; props.append(...(cierre ? [cierre] : []), barra, tD, tO, tA, tC);
  // Agrupa títulos sueltos con sus controles para poder plegarlos
  let grupo = null;
  [...cont.children].forEach(el => {
    if (el.tagName === 'H4'){ grupo = document.createElement('div'); grupo.className = 'secGen'; cont.insertBefore(grupo, el); grupo.appendChild(el); }
    else if (el.tagName === 'DIV' && el.id) grupo = null;
    else if (grupo) grupo.appendChild(el);
  });
  let plegados = [];
  try { plegados = JSON.parse(localStorage.getItem('disenador_plegados') || '[]'); } catch(e){}
  cont.querySelectorAll('h4').forEach(h4 => {
    const sec = h4.parentElement;
    if (sec.firstElementChild !== h4 || sec === cont) return;
    h4.classList.add('plegable');
    const clave = h4.textContent.trim();
    if (plegados.includes(clave)) sec.classList.add('plegado');
    h4.onclick = () => {
      sec.classList.toggle('plegado');
      plegados = plegados.filter(x => x !== clave); if (sec.classList.contains('plegado')) plegados.push(clave);
      try { localStorage.setItem('disenador_plegados', JSON.stringify(plegados)); } catch(e){}
    };
  });
  // Pestañas
  let tab = 'diseno';
  try { tab = localStorage.getItem('disenador_tabProps') || 'diseno'; } catch(e){}
  const mostrar = k => {
    barra.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.pt === k));
    [['diseno', tD], ['organizar', tO], ['animar', tA], ['capas', tC]].forEach(([n, el]) => el.classList.toggle('on', n === k));
    try { localStorage.setItem('disenador_tabProps', k); } catch(e){}
    if (k === 'capas') renderCapas();
  };
  barra.querySelectorAll('button').forEach(b => b.onclick = () => mostrar(b.dataset.pt));
  mostrar(tab);
})();
// Muestra u oculta lo que necesita algo seleccionado en las pestañas Organizar y Animar
function actualizarPestanas(){
  const hay = !!activo();
  document.querySelectorAll('.reqSel').forEach(x => x.hidden = !hay);
  document.querySelectorAll('.hintSel').forEach(x => x.hidden = hay);
}
['selection:created','selection:updated','selection:cleared'].forEach(ev => canvas.on(ev, actualizarPestanas));
actualizarPestanas();

/* =========================================================
   CELULAR Y TABLET
   ========================================================= */
const esTel = () => matchMedia('(max-width: 820px)').matches;          // teléfono: paneles abajo
const esCompacto = () => matchMedia('(max-width: 1180px)').matches;    // tablet o teléfono: propiedades como panel flotante
const esTactil = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (esTactil){
  // asas más grandes para el dedo
  fabric.Object.prototype.set({ cornerSize:16, touchCornerSize:42, padding:8 });
  document.body.classList.add('tactil');
}
function abrirLateral(abrir){ $('lateral').classList.toggle('abierto', abrir); if (abrir) $('props').classList.remove('abierto'); }
function alternarProps(abrir){
  const ab = abrir ?? !$('props').classList.contains('abierto');
  $('props').classList.toggle('abierto', ab);
  if (ab && esTel()) $('lateral').classList.remove('abierto');
  $('fabEditar').classList.toggle('on', ab);
  $('accMovil').classList.toggle('oculto', ab);
}
function actualizarBotonesMovil(){
  const hay = !!canvas.getActiveObject();
  $('accMovil').classList.toggle('ver', hay);
  if (!hay) alternarProps(false);
}
['selection:created','selection:updated','selection:cleared'].forEach(ev => canvas.on(ev, actualizarBotonesMovil));
// En el teléfono, al agregar algo desde el panel se cierra para que veas el lienzo
$('lateral').addEventListener('click', e => {
  if (!esTel()) return;
  if (e.target.closest('.tarjetaPl,.forma,.nodoBtn,.emojiBtn,.tituloBtn,#misImagenes img,.plantilla,.bigbtn:not([data-queda])')) setTimeout(() => abrirLateral(false), 120);
});
// Pellizcar con dos dedos = acercar/alejar; mover con dos dedos = desplazarse
(function gestosTactiles(){
  const area = $('area'); let g = null;
  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const medio = (a, b) => ({ x:(a.clientX + b.clientX) / 2, y:(a.clientY + b.clientY) / 2 });
  area.addEventListener('touchstart', e => {
    if (e.touches.length !== 2) return;
    e.preventDefault(); e.stopPropagation();
    const tr = canvas._currentTransform;                 // se cancela lo que hacía el primer dedo
    if (tr && tr.target && tr.original){ tr.target.set(tr.original); tr.target.setCoords(); }
    canvas._currentTransform = null; canvas._groupSelector = null;
    const [a, b] = e.touches, m = medio(a, b), r = $('envoltura').getBoundingClientRect();
    g = { d:Math.max(10, dist(a, b)), z:zoom, px:(m.x - r.left) / zoom, py:(m.y - r.top) / zoom };
    canvas.requestRenderAll();
  }, { capture:true, passive:false });
  window.addEventListener('touchmove', e => {
    if (!g) return;
    e.preventDefault(); e.stopPropagation();
    if (e.touches.length < 2) return;
    const [a, b] = e.touches, m = medio(a, b);
    establecerZoom(g.z * dist(a, b) / g.d);
    const r = $('envoltura').getBoundingClientRect();
    area.scrollLeft += (r.left + g.px * zoom) - m.x;
    area.scrollTop += (r.top + g.py * zoom) - m.y;
  }, { capture:true, passive:false });
  const fin = e => { if (g && e.touches.length === 0){ g = null; e.stopPropagation(); canvas.requestRenderAll(); } };
  window.addEventListener('touchend', fin, { capture:true });
  window.addEventListener('touchcancel', fin, { capture:true });
})();
// En la presentación: deslizar a la izquierda/derecha cambia de diapositiva
(function deslizarPresentacion(){
  let x0 = null, y0 = 0;
  $('presentacion').addEventListener('touchstart', e => { if (e.touches.length === 1){ x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive:true });
  $('presentacion').addEventListener('touchend', e => {
    if (x0 == null) return;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3){ e.preventDefault(); dx < 0 ? presSiguiente() : presAnterior(); }
  });
})();

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

/* =========================================================
   COMPARTIR CON COMPAÑEROS
   ========================================================= */
async function crearEnlaceCompartir(){
  canvas.discardActiveObject(); canvas.requestRenderAll();
  cargando(true);
  try {
    const nombre = $('nombreDiseno').value || 'Mi diseño';
    const r = await gs('compartirDiseno', nombre, serializar());
    if (r && r.archivo){
      cerrarModal('mCompartir'); descargarDisenoArchivo();
      toast('Se descargó tu diseño como archivo: mándalo a tu compañero y que lo abra con 📂 Abrir → “Abrir un archivo”.');
      return;
    }
    $('cLink').value = r.url; $('cResultado').hidden = false;
    $('cAviso').textContent = r.publico ? 'Cualquier persona con el enlace podrá abrir una copia (necesita entrar con su cuenta de Google).'
      : 'Tu cuenta no permite compartir con cualquiera: solo personas de tu misma escuela u organización podrán abrirlo.';
    $('cWhats').href = 'https://wa.me/?text=' + encodeURIComponent('Te comparto mi diseño “' + nombre + '”: ' + r.url);
  } catch (e) { toast('No se pudo crear el enlace: ' + e.message); }
  finally { cargando(false); }
}
function copiarEnlace(){
  const i = $('cLink'); i.focus(); i.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch(e){}
  if (!ok && navigator.clipboard) navigator.clipboard.writeText(i.value).then(() => toast('Enlace copiado'), () => toast('Selecciona el enlace y cópialo (Ctrl+C)'));
  else toast(ok ? 'Enlace copiado' : 'Selecciona el enlace y cópialo (Ctrl+C)');
}
// Si la app se abrió con ?copia=ID, carga esa copia
function abrirCompartidoSiHay(){
  return new Promise(ok => {
    try {
      if (!(window.google && google.script && google.script.url)) return ok(false);
      google.script.url.getLocation(loc => {
        const id = loc && loc.parameter && loc.parameter.copia;
        if (!id) return ok(false);
        ok(true); cargando(true);
        gs('cargarCompartido', id).then(r => {
          $('nombreDiseno').value = 'Copia de ' + r.nombre;
          historial = []; hi = -1; miniaturas = [];
          cargarJSON(r.contenido, true, () => {
            cargando(false); enDrive = false; indicadorGuardado('nuevo');
            toast('Abriste una copia de “' + r.nombre + '”. Pulsa 💾 Guardar para tenerla en este navegador.');
          });
        }).catch(e => { cargando(false); ajustarZoom(); guardarEstado(); toast('No se pudo abrir el diseño compartido: ' + e.message); });
      });
    } catch (e) { ok(false); }
  });
}

/* =========================================================
   IMPRIMIR: HOJA, VARIAS POR HOJA Y MARCAS DE CORTE
   ========================================================= */
const PAPELES = { carta:[215.9, 279.4], a4:[210, 297], oficio:[216, 340] };
function anchoRealCm(){ return Math.round(W / 300 * 2.54 * 10) / 10; }   // a 300 puntos por pulgada
function acomodoHojas(){
  const [a, b] = PAPELES[$('iPapel').value] || PAPELES.carta;
  const m = Math.max(0, Math.min(40, +$('iMargen').value || 0)), marcas = $('iMarcas').checked, r = H / W;
  const prueba = (pw, ph) => {
    const aw = pw - 2 * m, ah = ph - 2 * m;
    if ($('iAcomodo').value === 'una'){
      const w = Math.min(aw, ah / r), h = w * r;
      return { pw, ph, cols:1, filas:1, w, h, gap:0 };
    }
    let w = Math.max(5, (+$('iAncho').value || anchoRealCm()) * 10), h = w * r;
    const gap = marcas ? 10 : 4;
    let cols = Math.floor((aw + gap) / (w + gap)), filas = Math.floor((ah + gap) / (h + gap));
    if (cols < 1 || filas < 1){ w = Math.min(aw, ah / r); h = w * r; cols = filas = 1; }
    return { pw, ph, cols, filas, w, h, gap };
  };
  const v = prueba(Math.min(a, b), Math.max(a, b)), hz = prueba(Math.max(a, b), Math.min(a, b));
  let L = v.cols * v.filas > hz.cols * hz.filas ? v : hz.cols * hz.filas > v.cols * v.filas ? hz : (W > H ? hz : v);
  const anchoGrid = L.cols * L.w + (L.cols - 1) * L.gap, altoGrid = L.filas * L.h + (L.filas - 1) * L.gap;
  const x0 = (L.pw - anchoGrid) / 2, y0 = (L.ph - altoGrid) / 2, lugares = [];
  for (let f = 0; f < L.filas; f++) for (let c = 0; c < L.cols; c++) lugares.push({ x:x0 + c * (L.w + L.gap), y:y0 + f * (L.h + L.gap), w:L.w, h:L.h });
  return { ...L, lugares, marcas };
}
function infoImpresion(){
  const pdfHoja = $('eFormato').value === 'pdf' && $('iPapel').value !== 'diseno';
  $('filaHoja').style.display = pdfHoja ? 'block' : 'none';
  if (!pdfHoja) return;
  const varias = $('iAcomodo').value === 'varias';
  $('filaAncho').style.display = varias ? 'flex' : 'none';
  if (varias && !+$('iAncho').value) $('iAncho').value = anchoRealCm();
  const L = acomodoHojas(), n = paginasAExportar().length * Math.max(1, +$('iCopias').value || 1);
  $('iInfo').textContent = 'Cada una mide ' + (L.w / 10).toFixed(1) + ' × ' + (L.h / 10).toFixed(1) + ' cm · caben ' + L.lugares.length + ' por hoja · ' +
    Math.ceil(n / L.lugares.length) + (Math.ceil(n / L.lugares.length) === 1 ? ' hoja' : ' hojas') + (L.pw > L.ph ? ' (horizontal)' : ' (vertical)');
}
function marcasDeCorte(pdf, r){
  const l = 4, s = 1.2;
  pdf.setDrawColor(40); pdf.setLineWidth(0.2);
  [[r.x, r.y, -1, -1], [r.x + r.w, r.y, 1, -1], [r.x, r.y + r.h, -1, 1], [r.x + r.w, r.y + r.h, 1, 1]].forEach(([x, y, dx, dy]) => {
    pdf.line(x + dx * s, y, x + dx * (s + l), y);
    pdf.line(x, y + dy * s, x, y + dy * (s + l));
  });
}
['iPapel', 'iAcomodo', 'iAncho', 'iCopias', 'iMargen', 'iMarcas', 'ePaginas'].forEach(id => { $(id).addEventListener('change', infoImpresion); $(id).addEventListener('input', infoImpresion); });
$('iAcomodo').addEventListener('change', () => { if ($('iAcomodo').value === 'varias') $('iMarcas').checked = true; infoImpresion(); });
async function crearPDFHojas(lista){
  const { jsPDF } = window.jspdf, L = acomodoHojas(), copias = Math.max(1, Math.min(200, +$('iCopias').value || 1));
  const items = []; lista.forEach(it => { for (let k = 0; k < copias; k++) items.push(it); });
  const pdf = new jsPDF({ orientation:L.pw > L.ph ? 'landscape' : 'portrait', unit:'mm', format:[L.pw, L.ph], compress:true });
  const escala = Math.max(0.5, Math.min(4, (L.w / 25.4 * 300) / W)), imgs = {};
  for (let k = 0; k < items.length; k++){
    const lugar = k % L.lugares.length;
    if (k && !lugar) pdf.addPage([L.pw, L.ph], L.pw > L.ph ? 'landscape' : 'portrait');
    const it = items[k], r = L.lugares[lugar];
    if (!imgs[it.i]) imgs[it.i] = await renderPagina(it.p, 'jpeg', escala, false);
    pdf.addImage(imgs[it.i], 'JPEG', r.x, r.y, r.w, r.h, 'pag' + it.i, 'FAST');
    if (L.marcas) marcasDeCorte(pdf, r);
  }
  return pdf;
}
// Vista previa de las hojas tal como saldrán impresas
async function vistaHojas(lista){
  const L = acomodoHojas(), copias = Math.max(1, +$('iCopias').value || 1), k = 2.2;   // pixeles por mm en la vista
  const items = []; lista.forEach(it => { for (let c = 0; c < copias; c++) items.push(it); });
  const hojas = Math.min(6, Math.ceil(items.length / L.lugares.length)), urls = [], cache = {};
  for (let hj = 0; hj < hojas; hj++){
    const cv = document.createElement('canvas'); cv.width = L.pw * k; cv.height = L.ph * k;
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    for (let s = 0; s < L.lugares.length; s++){
      const it = items[hj * L.lugares.length + s]; if (!it) break;
      if (!cache[it.i]){ const im = new Image(); im.src = await renderPagina(it.p, 'jpeg', Math.min(1, L.w * k * 1.5 / W), false); await new Promise(r => im.onload = r); cache[it.i] = im; }
      const r = L.lugares[s]; g.drawImage(cache[it.i], r.x * k, r.y * k, r.w * k, r.h * k);
      if (L.marcas){ g.strokeStyle = '#333'; g.lineWidth = 1; g.beginPath();
        [[r.x, r.y, -1, -1], [r.x + r.w, r.y, 1, -1], [r.x, r.y + r.h, -1, 1], [r.x + r.w, r.y + r.h, 1, 1]].forEach(([x, y, dx, dy]) => {
          g.moveTo((x + dx * 1.2) * k, y * k); g.lineTo((x + dx * 5.2) * k, y * k); g.moveTo(x * k, (y + dy * 1.2) * k); g.lineTo(x * k, (y + dy * 5.2) * k); });
        g.stroke(); }
    }
    urls.push(cv.toDataURL('image/jpeg', 0.85));
  }
  return urls;
}

/* =========================================================
   KIT DE MARCA (tus colores, letras y logo)
   ========================================================= */
let kit = { colores:['#7c3aed', '#f97316', '#06b6d4', '#1f2330', '#f8fafc'], titulo:'Fredoka', texto:'Poppins', logo:'' };
const NOMBRES_KIT = ['Principal', 'Secundario', 'Acento', 'Texto', 'Fondo'];
const hexDe = c => { try { if (!c || typeof c !== 'string' || c === 'transparent') return null; const k = new fabric.Color(c); if (k.getAlpha() < 0.05) return null; return '#' + k.toHex().toLowerCase(); } catch(e){ return null; } };
const luzDe = h => { const k = new fabric.Color(h).getSource(); return (0.299 * k[0] + 0.587 * k[1] + 0.114 * k[2]) / 255; };
const satDe = h => { const [r, g, b] = new fabric.Color(h).getSource().map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1)); };
const mezclar = (a, b, t) => { const A = new fabric.Color(a).getSource(), B = new fabric.Color(b).getSource(); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join(''); };
function pintarKit(){
  const cont = $('kitColores'); cont.innerHTML = '';
  kit.colores.forEach((c, i) => {
    const d = document.createElement('label'); d.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10.5px;color:var(--suave)';
    d.innerHTML = `<input type="color" value="${c}" style="width:100%;height:38px">${NOMBRES_KIT[i]}`;
    d.querySelector('input').addEventListener('input', e => { kit.colores[i] = e.target.value; kitCambiado(); });
    cont.appendChild(d);
  });
  $('kitTitulo').value = kit.titulo; $('kitTexto').value = kit.texto;
  $('kitTitulo').style.fontFamily = kit.titulo; $('kitTexto').style.fontFamily = kit.texto;
  $('kitLogo').innerHTML = kit.logo ? `<img src="${kit.logo}" style="max-width:100%;max-height:110px;display:block;margin:auto">` : 'Sin logo';
}
['kitTitulo', 'kitTexto'].forEach(id => {
  $(id).innerHTML = FUENTES.map(f => `<option value="${f}" style="font-family:'${f}'">${f}</option>`).join('');
  $(id).addEventListener('change', e => { kit[id === 'kitTitulo' ? 'titulo' : 'texto'] = e.target.value; kitCambiado(); pintarKit(); });
});
function kitCambiado(){
  $('kitEstado').textContent = 'Cambios sin guardar en tu kit';
  const { logoEl, ...datos } = kit;
  try { localStorage.setItem('disenador_kit', JSON.stringify(datos)); } catch(e){}
  actualizarTemaMarca();
}
$('archivoLogo').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const lector = new FileReader();
  lector.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 600 / Math.max(im.width, im.height)), cv = document.createElement('canvas');
      cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      kit.logo = cv.toDataURL('image/png'); prepararLogo(); pintarKit(); kitCambiado();
    };
    im.src = lector.result;
  };
  lector.readAsDataURL(f);
});
function quitarLogoKit(){ kit.logo = ''; kit.logoEl = null; pintarKit(); kitCambiado(); }
function prepararLogo(){ if (!kit.logo){ kit.logoEl = null; return; } const im = new Image(); im.onload = () => { if (kit.logoEl === im) actualizarTemaMarca(); }; im.src = kit.logo; kit.logoEl = im; }
function agregarLogo(){
  if (!kit.logo){ toast('Primero sube tu logo'); return; }
  fabric.Image.fromURL(kit.logo, img => {
    img.scaleToWidth(Math.min(W, H) * 0.2);
    img.set({ originX:'center', originY:'center', left:W - img.getScaledWidth() / 2 - W * 0.04, top:img.getScaledHeight() / 2 + H * 0.04 });
    agregar(img, 'Logo');
  });
}
function agregarTextoKit(tipo){
  const t = agregarTexto(tipo === 'titulo' ? 'titulo' : 'cuerpo', { fontFamily:tipo === 'titulo' ? kit.titulo : kit.texto, fill:kit.colores[tipo === 'titulo' ? 0 : 3] });
  canvas.setActiveObject(t); canvas.requestRenderAll();
}
async function guardarKitDrive(){
  const { logoEl, ...datos } = kit;
  try { localStorage.setItem('disenador_kit', JSON.stringify(datos)); } catch(e){}
  misColores = [...new Set([...kit.colores, ...misColores])].slice(0, 16); guardarColores();
  try { await gs('guardarKit', JSON.stringify(datos)); $('kitEstado').textContent = '✓ Kit guardado en este navegador'; toast('Kit de marca guardado'); }
  catch (e) { $('kitEstado').textContent = 'Guardado solo en este navegador'; toast('No se pudo guardar en este navegador: ' + e.message); }
}
async function cargarKit(){
  try { const l = localStorage.getItem('disenador_kit'); if (l) kit = { ...kit, ...JSON.parse(l) }; } catch(e){}
  prepararLogo(); pintarKit(); actualizarTemaMarca();
  try {
    const txt = await gs('cargarKit');
    if (txt){ kit = { ...kit, ...JSON.parse(txt) }; prepararLogo(); pintarKit(); actualizarTemaMarca(); $('kitEstado').textContent = '✓ Kit cargado de este navegador'; }
  } catch(e){}
}
// ---------- Aplicar el kit a un diseño ----------
function mapaDeColores(objs){
  const usos = new Map();
  const sumar = (c, peso) => { const h = hexDe(c); if (h) usos.set(h, (usos.get(h) || 0) + peso); };
  objs.forEach(o => {
    if (o.type === 'image' || o.type === 'group' || esTexto(o)) return;
    const area = Math.max(1, (o.width || 1) * (o.scaleX || 1) * (o.height || 1) * (o.scaleY || 1));
    sumar(o.fill, area); if (o.strokeWidth) sumar(o.stroke, area * 0.05);
  });
  const vivos = [...usos.entries()].filter(([h]) => satDe(h) > 0.2 && luzDe(h) > 0.1 && luzDe(h) < 0.93).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const mapa = {};
  vivos.forEach((h, i) => { mapa[h] = kit.colores[i % 3]; });
  return mapa;
}
function aplicarKitObjs(objs){
  const mapa = mapaDeColores(objs), [, , , oscuro, claro] = kit.colores;
  const porIdK = {}; objs.forEach(o => { if (o.id) porIdK[o.id] = o; });
  const textos = objs.filter(esTexto), mayor = Math.max(1, ...textos.map(t => (t.fontSize || 0) * (t.scaleY || 1)));
  const nuevo = (c, tipo) => {
    const h = hexDe(c); if (!h) return c;
    if (mapa[h]) return mapa[h];
    if (tipo !== 'fondo' && satDe(h) < 0.2 && luzDe(h) < 0.35) return oscuro;
    if (tipo === 'fondo' && luzDe(h) > 0.85 && h !== '#ffffff') return claro;
    return c;
  };
  objs.forEach(o => {
    if (o.type === 'image' || o.type === 'group' || esTexto(o)) return;
    if (o.esFondo){ if (typeof o.fill === 'string') o.set('fill', nuevo(o.fill, 'fondo')); return; }
    if (typeof o.fill === 'string') o.set('fill', nuevo(o.fill));
    if (typeof o.stroke === 'string') o.set('stroke', nuevo(o.stroke));
  });
  textos.forEach(t => {
    const titulo = (t.fontSize || 0) * (t.scaleY || 1) >= mayor * 0.6 && !t.textoDe;
    t.set('fontFamily', titulo ? kit.titulo : kit.texto);
    const forma = t.textoDe && porIdK[t.textoDe];
    if (forma && typeof forma.fill === 'string' && hexDe(forma.fill)) t.set('fill', luzDe(hexDe(forma.fill)) < 0.55 ? '#ffffff' : oscuro);
    else if (typeof t.fill === 'string' && hexDe(t.fill)){
      const h = hexDe(t.fill);
      t.set('fill', mapa[h] || (luzDe(h) < 0.5 ? (titulo ? kit.colores[0] : oscuro) : t.fill));
    }
    if (t.initDimensions) t.initDimensions();
  });
}
function fondoConKit(c){
  const h = hexDe(c); if (!h) return c;
  if (luzDe(h) > 0.85) return h === '#ffffff' ? c : kit.colores[4];
  if (satDe(h) > 0.2) return kit.colores[0];
  return c;
}
async function aplicarKit(todas){
  canvas.discardActiveObject();
  if (todas) paginas.forEach((p, i) => { if (i !== actual && p && typeof p.background === 'string') p.background = fondoConKit(p.background); });
  if (typeof canvas.backgroundColor === 'string') canvas.backgroundColor = fondoConKit(canvas.backgroundColor);
  await cambiarPaginas(todas, objs => aplicarKitObjs(objs));
  canvas.getObjects().filter(o => o.textoDe).forEach(t => { try { ajustarFormaATexto(t); } catch(e){} });
  canvas.requestRenderAll(); guardarEstado(); renderPaginas();
  toast(todas ? 'Se aplicó tu marca a todas las páginas' : 'Se aplicó tu marca a esta página');
}
// ---------- Tema de presentación con tu marca ----------
function temaMarca(){
  const [p, s, a, o, f] = kit.colores;
  return { id:'marca', nombre:'Mi marca', fondo:f, texto:o, suave:mezclar(o, f, 0.4), pri:p, sec:s, acento:a,
    tarjeta:luzDe(f) > 0.85 ? mezclar(p, '#ffffff', 0.9) : '#ffffff', textoTarjeta:o, borde:null,
    tit:kit.titulo, titPeso:'700', cuerpo:kit.texto, paleta:'Vibrante', trans:'deslizar', anim:'dinamica' };
}
function logoEn(x, y, ancho){
  if (!kit.logoEl || !kit.logoEl.complete || !kit.logoEl.naturalWidth) return;
  const img = new fabric.Image(kit.logoEl, { originX:'center', originY:'center', left:x, top:y, name:'Logo', id:nuevoId() });
  img.scaleToWidth(ancho); canvas.add(img);
}
function fondoMarca(t, k){
  if (k === 'seccion'){ FONDO(t.pri); CIRC(1650, 240, 320, '#ffffff', { op:0.08 }); logoEn(1780, 980, 140); return { texto:'#ffffff', suave:mezclar('#ffffff', t.pri, 0.25), acento:luzDe(t.acento) > 0.6 ? t.acento : '#ffffff' }; }
  FONDO(t.fondo);
  if (k === 'portada' || k === 'final'){ CIRC(1650, 260, 420, t.pri, { op:0.12 }); CIRC(240, 920, 260, t.sec, { op:0.14 }); logoEn(960, 140, 220); }
  else { RECT(0, 0, 1920, 14, t.pri); if (k === 'normal') RECT(120, 192, 110, 9, t.sec, { r:4 }); logoEn(1790, 95, 150); }
  return { texto:t.texto, suave:t.suave, acento:t.pri };
}
function actualizarTemaMarca(){
  TEMAS_PRES.marca = temaMarca();
  Object.keys(vistasDiapo).forEach(k => { if (k.startsWith('marca/')) delete vistasDiapo[k]; });
  let it = CATALOGO.find(x => x.esMarca);
  if (!it){
    it = { nombre:'Mi marca · ' + DIAPOS.length + ' diapositivas', cat:CAT_PRES, tam:[1920, 1080], esMarca:true,
      crear:() => DIAPOS[0].crear(TEMAS_PRES.marca), usar:() => usarPresentacion(TEMAS_PRES.marca) };
    const k = CATALOGO.findIndex(x => x.cat === CAT_PRES);
    CATALOGO.splice(k < 0 ? CATALOGO.length : k, 0, it);
  }
  clearTimeout(actualizarTemaMarca._t);
  actualizarTemaMarca._t = setTimeout(() => {
    it.vista = vistaDe(it.tam, it.crear);
    if (it.boton && it.vista) it.boton.querySelector('.mini').innerHTML = `<img src="${it.vista}" alt="">`;
  }, 400);
  renderCatalogo();
}
cargarKit();

/* =========================================================
   RECORRER TODAS LAS PÁGINAS (para cambios en todo el diseño)
   ========================================================= */
// Carga cada página en el lienzo, aplica fn(objetos, i) y la guarda. Al final vuelve a la página actual.
async function recorrerPaginas(fn, alFinal){
  canvas.discardActiveObject();
  guardarPaginaActual();
  const orig = actual;
  restaurando = true;
  try {
    for (let i = 0; i < paginas.length; i++){
      const nt = paginas[i] && paginas[i].notas;
      await new Promise(ok => canvas.loadFromJSON(paginas[i] || PAGINA_VACIA(), ok));
      try { normalizarVinculos(); } catch(e){}
      await fn(canvas.getObjects(), i);
      paginas[i] = canvas.toJSON(EXTRA); if (nt) paginas[i].notas = nt;
    }
    if (alFinal) alFinal();
  } finally {
    restaurando = false;
    miniaturas = []; actual = orig;
    cargarPaginaActual(true);
  }
}

/* =========================================================
   CAMBIAR EL TAMAÑO ACOMODANDO EL CONTENIDO
   ========================================================= */
function escalarContenido(objs, w1, h1, w2, h2){
  const sx = w2 / w1, sy = h2 / h1, k = Math.min(sx, sy);
  const nuevoCentro = c => new fabric.Point(c.x * sx, c.y * sy);
  // las celdas de una tabla se mueven juntas para no encimarse ni separarse
  const tablas = {};
  objs.forEach(o => { if (o.tabla){ const r = o.getBoundingRect(true, true); const t = tablas[o.tabla] || (tablas[o.tabla] = { x0:Infinity, y0:Infinity, x1:-Infinity, y1:-Infinity });
    t.x0 = Math.min(t.x0, r.left); t.y0 = Math.min(t.y0, r.top); t.x1 = Math.max(t.x1, r.left + r.width); t.y1 = Math.max(t.y1, r.top + r.height); } });
  const porIdL = {}; objs.forEach(o => { if (o.id) porIdL[o.id] = o; });
  const centros = new Map(); objs.forEach(o => centros.set(o, o.getCenterPoint()));
  objs.forEach(o => {
    if (o.esFondo || o.type === 'conector') return;
    let c = centros.get(o), destino;
    if (o.tabla){ const t = tablas[o.tabla], tc = new fabric.Point((t.x0 + t.x1) / 2, (t.y0 + t.y1) / 2), nc = nuevoCentro(tc);
      destino = new fabric.Point(nc.x + (c.x - tc.x) * k, nc.y + (c.y - tc.y) * k); }
    else if (o.textoDe && porIdL[o.textoDe]){ const f = porIdL[o.textoDe], fc = centros.get(f), nc = nuevoCentro(fc);
      destino = new fabric.Point(nc.x + (c.x - fc.x) * k, nc.y + (c.y - fc.y) * k); }
    else destino = nuevoCentro(c);
    if (esTexto(o) && o.type !== 'text'){
      o.set({ fontSize:o.fontSize * k, width:(o.width || 0) * k });
      if (o.anchoBase) o.anchoBase *= k;
    } else {
      o.set({ scaleX:o.scaleX * k, scaleY:o.scaleY * k });
      ['anchoBase', 'altoBase', 'anchoMax'].forEach(p => { if (o[p]) o[p] *= k; });
    }
    if (o.initDimensions) o.initDimensions();
    o.setPositionByOrigin(destino, 'center', 'center'); o.setCoords();
  });
  objs.forEach(o => {
    if (o.esFondo){ try { ajustarRectFondo(o); } catch(e){} }
    if (o.type === 'conector'){ o.set('strokeWidth', o.strokeWidth * k); try { actualizarConector(o); } catch(e){} }
  });
}
async function redimensionarTodo(w2, h2){
  w2 = Math.round(w2); h2 = Math.round(h2);
  if (w2 === W && h2 === H) return;
  const w1 = W, h1 = H;
  cargando(true);
  try {
    W = w2; H = h2;   // el fondo se ajusta al tamaño nuevo
    await recorrerPaginas(objs => escalarContenido(objs, w1, h1, w2, h2), () => fijarTamano(w2, h2));
    toast('Se cambió a ' + w2 + ' × ' + h2 + ' y se acomodó el contenido de ' + paginas.length + (paginas.length === 1 ? ' página' : ' páginas'));
  } catch (e) { console.error(e); toast('No se pudo cambiar el tamaño: ' + e.message); }
  finally { cargando(false); }
}
function aplicarTamano(w, h){
  cerrarModal('mTamano');
  if ($('tAcomodar').checked) redimensionarTodo(w, h); else cambiarTamano(w, h);
}

/* =========================================================
   BUSCAR Y REEMPLAZAR
   ========================================================= */
let resultadosBusqueda = [], posBusqueda = -1;
function expresionBusqueda(){
  const q = $('bTexto').value; if (!q) return null;
  const esc_ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp($('bPalabra').checked ? '(^|[^\\wÀ-ÿ])(' + esc_ + ')(?=$|[^\\wÀ-ÿ])' : '(' + esc_ + ')', $('bMayus').checked ? 'g' : 'gi');
}
function textosDeJSON(lista, cb, ruta = []){
  (lista || []).forEach((o, i) => {
    if (typeof o.text === 'string') cb(o, ruta.concat(i));
  });
}
function buscarTextos(){
  const re = expresionBusqueda(); resultadosBusqueda = []; posBusqueda = -1;
  if (!re){ $('bInfo').textContent = 'Escribe la palabra que quieres buscar.'; return; }
  guardarPaginaActual();
  paginas.forEach((p, i) => {
    textosDeJSON(p && p.objects, (o, ruta) => {
      const n = (o.text.match(re) || []).length;
      if (n) resultadosBusqueda.push({ pagina:i, ruta, n, texto:o.text });
    });
  });
  const total = resultadosBusqueda.reduce((a, r) => a + r.n, 0), pags = new Set(resultadosBusqueda.map(r => r.pagina)).size;
  $('bInfo').textContent = total ? `${total} ${total === 1 ? 'coincidencia' : 'coincidencias'} en ${pags} ${pags === 1 ? 'página' : 'páginas'}.` : 'No se encontró en ninguna página.';
  $('bLista').innerHTML = resultadosBusqueda.slice(0, 40).map((r, k) =>
    `<div class="resBusq" data-k="${k}"><b>Pág. ${r.pagina + 1}</b> ${esc(r.texto.replace(/\s+/g, ' ').slice(0, 70))}</div>`).join('');
  $('bLista').querySelectorAll('.resBusq').forEach(d => d.onclick = () => irAResultado(+d.dataset.k));
}
function irAResultado(k){
  const r = resultadosBusqueda[k]; if (!r) return;
  posBusqueda = k;
  const seleccionar = () => {
    let o = canvas.getObjects()[r.ruta[0]];
    if (o){ canvas.setActiveObject(o); canvas.requestRenderAll(); }
  };
  if (r.pagina !== actual){ irPagina(r.pagina); setTimeout(seleccionar, 350); } else seleccionar();
}
function siguienteResultado(){
  if (!resultadosBusqueda.length) buscarTextos();
  if (!resultadosBusqueda.length) return;
  irAResultado((posBusqueda + 1) % resultadosBusqueda.length);
}
async function reemplazarTodo(){
  const re = expresionBusqueda(); if (!re) return;
  const nuevo = $('bNuevo').value, palabra = $('bPalabra').checked;
  let cambios = 0;
  cargando(true);
  try {
    await recorrerPaginas(objs => {
      const revisar = o => {
        if (typeof o.text !== 'string') return;
        const n = (o.text.match(re) || []).length; if (!n) return;
        const txt = palabra ? o.text.replace(re, (m, a, b) => a + nuevo) : o.text.replace(re, nuevo);
        if (txt.length !== o.text.length) o.styles = {};
        o.set('text', txt); if (o.initDimensions) o.initDimensions();
        if (o.textoDe){ try { ajustarFormaATexto(o); } catch(e){} }
        cambios += n;
      };
      objs.forEach(revisar);
    });
    toast(cambios ? 'Se reemplazaron ' + cambios + (cambios === 1 ? ' coincidencia' : ' coincidencias') : 'No había nada que reemplazar');
    buscarTextos();
  } catch (e) { console.error(e); toast('No se pudo reemplazar: ' + e.message); }
  finally { cargando(false); }
}
$('bTexto').addEventListener('input', () => { clearTimeout(buscarTextos._t); buscarTextos._t = setTimeout(buscarTextos, 250); });
['bMayus', 'bPalabra'].forEach(id => $(id).addEventListener('change', buscarTextos));
$('bTexto').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); siguienteResultado(); } });
function abrirBuscar(){ abrirModal('mBuscar'); setTimeout(() => { $('bTexto').focus(); $('bTexto').select(); buscarTextos(); }, 50); }

/* =========================================================
   AYUDA, ATAJOS Y RECORRIDO
   ========================================================= */
const ATAJOS = [
  ['Ctrl + Z', 'Deshacer'], ['Ctrl + Y', 'Rehacer'], ['Ctrl + S', 'Guardar en este navegador'], ['Ctrl + C / Ctrl + V', 'Copiar y pegar'],
  ['Ctrl + D', 'Duplicar'], ['Supr', 'Eliminar lo seleccionado'], ['Ctrl + A', 'Seleccionar todo'], ['Ctrl + G', 'Agrupar / desagrupar'],
  ['Ctrl + Alt + C / V', 'Copiar y pegar solo el estilo'], ['Flechas', 'Mover 1 px (con Shift, 10 px)'], ['Tab', 'Agregar una idea conectada (en mapas)'],
  ['C', 'Modo conector (unir formas)'], ['Ctrl + F', 'Buscar y reemplazar texto'], ['Doble clic', 'Editar un texto'], ['Esc', 'Salir del modo actual / quitar selección'],
  ['?', 'Abrir esta ayuda'], ['En la presentación: → ← Esc N', 'Avanzar, regresar, salir y ver tus notas'], ['Ctrl + rueda del mouse', 'Acercar / alejar']
];
$('listaAtajos').innerHTML = ATAJOS.map(([t, d]) => `<div class="atajo"><kbd>${esc(t)}</kbd><span>${esc(d)}</span></div>`).join('');
const PASOS_RECORRIDO = [
  ['#pestanas', 'Aquí está todo lo que puedes agregar: plantillas, textos, formas, elementos, dibujos, imágenes, diagramas, fondos y tu marca.'],
  ['#lateral', 'En este panel eliges lo que quieres agregar. Empieza con una plantilla o una presentación completa.'],
  ['#envoltura', 'Este es tu lienzo. Haz clic en algo para seleccionarlo, arrástralo para moverlo y usa las esquinas para cambiar su tamaño. Doble clic en un texto para escribir.'],
  ['#props', 'Cuando seleccionas algo, aquí cambias su color, letra, borde, animación y orden.'],
  ['#paginas', 'Tus páginas o diapositivas. Agrega, duplica o reordena. Arriba de ellas están tus notas del presentador.'],
  ['#tamTxt', 'Cambia el tamaño del diseño. Con “Acomodar el contenido”, todo se ajusta solo al nuevo tamaño.'],
  ['[onclick*="mPresentar"]', 'Presenta en pantalla completa con animaciones, o con la vista del presentador.'],
  ['[onclick*="mExportar"]', 'Descarga PNG, JPG, PDF para imprimir, PowerPoint o video.'],
  ['[onclick*="guardarDrive"]', 'Guarda en tu este navegador. También se guarda solo mientras trabajas.'],
  ['[onclick*="mCompartir"]', 'Comparte una copia con tus compañeros por enlace o WhatsApp. ¡Listo, ya conoces lo básico!']
];
let pasoRec = -1;
function iniciarRecorrido(){ cerrarModal('mAyuda'); $('bienvenida').style.display = 'none'; try { localStorage.setItem('disenador_recorrido', '1'); } catch(e){} pasoRec = -1; siguientePaso(1); }
function siguientePaso(d){
  pasoRec += d;
  while (pasoRec >= 0 && pasoRec < PASOS_RECORRIDO.length){
    const el = document.querySelector(PASOS_RECORRIDO[pasoRec][0]);
    if (el && el.getBoundingClientRect().width > 0) break;
    pasoRec += d || 1;
  }
  if (pasoRec < 0) pasoRec = 0;
  if (pasoRec >= PASOS_RECORRIDO.length){ terminarRecorrido(); return; }
  const [sel, texto] = PASOS_RECORRIDO[pasoRec], el = document.querySelector(sel), r = el.getBoundingClientRect();
  const foco = $('recFoco'), caja = $('recCaja');
  $('recorrido').style.display = 'block';
  Object.assign(foco.style, { left:(r.left - 6) + 'px', top:(r.top - 6) + 'px', width:(r.width + 12) + 'px', height:(r.height + 12) + 'px' });
  $('recTexto').textContent = texto;
  $('recNum').textContent = (pasoRec + 1) + ' / ' + PASOS_RECORRIDO.length;
  $('recSig').textContent = pasoRec === PASOS_RECORRIDO.length - 1 ? 'Terminar' : 'Siguiente →';
  $('recAnt').style.visibility = pasoRec ? 'visible' : 'hidden';
  const cw = Math.min(340, window.innerWidth - 24), ch = caja.offsetHeight || 150;
  let x = r.right + 16, y = r.top;
  if (x + cw > window.innerWidth - 12) x = r.left - cw - 16;
  if (x < 12){ x = Math.max(12, Math.min(window.innerWidth - cw - 12, r.left + r.width / 2 - cw / 2)); y = r.bottom + 16; if (y + ch > window.innerHeight - 12) y = r.top - ch - 16; }
  y = Math.max(12, Math.min(window.innerHeight - ch - 12, y));
  Object.assign(caja.style, { left:x + 'px', top:y + 'px', width:cw + 'px' });
}
function terminarRecorrido(){ $('recorrido').style.display = 'none'; pasoRec = -1; }
window.addEventListener('resize', () => { if (pasoRec >= 0) siguientePaso(0); });
document.addEventListener('keydown', e => {
  const tag = (document.activeElement || {}).tagName, o = activo();
  if (pasoRec >= 0){
    if (e.key === 'Escape'){ e.preventDefault(); terminarRecorrido(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter'){ e.preventDefault(); siguientePaso(1); }
    else if (e.key === 'ArrowLeft'){ e.preventDefault(); siguientePaso(-1); }
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F' || e.key === 'h' || e.key === 'H')){ e.preventDefault(); abrirBuscar(); return; }
  if (['INPUT','SELECT','TEXTAREA'].includes(tag) || (o && o.isEditing)) return;
  if (e.key === '?'){ e.preventDefault(); abrirModal('mAyuda'); }
});
// Bienvenida para quien entra por primera vez (no estorba: se puede ignorar)
(function(){
  let visto = false; try { visto = localStorage.getItem('disenador_recorrido') === '1'; } catch(e){}
  if (!visto) setTimeout(() => { $('bienvenida').style.display = 'flex'; }, 1800);
})();
function cerrarBienvenida(){ $('bienvenida').style.display = 'none'; try { localStorage.setItem('disenador_recorrido', '1'); } catch(e){} }

/* =========================================================
   ARCHIVOS DEL EQUIPO Y DONACIONES
   ========================================================= */
const CONFIG = Object.assign({ donaciones:[], mensajeDonacion:'' }, window.APIK_CONFIG || {});
if (window.MODO_WEB) document.body.classList.add('modoWeb');
// Descargar el diseño como archivo (copia de seguridad, para pasarlo a otra computadora o compartirlo)
function descargarDisenoArchivo(){
  canvas.discardActiveObject(); canvas.requestRenderAll();
  bajarBlob(new Blob([serializar()], { type:'application/json' }), nombreArchivo() + '.apik.json');
  toast('Se descargó tu diseño. Para abrirlo: 📂 Abrir → “Abrir un archivo”.');
}
$('archivoDiseno').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const lector = new FileReader();
  lector.onload = () => {
    const txt = lector.result;
    try { const d = JSON.parse(txt); if (!d || !(d.p || d.c)) throw new Error('formato'); }
    catch (err) { toast('Ese archivo no es un diseño de esta app'); return; }
    $('nombreDiseno').value = f.name.replace(/\.apik\.json$|\.json$/i, '') || 'Mi diseño';
    historial = []; hi = -1; miniaturas = [];
    cargarJSON(txt, true, () => { cerrarModal('mProyectos'); enDrive = false; indicadorGuardado('nuevo'); toast('Diseño abierto desde tu archivo. Pulsa 💾 Guardar para conservarlo aquí.'); });
  };
  lector.readAsText(f);
});
// Ventana de donaciones (los enlaces se configuran en config.js)
function abrirDonaciones(){
  const lista = (CONFIG.donaciones || []).filter(d => d && /^https?:\/\//i.test(d.url || ''));
  $('textoDonacion').textContent = CONFIG.mensajeDonacion ||
    'Este diseñador es gratuito. Si te sirve para tus tareas, exposiciones o tu negocio, puedes apoyarnos con una donación para seguir agregando funciones y pagar el servidor.';
  $('listaDonaciones').innerHTML = lista.length
    ? lista.map(d => `<a class="donBtn" href="${esc(d.url)}" target="_blank" rel="noopener"><b>${esc(d.icono || '❤')} ${esc(d.nombre || 'Donar')}</b>${d.detalle ? `<span>${esc(d.detalle)}</span>` : ''}</a>`).join('')
    : '<p class="hint">Muy pronto podrás apoyar el proyecto desde aquí.</p>';
  abrirModal('mDonar');
}

/* =========================================================
   LOGOS Y TARJETAS: rellenos, resplandor, formas, repetir
   ========================================================= */
EXTRA.push('relleno');
// ---------- Rellenos: sólido, degradado, rayas, puntos, cuadrícula o sin relleno ----------
const TIPOS_PATRON = ['rayas', 'puntos', 'cuadros'];
function crearPatron(r, factor){
  const Q = 4;                                   // se dibuja 4 veces más grande para que se vea nítido al exportar
  const g = Math.max(0.5, r.gros * factor), sp = Math.max(0.5, r.sep * factor);
  const n = Math.max(2, Math.round((g + sp) * Q)), gq = Math.max(1, Math.round(g * Q));
  const c = document.createElement('canvas'); c.width = n; c.height = n;
  const ctx = c.getContext('2d');
  if (!r.transp){ ctx.fillStyle = r.c2; ctx.fillRect(0, 0, n, n); }
  ctx.fillStyle = r.c1;
  if (r.tipo === 'rayas') ctx.fillRect(0, 0, gq, n);
  else if (r.tipo === 'puntos'){ ctx.beginPath(); ctx.arc(n / 2, n / 2, gq / 2, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.fillRect(0, 0, gq, n); ctx.fillRect(0, 0, n, gq); }
  const a = (r.ang || 0) * Math.PI / 180, cs = Math.cos(a) / Q, sn = Math.sin(a) / Q;
  return new fabric.Pattern({ source:c, repeat:'repeat', patternTransform:[cs, sn, -sn, cs, 0, 0] });
}
function crearRelleno(o, r, k){
  if (r.tipo === 'ninguno') return 'rgba(0,0,0,0)';
  if (r.tipo === 'degradado' || r.tipo === 'radial'){
    const stops = [{ offset:0, color:r.c1 }, { offset:1, color:r.c2 }];
    if (r.tipo === 'radial') return new fabric.Gradient({ type:'radial', gradientUnits:'percentage',
      coords:{ x1:0.5, y1:0.5, r1:0, x2:0.5, y2:0.5, r2:0.5 }, colorStops:stops });
    const a = (r.ang || 0) * Math.PI / 180, cx = Math.cos(a) / 2, cy = Math.sin(a) / 2;
    return new fabric.Gradient({ type:'linear', gradientUnits:'percentage',
      coords:{ x1:0.5 - cx, y1:0.5 - cy, x2:0.5 + cx, y2:0.5 + cy }, colorStops:stops });
  }
  if (TIPOS_PATRON.includes(r.tipo)) return crearPatron(r, k / Math.max(0.01, Math.abs(o.scaleX || 1)));
  return r.c1;
}
const admiteRelleno = x => x && x.type !== 'image' && !esLinea(x) && !x.trazoLibre && x.type !== 'conector' && x.type !== 'group' && x.type !== 'activeSelection';
// Pone el relleno en un objeto. k = tamaño de las rayas (por defecto, según el tamaño del diseño)
function aplicarRelleno(o, r, k){
  if (!admiteRelleno(o)) return;
  const datos = { tipo:r.tipo, c1:r.c1, c2:r.c2, ang:r.ang ?? 45, gros:r.gros ?? 14, sep:r.sep ?? 14, transp:r.transp !== false };
  if (o.efectoTexto === 'hueco' || o.efectoTexto === 'neonHueco') o.rellenoOriginal = null;
  o.set('fill', crearRelleno(o, datos, k ?? s()));
  o.relleno = datos.tipo === 'solido' ? null : datos;
  if (esTexto(o) && o.initDimensions) o.initDimensions();
  o.dirty = true;
}
function rellenoDelPanel(){
  return { tipo:$('pTipoRelleno').value, c1:$('pRelleno').value, c2:$('pRelleno2').value, ang:+$('pRellAng').value,
    gros:+$('pRellGros').value, sep:+$('pRellSep').value, transp:$('pRellTransp').checked };
}
function objetivosRelleno(){
  const ts = objetivos();
  return ts.flatMap(hojas).filter(x => admiteRelleno(x) && !(x.textoDe && ts.includes(porId(x.textoDe))));
}
function aplicarRellenoPanel(guardar){
  const r = rellenoDelPanel();
  objetivosRelleno().forEach(x => aplicarRelleno(x, r));
  objetivos().forEach(o => { o.dirty = true; if (o.type === 'group' && o.addWithUpdate) o.addWithUpdate(); });
  objetivos().flatMap(hojas).filter(x => x.textoDe).forEach(ajustarFormaATexto);
  mostrarOpcionesRelleno();
  canvas.requestRenderAll();
  if (guardar) guardarEstado();
}
function mostrarOpcionesRelleno(){
  const t = $('pTipoRelleno').value, patron = TIPOS_PATRON.includes(t), grad = t === 'degradado' || t === 'radial';
  $('filaRelleno2').hidden = !(grad || (patron && !$('pRellTransp').checked));
  $('filaRelleno2').querySelector('label').textContent = patron ? 'Fondo' : 'Color 2';
  $('filaRellAng').hidden = !(t === 'degradado' || t === 'rayas' || t === 'cuadros');
  $('filaRellGros').hidden = $('filaRellSep').hidden = $('filaRellTransp').hidden = !patron;
  $('filaRellGros').querySelector('label').textContent = t === 'puntos' ? 'Tamaño' : 'Grosor';
}
function tipoRellenoDe(x){
  if (!x) return 'solido';
  if (x.relleno && x.relleno.tipo) return x.relleno.tipo;
  if (x.fill instanceof fabric.Gradient) return x.fill.type === 'radial' ? 'radial' : 'degradado';
  if (x.fill instanceof fabric.Pattern) return 'rayas';
  return 'solido';
}
$('pTipoRelleno').addEventListener('change', () => {
  if ($('pTipoRelleno').value === 'degradado' || $('pTipoRelleno').value === 'radial') $('pRellAng').value = $('pRellAng').value || 45;
  aplicarRellenoPanel(true);
});
['pRelleno2', 'pRellAng', 'pRellGros', 'pRellSep'].forEach(id => {
  $(id).addEventListener('input', () => aplicarRellenoPanel(false));
  $(id).addEventListener('change', guardarEstado);
});
$('pRellTransp').addEventListener('change', () => aplicarRellenoPanel(true));
// Al cambiar el color principal: si el relleno no es sólido, se rehace con el color nuevo
$('pRelleno').addEventListener('input', () => {
  if ($('pTipoRelleno').value === 'solido'){ objetivosRelleno().forEach(x => { x.relleno = null; }); return; }
  aplicarRellenoPanel(false);
});
// Colores rápidos para degradados y rayas
const COMBOS_RELLENO = [['#19c8ff','#0a3d91'],['#ff4b2b','#ffb199'],['#ff4b2b','#2b2d42'],['#7c3aed','#06b6d4'],['#f97316','#ec4899'],['#10b981','#3b82f6'],['#facc15','#f97316'],['#111827','#4b5563']];
COMBOS_RELLENO.forEach(([a, b]) => {
  const d = document.createElement('div'); d.className = 'sw'; d.title = 'Usar estos dos colores';
  d.style.background = `linear-gradient(135deg,${a},${b})`;
  d.onclick = () => {
    $('pRelleno').value = a; $('pRelleno2').value = b;
    if ($('pTipoRelleno').value === 'solido') $('pTipoRelleno').value = 'degradado';
    aplicarRellenoPanel(true);
  };
  $('combosRelleno').appendChild(d);
});

// ---------- Resplandor neón (sombra sin desplazamiento, del color que elijas) ----------
function aplicarResplandor(){
  if ($('pSombraTipo').value !== 'brillo' || !$('pSombra').checked) return;
  const sh = new fabric.Shadow({ color:$('pSombraColor').value, blur:+$('pSombraBlur').value * s() * 1.4, offsetX:0, offsetY:0 });
  objetivos().forEach(o => o.set('shadow', sh)); canvas.requestRenderAll();
}
$('pSombra').addEventListener('change', () => { if ($('pSombraTipo').value === 'brillo' && $('pSombra').checked){ aplicarResplandor(); guardarEstado(); } });
$('pSombraColor').addEventListener('input', aplicarResplandor);
$('pSombraBlur').addEventListener('input', aplicarResplandor);
$('pSombraTipo').addEventListener('change', () => {
  if (!$('pSombra').checked){ $('pSombra').checked = true; }
  if ($('pSombraTipo').value === 'brillo'){
    const ref = objetivos().flatMap(hojas)[0];
    if (ref && $('pSombraColor').value === '#000000') $('pSombraColor').value = aHex(typeof ref.fill === 'string' && ref.fill !== 'rgba(0,0,0,0)' ? ref.fill : (ref.stroke || '#19c8ff'));
    if (+$('pSombraBlur').value < 20) $('pSombraBlur').value = 30;
    aplicarResplandor();
  } else aplicarSombra();
  guardarEstado();
});
const esResplandor = sh => !!sh && !sh.offsetX && !sh.offsetY;

// Al seleccionar algo, el panel muestra su tipo de relleno y de sombra
const actualizarPanelBase22 = actualizarPanel;
actualizarPanel = function(){
  actualizarPanelBase22.apply(this, arguments);
  if (generandoVista) return;
  const o = activo(); if (!o) return;
  const ref = objetivos().flatMap(hojas).find(admiteRelleno);
  $('filaTipoRelleno').hidden = !ref;
  if (ref){
    const t = tipoRellenoDe(ref), r = ref.relleno;
    $('pTipoRelleno').value = t;
    if (r){
      $('pRelleno').value = aHex(r.c1); $('pRelleno2').value = aHex(r.c2);
      $('pRellAng').value = r.ang; $('pRellGros').value = r.gros; $('pRellSep').value = r.sep; $('pRellTransp').checked = r.transp !== false;
    } else if (ref.fill instanceof fabric.Gradient){
      const cs = ref.fill.colorStops || [];
      if (cs[0]) $('pRelleno').value = aHex(cs[0].color);
      if (cs[cs.length - 1]) $('pRelleno2').value = aHex(cs[cs.length - 1].color);
    }
    if (t === 'ninguno' && ref.stroke) $('pRelleno').value = aHex(ref.relleno ? ref.relleno.c1 : ref.stroke);
  }
  mostrarOpcionesRelleno();
  const sh = (objetivos().flatMap(hojas)[0] || o).shadow;
  $('pSombraTipo').value = esResplandor(sh) ? 'brillo' : 'sombra';
  if (esResplandor(sh)) $('pSombraBlur').value = Math.round(sh.blur / (1.4 * s()));
};

// ---------- Efecto de texto: Neón hueco (solo contorno que brilla) ----------
const aplicarEfectoTextoBase22 = aplicarEfectoTexto;
aplicarEfectoTexto = function(t, efecto){
  if (t.efectoTexto === 'neonHueco') t.efectoTexto = 'hueco';
  if (efecto !== 'neonHueco') return aplicarEfectoTextoBase22(t, efecto);
  aplicarEfectoTextoBase22(t, 'hueco');
  const color = t.rellenoOriginal || '#19c8ff';
  t.set({ strokeWidth:Math.max(1.5, t.fontSize * 0.035), shadow:new fabric.Shadow({ color, blur:t.fontSize * 0.35, offsetX:0, offsetY:0 }) });
  t.efectoTexto = 'neonHueco'; t.dirty = true;
};
EFECTOS_TEXTO.neonHueco = { n:'Neón hueco', css:'color:transparent;-webkit-text-stroke:1.2px #19c8ff;text-shadow:0 0 6px #19c8ff' };
(function(){
  const b = document.createElement('button'); b.className = 'efectoBtn'; b.dataset.e = 'neonHueco'; b.title = 'Neón hueco';
  b.innerHTML = `<b style="${EFECTOS_TEXTO.neonHueco.css}">Aa</b>Neón hueco`;
  b.onclick = () => { textos().forEach(t => aplicarEfectoTexto(t, 'neonHueco')); canvas.requestRenderAll(); actualizarPanel(); guardarEstado(); };
  $('efectosTexto').appendChild(b);
})();

// ---------- Formas nuevas para logos y tarjetas ----------
const FORMAS_LOGO = {
  semicirculo: 'M0 100 A100 100 0 0 1 200 100 Z',
  onda:        'M0 70 C70 0 150 140 240 70 C330 0 410 140 480 70 L480 220 L0 220 Z',
  esquina:     'M0 300 C60 200 120 170 180 120 C240 70 270 30 300 0 L300 300 Z',
  mancha:      'M120 10 C175 0 225 45 230 100 C236 160 200 215 140 228 C80 240 18 205 8 140 C-2 80 50 22 120 10 Z',
  gota:        'M50 0 C70 30 92 55 92 72 C92 96 73 114 50 114 C27 114 8 96 8 72 C8 55 30 30 50 0 Z',
  escudo:      'M50 0 L95 15 C95 60 80 90 50 110 C20 90 5 60 5 15 Z',
  insignia:    'M50 0 L61 12 L77 8 L80 24 L95 30 L88 45 L97 60 L83 69 L84 86 L67 86 L58 100 L50 92 L42 100 L33 86 L16 86 L17 69 L3 60 L12 45 L5 30 L20 24 L23 8 L39 12 Z'
};
const NOMBRES_FORMA_LOGO = { semicirculo:'Semicírculo', onda:'Onda', esquina:'Esquina en curva', mancha:'Mancha', gota:'Gota', escudo:'Escudo', insignia:'Insignia' };
const agregarFormaBase22 = agregarForma;
agregarForma = function(tipo){
  const k = s(), color = $('colorForma').value;
  const base = { left:W/2, top:H/2, originX:'center', originY:'center', fill:color, strokeWidth:0, stroke:null };
  if (FORMAS_LOGO[tipo]){
    const o = new fabric.Path(FORMAS_LOGO[tipo], base);
    o.scaleToWidth((tipo === 'onda' ? 520 : 320) * k);
    o.setPositionByOrigin(new fabric.Point(W/2, H/2), 'center', 'center');
    return agregar(o, NOMBRES_FORMA_LOGO[tipo]);
  }
  if (tipo === 'anillo'){
    const o = new fabric.Circle({ ...base, radius:160*k, fill:'rgba(0,0,0,0)', stroke:color, strokeWidth:26*k, strokeUniform:true });
    o.relleno = { tipo:'ninguno', c1:color, c2:'#ffffff', ang:45, gros:14, sep:14, transp:true };
    return agregar(o, 'Anillo');
  }
  if (tipo === 'rayas' || tipo === 'puntos'){
    const o = new fabric.Rect({ ...base, width:420*k, height:260*k });
    aplicarRelleno(o, { tipo, c1:color, c2:'#ffffff', ang: tipo === 'rayas' ? 60 : 0, gros: tipo === 'rayas' ? 14 : 12, sep: tipo === 'rayas' ? 16 : 18, transp:true });
    return agregar(o, tipo === 'rayas' ? 'Rayas' : 'Puntos');
  }
  return agregarFormaBase22(tipo);
};
(function(){
  const iconos = [
    ['anillo', 'Anillo (círculo sin relleno)', '<circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" stroke-width="1.4"/>'],
    ['semicirculo', 'Semicírculo', '<path d="M1 7 A4 4 0 0 1 9 7 Z"/>'],
    ['onda', 'Onda', '<path d="M0 4 C1.5 2 3 6 5 4 C7 2 8.5 6 10 4 L10 9 L0 9 Z"/>'],
    ['esquina', 'Esquina en curva (para tarjetas)', '<path d="M1 9 C3 6 6 5 9 1 L9 9 Z"/>'],
    ['mancha', 'Mancha orgánica', '<path d="M5 1 C7.5 0.8 9.3 3 9.2 5.2 C9 7.8 6.8 9.4 4.6 9.2 C2.2 9 0.8 7 0.9 5 C1 2.8 2.8 1.2 5 1 Z"/>'],
    ['gota', 'Gota', '<path d="M5 0.5 C6.4 2.8 8 4.4 8 6.2 C8 8 6.7 9.4 5 9.4 C3.3 9.4 2 8 2 6.2 C2 4.4 3.6 2.8 5 0.5 Z"/>'],
    ['escudo', 'Escudo', '<path d="M5 0.6 L9 2 C9 5.6 7.6 8 5 9.5 C2.4 8 1 5.6 1 2 Z"/>'],
    ['insignia', 'Insignia / sello', '<polygon points="5,0.5 6,1.6 7.6,1.3 7.9,2.8 9.4,3.4 8.7,4.8 9.6,6.2 8.2,7 8.3,8.6 6.7,8.6 5.8,9.8 5,9 4.2,9.8 3.3,8.6 1.7,8.6 1.8,7 0.4,6.2 1.3,4.8 0.6,3.4 2.1,2.8 2.4,1.3 4,1.6"/>'],
    ['rayas', 'Bloque de rayas', '<path d="M1 9 L3 1 M4 9 L6 1 M7 9 L9 1" stroke="currentColor" stroke-width="1.2" fill="none"/>'],
    ['puntos', 'Bloque de puntos', '<circle cx="2" cy="2" r="0.9"/><circle cx="5" cy="2" r="0.9"/><circle cx="8" cy="2" r="0.9"/><circle cx="2" cy="5" r="0.9"/><circle cx="5" cy="5" r="0.9"/><circle cx="8" cy="5" r="0.9"/><circle cx="2" cy="8" r="0.9"/><circle cx="5" cy="8" r="0.9"/><circle cx="8" cy="8" r="0.9"/>']
  ];
  const grid = document.querySelector('#tFormas .grid');
  iconos.forEach(([tipo, titulo, svg]) => {
    const b = document.createElement('button'); b.className = 'forma'; b.title = titulo;
    b.innerHTML = `<svg viewBox="0 0 10 10">${svg}</svg>`;
    b.onclick = () => agregarForma(tipo);
    grid.appendChild(b);
  });
})();

// ---------- Repetir en serie (para rayas, puntos, filas de íconos…) ----------
const clonarPromesa = o => new Promise(ok => o.clone(ok, EXTRA));
async function repetirSerie(){
  const sel = activo();
  if (!sel) return toast('Primero selecciona lo que quieres repetir');
  const n = Math.max(1, Math.min(60, Math.round(+$('repN').value || 1)));
  const k = s(), dx = (+$('repX').value || 0) * k, dy = (+$('repY').value || 0) * k, giro = +$('repGiro').value || 0;
  if (!dx && !dy && !giro) return toast('Escribe cuánto se mueve cada copia (X o Y) o cuánto gira');
  const lista = sel.type === 'activeSelection' ? sel.getObjects().slice() : [sel];
  canvas.discardActiveObject();
  const nuevos = [];
  restaurando = true;
  try {
    for (const o of lista){
      for (let i = 1; i <= n; i++){
        const c = await clonarPromesa(o);
        limpiarVinculosClon(c);
        c.id = nuevoId();
        c.set({ left:o.left + dx * i, top:o.top + dy * i, angle:(o.angle || 0) + giro * i, evented:true });
        canvas.add(c); c.setCoords(); nuevos.push(c);
      }
    }
  } finally { restaurando = false; }
  const todos = [...lista, ...nuevos];
  canvas.setActiveObject(new fabric.ActiveSelection(todos, { canvas }));
  canvas.requestRenderAll(); renderCapas(); guardarEstado();
  toast(`Listo: ${nuevos.length} copias. Si quieres moverlas juntas, pulsa “Agrupar”.`);
}

// ---------- Fuentes para logos ----------
['Orbitron', 'UnifrakturMaguntia', 'Audiowide', 'Exo 2', 'Righteous'].forEach(f => {
  try { document.fonts.load(`400 40px "${f}"`); document.fonts.load(`800 40px "${f}"`); } catch(e){}
});

// ---------- Plantillas de logos y tarjetas ----------
const CAT_LOGO = 'Logos y tarjetas';
const NEON = '#19c8ff', ROJO = '#ff4b2b';
function TL(texto, x, y, o = {}){            // texto alineado a la izquierda desde x
  const w = o.w || 600;
  const t = T(texto, x + w / 2, y, { ...o, al:'left', w });
  return t;
}
function FORMA_PATH(d, fill, o = {}){
  const p = new fabric.Path(d, { fill, stroke:o.stroke || null, strokeWidth:o.sw || 0, opacity:o.op ?? 1, name:o.nombre || 'Forma', id:nuevoId() });
  canvas.add(p); return p;
}
function BRILLO(o, color, blur){ o.set('shadow', new fabric.Shadow({ color, blur, offsetX:0, offsetY:0 })); return o; }
function ANILLO(x, y, r, color, grosor, o = {}){
  const c = new fabric.Circle({ left:x, top:y, radius:r, originX:'center', originY:'center', fill:o.fill || 'rgba(0,0,0,0)', stroke:color, strokeWidth:grosor, name:'Anillo', id:nuevoId() });
  canvas.add(c); return c;
}
function RAYAS(x, y, w, h, color, o = {}){
  const r = new fabric.Rect({ left:x, top:y, width:w, height:h, angle:o.ang || 0, fill:color, name:o.nombre || 'Rayas', id:nuevoId() });
  aplicarRelleno(r, { tipo:'rayas', c1:color, c2:'#ffffff', ang:o.inclin ?? 70, gros:o.gros || 12, sep:o.sep || 14, transp:true }, 1);
  canvas.add(r); return r;
}
function LETRA_A(x, y, tam, o = {}){
  const t = T(o.texto || 'A', x, y, { f:'UnifrakturMaguntia', s:tam, w:tam * 1.4, c:NEON, lh:1 });
  t.set('fill', new fabric.Gradient({ type:'linear', gradientUnits:'percentage', coords:{ x1:0, y1:0, x2:1, y2:1 },
    colorStops:[{ offset:0, color:o.c1 || '#5ee7ff' }, { offset:1, color:o.c2 || '#0a84ff' }] }));
  t.relleno = { tipo:'degradado', c1:o.c1 || '#5ee7ff', c2:o.c2 || '#0a84ff', ang:45, gros:14, sep:14, transp:true };
  BRILLO(t, 'rgba(25,200,255,.75)', tam * 0.12);
  return t;
}
function TITULO_NEON(texto, x, y, tam, w){
  const t = T(texto, x, y, { f:'Orbitron', s:tam, b:'800', c:NEON, w:w || 900, cs:80 });
  t.set({ fill:'rgba(0,0,0,0)', stroke:NEON, strokeWidth:Math.max(1.5, tam * 0.035), rellenoOriginal:NEON, efectoTexto:'neonHueco' });
  BRILLO(t, NEON, tam * 0.35);
  return t;
}
const PLANTILLAS_LOGO = [
  { nombre:'Tarjeta de presentación clara (rayas rojas)', tam:[1063, 591], crear(){
    FONDO('#f4f2ef');
    const ola1 = FORMA_PATH('M 610 591 C 690 470 780 470 860 380 C 930 300 990 250 1063 230 L 1063 591 Z', ROJO, { nombre:'Ola de rayas roja' });
    aplicarRelleno(ola1, { tipo:'rayas', c1:'#e8452c', c2:'#ffffff', ang:60, gros:9, sep:9, transp:true }, 1);
    const ola2 = FORMA_PATH('M 760 591 C 830 520 900 520 960 470 C 1000 440 1030 420 1063 410 L 1063 591 Z', '#2b2d42', { nombre:'Ola de rayas oscura' });
    aplicarRelleno(ola2, { tipo:'rayas', c1:'#2b2d42', c2:'#ffffff', ang:60, gros:9, sep:9, transp:true }, 1);
    TL('Ing. Tu Nombre', 56, 52, { f:'Poppins', s:24, b:'600', c:'#2b2b2b', w:500 });
    TL('SOLUCIONES\nINFORMÁTICAS', 56, 140, { f:'Montserrat', s:56, b:'900', c:'#2b2b2b', w:620, lh:1.02 });
    RECT(56, 222, 951, 3, '#e8452c', { nombre:'Línea' });
    TL('Si lo puedes imaginar, lo puedes programar', 56, 270, { f:'Poppins', s:24, b:'600', c:'#2b2b2b', w:560 });
    [['📞', '55 0000 0000 (celular)'], ['✉️', 'tucorreo@gmail.com'], ['📍', 'Tu colonia, tu ciudad'], ['🌐', 'facebook.com/tu-pagina']].forEach(([ic, tx], i) => {
      TL(ic, 56, 345 + i * 52, { f:'Inter', s:26, c:'#e8452c', w:44 });
      TL(tx, 108, 345 + i * 52, { f:'Inter', s:22, c:'#2b2b2b', w:470 });
    });
  }},
  { nombre:'Tarjeta de presentación oscura (reverso)', tam:[1063, 591], crear(){
    FONDO('#1b1c26');
    RAYAS(600, -30, 360, 150, ROJO, { inclin:0, gros:12, sep:14, nombre:'Rayas superiores' });
    CIRC(1010, 70, 190, ROJO, { nombre:'Círculo rojo' });
    CIRC(930, 270, 70, '#ff6a4d', { nombre:'Círculo pequeño' });
    RAYAS(-20, 420, 330, 190, ROJO, { inclin:25, gros:12, sep:14, nombre:'Rayas inferiores' });
    CIRC(200, 650, 200, ROJO, { nombre:'Círculo inferior' });
    TL('APIK\nDESING', 56, 150, { f:'Montserrat', s:112, b:'900', c:ROJO, w:560, lh:0.95 });
    TL('DISEÑO WEB Y\nDESARROLLO DE\nSOFTWARE', 600, 470, { f:'Montserrat', s:26, b:'600', c:'#ffffff', w:420, cs:260, lh:1.35 });
  }},
  { nombre:'Tarjeta de presentación neón', tam:[1063, 591], crear(){
    FONDO('#05070d');
    CIRC(1080, -60, 190, '#0b1a2e', { nombre:'Brillo de fondo' }).set('opacity', 0.8);
    BRILLO(ANILLO(230, 295, 150, NEON, 9, { fill:'#060a12' }), NEON, 28);
    LETRA_A(232, 300, 230);
    TITULO_NEON('APIK-DESING', 700, 220, 54, 620);
    T('Diseño web y desarrollo de software', 700, 300, { f:'Poppins', s:24, c:'#cfe9ff', w:600 });
    RECT(470, 345, 460, 2, NEON, { nombre:'Línea' }).set('opacity', 0.6);
    T('55 0000 0000  ·  tucorreo@gmail.com', 700, 395, { f:'Inter', s:21, c:'#9fdcff', w:620 });
    T('facebook.com/tu-pagina', 700, 435, { f:'Inter', s:21, c:'#9fdcff', w:620 });
  }},
  { nombre:'Logo neón con letra gótica', tam:[1000, 1000], crear(){
    FONDO('#05070d');
    CIRC(500, 500, 470, '#0a1422', { nombre:'Brillo de fondo' }).set('opacity', 0.8);
    BRILLO(ANILLO(500, 500, 400, NEON, 22, { fill:'#060a12' }), NEON, 60);
    LETRA_A(505, 515, 640);
  }},
  { nombre:'Logo de marca con nombre (banner)', tam:[1200, 630], crear(){
    DEGRADADO('#05080d', '#140a0a');
    CIRC(1190, -50, 210, ROJO, { nombre:'Círculo rojo' }).set('opacity', 0.9);
    RAYAS(-40, 505, 380, 170, ROJO, { inclin:25, gros:12, sep:14, nombre:'Rayas' }).set('opacity', 0.75);
    BRILLO(ANILLO(240, 315, 150, NEON, 9, { fill:'#060a12' }), NEON, 30);
    LETRA_A(242, 320, 230);
    TITULO_NEON('APIK-DESING', 760, 250, 70, 760);
    T('Tu frase o lo que haces, en una línea', 760, 350, { f:'Poppins', s:28, c:'#e8f6ff', w:700 });
  }},
  { nombre:'Logo monograma (iniciales)', tam:[1000, 1000], crear(){
    FONDO('#ffffff');
    const c = CIRC(500, 430, 300, ROJO, { nombre:'Círculo' });
    aplicarRelleno(c, { tipo:'degradado', c1:'#ff4b2b', c2:'#ff9a3c', ang:45 }, 1);
    BRILLO(ANILLO(500, 430, 340, '#2b2d42', 10), 'rgba(0,0,0,0)', 0).set('shadow', null);
    T('AD', 500, 440, { f:'Montserrat', s:260, b:'900', c:'#ffffff', w:600, lh:1 });
    T('TU MARCA', 500, 845, { f:'Orbitron', s:72, b:'800', c:'#2b2d42', w:900, cs:200 });
    T('Diseño · Software', 500, 925, { f:'Poppins', s:34, c:'#6b7280', w:800 });
  }}
];
const FUENTES_LOGO = ['Orbitron', 'UnifrakturMaguntia', 'Montserrat', 'Poppins', 'Inter'];
function cargarFuentesLogo(){
  return Promise.all(FUENTES_LOGO.flatMap(f => [`400 40px "${f}"`, `800 40px "${f}"`, `900 40px "${f}"`]
    .map(q => document.fonts.load(q).catch(() => null)))).catch(() => null);
}
function usarPlantillaLogo(p){
  const fin = () => { FUENTES_LOGO.forEach(f => fabric.util.clearFabricFontCache(f)); usarOrganizador(p); };
  Promise.race([cargarFuentesLogo(), new Promise(r => setTimeout(r, 2500))]).then(fin, fin);
}
PLANTILLAS_LOGO.forEach(p => CATALOGO.push({ nombre:p.nombre, cat:CAT_LOGO, tam:p.tam, crear:p.crear, usar:() => usarPlantillaLogo(p) }));
CATEGORIAS.splice(CATEGORIAS.indexOf(CAT_DER) + 1, 0, CAT_LOGO);
(function(){
  const c = document.createElement('button'); c.className = 'chip'; c.textContent = '🪪 Logos y tarjetas';
  c.onclick = () => { catActiva = CAT_LOGO; document.querySelectorAll('#chipsCat .chip').forEach(x => x.classList.toggle('on', x === c)); renderCatalogo(); };
  const der = [...document.querySelectorAll('#chipsCat .chip')].find(x => x.textContent.includes('Derecho'));
  if (der) der.after(c); else $('chipsCat').appendChild(c);
  renderCatalogo();
})();

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
const descargarImagenBase23 = descargarImagen;
descargarImagen = async function(){
  if ($('eFormato').value !== 'svg') return descargarImagenBase23.apply(this, arguments);
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
const vistaPreviaBase23 = vistaPrevia;
vistaPrevia = async function(){
  if ($('eFormato').value !== 'svg') return vistaPreviaBase23.apply(this, arguments);
  const lista = paginasAExportar(), transp = $('eTransp').checked;
  cargando(true);
  try {
    const imgs = []; for (const it of lista) imgs.push(svgADataURL(await crearSVG(it.p, transp)));
    $('vista').innerHTML = '<p class="hint">Vista del SVG (vectorial: puedes agrandarlo sin que pierda calidad).</p>' +
      imgs.map(u => `<img src="${u}" style="margin-bottom:8px;background:repeating-conic-gradient(#ccc 0 25%,#fff 0 50%) 0 0/16px 16px">`).join('');
  } finally { cargando(false); }
};
const exportarDriveBase23 = exportarDrive;
exportarDrive = async function(){
  if ($('eFormato').value !== 'svg') return exportarDriveBase23.apply(this, arguments);
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
const actualizarPanelBase23 = actualizarPanel;
actualizarPanel = function(){
  actualizarPanelBase23.apply(this, arguments);
  if (generandoVista) return;
  const o = activo(); if (!o) return;
  $('bMeterForma').hidden = !(o.type === 'activeSelection' && o.getObjects().length >= 2);
  $('bSacarForma').hidden = !o.mascara;
  if (o.mascara) $('bAgrupar').hidden = true;
  if (o.qr){ $('qrTexto').value = o.qr.texto; $('qrColor').value = aHex(o.qr.color); $('qrFondo').value = aHex(o.qr.fondo); $('qrTransp').checked = !!o.qr.transp; }
  $('bEditarQR').hidden = !o.qr;
};
function editarQRSeleccionado(){
  const b = document.querySelector('#pestanas button[data-tab="tElementos"]'); if (b) b.click();
  setTimeout(() => { const t = $('qrTexto'); t.scrollIntoView({ block:'center' }); t.focus(); t.select(); }, 150);
}

/* =========================================================
   PESTAÑAS E INICIO
   ========================================================= */
document.querySelectorAll('#pestanas button').forEach(b => b.onclick = () => {
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
  try { await Promise.all(FUENTES.filter(f => !['Arial','Georgia','Times New Roman','Courier New','Verdana'].includes(f)).flatMap(f => [document.fonts.load(`400 40px "${f}"`), document.fonts.load(`700 40px "${f}"`)])); } catch(e){}
  setTimeout(generarVistas, 300);
  cargarMisPlantillas();
  if (await abrirCompartidoSiHay()) return;
  let borrador = null;
  try { borrador = localStorage.getItem('disenador_borrador'); } catch(e){}
  if (borrador){
    try { $('nombreDiseno').value = localStorage.getItem('disenador_nombre') || 'Mi diseño'; } catch(e){}
    cargarJSON(borrador, true, () => toast('Se recuperó tu último diseño'));
  } else {
    ajustarZoom(); guardarEstado();
  }
})();
window.__appLista = true;

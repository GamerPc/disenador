/* =========================================================
   DE IMAGEN A DIAGRAMA EDITABLE (con IA)
   Subes una foto o captura de un diagrama, mapa mental, línea del tiempo o cuadro,
   la IA lee sus cajas, textos, colores y flechas, y aquí se arma con piezas editables
   (formas con texto, textos, líneas y conectores) en la misma posición.
   Usa la clave de Gemini del asistente (o la IA de Chrome si acepta imágenes).
   ========================================================= */
// La IA solo ubica cada elemento (box_2d, el formato que mejor maneja Gemini) y lee sus textos.
// Los colores se toman de los píxeles de la imagen y el tamaño de letra se calcula para que quepa.
const ESQUEMA_DIAGRAMA = {
  type:'OBJECT',
  properties:{
    elements:{ type:'ARRAY', items:{ type:'OBJECT', properties:{
      id:{ type:'STRING' },
      type:{ type:'STRING', enum:['box', 'circle', 'ellipse', 'diamond', 'pill', 'text', 'line', 'arrow'] },
      box_2d:{ type:'ARRAY', items:{ type:'INTEGER' } },
      points:{ type:'ARRAY', items:{ type:'INTEGER' } },
      text:{ type:'STRING' },
      bold:{ type:'BOOLEAN' }, italic:{ type:'BOOLEAN' },
      align:{ type:'STRING', enum:['left', 'center', 'right'] },
      font:{ type:'STRING', enum:['sans', 'serif', 'handwritten', 'mono', 'display'] },
      dashed:{ type:'BOOLEAN' }, arrow_start:{ type:'BOOLEAN' }, arrow_end:{ type:'BOOLEAN' }
    }, required:['id', 'type', 'box_2d'] } },
    connections:{ type:'ARRAY', items:{ type:'OBJECT', properties:{
      from:{ type:'STRING' }, to:{ type:'STRING' }, arrow:{ type:'BOOLEAN' }, dashed:{ type:'BOOLEAN' },
      style:{ type:'STRING', enum:['straight', 'elbow', 'curve'] }, label:{ type:'STRING' }
    }, required:['from', 'to'] } }
  },
  required:['elements']
};
const PROMPT_DIAGRAMA = `You are converting an image of a diagram (mind map, concept map, timeline, flowchart, org chart, comparison table or infographic) into editable shapes. Detect EVERY visual element and return JSON.

For each element give:
- "box_2d": [ymin, xmin, ymax, xmax] — the TIGHT bounding box of that element in the image, normalized to 0-1000 (x relative to image width, y relative to image height). Each element must have its OWN box; never use the full width unless the element really spans the full width.
- "type": "box" (rectangle or rounded rectangle, card, header band, table cell), "circle", "ellipse", "diamond", "pill", "text" (free text without its own shape: titles, subtitles, labels, dates, notes), "line" or "arrow" (lines that do not clearly join two elements).
- "text": the text written INSIDE that element, copied EXACTLY character by character in its original language (Spanish), with accents, capitals and line breaks (\\n). Text that sits inside a box belongs to that box, do not repeat it as a separate "text" element.
- "bold", "italic", "align" (left/center/right) and "font" (sans/serif/handwritten/mono/display) as seen.
- For "line"/"arrow": "points": [y1, x1, y2, x2] (0-1000), plus "dashed", "arrow_start", "arrow_end".
- A unique "id".

Put lines/arrows that clearly connect two detected elements in "connections" (from/to = element ids, arrow, dashed, style straight/elbow/curve, optional label).
List large background shapes first. Be precise with positions: small circles, labels and dates must keep their own small boxes. Do not invent anything that is not in the image.`;

const conTiempo = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r('tiempo'), ms))]);
async function iaImagenDisponible(){
  if (leerLS(IA_CLAVE)) return { tipo:'gemini' };
  // la IA de Chrome solo si ya está lista para leer imágenes (si no, a veces se queda esperando sin responder)
  try {
    if ('LanguageModel' in self){
      const a = await conTiempo(LanguageModel.availability({ expectedInputs:[{ type:'image' }, { type:'text', languages:['es'] }], expectedOutputs:[{ type:'text', languages:['es'] }] }), 1500);
      if (a === 'available') return { tipo:'chrome' };
    }
  } catch (e) {}
  return null;
}
// prepara la imagen: máximo 2000 px, en JPEG (para que viaje rápido)
function prepararImagenIA(src){
  return new Promise((ok, mal) => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => {
      const k = Math.min(1, 2000 / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k);
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
      const url = c.toDataURL('image/jpeg', 0.9);
      ok({ url, base64:url.split(',')[1], w:im.naturalWidth, h:im.naturalHeight, canvas:c });
    };
    im.onerror = () => mal(new Error('No se pudo leer la imagen'));
    im.src = src;
  });
}
async function leerDiagramaConIA(img, alProgreso){
  const fuente = await iaImagenDisponible();
  if (!fuente) throw new Error('SIN_IA');
  if (fuente.tipo === 'gemini'){
    const modelo = leerLS(IA_MODELO) || 'gemini-flash-latest';
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelo) + ':generateContent', {
      method:'POST', headers:{ 'Content-Type':'application/json', 'x-goog-api-key':leerLS(IA_CLAVE) },
      body:JSON.stringify({
        contents:[{ role:'user', parts:[{ inline_data:{ mime_type:'image/jpeg', data:img.base64 } }, { text:PROMPT_DIAGRAMA }] }],
        generationConfig:{ temperature:0.1, maxOutputTokens:32768, responseMimeType:'application/json', responseSchema:ESQUEMA_DIAGRAMA }
      })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(r.status === 400 || r.status === 403 ? 'La clave de Gemini no es válida o no tiene permiso.' : r.status === 429 ? 'Se acabó el límite gratuito de la IA por ahora. Intenta en unos minutos.' : (d.error && d.error.message) || ('Error ' + r.status));
    const c = d.candidates && d.candidates[0];
    const t = c && c.content && c.content.parts && c.content.parts.map(p => p.text || '').join('');
    if (!t) throw new Error(c && c.finishReason === 'SAFETY' ? 'La IA no quiso leer esta imagen.' : 'La IA no devolvió el diagrama. Prueba de nuevo.');
    return interpretarJSONDiagrama(t);
  }
  // IA de Chrome (si acepta imágenes): menos exacta, pero gratis y sin clave
  const s = await conTiempo(LanguageModel.create({ expectedInputs:[{ type:'image' }, { type:'text', languages:['es'] }], expectedOutputs:[{ type:'text', languages:['es'] }],
    monitor(m){ m.addEventListener('downloadprogress', e => alProgreso && alProgreso(e.loaded)); } }), 60000);
  if (s === 'tiempo') throw new Error('La IA de Chrome no respondió. Pon tu clave gratuita de Gemini en el recuadro de arriba para convertir la imagen.');
  try {
    const blob = await (await fetch(img.url)).blob();
    const t = await conTiempo(s.prompt([{ role:'user', content:[{ type:'text', value:PROMPT_DIAGRAMA + '\nAnswer only with JSON with the keys elements and connections.' }, { type:'image', value:blob }] }]), 150000);
    if (t === 'tiempo') throw new Error('La IA de Chrome tardó demasiado. Pon tu clave gratuita de Gemini en el recuadro de arriba para un resultado más rápido y exacto.');
    return interpretarJSONDiagrama(t);
  } finally { s.destroy && s.destroy(); }
}
function interpretarJSONDiagrama(t){
  t = String(t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  let d; try { d = JSON.parse(t); } catch (e) {
    const i = t.indexOf('{'), j = t.lastIndexOf('}');
    try { d = JSON.parse(t.slice(i, j + 1)); } catch (er) { throw new Error('La respuesta de la IA llegó incompleta. Prueba de nuevo o con una imagen más chica.'); }
  }
  if (Array.isArray(d)) d = { elements:d };
  const els = normalizarElementosIA(d);
  if (!els.length) throw new Error('La IA no encontró elementos en la imagen.');
  // revisión: si casi todo quedó a lo ancho de la página, la IA no ubicó bien las cosas
  const conCaja = els.filter(e => e.caja && e.tipo !== 'linea' && e.tipo !== 'flecha');
  const anchos = conCaja.filter(e => Math.abs(e.caja[3] - e.caja[1]) > 850).length;
  if (conCaja.length >= 5 && anchos / conCaja.length > 0.6)
    throw new Error('La IA no logró ubicar bien los elementos (los puso todos a lo ancho). Toca «Convertir» otra vez: a veces a la segunda sale bien. Si sigue igual, prueba con la imagen más nítida o recortada.');
  return { elementos:els, conexiones:(d.connections || d.conexiones || []).map(k => ({ de:k.from ?? k.de, a:k.to ?? k.a, flecha:k.arrow ?? k.flecha, punteada:k.dashed ?? k.punteada,
    estilo:{ straight:'recta', elbow:'codo', curve:'curva' }[k.style] || k.estilo || 'recta', etiqueta:k.label ?? k.etiqueta ?? '', color:k.color })) };
}
// acepta la respuesta nueva (inglés) y la anterior (español)
function normalizarElementosIA(d){
  const TIPOS = { box:'caja', circle:'circulo', ellipse:'elipse', diamond:'rombo', pill:'pildora', text:'texto', line:'linea', arrow:'flecha' };
  const caja4 = v => { if (!Array.isArray(v) || v.length !== 4 || v.some(n => typeof n !== 'number' || !isFinite(n))) return null;
    let [y1, x1, y2, x2] = v.map(n => Math.max(0, Math.min(1000, n))); return [Math.min(y1, y2), Math.min(x1, x2), Math.max(y1, y2), Math.max(x1, x2)]; };
  return (d.elements || d.elementos || []).map((e, i) => {
    const tipo = TIPOS[e.type] || e.tipo || 'caja';
    return { id:String(e.id ?? ('e' + i)), tipo, caja:caja4(e.box_2d || e.caja), puntos:Array.isArray(e.points || e.puntos) && (e.points || e.puntos).length === 4 ? (e.points || e.puntos) : null,
      texto:e.text ?? e.texto ?? '', negrita:!!(e.bold ?? e.negrita), cursiva:!!(e.italic ?? e.cursiva),
      alinear:{ left:'izquierda', center:'centro', right:'derecha' }[e.align] || e.alinear || (tipo === 'texto' ? 'centro' : 'centro'),
      letra:{ sans:'sans', serif:'serif', handwritten:'mano', mono:'mono', display:'gruesa' }[e.font] || e.letra || 'sans',
      punteada:!!(e.dashed ?? e.punteada), flechaInicio:!!(e.arrow_start ?? e.flechaInicio), flechaFin:!!(e.arrow_end ?? e.flechaFin ?? (tipo === 'flecha')),
      relleno:e.relleno, borde:e.borde, colorTexto:e.colorTexto, alturaLetra:e.alturaLetra, radio:e.radio, grosor:e.grosor };
  }).filter(e => e.caja || e.puntos);
}
// ---------- colores tomados de la imagen ----------
function lectorDeColores(img){
  const c = img.canvas, W0 = c.width, H0 = c.height, datos = c.getContext('2d').getImageData(0, 0, W0, H0).data;
  const px = (x, y) => { const i = (Math.max(0, Math.min(H0 - 1, y | 0)) * W0 + Math.max(0, Math.min(W0 - 1, x | 0))) * 4; return [datos[i], datos[i + 1], datos[i + 2]]; };
  const hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // el color que más se repite en una lista de puntos
  const moda = pts => { const m = new Map(); pts.forEach(p => { const k = (p[0] >> 4) << 8 | (p[1] >> 4) << 4 | (p[2] >> 4); const v = m.get(k); if (v){ v.n++; v.r += p[0]; v.g += p[1]; v.b += p[2]; } else m.set(k, { n:1, r:p[0], g:p[1], b:p[2] }); });
    let mejor = null; m.forEach(v => { if (!mejor || v.n > mejor.n) mejor = v; }); return mejor ? [mejor.r / mejor.n, mejor.g / mejor.n, mejor.b / mejor.n] : [255, 255, 255]; };
  // color de la letra: los puntos que más contrastan con el fondo (los bordes suavizados de la letra salen más claros)
  const tinta = (pts, base) => { const c = pts.map(p => [dist(p, base), p]).filter(([d]) => d > 60).sort((a, b) => b[0] - a[0]);
    if (c.length < 3) return null; const top = c.slice(0, Math.max(3, Math.ceil(c.length * 0.25))).map(x => x[1]);
    return [0, 1, 2].map(i => top.reduce((sum, p) => sum + p[i], 0) / top.length); };
  const aPx = ([y1, x1, y2, x2]) => [x1 / 1000 * W0, y1 / 1000 * H0, x2 / 1000 * W0, y2 / 1000 * H0];
  const zona = (x1, y1, x2, y2, paso) => { const pts = []; paso = paso || Math.max(1, Math.min(x2 - x1, y2 - y1) / 40); for (let y = y1; y <= y2; y += paso) for (let x = x1; x <= x2; x += paso) pts.push(px(x, y)); return pts; };
  // fondo de la página: las orillas de la imagen
  const orilla = []; for (let i = 0; i <= 60; i++){ orilla.push(px(i / 60 * (W0 - 1), 1), px(i / 60 * (W0 - 1), H0 - 2), px(1, i / 60 * (H0 - 1)), px(W0 - 2, i / 60 * (H0 - 1))); }
  const fondo = moda(orilla);
  return {
    fondo:hex(fondo),
    forma(caja, redonda){
      const [x1, y1, x2, y2] = aPx(caja), w = x2 - x1, h = y2 - y1, m = redonda ? 0.3 : 0.12;
      const dentro = zona(x1 + w * m, y1 + h * m, x2 - w * m, y2 - h * m), relleno = moda(dentro);
      const t = Math.max(1.5, Math.min(w, h) * 0.03), anillo = [];
      if (redonda){ for (let i = 0; i < 80; i++){ const a = i / 80 * Math.PI * 2; anillo.push(px(x1 + w / 2 + Math.cos(a) * (w / 2 - t), y1 + h / 2 + Math.sin(a) * (h / 2 - t))); } }
      else {
        // en cada punto de la orilla se busca un poco adentro y afuera (la IA puede marcar la caja unos píxeles corrida)
        const mejor = arr => arr.reduce((m, p) => dist(p, relleno) > dist(m, relleno) ? p : m, arr[0]);
        const off = [-2 * t, -t, 0, t, 2 * t];
        for (let i = 2; i <= 38; i++){ const fx = x1 + i / 40 * w, fy = y1 + i / 40 * h;
          anillo.push(mejor(off.map(o => px(fx, y1 + o))), mejor(off.map(o => px(fx, y2 - o))), mejor(off.map(o => px(x1 + o, fy))), mejor(off.map(o => px(x2 - o, fy)))); }
      }
      const borde = moda(anillo.filter(p => dist(p, relleno) > 40));
      const hayBorde = anillo.filter(p => dist(p, relleno) > 40).length > anillo.length * 0.35 && dist(borde, fondo) > 25;
      const letras = tinta(zona(x1 + w * m * 0.5, y1 + h * m * 0.5, x2 - w * m * 0.5, y2 - h * m * 0.5, Math.max(1, Math.min(w, h) / 90)), relleno);
      const texto = letras || (dist(relleno, [0, 0, 0]) < 200 ? [255, 255, 255] : [31, 35, 48]);
      return { relleno:hex(relleno), borde:hayBorde ? hex(borde) : null, texto:hex(texto), grosorPx:t, transparente:dist(relleno, fondo) < 12 };
    },
    texto(caja){
      const [x1, y1, x2, y2] = aPx(caja), pts = zona(x1, y1, x2, y2, Math.max(0.7, Math.min(x2 - x1, y2 - y1) / 60));
      return hex(tinta(pts, moda(pts)) || [31, 35, 48]);
    },
    linea(p){
      const [y1, x1, y2, x2] = p, pts = [];
      for (let i = 2; i <= 18; i++){ const k = i / 20, x = (x1 + (x2 - x1) * k) / 1000 * W0, y = (y1 + (y2 - y1) * k) / 1000 * H0; for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) pts.push(px(x + dx, y + dy)); }
      const tinta = pts.filter(q => dist(q, fondo) > 60); return hex(tinta.length ? moda(tinta) : [31, 35, 48]);
    }
  };
}
// tamaño de letra más grande que cabe en un espacio
function tamQueCabe(texto, w, h, est, maximo){
  const t = new fabric.Textbox(texto || ' ', { width:Math.max(10, w), fontFamily:est.fontFamily, fontWeight:est.fontWeight, fontStyle:est.fontStyle, lineHeight:1.15, splitByGrapheme:false });
  let lo = 6, hi = Math.max(8, Math.min(maximo || 400, h * 0.95)), mejor = lo;
  for (let i = 0; i < 14; i++){
    const mid = (lo + hi) / 2; t.set({ fontSize:mid, width:Math.max(10, w) }); t.initDimensions();   // el ancho se repone: una palabra larga lo agranda
    const anchoMax = Math.max(...t._textLines.map((_, k) => t.getLineWidth(k)));
    if (t.height <= h && anchoMax <= w + 1){ mejor = mid; lo = mid; } else hi = mid;
  }
  return Math.max(6, Math.floor(mejor * 10) / 10);
}
// ---------- armar el diagrama con piezas del Diseñador ----------
const colorIA = (v, def) => typeof v === 'string' && /^#?[0-9a-f]{3,8}$/i.test(v.trim()) ? (v.trim()[0] === '#' ? v.trim() : '#' + v.trim()) : def;
const FUENTE_IA = { sans:'Inter', serif:'Georgia', mano:'Patrick Hand', mono:'Courier New', gruesa:'Montserrat' };
function construirDiagramaIA(d, img, op = {}){
  const vacio = !canvas.getObjects().some(o => !o.esFondo);
  if (vacio){ const largo = 1600, k = largo / Math.max(img.w, img.h); cambiarTamano(Math.round(img.w * k), Math.round(img.h * k)); }
  else agregarPagina();
  const margen = vacio ? 0 : Math.min(W, H) * 0.04;
  const escala = Math.min((W - 2 * margen) / img.w, (H - 2 * margen) / img.h);
  const aw = img.w * escala, ah = img.h * escala, ox = (W - aw) / 2, oy = (H - ah) / 2;
  const X = v => ox + (+v || 0) / 1000 * aw, Y = v => oy + (+v || 0) / 1000 * ah, LX = v => (+v || 0) / 1000 * aw;
  const enLienzo = c => ({ x:X(c[1]), y:Y(c[0]), w:Math.max(4, X(c[3]) - X(c[1])), h:Math.max(4, Y(c[2]) - Y(c[0])) });
  const alinea = e => ({ izquierda:'left', derecha:'right' }[e.alinear] || 'center');
  const colores = op.colores !== false;
  let leer = null; try { if (colores && img.canvas) leer = lectorDeColores(img); } catch (e) {}
  const pxALienzo = aw / (img.canvas ? img.canvas.width : img.w);
  restaurando = true;
  if (colores && typeof FONDO === 'function'){ try { FONDO(leer ? leer.fondo : colorIA(d.fondo, '#ffffff')); } catch (e) {} }
  if (op.guia){
    fabric.Image.fromURL(img.url, im => {
      im.set({ left:ox, top:oy, scaleX:aw / im.width, scaleY:ah / im.height, opacity:0.3, name:'Imagen de referencia (bórrala al terminar)', id:nuevoId() });
      bloquear(im, true); canvas.add(im);
      canvas.moveTo(im, canvas.getObjects().filter(o => o.esFondo).length); canvas.requestRenderAll(); renderCapas();
    });
  }
  const porIA = {};
  let n = 0;
  // 1) tamaño de letra que cabe en cada elemento
  const datos = (d.elementos || []).map(e => {
    if (!e.caja || e.tipo === 'linea' || e.tipo === 'flecha') return null;
    const r = enLienzo(e.caja), txt = String(e.texto || '').trim(); if (!txt) return null;
    const est = { fontFamily:FUENTE_IA[e.letra] || 'Inter', fontWeight:e.negrita ? '700' : '400', fontStyle:e.cursiva ? 'italic' : 'normal' };
    const forma = { caja:'proceso', circulo:'circulo', elipse:'elipse', rombo:'rombo', pildora:'pildora' }[e.tipo] || 'proceso', redonda = forma === 'circulo' || forma === 'elipse';
    const w = forma === 'circulo' ? Math.max(r.w, r.h) : r.w, h = forma === 'circulo' ? w : r.h, pad = Math.min(PAD(), w * 0.08, h * 0.12);
    const fs = e.tipo === 'texto' ? tamQueCabe(txt, Math.max(r.w * 1.06, 20), r.h * 1.15, est)
      : tamQueCabe(txt, (forma === 'rombo' ? w * 0.6 : redonda ? w * 0.75 : w) - 2 * pad, (forma === 'rombo' ? h * 0.6 : redonda ? h * 0.75 : h) - 2 * pad, est);
    return { e, w:r.w, h:r.h, fs };
  });
  // 2) elementos del mismo tipo y de tamaño parecido llevan la misma letra (la más chica del grupo), como en el original
  const tamFinal = new Map();
  datos.forEach(a => {
    if (!a || tamFinal.has(a.e)) return;
    const grupo = datos.filter(b => b && b.e.tipo === a.e.tipo && !!b.e.negrita === !!a.e.negrita && Math.abs(b.w - a.w) <= a.w * 0.12 && (a.e.tipo === 'texto' ? Math.abs(b.fs - a.fs) <= a.fs * 0.35 : Math.abs(b.h - a.h) <= a.h * 0.25));
    const minimo = Math.min(...grupo.map(b => b.fs));
    grupo.forEach(b => { if (!tamFinal.has(b.e)) tamFinal.set(b.e, minimo); });
  });
  (d.elementos || []).forEach(e => {
    try {
      const tipo = e.tipo || 'caja';
      if (tipo === 'linea' || tipo === 'flecha'){
        const p = e.puntos || (e.caja ? [e.caja[0], e.caja[1], e.caja[2], e.caja[3]] : null); if (!p) return;
        const [y1, x1, y2, x2] = p;
        const color = !colores ? '#1f2330' : (leer ? leer.linea(p) : colorIA(e.borde, '#1f2330'));
        const c = new fabric.Conector([0, 0, 1, 1], { stroke:color, strokeWidth:Math.max(2, e.grosor ? LX(e.grosor) : 3 * s()), strokeLineCap:'round', estilo:'recta',
          inicio:e.flechaInicio ? 'flecha' : 'nada', fin:e.flechaFin ? 'flecha' : 'nada', patron:e.punteada ? 'guiones' : 'solida',
          etiqueta:'', libreA:{ x:X(x1), y:Y(y1) }, libreB:{ x:X(x2), y:Y(y2) }, conA:null, conB:null, objectCaching:false, perPixelTargetFind:true,
          hasControls:false, id:nuevoId(), name:tipo === 'flecha' ? 'Flecha' : 'Línea' });
        actualizarConector(c); canvas.add(c); n++; return;
      }
      if (!e.caja) return;
      const r = enLienzo(e.caja);
      const txt = String(e.texto || '').trim();
      const fam = FUENTE_IA[e.letra] || 'Inter';
      const est = { fontFamily:fam, fontWeight:e.negrita ? '700' : '400', fontStyle:e.cursiva ? 'italic' : 'normal' };
      if (tipo === 'texto'){
        if (!txt) return;
        const ancho = Math.max(r.w * 1.06, 20), al = alinea(e), dx = al === 'center' ? (ancho - r.w) / 2 : al === 'right' ? ancho - r.w : 0;
        const fs = tamFinal.get(e) || tamQueCabe(txt, ancho, r.h * 1.15, est);
        const t = new fabric.Textbox(txt, { left:r.x - dx, top:r.y, width:ancho, fontSize:fs, ...est,
          fill:!colores ? '#1f2330' : (leer ? leer.texto(e.caja) : colorIA(e.colorTexto, '#1f2330')), textAlign:al, lineHeight:1.15, id:nuevoId(), name:'Texto' });
        canvas.add(t); porIA[e.id] = t; n++; return;
      }
      const forma = { caja:'proceso', circulo:'circulo', elipse:'elipse', rombo:'rombo', pildora:'pildora' }[tipo] || 'proceso';
      const redonda = forma === 'circulo' || forma === 'elipse';
      const col = !colores ? { relleno:'#ffffff', borde:'#1f2330', texto:'#1f2330', grosorPx:2 } : (leer ? leer.forma(e.caja, redonda) : { relleno:colorIA(e.relleno, '#ffffff'), borde:colorIA(e.borde, null), texto:colorIA(e.colorTexto, '#1f2330'), grosorPx:2 });
      const w = forma === 'circulo' ? Math.max(r.w, r.h) : r.w, h = forma === 'circulo' ? w : r.h;
      const pad = Math.min(PAD(), w * 0.08, h * 0.12);
      const fs = txt ? (tamFinal.get(e) || tamQueCabe(txt, (forma === 'rombo' ? w * 0.6 : redonda ? w * 0.75 : w) - 2 * pad, (forma === 'rombo' ? h * 0.6 : redonda ? h * 0.75 : h) - 2 * pad, est)) : 20;
      const chica = txt && Math.min(w, h) < 2 * PAD() + fs * 1.6;
      const f = nodo(forma, chica || !txt ? null : txt, r.x + r.w / 2, r.y + r.h / 2, {
        w, h, fill:col.relleno, stroke:col.borde, grosor:Math.max(1, Math.round(col.grosorPx * pxALienzo)), tam:fs, peso:est.fontWeight,
        color:col.texto, fuente:fam, anchoMax:Math.max(40, w - 2 * PAD()), nombre:'Caja'
      });
      if (forma === 'proceso'){ const rr = e.radio ? LX(e.radio) : Math.min(w, h) * 0.08; f.set({ rx:Math.min(rr, Math.min(w, h) / 2), ry:Math.min(rr, Math.min(w, h) / 2) }); }
      const tv = porId(f.formaTexto);
      if (tv){ tv.set({ textAlign:alinea(e), fontStyle:est.fontStyle }); tv.initDimensions && tv.initDimensions(); ajustarFormaATexto(tv); }
      if (chica){
        canvas.add(new fabric.Textbox(txt, { width:Math.max(w, fs * 1.2), fontSize:fs, ...est, fill:col.texto, textAlign:'center', lineHeight:1.05,
          originX:'center', originY:'center', left:r.x + r.w / 2, top:r.y + r.h / 2, id:nuevoId(), name:'Texto' }));
      }
      porIA[e.id] = f; n++;
    } catch (er) { console.warn('Elemento de la IA que no se pudo armar', e, er); }
  });
  (d.conexiones || []).forEach(k => {
    const a = porIA[k.de], b = porIA[k.a]; if (!a || !b || a === b) return;
    try { unir(a, b, { estilo:k.estilo || 'recta', flecha:k.flecha !== false, color:!colores ? '#1f2330' : colorIA(k.color, '#1f2330'), punteada:!!k.punteada, etiqueta:k.etiqueta || '', ancho:Math.max(2, 3 * s()) }); n++; }
    catch (er) {}
  });
  canvas.getObjects().filter(o => o.esFondo).forEach(o => canvas.sendToBack(o));
  restaurando = false;
  if (typeof ordenarVinculos === 'function') ordenarVinculos();
  canvas.discardActiveObject(); canvas.requestRenderAll(); renderCapas(); guardarEstado(); ajustarZoom();
  return n;
}
// ---------- ventana ----------
(function(){
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'mImgDiagrama';
  m.innerHTML = `<div class="caja" style="width:min(640px,96vw)"><h3>📷 De imagen a diagrama editable</h3>
    <p class="hint" style="padding-top:0">Sube una foto o captura de un diagrama, mapa mental o conceptual, línea del tiempo, organigrama o cuadro. La IA lo copia con <b>formas, textos y flechas que puedes editar</b>, en el mismo lugar y con los mismos colores.</p>
    <div class="drop" id="idDrop" tabindex="0" role="button" aria-label="Elegir imagen">Arrastra aquí la imagen, pégala con <b>Ctrl + V</b> o <u>toca para elegir un archivo</u></div>
    <input type="file" id="idArchivo" accept="image/*" hidden>
    <img id="idVista" alt="Vista previa" hidden>
    <label class="filaCheck"><input type="checkbox" id="idColores" checked> Copiar los colores de la imagen</label>
    <label class="filaCheck"><input type="checkbox" id="idGuia"> Poner la imagen original atrás, transparente, como guía (bórrala al terminar)</label>
    <div id="idSinIA" hidden class="avisoIA"><b>Para convertir imágenes se usa la IA de Google Gemini (gratis, 1 minuto para activarla):</b>
      <ol><li>Entra a <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> con tu cuenta de Google.</li><li>Toca «Create API key» y cópiala.</li><li>Pégala aquí. Se guarda <b>solo en este navegador</b>.</li></ol>
      <div class="filaBusca"><input id="idClave" class="buscador" type="password" autocomplete="off" placeholder="Pega aquí tu clave de Gemini"><button class="pb" id="idGuardarClave">Guardar</button></div></div>
    <p id="idEstado" class="hint" role="status"></p>
    <div class="acciones"><button class="btnS" onclick="cerrarModal('mImgDiagrama')">Cancelar</button><button class="btnP" id="idConvertir" disabled>✨ Convertir en diagrama</button></div></div>`;
  document.body.appendChild(m);
  let img = null;
  const cargar = async src => {
    try { img = await prepararImagenIA(src); $('idVista').src = img.url; $('idVista').hidden = false; $('idDrop').classList.add('conImg'); $('idConvertir').disabled = false; $('idEstado').textContent = ''; }
    catch (e) { toast(e.message); }
  };
  const deArchivo = f => { if (!f || !/^image\//.test(f.type)) return toast('Elige una imagen (JPG, PNG, captura…)'); const r = new FileReader(); r.onload = () => cargar(r.result); r.readAsDataURL(f); };
  $('idDrop').onclick = () => $('idArchivo').click();
  $('idDrop').onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); $('idArchivo').click(); } };
  $('idArchivo').onchange = e => deArchivo(e.target.files[0]);
  ['dragover', 'dragenter'].forEach(n => $('idDrop').addEventListener(n, e => { e.preventDefault(); $('idDrop').classList.add('sobre'); }));
  ['dragleave', 'drop'].forEach(n => $('idDrop').addEventListener(n, () => $('idDrop').classList.remove('sobre')));
  $('idDrop').addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); deArchivo(e.dataTransfer.files[0]); });
  document.addEventListener('paste', e => {
    if (!m.classList.contains('abierto')) return;
    const it = [...(e.clipboardData || {}).items || []].find(i => i.type.startsWith('image/')); if (!it) return;
    e.preventDefault(); e.stopImmediatePropagation(); deArchivo(it.getAsFile());
  }, true);
  $('idClave').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('idGuardarClave').click(); });
  $('idGuardarClave').onclick = async () => {
    const ok = await guardarClaveIA($('idClave').value); if (!ok) return;
    $('idClave').value = ''; $('idSinIA').hidden = true; $('idEstado').textContent = '✓ Clave guardada. Toca «Convertir en diagrama».';
  };
  $('idConvertir').onclick = async () => {
    if (!img){ toast('Primero elige o pega una imagen'); return; }
    if ($('idClave').value.trim() && !(await guardarClaveIA($('idClave').value))) return;   // pegó la clave pero no tocó «Guardar»
    else if ($('idClave').value.trim()){ $('idClave').value = ''; $('idSinIA').hidden = true; }
    const b = $('idConvertir'); b.disabled = true; $('idEstado').textContent = 'Preparando…';
    if (!(await iaImagenDisponible())){ b.disabled = false; $('idEstado').textContent = '👉 Falta un paso: pon tu clave gratuita de Gemini en el recuadro de arriba y vuelve a tocar «Convertir».'; $('idSinIA').hidden = false; $('idClave').focus(); return; }
    const t0 = Date.now(), reloj = setInterval(() => { $('idEstado').textContent = '🔎 La IA está leyendo tu imagen… ' + Math.round((Date.now() - t0) / 1000) + ' s (suele tardar de 15 a 60 s)'; }, 500);
    try {
      const d = await leerDiagramaConIA(img, p => { $('idEstado').textContent = 'Descargando la IA de Chrome… ' + Math.round(p * 100) + '%'; });
      clearInterval(reloj);
      const n = construirDiagramaIA(d, img, { colores:$('idColores').checked, guia:$('idGuia').checked });
      cerrarModal('mImgDiagrama');
      toast('✓ Listo: ' + n + ' elementos editables. Revisa los textos: la IA a veces se equivoca en alguna letra.');
    } catch (e) {
      clearInterval(reloj);
      if (e.message === 'SIN_IA'){ $('idSinIA').hidden = false; $('idEstado').textContent = ''; }
      else { $('idEstado').textContent = '⚠ ' + e.message; if (!leerLS(IA_CLAVE)) $('idSinIA').hidden = false; }
    } finally { b.disabled = false; }
  };
  window.abrirImagenADiagrama = async (src) => {
    abrirModal('mImgDiagrama'); $('idEstado').textContent = ''; $('idSinIA').hidden = !!leerLS(IA_CLAVE);   // sin clave, se ve desde el inicio
    if (src) cargar(src);
    else if (!img){ $('idVista').hidden = true; $('idConvertir').disabled = true; }
  };
})();
// accesos: pestañas Diagramas e Imágenes, menú de clic derecho y barra rápida de imágenes
(function(){
  const boton = () => { const b = document.createElement('button'); b.className = 'bigbtn btnImgDiag'; b.innerHTML = '📷 <b>Copiar un diagrama de una foto</b><span>La IA lo arma editable: cajas, textos y flechas</span>'; b.onclick = () => abrirImagenADiagrama(); return b; };
  const h3d = document.querySelector('#tDiagramas h3'); if (h3d) h3d.after(boton());
  const subir = document.querySelector('#tImagenes .drop'); if (subir) subir.after(boton());
})();
function convertirImagenSeleccionada(){
  const o = activo(); if (!o || o.type !== 'image') return;
  abrirImagenADiagrama(o.getSrc ? o.getSrc() : o._element && o._element.src);
}

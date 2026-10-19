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
alActualizarPanel(function(){
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
});

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


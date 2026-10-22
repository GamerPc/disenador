/* =========================================================
   PLANTILLAS «NEÓN Y TECNOLOGÍA» (posts para redes)
   Fondos azul-morado, textos con brillo y degradado, pantallas en líneas (wireframes),
   cursores, burbujas de «me gusta», nodos con íconos, QR, paleta de marca…
   Todo son figuras y textos editables (nada es una imagen pegada).
   ========================================================= */
const CAT_NEON = 'Neón y tecnología';
const NE = { cian:'#22d3ee', azul:'#3b82f6', morado:'#8b5cf6', violeta:'#a855f7', rosa:'#ec4899', naranja:'#fb923c', amarillo:'#facc15', lima:'#a3e635', verde:'#4ade80', blanco:'#ffffff', lila:'#c4b5fd' };
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
function azarN(semilla){ let s = semilla >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function gradN(colores, ang = 0){
  const r = ang * Math.PI / 180, x = Math.cos(r), y = Math.sin(r);
  return new fabric.Gradient({ type:'linear', gradientUnits:'percentage', coords:{ x1:0.5 - x / 2, y1:0.5 - y / 2, x2:0.5 + x / 2, y2:0.5 + y / 2 },
    colorStops:colores.map((c, i) => ({ offset:colores.length > 1 ? i / (colores.length - 1) : 0, color:c })) });
}
// trazo genérico (líneas, marcos, adornos)
function N_P(d, o = {}){
  const p = new fabric.Path(d, { fill:o.fill || null, stroke:o.stroke || null, strokeWidth:o.sw ?? 2, strokeLineCap:'round', strokeLineJoin:'round',
    opacity:o.op ?? 1, angle:o.ang || 0, name:o.nombre || 'Decoración', esDeco:true, id:nuevoId() });
  if (o.grad) p.set('fill', gradN(o.grad, o.gradAng || 0));
  if (o.gradTrazo) p.set('stroke', gradN(o.gradTrazo, o.gradAng || 0));
  if (o.glow) BRILLO(p, o.glow, o.blur || 14);
  canvas.add(p); return p;
}
const rr = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const circD = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
function N_HALO(x, y, r, color, a = 0.45){
  const c = new fabric.Circle({ left:x, top:y, radius:r, originX:'center', originY:'center', esDeco:true, name:'Resplandor', id:nuevoId(),
    fill:new fabric.Gradient({ type:'radial', gradientUnits:'pixels', coords:{ x1:r, y1:r, r1:0, x2:r, y2:r, r2:r }, colorStops:[{ offset:0, color:hexA(color, a) }, { offset:1, color:hexA(color, 0) }] }) });
  canvas.add(c); return c;
}
function N_GRID(x, y, w, h, paso, color, op = 0.25){
  let d = ''; for (let i = 0; i <= h + 0.1; i += paso) d += `M${x} ${y + i}H${x + w}`; for (let i = 0; i <= w + 0.1; i += paso) d += `M${x + i} ${y}V${y + h}`;
  return N_P(d, { stroke:color, sw:1, op, nombre:'Cuadrícula' });
}
function N_PUNTOS(x, y, cols, filas, sep, r, color, op = 0.7){
  let d = ''; for (let i = 0; i < cols; i++) for (let j = 0; j < filas; j++) d += circD(x + i * sep, y + j * sep, r);
  return N_P(d, { fill:color, sw:0, op, nombre:'Puntos' });
}
function N_VENTANA(x, y, w, h, color, o = {}){
  const hb = Math.min(28, h * 0.12), m = w * 0.07;
  let d = rr(x, y, w, h, Math.min(14, w * 0.05)) + `M${x} ${y + hb}H${x + w}`;
  const iy = y + hb + h * 0.08, iw = w * 0.42, ih = h * 0.42;
  d += `M${x + m} ${iy}h${iw}v${ih}h${-iw}zM${x + m} ${iy}l${iw} ${ih}M${x + m + iw} ${iy}l${-iw} ${ih}`;
  for (let k = 0; k < 3; k++) d += `M${x + m * 1.6 + iw} ${iy + 10 + k * ih / 3.2}h${(w - iw - m * 2.6) * (k === 2 ? 0.6 : 1)}`;
  const by = iy + ih + h * 0.08, bw = (w - m * 2 - 20) / 3, bh = Math.max(10, y + h - by - h * 0.08);
  for (let k = 0; k < 3; k++) d += `M${x + m + k * (bw + 10)} ${by}h${bw}v${bh}h${-bw}z`;
  const v = N_P(d, { stroke:color, sw:o.sw || 2, op:o.op ?? 0.6, glow:o.glow, blur:o.blur, nombre:'Ventana (líneas)' });
  if (o.puntos !== false){ let p = ''; [0, 1, 2].forEach(k => { p += circD(x + 14 + k * 14, y + hb / 2, 4); }); N_P(p, { fill:o.colPuntos || color, sw:0, op:o.op ?? 0.6, nombre:'Botones de ventana' }); }
  return v;
}
function N_TELEFONO(x, y, w, h, color, o = {}){
  const g = [];
  const marco = new fabric.Rect({ left:x, top:y, width:w, height:h, rx:w * 0.14, ry:w * 0.14, fill:o.relleno ? gradN(o.relleno, 120) : 'rgba(0,0,0,0)', stroke:color, strokeWidth:o.sw || 3, opacity:o.op ?? 1 });
  g.push(marco);
  g.push(new fabric.Rect({ left:x + w * 0.36, top:y + h * 0.03, width:w * 0.28, height:h * 0.025, rx:4, ry:4, fill:color, opacity:o.op ?? 1 }));
  (o.tarjetas || []).forEach(([ty, th, col]) => {
    g.push(new fabric.Rect({ left:x + w * 0.1, top:y + h * ty, width:w * 0.8, height:h * th, rx:8, ry:8, fill:col || hexA(NE.violeta, 0.5), stroke:hexA('#ffffff', 0.35), strokeWidth:1.5 }));
    g.push(new fabric.Rect({ left:x + w * 0.18, top:y + h * (ty + th * 0.3), width:w * 0.4, height:Math.max(3, h * 0.012), rx:2, ry:2, fill:'#ffffff', opacity:0.85 }));
    g.push(new fabric.Rect({ left:x + w * 0.18, top:y + h * (ty + th * 0.58), width:w * 0.55, height:Math.max(3, h * 0.012), rx:2, ry:2, fill:'#ffffff', opacity:0.5 }));
  });
  const grp = new fabric.Group(g, { angle:o.ang || 0, name:'Teléfono (decoración)', id:nuevoId() });
  if (o.glow) BRILLO(grp, o.glow, o.blur || 22);
  canvas.add(grp); return grp;
}
function N_CURSOR(x, y, s, color = '#ffffff', o = {}){
  const k = s / 20;
  const d = `M${x} ${y}L${x} ${y + 17 * k}L${x + 4.5 * k} ${y + 13 * k}L${x + 7.5 * k} ${y + 20 * k}L${x + 10 * k} ${y + 19 * k}L${x + 7 * k} ${y + 12.5 * k}L${x + 13 * k} ${y + 12.5 * k}Z`;
  return N_P(d, { stroke:color, sw:o.sw || 2, fill:o.lleno ? color : null, glow:o.glow, blur:o.blur || 8, op:o.op ?? 1, nombre:'Cursor' });
}
// íconos de línea (cuadro de 24 × 24)
const ICO_NEON = {
  foco:'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z',
  engrane:'M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
  engranes:'M8 6.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5zM8 3.5v1.5M8 13v1.5M4.5 9H3M13 9h-1.5M5.5 6.5l-1-1M11.5 12.5l-1-1M16 13.5a2 2 0 1 0 0 4a2 2 0 1 0 0-4zM16 11v1M16 19v1M13.5 15.5h-1M20.5 15.5h-1',
  lupa:'M10 4a6 6 0 1 0 0 12a6 6 0 1 0 0-12zM14.5 14.5L20 20',
  persona:'M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4.5 21c0-4 3.4-7 7.5-7s7.5 3 7.5 7',
  chat:'M4 5h16v11H9.5L5 20v-4H4zM8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01',
  monitor:'M3 4h18v12H3zM8 21h8M12 16v5M7 8l3 3M13 8h4M13 11h3',
  grafica:'M4 20V11M10 20V5M16 20v-6M3 20h18M14 6l3-2 3 1',
  cerebro:'M12 5a3 3 0 0 0-5 1.5a3 3 0 0 0-2.5 4a3 3 0 0 0 .5 4.5a3 3 0 0 0 3 3a3 3 0 0 0 4 1zM12 5a3 3 0 0 1 5 1.5a3 3 0 0 1 2.5 4a3 3 0 0 1-.5 4.5a3 3 0 0 1-3 3a3 3 0 0 1-4 1M12 5v14M8 10h2M14 13h2',
  corazon:'M12 20s-7.5-4.6-7.5-10a4.2 4.2 0 0 1 7.5-2.7A4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
  like:'M7 11v9H3.5v-9zM7 11l4-7c1.6 0 2.6 1.2 2.1 3l-.9 3H19c1.2 0 2.1 1.1 1.8 2.2l-1.5 6c-.3 1.1-1.2 1.8-2.3 1.8H7',
  compartir:'M15.5 5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0zM3.5 12a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0zM15.5 19a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0zM8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6',
  destello:'M12 2l1.8 6.7L20.5 12l-6.7 1.8L12 20.5l-1.8-6.7L3.5 12l6.7-3.3z',
  cubo:'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12L4 7.5M12 12v9',
  lapiz:'M15 4l5 5L9 20H4v-5zM13 6l5 5',
  pluma:'M12 2l6 8-3 9H9l-3-9zM12 2v8M12 12.5a1.5 1.5 0 1 0 0 .01M9 19h6v3H9z',
  check:'M5 12.5l4.5 4.5L19 7',
  reloj:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3.5 2',
  cohete:'M12 2c3.5 2 5 6 4.5 11l-2.5 3h-4l-2.5-3C7 8 8.5 4 12 2zM12 8.5a1.6 1.6 0 1 0 0 .01M9.5 16l-2.5 4 3-1M14.5 16l2.5 4-3-1',
  flechaArriba:'M12 20V5M5.5 11.5L12 5l6.5 6.5'
};
function N_ICO(nombre, cx, cy, tam, color, o = {}){
  const p = new fabric.Path(ICO_NEON[nombre], { fill:o.lleno ? color : null, stroke:o.lleno && !o.trazo ? null : color, strokeWidth:o.sw || 1.8, strokeLineCap:'round', strokeLineJoin:'round',
    originX:'center', originY:'center', esDeco:true, name:'Ícono ' + nombre, id:nuevoId() });
  p.scaleToWidth(tam); p.setPositionByOrigin(new fabric.Point(cx, cy), 'center', 'center');
  if (o.ang) p.rotate(o.ang);
  if (o.glow) BRILLO(p, o.glow, o.blur || 10);
  canvas.add(p); return p;
}
function N_BURBUJA(x, y, s, colores, icono){
  const d = rr(x, y, s, s * 0.82, s * 0.2).replace(/Z$/, '') ;
  N_P(rr(x, y, s, s * 0.82, s * 0.2) + `M${x + s * 0.36} ${y + s * 0.8}L${x + s * 0.5} ${y + s}L${x + s * 0.64} ${y + s * 0.8}Z`, { grad:colores, gradAng:90, sw:0, glow:hexA(colores[0], 0.8), blur:18, nombre:'Burbuja' });
  N_ICO(icono, x + s / 2, y + s * 0.41, s * 0.5, '#ffffff', { lleno:icono === 'corazon', sw:2.2 });
  return d;
}
function N_ARCO(cx, cy, r, a0, a1, color, sw = 4, o = {}){
  const p = (a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return N_P(`M${x0} ${y0}A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${x1} ${y1}`, { stroke:color, sw, glow:o.glow ?? color, blur:o.blur || 12, op:o.op ?? 1, nombre:'Arco' });
}
function N_BARRA(x, y, w, h, colores, o = {}){
  const b = new fabric.Rect({ left:x, top:y, width:w, height:h, rx:h / 2, ry:h / 2, fill:gradN(colores, 0), stroke:o.borde || null, strokeWidth:o.borde ? 2 : 0,
    angle:o.ang || 0, opacity:o.op ?? 1, esDeco:true, name:'Barra', id:nuevoId() });
  if (o.glow !== false) BRILLO(b, hexA(colores[colores.length - 1], 0.7), o.blur || 14);
  canvas.add(b);
  if (o.marco) N_P(rr(x - 5, y - 5, w + 10, h + 10, (h + 10) / 2), { stroke:o.marco, sw:2, op:0.9, nombre:'Marco de barra' });
  return b;
}
// texto con degradado, brillo, contorno neón e inclinación
function N_TXT(texto, x, y, o = {}){
  const t = T(texto, x, y, { f:o.f || 'Montserrat', s:o.s || 80, b:o.b || '800', c:o.c || '#ffffff', w:o.w || 900, lh:o.lh || 1.05, al:o.al || 'center', cs:o.cs || 0, it:o.it });
  if (o.al === 'left') t.set({ originX:'left', left:x });
  if (o.grad){ t.set('fill', gradN(o.grad, o.gradAng ?? 90)); t.relleno = { tipo:'degradado', c1:o.grad[0], c2:o.grad[o.grad.length - 1], ang:o.gradAng ?? 90, gros:14, sep:14, transp:true }; }
  if (o.borde) t.set({ stroke:o.borde, strokeWidth:o.bordeAncho || Math.max(1.5, (o.s || 80) * 0.025) });
  if (o.skew) t.set('skewX', o.skew);
  if (o.glow) BRILLO(t, o.glow, o.blur || (o.s || 80) * 0.22);
  (o.colores || []).forEach(([desde, hasta, color]) => t.setSelectionStyles({ fill:color }, desde, hasta));
  t.name = o.nombre || 'Texto';
  return t;
}
function N_NODO(cx, cy, r, color, icono){
  const c = new fabric.Circle({ left:cx, top:cy, radius:r, originX:'center', originY:'center', fill:'#12133f', stroke:color, strokeWidth:4, name:'Nodo', id:nuevoId() });
  BRILLO(c, color, 22); canvas.add(c);
  N_ICO(icono, cx, cy, r * 1.05, color, { sw:1.7 });
  return c;
}
function N_QR(x, y, s, colores, semilla = 7){
  const n = 21, k = s / n, rnd = azarN(semilla); let d = '';
  const ojo = (i, j) => { d += `M${x + i * k} ${y + j * k}h${7 * k}v${7 * k}h${-7 * k}zM${x + (i + 1) * k} ${y + (j + 1) * k}v${5 * k}h${5 * k}v${-5 * k}zM${x + (i + 2) * k} ${y + (j + 2) * k}h${3 * k}v${3 * k}h${-3 * k}z`; };
  ojo(0, 0); ojo(14, 0); ojo(0, 14);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
    if ((i < 8 && j < 8) || (i > 12 && j < 8) || (i < 8 && j > 12)) continue;
    if (rnd() < 0.48) d += `M${x + i * k} ${y + j * k}h${k}v${k}h${-k}z`;
  }
  const p = new fabric.Path(d, { fill:gradN(colores, 45), fillRule:'evenodd', name:'Código QR (decorativo: cámbialo por el tuyo en Elementos → QR)', id:nuevoId() });
  canvas.add(p); return p;
}
function N_ESQUINAS(x, y, s, color, l = 28){
  N_P(`M${x} ${y + l}V${y}H${x + l}M${x + s - l} ${y}H${x + s}V${y + l}M${x + s} ${y + s - l}V${y + s}H${x + s - l}M${x + l} ${y + s}H${x}V${y + s - l}`, { stroke:color, sw:5, glow:color, blur:10, nombre:'Esquinas' });
}
function N_FONDO(c1, c2, halos = []){
  DEGRADADO(c1, c2);
  halos.forEach(([x, y, r, c, a]) => N_HALO(x, y, r, c, a));
}

const PLANTILLAS_NEON = [
  { nombre:'Neón · Funciones ocultas', tam:[1080, 1080], crear(){
    N_FONDO('#090d3a', '#1d0b52', [[540, 520, 560, NE.morado, 0.35], [540, 440, 300, NE.rosa, 0.12]]);
    N_GRID(600, 0, 180, 110, 22, '#60a5fa', 0.22); N_GRID(935, 130, 145, 260, 26, '#818cf8', 0.25); N_GRID(70, 900, 220, 180, 22, '#60a5fa', 0.18);
    N_PUNTOS(875, 34, 6, 2, 24, 4, NE.cian, 0.75); N_PUNTOS(10, 620, 5, 7, 26, 4, NE.violeta, 0.55); N_PUNTOS(935, 285, 5, 4, 22, 3, NE.cian, 0.4);
    N_VENTANA(0, 18, 360, 262, '#60a5fa', { op:0.45 }); N_VENTANA(232, 115, 145, 108, NE.lila, { op:0.6, puntos:false });
    N_TELEFONO(38, 130, 118, 200, NE.lila, { op:0.55, tarjetas:[[0.12, 0.2, hexA(NE.violeta, 0.35)], [0.42, 0.3, hexA(NE.azul, 0.3)]] });
    N_VENTANA(96, 772, 230, 205, '#60a5fa', { op:0.3 });
    N_TELEFONO(862, 455, 128, 240, NE.lila, { op:0.9, glow:hexA(NE.violeta, 0.7), tarjetas:[[0.1, 0.2, gradN([NE.rosa, NE.violeta])], [0.38, 0.17, hexA('#6366f1', 0.6)], [0.6, 0.17, gradN([NE.cian, NE.violeta])]] });
    N_BURBUJA(300, 30, 52, [NE.violeta, NE.rosa], 'like'); N_BURBUJA(396, 138, 44, ['#6366f1', NE.violeta], 'corazon'); N_BURBUJA(356, 190, 42, [NE.violeta, NE.rosa], 'compartir');
    N_BURBUJA(696, 140, 44, [NE.violeta, NE.rosa], 'corazon'); N_BURBUJA(356, 928, 50, ['#6366f1', NE.violeta], 'compartir');
    N_BARRA(515, 165, 110, 26, [NE.azul, NE.violeta, NE.rosa]); N_CURSOR(600, 172, 30, NE.cian, { glow:NE.cian });
    N_BARRA(46, 520, 146, 30, [NE.cian, NE.violeta, NE.rosa], { marco:'#ffffff' }); N_CURSOR(176, 556, 34, '#ffffff', { glow:NE.rosa });
    N_BARRA(700, 880, 120, 22, [hexA(NE.cian, 0.2), hexA(NE.violeta, 0.2)], { marco:NE.rosa, glow:false });
    N_BARRA(470, 905, 92, 26, [hexA(NE.violeta, 0.5), hexA(NE.rosa, 0.5)], { marco:NE.cian, glow:false }); N_CURSOR(546, 917, 32, NE.cian, { glow:NE.cian });
    N_CURSOR(864, 754, 36, NE.cian, { glow:NE.cian }); N_ICO('destello', 856, 744, 30, NE.cian, { glow:NE.cian });
    N_ARCO(560, 0, 120, 95, 160, NE.violeta, 4); N_ARCO(820, 60, 130, 120, 175, NE.rosa, 3); N_ARCO(150, 450, 60, 140, 230, NE.naranja, 4); N_ARCO(860, 250, 70, -50, 10, NE.cian, 4);
    N_ARCO(360, 880, 70, -60, 20, NE.cian, 4); N_ARCO(890, 990, 60, 200, 260, NE.rosa, 3);
    N_P('M560 1080C700 950 820 1010 910 900C980 820 1030 860 1080 780V1080Z', { grad:[NE.cian, NE.violeta, NE.rosa], gradAng:0, sw:0, op:0.9, nombre:'Ola' });
    N_P('M680 1080C780 1000 880 1050 960 960C1010 910 1050 920 1080 900V1080Z', { grad:['#6366f1', NE.violeta], gradAng:0, sw:0, op:0.75, nombre:'Ola' });
    N_TXT('4 FUNCIONES', 520, 365, { f:'Bebas Neue', s:196, b:'400', w:1050, skew:-8, grad:['#5eead4', NE.lima, NE.naranja], gradAng:0, borde:'#e0fffb', bordeAncho:3, glow:hexA(NE.cian, 0.9), blur:34 });
    N_TXT('OCULTAS', 520, 515, { f:'Montserrat', s:122, b:'900', w:900, grad:[NE.amarillo, NE.naranja], gradAng:0, glow:hexA(NE.naranja, 0.85), blur:30 });
    N_TXT('de nuestro', 520, 635, { f:'Pacifico', s:92, b:'400', w:800, c:'#fbcfe8', glow:NE.rosa, blur:26 });
    N_TXT('NUEVO DISEÑADOR', 520, 765, { f:'Bebas Neue', s:158, b:'400', w:1050, skew:-8, c:'#ffffff', glow:'#e879f9', blur:36 });
  }},
  { nombre:'Neón · Prototipado de apps y web', tam:[1080, 1080], crear(){
    N_FONDO('#0b0a3a', '#3b0a6b', [[620, 700, 420, NE.cian, 0.3], [900, 180, 300, NE.violeta, 0.35]]);
    N_GRID(800, 0, 280, 230, 24, '#818cf8', 0.25); N_PUNTOS(900, 40, 5, 3, 20, 3, NE.cian, 0.6);
    [[100, 90, 260, 1], [160, 70, 200, 0.6], [200, 1040, 140, 0.6], [140, 1060, 170, 1], [940, 470, 120, 0.7]].forEach(([x, y, w, op]) => N_BARRA(x, y, w, 12, [hexA(NE.cian, 0), NE.cian], { ang:-38, op, blur:16 }));
    // red de nodos a la izquierda
    N_P('M0 430L55 435L40 500L0 520M55 435L95 470M40 500L100 545M0 760L60 790L140 830L210 920M60 790L20 870', { stroke:'#7dd3fc', sw:1.5, op:0.6, nombre:'Red' });
    [[55, 435, 9, NE.cian], [95, 470, 6, NE.violeta], [40, 500, 7, NE.cian], [100, 545, 5, '#ffffff'], [60, 790, 10, '#818cf8'], [140, 830, 7, NE.violeta], [210, 920, 9, NE.cian], [20, 870, 6, NE.violeta], [700, 75, 12, NE.cian], [760, 78, 7, NE.violeta], [1000, 175, 7, NE.rosa], [65, 670, 6, '#ffffff']]
      .forEach(([x, y, r, c]) => { const k = CIRC(x, y, r, c); BRILLO(k, c, 10); });
    N_TXT('Prototipado\nde Apps y Web', 90, 255, { al:'left', f:'Montserrat', s:96, b:'800', w:900, lh:1.08, colores:[[15, 25, NE.cian]] });
    // escena en isométrico
    const iso = (cx, cy, w, h, col, op = 0.9) => N_P(`M${cx - w / 2} ${cy}L${cx} ${cy - h / 2}L${cx + w / 2} ${cy}L${cx} ${cy + h / 2}Z`, { fill:hexA(col, 0.18), stroke:col, sw:2.5, glow:col, blur:16, op, nombre:'Tarjeta isométrica' });
    iso(640, 760, 620, 330, NE.cian, 0.55);
    iso(390, 640, 300, 150, '#818cf8'); N_P('M330 640L390 610M360 650L420 620M400 662L450 637', { stroke:NE.lila, sw:3, nombre:'Líneas' });
    iso(470, 720, 300, 150, NE.cian); N_P('M430 715L490 685M460 735L520 705', { stroke:NE.cian, sw:3, nombre:'Líneas' });
    iso(560, 845, 330, 170, '#818cf8'); N_ARCO(545, 840, 34, 0, 300, NE.cian, 5);
    iso(860, 820, 300, 160, NE.violeta); N_P('M800 820L860 790M830 835L895 803M870 850L925 822', { stroke:NE.rosa, sw:3, nombre:'Líneas' });
    iso(860, 690, 220, 130, NE.rosa, 0.8);
    N_ICO('cubo', 580, 560, 140, NE.lila, { sw:1.2, glow:NE.violeta, blur:16 });
    N_TELEFONO(625, 440, 175, 320, '#c7d2fe', { ang:14, sw:5, relleno:[NE.cian, '#6366f1', NE.rosa], glow:hexA(NE.cian, 0.8), blur:40 });
    N_ICO('cubo', 700, 600, 95, '#e0f2fe', { sw:1.4, glow:NE.cian });
    N_ICO('lapiz', 875, 600, 150, '#f0abfc', { sw:1.5, glow:NE.rosa, blur:16, ang:-8 });
    N_ARCO(840, 500, 26, 0, 330, NE.rosa, 4);
  }},
  { nombre:'Neón · Mapas mentales ultra rápidos', tam:[1080, 1080], crear(){
    N_FONDO('#0a0e38', '#1f1650', [[540, 540, 420, NE.violeta, 0.22]]);
    N_VENTANA(42, 40, 205, 200, NE.lila, { op:0.7 }); N_VENTANA(52, 790, 192, 180, NE.lila, { op:0.6 });
    N_P(rr(808, 40, 165, 132, 10), { fill:hexA(NE.violeta, 0.35), stroke:NE.lila, sw:2, nombre:'Ventana' }); N_VENTANA(808, 40, 165, 132, NE.lila, { op:0.8 });
    N_GRID(930, 360, 150, 260, 20, '#6366f1', 0.25);
    const nodos = [[500, 150, NE.cian, 'foco'], [272, 245, NE.violeta, 'engranes'], [765, 248, NE.cian, 'monitor'], [890, 505, NE.rosa, 'cerebro'], [760, 760, NE.verde, 'grafica'], [515, 828, NE.violeta, 'cerebro'], [272, 760, NE.cian, 'monitor']];
    const cen = [[500, 330], [440, 360], [600, 330], [760, 500], [610, 680], [515, 680], [460, 680]];
    nodos.forEach(([x, y, c], i) => { const [a, b] = cen[i]; N_P(`M${a} ${b}Q${(a + x) / 2 + (i % 2 ? 40 : -40)} ${(b + y) / 2} ${x} ${y}`, { stroke:c, sw:3.5, glow:c, blur:10, nombre:'Conexión' }); });
    N_P('M500 105V60H430V40M765 205V140H900V100M930 505H1000V420M760 805V880H820', { stroke:'#60a5fa', sw:3, op:0.8, glow:'#60a5fa', blur:8, nombre:'Conexiones' });
    nodos.forEach(([x, y, c, ic]) => N_NODO(x, y, 46, c, ic));
    N_TXT('Mapas\nMentales\nUltra Rápidos', 540, 525, { f:'Montserrat', s:104, b:'800', w:900, lh:1.05, colores:[[15, 20, NE.cian], [21, 28, NE.amarillo]], glow:'rgba(0,0,0,.35)', blur:10 });
    // varita mágica
    N_BARRA(20, 560, 300, 22, ['#6366f1', NE.violeta, '#e0e7ff'], { ang:-38, blur:20 });
    N_HALO(200, 420, 70, '#c7d2fe', 0.8);
    [[200, 420, 40, '#ffffff'], [140, 400, 22, NE.cian], [250, 360, 18, NE.amarillo], [230, 480, 20, NE.rosa], [130, 460, 14, NE.amarillo]].forEach(([x, y, s, c]) => N_ICO('destello', x, y, s, c, { lleno:true, glow:c }));
    N_P('M200 330V360M290 420H262M200 512V482M130 360l18 18M270 360l-18 18', { stroke:'#e0e7ff', sw:3, glow:NE.cian, nombre:'Destellos' });
    N_CURSOR(305, 112, 34, '#ffffff'); N_CURSOR(955, 230, 34, NE.violeta, { lleno:true, glow:NE.violeta }); N_CURSOR(930, 650, 30, '#ffffff'); N_CURSOR(380, 890, 32, '#ffffff', { glow:NE.cian });
    N_P(rr(605, 90, 100, 28, 14), { stroke:NE.cian, sw:2, nombre:'Barra de carga' }); N_P('M622 97h12v14h-12zM640 97h12v14h-12zM658 97h12v14h-12z', { fill:NE.cian, sw:0, glow:NE.cian, nombre:'Carga' }); N_P('M612 97h6v14h-6z', { fill:NE.rosa, sw:0, nombre:'Carga' });
    N_P(rr(840, 875, 130, 26, 13), { stroke:NE.verde, sw:2, nombre:'Barra de carga' }); N_P('M852 882h80v12h-80z', { fill:NE.verde, sw:0, glow:NE.verde, nombre:'Carga' });
    N_ICO('engrane', 650, 890, 50, NE.verde, { sw:1.5 }); N_ARCO(950, 380, 22, -60, 230, NE.verde, 3); N_ICO('check', 950, 380, 22, NE.verde);
    N_PUNTOS(120, 290, 1, 1, 0, 6, NE.violeta, 1); N_PUNTOS(955, 600, 1, 1, 0, 6, NE.rosa, 1); N_PUNTOS(125, 712, 3, 1, 34, 6, NE.cian, 0.8);
    N_P(rr(745, 920, 380, 200, 30), { fill:hexA('#0e7490', 0.6), sw:0, nombre:'Esquina' });
  }},
  { nombre:'Neón · Todo en un solo lugar', tam:[1080, 1080], crear(){
    N_FONDO('#1e1b6b', '#7e22ce', [[300, 380, 280, NE.cian, 0.25], [880, 860, 360, NE.rosa, 0.35]]);
    N_GRID(0, 0, 1080, 1080, 30, '#a5b4fc', 0.12);
    N_P('M0 0H330C320 120 260 200 120 220C60 228 20 250 0 280Z', { grad:['#4338ca', '#7c3aed'], gradAng:45, sw:0, op:0.9, nombre:'Mancha' });
    N_PUNTOS(100, 110, 3, 3, 24, 4, '#c7d2fe', 0.7);
    N_VENTANA(620, 55, 330, 300, '#a5b4fc', { op:0.35 }); N_VENTANA(68, 775, 245, 205, '#a5b4fc', { op:0.35 });
    // QR con esquinas
    N_P(rr(165, 285, 215, 215, 26), { grad:['#6d28d9', '#4338ca'], gradAng:45, stroke:NE.cian, sw:5, glow:NE.cian, blur:30, nombre:'Marco del QR' });
    N_QR(195, 315, 155, [NE.cian, '#e879f9'], 11); N_ESQUINAS(185, 305, 175, NE.amarillo, 26);
    // flujo de íconos
    N_P('M272 500V560M272 600V690H350M130 690V630H272M450 690H470V760M470 800V870H420M330 870H260V760', { stroke:'#c7d2fe', sw:3, op:0.85, glow:NE.rosa, blur:8, nombre:'Conexiones' });
    N_P('M290 600h40M380 870h170M490 640V600', { stroke:'#f0abfc', sw:4, op:0.9, nombre:'Puntos de conexión' }).set('strokeDashArray', [2, 12]);
    [[118, 690, 'lupa', NE.lima], [282, 690, 'persona', NE.lima], [470, 712, 'engrane', NE.amarillo], [375, 872, 'chat', NE.amarillo]].forEach(([x, y, ic, c]) => {
      N_P(rr(x - 42, y - 42, 84, 84, 16), { grad:['#6366f1', NE.violeta], gradAng:90, stroke:'#c7d2fe', sw:2, glow:hexA(NE.violeta, 0.9), blur:20, nombre:'Botón de ícono' });
      N_ICO(ic, x, y, 46, c, { sw:2 });
    });
    N_PUNTOS(600, 870, 1, 1, 0, 8, '#f9a8d4', 1); N_P('M335 615h22M346 604v22', { stroke:NE.rosa, sw:3, nombre:'Más' });
    N_TXT('Todo en\nun solo\nlugar', 525, 470, { al:'left', f:'Montserrat', s:108, b:'800', w:545, lh:1.05, colores:[[8, 15, NE.lima]] });
    // herramienta pluma
    N_P(rr(620, 705, 440, 340, 18), { grad:[NE.rosa, NE.violeta], gradAng:120, sw:0, op:0.9, nombre:'Ventana' });
    N_P(rr(620, 705, 440, 340, 18) + 'M620 740H1060', { stroke:'#fbcfe8', sw:2, nombre:'Marco de ventana' });
    N_P('M690 820H1010V1000H690Z', { stroke:'#fbcfe8', sw:2, op:0.8, nombre:'Selección' }).set('strokeDashArray', [8, 8]);
    N_P('M740 700Q790 620 900 660', { stroke:NE.cian, sw:2.5, nombre:'Manija' }); N_P('M740 700C760 810 880 760 920 680', { stroke:'#e0f2fe', sw:4, glow:NE.cian, nombre:'Curva' });
    [[740, 700], [820, 660], [900, 660], [880, 730]].forEach(([x, y]) => N_P(rr(x - 8, y - 8, 16, 16, 3), { fill:NE.cian, sw:0, glow:NE.cian, nombre:'Punto' }));
    N_ICO('pluma', 880, 830, 190, '#f5f3ff', { sw:1, ang:-38, glow:NE.violeta, blur:20 });
    N_P('M985 690C1045 650 1060 600 1020 565', { stroke:NE.rosa, sw:22, op:0.9, nombre:'Curva decorativa' });
  }},
  { nombre:'Neón · Mi kit de marca', tam:[1080, 1080], crear(){
    N_FONDO('#0b1035', '#3b0a6b', [[900, 900, 360, NE.violeta, 0.35]]);
    N_GRID(0, 0, 330, 660, 30, '#6366f1', 0.2); N_GRID(900, 0, 180, 400, 30, '#6366f1', 0.18); N_GRID(0, 760, 360, 320, 30, '#6366f1', 0.18);
    N_P('M75 45H340M75 45V600M75 80H340', { stroke:'#818cf8', sw:2.5, op:0.8, nombre:'Marco' }); N_PUNTOS(92, 62, 3, 1, 15, 4, NE.rosa, 1);
    N_P(rr(270, 54, 70, 20, 10), { stroke:'#818cf8', sw:2, nombre:'Botón' });
    N_TXT('Mi Kit de Marca', 540, 205, { f:'Montserrat', s:96, b:'800', w:980 });
    T('Paleta de colores', 300, 330, { f:'Montserrat', s:30, b:'600', c:'#ffffff', w:340, al:'left' }).set({ originX:'left', left:133 });
    LINEA(133, 356, 905, 356, '#6366f1', 2);
    const cols = ['#6366F1', '#3B82F6', null, '#EC4899', '#10B981', '#22D3EE', '#FB7185', '#FF6B6B'];
    cols.forEach((c, i) => {
      const x = 170 + i * 98, k = new fabric.Circle({ left:x, top:420, radius:40, originX:'center', originY:'center', fill:c || gradN(['#2dd4bf', '#f0abfc']), name:'Color ' + (i + 1), id:nuevoId() });
      canvas.add(k);
      T(c || '#5EEAD4', x, 485, { f:'Inter', s:15, c:'#cbd5e1', w:96 });
    });
    T('Tipografías', 300, 600, { f:'Montserrat', s:30, b:'600', c:'#ffffff', w:340, al:'left' }).set({ originX:'left', left:133 });
    LINEA(133, 626, 625, 626, '#6366f1', 2);
    [['Montserrat', '800'], ['Poppins', '400'], ['Inter', '300']].forEach(([f, b], j) => ['Aa', 'Bb', 'Cc'].forEach((s, i) => T(s, 180 + i * 125, 700 + j * 85, { f, s:62, b, c:'#ffffff', w:120 })));
    N_P('M500 650V900M488 650H512M488 900H512M500 670l-8 14M500 670l8 14M494 700h12M494 730h8M494 760h12M494 790h8M494 820h12M494 850h8', { stroke:'#60a5fa', sw:2, nombre:'Regla' });
    N_TXT('G', 580, 700, { f:'Playfair Display', s:80, b:'400', w:80, c:'rgba(0,0,0,0)', borde:'#60a5fa', bordeAncho:2 });
    N_TXT('¶', 580, 780, { f:'Playfair Display', s:76, b:'400', w:80, c:'rgba(0,0,0,0)', borde:'#60a5fa', bordeAncho:2 });
    N_TXT('A', 520, 860, { f:'Montserrat', s:72, b:'400', w:80, c:'rgba(0,0,0,0)', borde:'#60a5fa', bordeAncho:2 }); N_TXT('Z', 590, 860, { f:'Pacifico', s:66, b:'400', w:80, c:'#818cf8' });
    N_P('M665 605H905V875H665Z', { stroke:'#60a5fa', sw:2, nombre:'Marco del logo' });
    N_P('M785 650C730 640 700 690 730 740C700 790 740 830 785 800C830 830 870 790 840 740C870 690 840 640 785 650Z', { grad:['#6366f1', NE.rosa, NE.cian], gradAng:45, sw:0, nombre:'Logo (cámbialo por el tuyo)' });
    N_P('M785 700L815 740L785 780L755 740Z', { fill:'#ff6b6b', sw:0, op:0.9, nombre:'Logo (centro)' });
    T('LOGO', 785, 835, { f:'Montserrat', s:40, b:'800', c:'#ffffff', w:220 });
    N_CURSOR(40, 245, 38, NE.cian); N_CURSOR(950, 250, 36, NE.cian); N_CURSOR(70, 660, 30, NE.violeta); N_CURSOR(948, 540, 36, NE.cian); N_CURSOR(372, 1000, 34, NE.cian);
    N_P(rr(950, 30, 50, 50, 6), { stroke:'#818cf8', sw:2, nombre:'Recuadro' }); N_CURSOR(962, 42, 22, NE.violeta, { lleno:true });
    N_P(rr(950, 636, 30, 76, 6), { stroke:'#818cf8', sw:2, nombre:'Interruptor' }); RECT(956, 645, 18, 18, NE.rosa, { r:3 }); RECT(956, 683, 18, 18, NE.cian, { r:3 });
    N_BARRA(540, 1005, 180, 30, ['#ff6b6b', NE.cian], { marco:'#818cf8', glow:false });
    N_P(rr(820, 980, 175, 66, 10), { stroke:'#818cf8', sw:2, nombre:'Selector' }); RECT(835, 995, 36, 36, NE.rosa, { r:4 }); N_P(rr(888, 995, 36, 36, 4), { stroke:'#c7d2fe', sw:2, nombre:'Muestra' }).set('strokeDashArray', [4, 4]); RECT(940, 995, 36, 36, NE.cian, { r:4 });
    N_PUNTOS(980, 420, 4, 4, 20, 3, '#6366f1', 0.6); N_PUNTOS(60, 960, 6, 2, 20, 3, '#6366f1', 0.5);
  }},
  { nombre:'Neón · Tip del día (post vertical)', tam:[1080, 1350], crear(){
    N_FONDO('#090d3a', '#2a0b5e', [[540, 600, 600, NE.violeta, 0.28]]);
    N_GRID(0, 0, 1080, 260, 30, '#6366f1', 0.15); N_PUNTOS(70, 1180, 6, 3, 24, 4, NE.cian, 0.5); N_PUNTOS(870, 70, 6, 3, 24, 4, NE.rosa, 0.6);
    N_TXT('TIP DEL DÍA', 540, 200, { f:'Bebas Neue', s:170, b:'400', w:1000, skew:-6, c:'rgba(0,0,0,0)', borde:NE.cian, bordeAncho:4, glow:NE.cian, blur:30 });
    N_TXT('#01', 540, 330, { f:'Montserrat', s:60, b:'800', w:400, grad:[NE.amarillo, NE.naranja], gradAng:0, glow:hexA(NE.naranja, 0.8) });
    N_P(rr(110, 420, 860, 600, 40), { fill:hexA('#1e1b4b', 0.75), stroke:NE.violeta, sw:3, glow:hexA(NE.violeta, 0.9), blur:30, nombre:'Tarjeta' });
    N_ICO('foco', 540, 520, 110, NE.amarillo, { sw:1.6, glow:NE.amarillo, blur:18 });
    N_TXT('Escribe aquí tu tip: algo corto, útil y fácil de recordar.', 540, 720, { f:'Poppins', s:52, b:'600', w:740, lh:1.25 });
    N_TXT('Guárdalo para no olvidarlo 🔖', 540, 900, { f:'Poppins', s:34, b:'400', w:740, c:'#c4b5fd' });
    N_BURBUJA(150, 1080, 70, [NE.violeta, NE.rosa], 'corazon'); N_BURBUJA(250, 1110, 60, ['#6366f1', NE.violeta], 'compartir');
    N_BARRA(640, 1110, 300, 70, [NE.cian, NE.violeta, NE.rosa], { blur:24 }); T('Síguenos', 790, 1145, { f:'Montserrat', s:36, b:'800', c:'#ffffff', w:300 });
    N_CURSOR(900, 1150, 46, '#ffffff', { glow:NE.rosa });
    N_ARCO(110, 420, 90, 180, 260, NE.cian, 5); N_ARCO(970, 1020, 90, 0, 80, NE.rosa, 5);
  }},
  { nombre:'Neón · ¡Ya disponible! (lanzamiento)', tam:[1080, 1080], crear(){
    N_FONDO('#070b2e', '#311061', [[760, 560, 440, NE.cian, 0.25], [300, 300, 300, NE.rosa, 0.2]]);
    N_GRID(0, 760, 1080, 320, 34, '#6366f1', 0.2); N_PUNTOS(60, 60, 5, 2, 24, 4, NE.cian, 0.7);
    N_TXT('NUEVO', 90, 130, { al:'left', f:'Montserrat', s:40, b:'800', w:205, c:'#0b0b2e', cs:200 }).set({ backgroundColor:NE.lima });
    N_TXT('¡YA\nDISPONIBLE!', 90, 350, { al:'left', f:'Bebas Neue', s:158, b:'400', w:560, lh:0.92, skew:-6, grad:['#ffffff', NE.cian], gradAng:90, glow:hexA(NE.cian, 0.8), blur:34 });
    N_TXT('Describe en una frase lo que lanzas y por qué le va a encantar a tu público.', 90, 620, { al:'left', f:'Poppins', s:36, b:'400', w:520, lh:1.3, c:'#dbeafe' });
    N_BARRA(90, 760, 380, 92, [NE.naranja, NE.rosa], { blur:30 }); T('Pruébalo gratis →', 280, 806, { f:'Montserrat', s:38, b:'800', c:'#ffffff', w:380 });
    T('tusitio.com', 280, 900, { f:'Poppins', s:30, c:'#a5b4fc', w:380 });
    N_TELEFONO(720, 230, 280, 540, '#c7d2fe', { sw:6, ang:8, relleno:['#1e1b4b', '#312e81'], glow:hexA(NE.cian, 0.85), blur:50,
      tarjetas:[[0.1, 0.24, gradN([NE.cian, NE.violeta])], [0.39, 0.16, hexA(NE.violeta, 0.6)], [0.59, 0.16, hexA(NE.rosa, 0.55)], [0.79, 0.12, gradN([NE.naranja, NE.rosa])]] });
    N_ICO('cohete', 600, 230, 110, NE.amarillo, { sw:1.5, glow:NE.naranja, blur:18, ang:30 });
    N_BURBUJA(940, 180, 74, [NE.rosa, NE.violeta], 'corazon'); N_BURBUJA(610, 700, 64, ['#6366f1', NE.violeta], 'like');
    N_ARCO(840, 520, 360, 200, 250, NE.cian, 4); N_ARCO(840, 520, 400, 20, 60, NE.rosa, 4);
    N_CURSOR(470, 820, 44, '#ffffff', { glow:NE.rosa });
  }},
  { nombre:'Neón · Nueva función (historia)', tam:[1080, 1920], crear(){
    N_FONDO('#080b30', '#3a0d6e', [[540, 900, 700, NE.violeta, 0.3], [540, 1500, 500, NE.cian, 0.18]]);
    N_GRID(0, 0, 1080, 420, 36, '#6366f1', 0.16); N_GRID(0, 1560, 1080, 360, 36, '#6366f1', 0.16);
    N_PUNTOS(80, 470, 3, 6, 26, 4, NE.cian, 0.6); N_PUNTOS(950, 520, 3, 6, 26, 4, NE.rosa, 0.6);
    N_TXT('NUEVA', 540, 300, { f:'Bebas Neue', s:220, b:'400', w:1000, skew:-6, c:'rgba(0,0,0,0)', borde:NE.cian, bordeAncho:5, glow:NE.cian, blur:36 });
    N_TXT('FUNCIÓN', 540, 480, { f:'Bebas Neue', s:220, b:'400', w:1000, skew:-6, grad:[NE.amarillo, NE.naranja, NE.rosa], gradAng:0, glow:hexA(NE.rosa, 0.8), blur:40 });
    N_P(rr(140, 640, 800, 600, 24) + 'M140 690H940', { fill:hexA('#1e1b4b', 0.6), stroke:'#c7d2fe', sw:3, glow:hexA(NE.violeta, 0.9), blur:30, nombre:'Marco de la captura' });
    N_PUNTOS(170, 665, 3, 1, 22, 6, NE.rosa, 0.9);
    N_P(rr(180, 730, 720, 470, 16), { stroke:'#a5b4fc', sw:2, op:0.8, nombre:'Lugar de la captura' }).set('strokeDashArray', [12, 10]);
    N_ICO('monitor', 540, 910, 110, '#a5b4fc', { sw:1.4 });
    N_TXT('Pon aquí una captura de pantalla', 540, 1030, { f:'Poppins', s:32, b:'400', w:700, c:'#c4b5fd' });
    N_TXT('Nombre de la función', 540, 1340, { f:'Montserrat', s:76, b:'800', w:940 });
    N_TXT('Explica en una línea qué hace y por qué te ahorra tiempo.', 540, 1460, { f:'Poppins', s:40, b:'400', w:860, c:'#dbeafe', lh:1.3 });
    N_ICO('flechaArriba', 540, 1690, 90, '#ffffff', { sw:2.2, glow:NE.cian, blur:20 });
    T('Desliza para verla', 540, 1780, { f:'Montserrat', s:38, b:'700', c:'#ffffff', w:700 });
    N_BURBUJA(70, 560, 80, [NE.violeta, NE.rosa], 'like'); N_BURBUJA(905, 540, 80, [NE.rosa, NE.violeta], 'corazon');
    N_CURSOR(860, 1180, 56, '#ffffff', { glow:NE.rosa });
    N_ARCO(140, 640, 120, 180, 260, NE.cian, 5); N_ARCO(940, 1240, 120, 0, 80, NE.rosa, 5);
  }}
];
const FUENTES_NEON = ['Bebas Neue', 'Montserrat', 'Pacifico', 'Poppins', 'Inter', 'Playfair Display'];
function cargarFuentesNeon(){ return Promise.all(FUENTES_NEON.flatMap(f => ['400', '600', '800', '900'].map(b => document.fonts.load(`${b} 40px "${f}"`).catch(() => null)))); }
function usarPlantillaNeon(p){
  const fin = () => { FUENTES_NEON.forEach(f => fabric.util.clearFabricFontCache(f)); usarOrganizador(p); };
  Promise.race([cargarFuentesNeon(), new Promise(r => setTimeout(r, 2500))]).then(fin, fin);
}
PLANTILLAS_NEON.forEach(p => CATALOGO.push({ nombre:p.nombre, cat:CAT_NEON, tam:p.tam, crear:p.crear, usar:() => usarPlantillaNeon(p), neon:true }));
CATEGORIAS.splice(CATEGORIAS.indexOf(CAT_MIAS) + 1, 0, CAT_NEON);
(function(){
  const c = document.createElement('button'); c.className = 'chip'; c.textContent = '✨ Neón y tech';
  c.onclick = () => { catActiva = CAT_NEON; document.querySelectorAll('#chipsCat .chip').forEach(x => x.classList.toggle('on', x === c)); renderCatalogo(); };
  const mias = [...document.querySelectorAll('#chipsCat .chip')].find(x => x.textContent.includes('Mías'));
  if (mias) mias.after(c); else $('chipsCat').appendChild(c);
  // las miniaturas se rehacen cuando ya cargaron las letras (para que se vean como de verdad)
  cargarFuentesNeon().then(() => setTimeout(() => {
    CATALOGO.filter(it => it.neon && it.vista).forEach(it => { it.vista = vistaDe(it.tam, it.crear); if (it.boton) it.boton.querySelector('.mini').innerHTML = `<img src="${it.vista}" alt="">`; });
  }, 1500));
})();

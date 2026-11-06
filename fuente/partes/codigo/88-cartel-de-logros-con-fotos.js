/* =========================================================
   CARTEL DE LOGROS CON FOTOS (rendición de cuentas de la escuela)
   Encabezado con logos, franja con escena escolar, título con píldora y seis recuadros
   de colores con pestaña, fotos (marcos donde se suelta la foto) y texto. Todo se puede editar.
   ========================================================= */
// achica la letra hasta que el texto quepa en sus renglones (sin que se parta una palabra a otro renglón)
function CABE(t){
  const n = t.text.split('\n').length;
  while (t.textLines.length > n && t.fontSize > 12){ t.set('fontSize', t.fontSize - 2); t.initDimensions(); }
  return t;
}
// texto de varios colores: partes = [[texto, color], ...]
function T_COLORES(partes, x, y, o = {}){
  const t = T(partes.map(p => p[0]).join(''), x, y, o);
  let i = 0;
  partes.forEach(([txt, col]) => { t.setSelectionStyles({ fill:col }, i, i + txt.length); i += txt.length; });
  t.name = o.nombre || 'Texto';
  return CABE(t);
}
// recuadro con pestaña de título, fotos y texto de abajo
function RECUADRO_LOGRO(x, y, w, h, titulo, borde, pestana, fotos, texto, o = {}){
  RECT(x, y, w, h, '#ffffff', { r:22, stroke:borde, sw:9, nombre:'Recuadro: ' + titulo });
  const tw = o.tw || w - 40, th = 74;
  RECT(x + (w - tw) / 2, y - th / 2 - 4, tw, th, pestana, { r:18, nombre:'Pestaña: ' + titulo });
  CABE(T(titulo, x + w / 2, y - 4, { f:'Oswald', s:o.ts || 54, b:'700', c:'#111111', w:tw - 10 })).name = 'Título: ' + titulo;
  fotos.forEach(([fx, fy, fw, fh]) => { FOTO(x + fx, y + fy, fw, fh, 'rect').name = 'Foto: ' + titulo; });
  CABE(T(texto, x + w / 2, o.yt, { f:'Oswald', s:o.s || 44, b:'700', c:'#111111', w:w - 40, lh:1.05 })).name = 'Texto: ' + titulo;
}
function ESCENA_ESCUELA(y0, alto){
  const N = n => ({ nombre:'Escena: ' + n });
  [[150, y0 + 70, 1], [610, y0 + 50, 0.8], [1180, y0 + 60, 1.1]].forEach(([cx, cy, k]) => {
    FIG(circD(cx, cy, 34 * k) + circD(cx + 40 * k, cy - 14 * k, 42 * k) + circD(cx + 84 * k, cy, 32 * k), '#ffffff', { op:0.95, ...N('Nube') });
  });
  FIG(`M0 ${y0 + alto - 120}Q350 ${y0 + alto - 190} 700 ${y0 + alto - 130}T1374 ${y0 + alto - 150}V${y0 + alto}H0Z`, '#6cc04a', N('Pasto'));
  FIG(`M0 ${y0 + alto - 70}Q500 ${y0 + alto - 120} 1000 ${y0 + alto - 80}T1374 ${y0 + alto - 90}V${y0 + alto}H0Z`, '#4fa83a', N('Pasto'));
  // árboles
  [[200, 0.85], [1160, 0.95]].forEach(([cx, k]) => {
    RECT(cx - 12 * k, y0 + alto - 170 * k, 24 * k, 110 * k, '#8b5a2b', { ...N('Tronco') });
    FIG(circD(cx, y0 + alto - 200 * k, 62 * k) + circD(cx - 45 * k, y0 + alto - 160 * k, 46 * k) + circD(cx + 45 * k, y0 + alto - 160 * k, 46 * k), '#2f9e44', N('Árbol'));
  });
  // escuela
  const ex = 687, eb = y0 + alto - 40, ew = 300, eh = 120;
  RECT(ex - ew / 2, eb - eh, ew, eh, '#fbbf24', { stroke:'#b45309', sw:4, ...N('Escuela') });
  FIG(`M${ex - ew / 2 - 25} ${eb - eh}L${ex} ${eb - eh - 70}L${ex + ew / 2 + 25} ${eb - eh}Z`, '#ef4444', N('Techo'));
  CIRC(ex, eb - eh - 30, 24, '#ffffff', { stroke:'#7f1d1d', sw:4, nombre:'Escena: Reloj' });
  N_P(`M${ex} ${eb - eh - 70}V${eb - eh - 110}`, { stroke:'#7f1d1d', sw:4, nombre:'Escena: Asta' });
  FIG(`M${ex} ${eb - eh - 110}h44l-10 13l10 13h-44Z`, '#ef4444', N('Bandera'));
  [[-120, -100], [-120, -50], [90, -100], [90, -50]].forEach(([dx, dy]) => RECT(ex + dx, eb + dy, 30, 36, '#7dd3fc', { stroke:'#b45309', sw:3, ...N('Ventana') }));
  RECT(ex - 34, eb - 64, 68, 64, '#38bdf8', { stroke:'#b45309', sw:4, ...N('Puerta') });
  T('ESCUELA', ex, eb - eh + 22, { f:'Oswald', s:24, b:'700', c:'#7c2d12', w:200 }).name = 'Escena: Letrero';
}
function crearCartelLogros(){
  FONDO('#ffffff');
  // encabezado: tres lugares para logos y el texto del programa a la derecha
  FOTO(36, 10, 320, 96, 'rect').name = 'Logo 1';
  N_P('M380 24V96', { stroke:'#c5c1b5', sw:3, nombre:'Divisor' });
  FOTO(400, 10, 330, 96, 'rect').name = 'Logo 2';
  N_P('M752 24V96', { stroke:'#c5c1b5', sw:3, nombre:'Divisor' });
  FOTO(772, 10, 140, 96, 'rect').name = 'Logo 3';
  T('Programa La Escuela es Nuestra\n(LEEN)\nRecurso 2026', 1100, 58, { f:'Oswald', s:30, b:'700', c:'#111111', w:420, al:'right', lh:1.05 }).name = 'Programa';
  // franja con escena
  RECT(0, 116, 1374, 344, '#b1edf5', { nombre:'Franja del encabezado' });
  ESCENA_ESCUELA(116, 344);
  T_COLORES([['¡LA ESCUELA ', '#c8202a'], ['ES NUESTRA ', '#13315c'], ['- LEEN', '#6e1f3b']], 690, 162, { f:'Oswald', s:70, b:'700', w:1300, nombre:'Título del programa' });
  T('Ciclo Escolar / Recurso 2026', 702, 442, { f:'Oswald', s:30, b:'400', c:'#1f2937', w:420 }).name = 'Ciclo escolar';
  // título
  CABE(T('Logros y Mejoras en Nuestra', 548, 518, { f:'Oswald', s:84, b:'700', c:'#111111', w:790, al:'right' })).name = 'Título';
  RECT(966, 476, 356, 84, '#a8835a', { r:42, nombre:'Píldora' });
  T_COLORES([['Recurso ', '#2b1d10'], ['2026', '#ffffff']], 1144, 518, { f:'Oswald', s:56, b:'700', w:310, nombre:'Texto de la píldora' });
  // columna izquierda
  RECUADRO_LOGRO(74, 600, 600, 430, 'Mantenimiento y Limpieza', '#1d81b3', '#cff4fd',
    [[24, 140], [170, 110], [286, 160], [452, 124]].flatMap(([cx, cw]) => [[cx, 50, cw - 4, 100], [cx, 154, cw - 4, 122]]), 'Se compró material de\nmantenimiento, limpieza y\ndidáctico', { yt:958, tw:560, s:40 });
  RECUADRO_LOGRO(74, 1080, 600, 440, 'Juegos Infantiles', '#dfaa1c', '#ffe38f',
    [[22, 46, 272, 122], [22, 176, 272, 140], [302, 46, 276, 270]], 'Se realizaron juegos\nrecreativos para los niños', { yt:1440, tw:440 });
  RECUADRO_LOGRO(74, 1580, 600, 430, 'Mejora de Aulas', '#bf1a20', '#ffb0ac',
    [[20, 46, 274, 264], [304, 46, 278, 264]], 'Se arregló el piso para los salones\nde 1°, 2°, 3° y la biblioteca', { yt:1946, tw:430, s:42 });
  // columna derecha
  RECUADRO_LOGRO(710, 610, 600, 460, 'Área para Comer', '#2e9426', '#b5e486',
    [[22, 44, 304, 294], [334, 44, 246, 294]], 'Rehabilitación del área\npara comer', { yt:1000, tw:440 });
  RECUADRO_LOGRO(710, 1136, 600, 464, 'Mobiliario Escolar', '#248bb8', '#a1d9ea',
    [[22, 44, 282, 286], [312, 44, 268, 286]], 'Se compraron muebles\npara los salones', { yt:1528, tw:490 });
  RECT(710, 1630, 600, 380, '#ffffff', { r:22, stroke:'#70203b', sw:9, nombre:'Recuadro final' });
  CABE(T('...¡Y muchas cosas más\npara el bienestar de\nnuestros niños!', 1010, 1810, { f:'Oswald', s:60, b:'700', c:'#111111', w:560, lh:1.12 })).name = 'Mensaje final';
  FOTO(1236, 1922, 128, 84, 'rect').name = 'Logo pequeño';
  // pie
  RECT(0, 2016, 1374, 32, '#b89055', { nombre:'Barra del pie' });
  T('Fecha del Recurso: Año 2026', 687, 2032, { f:'Montserrat', s:24, b:'700', c:'#ffffff', w:800 }).name = 'Fecha';
}
CATALOGO.push({ nombre:'Logros de la escuela con fotos', cat:CAT_CART, tam:[1374, 2048], crear:crearCartelLogros,
  usar:() => usarPlantillaCC({ nombre:'Logros de la escuela con fotos', tam:[1374, 2048], crear:crearCartelLogros }) });
if (!FUENTES_CC.includes('Oswald')) FUENTES_CC.push('Oswald');

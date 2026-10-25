/* =========================================================
   PLANTILLAS DE CIENCIAS Y MATEMÁTICAS + CARTELES ESCOLARES
   Ciencias: método científico, reporte de laboratorio, la célula, ciclo del agua, datos y gráfica, ficha de elemento.
   Matemáticas: formulario, problema paso a paso, plano cartesiano, fracciones.
   Carteles: feria de ciencias, kermés, convocatoria, concurso de ofrendas, aviso a padres, torneo, graduación, semana de la lectura.
   ========================================================= */
const CAT_CIEN = 'Ciencias y matemáticas', CAT_CART = 'Carteles escolares';
// flecha curva con punta
function FLECHA_CURVA(x1, y1, cx, cy, x2, y2, col, sw = 6, nombre = 'Flecha'){
  N_P(`M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`, { stroke:col, sw, nombre });
  const dx = x2 - cx, dy = y2 - cy, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, s = sw * 3.2;
  FIG(`M${x2 + ux * s} ${y2 + uy * s}L${x2 - uy * s * 0.75} ${y2 + ux * s * 0.75}L${x2 + uy * s * 0.75} ${y2 - ux * s * 0.75}Z`, col, { nombre:'Punta' });
}
const FLECHA_RECTA = (x1, y1, x2, y2, col, sw = 5) => FLECHA_CURVA(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2, x2, y2, col, sw);
// fila de información con ícono (fecha, hora, lugar…)
function INFO(icono, texto, x, y, col, o = {}){
  ICONO(icono, x, y, o.tam || 54, o.colIcono || col);
  TL(texto, x + (o.tam || 54) * 0.85, y, { f:'Poppins', s:o.s || 34, b:'600', c:col, w:o.w || 800 });
}
// papel picado (fila de banderitas con picos y recortes)
function PAPEL_PICADO(y, colores, ancho = W, n = 7){
  const w = ancho / n, h = w * 0.85;
  N_P(`M0 ${y}H${ancho}`, { stroke:'#334155', sw:3, nombre:'Hilo' });
  for (let i = 0; i < n; i++){
    const x = i * w + 6, ww = w - 12, col = colores[i % colores.length];
    let d = `M${x} ${y}H${x + ww}V${y + h * 0.8}`;
    for (let k = 5; k >= 0; k--) d += `L${x + ww * k / 6 + (k % 2 ? 0 : 0)} ${y + h * (k % 2 ? 0.8 : 1)}`;
    FIG(d + 'Z', col, { nombre:'Papel picado' });
    FIG(`M${x + ww / 2} ${y + h * 0.18}l${ww * 0.12} ${h * 0.16}l${-ww * 0.12} ${h * 0.16}l${-ww * 0.12} ${-h * 0.16}Z M${x + ww * 0.22} ${y + h * 0.5}l${ww * 0.07} ${h * 0.1}l${-ww * 0.07} ${h * 0.1}l${-ww * 0.07} ${-h * 0.1}Z M${x + ww * 0.78} ${y + h * 0.5}l${ww * 0.07} ${h * 0.1}l${-ww * 0.07} ${h * 0.1}l${-ww * 0.07} ${-h * 0.1}Z`, '#ffffff', { op:0.85, nombre:'Recortes' });
  }
}
function FLOR_CEMPA(cx, cy, r){
  for (let k = 0; k < 3; k++){ let d = ''; const rr2 = r * (1 - k * 0.28); for (let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2 + k * 0.3; d += circD(cx + Math.cos(a) * rr2 * 0.6, cy + Math.sin(a) * rr2 * 0.6, rr2 * 0.38); } FIG(d, ['#f97316', '#fb923c', '#fbbf24'][k], { nombre:'Cempasúchil' }); }
  CIRC(cx, cy, r * 0.2, '#ea580c');
}
function SECCION(t, y, h, txt, col, o = {}){
  const x = o.x ?? 80, w = o.w ?? (W - 160);
  TL(t, x, y, { f:'Montserrat', s:o.s || 34, b:'800', c:col, w });
  RECT(x, y + 32, w, h, tinte(col, 0.09), { r:14, nombre:'Recuadro: ' + t });
  TL(txt, x + 28, y + 32, { f:'Poppins', s:o.ts || 24, c:GRIS_ESQ, w:w - 56, lh:1.45 }).set({ originY:'top', top:y + 32 + 22 });
}

const PLANTILLAS_CIEN = [
  { nombre:'Método científico', tam:[1920, 1080], crear(){
    DEGRADADO('#ecfeff', '#f0fdf4');
    CAB_ESQ('Método científico', 'Los pasos para investigar como un científico');
    const pasos = [['Observación', 'lupa', 'Mira con atención y anota lo que ves.'], ['Pregunta', 'chat', '¿Qué quieres averiguar?'], ['Hipótesis', 'foco', 'Tu respuesta posible, antes de probar.'],
      ['Experimento', 'engrane', 'Prueba tu hipótesis paso a paso.'], ['Análisis', 'grafica', 'Ordena y compara tus datos.'], ['Conclusión', 'check', '¿Se cumplió tu hipótesis? ¿Qué aprendiste?']];
    pasos.forEach(([n, ic, d], i) => {
      const x = 210 + i * 300, col = PAL_ESQ[i];
      if (i) FLECHA_RECTA(x - 195, 420, x - 112, 420, '#94a3b8', 5);
      const c = CIRC(x, 420, 95, col); BRILLO(c, hexA(col, 0.45), 26); c.set('esDeco', false);
      N_ICO(ic, x, 420, 92, '#ffffff', { sw:2 });
      cajaEsq(`${i + 1}. ${n}\n${d}`, x, 700, 270, 250, col, { fill:tinte(col), stroke:null, tam:22 });
    });
  }},
  { nombre:'Reporte de laboratorio', tam:[1240, 1754], crear(){
    FONDO('#ffffff');
    FIG(rr(0, 0, 1240, 200, 0), null, { grad:['#0f766e', '#0e7490'], gradAng:0, nombre:'Encabezado' });
    N_ICO('engrane', 1120, 100, 120, '#5eead4', { sw:1.4 });
    T('REPORTE DE LABORATORIO', 560, 80, { f:'Montserrat', s:54, b:'800', c:'#ffffff', w:1000 });
    T('Práctica N.º __ · Nombre · Grupo · Fecha', 560, 145, { f:'Poppins', s:26, c:'#ccfbf1', w:1000 });
    SECCION('Objetivo', 250, 120, 'Escribe qué quieres lograr o demostrar con esta práctica.', '#0f766e');
    SECCION('Hipótesis', 440, 120, 'Lo que crees que va a pasar y por qué.', '#0e7490');
    SECCION('Materiales', 630, 270, '•  Material 1\n•  Material 2\n•  Material 3\n•  Material 4', '#7c3aed', { w:520 });
    SECCION('Procedimiento', 630, 270, '1.  Primer paso\n2.  Segundo paso\n3.  Tercer paso\n4.  Cuarto paso', '#db2777', { x:640, w:520 });
    TL('Resultados', 80, 955, { f:'Montserrat', s:34, b:'800', c:'#ea580c', w:900 });
    crearTabla(620, 1180, 5, 4, { sep:6, rx:8, borde:'#fed7aa', grosor:2, enc:['#ea580c', '#ea580c', '#ea580c', '#ea580c'], encTexto:'#ffffff', filasColores:['#fff7ed'], celda:'#ffffff',
      fuente:'Poppins', fuenteEnc:'Montserrat', anchos:[270, 270, 270, 270], alto:62, altoEnc:68, tam:22, tamEnc:24 }, [['Prueba', 'Medida 1', 'Medida 2', 'Observación'], ['1'], ['2'], ['3'], ['4']]);
    SECCION('Conclusiones', 1410, 260, '¿Se cumplió tu hipótesis? Explica qué aprendiste y qué mejorarías.', '#16a34a');
  }},
  { nombre:'La célula (partes)', tam:[1920, 1080], crear(){
    FONDO('#f0fdf4');
    CAB_ESQ('La célula animal', 'Señala y describe cada parte', { x:760, w:1300 });
    const cel = new fabric.Ellipse({ left:760, top:600, rx:430, ry:330, originX:'center', originY:'center', fill:'#fef3c7', stroke:'#f59e0b', strokeWidth:9, name:'Membrana celular', id:nuevoId() }); canvas.add(cel);
    const nuc = new fabric.Circle({ left:830, top:560, radius:120, originX:'center', originY:'center', fill:'#ddd6fe', stroke:'#7c3aed', strokeWidth:7, name:'Núcleo', id:nuevoId() }); canvas.add(nuc);
    CIRC(860, 540, 42, '#7c3aed', { nombre:'Nucléolo' });
    [[520, 470, -20], [1010, 760, 25], [560, 760, 10]].forEach(([x, y, a]) => {
      const m = new fabric.Ellipse({ left:x, top:y, rx:78, ry:36, angle:a, originX:'center', originY:'center', fill:'#fecaca', stroke:'#dc2626', strokeWidth:5, name:'Mitocondria', id:nuevoId() }); canvas.add(m);
      N_P(`M${x - 50} ${y}q12 -18 25 0t25 0t25 0t25 0`, { stroke:'#dc2626', sw:3, nombre:'Crestas' });
    });
    [0, 1, 2].forEach(k => N_P(`M${1040 + k * 18} ${360 + k * 20}q70 -40 130 30`, { stroke:'#2563eb', sw:10, nombre:'Aparato de Golgi' }));
    const rnd = azarN(5); for (let i = 0; i < 26; i++){ const a = rnd() * Math.PI * 2, r = 120 + rnd() * 160; CIRC(760 + Math.cos(a) * r * 1.25, 600 + Math.sin(a) * r * 0.9, 7, '#16a34a', { nombre:'Ribosoma' }); }
    const et = [['Núcleo', 880, 470, 230, '#7c3aed'], ['Aparato de Golgi', 1170, 400, 380, '#2563eb'], ['Membrana celular', 1188, 600, 530, '#f59e0b'], ['Mitocondria', 1060, 770, 680, '#dc2626'], ['Ribosomas', 900, 860, 830, '#16a34a']];
    et.forEach(([n, px, py, ly, col]) => {
      LINEA(px, py, 1360, ly, col, 3); CIRC(px, py, 9, col);
      cajaEsq(n + '\nPara qué sirve…', 1590, ly, 440, 120, col, { tam:22 });
    });
  }},
  { nombre:'Ciclo del agua', tam:[1920, 1080], crear(){
    DEGRADADO('#e0f2fe', '#f0f9ff');
    TL('El ciclo del agua', 90, 90, { f:'Montserrat', s:64, b:'800', c:'#0c4a6e', w:900 });
    TL('Cómo el agua viaja por el planeta', 90, 158, { f:'Poppins', s:28, c:'#0369a1', w:900 });
    const sol = CIRC(1690, 190, 105, '#facc15', { nombre:'Sol' }); BRILLO(sol, 'rgba(250,204,21,.7)', 60);
    [[1000, 260, 80], [1085, 215, 95], [1175, 260, 78], [1090, 290, 80]].forEach(([x, y, r]) => CIRC(x, y, r, '#ffffff', { nombre:'Nube' }));
    for (let i = 0; i < 6; i++) LINEA(980 + i * 40, 380 + (i % 2) * 18, 965 + i * 40, 430 + (i % 2) * 18, '#0284c7', 5);
    FIG('M0 1080V720L290 390L470 600L650 470L980 1080Z', '#15803d', { nombre:'Montaña' });
    FIG('M290 390L345 460L318 452L292 476L262 452L238 458Z', '#ffffff', { nombre:'Nieve' });
    N_P('M470 640C560 760 620 860 860 930', { stroke:'#38bdf8', sw:18, nombre:'Río' });
    FIG('M860 860C1060 820 1260 900 1460 860C1620 830 1780 870 1920 850V1080H860Z', '#0ea5e9', { nombre:'Mar' });
    FIG('M860 930C1060 890 1260 970 1460 930C1620 900 1780 940 1920 920V1080H860Z', '#0284c7', { nombre:'Mar profundo' });
    FLECHA_CURVA(1500, 820, 1520, 560, 1260, 330, '#f97316', 6, 'Evaporación');
    FLECHA_CURVA(800, 540, 700, 330, 900, 250, '#64748b', 6, 'Condensación');
    FLECHA_CURVA(960, 470, 800, 560, 620, 560, '#0284c7', 6, 'Precipitación');
    FLECHA_CURVA(560, 930, 700, 1010, 840, 990, '#0f766e', 6, 'Escurrimiento');
    nodo('pildora', '1. Evaporación', 1620, 600, { w:330, h:70, fill:'#f97316', color:'#ffffff', tam:28, peso:'700', fuente:'Montserrat' });
    nodo('pildora', '2. Condensación', 700, 250, { w:340, h:70, fill:'#64748b', color:'#ffffff', tam:28, peso:'700', fuente:'Montserrat' });
    nodo('pildora', '3. Precipitación', 740, 640, { w:340, h:70, fill:'#0284c7', color:'#ffffff', tam:28, peso:'700', fuente:'Montserrat' });
    nodo('pildora', '4. Escurrimiento', 420, 1010, { w:360, h:70, fill:'#0f766e', color:'#ffffff', tam:28, peso:'700', fuente:'Montserrat' });
  }},
  { nombre:'Datos y gráfica del experimento', tam:[1920, 1080], crear(){
    FONDO('#ffffff');
    CAB_ESQ('Resultados del experimento', 'Registra tus datos y grafícalos');
    crearTabla(520, 590, 6, 3, { sep:6, rx:8, borde:'#c7d2fe', grosor:2, enc:['#4f46e5', '#4f46e5', '#4f46e5'], encTexto:'#ffffff', filasColores:['#eef2ff'], celda:'#ffffff',
      fuente:'Poppins', fuenteEnc:'Montserrat', anchos:[180, 240, 340], alto:80, altoEnc:84, tam:26, tamEnc:26 },
      [['Día', 'Altura (cm)', 'Observación'], ['1', '2', 'Brotó'], ['2', '3.5', ''], ['3', '5', ''], ['4', '7', ''], ['5', '8.5', '']]);
    const g = grupoGrafica({ tipo:'lineas', titulo:'Crecimiento de la planta', paleta:'Vibrante', valores:true, w:820, h:580,
      datos:[{ e:'Día 1', v:2 }, { e:'Día 2', v:3.5 }, { e:'Día 3', v:5 }, { e:'Día 4', v:7 }, { e:'Día 5', v:8.5 }] });
    g.setPositionByOrigin(new fabric.Point(1400, 590), 'center', 'center'); canvas.add(g);
    T('Conclusión: escribe qué muestran tus datos.', 960, 975, { f:'Poppins', s:30, c:GRIS_ESQ, w:1600, it:true });
  }},
  { nombre:'Ficha de elemento químico', tam:[1920, 1080], crear(){
    DEGRADADO('#f5f3ff', '#eef2ff');
    FIG(rr(140, 190, 560, 680, 36), null, { grad:['#7c3aed', '#4f46e5'], gradAng:120, nombre:'Tarjeta del elemento' });
    TL('6', 200, 260, { f:'Montserrat', s:64, b:'800', c:'#e0e7ff', w:200 });
    T('C', 420, 520, { f:'Montserrat', s:300, b:'800', c:'#ffffff', w:500 });
    T('Carbono', 420, 720, { f:'Montserrat', s:58, b:'700', c:'#ffffff', w:500 });
    T('12.011', 420, 800, { f:'Poppins', s:36, c:'#c7d2fe', w:500 });
    const datos = [['Grupo', '14'], ['Periodo', '2'], ['Tipo', 'No metal'], ['Estado', 'Sólido'], ['Configuración', '1s² 2s² 2p²'], ['Usos', 'Lápices, diamantes, base de la vida']];
    TL('Ficha del elemento', 820, 230, { f:'Montserrat', s:52, b:'800', c:TINTA_ESQ, w:900 });
    datos.forEach(([k, v], i) => { const y = 340 + i * 95; RECT(820, y - 38, 600, 76, i % 2 ? '#ffffff' : '#ede9fe', { r:12 });
      TL(k, 845, y, { f:'Montserrat', s:28, b:'700', c:'#5b21b6', w:260 }); TL(v, 1080, y, { f:'Poppins', s:28, c:TINTA_ESQ, w:330 }); });
    // modelo del átomo
    const ax = 1640, ay = 560;
    [[140, 0], [140, 60], [140, -60]].forEach(([r, a]) => { const e = new fabric.Ellipse({ left:ax, top:ay, rx:r, ry:r * 0.38, angle:a, originX:'center', originY:'center', fill:'rgba(0,0,0,0)', stroke:'#6366f1', strokeWidth:4, name:'Órbita', id:nuevoId() }); canvas.add(e); });
    CIRC(ax, ay, 30, '#f43f5e', { nombre:'Núcleo' });
    [[140, 0], [-70, 105], [-70, -105], [120, -70], [-130, 40], [40, 125]].forEach(([dx, dy]) => CIRC(ax + dx * 0.98, ay + dy * 0.4, 11, '#0ea5e9', { nombre:'Electrón' }));
    T('Modelo del átomo', ax, ay + 200, { f:'Poppins', s:26, c:GRIS_ESQ, w:300 });
  }},
  { nombre:'Formulario de matemáticas', tam:[1240, 1754], crear(){
    FONDO('#ffffff');
    FIG(rr(0, 0, 1240, 200, 0), null, { grad:['#4f46e5', '#7c3aed'], gradAng:0, nombre:'Encabezado' });
    T('FORMULARIO DE MATEMÁTICAS', 620, 85, { f:'Montserrat', s:54, b:'800', c:'#ffffff', w:1100 });
    T('Áreas · Perímetros · Pitágoras · Fórmula general', 620, 148, { f:'Poppins', s:26, c:'#e0e7ff', w:1100 });
    const cartas = [['Cuadrado', 'A = l²\nP = 4 · l', '#0ea5e9'], ['Rectángulo', 'A = b · h\nP = 2b + 2h', '#10b981'], ['Triángulo', 'A = (b · h) / 2\nP = a + b + c', '#f59e0b'], ['Círculo', 'A = π · r²\nP = 2 · π · r', '#ef4444']];
    cartas.forEach(([n, f, col], i) => {
      const x = 80 + (i % 2) * 560, y = 260 + Math.floor(i / 2) * 360;
      RECT(x, y, 520, 320, tinte(col, 0.1), { r:18, nombre:n });
      const cx = x + 120, cy = y + 175;
      if (i === 0) N_P(`M${cx - 70} ${cy - 70}h140v140h-140z`, { stroke:col, sw:6, nombre:'Cuadrado' });
      if (i === 1) N_P(`M${cx - 90} ${cy - 55}h180v110h-180z`, { stroke:col, sw:6, nombre:'Rectángulo' });
      if (i === 2) N_P(`M${cx - 85} ${cy + 65}L${cx + 85} ${cy + 65}L${cx - 10} ${cy - 85}Z`, { stroke:col, sw:6, nombre:'Triángulo' });
      if (i === 3){ N_P(circD(cx, cy, 80), { stroke:col, sw:6, nombre:'Círculo' }); LINEA(cx, cy, cx + 80, cy, col, 4); T('r', cx + 40, cy - 22, { f:'Playfair Display', s:34, it:true, c:col, w:60 }); }
      TL(n, x + 250, y + 70, { f:'Montserrat', s:36, b:'800', c:col, w:260 });
      TL(f, x + 250, y + 185, { f:'Playfair Display', s:38, it:true, c:TINTA_ESQ, w:270, lh:1.5 });
    });
    RECT(80, 1000, 1080, 300, '#eef2ff', { r:18, nombre:'Pitágoras' });
    TL('Teorema de Pitágoras', 120, 1060, { f:'Montserrat', s:38, b:'800', c:'#4f46e5', w:700 });
    N_P('M180 1250H460V1100Z', { stroke:'#4f46e5', sw:6, nombre:'Triángulo rectángulo' }); N_P('M430 1250V1220H460', { stroke:'#4f46e5', sw:4, nombre:'Ángulo recto' });
    T('a', 320, 1282, { f:'Playfair Display', s:38, it:true, c:'#4f46e5', w:60 }); T('b', 492, 1175, { f:'Playfair Display', s:38, it:true, c:'#4f46e5', w:60 }); T('c', 295, 1150, { f:'Playfair Display', s:38, it:true, c:'#4f46e5', w:60 });
    T('c² = a² + b²', 840, 1180, { f:'Playfair Display', s:72, it:true, c:TINTA_ESQ, w:560 });
    RECT(80, 1340, 1080, 300, '#fdf2f8', { r:18, nombre:'Fórmula general' });
    TL('Ecuación de segundo grado', 120, 1400, { f:'Montserrat', s:38, b:'800', c:'#db2777', w:800 });
    T('ax² + bx + c = 0', 620, 1480, { f:'Playfair Display', s:46, it:true, c:TINTA_ESQ, w:900 });
    T('x = ( −b ± √(b² − 4ac) ) / 2a', 620, 1570, { f:'Playfair Display', s:52, it:true, c:'#be185d', w:1000 });
    T('Agrega aquí más fórmulas de tu clase', 620, 1700, { f:'Poppins', s:24, c:GRIS_ESQ, w:1000, it:true });
  }},
  { nombre:'Problema resuelto paso a paso', tam:[1920, 1080], crear(){
    FONDO('#fefce8');
    CAB_ESQ('Resolvemos un problema', 'Datos → fórmula → sustitución → resultado', { y:80 });
    nodo('redondo', 'Problema: Un auto recorre 150 km en 2 horas. ¿A qué velocidad va?', 960, 250, { w:1600, h:110, anchoMax:1500, fill:'#ffffff', stroke:'#eab308', grosor:3, color:TINTA_ESQ, tam:32, fuente:'Poppins' });
    const cols = [['Datos', 'd = 150 km\nt = 2 h\nv = ?', '#0ea5e9'], ['Fórmula', 'v = d / t', '#8b5cf6'], ['Sustitución', 'v = 150 km / 2 h', '#f59e0b'], ['Resultado', 'v = 75 km/h', '#16a34a']];
    cols.forEach(([n, f, col], i) => {
      const x = 270 + i * 460;
      if (i) FLECHA_RECTA(x - 250, 640, x - 205, 640, '#94a3b8', 6);
      NUM_ESQ(String(i + 1), x - 140, 420, 70, col, 34);
      TL(n, x - 90, 420, { f:'Montserrat', s:38, b:'800', c:col, w:320 });
      nodo('redondo', f, x, 650, { w:390, h:330, anchoMax:350, fill:i === 3 ? col : '#ffffff', stroke:col, grosor:4, color:i === 3 ? '#ffffff' : TINTA_ESQ, tam:i === 3 ? 48 : 38, peso:i === 3 ? '800' : '600', fuente:'Poppins' });
    });
    T('Respuesta: el auto va a 75 kilómetros por hora.', 960, 960, { f:'Poppins', s:34, b:'600', c:'#166534', w:1600 });
  }},
  { nombre:'Plano cartesiano', tam:[1920, 1080], crear(){
    FONDO('#ffffff');
    const ox = 1250, oy = 540, u = 76;
    let d = ''; for (let i = -6; i <= 6; i++) d += `M${ox + i * u} ${oy - 6 * u}V${oy + 6 * u}`; for (let j = -6; j <= 6; j++) d += `M${ox - 6 * u} ${oy + j * u}H${ox + 6 * u}`;
    N_P(d, { stroke:'#e2e8f0', sw:2, nombre:'Cuadrícula' });
    FLECHA_RECTA(ox - 6.3 * u, oy, ox + 6.3 * u, oy, '#334155', 4); FLECHA_RECTA(ox, oy + 6.3 * u, ox, oy - 6.3 * u, '#334155', 4);
    for (let i = -6; i <= 6; i++){ if (!i) continue; T(String(i), ox + i * u, oy + 28, { f:'Poppins', s:20, c:GRIS_ESQ, w:50 }); T(String(-i), ox - 24, oy + i * u, { f:'Poppins', s:20, c:GRIS_ESQ, w:50 }); }
    T('x', ox + 6.6 * u, oy - 26, { f:'Playfair Display', s:36, it:true, c:'#334155', w:50 }); T('y', ox + 26, oy - 6.6 * u, { f:'Playfair Display', s:36, it:true, c:'#334155', w:50 });
    const f = x => 0.5 * x + 1;
    N_P(`M${ox - 6 * u} ${oy - f(-6) * u}L${ox + 6 * u} ${oy - f(6) * u}`, { stroke:'#ef4444', sw:6, nombre:'Recta y = ½x + 1' });
    [[0, 1, 'A(0, 1)'], [2, 2, 'B(2, 2)'], [-4, -1, 'C(−4, −1)']].forEach(([x, y, n]) => { CIRC(ox + x * u, oy - y * u, 11, '#1d4ed8'); T(n, ox + x * u + 60, oy - y * u - 28, { f:'Poppins', s:24, b:'700', c:'#1d4ed8', w:160 }); });
    TL('Plano cartesiano', 90, 120, { f:'Montserrat', s:60, b:'800', c:TINTA_ESQ, w:560 });
    TL('Función:  y = ½ x + 1', 90, 250, { f:'Playfair Display', s:40, it:true, c:'#ef4444', w:560 });
    TL('Pendiente:  m = ½', 90, 330, { f:'Poppins', s:30, c:TINTA_ESQ, w:560 });
    TL('Ordenada al origen:  b = 1', 90, 390, { f:'Poppins', s:30, c:TINTA_ESQ, w:560 });
    crearTabla(260, 640, 4, 2, { sep:4, rx:8, borde:'#cbd5e1', grosor:2, enc:['#1d4ed8', '#1d4ed8'], encTexto:'#ffffff', filasColores:['#eff6ff'], celda:'#ffffff', fuente:'Poppins', fuenteEnc:'Montserrat', anchos:[170, 170], alto:66, altoEnc:66, tam:26, tamEnc:28 },
      [['x', 'y'], ['−4', '−1'], ['0', '1'], ['2', '2']]);
    TL('Cambia la función y los puntos por los de tu ejercicio.', 90, 930, { f:'Poppins', s:24, c:GRIS_ESQ, w:560, it:true });
  }},
  { nombre:'Fracciones', tam:[1920, 1080], crear(){
    FONDO('#fff7ed');
    CAB_ESQ('Fracciones', 'La parte pintada de cada círculo');
    const fr = [[1, 2, 'un medio', '#f97316'], [1, 3, 'un tercio', '#0ea5e9'], [3, 4, 'tres cuartos', '#10b981'], [5, 8, 'cinco octavos', '#8b5cf6']];
    fr.forEach(([nu, de, nom, col], i) => {
      const cx = 300 + i * 440, cy = 480, r = 170;
      for (let k = 0; k < de; k++){ const a0 = -90 + k * 360 / de, a1 = a0 + 360 / de; FIG(`M${cx} ${cy}` + sectorD(cx, cy, 0.01, r, a0, a1).replace(/^M/, 'L'), k < nu ? col : '#ffffff', { stroke:'#334155', sw:3, nombre:'Parte ' + (k + 1) }); }
      T(String(nu), cx, 760, { f:'Montserrat', s:78, b:'800', c:col, w:200 }); LINEA(cx - 50, 815, cx + 50, 815, TINTA_ESQ, 6); T(String(de), cx, 870, { f:'Montserrat', s:78, b:'800', c:col, w:200 });
      T(nom, cx, 960, { f:'Poppins', s:30, c:GRIS_ESQ, w:380 });
    });
  }}
];

const PLANTILLAS_CART = [
  { nombre:'Cartel: feria de ciencias', tam:[1080, 1350], crear(){
    DEGRADADO('#1e3a8a', '#0ea5e9');
    N_ICO('cohete', 880, 260, 300, hexA('#ffffff', 0.25), { sw:1.2 }); N_ICO('foco', 160, 1110, 220, hexA('#ffffff', 0.18), { sw:1.2 }); N_ICO('engrane', 930, 1150, 200, hexA('#ffffff', 0.18), { sw:1.2 });
    N_PUNTOS(70, 90, 6, 3, 26, 4, '#bae6fd', 0.6);
    nodo('pildora', '7.ª edición', 230, 300, { w:260, h:70, fill:'#facc15', color:'#1e3a8a', tam:30, peso:'800', fuente:'Montserrat' });
    TL('FERIA DE\nCIENCIAS', 100, 520, { f:'Montserrat', s:130, b:'900', c:'#ffffff', w:900, lh:1 });
    TL('Experimentos, inventos y proyectos de todos los grupos', 100, 710, { f:'Poppins', s:36, c:'#e0f2fe', w:840 });
    INFO('Calendario', 'Viernes 21 de noviembre', 100, 860, '#ffffff', { colIcono:'#facc15' });
    INFO('Reloj', '9:00 a 14:00 h', 100, 950, '#ffffff', { colIcono:'#facc15' });
    INFO('Ubicación', 'Patio central de la escuela', 100, 1040, '#ffffff', { colIcono:'#facc15' });
    RECT(0, 1210, 1080, 140, '#facc15', { nombre:'Franja' });
    T('Inscribe tu proyecto con tu maestro', 540, 1280, { f:'Montserrat', s:40, b:'800', c:'#1e3a8a', w:1000 });
  }},
  { nombre:'Cartel: gran kermés', tam:[1080, 1350], crear(){
    FONDO('#fff7ed');
    PAPEL_PICADO(30, ['#ec4899', '#f97316', '#8b5cf6', '#10b981', '#0ea5e9', '#facc15'], 1080, 6);
    T('¡GRAN', 540, 340, { f:'Fredoka', s:110, b:'700', c:'#f97316', w:1000 });
    T('KERMÉS!', 540, 470, { f:'Fredoka', s:160, b:'700', c:'#db2777', w:1000 });
    T('Juegos · Comida · Música · Rifas', 540, 590, { f:'Poppins', s:38, b:'600', c:'#7c2d12', w:1000 });
    [['🎯', '#fde68a'], ['🌮', '#fbcfe8'], ['🎶', '#bfdbfe']].forEach(([e, f], i) => { const x = 250 + i * 290; CIRC(x, 760, 110, f); T(e, x, 765, { f:'Poppins', s:110, w:200 }); });
    INFO('Calendario', 'Sábado 15 de noviembre', 170, 970, '#7c2d12', { colIcono:'#db2777' });
    INFO('Reloj', 'De 10:00 a 15:00 h', 170, 1055, '#7c2d12', { colIcono:'#db2777' });
    INFO('Ubicación', 'Canchas de la escuela', 170, 1140, '#7c2d12', { colIcono:'#db2777' });
    T('¡Trae a toda tu familia!', 540, 1270, { f:'Fredoka', s:46, b:'700', c:'#f97316', w:1000 });
  }},
  { nombre:'Cartel: convocatoria a concurso', tam:[1080, 1350], crear(){
    FONDO('#ffffff');
    FIG(rr(0, 0, 1080, 360, 0), null, { grad:['#6d28d9', '#db2777'], gradAng:0, nombre:'Encabezado' });
    T('C O N V O C A T O R I A', 540, 100, { f:'Montserrat', s:30, b:'700', c:'#fbcfe8', w:1000 });
    T('Concurso de oratoria', 540, 200, { f:'Montserrat', s:78, b:'900', c:'#ffffff', w:1000 });
    T('Tema: «El futuro que queremos»', 540, 290, { f:'Poppins', s:34, c:'#f5d0fe', w:1000 });
    const sec = [['¿Quién puede participar?', 'Alumnas y alumnos de todos los grupos.'], ['Requisitos', 'Discurso de 3 a 5 minutos. Registro previo con tu maestro.'], ['Fechas importantes', 'Registro: hasta el 10 de noviembre · Final: 24 de noviembre.'], ['Premios', '1.º, 2.º y 3.º lugar: diploma y premio sorpresa.']];
    sec.forEach(([t, d], i) => { const y = 460 + i * 190; NUM_ESQ(String(i + 1), 120, y, 80, PAL_ESQ[(i + 5) % PAL_ESQ.length], 38);
      TL(t, 190, y - 25, { f:'Montserrat', s:36, b:'800', c:TINTA_ESQ, w:820 }); TL(d, 190, y + 30, { f:'Poppins', s:28, c:GRIS_ESQ, w:820 }); });
    RECT(0, 1240, 1080, 110, '#1f2937', { nombre:'Franja' });
    T('Informes: Dirección de la escuela', 540, 1295, { f:'Poppins', s:32, b:'600', c:'#ffffff', w:1000 });
  }},
  { nombre:'Cartel: concurso de ofrendas', tam:[1080, 1350], crear(){
    DEGRADADO('#2e1065', '#581c87');
    PAPEL_PICADO(20, ['#f97316', '#ec4899', '#a855f7', '#facc15', '#10b981'], 1080, 5);
    T('Concurso de', 540, 360, { f:'Lobster', s:80, c:'#fdba74', w:1000 });
    T('Ofrendas', 540, 470, { f:'Lobster', s:150, c:'#fb923c', w:1000 }).set('shadow', new fabric.Shadow({ color:'rgba(251,146,60,.6)', blur:30, offsetX:0, offsetY:0 }));
    T('Día de Muertos', 540, 590, { f:'Montserrat', s:46, b:'800', c:'#f5d0fe', w:1000, cs:120 });
    T('Honremos a nuestros seres queridos con una ofrenda tradicional por grupo.', 540, 700, { f:'Poppins', s:32, c:'#ede9fe', w:860, lh:1.35 });
    INFO('Calendario', 'Viernes 31 de octubre', 220, 850, '#ffffff', { colIcono:'#fb923c' });
    INFO('Reloj', 'Montaje: 8:00 h · Premiación: 13:00 h', 220, 935, '#ffffff', { colIcono:'#fb923c', s:30 });
    INFO('Ubicación', 'Pasillo principal', 220, 1020, '#ffffff', { colIcono:'#fb923c' });
    FLOR_CEMPA(110, 1250, 95); FLOR_CEMPA(260, 1300, 70); FLOR_CEMPA(970, 1250, 95); FLOR_CEMPA(820, 1300, 70);
    [[430, 1180], [540, 1160], [650, 1180]].forEach(([x, y]) => { RECT(x - 18, y, 36, 140, '#fef3c7', { r:6, nombre:'Vela' }); FIG(`M${x} ${y - 50}C${x + 22} ${y - 20} ${x + 14} ${y - 4} ${x} ${y - 2}C${x - 14} ${y - 4} ${x - 22} ${y - 20} ${x} ${y - 50}Z`, '#fbbf24', { nombre:'Llama' }); });
  }},
  { nombre:'Cartel: aviso a padres de familia', tam:[1080, 1350], crear(){
    FONDO('#f8fafc');
    RECT(0, 0, 1080, 300, '#1e3a8a', { nombre:'Encabezado' });
    T('Nombre de la escuela', 540, 80, { f:'Poppins', s:30, c:'#bfdbfe', w:1000 });
    T('AVISO', 540, 160, { f:'Montserrat', s:80, b:'900', c:'#ffffff', w:1000, cs:200 });
    T('Junta de padres de familia', 540, 245, { f:'Poppins', s:38, b:'600', c:'#e0e7ff', w:1000 });
    T('Se les invita a la reunión informativa del bimestre:', 540, 380, { f:'Poppins', s:32, c:TINTA_ESQ, w:940 });
    [['Calendario', 'Fecha', 'Lunes 17 de noviembre'], ['Reloj', 'Hora', '18:00 h'], ['Ubicación', 'Lugar', 'Salón de usos múltiples']].forEach(([ic, k, v], i) => {
      const x = 190 + i * 350; RECT(x - 150, 450, 300, 230, '#ffffff', { r:18, stroke:'#cbd5e1', sw:2 });
      ICONO(ic, x, 520, 64, '#1e3a8a'); T(k, x, 590, { f:'Montserrat', s:24, b:'700', c:GRIS_ESQ, w:280 }); T(v, x, 640, { f:'Poppins', s:28, b:'600', c:TINTA_ESQ, w:280 });
    });
    TL('Puntos a tratar', 90, 760, { f:'Montserrat', s:40, b:'800', c:'#1e3a8a', w:900 });
    ['Avance académico del grupo', 'Calendario de actividades', 'Asuntos generales'].forEach((t, i) => { NUM_ESQ(String(i + 1), 120, 850 + i * 85, 56, '#1e3a8a', 28); TL(t, 170, 850 + i * 85, { f:'Poppins', s:32, c:TINTA_ESQ, w:820 }); });
    T('Su asistencia es muy importante.', 540, 1150, { f:'Poppins', s:32, b:'600', c:'#1e3a8a', w:1000 });
    T('Atentamente, la Dirección', 540, 1240, { f:'Playfair Display', s:36, it:true, c:GRIS_ESQ, w:1000 });
  }},
  { nombre:'Cartel: torneo deportivo', tam:[1080, 1350], crear(){
    DEGRADADO('#14532d', '#16a34a');
    N_P('M80 80H1000V1270H80ZM80 675H1000M540 675m-150 0a150 150 0 1 0 300 0a150 150 0 1 0-300 0M340 80v180h400V80M340 1270v-180h400v180', { stroke:'#ffffff', sw:5, op:0.18, nombre:'Cancha' });
    const bal = CIRC(800, 330, 150, '#ffffff', { nombre:'Balón' }); bal.set({ stroke:'#111827', strokeWidth:6 });
    FIG('M800 270l57 41-22 67h-70l-22-67z', '#111827', { nombre:'Balón (dibujo)' });
    N_P('M800 270V180M857 311l85-28M835 378l52 72M765 378l-52 72M743 311l-85-28', { stroke:'#111827', sw:6, nombre:'Balón (líneas)' });
    TL('TORNEO\nINTERGRUPOS', 90, 560, { f:'Bebas Neue', s:170, b:'400', c:'#ffffff', w:950, lh:0.9 }).set('skewX', -6);
    TL('Fútbol · Básquetbol · Voleibol', 95, 760, { f:'Poppins', s:38, b:'600', c:'#bbf7d0', w:900 });
    INFO('Calendario', 'Del 3 al 7 de noviembre', 95, 880, '#ffffff', { colIcono:'#facc15' });
    INFO('Reloj', 'Durante el receso y a la salida', 95, 965, '#ffffff', { colIcono:'#facc15' });
    INFO('Ubicación', 'Canchas de la escuela', 95, 1050, '#ffffff', { colIcono:'#facc15' });
    nodo('pildora', '¡Inscribe a tu equipo!', 540, 1200, { w:640, h:100, fill:'#facc15', color:'#14532d', tam:42, peso:'800', fuente:'Montserrat' });
  }},
  { nombre:'Cartel: graduación', tam:[1080, 1350], crear(){
    DEGRADADO('#0b1437', '#1e3a8a');
    const rnd = azarN(9); for (let i = 0; i < 70; i++) RECT(rnd() * 1080, rnd() * 1350, 10 + rnd() * 10, 4 + rnd() * 6, ['#facc15', '#fde68a', '#ffffff'][i % 3], { ang:rnd() * 180, op:0.8, nombre:'Confeti' });
    ICONO('Birrete', 540, 330, 280, '#facc15');
    T('¡Felicidades,', 540, 560, { f:'Playfair Display', s:80, it:true, c:'#fde68a', w:1000 });
    T('graduados!', 540, 660, { f:'Playfair Display', s:100, it:true, b:'700', c:'#facc15', w:1000 });
    T('GENERACIÓN 2023 – 2026', 540, 780, { f:'Montserrat', s:40, b:'800', c:'#ffffff', w:1000, cs:150 });
    LINEA(240, 840, 840, 840, '#facc15', 3);
    T('Ceremonia de graduación', 540, 910, { f:'Poppins', s:34, b:'600', c:'#e0e7ff', w:1000 });
    T('Viernes 10 de julio · 17:00 h\nAuditorio de la escuela', 540, 1020, { f:'Poppins', s:34, c:'#ffffff', w:1000, lh:1.4 });
    T('Nombre de la escuela', 540, 1250, { f:'Montserrat', s:28, b:'700', c:'#93c5fd', w:1000 });
  }},
  { nombre:'Cartel: semana de la lectura', tam:[1080, 1350], crear(){
    FONDO('#fef3c7');
    CIRC(540, 360, 230, '#fde68a', { nombre:'Fondo del libro' });
    ICONO('Libro', 540, 360, 300, '#b45309');
    T('Semana de la', 540, 650, { f:'Playfair Display', s:70, it:true, c:'#92400e', w:1000 });
    T('LECTURA', 540, 750, { f:'Montserrat', s:110, b:'900', c:'#b45309', w:1000, cs:80 });
    T('«Un libro abierto es un cerebro que habla.»', 540, 850, { f:'Playfair Display', s:32, it:true, c:'#78350f', w:900 });
    ['Lectura en voz alta', 'Intercambio de libros', 'Cuentacuentos'].forEach((t, i) => { CIRC(260, 950 + i * 70, 12, '#b45309'); TL(t, 290, 950 + i * 70, { f:'Poppins', s:34, b:'600', c:'#78350f', w:700 }); });
    RECT(0, 1200, 1080, 150, '#b45309', { nombre:'Franja' });
    T('Del 20 al 24 de abril · Biblioteca escolar', 540, 1275, { f:'Poppins', s:36, b:'600', c:'#ffffff', w:1000 });
  }}
];
const FUENTES_CC = ['Montserrat', 'Poppins', 'Playfair Display', 'Fredoka', 'Lobster', 'Bebas Neue'];
function usarPlantillaCC(p){
  const fin = () => { FUENTES_CC.forEach(f => fabric.util.clearFabricFontCache(f)); usarOrganizador(p); };
  Promise.race([Promise.all(FUENTES_CC.flatMap(f => ['400', '600', '700', '800', '900'].map(b => document.fonts.load(`${b} 40px "${f}"`).catch(() => null)))), new Promise(r => setTimeout(r, 2500))]).then(fin, fin);
}
PLANTILLAS_CIEN.forEach(p => CATALOGO.push({ nombre:p.nombre, cat:CAT_CIEN, tam:p.tam, crear:p.crear, usar:() => usarPlantillaCC(p) }));
PLANTILLAS_CART.forEach(p => CATALOGO.push({ nombre:p.nombre, cat:CAT_CART, tam:p.tam, crear:p.crear, usar:() => usarPlantillaCC(p) }));
CATEGORIAS.splice(CATEGORIAS.indexOf(CAT_ESQ) + 1, 0, CAT_CIEN, CAT_CART);
(function(){
  const despues = [...document.querySelectorAll('#chipsCat .chip')].find(x => x.textContent.includes('Esquemas'));
  [[CAT_CART, '📣 Carteles escolares'], [CAT_CIEN, '🔬 Ciencias y mate']].forEach(([cat, txt]) => {
    const c = document.createElement('button'); c.className = 'chip'; c.textContent = txt;
    c.onclick = () => { catActiva = cat; document.querySelectorAll('#chipsCat .chip').forEach(x => x.classList.toggle('on', x === c)); renderCatalogo(); };
    if (despues) despues.after(c); else $('chipsCat').appendChild(c);
  });
})();

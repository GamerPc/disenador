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


/* =========================================================
   ACTIVIDADES ESCOLARES LISTAS (para que el maestro no empiece de cero)
   Cada una trae encabezado de Nombre / Grupo / Fecha, instrucciones y espacios por llenar.
   ========================================================= */
const CAT_ACT = 'Actividades escolares';
const ACT_C = { tinta:'#1f2937', suave:'#6b7280', linea:'#cbd5e1', acento:'#2563eb', fondo:'#ffffff', caja:'#f8fafc' };
// encabezado común: título, datos del alumno e instrucciones
function encabezadoActividad(titulo, instrucciones, o = {}){
  const w = W - 2 * (o.m || 70), x = o.m || 70;
  PON([uiR(0, 0, W, 12, o.acento || ACT_C.acento, { nombre:'Franja' }),
    uiT(titulo, x, 44, { w, s:o.s || 50, b:'800', f:'Poppins', c:ACT_C.tinta })]);
  const y = 44 + (o.s || 50) * 1.35 + 14;
  PON([uiT('Nombre: ________________________________', x, y, { w:w * 0.55, s:22, c:ACT_C.suave }),
    uiT('Grupo: _________', x + w * 0.56, y, { w:w * 0.2, s:22, c:ACT_C.suave }),
    uiT('Fecha: ___________', x + w * 0.77, y, { w:w * 0.23, s:22, c:ACT_C.suave, al:'right' })]);
  const yi = y + 48;
  PON([uiR(x, yi, w, 74, '#eff6ff', { r:12, borde:'#bfdbfe', nombre:'Instrucciones' }),
    uiT('Instrucciones: ' + instrucciones, x + 18, yi + 14, { w:w - 36, s:20, c:'#1e3a8a', lh:1.35 })]);
  return yi + 96;
}
function cajaRespuesta(x, y, w, h, titulo, ayuda, o = {}){
  PON([uiR(x, y, w, h, o.fill || ACT_C.caja, { r:14, borde:o.borde || ACT_C.linea, gb:2, nombre:'Espacio para responder' }),
    uiT(titulo, x + 20, y + 14, { w:w - 40, s:o.s || 25, b:'700', c:o.c || ACT_C.tinta }),
    uiT(ayuda, x + 20, y + 14 + (o.s || 25) * 1.4, { w:w - 40, s:19, c:'#9ca3af', lh:1.4 })]);
}
const PLANTILLAS_ACT = [
  { nombre:'Actividad: mapa conceptual por llenar', tam:[1920, 1080], crear(){
    FONDO(ACT_C.fondo);
    const y0 = encabezadoActividad('Mapa conceptual', 'completa cada recuadro con el concepto que corresponde y escribe una palabra de enlace en cada línea. Puedes agregar más recuadros.');
    const est = { stroke:'#1e3a8a', grosor:3, color:'#1e3a8a', tam:30, peso:'600', fill:'#eef2ff' };
    const raiz = nodo('redondo', 'Tema principal', 960, y0 + 70, { ...est, w:440, h:100, fill:'#1e3a8a', color:'#ffffff', tam:36, peso:'700' });
    const n2 = [380, 960, 1540].map((x, i) => nodo('redondo', 'Concepto ' + (i + 1), x, y0 + 330, { ...est, w:340, h:96 }));
    n2.forEach(n => unir(raiz, n, { etiqueta:'__________', color:'#334155', ancho:3 }));
    n2.forEach((n, i) => [-1, 1].forEach(lado => {
      const h = nodo('redondo', 'Ejemplo', (i === 0 ? 380 : i === 1 ? 960 : 1540) + lado * 180, y0 + 600, { ...est, w:300, h:90, fill:'#ffffff', tam:26 });
      unir(n, h, { etiqueta:'como', color:'#334155', ancho:3 });
    }));
  }},
  { nombre:'Actividad: línea del tiempo', tam:[1920, 1080], crear(){
    FONDO(ACT_C.fondo);
    const y0 = encabezadoActividad('Línea del tiempo', 'escribe en orden cinco acontecimientos importantes del tema: la fecha arriba y lo que pasó abajo.');
    const yl = y0 + 260, xs = [230, 595, 960, 1325, 1690];
    PON([uiR(140, yl - 4, 1640, 8, ACT_C.acento, { r:4, nombre:'Línea del tiempo' })]);
    xs.forEach((x, i) => {
      PON([uiC(x, yl, 22, i % 2 ? '#f59e0b' : ACT_C.acento, { nombre:'Punto' }),
        uiR(x - 120, yl - 130, 240, 80, '#eff6ff', { r:14, borde:'#bfdbfe', gb:2, nombre:'Fecha' }), uiT('Año / fecha', x - 120, yl - 106, { w:240, s:26, b:'700', c:'#1e3a8a', al:'center' }),
        uiR(x - 160, yl + 50, 320, 260, ACT_C.caja, { r:14, borde:ACT_C.linea, gb:2, nombre:'Acontecimiento' }),
        uiT('¿Qué pasó?', x - 140, yl + 66, { w:280, s:24, b:'700', c:ACT_C.tinta }), uiT('Descríbelo en dos o tres líneas…', x - 140, yl + 104, { w:280, s:19, c:'#9ca3af', lh:1.4 })]);
    });
  }},
  { nombre:'Actividad: análisis de caso jurídico', tam:[1275, 1650], crear(){
    FONDO(ACT_C.fondo);
    const y0 = encabezadoActividad('Análisis de caso', 'lee el caso y llena cada apartado con tus propias palabras. Cita los artículos que uses.', { s:46, acento:'#0f2747' });
    const sec = [['1. Hechos relevantes', '¿Qué pasó? ¿Quiénes participan? ¿Cuándo y dónde?', 230], ['2. Problema jurídico', '¿Qué se tiene que resolver? Escríbelo como pregunta.', 170],
      ['3. Fundamento legal', 'Artículos, leyes, tesis o jurisprudencia que aplican.', 210], ['4. Argumentación', 'Relaciona los hechos con las normas: ¿por qué aplican o no?', 300],
      ['5. Conclusión', '¿Cómo debería resolverse y por qué?', 200]];
    let y = y0;
    sec.forEach(([t, a, h]) => { cajaRespuesta(70, y, W - 140, h, t, a, { c:'#0f2747' }); y += h + 18; });
  }},
  { nombre:'Actividad: cuadro comparativo', tam:[1920, 1080], crear(){
    FONDO(ACT_C.fondo);
    const y0 = encabezadoActividad('Cuadro comparativo', 'compara los tres temas en cada aspecto. Escribe frases cortas y claras.');
    crearTabla(960, y0 + (H - y0) / 2 - 10, 5, 4, { ...ESTILOS_TABLA['Clásica'], anchos:[330, 470, 470, 470], alto:118, tam:24, tamEnc:28 },
      [['Aspecto', 'Tema 1', 'Tema 2', 'Tema 3'], ['Definición'], ['Características'], ['Ejemplo'], ['Diferencia principal']]);
  }},
  { nombre:'Actividad: reporte de lectura', tam:[1275, 1650], crear(){
    FONDO(ACT_C.fondo);
    const y0 = encabezadoActividad('Reporte de lectura', 'después de leer el texto, completa cada apartado. Usa tus propias palabras.', { s:46, acento:'#16a34a' });
    PON([uiT('Título de la lectura: _____________________________________', 70, y0, { w:W - 140, s:22, c:ACT_C.tinta }),
      uiT('Autor(a): ___________________________   Páginas: ________', 70, y0 + 40, { w:W - 140, s:22, c:ACT_C.tinta })]);
    let y = y0 + 96;
    [['Resumen', 'Cuenta de qué trata en 5 a 8 líneas.', 300], ['Ideas principales', '1.\n2.\n3.', 250], ['Lo que más me llamó la atención', 'Una frase, un dato o una idea, y por qué.', 210],
     ['Mi opinión', '¿Estás de acuerdo con el autor? ¿Por qué?', 200], ['Palabras nuevas', 'Palabra: significado', 150]].forEach(([t, a, h]) => { cajaRespuesta(70, y, W - 140, h, t, a, { c:'#166534' }); y += h + 16; });
  }},
  { nombre:'Actividad: autoevaluación con rúbrica', tam:[1275, 1650], crear(){
    FONDO(ACT_C.fondo);
    const y0 = encabezadoActividad('Autoevaluación', 'marca con una ✓ el nivel que alcanzaste en cada criterio y explica por qué al final.', { s:46, acento:'#7c3aed' });
    crearTabla(W / 2, y0 + 330, 6, 5, { ...ESTILOS_TABLA['Tarjetas'], anchos:[350, 190, 190, 190, 190], alto:100, tam:21, tamEnc:22 },
      [['Criterio', 'Excelente (4)', 'Bien (3)', 'Regular (2)', 'Por mejorar (1)'], ['Contenido completo y correcto'], ['Organización y claridad'], ['Diseño y presentación'], ['Ortografía y redacción'], ['Entrega a tiempo']]);
    cajaRespuesta(70, y0 + 690, W - 140, 260, '¿Qué hice bien y qué puedo mejorar?', 'Escribe dos cosas que hiciste bien y una que mejorarías la próxima vez.', { c:'#5b21b6' });
    PON([uiT('Mi calificación: ______ / 20', 70, y0 + 980, { w:W - 140, s:28, b:'700', c:'#5b21b6', al:'right' })]);
  }}
];
PLANTILLAS_ACT.forEach(p => CATALOGO.push({ nombre:p.nombre, cat:CAT_ACT, tam:p.tam, crear:p.crear, usar:() => usarPlantillaLogo(p) }));
CATEGORIAS.splice(Math.max(0, CATEGORIAS.indexOf(CAT_DER)), 0, CAT_ACT);
(function(){
  const c = document.createElement('button'); c.className = 'chip'; c.textContent = '📚 Actividades';
  c.onclick = () => { catActiva = CAT_ACT; document.querySelectorAll('#chipsCat .chip').forEach(x => x.classList.toggle('on', x === c)); renderCatalogo(); };
  const ref = [...document.querySelectorAll('#chipsCat .chip')].find(x => x.textContent.includes('Derecho'));
  if (ref) ref.before(c); else $('chipsCat').appendChild(c);
  renderCatalogo();
})();

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


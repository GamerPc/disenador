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


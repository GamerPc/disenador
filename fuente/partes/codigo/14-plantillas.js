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


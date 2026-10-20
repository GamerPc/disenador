/* =========================================================
   DE IMAGEN A DIAGRAMA EDITABLE (con IA)
   Subes una foto o captura de un diagrama, mapa mental, línea del tiempo o cuadro,
   la IA lee sus cajas, textos, colores y flechas, y aquí se arma con piezas editables
   (formas con texto, textos, líneas y conectores) en la misma posición.
   Usa la clave de Gemini del asistente (o la IA de Chrome si acepta imágenes).
   ========================================================= */
const ESQUEMA_DIAGRAMA = {
  type:'OBJECT',
  properties:{
    fondo:{ type:'STRING', description:'color de fondo de la imagen en #rrggbb' },
    elementos:{ type:'ARRAY', items:{ type:'OBJECT', properties:{
      id:{ type:'STRING' },
      tipo:{ type:'STRING', enum:['caja', 'circulo', 'elipse', 'rombo', 'pildora', 'texto', 'linea', 'flecha'] },
      caja:{ type:'ARRAY', items:{ type:'INTEGER' }, description:'[ymin, xmin, ymax, xmax] de 0 a 1000' },
      puntos:{ type:'ARRAY', items:{ type:'INTEGER' }, description:'solo linea/flecha: [y1, x1, y2, x2] de 0 a 1000' },
      texto:{ type:'STRING' },
      relleno:{ type:'STRING', description:'#rrggbb o "ninguno"' },
      borde:{ type:'STRING', description:'#rrggbb o "ninguno"' },
      grosor:{ type:'NUMBER', description:'grosor del borde o de la línea, en unidades 0-1000 del ancho' },
      radio:{ type:'NUMBER', description:'redondeo de esquinas, en unidades 0-1000 del ancho' },
      colorTexto:{ type:'STRING' },
      alturaLetra:{ type:'NUMBER', description:'altura de UNA línea de ese texto, en unidades 0-1000 de la altura de la imagen' },
      negrita:{ type:'BOOLEAN' }, cursiva:{ type:'BOOLEAN' }, mayusculas:{ type:'BOOLEAN' },
      alinear:{ type:'STRING', enum:['izquierda', 'centro', 'derecha'] },
      letra:{ type:'STRING', enum:['sans', 'serif', 'mano', 'mono', 'gruesa'] },
      punteada:{ type:'BOOLEAN' }, flechaInicio:{ type:'BOOLEAN' }, flechaFin:{ type:'BOOLEAN' }
    }, required:['id', 'tipo'] } },
    conexiones:{ type:'ARRAY', items:{ type:'OBJECT', properties:{
      de:{ type:'STRING' }, a:{ type:'STRING' }, flecha:{ type:'BOOLEAN' }, color:{ type:'STRING' }, punteada:{ type:'BOOLEAN' },
      estilo:{ type:'STRING', enum:['recta', 'codo', 'curva'] }, etiqueta:{ type:'STRING' }
    }, required:['de', 'a'] } }
  },
  required:['elementos']
};
const PROMPT_DIAGRAMA = `Eres un experto en diseño gráfico. Analiza esta imagen de un diagrama (mapa mental, mapa conceptual, línea del tiempo, organigrama, cuadro comparativo, infografía, etc.) y descríbela COMPLETA para reconstruirla idéntica en un editor.
Reglas:
- Coordenadas normalizadas de 0 a 1000: x respecto al ANCHO, y respecto al ALTO de la imagen. "caja" es [ymin, xmin, ymax, xmax].
- Cada recuadro, tarjeta, círculo, rombo o etiqueta con fondo o borde es un elemento (tipo caja, circulo, elipse, rombo o pildora) con su texto ADENTRO en "texto". No repitas ese texto como elemento aparte.
- Los textos sueltos (títulos, subtítulos, notas, fechas) son tipo "texto" con su caja ajustada al texto.
- Copia los textos EXACTAMENTE, letra por letra, con acentos, mayúsculas y saltos de línea (\\n) como se ven. No resumas ni traduzcas.
- Colores reales en #rrggbb. Si no tiene relleno o borde, pon "ninguno".
- Líneas y flechas que no unen dos elementos: tipo "linea" o "flecha" con "puntos". Las que unen dos elementos van en "conexiones" (de, a = id de los elementos).
- alturaLetra: altura de una línea de texto en unidades 0-1000 de la altura de la imagen.
- Ordena los elementos de atrás hacia adelante (primero los fondos grandes).
- No inventes nada que no esté en la imagen.`;

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
    const t = await conTiempo(s.prompt([{ role:'user', content:[{ type:'text', value:PROMPT_DIAGRAMA + '\nResponde solo con JSON con las claves fondo, elementos y conexiones.' }, { type:'image', value:blob }] }]), 150000);
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
  if (!d || !Array.isArray(d.elementos) || !d.elementos.length) throw new Error('La IA no encontró elementos en la imagen.');
  return d;
}
// ---------- armar el diagrama con piezas del Diseñador ----------
const colorIA = (v, def) => typeof v === 'string' && /^#?[0-9a-f]{3,8}$/i.test(v.trim()) ? (v.trim()[0] === '#' ? v.trim() : '#' + v.trim()) : def;
const sinColor = v => !v || /ningun|none|transparent/i.test(String(v));
const FUENTE_IA = { sans:'Inter', serif:'Georgia', mano:'Patrick Hand', mono:'Courier New', gruesa:'Montserrat' };
function construirDiagramaIA(d, img, op = {}){
  // dónde va: si el diseño está vacío, la página toma la forma de la imagen; si no, se agrega una página nueva
  const vacio = !canvas.getObjects().some(o => !o.esFondo);
  if (vacio){
    const largo = 1600, k = largo / Math.max(img.w, img.h);
    cambiarTamano(Math.round(img.w * k), Math.round(img.h * k));
  } else agregarPagina();
  const margen = vacio ? 0 : Math.min(W, H) * 0.04;
  const escala = Math.min((W - 2 * margen) / img.w, (H - 2 * margen) / img.h);
  const aw = img.w * escala, ah = img.h * escala, ox = (W - aw) / 2, oy = (H - ah) / 2;
  const X = v => ox + (+v || 0) / 1000 * aw, Y = v => oy + (+v || 0) / 1000 * ah, LX = v => (+v || 0) / 1000 * aw, LY = v => (+v || 0) / 1000 * ah;
  const caja = e => { const c = Array.isArray(e.caja) && e.caja.length === 4 ? e.caja : null; if (!c) return null;
    const [y1, x1, y2, x2] = c; return { x:X(Math.min(x1, x2)), y:Y(Math.min(y1, y2)), w:Math.max(4, LX(Math.abs(x2 - x1))), h:Math.max(4, LY(Math.abs(y2 - y1))) }; };
  const tamLetra = e => Math.max(8, Math.min(400, LY(e.alturaLetra || 22) / 1.18));
  const alinea = e => ({ izquierda:'left', derecha:'right' }[e.alinear] || 'center');
  restaurando = true;
  const fondo = colorIA(d.fondo, null);
  if (op.colores !== false && fondo && typeof FONDO === 'function'){ try { FONDO(fondo); } catch (e) {} }
  // imagen original atrás como guía
  if (op.guia){
    fabric.Image.fromURL(img.url, im => {
      im.set({ left:ox, top:oy, scaleX:aw / im.width, scaleY:ah / im.height, opacity:0.3, name:'Imagen de referencia (bórrala al terminar)', id:nuevoId() });
      bloquear(im, true); canvas.add(im);
      const n = canvas.getObjects().filter(o => o.esFondo).length; canvas.moveTo(im, n);
      canvas.requestRenderAll(); renderCapas();
    });
  }
  const porIA = {}, creados = [];
  let n = 0;
  (d.elementos || []).forEach(e => {
    try {
      const tipo = e.tipo || 'caja';
      if (tipo === 'linea' || tipo === 'flecha'){
        const p = Array.isArray(e.puntos) && e.puntos.length === 4 ? e.puntos : (Array.isArray(e.caja) && e.caja.length === 4 ? e.caja : null); if (!p) return;
        const [y1, x1, y2, x2] = p, color = op.colores === false ? '#1f2330' : colorIA(e.borde, colorIA(e.relleno, '#1f2330'));
        const g = Math.max(1, LX(e.grosor || 3));
        const c = new fabric.Conector([0, 0, 1, 1], { stroke:color, strokeWidth:g, strokeLineCap:'round', estilo:'recta',
          inicio:e.flechaInicio ? 'flecha' : 'nada', fin:(tipo === 'flecha' || e.flechaFin) ? 'flecha' : 'nada', patron:e.punteada ? 'guiones' : 'solida',
          etiqueta:'', libreA:{ x:X(x1), y:Y(y1) }, libreB:{ x:X(x2), y:Y(y2) }, conA:null, conB:null, objectCaching:false, perPixelTargetFind:true,
          hasControls:false, id:nuevoId(), name:tipo === 'flecha' ? 'Flecha' : 'Línea' });
        actualizarConector(c); canvas.add(c); creados.push(c); n++; return;
      }
      const r = caja(e); if (!r) return;
      const texto = e.texto != null ? String(e.texto) : '';
      const colTexto = op.colores === false ? '#1f2330' : colorIA(e.colorTexto, null);
      const estTexto = { fontSize:tamLetra(e), fontWeight:e.negrita ? '700' : '400', fontStyle:e.cursiva ? 'italic' : 'normal', fontFamily:FUENTE_IA[e.letra] || 'Inter' };
      if (tipo === 'texto'){
        if (!texto.trim()) return;
        const ancho = Math.max(r.w * 1.12, 20), al = alinea(e), dx = al === 'center' ? (ancho - r.w) / 2 : al === 'right' ? ancho - r.w : 0;
        const t = new fabric.Textbox(e.mayusculas ? texto.toUpperCase() : texto, { left:r.x - dx, top:r.y, width:ancho, ...estTexto,
          fill:colTexto || '#1f2330', textAlign:alinea(e), lineHeight:1.15, id:nuevoId(), name:'Texto' });
        canvas.add(t); porIA[e.id] = t; creados.push(t); n++; return;
      }
      const forma = { caja:'proceso', circulo:'circulo', elipse:'elipse', rombo:'rombo', pildora:'pildora' }[tipo] || 'proceso';
      const relleno = op.colores === false ? '#ffffff' : (sinColor(e.relleno) ? 'rgba(0,0,0,0)' : colorIA(e.relleno, '#ffffff'));
      const borde = op.colores === false ? '#1f2330' : (sinColor(e.borde) ? null : colorIA(e.borde, null));
      const w = forma === 'circulo' ? Math.max(r.w, r.h) : r.w, h = forma === 'circulo' ? w : r.h;
      const txt = texto.trim() ? (e.mayusculas ? texto.toUpperCase() : texto) : null;
      // formas chicas (números en círculos, viñetas…): el texto va encima sin agrandar la forma
      const chica = txt && Math.min(w, h) < 2 * PAD() + estTexto.fontSize * 1.6;
      const f = nodo(forma, chica ? null : txt, r.x + r.w / 2, r.y + r.h / 2, {
        w, h, fill:relleno, stroke:borde, grosor:Math.max(1, LX(e.grosor || 2)), tam:estTexto.fontSize, peso:estTexto.fontWeight,
        color:colTexto || (esOscuro(relleno) ? '#ffffff' : '#1f2330'), fuente:estTexto.fontFamily, anchoMax:Math.max(40, w - 2 * PAD()) , nombre:'Caja'
      });
      if (forma === 'proceso' && e.radio){ const rr = Math.min(LX(e.radio), Math.min(w, h) / 2); f.set({ rx:rr, ry:rr }); }
      const t = porId(f.formaTexto);
      if (t){
        t.set({ textAlign:alinea(e), fontStyle:estTexto.fontStyle }); t.initDimensions && t.initDimensions();
        ajustarFormaATexto(t);
      }
      if (chica){
        const tc = new fabric.Textbox(txt, { width:Math.max(w, estTexto.fontSize * 1.2), ...estTexto, fill:colTexto || (esOscuro(relleno) ? '#ffffff' : '#1f2330'),
          textAlign:'center', lineHeight:1.05, originX:'center', originY:'center', left:r.x + r.w / 2, top:r.y + r.h / 2, id:nuevoId(), name:'Texto' });
        canvas.add(tc);
      }
      porIA[e.id] = f; creados.push(f); n++;
    } catch (er) { console.warn('Elemento de la IA que no se pudo armar', e, er); }
  });
  (d.conexiones || []).forEach(k => {
    const a = porIA[k.de], b = porIA[k.a]; if (!a || !b || a === b) return;
    try {
      unir(a, b, { estilo:k.estilo || 'recta', flecha:k.flecha !== false, color:op.colores === false ? '#1f2330' : colorIA(k.color, '#1f2330'),
        punteada:!!k.punteada, etiqueta:k.etiqueta || '', ancho:Math.max(2, 3 * s()) });
      n++;
    } catch (er) {}
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
      <div class="filaBusca"><input id="idClave" class="buscador" type="password" autocomplete="off" placeholder="Pega tu clave (empieza con AIza…)"><button class="pb" id="idGuardarClave">Guardar</button></div></div>
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
  $('idClave').addEventListener('keydown', e => e.stopPropagation());
  $('idGuardarClave').onclick = () => {
    const k = $('idClave').value.trim(); if (!/^AIza[\w-]{20,}$/.test(k)) return toast('Esa no parece una clave de Gemini (empieza con AIza…)');
    guardarLS(IA_CLAVE, k); $('idClave').value = ''; $('idSinIA').hidden = true; $('idEstado').textContent = '✓ Clave guardada. Toca «Convertir en diagrama».'; toast('Clave guardada. Ya puedes convertir.');
  };
  $('idConvertir').onclick = async () => {
    if (!img){ toast('Primero elige o pega una imagen'); return; }
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

/* =========================================================
   ASISTENTE DE ESCRITURA CON IA
   1) Usa la IA que ya trae Chrome (gratis, funciona en tu computadora, el texto no sale de ella).
   2) Si tu navegador no la tiene, puedes poner tu propia clave gratuita de Google Gemini (se guarda solo en este navegador).
   ========================================================= */
const ACCIONES_IA = [
  { id:'mejorar', ico:'✨', nombre:'Mejorar redacción', pide:'Corrige la ortografía, la puntuación y la redacción del siguiente texto para que suene claro y natural. Conserva el idioma, el sentido y una extensión parecida.' },
  { id:'formal', ico:'🎩', nombre:'Más formal', pide:'Reescribe el siguiente texto con un tono formal y profesional, adecuado para la escuela o el trabajo. Conserva el sentido.' },
  { id:'sencillo', ico:'😊', nombre:'Más sencillo', pide:'Reescribe el siguiente texto con palabras sencillas y frases cortas, fácil de entender para cualquier persona. Conserva el sentido.' },
  { id:'corto', ico:'✂', nombre:'Más corto', pide:'Resume el siguiente texto en la mitad de palabras o menos, sin perder la idea principal.' },
  { id:'largo', ico:'➕', nombre:'Desarrollar más', pide:'Desarrolla el siguiente texto con un poco más de detalle y ejemplos, en un máximo del doble de extensión.' },
  { id:'puntos', ico:'•', nombre:'En viñetas', pide:'Convierte el siguiente texto en una lista de 3 a 6 viñetas cortas (una por renglón, empezando con «• »).' },
  { id:'juridico', ico:'⚖', nombre:'Lenguaje jurídico', pide:'Reescribe el siguiente texto con lenguaje jurídico mexicano formal y preciso, sin inventar artículos ni leyes que no se mencionen.' },
  { id:'titulos', ico:'💡', nombre:'Ideas de título', pide:'Propón 5 títulos atractivos y cortos (máximo 8 palabras cada uno) para una presentación o diseño sobre el siguiente texto. Escribe uno por renglón, sin números ni comillas.', opciones:true },
  { id:'ingles', ico:'🌐', nombre:'Traducir al inglés', pide:'Traduce el siguiente texto al inglés de forma natural.' }
];
const IA_CLAVE = 'disenador_gemini_clave', IA_MODELO = 'disenador_gemini_modelo';
const leerLS = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
const guardarLS = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} };
async function iaDisponible(){
  try { if ('LanguageModel' in self){ const a = await LanguageModel.availability({ expectedInputs:[{ type:'text', languages:['es'] }], expectedOutputs:[{ type:'text', languages:['es'] }] }); if (a && a !== 'unavailable') return { tipo:'chrome', estado:a }; } } catch (e) {}
  if (leerLS(IA_CLAVE)) return { tipo:'gemini' };
  return null;
}
let sesionIA = null;
async function pedirIA(texto, instruccion, alProgreso){
  const fuente = await iaDisponible();
  if (!fuente) throw new Error('SIN_IA');
  const prompt = instruccion + '\nResponde solo con el resultado, sin explicaciones ni comillas.\n\nTexto:\n' + texto;
  if (fuente.tipo === 'chrome'){
    if (!sesionIA) sesionIA = await LanguageModel.create({
      initialPrompts:[{ role:'system', content:'Eres un asistente de redacción en español de México para estudiantes y pequeños negocios. Respondes solo con el texto pedido.' }],
      expectedInputs:[{ type:'text', languages:['es'] }], expectedOutputs:[{ type:'text', languages:['es'] }],
      monitor(m){ m.addEventListener('downloadprogress', e => alProgreso && alProgreso(e.loaded)); }
    });
    const s = await sesionIA.clone();
    try { return (await s.prompt(prompt)).trim(); } finally { s.destroy && s.destroy(); }
  }
  const modelo = leerLS(IA_MODELO) || 'gemini-flash-latest';
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelo) + ':generateContent', {
    method:'POST', headers:{ 'Content-Type':'application/json', 'x-goog-api-key':leerLS(IA_CLAVE) },
    body:JSON.stringify({ contents:[{ role:'user', parts:[{ text:prompt }] }], generationConfig:{ temperature:0.7, maxOutputTokens:1024 } })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(r.status === 400 || r.status === 403 ? 'La clave de Gemini no es válida o no tiene permiso.' : r.status === 429 ? 'Se acabó el límite gratuito por ahora. Intenta en unos minutos.' : (d.error && d.error.message) || ('Error ' + r.status));
  const t = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts && d.candidates[0].content.parts.map(p => p.text || '').join('');
  if (!t) throw new Error('La IA no devolvió texto. Prueba de nuevo.');
  return t.trim().replace(/^["«“]|["»”]$/g, '');
}
function textoParaIA(){ const t = typeof textoUnico === 'function' ? textoUnico() : null; return t && esTexto(t) ? t : null; }
(function(){
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'mAsistente';
  m.innerHTML = `<div class="caja" style="width:min(620px,96vw)"><h3>✨ Asistente de escritura</h3>
    <div id="iaEstado" class="hint" style="padding-top:0"></div>
    <label class="hint" for="iaTexto" style="display:block;padding:4px 0">Tu texto</label><textarea id="iaTexto" rows="4" style="width:100%;box-sizing:border-box"></textarea>
    <div id="iaAcciones" class="gridComp" style="grid-template-columns:repeat(3,1fr);margin:10px 0"></div>
    <details style="margin:4px 0 10px"><summary class="hint" style="cursor:pointer">✍ Escribir algo nuevo a partir de una idea</summary>
      <div class="filaBusca" style="margin-top:6px"><input id="iaIdea" class="buscador" placeholder="Ej. invitación para la feria de ciencias del viernes"><button class="pb" id="iaEscribir">Escribir</button></div></details>
    <div id="iaResultado" hidden><label class="hint" style="display:block;padding:4px 0">Propuesta (puedes corregirla antes de usarla)</label>
      <textarea id="iaSalida" rows="5" style="width:100%;box-sizing:border-box"></textarea><div id="iaOpciones" class="escLista" style="display:flex;flex-direction:column;gap:6px"></div>
      <div class="grupoBtns" style="margin-top:8px"><button class="btnP" id="iaUsar">✓ Reemplazar el texto</button><button class="pb" id="iaNuevo">＋ Agregar como texto nuevo</button><button class="pb" id="iaCopiar">Copiar</button></div></div>
    <details id="iaConfig" style="margin-top:12px"><summary class="hint" style="cursor:pointer">⚙ Usar mi propia clave de Google Gemini (si tu navegador no trae IA)</summary>
      <p class="hint" style="font-size:12px">Créala gratis en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> y pégala aquí. Se guarda <b>solo en este navegador</b>; no la compartas ni la uses en computadoras públicas. El texto que mandes se procesa en los servidores de Google.</p>
      <div class="filaBusca"><input id="iaClave" class="buscador" type="password" autocomplete="off" placeholder="Pega tu clave (empieza con AIza…)"><button class="pb" id="iaGuardarClave">Guardar</button></div>
      <div class="filaBusca"><input id="iaModelo" class="buscador" placeholder="Modelo (opcional): gemini-flash-latest"><button class="pb" id="iaBorrarClave">Quitar clave</button></div></details>
    <div class="acciones"><button class="btnS" onclick="cerrarModal('mAsistente')">Cerrar</button></div></div>`;
  document.body.appendChild(m);
  ACCIONES_IA.forEach(a => { const b = document.createElement('button'); b.className = 'pb'; b.textContent = a.ico + ' ' + a.nombre; b.onclick = () => ejecutarIA(a); $('iaAcciones').appendChild(b); });
  ['iaTexto', 'iaSalida', 'iaIdea', 'iaClave', 'iaModelo'].forEach(id => $(id).addEventListener('keydown', e => e.stopPropagation()));
  $('iaGuardarClave').onclick = () => { const k = $('iaClave').value.trim(); if (!/^AIza[\w-]{20,}$/.test(k)) return toast('Esa no parece una clave de Gemini (empieza con AIza…)'); guardarLS(IA_CLAVE, k); guardarLS(IA_MODELO, $('iaModelo').value.trim()); $('iaClave').value = ''; toast('Clave guardada en este navegador'); estadoIA(); };
  $('iaBorrarClave').onclick = () => { guardarLS(IA_CLAVE, ''); guardarLS(IA_MODELO, ''); toast('Clave quitada'); estadoIA(); };
  $('iaEscribir').onclick = () => { const idea = $('iaIdea').value.trim(); if (!idea) return toast('Escribe tu idea'); ejecutarIA({ id:'nuevo', nombre:'Escribir', pide:'Escribe un texto breve (máximo 60 palabras), claro y atractivo, para un diseño sobre esta idea. Si es un anuncio, incluye un llamado a la acción.' }, idea); };
  $('iaCopiar').onclick = () => { navigator.clipboard && navigator.clipboard.writeText($('iaSalida').value).then(() => toast('Copiado')); };
  $('iaUsar').onclick = () => {
    const t = textoParaIA(), v = $('iaSalida').value; if (!v.trim()) return;
    if (!t) return $('iaNuevo').onclick();
    t.set('text', v); t.initDimensions && t.initDimensions();
    if (t.textoDe && typeof ajustarFormaATexto === 'function') ajustarFormaATexto(t);
    t.setCoords(); t.dirty = true; canvas.requestRenderAll(); actualizarPanel(); guardarEstado(); cerrarModal('mAsistente'); toast('Texto reemplazado. Si no te gusta, deshaz con Ctrl+Z.');
  };
  $('iaNuevo').onclick = () => {
    const v = $('iaSalida').value; if (!v.trim()) return;
    const t = new fabric.Textbox(v, { left:W / 2, top:H / 2, originX:'center', originY:'center', width:Math.min(W * 0.7, 900), fontSize:Math.round(Math.min(W, H) / 28), fontFamily:'Inter', fill:'#111827', name:'Texto' });
    agregar(t, 'Texto'); renderCapas(); guardarEstado(); cerrarModal('mAsistente'); toast('Texto agregado');
  };
})();
async function estadoIA(){
  const f = await iaDisponible();
  $('iaEstado').innerHTML = f ? (f.tipo === 'chrome' ? '🟢 Usando la IA de tu navegador (gratis; tu texto no sale de tu computadora).' + (f.estado !== 'available' ? ' La primera vez se descarga; puede tardar unos minutos.' : '') : '🟢 Usando tu clave de Google Gemini.')
    : '⚪ Tu navegador no trae IA integrada. Usa Chrome de computadora actualizado, o pon tu clave gratuita de Gemini abajo (⚙).';
  if (!f) $('iaConfig').open = true;
}
function abrirAsistente(){
  const t = textoParaIA();
  $('iaTexto').value = t ? t.text : '';
  $('iaResultado').hidden = true; $('iaUsar').hidden = !t;
  abrirModal('mAsistente'); estadoIA();
  if (!t) setTimeout(() => $('iaIdea').closest('details').open = true, 0);
}
async function ejecutarIA(a, entrada){
  const texto = entrada || $('iaTexto').value.trim();
  if (!texto) return toast('Escribe o selecciona un texto primero');
  cargando(true);
  try {
    const r = await pedirIA(texto, a.pide, p => { const c = $('cargando'); if (c) c.textContent = 'Preparando la IA… ' + Math.round(p * 100) + '%'; });
    $('iaResultado').hidden = false; $('iaOpciones').innerHTML = '';
    if (a.opciones){
      const ops = r.split('\n').map(x => x.replace(/^[\s\-•*\d.)]+/, '').replace(/^["«“]|["»”]$/g, '').trim()).filter(Boolean).slice(0, 6);
      $('iaSalida').value = ops[0] || r;
      ops.forEach(o => { const b = document.createElement('button'); b.className = 'pb'; b.style.textAlign = 'left'; b.textContent = o; b.onclick = () => { $('iaSalida').value = o; }; $('iaOpciones').appendChild(b); });
    } else $('iaSalida').value = r;
    $('iaUsar').hidden = !textoParaIA() || a.id === 'nuevo';
    $('iaSalida').focus();
  } catch (e) {
    if (e.message === 'SIN_IA'){ estadoIA(); toast('Para usar el asistente, abre el Diseñador en Chrome actualizado o pon tu clave de Gemini (⚙).'); }
    else toast('El asistente no pudo responder: ' + e.message);
  } finally { cargando(false); const c = $('cargando'); if (c) c.textContent = 'Procesando…'; }
}

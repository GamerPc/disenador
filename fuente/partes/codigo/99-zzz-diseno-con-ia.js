/* =========================================================
   DISEÑO COMPLETO CON IA
   Escribes lo que necesitas («cartel de la feria de ciencias de 2.º A, viernes 5 a las 10…»)
   y la IA escribe el contenido: título, subtítulo, texto, puntos, datos y llamada a la acción.
   El Diseñador lo arma en 4 estilos con medidas reales y tú eliges uno; todo queda editable.
   - Usa la IA de Chrome (gratis, en tu equipo) o tu clave de Gemini (72-asistente-de-escritura.js).
   - La IA no debe inventar fechas, lugares, precios ni teléfonos: solo usa los que escribiste.
   - Sin IA también funciona: la primera frase va de título y el resto de texto.
   ========================================================= */
const FORMATOS_IA = [
  { id:'auto', nombre:'Que la IA decida' },
  { id:'cartel', nombre:'Cartel', tam:[1240, 1754], d:'Hoja carta / A4' },
  { id:'publicacion', nombre:'Publicación', tam:[1080, 1350], d:'Instagram / Facebook' },
  { id:'historia', nombre:'Historia', tam:[1080, 1920], d:'Estados y reels' },
  { id:'invitacion', nombre:'Invitación', tam:[1500, 2100], d:'5 × 7 pulgadas' },
  { id:'horizontal', nombre:'Horizontal', tam:[1920, 1080], d:'Pantalla o portada' }
];
const PEDIR_DISENO_IA = `Eres diseñador gráfico. Con la petición de la persona, escribe el contenido de UN diseño de una sola página, en español de México.
Devuelve SOLO un objeto JSON válido (sin \`\`\`), con estas claves:
"formato": uno de "cartel", "publicacion", "historia", "invitacion", "horizontal";
"eyebrow": texto muy corto arriba del título (máx. 4 palabras) o "";
"titulo": título llamativo (máx. 8 palabras);
"subtitulo": máx. 14 palabras o "";
"texto": máx. 35 palabras o "";
"puntos": lista de 0 a 5 frases cortas (máx. 6 palabras cada una);
"datos": lista de 0 a 3 datos prácticos (fecha, hora, lugar, precio, contacto) COPIADOS de la petición;
"cta": llamada a la acción de máx. 5 palabras o "";
"pie": organizador, escuela, contacto o hashtags que la persona dio, o "";
"estilo": el que mejor vaya con el tema: "neon", "elegante", "colorido" o "marca".
Reglas: no inventes fechas, horas, lugares, precios, teléfonos ni nombres que la persona no escribió; no uses emojis; usa buena ortografía.`;
function leerJSONIA(t){
  const a = String(t || '').indexOf('{'), b = String(t || '').lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('La IA no devolvió el diseño en el formato esperado. Intenta otra vez.');
  const d = JSON.parse(t.slice(a, b + 1)), corto = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);
  const lista = (v, n, k) => (Array.isArray(v) ? v : []).map(x => corto(x, k)).filter(Boolean).slice(0, n);
  return { formato:corto(d.formato, 20).toLowerCase(), eyebrow:corto(d.eyebrow, 40), titulo:corto(d.titulo, 90) || 'Tu título', subtitulo:corto(d.subtitulo, 140),
    texto:corto(d.texto, 320), puntos:lista(d.puntos, 5, 60), datos:lista(d.datos, 3, 60), cta:corto(d.cta, 40), pie:corto(d.pie, 90),
    estilo:ESTILOS_POST[d.estilo] ? d.estilo : 'colorido' };
}
// sin IA: la primera frase es el título y lo demás el texto
function contenidoSinIA(t){
  const limpio = String(t || '').trim().replace(/\s+/g, ' '), corte = limpio.search(/[.!?¡¿:\n]\s|,\s/);
  const titulo = (corte > 0 && corte < 70 ? limpio.slice(0, corte) : limpio.split(' ').slice(0, 7).join(' ')).replace(/^(un|una|el|la|haz(me)?|crea(me)?)\s+/i, '');
  const resto = limpio.slice(titulo.length).replace(/^[\s.,:;!?]+/, '');
  const formato = /invitaci/i.test(limpio) ? 'invitacion' : /cartel|póster|poster|aviso/i.test(limpio) ? 'cartel' : /historia|estado|reel/i.test(limpio) ? 'historia' : /portada|banner|pantalla|horizontal/i.test(limpio) ? 'horizontal' : '';
  return { formato, eyebrow:'', titulo:titulo.charAt(0).toUpperCase() + titulo.slice(1), subtitulo:'', texto:resto.slice(0, 320), puntos:[], datos:[], cta:'', pie:'', estilo:'colorido' };
}
let disenoIA = null;        // { c, w, h }
(function(){
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'mDisenoIA';
  m.innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="diTitulo">
    <h3 id="diTitulo">${svgIcono('varita')} Diseño con IA</h3>
    <label class="diCampo" for="diPeticion">¿Qué quieres hacer? Escribe los datos importantes (fecha, lugar, quién organiza).</label>
    <textarea id="diPeticion" rows="4" maxlength="800" placeholder="Ej.: Cartel para la feria de ciencias de 2.º A, el viernes 5 de diciembre a las 10 am en el patio. Que inviten a las familias."></textarea>
    <div class="diIdeas" id="diIdeas" aria-label="Ideas para empezar"></div>
    <fieldset class="diFormatos"><legend>Formato</legend><div id="diFormatos"></div></fieldset>
    <div id="diSinIA" class="diSinIA" hidden>
      <p>Para que la IA escriba por ti, pega tu clave gratuita de Google Gemini. Créala en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>; se guarda solo en este navegador.</p>
      <div class="diClave"><label class="srOnly" for="diClave">Clave de Gemini</label><input id="diClave" type="password" autocomplete="off" placeholder="Pega aquí tu clave de Gemini"><button type="button" class="btnS" id="diGuardarClave">Guardar</button></div>
      <p class="diNota">También puedes seguir sin IA: tu primera frase será el título y lo demás el texto.</p>
    </div>
    <p id="diEstado" class="diEstado" role="status" aria-live="polite"></p>
    <div id="diResultados" class="diResultados" hidden></div>
    <div class="acciones"><button type="button" class="btnS" id="diCerrar">Cerrar</button><button type="button" class="btnP" id="diCrear">${svgIcono('varita')} Crear diseños</button></div>
  </div>`;
  document.body.appendChild(m);
  const ideas = ['Cartel de la feria de ciencias', 'Invitación a una posada', 'Aviso de junta de padres', 'Promoción de mi negocio', 'Felicitación del día del maestro'];
  ideas.forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = t; b.onclick = () => { $('diPeticion').value = t + ' '; $('diPeticion').focus(); }; $('diIdeas').appendChild(b); });
  FORMATOS_IA.forEach((f, i) => {
    const l = document.createElement('label'); l.className = 'diFormato';
    l.innerHTML = `<input type="radio" name="diFormato" value="${f.id}"${i === 0 ? ' checked' : ''}><span><b>${esc(f.nombre)}</b>${f.d ? `<small>${esc(f.d)}</small>` : ''}</span>`;
    $('diFormatos').appendChild(l);
  });
  ['diPeticion', 'diClave'].forEach(id => $(id).addEventListener('keydown', e => e.stopPropagation()));
  $('diCerrar').onclick = () => cerrarModal('mDisenoIA');
  m.addEventListener('click', e => { if (e.target === m) cerrarModal('mDisenoIA'); });
  $('diGuardarClave').onclick = async () => { if (await guardarClaveIA($('diClave').value)){ $('diClave').value = ''; revisarIADiseno(); } };
  $('diCrear').onclick = () => crearDisenosIA();
})();
async function revisarIADiseno(){
  const hay = await iaDisponible();
  $('diSinIA').hidden = !!hay;
  $('diCrear').innerHTML = `${svgIcono('varita')} ${hay ? 'Crear diseños' : 'Crear sin IA'}`;
  return hay;
}
function abrirDisenoIA(){
  $('diResultados').hidden = true; $('diResultados').innerHTML = ''; $('diEstado').textContent = '';
  abrirModal('mDisenoIA'); revisarIADiseno();
  setTimeout(() => $('diPeticion').focus(), 40);
}
async function crearDisenosIA(){
  const pet = $('diPeticion').value.trim(), btn = $('diCrear');
  if (pet.length < 4){ $('diEstado').textContent = 'Escribe primero qué quieres hacer (con una frase basta).'; $('diPeticion').focus(); return; }
  const elegido = (document.querySelector('[name="diFormato"]:checked') || {}).value || 'auto';
  btn.disabled = true; $('diResultados').hidden = true;
  let c;
  try {
    if (await iaDisponible()){
      $('diEstado').textContent = 'La IA está escribiendo tu diseño…';
      const extra = elegido !== 'auto' ? `\nEl formato debe ser "${elegido}".` : '';
      c = leerJSONIA(await pedirIA(pet, PEDIR_DISENO_IA + extra, p => { $('diEstado').textContent = 'Preparando la IA de tu navegador… ' + Math.round((p || 0) * 100) + '%'; }));
    } else c = contenidoSinIA(pet);
  } catch (e) {
    console.warn(e);
    $('diEstado').textContent = 'La IA no respondió (' + ((e && e.message) || e) + '). Lo armé con tu texto tal cual.';
    c = contenidoSinIA(pet);
  }
  const fmt = FORMATOS_IA.find(f => f.id === elegido && f.tam) || FORMATOS_IA.find(f => f.id === c.formato && f.tam) || FORMATOS_IA[2];
  const [w, h] = fmt.tam;
  disenoIA = { c, w, h };
  // 4 vistas: primero el estilo que sugirió la IA
  const orden = [c.estilo, ...Object.keys(ESTILOS_POST).filter(k => k !== c.estilo)];
  const cont = $('diResultados'); cont.innerHTML = '';
  for (const k of orden){
    const url = vistaDe([w, h], () => armarDiseno(c, k, w, h, true));
    const b = document.createElement('button'); b.type = 'button'; b.className = 'diResultado';
    b.innerHTML = `<img alt="Diseño estilo ${esc(ESTILOS_POST[k].nombre)}" src="${url}"><span>${esc(ESTILOS_POST[k].nombre)}${k === c.estilo ? ' · sugerido' : ''}</span>`;
    b.onclick = () => usarDisenoIA(k);
    cont.appendChild(b);
  }
  cont.hidden = false; btn.disabled = false;
  btn.innerHTML = `${svgIcono('ciclo')} Crear otra vez`;
  if (!/no respondió/.test($('diEstado').textContent)) $('diEstado').textContent = `Listo: ${fmt.nombre} de ${w} × ${h} px. Toca el que más te guste; después puedes cambiar todo.`;
  cont.querySelector('button').focus();
}
function usarDisenoIA(k){
  if (!disenoIA) return;
  if (typeof hayDisenoInicio === 'function' && hayDisenoInicio()){
    const nom = ($('nombreDiseno').value || 'Mi diseño').trim();
    if (!confirm(`Tu diseño «${nom}» se va a cambiar por el nuevo. Si lo quieres conservar, toca «Cancelar» y guárdalo primero.`)) return;
  }
  cerrarModal('mDisenoIA');
  if (typeof disenoEnBlanco === 'function') disenoEnBlanco();
  if (typeof cerrarInicio === 'function' && $('inicioApp') && !$('inicioApp').hidden) cerrarInicio();
  armarDiseno(disenoIA.c, k, disenoIA.w, disenoIA.h);
  if (typeof hechoPP === 'function') hechoPP('ia');
  toast('✓ Tu diseño está listo. Toca cualquier texto para cambiarlo.');
}
// entradas: página de inicio (atajo y botón grande), Archivo y buscador de herramientas
(function(){
  const atajos = document.querySelector('#inicioApp .inAtajos');
  if (atajos){ const b = document.createElement('button'); b.type = 'button'; b.textContent = '🪄 Diseño con IA'; b.onclick = () => abrirDisenoIA(); const r = atajos.querySelector('button'); atajos.insertBefore(b, r); }
  const busca = document.querySelector('#inicioApp .inBusca');
  if (busca){
    const b = document.createElement('button'); b.type = 'button'; b.id = 'inDisenoIA'; b.className = 'inDisenoIA';
    b.innerHTML = `${svgIcono('varita')}<span><b>¿No encuentras lo que buscas?</b> Descríbelo y la IA te arma el diseño</span>`;
    b.onclick = () => { const q = ($('inTexto') || {}).value || ''; abrirDisenoIA(); if (q.trim()) $('diPeticion').value = q.trim(); };
    busca.insertAdjacentElement('afterend', b);
  }
  const mp = $('maPrincipal');
  if (mp){ const a = document.createElement('button'); a.className = 'tb'; a.type = 'button'; a.id = 'bDisenoIA'; a.innerHTML = `${svgIcono('varita')} Diseño con IA`; a.onclick = () => abrirDisenoIA(); mp.prepend(a); }
})();

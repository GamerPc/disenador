/* =========================================================
   KIT DE MARCA (tus colores, letras y logo)
   ========================================================= */
let kit = { colores:['#7c3aed', '#f97316', '#06b6d4', '#1f2330', '#f8fafc'], titulo:'Fredoka', texto:'Poppins', logo:'' };
const NOMBRES_KIT = ['Principal', 'Secundario', 'Acento', 'Texto', 'Fondo'];
const hexDe = c => { try { if (!c || typeof c !== 'string' || c === 'transparent') return null; const k = new fabric.Color(c); if (k.getAlpha() < 0.05) return null; return '#' + k.toHex().toLowerCase(); } catch(e){ return null; } };
const luzDe = h => { const k = new fabric.Color(h).getSource(); return (0.299 * k[0] + 0.587 * k[1] + 0.114 * k[2]) / 255; };
const satDe = h => { const [r, g, b] = new fabric.Color(h).getSource().map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1)); };
const mezclar = (a, b, t) => { const A = new fabric.Color(a).getSource(), B = new fabric.Color(b).getSource(); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join(''); };
function pintarKit(){
  const cont = $('kitColores'); cont.innerHTML = '';
  kit.colores.forEach((c, i) => {
    const d = document.createElement('label'); d.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10.5px;color:var(--suave)';
    d.innerHTML = `<input type="color" value="${c}" style="width:100%;height:38px">${NOMBRES_KIT[i]}`;
    d.querySelector('input').addEventListener('input', e => { kit.colores[i] = e.target.value; kitCambiado(); });
    cont.appendChild(d);
  });
  $('kitTitulo').value = kit.titulo; $('kitTexto').value = kit.texto;
  $('kitTitulo').style.fontFamily = kit.titulo; $('kitTexto').style.fontFamily = kit.texto;
  $('kitLogo').innerHTML = kit.logo ? `<img src="${kit.logo}" style="max-width:100%;max-height:110px;display:block;margin:auto">` : 'Sin logo';
}
['kitTitulo', 'kitTexto'].forEach(id => {
  $(id).innerHTML = FUENTES.map(f => `<option value="${f}" style="font-family:'${f}'">${f}</option>`).join('');
  $(id).addEventListener('change', e => { kit[id === 'kitTitulo' ? 'titulo' : 'texto'] = e.target.value; kitCambiado(); pintarKit(); });
});
function kitCambiado(){
  $('kitEstado').textContent = 'Cambios sin guardar en tu kit';
  const { logoEl, ...datos } = kit;
  try { localStorage.setItem('disenador_kit', JSON.stringify(datos)); } catch(e){}
  actualizarTemaMarca();
}
$('archivoLogo').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const lector = new FileReader();
  lector.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 600 / Math.max(im.width, im.height)), cv = document.createElement('canvas');
      cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      kit.logo = cv.toDataURL('image/png'); prepararLogo(); pintarKit(); kitCambiado();
    };
    im.src = lector.result;
  };
  lector.readAsDataURL(f);
});
function quitarLogoKit(){ kit.logo = ''; kit.logoEl = null; pintarKit(); kitCambiado(); }
function prepararLogo(){ if (!kit.logo){ kit.logoEl = null; return; } const im = new Image(); im.onload = () => { if (kit.logoEl === im) actualizarTemaMarca(); }; im.src = kit.logo; kit.logoEl = im; }
function agregarLogo(){
  if (!kit.logo){ toast('Primero sube tu logo'); return; }
  fabric.Image.fromURL(kit.logo, img => {
    img.scaleToWidth(Math.min(W, H) * 0.2);
    img.set({ originX:'center', originY:'center', left:W - img.getScaledWidth() / 2 - W * 0.04, top:img.getScaledHeight() / 2 + H * 0.04 });
    agregar(img, 'Logo');
  });
}
function agregarTextoKit(tipo){
  const t = agregarTexto(tipo === 'titulo' ? 'titulo' : 'cuerpo', { fontFamily:tipo === 'titulo' ? kit.titulo : kit.texto, fill:kit.colores[tipo === 'titulo' ? 0 : 3] });
  canvas.setActiveObject(t); canvas.requestRenderAll();
}
async function guardarKitDrive(){
  const { logoEl, ...datos } = kit;
  try { localStorage.setItem('disenador_kit', JSON.stringify(datos)); } catch(e){}
  misColores = [...new Set([...kit.colores, ...misColores])].slice(0, 16); guardarColores();
  try { await gs('guardarKit', JSON.stringify(datos)); $('kitEstado').textContent = '✓ Kit guardado en tu Drive'; toast('Kit de marca guardado'); }
  catch (e) { $('kitEstado').textContent = 'Guardado solo en este navegador'; toast('No se pudo guardar en Drive: ' + e.message); }
}
async function cargarKit(){
  try { const l = localStorage.getItem('disenador_kit'); if (l) kit = { ...kit, ...JSON.parse(l) }; } catch(e){}
  prepararLogo(); pintarKit(); actualizarTemaMarca();
  try {
    const txt = await gs('cargarKit');
    if (txt){ kit = { ...kit, ...JSON.parse(txt) }; prepararLogo(); pintarKit(); actualizarTemaMarca(); $('kitEstado').textContent = '✓ Kit cargado de tu Drive'; }
  } catch(e){}
}
// ---------- Aplicar el kit a un diseño ----------
function mapaDeColores(objs){
  const usos = new Map();
  const sumar = (c, peso) => { const h = hexDe(c); if (h) usos.set(h, (usos.get(h) || 0) + peso); };
  objs.forEach(o => {
    if (o.type === 'image' || o.type === 'group' || esTexto(o)) return;
    const area = Math.max(1, (o.width || 1) * (o.scaleX || 1) * (o.height || 1) * (o.scaleY || 1));
    sumar(o.fill, area); if (o.strokeWidth) sumar(o.stroke, area * 0.05);
  });
  const vivos = [...usos.entries()].filter(([h]) => satDe(h) > 0.2 && luzDe(h) > 0.1 && luzDe(h) < 0.93).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const mapa = {};
  vivos.forEach((h, i) => { mapa[h] = kit.colores[i % 3]; });
  return mapa;
}
function aplicarKitObjs(objs){
  const mapa = mapaDeColores(objs), [, , , oscuro, claro] = kit.colores;
  const porIdK = {}; objs.forEach(o => { if (o.id) porIdK[o.id] = o; });
  const textos = objs.filter(esTexto), mayor = Math.max(1, ...textos.map(t => (t.fontSize || 0) * (t.scaleY || 1)));
  const nuevo = (c, tipo) => {
    const h = hexDe(c); if (!h) return c;
    if (mapa[h]) return mapa[h];
    if (tipo !== 'fondo' && satDe(h) < 0.2 && luzDe(h) < 0.35) return oscuro;
    if (tipo === 'fondo' && luzDe(h) > 0.85 && h !== '#ffffff') return claro;
    return c;
  };
  objs.forEach(o => {
    if (o.type === 'image' || o.type === 'group' || esTexto(o)) return;
    if (o.esFondo){ if (typeof o.fill === 'string') o.set('fill', nuevo(o.fill, 'fondo')); return; }
    if (typeof o.fill === 'string') o.set('fill', nuevo(o.fill));
    if (typeof o.stroke === 'string') o.set('stroke', nuevo(o.stroke));
  });
  textos.forEach(t => {
    const titulo = (t.fontSize || 0) * (t.scaleY || 1) >= mayor * 0.6 && !t.textoDe;
    t.set('fontFamily', titulo ? kit.titulo : kit.texto);
    const forma = t.textoDe && porIdK[t.textoDe];
    if (forma && typeof forma.fill === 'string' && hexDe(forma.fill)) t.set('fill', luzDe(hexDe(forma.fill)) < 0.55 ? '#ffffff' : oscuro);
    else if (typeof t.fill === 'string' && hexDe(t.fill)){
      const h = hexDe(t.fill);
      t.set('fill', mapa[h] || (luzDe(h) < 0.5 ? (titulo ? kit.colores[0] : oscuro) : t.fill));
    }
    if (t.initDimensions) t.initDimensions();
  });
}
function fondoConKit(c){
  const h = hexDe(c); if (!h) return c;
  if (luzDe(h) > 0.85) return h === '#ffffff' ? c : kit.colores[4];
  if (satDe(h) > 0.2) return kit.colores[0];
  return c;
}
async function aplicarKit(todas){
  canvas.discardActiveObject();
  if (todas) paginas.forEach((p, i) => { if (i !== actual && p && typeof p.background === 'string') p.background = fondoConKit(p.background); });
  if (typeof canvas.backgroundColor === 'string') canvas.backgroundColor = fondoConKit(canvas.backgroundColor);
  await cambiarPaginas(todas, objs => aplicarKitObjs(objs));
  canvas.getObjects().filter(o => o.textoDe).forEach(t => { try { ajustarFormaATexto(t); } catch(e){} });
  canvas.requestRenderAll(); guardarEstado(); renderPaginas();
  toast(todas ? 'Se aplicó tu marca a todas las páginas' : 'Se aplicó tu marca a esta página');
}
// ---------- Tema de presentación con tu marca ----------
function temaMarca(){
  const [p, s, a, o, f] = kit.colores;
  return { id:'marca', nombre:'Mi marca', fondo:f, texto:o, suave:mezclar(o, f, 0.4), pri:p, sec:s, acento:a,
    tarjeta:luzDe(f) > 0.85 ? mezclar(p, '#ffffff', 0.9) : '#ffffff', textoTarjeta:o, borde:null,
    tit:kit.titulo, titPeso:'700', cuerpo:kit.texto, paleta:'Vibrante', trans:'deslizar', anim:'dinamica' };
}
function logoEn(x, y, ancho){
  if (!kit.logoEl || !kit.logoEl.complete || !kit.logoEl.naturalWidth) return;
  const img = new fabric.Image(kit.logoEl, { originX:'center', originY:'center', left:x, top:y, name:'Logo', id:nuevoId() });
  img.scaleToWidth(ancho); canvas.add(img);
}
function fondoMarca(t, k){
  if (k === 'seccion'){ FONDO(t.pri); CIRC(1650, 240, 320, '#ffffff', { op:0.08 }); logoEn(1780, 980, 140); return { texto:'#ffffff', suave:mezclar('#ffffff', t.pri, 0.25), acento:luzDe(t.acento) > 0.6 ? t.acento : '#ffffff' }; }
  FONDO(t.fondo);
  if (k === 'portada' || k === 'final'){ CIRC(1650, 260, 420, t.pri, { op:0.12 }); CIRC(240, 920, 260, t.sec, { op:0.14 }); logoEn(960, 140, 220); }
  else { RECT(0, 0, 1920, 14, t.pri); if (k === 'normal') RECT(120, 192, 110, 9, t.sec, { r:4 }); logoEn(1790, 95, 150); }
  return { texto:t.texto, suave:t.suave, acento:t.pri };
}
function actualizarTemaMarca(){
  TEMAS_PRES.marca = temaMarca();
  Object.keys(vistasDiapo).forEach(k => { if (k.startsWith('marca/')) delete vistasDiapo[k]; });
  let it = CATALOGO.find(x => x.esMarca);
  if (!it){
    it = { nombre:'Mi marca · ' + DIAPOS.length + ' diapositivas', cat:CAT_PRES, tam:[1920, 1080], esMarca:true,
      crear:() => DIAPOS[0].crear(TEMAS_PRES.marca), usar:() => usarPresentacion(TEMAS_PRES.marca) };
    const k = CATALOGO.findIndex(x => x.cat === CAT_PRES);
    CATALOGO.splice(k < 0 ? CATALOGO.length : k, 0, it);
  }
  clearTimeout(actualizarTemaMarca._t);
  actualizarTemaMarca._t = setTimeout(() => {   // la miniatura se vuelve a dibujar cuando su tarjeta se vea
    it.vista = '';
    if (it.boton){ it.boton.querySelector('.mini').textContent = 'Preparando…'; pedirVista(it, it.boton); }
  }, 400);
  renderCatalogo();
}
cargarKit();


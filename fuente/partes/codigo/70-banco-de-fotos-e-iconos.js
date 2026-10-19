/* =========================================================
   BANCO DE FOTOS E ÍCONOS GRATIS
   ========================================================= */
EXTRA.push('credito');
const API_FOTOS = 'https://api.openverse.org/v1/images/';
const API_ICONOS = 'https://api.iconify.design/';
const TRAD_ICONOS = { casa:'home', hogar:'home', libro:'book', escuela:'school', balanza:'scale', justicia:'scale', ley:'gavel', mazo:'gavel', persona:'user', usuario:'user',
  gente:'users', grupo:'users', corazon:'heart', 'corazón':'heart', estrella:'star', telefono:'phone', 'teléfono':'phone', correo:'mail', carta:'mail', calendario:'calendar',
  reloj:'clock', dinero:'money', pago:'credit-card', tarjeta:'credit-card', carrito:'cart', compra:'shopping', tienda:'store', comida:'food', cafe:'coffee', 'café':'coffee',
  ubicacion:'map-pin', 'ubicación':'map-pin', mapa:'map', buscar:'search', lupa:'search', flecha:'arrow', foto:'camera', camara:'camera', 'cámara':'camera', musica:'music',
  'música':'music', video:'video', chat:'chat', mensaje:'message', whatsapp:'whatsapp', facebook:'facebook', instagram:'instagram', tiktok:'tiktok', candado:'lock',
  seguridad:'shield', escudo:'shield', computadora:'computer', celular:'smartphone', idea:'lightbulb', foco:'lightbulb', grafica:'chart', 'gráfica':'chart', documento:'file',
  archivo:'file', carpeta:'folder', lapiz:'pencil', 'lápiz':'pencil', basura:'trash', ajustes:'settings', estudiante:'student', maestro:'teacher', policia:'police', 'policía':'police',
  carro:'car', auto:'car', avion:'plane', 'avión':'plane', sol:'sun', luna:'moon', arbol:'tree', 'árbol':'tree', flor:'flower', perro:'dog', gato:'cat', regalo:'gift', fiesta:'party' };
let fotosEstado = { q:'', pag:1 };
async function buscarFotos(mas){
  const q = $('buscaFoto').value.trim(); if (!q) return toast('Escribe qué foto buscas');
  if (!mas) fotosEstado = { q, pag:1 }; else fotosEstado.pag++;
  const cont = $('resFotos'); if (!mas) cont.innerHTML = '<p class="hint">Buscando…</p>';
  try {
    const u = API_FOTOS + '?q=' + encodeURIComponent(q) + '&page_size=20&page=' + fotosEstado.pag + ($('fotoComercial').checked ? '&license_type=commercial' : '') + '&mature=false';
    const r = await fetch(u); if (!r.ok) throw new Error(r.status === 429 ? 'Demasiadas búsquedas seguidas, espera un minuto' : 'El banco de fotos no respondió (' + r.status + ')');
    const d = await r.json();
    if (!mas) cont.innerHTML = '';
    if (!d.results || !d.results.length){ if (!mas) cont.innerHTML = '<p class="hint">No encontré fotos. Prueba con otra palabra (a veces funciona mejor en inglés).</p>'; $('masFotos').hidden = true; return; }
    d.results.forEach(f => {
      const im = document.createElement('img'); im.loading = 'lazy'; im.alt = f.title || q; im.src = f.thumbnail || f.url;
      im.title = (f.title || '') + (f.creator ? ' · ' + f.creator : '') + ' · ' + licenciaTexto(f);
      im.onclick = () => usarFoto(f);
      cont.appendChild(im);
    });
    $('masFotos').hidden = !(d.page_count > fotosEstado.pag);
  } catch (e) { if (!mas) cont.innerHTML = ''; toast(e.message.includes('fetch') ? 'Sin conexión con el banco de fotos. Revisa tu internet.' : e.message); }
}
const licenciaTexto = f => (f.license === 'cc0' ? 'CC0 (dominio público)' : f.license === 'pdm' ? 'Dominio público' : 'CC ' + String(f.license || '').toUpperCase() + ' ' + (f.license_version || ''));
async function usarFoto(f){
  cargando(true);
  try {
    let blob = null;
    for (const u of [f.thumbnail ? f.thumbnail.replace(/\/?$/, '/') + '?full_size=true' : null, f.url, f.thumbnail].filter(Boolean)){
      try { const r = await fetch(u); if (r.ok){ const b = await r.blob(); if (b.type.startsWith('image/')){ blob = b; break; } } } catch (e) {}
    }
    if (!blob) throw new Error('No se pudo descargar esa foto. Prueba con otra.');
    const datos = await blobADataURL(blob);
    const url = await new Promise(ok => reducirImagen(datos, 2000, ok));
    const credito = 'Foto: ' + (f.title ? '«' + f.title + '» ' : '') + (f.creator ? 'de ' + f.creator + ' ' : '') + '(' + licenciaTexto(f).trim() + ')' + (f.foreign_landing_url ? ' — ' + f.foreign_landing_url : '');
    const sel = activo();
    if (sel && (sel.marco || sel.marcoVacio)){ llenarMarco(sel, url); }
    else fabric.Image.fromURL(url, img => {
      const k = Math.min((W * 0.6) / img.width, (H * 0.6) / img.height, 1);
      img.set({ left:W / 2, top:H / 2, originX:'center', originY:'center', scaleX:k, scaleY:k, fx:{ b:0, c:0, s:0, bl:0, gris:false, sepia:false, inv:false } });
      img.credito = f.license === 'cc0' || f.license === 'pdm' ? '' : credito;
      agregar(img, 'Foto'); renderCapas(); guardarEstado();
    });
    miniatura(url);
    toast(f.license === 'cc0' || f.license === 'pdm' ? 'Foto agregada (libre, no necesitas dar crédito).' : 'Foto agregada. Esta licencia pide dar crédito: selecciónala y pulsa «© Crédito».');
  } catch (e) { toast(e.message); }
  finally { cargando(false); }
}
function agregarCredito(){
  const o = activo(); if (!o || !o.credito) return;
  const r = o.getBoundingRect(true, true);
  const t = new fabric.Textbox(o.credito.replace(/ — https?:\/\/\S+$/, ''), { left:r.left, top:r.top + r.height + 6, width:Math.max(160, r.width), fontSize:Math.max(10, Math.round(Math.min(W, H) / 90)),
    fontFamily:'Inter', fill:'#6b7280', name:'Crédito de la foto' });
  agregar(t, 'Crédito de la foto'); renderCapas(); guardarEstado();
}
// ---------- íconos ----------
async function buscarIconos(){
  let q = $('buscaIcono').value.trim().toLowerCase(); if (!q) return toast('Escribe qué ícono buscas');
  q = q.split(/\s+/).map(w => TRAD_ICONOS[w] || w).join(' ');
  const cont = $('resIconos'); cont.innerHTML = '<p class="hint">Buscando…</p>';
  try {
    const pre = $('estiloIcono').value;
    const r = await fetch(API_ICONOS + 'search?query=' + encodeURIComponent(q) + '&limit=96' + (pre ? '&prefixes=' + pre : ''));
    if (!r.ok) throw new Error('El banco de íconos no respondió (' + r.status + ')');
    const d = await r.json(); cont.innerHTML = '';
    if (!d.icons || !d.icons.length){ cont.innerHTML = '<p class="hint">No encontré íconos. Prueba en inglés (por ejemplo «book», «heart», «school»).</p>'; return; }
    d.icons.forEach(n => {
      const [p, nom] = n.split(':'), info = (d.collections || {})[p] || {};
      const b = document.createElement('button'); b.className = 'icoBanco'; b.title = nom.replace(/-/g, ' ') + ' · ' + (info.name || p) + (info.license ? ' (' + info.license.title + ')' : '');
      b.setAttribute('aria-label', nom.replace(/-/g, ' '));
      b.innerHTML = `<img loading="lazy" alt="" src="${API_ICONOS}${p}/${nom}.svg?height=40">`;
      b.onclick = () => usarIcono(p, nom);
      cont.appendChild(b);
    });
  } catch (e) { cont.innerHTML = ''; toast(e.message.includes('fetch') ? 'Sin conexión con el banco de íconos. Revisa tu internet.' : e.message); }
}
async function usarIcono(p, nom){
  try {
    const color = $('colorIcono').value;
    const r = await fetch(`${API_ICONOS}${p}/${nom}.svg?height=240`); if (!r.ok) throw new Error('No se pudo descargar el ícono');
    const svg = (await r.text()).replace(/currentColor/g, color);
    fabric.loadSVGFromString(svg, (objs, opt) => {
      const o = fabric.util.groupSVGElements(objs, opt);
      const s = Math.min(W, H) * 0.18 / Math.max(o.width, o.height);
      o.set({ left:W / 2, top:H / 2, originX:'center', originY:'center', scaleX:s, scaleY:s, name:'Ícono ' + nom.replace(/-/g, ' ') });
      agregar(o, 'Ícono'); renderCapas(); guardarEstado();
    });
  } catch (e) { toast(e.message); }
}
// ---------- botones y panel ----------
$('bBuscaFoto').onclick = () => buscarFotos(false);
$('buscaFoto').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') buscarFotos(false); });
$('masFotos').onclick = () => buscarFotos(true);
$('bBuscaIcono').onclick = buscarIconos;
$('buscaIcono').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') buscarIconos(); });
(function(){
  const b = document.createElement('button'); b.className = 'pb'; b.id = 'bCredito'; b.hidden = true; b.title = 'Pone debajo de la foto el nombre del autor y la licencia'; b.textContent = '© Crédito';
  b.onclick = agregarCredito;
  const ref = $('bEnlace'); if (ref) ref.after(b);
})();
alActualizarPanel(function(){
  if (generandoVista) return;
  const o = activo(); $('bCredito').hidden = !(o && o.credito);
});

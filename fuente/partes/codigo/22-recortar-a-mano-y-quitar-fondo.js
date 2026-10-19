/* =========================================================
   RECORTAR A MANO Y QUITAR FONDO
   ========================================================= */
let recorte = null;   // modo activo: { tipo:'rect'|'libre'|'zona', img, ov?, pts? }
function imagenActiva(){
  const o = activo();
  if (!o || o.type !== 'image'){ toast('Primero selecciona una imagen'); return null; }
  if (o.marco){ toast('Esta foto está dentro de un marco: usa “Sacar del marco” para recortarla a mano.'); return null; }
  return o;
}
function avisoRecorte(html){ const a = $('recorteAviso'); a.innerHTML = html; a.style.display = html ? 'flex' : 'none'; }
function bloquearOtros(img, si){
  canvas.getObjects().forEach(o => {
    if (recorte && o === recorte.ov) return;
    if (si){ if (!('__ev' in o)) o.__ev = o.evented; o.evented = false; }
    else if ('__ev' in o){ o.evented = o.__ev; delete o.__ev; }
  });
  canvas.selection = !si;
}
function terminarRecorte(guardar){
  if (!recorte) return;
  const { img, ov } = recorte;
  recorte = null;
  if (ov){ restaurando = true; canvas.remove(ov); restaurando = false; }
  canvas.off('after:render', sombraRecorte);
  bloquearOtros(img, false);
  canvas.defaultCursor = 'default'; canvas.clearContext(canvas.contextTop);
  avisoRecorte('');
  if (canvas.getObjects().includes(img)) canvas.setActiveObject(img);
  canvas.requestRenderAll(); renderCapas(); actualizarPanel();
  if (guardar) guardarEstado();
}
// ---------- Recorte con recuadro ----------
function iniciarRecorteRect(){
  const img = imagenActiva(); if (!img) return;
  terminarRecorte(false);
  const c = img.getCenterPoint();
  const ov = new fabric.Rect({ width:img.getScaledWidth(), height:img.getScaledHeight(), angle:img.angle, originX:'center', originY:'center', left:c.x, top:c.y,
    fill:'rgba(255,255,255,0.001)', stroke:'#19c8ff', strokeWidth:2, strokeDashArray:[8, 6], strokeUniform:true, lockRotation:true,
    esDeco:true, name:'Recorte', cornerColor:'#19c8ff', cornerStrokeColor:'#0f1218', transparentCorners:false });
  ov.setControlVisible('mtr', false);
  recorte = { tipo:'rect', img, ov };
  restaurando = true; canvas.add(ov); restaurando = false;
  bloquearOtros(img, true);
  canvas.setActiveObject(ov); canvas.on('after:render', sombraRecorte); canvas.requestRenderAll();
  avisoRecorte('✂ Mueve y ajusta el recuadro sobre lo que quieres conservar <button onclick="aplicarRecorteRect()">✓ Recortar</button><button onclick="terminarRecorte(false)">Cancelar</button>');
}
function sombraRecorte(){
  if (!recorte || recorte.tipo !== 'rect') return;
  const ctx = canvas.contextContainer, v = canvas.viewportTransform;
  const a = recorte.img.calcACoords(), b = recorte.ov.calcACoords();
  ctx.save(); ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
  ctx.beginPath();
  [a.tl, a.tr, a.br, a.bl].forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
  [b.tl, b.bl, b.br, b.tr].forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
  ctx.fillStyle = 'rgba(15,17,25,.55)'; ctx.fill('evenodd');
  ctx.restore();
}
function aplicarRecorteRect(){
  if (!recorte || recorte.tipo !== 'rect') return;
  const { img, ov } = recorte, m = img.calcTransformMatrix(), inv = fabric.util.invertTransform(m);
  const c = ov.calcACoords();
  const pts = [c.tl, c.tr, c.br, c.bl].map(p => fabric.util.transformPoint(p, inv));
  const w = img.width, h = img.height;
  const x0 = Math.max(-w / 2, Math.min(...pts.map(p => p.x))), x1 = Math.min(w / 2, Math.max(...pts.map(p => p.x)));
  const y0 = Math.max(-h / 2, Math.min(...pts.map(p => p.y))), y1 = Math.min(h / 2, Math.max(...pts.map(p => p.y)));
  if (x1 - x0 < 4 || y1 - y0 < 4){ toast('El recuadro quedó fuera de la imagen'); return; }
  const centro = fabric.util.transformPoint(new fabric.Point((x0 + x1) / 2, (y0 + y1) / 2), m);
  img.set({ cropX:(img.cropX || 0) + x0 + w / 2, cropY:(img.cropY || 0) + y0 + h / 2, width:x1 - x0, height:y1 - y0 });
  img.clipPath = null;
  img.setPositionByOrigin(centro, 'center', 'center'); img.setCoords(); img.dirty = true;
  terminarRecorte(true);
  toast('Imagen recortada. “⤢ Ver completa” la regresa a como estaba.');
}
function verImagenCompleta(){
  const img = imagenActiva(); if (!img) return;
  const og = img.getOriginalSize();
  // la parte visible se queda en su lugar y la imagen completa se extiende a su alrededor
  const local = new fabric.Point(og.width / 2 - (img.cropX || 0) - img.width / 2, og.height / 2 - (img.cropY || 0) - img.height / 2);
  const c = fabric.util.transformPoint(local, img.calcTransformMatrix());
  img.set({ cropX:0, cropY:0, width:og.width, height:og.height }); img.clipPath = null;
  img.setPositionByOrigin(c, 'center', 'center'); img.setCoords(); img.dirty = true;
  canvas.requestRenderAll(); guardarEstado();
}
// ---------- Recorte libre (dibujar el contorno) ----------
function iniciarRecorteLibre(){
  const img = imagenActiva(); if (!img) return;
  terminarRecorte(false);
  recorte = { tipo:'libre', img, pts:null };
  bloquearOtros(img, true); canvas.discardActiveObject(); canvas.defaultCursor = 'crosshair'; canvas.requestRenderAll();
  avisoRecorte('✏ Dibuja con el mouse o el dedo el contorno de lo que quieres conservar <button onclick="terminarRecorte(false)">Cancelar</button>');
}
function dibujarLazo(){
  const ctx = canvas.contextTop, pts = recorte.pts; canvas.clearContext(ctx);
  ctx.save(); ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p.x * zoom, p.y * zoom) : ctx.moveTo(p.x * zoom, p.y * zoom));
  ctx.fillStyle = 'rgba(25,200,255,.12)'; ctx.fill();
  ctx.strokeStyle = '#19c8ff'; ctx.lineWidth = 3; ctx.setLineDash([7, 5]); ctx.stroke();
  ctx.restore();
}
function aplicarLazo(pts){
  const img = recorte.img, inv = fabric.util.invertTransform(img.calcTransformMatrix());
  const loc = [];
  pts.forEach(p => { const q = fabric.util.transformPoint(p, inv), u = loc[loc.length - 1]; if (!u || Math.hypot(q.x - u.x, q.y - u.y) > 1.5) loc.push({ x:q.x, y:q.y }); });
  if (loc.length < 6){ toast('Dibuja un contorno más grande'); return; }
  img.clipPath = new fabric.Polygon(loc, { fill:'#000', stroke:null, strokeWidth:0, objectCaching:false });
  img.dirty = true;
  terminarRecorte(true);
  toast('Recorte libre aplicado. “Quitar recorte” lo deshace.');
}
// ---------- Quitar fondo ----------
const distColor = (d, i, r, g, b) => Math.sqrt((d[i] - r) ** 2 + (d[i + 1] - g) ** 2 + (d[i + 2] - b) ** 2);
async function procesarFondo(img, semillas){
  const tol = +$('bgTol').value;
  const src = img._originalElement || img._element;
  const nw = src.naturalWidth || src.width, nh = src.naturalHeight || src.height;
  const k = Math.min(1, 2400 / Math.max(nw, nh));
  const cw = Math.max(1, Math.round(nw * k)), ch = Math.max(1, Math.round(nh * k));
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d', { willReadFrequently:true }); g.drawImage(src, 0, 0, cw, ch);
  let data;
  try { data = g.getImageData(0, 0, cw, ch); }
  catch (e) { toast('Esta imagen no se puede editar porque viene de otro sitio. Descárgala y súbela desde tu computadora.'); return null; }
  const d = data.data, N = cw * ch;
  // colores de referencia
  let refs = [], inicio = [];
  if (semillas){
    semillas.forEach(s => {
      const x = Math.max(0, Math.min(cw - 1, Math.round(s.x * k))), y = Math.max(0, Math.min(ch - 1, Math.round(s.y * k)));
      const i = (y * cw + x) * 4;
      if (d[i + 3] < 20){ return; }
      refs.push([d[i], d[i + 1], d[i + 2]]); inicio.push(y * cw + x);
    });
    if (!refs.length){ toast('Esa zona ya es transparente'); return null; }
  } else {
    const cuenta = new Map(), borde = [];
    for (let x = 0; x < cw; x++){ borde.push(x, (ch - 1) * cw + x); }
    for (let y = 1; y < ch - 1; y++){ borde.push(y * cw, y * cw + cw - 1); }
    let opacos = 0;
    borde.forEach(p => { const i = p * 4; if (d[i + 3] < 20) return; opacos++; const q = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4); cuenta.set(q, (cuenta.get(q) || 0) + 1); });
    if (!opacos){ toast('Esta imagen ya no tiene fondo en los bordes'); return null; }
    [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([q, n]) => {
      if (n / opacos < 0.08 && refs.length) return;
      refs.push([((q >> 8) & 15) * 16 + 8, ((q >> 4) & 15) * 16 + 8, (q & 15) * 16 + 8]);
    });
    inicio = borde;
  }
  const lim = tol * 1.6;
  const parecido = p => { const i = p * 4; if (d[i + 3] < 20) return true; for (const [r, gg, b] of refs) if (distColor(d, i, r, gg, b) <= lim) return true; return false; };
  // relleno por inundación desde las semillas
  const quitar = new Uint8Array(N), pila = new Int32Array(N); let tope = 0;
  inicio.forEach(p => { if (!quitar[p] && parecido(p)){ quitar[p] = 1; pila[tope++] = p; } });
  while (tope){
    const p = pila[--tope], x = p % cw;
    const vec = [x > 0 ? p - 1 : -1, x < cw - 1 ? p + 1 : -1, p - cw, p + cw];
    for (const q of vec){ if (q >= 0 && q < N && !quitar[q] && parecido(q)){ quitar[q] = 1; pila[tope++] = q; } }
  }
  let borrados = 0;
  for (let p = 0; p < N; p++) if (quitar[p]){ if (d[p * 4 + 3] >= 20) borrados++; d[p * 4 + 3] = 0; }
  // bordes suaves: los pixeles junto a lo borrado y parecidos al fondo quedan semitransparentes
  for (let p = 0; p < N; p++){
    if (quitar[p]) continue;
    const x = p % cw;
    if (!((x > 0 && quitar[p - 1]) || (x < cw - 1 && quitar[p + 1]) || (p >= cw && quitar[p - cw]) || (p + cw < N && quitar[p + cw]))) continue;
    const i = p * 4; let m = Infinity;
    for (const [r, gg, b] of refs) m = Math.min(m, distColor(d, i, r, gg, b));
    const f = Math.max(0.2, Math.min(1, (m - lim) / lim));
    d[i + 3] = Math.round(d[i + 3] * f);
  }
  if (!borrados){ toast('No encontré fondo para quitar con esa tolerancia. Prueba subirla.'); return null; }
  g.putImageData(data, 0, 0);
  const antes = { c:img.getCenterPoint(), cropX:img.cropX || 0, cropY:img.cropY || 0, width:img.width, height:img.height, sx:img.scaleX, sy:img.scaleY };
  await new Promise(ok => img.setSrc(cv.toDataURL('image/png'), ok));
  img.set({ cropX:antes.cropX * k, cropY:antes.cropY * k, width:antes.width * k, height:antes.height * k, scaleX:antes.sx / k, scaleY:antes.sy / k });
  if (img.filters && img.filters.length) img.applyFilters();
  img.setPositionByOrigin(antes.c, 'center', 'center'); img.setCoords(); img.dirty = true;
  canvas.requestRenderAll();
  return borrados / N;
}
async function quitarFondoImagen(){
  const img = imagenActiva(); if (!img) return;
  terminarRecorte(false);
  cargando(true);
  try {
    const f = await procesarFondo(img, null);
    if (f != null){ guardarEstado(); actualizarPanel(); toast('Fondo quitado (' + Math.round(f * 100) + '% de la imagen). Si quitó de más, deshaz con Ctrl+Z y baja la tolerancia.'); }
  } catch (e) { console.error(e); toast('No se pudo quitar el fondo: ' + e.message); }
  finally { cargando(false); }
}
function iniciarBorrarZona(){
  const img = imagenActiva(); if (!img) return;
  terminarRecorte(false);
  recorte = { tipo:'zona', img };
  bloquearOtros(img, true); canvas.discardActiveObject(); canvas.defaultCursor = 'crosshair'; canvas.requestRenderAll();
  avisoRecorte('👆 Toca o haz clic en la zona de color que quieres borrar (puedes tocar varias) <button onclick="terminarRecorte(true)">✓ Listo</button>');
}
async function borrarZonaEn(p){
  const img = recorte.img, q = fabric.util.transformPoint(p, fabric.util.invertTransform(img.calcTransformMatrix()));
  if (Math.abs(q.x) > img.width / 2 || Math.abs(q.y) > img.height / 2){ toast('Toca dentro de la imagen'); return; }
  cargando(true);
  try {
    const f = await procesarFondo(img, [{ x:(img.cropX || 0) + q.x + img.width / 2, y:(img.cropY || 0) + q.y + img.height / 2 }]);
    if (f != null) toast('Zona borrada. Toca otra o pulsa ✓ Listo.');
  } catch (e) { console.error(e); toast('No se pudo borrar: ' + e.message); }
  finally { cargando(false); }
}
// ---------- Eventos del lienzo durante los modos ----------
canvas.on('mouse:down', e => {
  if (!recorte || recorte.tipo === 'rect') return;
  const p = canvas.getPointer(e.e);
  if (recorte.tipo === 'zona'){ borrarZonaEn(p); return; }
  recorte.pts = [p];
});
canvas.on('mouse:move', e => {
  if (!recorte || recorte.tipo !== 'libre' || !recorte.pts) return;
  const p = canvas.getPointer(e.e), u = recorte.pts[recorte.pts.length - 1];
  if (Math.hypot(p.x - u.x, p.y - u.y) > 2 / zoom){ recorte.pts.push(p); dibujarLazo(); }
});
canvas.on('mouse:up', () => {
  if (!recorte || recorte.tipo !== 'libre' || !recorte.pts) return;
  const pts = recorte.pts; recorte.pts = null; canvas.clearContext(canvas.contextTop);
  if (pts.length < 8){ toast('Dibuja un contorno más grande alrededor de lo que quieres conservar'); return; }
  aplicarLazo(pts);
});
canvas.on('selection:cleared', () => { if (recorte && recorte.tipo === 'rect') canvas.setActiveObject(recorte.ov); });
window.addEventListener('keydown', e => {
  if (!recorte) return;
  if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); terminarRecorte(recorte.tipo === 'zona'); }
  else if (e.key === 'Enter' && recorte.tipo === 'rect'){ e.preventDefault(); e.stopPropagation(); aplicarRecorteRect(); }
  else if (['Delete', 'Backspace'].includes(e.key)){ e.preventDefault(); e.stopPropagation(); }
}, true);


/* =========================================================
   GRÁFICAS EDITABLES
   ========================================================= */
const PALETAS_GRAF = {
  'Vibrante':['#7c3aed','#f97316','#06b6d4','#10b981','#ec4899','#eab308'],
  'Pastel':['#a78bfa','#fda4af','#7dd3fc','#86efac','#fcd34d','#f9a8d4'],
  'Escolar':['#1e3a8a','#2563eb','#0891b2','#0d9488','#4f46e5','#0284c7'],
  'Cálida':['#dc2626','#ea580c','#d97706','#ca8a04','#b45309','#9a3412'],
  'Natural':['#166534','#65a30d','#ca8a04','#0f766e','#4d7c0f','#a16207']
};
Object.keys(PALETAS_GRAF).forEach(n => { const op = document.createElement('option'); op.value = n; op.textContent = n; $('gPaleta').appendChild(op); });
function leerDatos(texto){
  return texto.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^(.*?)[,;:\t]\s*(-?[\d.]+)\s*%?\s*$/);
    return m ? { e: m[1].trim(), v: parseFloat(m[2]) || 0 } : null;
  }).filter(Boolean);
}
const numBonito = max => { if (max <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(max))), n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
const fmtNum = v => Number.isInteger(v) ? String(v) : v.toFixed(1);
function sector(cx, cy, R, r, a0, a1){
  if (a1 - a0 >= 2 * Math.PI - 1e-6) a1 = a0 + 2 * Math.PI - 0.0005;
  const grande = (a1 - a0) > Math.PI ? 1 : 0;
  const pt = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  if (r <= 0) return `M ${cx} ${cy} L ${pt(R, a0)} A ${R} ${R} 0 ${grande} 1 ${pt(R, a1)} Z`;
  return `M ${pt(R, a0)} A ${R} ${R} 0 ${grande} 1 ${pt(R, a1)} L ${pt(r, a1)} A ${r} ${r} 0 ${grande} 0 ${pt(r, a0)} Z`;
}
// Arma todas las piezas de una gráfica dentro de una tarjeta de w × h
function construirGrafica(d){
  const w = d.w, hh = d.h, cols = PALETAS_GRAF[d.paleta] || PALETAS_GRAF.Vibrante;
  const datos = d.datos.length ? d.datos : [{ e:'Dato', v:1 }];
  const fs = Math.max(13, hh * 0.042), objs = [];
  const txt = (t, x, y, o = {}) => new fabric.Text(String(t), { left:x, top:y, originX:o.ox || 'center', originY:'center',
    fontFamily:'Poppins', fontSize:o.s || fs, fill:o.c || '#374151', fontWeight:o.b || '400' });
  objs.push(new fabric.Rect({ left:0, top:0, width:w, height:hh, fill:'#ffffff', rx:16, ry:16, stroke:'#e5e7eb', strokeWidth:2 }));
  let arriba = fs * 1.3;
  if (d.titulo){ objs.push(txt(d.titulo, w/2, fs * 1.5, { s: fs * 1.35, b:'700', c:'#1f2330' })); arriba = fs * 3.1; }
  if (d.tipo === 'barras' || d.tipo === 'lineas'){
    const L = fs * 3.4, R = w - fs * 1.4, T = arriba + fs * 0.6, B = hh - fs * 2.6;
    const max = numBonito(Math.max(0, ...datos.map(x => x.v)));
    for (let i = 0; i <= 4; i++){
      const y = B - (B - T) * i / 4;
      objs.push(new fabric.Line([L, y, R, y], { stroke: i ? '#eef0f3' : '#cbd5e1', strokeWidth:2 }));
      objs.push(txt(fmtNum(max * i / 4), L - fs * 0.5, y, { ox:'right', s: fs * 0.8, c:'#6b7280' }));
    }
    const n = datos.length, slot = (R - L) / n;
    if (d.tipo === 'barras'){
      datos.forEach((x, i) => {
        const bh = (B - T) * Math.max(0, x.v) / max, bw = slot * 0.62, bx = L + slot * i + (slot - bw) / 2, rr = Math.min(10, bw / 4);
        objs.push(new fabric.Rect({ left:bx, top:B - Math.max(1, bh), width:bw, height:Math.max(1, bh), fill:cols[i % cols.length], rx:rr, ry:rr }));
        if (d.valores) objs.push(txt(fmtNum(x.v), bx + bw/2, B - bh - fs * 0.75, { b:'600', c:'#1f2330', s: fs * 0.9 }));
        objs.push(txt(x.e, L + slot * (i + 0.5), B + fs * 1.15, { s: fs * 0.85 }));
      });
    } else {
      const pts = datos.map((x, i) => ({ x: L + slot * (i + 0.5), y: B - (B - T) * Math.max(0, x.v) / max }));
      objs.push(new fabric.Polyline(pts, { fill:null, stroke:cols[0], strokeWidth:Math.max(3, fs * 0.22), strokeLineJoin:'round', strokeLineCap:'round', objectCaching:false }));
      pts.forEach((q, i) => {
        objs.push(new fabric.Circle({ left:q.x, top:q.y, radius:fs * 0.33, originX:'center', originY:'center', fill:'#ffffff', stroke:cols[0], strokeWidth:Math.max(2, fs * 0.16) }));
        if (d.valores) objs.push(txt(fmtNum(datos[i].v), q.x, q.y - fs * 0.95, { b:'600', c:'#1f2330', s: fs * 0.85 }));
        objs.push(txt(datos[i].e, q.x, B + fs * 1.15, { s: fs * 0.85 }));
      });
    }
  } else {
    const total = datos.reduce((t, x) => t + Math.max(0, x.v), 0) || 1;
    const R = Math.max(20, Math.min(w * 0.28, (hh - arriba) / 2 - fs * 0.6)), cx = w * 0.33, cy = arriba + (hh - arriba) / 2 - fs * 0.2;
    let a = -Math.PI / 2;
    datos.forEach((x, i) => {
      const frac = Math.max(0, x.v) / total; if (frac <= 0) return;
      const a1 = a + frac * 2 * Math.PI;
      objs.push(new fabric.Path(sector(cx, cy, R, d.tipo === 'dona' ? R * 0.56 : 0, a, a1), { fill:cols[i % cols.length], stroke:'#ffffff', strokeWidth:3 }));
      if (d.valores && frac > 0.045){
        const am = (a + a1) / 2, rr = d.tipo === 'dona' ? R * 0.78 : R * 0.62;
        objs.push(txt(Math.round(frac * 100) + '%', cx + Math.cos(am) * rr, cy + Math.sin(am) * rr, { c:'#ffffff', b:'700', s: fs * 0.85 }));
      }
      a = a1;
    });
    const x0 = w * 0.66, paso = Math.min(fs * 1.9, (hh - arriba - fs) / datos.length);
    datos.forEach((x, i) => {
      const y = arriba + fs * 0.9 + i * paso;
      objs.push(new fabric.Rect({ left:x0, top:y - fs * 0.4, width:fs * 0.8, height:fs * 0.8, rx:4, ry:4, fill:cols[i % cols.length] }));
      objs.push(txt(x.e + (d.valores ? ' (' + fmtNum(x.v) + ')' : ''), x0 + fs * 1.3, y, { ox:'left', s: fs * 0.85 }));
    });
  }
  return objs;
}
function grupoGrafica(d){
  const g = new fabric.Group(construirGrafica(d), { originX:'center', originY:'center' });
  g.grafica = d; g.name = 'Gráfica'; g.id = nuevoId();
  return g;
}
function insertarGrafica(tipo){
  const k = s();
  const d = { tipo, titulo:'Título de la gráfica', paleta:'Vibrante', valores:true, w:760 * k, h:500 * k,
    datos: tipo === 'pastel' || tipo === 'dona'
      ? [{e:'Opción A',v:40},{e:'Opción B',v:25},{e:'Opción C',v:20},{e:'Otras',v:15}]
      : [{e:'Ene',v:12},{e:'Feb',v:19},{e:'Mar',v:15},{e:'Abr',v:24},{e:'May',v:21}] };
  const g = grupoGrafica(d);
  g.setPositionByOrigin(new fabric.Point(W/2, H/2), 'center', 'center');
  agregar(g, 'Gráfica');
}
// Vuelve a dibujar la gráfica seleccionada con los cambios, en el mismo lugar y tamaño
function actualizarGrafica(cambios, guardar = true){
  const o = activo(); if (!o || !o.grafica) return;
  const g = grupoGrafica({ ...o.grafica, ...cambios });
  g.set({ scaleX:o.scaleX, scaleY:o.scaleY, angle:o.angle, opacity:o.opacity, shadow:o.shadow, id:o.id, flipX:o.flipX, flipY:o.flipY });
  g.setPositionByOrigin(o.getCenterPoint(), 'center', 'center'); g.setCoords();
  const idx = canvas.getObjects().indexOf(o);
  restaurando = true; canvas.remove(o); canvas.insertAt(g, idx); restaurando = false;
  canvas.setActiveObject(g); canvas.requestRenderAll(); actualizarPanel();
  clearTimeout(actualizarGrafica._t);
  if (guardar) actualizarGrafica._t = setTimeout(() => { guardarEstado(); renderCapas(); }, 400);
}
document.querySelectorAll('#tiposGraf .pb').forEach(b => b.onclick = () => actualizarGrafica({ tipo:b.dataset.t }));
$('gTitulo').addEventListener('input', e => actualizarGrafica({ titulo:e.target.value }));
$('gDatos').addEventListener('input', e => { const d = leerDatos(e.target.value); if (d.length) actualizarGrafica({ datos:d }); });
$('gPaleta').addEventListener('change', e => actualizarGrafica({ paleta:e.target.value }));
$('gValores').addEventListener('change', e => actualizarGrafica({ valores:e.target.checked }));


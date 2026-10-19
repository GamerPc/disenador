/* =========================================================
   DECORACIONES (estilo dibujado a mano)
   ========================================================= */
function pathLlave(alto, ancho){
  const a = ancho, hh = alto;
  return `M ${a} 0 C ${a*0.45} 0 ${a*0.5} ${hh*0.04} ${a*0.5} ${hh*0.12} L ${a*0.5} ${hh*0.4} C ${a*0.5} ${hh*0.47} ${a*0.3} ${hh*0.5} 0 ${hh*0.5} ` +
         `C ${a*0.3} ${hh*0.5} ${a*0.5} ${hh*0.53} ${a*0.5} ${hh*0.6} L ${a*0.5} ${hh*0.88} C ${a*0.5} ${hh*0.96} ${a*0.45} ${hh} ${a} ${hh}`;
}
const pathFlor = (() => {
  const circ = (x, y, r) => `M ${x - r} ${y} A ${r} ${r} 0 1 0 ${x + r} ${y} A ${r} ${r} 0 1 0 ${x - r} ${y} Z `;
  return [[50,22],[78,42],[67,75],[33,75],[22,42]].map(([x, y]) => circ(x, y, 17)).join('') + circ(50, 52, 12);
})();
const pathEstrella5 = 'M ' + puntosEstrella(5, 50, 21).map(q => `${(q.x + 50).toFixed(1)} ${(q.y + 50).toFixed(1)}`).join(' L ') + ' Z';
const DECOS = {
  destello:  { n:'Destello', d:'M50 0 C53 35 65 47 100 50 C65 53 53 65 50 100 C47 65 35 53 0 50 C35 47 47 35 50 0 Z' },
  estrella:  { n:'Estrella', d:pathEstrella5 },
  corazon:   { n:'Corazón', d:'M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 47 14 50 22 C53 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z' },
  flor:      { n:'Flor', d:pathFlor },
  nube:      { n:'Nube', d:PATH_NUBE },
  mancha:    { n:'Mancha', d:PATH_BLOB },
  foco:      { n:'Foco', d:'M12 2 C8.1 2 5 5.1 5 9 C5 11.4 6.2 13.5 8 14.7 L8 17 L16 17 L16 14.7 C17.8 13.5 19 11.4 19 9 C19 5.1 15.9 2 12 2 Z M9 18 L15 18 L15 20 L9 20 Z M10 21 L14 21 L14 22 L10 22 Z' },
  confeti:   { n:'Confeti', d:'M10 10 L18 10 L18 18 L10 18 Z M40 5 L46 15 L34 15 Z M65 15 A5 5 0 1 0 75 15 A5 5 0 1 0 65 15 Z M25 40 L35 40 L35 44 L25 44 Z M60 45 L68 49 L60 53 Z M85 35 L89 31 L93 35 L89 39 Z' },
  flecha:    { n:'Flecha dibujada', trazo:true, d:'M5 60 C30 15 70 10 92 42 M80 40 L92 42 L90 29' },
  rizo:      { n:'Flecha con rizo', trazo:true, d:'M5 70 C25 70 40 55 35 40 C30 25 10 35 20 48 C30 60 60 60 75 35 M66 35 L76 33 L78 43' },
  subrayado: { n:'Subrayado', trazo:true, d:'M0 10 Q10 0 20 10 T40 10 T60 10 T80 10 T100 10' },
  marcador:  { n:'Círculo de marcador', trazo:true, d:'M50 8 C80 6 98 22 96 42 C94 62 70 72 45 70 C18 68 2 52 6 34 C9 18 30 6 58 10' },
  llave:     { n:'Llave', trazo:true, d:pathLlave(100, 30) },
  enfasis:   { n:'Énfasis', trazo:true, d:'M10 30 L2 16 M22 24 L19 4 M34 28 L42 12' },
  espiral:   { n:'Espiral', trazo:true, d:'M50 50 C50 44 58 44 58 50 C58 60 42 60 42 50 C42 36 66 36 66 50 C66 68 34 68 34 50 C34 28 74 28 74 50' },
  cinta:     { n:'Cinta adhesiva', rect:true }
};
function crearDeco(tipo, o = {}){
  const def = DECOS[tipo], color = o.c || $('colorDeco').value, w = o.w || 200 * s();
  let obj;
  if (def.rect) obj = new fabric.Rect({ width:w, height:w * 0.27, fill:color, opacity: o.op ?? 0.6, angle: o.ang ?? -6, originX:'center', originY:'center' });
  else {
    obj = new fabric.Path(def.d, { originX:'center', originY:'center', fill: def.trazo ? null : color, stroke: def.trazo ? color : null,
      strokeWidth: def.trazo ? (o.sw || 5 * s()) : 0, strokeLineCap:'round', strokeLineJoin:'round', strokeUniform:true,
      opacity: o.op ?? 1, angle: o.ang || 0 });
    obj.scaleToWidth(w);
  }
  obj.set({ name: def.n, esDeco: true });
  return obj;
}
Object.entries(DECOS).forEach(([tipo, def]) => {
  const b = document.createElement('button'); b.className = 'forma'; b.title = def.n;
  let svg;
  if (def.rect) svg = '<svg viewBox="0 0 100 100"><rect x="8" y="36" width="84" height="26" transform="rotate(-8 50 50)" style="fill:#f9a8d4;opacity:.8"/></svg>';
  else {
    const tmp = new fabric.Path(def.d);
    const vb = `${(tmp.pathOffset.x - tmp.width/2 - 8).toFixed(1)} ${(tmp.pathOffset.y - tmp.height/2 - 8).toFixed(1)} ${(tmp.width + 16).toFixed(1)} ${(tmp.height + 16).toFixed(1)}`;
    const est = def.trazo ? `fill:none;stroke:#6d6f7b;stroke-width:${Math.max(tmp.width, tmp.height) / 18};stroke-linecap:round;stroke-linejoin:round` : 'fill:#6d6f7b';
    svg = `<svg viewBox="${vb}"><path d="${def.d}" style="${est}"/></svg>`;
  }
  b.innerHTML = svg;
  b.onclick = () => { const d = crearDeco(tipo); d.setPositionByOrigin(new fabric.Point(W/2, H/2), 'center', 'center'); agregar(d, def.n); };
  $('gridDecos').appendChild(b);
});

/* ---------- Fondos de papel ---------- */
function fondoPapel(tipo, base){
  base = base || $('colorFondo').value || '#ffffff';
  const k = s(), t = Math.max(12, Math.round(40 * k));
  const cv = document.createElement('canvas'); cv.width = cv.height = t;
  const g = cv.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, t, t);
  g.strokeStyle = esOscuro(base) ? 'rgba(255,255,255,.18)' : 'rgba(30,58,138,.15)'; g.lineWidth = Math.max(1, k);
  if (tipo === 'cuadros'){ g.beginPath(); g.moveTo(0, 0.5); g.lineTo(t, 0.5); g.moveTo(0.5, 0); g.lineTo(0.5, t); g.stroke(); }
  if (tipo === 'rayas'){ g.beginPath(); g.moveTo(0, t - 0.5); g.lineTo(t, t - 0.5); g.stroke(); }
  if (tipo === 'puntos'){ g.fillStyle = esOscuro(base) ? 'rgba(255,255,255,.3)' : 'rgba(30,41,59,.25)'; g.beginPath(); g.arc(t/2, t/2, Math.max(1.5, 2.2 * k), 0, Math.PI * 2); g.fill(); }
  const antes = restaurando;
  restaurando = true; quitarRectFondo();
  canvas.backgroundColor = base;
  fijarFondo(new fabric.Rect({ left:0, top:0, width:W, height:H, fill: new fabric.Pattern({ source: cv, repeat: 'repeat' }) }));
  restaurando = antes;
  if (!antes){ guardarEstado(); renderCapas(); }
}


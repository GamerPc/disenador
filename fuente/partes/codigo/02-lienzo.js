/* =========================================================
   LIENZO
   ========================================================= */
fabric.filterBackend = new fabric.Canvas2dFilterBackend();
Object.assign(fabric.Object.prototype, {
  transparentCorners:false, cornerColor:'#0f1218', cornerStrokeColor:'#19c8ff',
  borderColor:'#19c8ff', cornerStyle:'circle', cornerSize:11, padding:4
});
let canvas = new fabric.Canvas('lienzo', {
  preserveObjectStacking:true, backgroundColor:'#ffffff', selectionColor:'rgba(25,200,255,.08)',
  selectionBorderColor:'#19c8ff'
});

/* Conector: une dos elementos. Tipos: recta, curva, codo. Puntas: nada, flecha, abierta, círculo, rombo.
   Trazo: sólido, guiones o puntos. Puede llevar un texto (palabra de enlace) a la mitad. */
fabric.Conector = fabric.util.createClass(fabric.Line, {
  type: 'conector',
  _render(ctx){
    const p = this.calcLinePoints(), est = this.estilo || 'recta';
    const d = this.desvio || { x:0, y:0 };          // doblez que el usuario le dio con el punto de en medio
    const mx0 = (p.x1 + p.x2) / 2, my0 = (p.y1 + p.y2) / 2;
    const mx = mx0 + (est !== 'recta' && !this.horiz ? 0 : d.x), my = my0 + (est !== 'recta' && this.horiz ? 0 : d.y);
    let ax = p.x1, ay = p.y1, bx = p.x2, by = p.y2;   // a: antes del final · b: después del inicio
    ctx.beginPath(); ctx.moveTo(p.x1, p.y1);
    if (this.modo && est !== 'recta'){
      const cx = this.modo === 'vh' ? p.x1 : p.x2, cy = this.modo === 'vh' ? p.y2 : p.y1;
      if (est === 'codo') this._poli(ctx, [{x:p.x1,y:p.y1}, {x:cx,y:cy}, {x:p.x2,y:p.y2}]);
      else ctx.quadraticCurveTo(cx, cy, p.x2, p.y2);
      ax = bx = cx; ay = by = cy;
    } else if (est === 'codo'){
      if (this.horiz){ this._poli(ctx, [{x:p.x1,y:p.y1}, {x:mx,y:p.y1}, {x:mx,y:p.y2}, {x:p.x2,y:p.y2}]); bx = mx; by = p.y1; ax = mx; ay = p.y2; }
      else { this._poli(ctx, [{x:p.x1,y:p.y1}, {x:p.x1,y:my}, {x:p.x2,y:my}, {x:p.x2,y:p.y2}]); bx = p.x1; by = my; ax = p.x2; ay = my; }
    } else if (est === 'curva'){
      if (this.horiz){ ctx.bezierCurveTo(mx, p.y1, mx, p.y2, p.x2, p.y2); bx = mx; by = p.y1; ax = mx; ay = p.y2; }
      else { ctx.bezierCurveTo(p.x1, my, p.x2, my, p.x2, p.y2); bx = p.x1; by = my; ax = p.x2; ay = my; }
    } else if (d.x || d.y){   // recta doblada: curva que pasa por el punto de en medio
      const qx = mx0 + 2 * d.x, qy = my0 + 2 * d.y;
      ctx.quadraticCurveTo(qx, qy, p.x2, p.y2); ax = bx = qx; ay = by = qy;
    } else ctx.lineTo(p.x2, p.y2);
    if (ax === p.x2 && ay === p.y2){ ax = p.x1; ay = p.y1; }
    if (bx === p.x1 && by === p.y1){ bx = p.x2; by = p.y2; }
    const sw = this.strokeWidth;
    if (this.patron) this.strokeDashArray = this.patron === 'guiones' ? [sw * 3, sw * 2] : this.patron === 'puntos' ? [0.01, sw * 2] : null;
    ctx.lineJoin = 'round';
    this._renderStroke(ctx);
    const fin = this.fin || (this.flecha ? 'flecha' : 'nada');
    this._punta(ctx, fin, p.x2, p.y2, Math.atan2(p.y2 - ay, p.x2 - ax));
    this._punta(ctx, this.inicio || 'nada', p.x1, p.y1, Math.atan2(p.y1 - by, p.x1 - bx));
    if (this.etiqueta){
      const tam = Math.max(14, this.etiquetaTam || sw * 5 + 14);
      ctx.save();
      ctx.font = `600 ${tam}px Inter, Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(this.etiqueta).width + tam * 0.8, hh = tam * 1.5;
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fillRect(mx - w/2, my - hh/2, w, hh);
      ctx.fillStyle = this.stroke; ctx.fillText(this.etiqueta, mx, my + 1);
      ctx.restore();
    }
  },
  // dibuja una línea quebrada con las vueltas redondeadas
  _poli(ctx, pts){
    const r0 = Math.max(10, this.strokeWidth * 3 + 8);
    for (let i = 1; i < pts.length - 1; i++){
      const a = pts[i-1], b = pts[i], c = pts[i+1];
      const r = Math.min(r0, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2);
      if (r < 0.5) ctx.lineTo(b.x, b.y); else ctx.arcTo(b.x, b.y, c.x, c.y, r);
    }
    ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
  },
  _punta(ctx, tipo, x, y, ang){
    if (!tipo || tipo === 'nada') return;
    const t = Math.max(14, this.strokeWidth * 4);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = this.stroke; ctx.strokeStyle = this.stroke; ctx.lineWidth = this.strokeWidth;
    ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (tipo === 'flecha'){ ctx.moveTo(0, 0); ctx.lineTo(-t, t*0.55); ctx.lineTo(-t, -t*0.55); ctx.closePath(); ctx.fill(); }
    else if (tipo === 'abierta'){ ctx.moveTo(-t, t*0.6); ctx.lineTo(0, 0); ctx.lineTo(-t, -t*0.6); ctx.stroke(); }
    else if (tipo === 'circulo'){ ctx.arc(-t*0.42, 0, t*0.42, 0, Math.PI * 2); ctx.fill(); }
    else if (tipo === 'rombo'){ ctx.moveTo(0, 0); ctx.lineTo(-t*0.6, t*0.45); ctx.lineTo(-t*1.2, 0); ctx.lineTo(-t*0.6, -t*0.45); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
});
fabric.Conector.fromObject = function(obj, cb){
  const o = fabric.util.object.clone(obj, true);
  const l = new fabric.Conector([o.x1, o.y1, o.x2, o.y2], o);
  cb && cb(l); return l;
};

function establecerZoom(z){
  zoom = Math.max(0.05, Math.min(z, 4));
  canvas.setZoom(zoom);
  canvas.setDimensions({ width: Math.round(W*zoom), height: Math.round(H*zoom) });
  $('zoomTxt').textContent = Math.round(zoom*100) + '%';
}
function ajustarZoom(){
  const a = $('area');
  establecerZoom(Math.min((a.clientWidth-80)/W, (a.clientHeight-80)/H));
  a.scrollLeft = a.scrollTop = 0;
}
function cambiarZoom(d){ establecerZoom(zoom + d); }
window.addEventListener('resize', () => { const o = canvas.getActiveObject(); if (o && o.isEditing) return; ajustarZoom(); });  // no se mueve mientras escribes (teclado del celular)

function fijarTamano(w, h){
  W = Math.round(w); H = Math.round(h);
  $('tamTxt').textContent = W + ' × ' + H;
  ajustarZoom(); miniaturas = [];
}
function cambiarTamano(w, h){
  fijarTamano(w, h);
  const f = canvas.getObjects().find(o => o.esFondo);
  if (f) ajustarRectFondo(f);
  canvas.requestRenderAll();
  guardarEstado();
}


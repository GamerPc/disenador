/* =========================================================
   RECORTAR IMAGEN EN FORMA
   ========================================================= */
function recortar(forma){
  const o = activo(); if (!o || o.type !== 'image') return;
  if (o.marco){ o.marco.tipo = { circulo:'circulo', cuadrado:'rect', redondo:'redondo', estrella:'estrella' }[forma] || 'rect'; ajustarFoto(o); canvas.requestRenderAll(); actualizarPanel(); guardarEstado(); return; }
  const w = o.width, h = o.height, m = Math.min(w, h);
  const base = { originX:'center', originY:'center', left:0, top:0 };
  let c = null;
  if (forma === 'circulo')  c = new fabric.Circle({ ...base, radius: m/2 });
  if (forma === 'cuadrado') c = new fabric.Rect({ ...base, width: m, height: m });
  if (forma === 'redondo')  c = new fabric.Rect({ ...base, width: w, height: h, rx: m*0.12, ry: m*0.12 });
  if (forma === 'estrella') c = new fabric.Polygon(puntosEstrella(5, m/2, m/4.6), base);
  o.clipPath = c; o.dirty = true;
  canvas.requestRenderAll(); guardarEstado();
}


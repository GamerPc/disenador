/* =========================================================
   FORMAS
   ========================================================= */
function puntosEstrella(n, R, r){
  const p = [];
  for (let i = 0; i < n*2; i++){
    const rad = i % 2 ? r : R, a = Math.PI/n*i - Math.PI/2;
    p.push({ x: rad*Math.cos(a), y: rad*Math.sin(a) });
  }
  return p;
}
function puntosPoligono(n, R){
  const p = [];
  for (let i = 0; i < n; i++){ const a = 2*Math.PI/n*i - Math.PI/2; p.push({ x:R*Math.cos(a), y:R*Math.sin(a) }); }
  return p;
}
function agregarForma(tipo){
  const k = s(), color = $('colorForma').value;
  const base = { left:W/2, top:H/2, originX:'center', originY:'center', fill:color, strokeWidth:0, stroke:null };
  let o, nombre;
  switch (tipo){
    case 'rect': o = new fabric.Rect({ ...base, width:320*k, height:320*k }); nombre='Rectángulo'; break;
    case 'redondo': o = new fabric.Rect({ ...base, width:320*k, height:320*k, rx:40*k, ry:40*k }); nombre='Rectángulo'; break;
    case 'circulo': o = new fabric.Circle({ ...base, radius:160*k }); nombre='Círculo'; break;
    case 'triangulo': o = new fabric.Triangle({ ...base, width:320*k, height:280*k }); nombre='Triángulo'; break;
    case 'estrella': o = new fabric.Polygon(puntosEstrella(5, 170*k, 70*k), base); nombre='Estrella'; break;
    case 'hexagono': o = new fabric.Polygon(puntosPoligono(6, 160*k), base); nombre='Hexágono'; break;
    case 'flecha': o = new fabric.Polygon([{x:0,y:90},{x:220,y:90},{x:220,y:20},{x:360,y:150},{x:220,y:280},{x:220,y:210},{x:0,y:210}].map(p=>({x:p.x*k,y:p.y*k})), base); nombre='Flecha'; break;
    case 'corazon':
      o = new fabric.Path('M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 47 14 50 22 C53 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z', base);
      o.scaleToWidth(320*k); nombre='Corazón'; break;
    case 'linea':
      o = new fabric.Line([0, 0, 420*k, 0], { ...base, fill:null, stroke:color, strokeWidth:8*k, strokeLineCap:'round' });
      nombre='Línea'; break;
  }
  agregar(o, nombre);
}


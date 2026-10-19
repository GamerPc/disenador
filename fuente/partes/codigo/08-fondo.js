/* =========================================================
   FONDO
   ========================================================= */
function quitarRectFondo(){ canvas.getObjects().filter(o => o.esFondo).forEach(o => canvas.remove(o)); }
function ajustarRectFondo(r){
  if (r.type === 'image'){
    const f = Math.max(W / r.width, H / r.height);
    r.set({ scaleX:f, scaleY:f, left:W/2, top:H/2, originX:'center', originY:'center' });
  } else {
    r.set({ width:W, height:H, left:0, top:0 });
    if (r.fill && r.fill.colorStops) r.set('fill', crearDegradado(r.fill.colorStops[0].color, r.fill.colorStops[r.fill.colorStops.length-1].color));
  }
  r.setCoords();
}
function crearDegradado(a, b){
  return new fabric.Gradient({ type:'linear', gradientUnits:'pixels', coords:{ x1:0, y1:0, x2:W, y2:H },
    colorStops:[{ offset:0, color:a }, { offset:1, color:b }] });
}
function fijarFondo(o){
  o.set({ selectable:false, evented:false, esFondo:true, name:'Fondo', hasControls:false });
  canvas.add(o); canvas.sendToBack(o); canvas.requestRenderAll();
}
function fondoColor(c){
  restaurando = true; quitarRectFondo(); restaurando = false;
  canvas.backgroundColor = c; $('colorFondo').value = aHex(c);
  canvas.requestRenderAll(); renderCapas(); guardarEstado();
}
function fondoDegradado(a, b){
  restaurando = true; quitarRectFondo();
  fijarFondo(new fabric.Rect({ left:0, top:0, width:W, height:H, fill:crearDegradado(a, b) }));
  restaurando = false; guardarEstado();
}
function fondoImagen(url){
  fabric.Image.fromURL(url, img => {
    restaurando = true; quitarRectFondo();
    ajustarRectFondo(img); img.fx = { b:0, c:0, s:0, bl:0 };
    fijarFondo(img); restaurando = false; guardarEstado(); renderCapas();
  });
}
function quitarFondo(){
  restaurando = true; quitarRectFondo(); restaurando = false;
  canvas.backgroundColor = null; canvas.requestRenderAll(); renderCapas(); guardarEstado();
  toast('El fondo ahora es transparente');
}
function usarComoFondo(){
  const o = activo(); if (!o || o.type !== 'image') return;
  restaurando = true; quitarRectFondo(); canvas.remove(o);
  o.set({ angle:0, flipX:false, flipY:false });
  ajustarRectFondo(o); fijarFondo(o); restaurando = false;
  canvas.discardActiveObject(); guardarEstado(); renderCapas();
}
$('colorFondo').addEventListener('input', e => { canvas.backgroundColor = e.target.value; canvas.requestRenderAll(); });
$('colorFondo').addEventListener('change', e => fondoColor(e.target.value));
$('archivoFondo').onchange = e => { leerArchivo(e.target.files[0], fondoImagen); e.target.value = ''; };

COLORES.forEach(c => { const d = document.createElement('div'); d.className='sw'; d.style.background=c; d.onclick=()=>fondoColor(c); $('swFondo').appendChild(d); });
DEGRADADOS.forEach(([a,b]) => { const d = document.createElement('div'); d.className='sw'; d.style.background=`linear-gradient(135deg,${a},${b})`; d.onclick=()=>fondoDegradado(a,b); $('swDegradado').appendChild(d); });


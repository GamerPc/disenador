/* =========================================================
   TEXTO CURVO
   ========================================================= */
// Fabric no vuelve a crear la curva al abrir un diseño guardado; aquí se la devolvemos
['IText','Textbox'].forEach(clase => {
  const original = fabric[clase].fromObject;
  fabric[clase].fromObject = function(object, callback){
    if (!object.path || object.path instanceof fabric.Path) return original.call(this, object, callback);
    const copia = Object.assign({}, object), datosCurva = copia.path; delete copia.path;
    return original.call(this, copia, t => fabric.Path.fromObject(datosCurva, pth => { t.set('path', pth); t.initDimensions(); t.setCoords(); callback && callback(t); }));
  };
});
// Curva un texto: valores positivos lo arquean hacia arriba (∩), negativos hacia abajo (∪)
function aplicarCurva(o, c, silencioso){
  let t = o;
  if (!esTexto(t) || t.textoDe || t.tabla) return;
  const centro = t.getCenterPoint();
  if (t.type === 'textbox' && c){           // un texto curvo es de un solo renglón
    const datos = t.toObject(EXTRA);
    ['type','width','height','path','styles','fill','shadow'].forEach(k => delete datos[k]);
    const nuevo = new fabric.IText(t.text.replace(/\n+/g, ' '), datos);
    nuevo.set({ fill:t.fill, shadow:t.shadow });
    nuevo.id = t.id || nuevoId(); nuevo.name = t.name;
    const idx = canvas.getObjects().indexOf(t);
    restaurando = true; canvas.remove(t); canvas.insertAt(nuevo, idx); restaurando = false;
    t = nuevo; canvas.setActiveObject(t);
  }
  t.curva = c || 0;
  t.set('path', null); t.initDimensions();
  if (c){
    const w = Math.max(10, t.width), th = Math.max(0.05, Math.abs(c) / 100 * Math.PI * 1.9), r = w / th;
    const pt = f => c > 0 ? [r * Math.sin(f), r - r * Math.cos(f)] : [r * Math.sin(f), -r + r * Math.cos(f)];
    const [x0, y0] = pt(-th / 2), [x1, y1] = pt(th / 2);
    const d = `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${th > Math.PI ? 1 : 0} ${c > 0 ? 1 : 0} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    t.set({ path: new fabric.Path(d, { fill:'', stroke:'', strokeWidth:0, objectCaching:false }), textAlign:'center', objectCaching:false, padding: t.fontSize * 0.6 });
  } else t.set({ objectCaching:true, padding:4 });
  t.setPositionByOrigin(centro, 'center', 'center'); t.setCoords();
  canvas.requestRenderAll();
  if (!silencioso){ actualizarPanel(); renderCapas(); }
}
$('pCurva').addEventListener('input', e => { const o = activo(); if (o && esTexto(o)) aplicarCurva(o, +e.target.value, true); });
$('pCurva').addEventListener('change', () => { actualizarPanel(); guardarEstado(); });
$('bSinCurva').onclick = () => { const o = activo(); if (o && esTexto(o)){ aplicarCurva(o, 0); $('pCurva').value = 0; guardarEstado(); } };


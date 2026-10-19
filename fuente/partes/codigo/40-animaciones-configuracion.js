/* =========================================================
   ANIMACIONES (configuración)
   ========================================================= */
const TIPOS_ANIM = [['ninguna','Sin animación'],['aparecer','Aparecer'],['arriba','Deslizar hacia arriba'],['abajo','Deslizar hacia abajo'],
  ['izquierda','Entrar por la izquierda'],['derecha','Entrar por la derecha'],['zoom','Acercar'],['rebote','Rebotar'],['girar','Girar'],['escribir','Escribir (texto)']];
$('aTipo').innerHTML = TIPOS_ANIM.map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
function objetivosAnim(){
  const lst = [];
  canvas.getActiveObjects().forEach(x => { const b = nodoBase(x); if (b && !b.esFondo && !lst.includes(b)) lst.push(b); });
  return lst;
}
const ordenSiguiente = () => Math.max(0, ...canvas.getObjects().map(o => (o.anim && o.anim.orden) || 0)) + 1;
function aplicarAnimacion(campos){
  const lst = objetivosAnim(); if (!lst.length) return;
  const existente = lst.find(o => o.anim);
  const orden = existente ? existente.anim.orden : ordenSiguiente();
  lst.forEach(o => {
    if (campos.tipo === 'ninguna'){ o.anim = null; return; }
    o.anim = { tipo:'arriba', inicio:'despues', duracion:700, retraso:0, orden, ...(o.anim || {}), ...campos };
  });
  actualizarPanelAnim(); guardarEstado();
}
function actualizarPanelAnim(){
  const o = activo(); if (!o) return;
  const b = nodoBase(o.type === 'activeSelection' ? (o.getObjects().find(x => !x.textoDe) || o.getObjects()[0]) : o);
  const a = (b && b.anim) || null;
  $('aTipo').value = a ? a.tipo : 'ninguna';
  $('aDetalles').hidden = !a;
  if (a){ $('aInicio').value = a.inicio; $('aDur').value = a.duracion; $('aRet').value = a.retraso; $('aOrden').value = a.orden; }
}
$('aTipo').addEventListener('change', e => aplicarAnimacion({ tipo:e.target.value }));
$('aInicio').addEventListener('change', e => aplicarAnimacion({ inicio:e.target.value }));
$('aDur').addEventListener('change', e => aplicarAnimacion({ duracion:+e.target.value }));
$('aRet').addEventListener('change', e => aplicarAnimacion({ retraso:+e.target.value }));
$('aOrden').addEventListener('change', e => aplicarAnimacion({ orden:Math.max(1, +e.target.value || 1) }));
canvas.on('selection:created', actualizarPanelAnim);
canvas.on('selection:updated', actualizarPanelAnim);

const PRESETS_ANIM = {
  dinamica:  { tipo:'arriba',   inicio:'despues', duracion:650 },
  suave:     { tipo:'aparecer', inicio:'despues', duracion:600 },
  divertida: { tipo:'rebote',   inicio:'despues', duracion:700 },
  zoom:      { tipo:'zoom',     inicio:'despues', duracion:600 },
  clic:      { tipo:'arriba',   inicio:'clic',    duracion:600 }
};
// Pone animación a todo lo de una lista de objetos, de arriba hacia abajo y de izquierda a derecha
function animarObjetos(objs, preset){
  const cand = objs.filter(o => !o.esFondo && !o.textoDe && o.type !== 'conector' && o.visible !== false);
  const caja = o => o.getBoundingRect(true, true);
  cand.sort((a, b) => { const ra = caja(a), rb = caja(b); return (Math.round(ra.top / 60) - Math.round(rb.top / 60)) || ((a.esDeco ? 1 : 0) - (b.esDeco ? 1 : 0)) || (ra.left - rb.left); });
  const tablas = {};
  let n = 0;
  cand.forEach(o => {
    if (o.tabla){                                  // las celdas de una tabla aparecen juntas
      if (!tablas[o.tabla]) tablas[o.tabla] = ++n;
      o.anim = { ...preset, retraso:0, orden:tablas[o.tabla], inicio: preset.inicio === 'clic' ? 'clic' : 'despues' };
      return;
    }
    n++;
    o.anim = { ...preset, retraso:0, orden:n, inicio: o.esDeco && n > 1 ? 'con' : preset.inicio };   // las decoraciones salen junto con lo anterior
  });
}
function cambiarPaginas(todas, fn){
  paginas[actual] = jsonPagina();
  const indices = todas ? paginas.map((_, i) => i) : [actual];
  return Promise.all(indices.map(i => i === actual ? Promise.resolve() : new Promise(ok => {
    const sc = new fabric.StaticCanvas(document.createElement('canvas'), { width:W, height:H, renderOnAddRemove:false });
    sc.loadFromJSON(paginas[i] || PAGINA_VACIA(), () => { fn(sc.getObjects()); const nt = paginas[i] && paginas[i].notas; paginas[i] = sc.toJSON(EXTRA); if (nt) paginas[i].notas = nt; sc.dispose(); ok(); });
  }))).then(() => { fn(canvas.getObjects()); canvas.requestRenderAll(); guardarEstado(); actualizarPanelAnim(); });
}
function animarPaginas(todas){
  const preset = PRESETS_ANIM[$('pEstiloAnim').value];
  cambiarPaginas(todas, objs => animarObjetos(objs, preset)).then(() => toast(todas ? 'Se animaron todas las páginas' : 'Se animó esta página'));
}
function quitarAnimaciones(){
  cambiarPaginas(true, objs => objs.forEach(o => { o.anim = null; })).then(() => toast('Se quitaron las animaciones'));
}


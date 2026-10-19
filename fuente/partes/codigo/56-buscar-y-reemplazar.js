/* =========================================================
   BUSCAR Y REEMPLAZAR
   ========================================================= */
let resultadosBusqueda = [], posBusqueda = -1;
function expresionBusqueda(){
  const q = $('bTexto').value; if (!q) return null;
  const esc_ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp($('bPalabra').checked ? '(^|[^\\wÀ-ÿ])(' + esc_ + ')(?=$|[^\\wÀ-ÿ])' : '(' + esc_ + ')', $('bMayus').checked ? 'g' : 'gi');
}
function textosDeJSON(lista, cb, ruta = []){
  (lista || []).forEach((o, i) => {
    if (typeof o.text === 'string') cb(o, ruta.concat(i));
  });
}
function buscarTextos(){
  const re = expresionBusqueda(); resultadosBusqueda = []; posBusqueda = -1;
  if (!re){ $('bInfo').textContent = 'Escribe la palabra que quieres buscar.'; return; }
  guardarPaginaActual();
  paginas.forEach((p, i) => {
    textosDeJSON(p && p.objects, (o, ruta) => {
      const n = (o.text.match(re) || []).length;
      if (n) resultadosBusqueda.push({ pagina:i, ruta, n, texto:o.text });
    });
  });
  const total = resultadosBusqueda.reduce((a, r) => a + r.n, 0), pags = new Set(resultadosBusqueda.map(r => r.pagina)).size;
  $('bInfo').textContent = total ? `${total} ${total === 1 ? 'coincidencia' : 'coincidencias'} en ${pags} ${pags === 1 ? 'página' : 'páginas'}.` : 'No se encontró en ninguna página.';
  $('bLista').innerHTML = resultadosBusqueda.slice(0, 40).map((r, k) =>
    `<div class="resBusq" data-k="${k}"><b>Pág. ${r.pagina + 1}</b> ${esc(r.texto.replace(/\s+/g, ' ').slice(0, 70))}</div>`).join('');
  $('bLista').querySelectorAll('.resBusq').forEach(d => d.onclick = () => irAResultado(+d.dataset.k));
}
function irAResultado(k){
  const r = resultadosBusqueda[k]; if (!r) return;
  posBusqueda = k;
  const seleccionar = () => {
    let o = canvas.getObjects()[r.ruta[0]];
    if (o){ canvas.setActiveObject(o); canvas.requestRenderAll(); }
  };
  if (r.pagina !== actual){ irPagina(r.pagina); setTimeout(seleccionar, 350); } else seleccionar();
}
function siguienteResultado(){
  if (!resultadosBusqueda.length) buscarTextos();
  if (!resultadosBusqueda.length) return;
  irAResultado((posBusqueda + 1) % resultadosBusqueda.length);
}
async function reemplazarTodo(){
  const re = expresionBusqueda(); if (!re) return;
  const nuevo = $('bNuevo').value, palabra = $('bPalabra').checked;
  let cambios = 0;
  cargando(true);
  try {
    await recorrerPaginas(objs => {
      const revisar = o => {
        if (typeof o.text !== 'string') return;
        const n = (o.text.match(re) || []).length; if (!n) return;
        const txt = palabra ? o.text.replace(re, (m, a, b) => a + nuevo) : o.text.replace(re, nuevo);
        if (txt.length !== o.text.length) o.styles = {};
        o.set('text', txt); if (o.initDimensions) o.initDimensions();
        if (o.textoDe){ try { ajustarFormaATexto(o); } catch(e){} }
        cambios += n;
      };
      objs.forEach(revisar);
    });
    toast(cambios ? 'Se reemplazaron ' + cambios + (cambios === 1 ? ' coincidencia' : ' coincidencias') : 'No había nada que reemplazar');
    buscarTextos();
  } catch (e) { console.error(e); toast('No se pudo reemplazar: ' + e.message); }
  finally { cargando(false); }
}
$('bTexto').addEventListener('input', () => { clearTimeout(buscarTextos._t); buscarTextos._t = setTimeout(buscarTextos, 250); });
['bMayus', 'bPalabra'].forEach(id => $(id).addEventListener('change', buscarTextos));
$('bTexto').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); siguienteResultado(); } });
function abrirBuscar(){ abrirModal('mBuscar'); setTimeout(() => { $('bTexto').focus(); $('bTexto').select(); buscarTextos(); }, 50); }


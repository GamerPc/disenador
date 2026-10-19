/* =========================================================
   CAPAS
   ========================================================= */
const iconoCapa = o => o.esFondo ? '▧' : o.tabla ? '▦' : o.grafica ? '📊' : (o.marco || o.marcoVacio) ? '📷' : o.type === 'image' ? '🖼' :
  o.trazoLibre ? '✎' : o.type === 'conector' ? '↗' : esTexto(o) ? 'T' : o.esDeco ? '✿' : o.type === 'group' ? '⧉' : '◆';
function nombreCapa(o){
  if (o.nombrePropio) return o.nombrePropio;
  if (o.esFondo) return 'Fondo';
  if (o.tabla){ const cs = celdasDe(o.tabla); return `Tabla ${Math.max(...cs.map(c => c.fila)) + 1} × ${Math.max(...cs.map(c => c.col)) + 1}`; }
  if (o.grafica) return 'Gráfica: ' + (o.grafica.titulo || o.grafica.tipo);
  if (o.type === 'conector'){
    const t = id => { const f = porId(id); if (!f) return '?'; const tt = porId(f.formaTexto); return tt && tt.text ? tt.text.split('\n')[0].slice(0, 14) : nombreCapa(f); };
    return `${t(o.conA)} → ${t(o.conB)}`;
  }
  const t = o.formaTexto ? porId(o.formaTexto) : (esTexto(o) ? o : null);
  if (t && t.text && t.text.trim()) return t.text.replace(/\n/g, ' ').slice(0, 28);
  return o.name || o.type;
}
// Lo que se mueve, oculta o bloquea junto con una capa (la forma con su texto, o la tabla completa)
function miembrosCapa(o){
  if (o.tabla) return celdasDe(o.tabla).flatMap(c => [c, porId(c.formaTexto)].filter(Boolean));
  return [o, porId(o.formaTexto)].filter(Boolean);
}
let conectoresAbiertos = false;
function renderCapas(){
  if (generandoVista) return;
  clearTimeout(renderCapas._t);
  renderCapas._t = setTimeout(() => {
    const ul = $('capas'); if (!ul) return;
    ul.innerHTML = '';
    const sel = new Set(canvas.getActiveObjects().map(nodoBase).filter(Boolean));
    const tablasSel = new Set([...sel].map(x => x.tabla).filter(Boolean));
    const tablasVistas = new Set(), conectores = [];
    let total = 0;
    canvas.getObjects().slice().reverse().forEach(o => {
      if (o.textoDe && porId(o.textoDe)) return;                 // el texto va junto con su forma
      if (o.type === 'conector'){ conectores.push(o); return; }
      if (o.tabla){ if (tablasVistas.has(o.tabla)) return; tablasVistas.add(o.tabla); }
      total++;
      ul.appendChild(filaCapa(o, sel.has(o) || (o.tabla && tablasSel.has(o.tabla))));
    });
    if (conectores.length){
      const li = document.createElement('li'); li.className = 'grupoCapa';
      li.innerHTML = `<span class="ic">${conectoresAbiertos ? '▾' : '▸'}</span><span class="cn">Líneas y conectores (${conectores.length})</span>`;
      li.onclick = () => { conectoresAbiertos = !conectoresAbiertos; renderCapas(); };
      ul.appendChild(li);
      if (conectoresAbiertos || conectores.some(c => sel.has(c))) conectores.forEach(c => { const f = filaCapa(c, sel.has(c)); f.classList.add('sub'); f.draggable = false; ul.appendChild(f); });
      total += conectores.length;
    }
    const n = $('numCapas'); if (n) n.textContent = `(${total})`;
  }, 40);
}
function filaCapa(o, seleccionado){
  o.id = o.id || nuevoId();
  const li = document.createElement('li');
  if (seleccionado) li.className = 'sel';
  li.draggable = !o.esFondo;
  li.innerHTML = `<span class="ic">${iconoCapa(o)}</span><span class="cn" title="Clic para seleccionar · doble clic para renombrar">${esc(nombreCapa(o))}</span>
    <button title="Mostrar / ocultar">${o.visible ? '👁' : '◌'}</button>
    <button title="${o.esFondo ? 'Quitar fondo' : 'Bloquear'}">${o.bloqueado || o.esFondo ? '🔒' : '🔓'}</button>`;
  const cn = li.querySelector('.cn');
  cn.onclick = () => {
    if (!o.visible || o.esFondo) return;
    if (o.tabla) seleccionarTabla(o.tabla); else { canvas.setActiveObject(o); canvas.requestRenderAll(); }
  };
  cn.ondblclick = () => {
    const nombre = prompt('Nombre de la capa:', nombreCapa(o));
    if (nombre === null) return;
    o.nombrePropio = nombre.trim() || null; renderCapas(); guardarEstado();
  };
  const [bv, bl] = li.querySelectorAll('button');
  bv.onclick = e => {
    e.stopPropagation();
    const v = !o.visible; miembrosCapa(o).forEach(x => x.visible = v);
    if (!v) canvas.discardActiveObject();
    canvas.requestRenderAll(); renderCapas(); guardarEstado();
  };
  bl.onclick = e => {
    e.stopPropagation();
    if (o.esFondo){ if (confirm('¿Quitar este fondo?')){ restaurando = true; canvas.remove(o); restaurando = false; renderCapas(); guardarEstado(); } return; }
    const v = !o.bloqueado; miembrosCapa(o).forEach(x => bloquear(x, v));
    canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado();
  };
  if (!o.esFondo){
    li.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', o.id); e.dataTransfer.effectAllowed = 'move'; li.classList.add('arrastrando'); });
    li.addEventListener('dragend', () => li.classList.remove('arrastrando'));
  }
  li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('destino'); });
  li.addEventListener('dragleave', () => li.classList.remove('destino'));
  li.addEventListener('drop', e => {
    e.preventDefault(); li.classList.remove('destino');
    const mov = porId(e.dataTransfer.getData('text/plain'));
    if (mov && mov !== o) moverCapaSobre(mov, o);
  });
  return li;
}
// Pone una capa (con su texto o su tabla completa) justo encima de otra
function moverCapaSobre(mov, destino){
  const grupo = miembrosCapa(mov), objs = canvas._objects;
  if (destino.tabla && grupo.includes(destino)) return;
  grupo.forEach(x => { const i = objs.indexOf(x); if (i >= 0) objs.splice(i, 1); });
  const ref = miembrosCapa(destino).map(x => objs.indexOf(x)).filter(i => i >= 0);
  const idx = destino.esFondo ? (ref.length ? Math.max(...ref) + 1 : 0) : Math.max(...ref) + 1;
  objs.splice(idx, 0, ...grupo);
  ordenarVinculos();
  canvas.getObjects().filter(x => x.esFondo).forEach(x => canvas.sendToBack(x));
  canvas.requestRenderAll(); renderCapas(); guardarEstado();
}


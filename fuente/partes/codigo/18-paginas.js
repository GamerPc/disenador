/* =========================================================
   PÁGINAS
   ========================================================= */
function miniCanvas(){
  try { return canvas.toDataURL({ format:'png', multiplier: (152 / H) / zoom }); } catch(e){ return ''; }
}
function miniDeJSON(json, cb){
  const el = document.createElement('canvas');
  const sc = new fabric.StaticCanvas(el, { width:W, height:H, enableRetinaScaling:false });
  sc.loadFromJSON(json || PAGINA_VACIA(), () => { sc.renderAll(); const u = sc.toDataURL({ format:'png', multiplier:152 / H }); sc.dispose(); cb(u); });
}
function renderPaginas(){
  if (generandoVista) return;
  clearTimeout(renderPaginas._t);
  renderPaginas._t = setTimeout(() => {
    miniaturas[actual] = miniCanvas();
    const bar = $('paginas'); bar.innerHTML = '';
    paginas.forEach((p, i) => {
      const d = document.createElement('div');
      d.className = 'pag' + (i === actual ? ' act' : '');
      d.style.aspectRatio = W + ' / ' + H; d.title = 'Página ' + (i + 1);
      const img = document.createElement('img');
      if (miniaturas[i]) img.src = miniaturas[i];
      else miniDeJSON(p, u => { miniaturas[i] = u; img.src = u; });
      d.appendChild(img);
      d.insertAdjacentHTML('beforeend', `<span class="num">${i + 1}</span>`);
      if (i === actual ? notaPagina.trim() : (p && p.notas)) d.insertAdjacentHTML('beforeend', '<span class="tieneNota" title="Tiene notas">📝</span>');
      d.onclick = () => { if (i !== actual) irPagina(i); };
      bar.appendChild(d);
    });
    const acc = document.createElement('div'); acc.className = 'pagAcc';
    acc.innerHTML = `<div style="display:flex;gap:4px"><button class="pb" onclick="agregarPagina()">＋ Página</button><button class="pb" title="Agregar diapositiva con diseño" onclick="abrirDiapositivas()">▦ Diapositiva</button></div>
      <div style="display:flex;gap:4px">
        <button class="pb" title="Duplicar página" onclick="duplicarPagina()">⧉</button>
        <button class="pb" title="Mover a la izquierda" onclick="moverPagina(-1)">◀</button>
        <button class="pb" title="Mover a la derecha" onclick="moverPagina(1)">▶</button>
        <button class="pb peligro" title="Eliminar página" onclick="eliminarPagina()">🗑</button>
      </div>`;
    bar.appendChild(acc);
  }, 150);
}
function cargarPaginaActual(conHist){
  restaurando = true; canvas.discardActiveObject();
  notaPagina = (paginas[actual] && paginas[actual].notas) || ''; mostrarNotas();
  canvas.loadFromJSON(paginas[actual] || PAGINA_VACIA(), () => {
    canvas.renderAll(); normalizarVinculos(); restaurando = false;
    renderCapas(); actualizarPanel(); renderPaginas();
    if (conHist) guardarEstado();
  });
}
function guardarPaginaActual(){ paginas[actual] = jsonPagina(); miniaturas[actual] = miniCanvas(); }
function irPagina(i){
  if (i < 0 || i >= paginas.length) return;
  guardarPaginaActual(); actual = i; cargarPaginaActual(true);
}
function agregarPagina(){
  guardarPaginaActual();
  paginas.splice(actual + 1, 0, PAGINA_VACIA()); miniaturas.splice(actual + 1, 0, undefined);
  actual++; cargarPaginaActual(true);
}
function duplicarPagina(){
  guardarPaginaActual();
  paginas.splice(actual + 1, 0, JSON.parse(JSON.stringify(paginas[actual])));
  miniaturas.splice(actual + 1, 0, miniaturas[actual]);
  actual++; cargarPaginaActual(true);
}
function eliminarPagina(){
  if (paginas.length === 1){ toast('El diseño necesita al menos una página'); return; }
  if (!confirm('¿Eliminar la página ' + (actual + 1) + '?')) return;
  paginas.splice(actual, 1); miniaturas.splice(actual, 1);
  actual = Math.min(actual, paginas.length - 1); cargarPaginaActual(true);
}
function moverPagina(d){
  const j = actual + d; if (j < 0 || j >= paginas.length) return;
  guardarPaginaActual();
  [paginas[actual], paginas[j]] = [paginas[j], paginas[actual]];
  [miniaturas[actual], miniaturas[j]] = [miniaturas[j], miniaturas[actual]];
  actual = j; guardarEstado(); renderPaginas();
}


/* =========================================================
   REGLAS, HISTORIAL DE CAMBIOS, CARPETAS DE CAPAS, WEBP Y ZIP
   ========================================================= */
EXTRA.push('carpeta');

/* ---------- WEBP y ZIP al descargar ---------- */
const URL_JSZIP = ['https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'];
let cargaJSZip = null;
function cargarJSZip(){
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (!cargaJSZip) cargaJSZip = (async () => {
    for (const u of URL_JSZIP){
      try { await new Promise((ok, mal) => { const s = document.createElement('script'); s.src = u; s.onload = ok; s.onerror = mal; document.head.appendChild(s); }); if (window.JSZip) return window.JSZip; } catch (e) {}
    }
    cargaJSZip = null; throw new Error('No se pudo cargar la herramienta para hacer el ZIP. Revisa tu internet.');
  })();
  return cargaJSZip;
}
(function(){
  const sel = $('eFormato'); if (!sel) return;
  const jpg = sel.querySelector('option[value="jpeg"]');
  const o = document.createElement('option'); o.value = 'webp'; o.textContent = 'WEBP (ligera, para páginas web)';
  if (jpg) jpg.after(o); else sel.appendChild(o);
  // «juntar en un ZIP» cuando se descargan varias páginas como imagen
  const filaPag = $('ePaginas') && $('ePaginas').closest('.fila');
  if (filaPag){
    const f = document.createElement('div'); f.className = 'fila'; f.id = 'filaZip'; f.hidden = true;
    f.innerHTML = '<label for="eZip">Juntar en un ZIP</label><input type="checkbox" id="eZip" checked><span class="hint" style="font-size:11px">un solo archivo con todas las páginas</span>';
    filaPag.after(f);
    const ver = () => { f.hidden = !($('ePaginas').value === 'todas' && paginas.length > 1 && ['png', 'jpeg', 'webp'].includes(sel.value)); };
    sel.addEventListener('change', ver); $('ePaginas').addEventListener('change', ver);
    { const orig = abrirModal.directo || abrirModal; const pon = function(id){ const r = orig.apply(this, arguments); if (id === 'mExportar') setTimeout(ver, 0); return r; };
      if (abrirModal.directo) abrirModal.directo = pon; }
    setInterval(() => { if ($('mExportar').classList.contains('abierto')) ver(); }, 800);
  }
  // la transparencia también vale para WEBP
  const t = $('eTransp'); if (t){ const fila = t.closest('.fila'); const ver = () => { if (fila && ['png', 'webp'].includes(sel.value)) fila.style.display = ''; }; sel.addEventListener('change', ver); }
})();

/* ---------- carpetas de capas ---------- */
const carpetasAbiertas = new Set();
function seleccionarVarios(objs){
  const v = objs.filter(x => x.visible && x.selectable !== false && !x.esFondo);
  canvas.discardActiveObject();
  if (v.length === 1) canvas.setActiveObject(v[0]);
  else if (v.length > 1) canvas.setActiveObject(new fabric.ActiveSelection(v, { canvas }));
  canvas.requestRenderAll();
}
function filaCarpeta(nombre, miembros, sel){
  const li = document.createElement('li'); li.className = 'carpetaCapa' + (miembros.some(m => sel.has(m)) ? ' conSel' : '');
  const abierta = carpetasAbiertas.has(nombre) || miembros.some(m => sel.has(m));
  const visible = miembros.some(m => m.visible), bloq = miembros.length && miembros.every(m => m.bloqueado);
  li.innerHTML = `<button class="flecha" title="${abierta ? 'Cerrar' : 'Abrir'} la carpeta" aria-expanded="${abierta}">${abierta ? '▾' : '▸'}</button>
    <span class="ic">📁</span><span class="cn" title="Clic para seleccionar todo · doble clic para renombrar">${esc(nombre)} <small>(${miembros.length})</small></span>
    <button title="Mostrar / ocultar la carpeta">${visible ? '👁' : '◌'}</button>
    <button title="Bloquear / desbloquear la carpeta">${bloq ? '🔒' : '🔓'}</button>
    <button title="Deshacer la carpeta (las capas se quedan)">✕</button>`;
  const [bf, bv, bl, bx] = li.querySelectorAll('button');
  const todos = () => miembros.flatMap(m => miembrosCapa(m));
  bf.onclick = e => { e.stopPropagation(); if (carpetasAbiertas.has(nombre)) carpetasAbiertas.delete(nombre); else carpetasAbiertas.add(nombre); renderCapas(); };
  li.querySelector('.cn').onclick = () => { seleccionarVarios(miembros.filter(m => !m.tabla)); };
  li.querySelector('.cn').ondblclick = () => {
    const n = prompt('Nombre de la carpeta:', nombre); if (n === null || !n.trim() || n.trim() === nombre) return;
    todos().forEach(x => x.carpeta = n.trim()); if (carpetasAbiertas.delete(nombre)) carpetasAbiertas.add(n.trim());
    accionHist = 'Renombrar carpeta'; renderCapas(); guardarEstado();
  };
  bv.onclick = e => { e.stopPropagation(); const v = !visible; todos().forEach(x => x.visible = v); if (!v) canvas.discardActiveObject(); accionHist = (v ? 'Mostrar' : 'Ocultar') + ' carpeta «' + nombre + '»'; canvas.requestRenderAll(); renderCapas(); guardarEstado(); };
  bl.onclick = e => { e.stopPropagation(); const v = !bloq; todos().forEach(x => bloquear(x, v)); canvas.discardActiveObject(); accionHist = (v ? 'Bloquear' : 'Desbloquear') + ' carpeta «' + nombre + '»'; canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado(); };
  bx.onclick = e => { e.stopPropagation(); todos().forEach(x => { delete x.carpeta; }); accionHist = 'Deshacer carpeta «' + nombre + '»'; renderCapas(); guardarEstado(); };
  // soltar una capa encima de la carpeta la mete en ella
  li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('destino'); });
  li.addEventListener('dragleave', () => li.classList.remove('destino'));
  li.addEventListener('drop', e => {
    e.preventDefault(); li.classList.remove('destino');
    const mov = porId(e.dataTransfer.getData('text/plain')); if (!mov || mov.carpeta === nombre) return;
    miembrosCapa(mov).forEach(x => x.carpeta = nombre); accionHist = 'Meter a la carpeta «' + nombre + '»';
    if (miembros[0]) moverCapaSobre(mov, miembros[miembros.length - 1]); else { renderCapas(); guardarEstado(); }
  });
  return li;
}
function nuevaCarpeta(){
  const sel = canvas.getActiveObjects().map(nodoBase).filter(o => o && !o.esFondo);
  if (!sel.length) return toast('Primero selecciona las capas que quieres juntar (con Shift o arrastrando un recuadro)');
  const usados = new Set(canvas.getObjects().map(o => o.carpeta).filter(Boolean));
  let n = 1; while (usados.has('Carpeta ' + n)) n++;
  const nombre = prompt('Nombre de la carpeta:', 'Carpeta ' + n); if (nombre === null || !nombre.trim()) return;
  sel.forEach(o => (o.tabla ? celdasDe(o.tabla).flatMap(c => [c, porId(c.formaTexto)].filter(Boolean)) : miembrosCapa(o)).forEach(x => x.carpeta = nombre.trim()));
  carpetasAbiertas.add(nombre.trim()); accionHist = 'Nueva carpeta «' + nombre.trim() + '»';
  renderCapas(); guardarEstado(); toast('📁 Carpeta creada. Arrastra más capas encima para meterlas.');
}
(function(){
  const ul = $('capas'); if (!ul) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'pb bCarpeta'; b.id = 'bNuevaCarpeta';
  b.innerHTML = '📁 Nueva carpeta con lo seleccionado'; b.onclick = nuevaCarpeta;
  ul.before(b);
})();

/* ---------- historial de cambios ---------- */
const nombreCorto = o => {
  if (!o) return 'algo';
  if (esTexto(o)) return 'texto «' + (o.text || '').replace(/\s+/g, ' ').trim().slice(0, 18) + ((o.text || '').length > 18 ? '…' : '') + '»';
  if (o.type === 'image') return 'imagen'; if (o.type === 'activeSelection') return 'varios elementos'; if (o.type === 'group') return 'grupo';
  if (o.tabla) return 'tabla'; if (o.type === 'conector') return 'conector'; if (o.trazoLibre) return 'dibujo';
  return o.name && !/^(rect|circle|path|polygon|triangle|ellipse|line)$/i.test(o.name) ? o.name.toLowerCase() : 'figura';
};
let agregadosHist = 0;
// estos avisos tienen que llegar antes que los que guardan el paso en el historial
const alPrincipio = (ev, fn) => { canvas.on(ev, fn); const l = canvas.__eventListeners && canvas.__eventListeners[ev]; if (l && l[l.length - 1] === fn){ l.pop(); l.unshift(fn); } };
alPrincipio('object:added', e => { if (restaurando || generandoVista) return; agregadosHist++; accionHist = agregadosHist > 3 ? 'Agregar varios elementos' : 'Agregar ' + nombreCorto(e.target); });
alPrincipio('object:removed', e => { if (restaurando || generandoVista) return; accionHist = 'Borrar ' + nombreCorto(e.target); });
alPrincipio('object:modified', e => {
  const a = (e.action || (e.transform && e.transform.action) || '');
  accionHist = (/rotate/.test(a) ? 'Girar ' : /scale|resiz/.test(a) ? 'Cambiar el tamaño de ' : /drag/.test(a) ? 'Mover ' : 'Cambiar ') + nombreCorto(e.target);
});
alPrincipio('text:editing:exited', e => { accionHist = 'Escribir en ' + nombreCorto(e.target); });
{ const orig = guardarEstado; guardarEstado = function(){ const r = orig.apply(this, arguments); agregadosHist = 0; if ($('mHistorial') && $('mHistorial').classList.contains('abierto')) pintarHistorial(); return r; }; }
function haceCuanto(t){
  if (!t) return ''; const s = Math.round((Date.now() - t) / 1000);
  if (s < 10) return 'ahora'; if (s < 60) return 'hace ' + s + ' s'; if (s < 3600) return 'hace ' + Math.round(s / 60) + ' min';
  return new Date(t).toLocaleTimeString('es-MX', { hour:'numeric', minute:'2-digit' });
}
function pintarHistorial(){
  const ul = $('histLista'); if (!ul) return;
  if (historialInfo.length !== historial.length) historialInfo = historial.map((_, i) => historialInfo[i] || { t:null, txt:'Cambio' });
  ul.innerHTML = '';
  for (let i = historial.length - 1; i >= 0; i--){
    const inf = historialInfo[i] || {}, li = document.createElement('li');
    const txt = i === 0 ? 'Así empezó (lo más antiguo que se guardó)' : inf.txt || 'Cambio';
    li.innerHTML = `<button type="button" class="${i === hi ? 'actual' : i > hi ? 'futuro' : ''}" ${i === hi ? 'aria-current="step"' : ''}><span class="hNum">${i + 1}</span><span class="hTxt">${esc(txt)}</span><span class="hT">${i === hi ? 'estás aquí' : haceCuanto(inf.t)}</span></button>`;
    li.querySelector('button').onclick = () => { if (i === hi) return; hi = i; cargarJSON(historial[i], false, () => { pintarHistorial(); }); };
    ul.appendChild(li);
  }
  $('histInfo').textContent = `${historial.length} ${historial.length === 1 ? 'paso guardado' : 'pasos guardados'}. Toca uno para regresar a ese momento; después puedes ir hacia adelante otra vez mientras no hagas un cambio nuevo.`;
}
(function(){
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'mHistorial';
  m.innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="histTitulo">
    <h3 id="histTitulo">🕘 Historial de cambios</h3>
    <p class="hint" id="histInfo" style="padding-top:0"></p>
    <ul class="histLista" id="histLista"></ul>
    <div class="acciones"><button class="btnS" onclick="cerrarModal('mHistorial')">Cerrar</button></div>
  </div>`;
  document.body.appendChild(m);
  m.addEventListener('click', e => { if (e.target === m) cerrarModal('mHistorial'); });
  const vista = $('maVista');
  if (vista){ const b = document.createElement('button'); b.className = 'tb'; b.type = 'button'; b.textContent = '🕘 Historial de cambios'; b.onclick = () => abrirHistorial(); vista.appendChild(b); }
})();
function abrirHistorial(){ pintarHistorial(); abrirModal('mHistorial'); }

/* ---------- reglas en el borde del lienzo ---------- */
function reglasActivas(){
  try { const v = localStorage.getItem('disenador_reglas'); if (v) return v === '1'; } catch (e) {}
  return !(typeof modoSencillo === 'function' && modoSencillo());
}
(function(){
  const area = $('area'); if (!area) return;
  const mk = cls => { const c = document.createElement('canvas'); c.className = 'regla ' + cls; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c); return c; };
  const rh = mk('reglaH'), rv = mk('reglaV'), esq = document.createElement('button');
  esq.className = 'reglaEsq'; esq.type = 'button'; esq.title = 'Cambiar unidad de las reglas (px / cm)'; esq.setAttribute('aria-label', esq.title); document.body.appendChild(esq);
  let unidad = 'auto', raton = null, raf = 0;
  try { unidad = localStorage.getItem('disenador_reglasUnidad') || 'auto'; } catch (e) {}
  const GROSOR = 20;
  const unidadReal = () => unidad === 'auto' ? (typeof medidaReal !== 'undefined' && medidaReal ? 'cm' : 'px') : unidad;
  const pxPorUnidad = () => unidadReal() === 'cm' ? ((typeof medidaReal !== 'undefined' && medidaReal && medidaReal.pxcm) || (96 / 2.54)) : 1;   // sin medida real: 96 px por pulgada, como en pantalla
  function paso(pxPantallaPorUnidad){
    for (const p of [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000]) if (p * pxPantallaPorUnidad >= 48) return p;
    return 10000;
  }
  function dibujar(){
    raf = 0;
    const on = reglasActivas() && !matchMedia('(max-width: 820px)').matches && !document.documentElement.classList.contains('enfoque') && !document.body.classList.contains('conInicio');
    [rh, rv, esq].forEach(x => x.hidden = !on); if (!on) return;
    const a = area.getBoundingClientRect(), env = $('envoltura').getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    const css = getComputedStyle(document.documentElement), fondo = css.getPropertyValue('--panel').trim() || '#fff', linea = css.getPropertyValue('--suave').trim() || '#888', borde = css.getPropertyValue('--borde').trim() || '#ddd', acento = css.getPropertyValue('--morado').trim() || '#0a7';
    const u = pxPorUnidad(), k = zoom * u, p = paso(k), sub = p / (p % 5 === 0 ? 5 : p % 2 === 0 ? 2 : 1);
    esq.style.cssText = `left:${a.left}px;top:${a.top}px;width:${GROSOR}px;height:${GROSOR}px`; esq.textContent = unidadReal();
    [[rh, a.left + GROSOR, a.top, a.width - GROSOR, GROSOR, true], [rv, a.left, a.top + GROSOR, GROSOR, a.height - GROSOR, false]].forEach(([c, x, y, w, h, hor]) => {
      c.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)){ c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      g.fillStyle = fondo; g.fillRect(0, 0, w, h);
      const o0 = hor ? env.left - x : env.top - y, largo = hor ? w : h, total = (hor ? W : H) / u;
      // la parte que corresponde a la hoja se marca un poco
      g.fillStyle = 'rgba(127,127,127,.10)'; if (hor) g.fillRect(o0, 0, total * k, h); else g.fillRect(0, o0, w, total * k);
      g.strokeStyle = linea; g.fillStyle = linea; g.lineWidth = 1; g.font = '600 9.5px Inter, system-ui, sans-serif'; g.textBaseline = 'top';
      const ini = Math.floor(-o0 / k / sub) * sub, fin = (largo - o0) / k;
      g.beginPath();
      for (let v = ini; v <= fin; v += sub){
        const pos = Math.round(o0 + v * k) + 0.5, mayor = Math.abs(v / p - Math.round(v / p)) < 1e-6;
        const l = mayor ? GROSOR : (Math.abs(v / (p / 2) - Math.round(v / (p / 2))) < 1e-6 ? 8 : 5);
        if (hor){ g.moveTo(pos, GROSOR); g.lineTo(pos, GROSOR - l); } else { g.moveTo(GROSOR, pos); g.lineTo(GROSOR - l, pos); }
        if (mayor){
          const t = String(Math.round(v * 100) / 100);
          if (hor) g.fillText(t, pos + 3, 2);
          else { g.save(); g.translate(2, pos + 3); g.rotate(Math.PI / 2); g.fillText(t, 0, -9); g.restore(); }
        }
      }
      g.stroke();
      g.strokeStyle = borde; g.beginPath(); if (hor){ g.moveTo(0, h - 0.5); g.lineTo(w, h - 0.5); } else { g.moveTo(w - 0.5, 0); g.lineTo(w - 0.5, h); } g.stroke();
      // dónde está el ratón y lo seleccionado
      const o = activo();
      if (o){ const b = o.getBoundingRect(true, true); g.fillStyle = 'rgba(14,165,233,.22)';
        if (hor) g.fillRect(o0 + b.left * zoom, 0, b.width * zoom, h); else g.fillRect(0, o0 + b.top * zoom, w, b.height * zoom); }
      if (raton){ g.strokeStyle = acento; g.beginPath(); const pp = Math.round(o0 + (hor ? raton.x : raton.y) * zoom) + 0.5; if (hor){ g.moveTo(pp, 0); g.lineTo(pp, h); } else { g.moveTo(0, pp); g.lineTo(w, pp); } g.stroke(); }
    });
  }
  const pedir = () => { if (!raf) raf = requestAnimationFrame(dibujar); };
  window.repintarReglas = pedir;
  area.addEventListener('scroll', pedir, { passive:true }); addEventListener('resize', pedir);
  if (window.ResizeObserver) new ResizeObserver(pedir).observe(area);
  ['after:render', 'selection:cleared'].forEach(ev => canvas.on(ev, pedir));
  canvas.on('mouse:move', e => { const p = canvas.getPointer(e.e); raton = p; pedir(); });
  canvas.on('mouse:out', () => { raton = null; pedir(); });
  { const orig = acomodarLienzo; acomodarLienzo = function(){ const r = orig.apply(this, arguments); pedir(); return r; }; }
  esq.onclick = () => { unidad = unidadReal() === 'px' ? 'cm' : 'px'; try { localStorage.setItem('disenador_reglasUnidad', unidad); } catch (e) {} pedir(); toast('Reglas en ' + (unidad === 'cm' ? 'centímetros' : 'píxeles')); };
  new MutationObserver(pedir).observe(document.documentElement, { attributes:true, attributeFilter:['class'] });
  new MutationObserver(pedir).observe(document.body, { attributes:true, attributeFilter:['class'] });
  const vista = $('maVista');
  if (vista){ const b = document.createElement('button'); b.className = 'tb'; b.type = 'button'; b.id = 'bReglas';
    const etq = () => b.textContent = (reglasActivas() ? '📏 Ocultar reglas' : '📏 Mostrar reglas');
    b.onclick = () => { try { localStorage.setItem('disenador_reglas', reglasActivas() ? '0' : '1'); } catch (e) {} etq(); pedir(); };
    etq(); vista.appendChild(b); new MutationObserver(etq).observe(document.documentElement, { attributes:true, attributeFilter:['class'] }); }
  setTimeout(pedir, 300);
})();

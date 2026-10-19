/* =========================================================
   BARRA DE ARRIBA ADAPTABLE: lo que no cabe pasa al menú «Más»
   ========================================================= */
(function(){
  const barra = $('barra'); if (!barra) return;
  // agrupar el zoom y deshacer/rehacer para que se muevan juntos
  const agrupar = (id, els) => { els = els.filter(Boolean); if (!els.length) return null; const g = document.createElement('div'); g.id = id; g.className = 'grupoBarra';
    els[0].before(g); els.forEach(e => g.appendChild(e)); return g; };
  const hijos = [...barra.children];
  const porClick = t => hijos.find(e => e.tagName === 'BUTTON' && (e.getAttribute('onclick') || '').includes(t));
  agrupar('grupoHist', [$('bDeshacer'), $('bRehacer')]);
  agrupar('grupoZoom', [porClick('cambiarZoom(-0.1)'), $('zoomTxt'), porClick('cambiarZoom(0.1)')]);
  hijos.forEach(b => { if (b.tagName === 'BUTTON' && !b.title){ const t = b.textContent.trim(); if (t) { b.title = t; b.setAttribute('aria-label', t); } } });
  // fabric 5.3.1 usa un valor que el navegador no reconoce y llena la consola de avisos: se corrige
  try { const f = fabric.Text.prototype._setTextStyles, src = f.toString();
    if (/(["'])alphabetical\1/.test(src)) fabric.Text.prototype._setTextStyles = (0, eval)('(' + src.replace(/^_setTextStyles\s*\(/, 'function(').replace(/(["'])alphabetical\1/, '"alphabetic"') + ')');
  } catch (e) {}
  // botón «Más» y su menú
  const mas = document.createElement('button'); mas.className = 'tb'; mas.id = 'bMas'; mas.hidden = true;
  mas.title = 'Más opciones'; mas.setAttribute('aria-label', 'Más opciones'); mas.setAttribute('aria-haspopup', 'true'); mas.setAttribute('aria-expanded', 'false');
  mas.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01" style="stroke-width:3.2"/></svg><span class="txtMas"> Más</span>';
  const menu = document.createElement('div'); menu.id = 'menuMas'; menu.setAttribute('role', 'menu'); menu.hidden = true;
  document.body.appendChild(menu);
  // prioridad: el número más bajo se va primero al menú
  const PRIOR = [
    [e => e.tagName === 'BUTTON' && e.getAttribute('onclick') === "abrirModal('mAyuda')", 1],
    [e => e.id === 'bAuto', 2], [e => (e.getAttribute('onclick') || '').includes('ajustarLienzoAContenido'), 3],
    [e => (e.getAttribute('onclick') || '').includes('abrirBuscar'), 4], [e => e.id === 'bInstalar', 5],
    [e => e.classList.contains('donar'), 6], [e => e.id === 'tamTxt', 7], [e => (e.getAttribute('onclick') || '') === 'nuevoDiseno()', 8],
    [e => (e.getAttribute('onclick') || '') === 'ajustarZoom()', 9], [e => e.id === 'grupoZoom', 10], [e => e.id === 'bNube', 11], [e => e.id === 'bEscuela', 11.5], [e => e.id === 'bEquipo', 11.7],
    [e => (e.getAttribute('onclick') || '').includes('mCompartir'), 12], [e => (e.getAttribute('onclick') || '').includes('mProyectos'), 13],
    [e => e.id === 'grupoHist', 14], [e => (e.getAttribute('onclick') || '').includes('mPresentar'), 15]
  ];
  const prioridad = e => { for (const [f, p] of PRIOR) if (f(e)) return p; return 0; };
  const todos = [];        // orden original de la barra
  const registrar = () => {
    [...barra.children].forEach(e => {
      if (todos.includes(e)) return;
      const prev = e.previousElementSibling, k = todos.indexOf(prev);
      todos.splice(k >= 0 ? k + 1 : todos.length, 0, e);
    });
    // «Más» y «Exportar» siempre al final, a la derecha
    const exp = todos.find(e => (e.getAttribute('onclick') || '').includes('mExportar'));
    [mas, exp].forEach(e => { if (!e) return; const k = todos.indexOf(e); if (k >= 0) todos.splice(k, 1); todos.push(e); });
  };
  const etiquetar = e => {        // en el menú, los botones de solo ícono muestran su nombre
    const bs = e.tagName === 'BUTTON' ? [e] : [...e.querySelectorAll('button')];
    bs.forEach(b => { if (b.id !== 'tamTxt' && !b.querySelector('.etqMenu') && b.title && !(b.textContent || '').replace(/\s/g, '').match(/[\p{L}]{3,}/u)){
      const s = document.createElement('span'); s.className = 'etqMenu'; s.textContent = ' ' + b.title.replace(/\s*\(.*\)$/, ''); b.appendChild(s); } });
  };
  let acomodando = false;
  function acomodar(){
    if (acomodando) return; acomodando = true;
    registrar();
    todos.forEach(e => barra.appendChild(e));            // todo regresa a la barra en su orden
    mas.hidden = true; barra.classList.remove('apretada');
    const cabe = () => barra.scrollWidth <= barra.clientWidth + 1;
    const lista = todos.filter(e => prioridad(e)).sort((a, b) => prioridad(a) - prioridad(b));
    if (!cabe()) barra.classList.add('apretada');          // primero se esconde el texto «Guardado…»
    let i = 0;
    while (!cabe() && i < lista.length){ mas.hidden = false; menu.appendChild(lista[i]); etiquetar(lista[i]); i++; }
    [...menu.children].sort((a, b) => todos.indexOf(a) - todos.indexOf(b)).forEach(e => menu.appendChild(e));
    barra.classList.remove('soloIconos');
    if (!cabe()) barra.classList.add('soloIconos');        // pantallas muy angostas: Guardar y Exportar solo con ícono
    acomodando = false;
  }
  const abrir = v => {
    menu.hidden = !v; mas.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (v){ const r = mas.getBoundingClientRect(); menu.style.top = (r.bottom + 6) + 'px';
      if (innerWidth < 560){ menu.style.left = '8px'; menu.style.right = '8px'; menu.style.maxWidth = 'none'; }
      else { menu.style.left = 'auto'; menu.style.right = Math.max(8, innerWidth - r.right) + 'px'; menu.style.maxWidth = Math.max(240, r.right - 8) + 'px'; }
      const f = menu.querySelector('button'); f && f.focus({ preventScroll:true }); }
  };
  mas.onclick = e => { e.stopPropagation(); abrir(menu.hidden); };
  menu.addEventListener('click', e => { if (e.target.closest('button') && !e.target.closest('#grupoZoom')) abrir(false); });
  document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target) && e.target !== mas) abrir(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden){ abrir(false); mas.focus(); } });
  let t = null; const pedir = () => { clearTimeout(t); t = setTimeout(() => { abrir(false); acomodar(); }, 60); };
  addEventListener('resize', pedir);
  new MutationObserver(ms => { if (!acomodando && ms.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && n.parentNode === barra && !todos.includes(n)))) pedir(); })
    .observe(barra, { childList:true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pedir);
  acomodar(); setTimeout(acomodar, 800); setTimeout(acomodar, 2500);
  window.acomodarBarra = acomodar;
})();


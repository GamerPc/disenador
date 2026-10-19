/* =========================================================
   ACCESIBILIDAD Y USO CON EL DEDO
   ========================================================= */
(function(){
  // nombres para lectores de pantalla en botones que solo tienen un símbolo
  const nombrar = raiz => (raiz || document).querySelectorAll('button:not([aria-label])').forEach(b => {
    const t = (b.textContent || '').trim();
    if (b.title) b.setAttribute('aria-label', b.title);
    else if (t === '−' || t === '-') b.setAttribute('aria-label', 'Alejar');
    else if (t === '+') b.setAttribute('aria-label', 'Acercar');
  });
  nombrar();
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) nombrar(n.parentNode || n); }))).observe(document.body, { childList:true, subtree:true });
  // los avisos se leen en voz alta
  const t = $('toast'); if (t){ t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); }
  // pestañas: se anuncia cuál está abierta
  const nav = $('pestanas'); if (nav){ nav.setAttribute('aria-label', 'Herramientas');
    const marcar = () => nav.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.classList.contains('activa') ? 'true' : 'false'));
    marcar(); new MutationObserver(marcar).observe(nav, { attributes:true, subtree:true, attributeFilter:['class'] }); }
  // los botones del celular no tapan la barra de páginas
  const ajustarFab = () => { const p = $('paginas'), a = $('accMovil'); if (!p || !a || innerWidth > 820) { if (a){ a.style.bottom = ''; a.style.visibility = ''; } return; }
    const n = $('barraNotas'), ref = n && n.offsetParent ? n : p, r = ref.getBoundingClientRect();
    a.style.bottom = Math.max(76, innerHeight - r.top + 10) + 'px';
    a.style.visibility = $('lateral') && $('lateral').classList.contains('abierto') ? 'hidden' : ''; };
  new MutationObserver(ajustarFab).observe($('lateral'), { attributes:true, attributeFilter:['class'] });
  addEventListener('resize', ajustarFab); setInterval(ajustarFab, 1500); ajustarFab();
})();


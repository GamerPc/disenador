// Llena los datos del responsable (vienen de config.js → APIK_CONFIG.legal) en el Aviso de privacidad y los Términos de uso
(function(){
  const L = (window.APIK_CONFIG && window.APIK_CONFIG.legal) || {};
  document.querySelectorAll('[data-legal]').forEach(el => {
    const k = el.dataset.legal, v = (L[k] || '').trim();
    el.classList.add('dato');
    if (k === 'correo'){
      if (v){ const a = document.createElement('a'); a.href = 'mailto:' + v; a.textContent = v; el.replaceChildren(a); }
      else { el.textContent = 'el correo de contacto que se publicará en esta página'; el.classList.add('falta'); }
      return;
    }
    if (v) el.textContent = v; else { el.textContent = '(pendiente)'; el.classList.add('falta'); }
  });
})();

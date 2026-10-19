/* =========================================================
   APP INSTALABLE (celular, tablet y computadora)
   ========================================================= */
(function(){
  const st = document.createElement('style');
  st.textContent = '#bInstalar[hidden]{display:none!important}#avisoVersion{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:9999;background:#0b1220;color:#e8f6ff;border:1px solid #19c8ff;border-radius:22px;padding:8px 10px 8px 16px;font-size:13px;box-shadow:0 0 18px rgba(25,200,255,.35);display:flex;gap:10px;align-items:center;max-width:92vw}#avisoVersion button{background:#19c8ff;color:#05070d;border:0;border-radius:14px;padding:5px 12px;font-weight:700}';
  document.head.appendChild(st);
  const enApp = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (enApp) document.body.classList.add('enApp');
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let aviso = null;
  const b = document.createElement('button');
  b.className = 'tb'; b.id = 'bInstalar'; b.hidden = true; b.title = 'Instala el Diseñador como app en tu celular o computadora';
  b.innerHTML = '📲<span class="txtLargo"> Instalar</span>';
  const ref = document.querySelector('#barra .tb.donar');
  if (ref) ref.before(b); else { const barra = document.getElementById('barra'); barra && barra.appendChild(b); }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); aviso = e; if (!enApp) b.hidden = false; });
  window.addEventListener('appinstalled', () => { b.hidden = true; aviso = null; typeof toast === 'function' && toast('¡Listo! El Diseñador ya está en tu pantalla de inicio.'); });
  if (esIOS && !enApp) b.hidden = false;
  b.onclick = async () => {
    if (aviso){ aviso.prompt(); const r = await aviso.userChoice; if (r.outcome === 'accepted') b.hidden = true; aviso = null; return; }
    if (esIOS) return toast('En iPhone o iPad: abre esta página en Safari, toca el botón Compartir (□↑) y elige “Agregar a inicio”.');
    toast('Abre el menú de tu navegador (⋮) y elige “Instalar app” o “Agregar a la pantalla de inicio”.');
  };
  // Service worker: abre sin internet y avisa cuando hay una versión nueva
  if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost')) return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    const avisarNueva = w => {
      const t = document.createElement('div'); t.id = 'avisoVersion';
      t.innerHTML = '✨ Hay una versión nueva del Diseñador <button>Actualizar</button>';
      t.querySelector('button').onclick = () => { try { guardarEstado && guardarEstado(); } catch (e) {} w.postMessage('actualizar'); setTimeout(() => location.reload(), 600); };
      document.body.appendChild(t);
    };
    if (reg.waiting && navigator.serviceWorker.controller) avisarNueva(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) avisarNueva(w); });
    });
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  }).catch(() => {});
  // cuando entra una versión nueva: se avisa y la persona decide cuándo recargar (para no perder lo que está haciendo)
  const habiaControl = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!habiaControl || document.getElementById('avisoVersion')) return;
    const t = document.createElement('div'); t.id = 'avisoVersion';
    t.innerHTML = '✨ Ya está lista una versión nueva del Diseñador <button>Recargar</button>';
    t.querySelector('button').onclick = () => { try { guardarEstado && guardarEstado(); } catch (e) {} setTimeout(() => location.reload(), 300); };
    document.body.appendChild(t);
  });
})();

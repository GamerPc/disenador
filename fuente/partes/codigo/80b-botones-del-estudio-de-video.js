/* =========================================================
   BOTONES DEL ESTUDIO DE VIDEO
   En la versión web el estudio (grabar, editar, plantillas de video, cámara del teléfono)
   vive en js/video.js y se descarga hasta que alguien lo abre: así el Diseñador abre más rápido.
   ========================================================= */
const URL_VIDEO_EV = 'js/video.js';
let cargaVideoEV = null;
function cargarEstudioVideo(){
  if (typeof abrirEstudioVideo === 'function') return Promise.resolve();
  if (!cargaVideoEV) cargaVideoEV = new Promise((ok, mal) => {
    const s = document.createElement('script'); s.src = URL_VIDEO_EV;
    s.onload = ok; s.onerror = () => { cargaVideoEV = null; mal(new Error('No se pudo cargar el estudio de video. Revisa tu internet e intenta otra vez.')); };
    document.head.appendChild(s);
  });
  return cargaVideoEV;
}
async function irAlEstudioEV(plantillas){
  const btns = [$('bVideo'), $('pestanaVideo'), $('bPlantillasVideo')].filter(Boolean);
  try {
    if (typeof abrirEstudioVideo !== 'function'){ btns.forEach(b => b.classList.add('cargando')); toast('🎬 Abriendo el estudio de video…'); await cargarEstudioVideo(); }
  } catch (e){ toast('⚠ ' + e.message); return; }
  finally { btns.forEach(b => b.classList.remove('cargando')); }
  return plantillas ? abrirPlantillasDeVideo() : abrirEstudioVideo();
}
(function(){
  const b = document.createElement('button'); b.className = 'tb'; b.id = 'bVideo'; b.title = 'Estudio de video: graba tu pantalla o cámara y edita videos';
  b.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg><span class="txtLargo"> Video</span>';
  b.onclick = () => irAlEstudioEV();
  const pres = [...document.querySelectorAll('#barra .tb')].find(x => (x.getAttribute('onclick') || '').includes('mPresentar'));
  if (pres) pres.before(b); else $('barra').appendChild(b);
  const r = document.createElement('button'); r.id = 'pestanaVideo'; r.title = 'Estudio de video'; r.innerHTML = '<span>🎬</span>Video'; r.onclick = () => irAlEstudioEV();
  $('pestanas').appendChild(r);
  const panel = $('tPlantillas'); if (!panel) return;
  const t = document.createElement('button'); t.id = 'bPlantillasVideo'; t.className = 'tarjetaVideoPl';
  t.innerHTML = '<span>🎬</span><b>Plantillas de video</b><small>Reels, TikTok, Instagram y YouTube · con transiciones</small>';
  t.onclick = () => irAlEstudioEV(true);
  const guardar = panel.querySelector('[onclick="guardarComoPlantilla()"]');
  if (guardar) guardar.before(t); else panel.prepend(t);
  // al acercar el dedo o el mouse ya se empieza a bajar, así abre casi al instante
  [b, r, t].forEach(x => { x.addEventListener('pointerenter', () => cargarEstudioVideo().catch(() => {}), { once:true }); x.addEventListener('focus', () => cargarEstudioVideo().catch(() => {}), { once:true }); });
})();

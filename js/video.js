/* Estudio de video del Diseñador: se carga desde js/app.js cuando se abre */
/* =========================================================
   ESTUDIO DE VIDEO
   - Grabar: pantalla, cámara, pantalla + cámara (burbuja editable) o tu presentación + cámara.
   - Subir videos, imágenes y música. Usar las páginas de tu diseño como diapositivas.
   - Línea de tiempo: recortar, dividir, reordenar, velocidad, volumen, textos encima, música de fondo.
   - Exportar a MP4 (o WebM si el navegador no puede MP4).
   Todo se guarda en este navegador (IndexedDB), así no se pierde al recargar.
   ========================================================= */
const FORMATOS_EV = { '16:9':[1280, 720], '9:16':[720, 1280], '1:1':[1080, 1080], '4:5':[1080, 1350] };
const EV = {
  p:{ formato:'16:9', clips:[], textos:[], musica:null, nombre:'Mi video' },
  sel:null, t:0, play:false, pps:40, medios:{}, hist:[], hi:-1, ctx:null, master:null, recDest:null, exportando:false
};
const nid = () => 'v' + Math.random().toString(36).slice(2, 10);
const fmtT = s => { s = Math.max(0, s || 0); const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); };

/* ---------- guardar en el navegador (IndexedDB) ---------- */
let dbEV = null;
function abrirDBEV(){
  if (dbEV) return Promise.resolve(dbEV);
  return new Promise((ok, mal) => {
    const r = indexedDB.open('disenador_video', 1);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('medios')) d.createObjectStore('medios'); if (!d.objectStoreNames.contains('estado')) d.createObjectStore('estado'); };
    r.onsuccess = () => { dbEV = r.result; ok(dbEV); }; r.onerror = () => mal(r.error);
  });
}
async function dbEVop(store, modo, fn){
  const d = await abrirDBEV();
  return new Promise((ok, mal) => { const tx = d.transaction(store, modo), st = tx.objectStore(store), r = fn(st); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => mal(tx.error); });
}
const guardarMedioEV = (id, datos) => dbEVop('medios', 'readwrite', st => st.put(datos, id));
const leerMedioEV = id => dbEVop('medios', 'readonly', st => st.get(id));
const borrarMedioEV = id => dbEVop('medios', 'readwrite', st => st.delete(id));
const listarMediosEV = () => dbEVop('medios', 'readonly', st => st.getAllKeys());
let tGuardarEV = null;
function guardarProyectoEV(conHistorial = true){
  if (conHistorial){
    const j = JSON.stringify(EV.p);
    if (EV.hist[EV.hi] !== j){ EV.hist = EV.hist.slice(0, EV.hi + 1); EV.hist.push(j); if (EV.hist.length > 60) EV.hist.shift(); EV.hi = EV.hist.length - 1; }
  }
  clearTimeout(tGuardarEV);
  tGuardarEV = setTimeout(() => dbEVop('estado', 'readwrite', st => st.put(JSON.stringify(EV.p), 'proyecto')).catch(() => {}), 500);
  clearTimeout(tSnapEV); tSnapEV = setTimeout(() => { if (!EV.play && !EV.exportando) prepararSnapsEV(); }, 700);
}
function deshacerEV(d){
  const i = EV.hi + d; if (i < 0 || i >= EV.hist.length) return;
  EV.hi = i; EV.p = JSON.parse(EV.hist[i]); EV.sel = null; guardarProyectoEV(false); pintarTodoEV();
}

/* ---------- medios (videos, imágenes, audios) ---------- */
// duración real de los videos grabados (Chrome a veces dice «Infinity»)
function duracionReal(el){
  return new Promise(ok => {
    if (isFinite(el.duration) && el.duration > 0) return ok(el.duration);
    const fin = () => { el.removeEventListener('durationchange', ver); el.currentTime = 0; ok(isFinite(el.duration) ? el.duration : 0); };
    const ver = () => { if (isFinite(el.duration)) fin(); };
    el.addEventListener('durationchange', ver); el.currentTime = 1e101; setTimeout(fin, 4000);
  });
}
async function cargarMedioEV(id){
  if (EV.medios[id]) return EV.medios[id].listo;
  const m = EV.medios[id] = {};
  m.listo = (async () => {
    const d = await leerMedioEV(id); if (!d) throw new Error('falta');
    m.tipo = d.tipo; m.nombre = d.nombre; m.plantilla = !!d.plantilla; m.url = URL.createObjectURL(d.blob);
    if (d.tipo === 'imagen'){
      m.el = new Image(); m.el.src = m.url; await m.el.decode().catch(() => {}); m.w = m.el.naturalWidth; m.h = m.el.naturalHeight; m.dur = 5;
      m.thumb = miniEV(m.el, m.w, m.h);
    } else {
      const v = document.createElement(d.tipo === 'audio' ? 'audio' : 'video');
      v.preload = 'auto'; v.playsInline = true; v.src = m.url; v.crossOrigin = 'anonymous';
      await new Promise(ok => { v.onloadedmetadata = ok; v.onerror = ok; setTimeout(ok, 6000); });
      m.el = v; m.w = v.videoWidth || 0; m.h = v.videoHeight || 0;
      m.dur = d.dur || await duracionReal(v);
      if (d.tipo === 'video'){
        await buscarEV(v, Math.min(1, m.dur / 3));
        m.thumb = miniEV(v, m.w, m.h);
      }
      conectarAudioEV(v);
    }
    return m;
  })();
  return m.listo;
}
function miniEV(el, w, h){ try { const c = document.createElement('canvas'), k = 90 / Math.max(1, h || 90); c.width = Math.max(1, Math.round((w || 160) * k)); c.height = 90; c.getContext('2d').drawImage(el, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.6); } catch (e) { return ''; } }
function buscarEV(v, t){
  return new Promise(ok => {
    if (Math.abs(v.currentTime - t) < 0.02 && v.readyState >= 2) return ok();
    const listo = () => { v.removeEventListener('seeked', listo); clearTimeout(tm); ok(); };
    const tm = setTimeout(listo, 1500);
    v.addEventListener('seeked', listo); try { v.currentTime = Math.max(0, t); } catch (e) { listo(); }
  });
}
async function agregarArchivoEV(file){
  const tipo = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'imagen' : file.type.startsWith('audio/') ? 'audio' : null;
  if (!tipo) return toast('Ese archivo no es video, imagen ni audio');
  const id = nid();
  await guardarMedioEV(id, { blob:file, nombre:file.name.replace(/\.[^.]+$/, '').slice(0, 60), tipo });
  const m = await cargarMedioEV(id);
  if (tipo === 'audio') ponerMusicaEV(id, m);
  else agregarClipEV(id, m);
  pintarBibliotecaEV();
}
function agregarClipEV(id, m, extra = {}){
  const c = { id:nid(), blob:id, tipo:m.tipo, nombre:m.nombre || 'Clip', ini:0, fin:m.tipo === 'imagen' ? 5 : m.dur, vol:1, mute:false, vel:1, ajuste:m.tipo === 'imagen' ? 'encajar' : 'cubrir', fundido:false, zoomLento:false, cam:null, ...extra };
  EV.p.clips.push(c); EV.sel = { tipo:'clip', id:c.id };
  guardarProyectoEV(); pintarTodoEV();
  return c;
}
function ponerMusicaEV(id, m){
  EV.p.musica = { blob:id, nombre:m.nombre || 'Música', vol:0.35, desde:0 };
  conectarAudioEV(m.el); EV.sel = { tipo:'musica' }; guardarProyectoEV(); pintarTodoEV(); toast('♪ Música agregada (se repite si es más corta que el video)');
}

/* ---------- audio: todo pasa por aquí para poder grabarlo al exportar ---------- */
function audioEV(){
  if (!EV.ctx){
    EV.ctx = new (window.AudioContext || window.webkitAudioContext)();
    EV.master = EV.ctx.createGain(); EV.master.connect(EV.ctx.destination);
    EV.recDest = EV.ctx.createMediaStreamDestination(); EV.master.connect(EV.recDest);
  }
  if (EV.ctx.state === 'suspended') EV.ctx.resume().catch(() => {});
  return EV.ctx;
}
function conectarAudioEV(el){
  if (!el || el._gain) return;
  try { const ctx = audioEV(), src = ctx.createMediaElementSource(el), g = ctx.createGain(); src.connect(g); g.connect(EV.master); el._gain = g; } catch (e) {}
}

/* ---------- tiempo ---------- */
const largoClip = c => Math.max(0.1, (c.fin - c.ini) / (c.vel || 1));
const totalEV = () => EV.p.clips.reduce((s, c) => s + largoClip(c), 0);
function clipEnEV(t){
  let acc = 0;
  for (let i = 0; i < EV.p.clips.length; i++){ const c = EV.p.clips[i], L = largoClip(c); if (t < acc + L || i === EV.p.clips.length - 1) return { c, i, t0:acc, local:Math.min(L, Math.max(0, t - acc)) }; acc += L; }
  return null;
}
const inicioClipEV = id => { let acc = 0; for (const c of EV.p.clips){ if (c.id === id) return acc; acc += largoClip(c); } return 0; };

/* ---------- dibujo de un cuadro ---------- */
function dibujarMedioEV(x, el, w, h, W0, H0, ajuste, zoomK){
  if (!el || !w || !h) return;
  const k = (ajuste === 'encajar' ? Math.min(W0 / w, H0 / h) : Math.max(W0 / w, H0 / h)) * (zoomK || 1);
  const dw = w * k, dh = h * k; x.drawImage(el, (W0 - dw) / 2, (H0 - dh) / 2, dw, dh);
}
/* ---------- transiciones entre clips ----------
   La transición vive en el clip que ENTRA (c.trans = {tipo, dur}) y se centra en el corte:
   la mitad usa el final del clip anterior y la otra mitad el inicio del siguiente (no cambia la duración del video).
   El clip que no está sonando se dibuja con una «foto» de su primer/último cuadro (EV.snaps). */
const TRANS_EV = { ninguna:'Sin transición', disolver:'Disolver', negro:'Pasar por negro', blanco:'Destello blanco', deslizarIzq:'Deslizar ←', deslizarDer:'Deslizar →', deslizarArriba:'Deslizar ↑', empujarIzq:'Empujar ←', barrido:'Barrido', circulo:'Círculo', zoom:'Zoom', desenfoque:'Desenfoque', girar:'Girar' };
EV.snaps = {};
const suaveEV = p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
const claveSnap = (blob, tt) => blob + '@' + (+tt).toFixed(2);
const transActiva = c => !!(c && c.trans && c.trans.tipo && c.trans.tipo !== 'ninguna');
const durTransEV = (A, B) => Math.max(0.1, Math.min(B.trans.dur || 0.6, largoClip(A), largoClip(B)));
function transicionEnEV(r){
  if (!r) return null;
  const cl = EV.p.clips, L = largoClip(r.c), sig = cl[r.i + 1], ant = cl[r.i - 1];
  if (transActiva(sig)){ const d = durTransEV(r.c, sig); if (L - r.local < d / 2) return { A:r.c, B:sig, p:(r.local - (L - d / 2)) / d, vivoA:true }; }
  if (ant && transActiva(r.c)){ const d = durTransEV(ant, r.c); if (r.local < d / 2) return { A:ant, B:r.c, p:0.5 + r.local / d, vivoA:false }; }
  return null;
}
function fuenteEV(blob, tiempo, vivo){
  const m = EV.medios[blob]; if (!m || !m.el) return null;
  if (m.tipo === 'imagen') return { el:m.el, w:m.w, h:m.h };
  if (!vivo){ const s = EV.snaps[claveSnap(blob, tiempo)]; if (s) return { el:s, w:s.width, h:s.height }; }
  return { el:m.el, w:m.w || m.el.videoWidth, h:m.h || m.el.videoHeight };
}
function snapsNecesariosEV(){
  const out = [], cl = EV.p.clips;
  for (let i = 1; i < cl.length; i++){
    if (!transActiva(cl[i])) continue;
    [[cl[i - 1], cl[i - 1].fin], [cl[i], cl[i].ini]].forEach(([c, t0]) => [c.blob, c.cam && c.cam.blob].filter(Boolean).forEach(b => {
      const tt = c.cam && b === c.cam.blob ? Math.max(0, t0 - (c.cam.desfase || 0)) : t0;
      const m = EV.medios[b]; if (m && m.tipo === 'video' && !EV.snaps[claveSnap(b, tt)] && !out.some(o => o[0] === b && claveSnap(b, o[1]) === claveSnap(b, tt))) out.push([b, tt]);
    }));
  }
  return out;
}
let prepSnapsEV = null, tSnapEV = null;
function prepararSnapsEV(){
  if (prepSnapsEV) return prepSnapsEV;
  const lista = snapsNecesariosEV(); if (!lista.length) return Promise.resolve();
  prepSnapsEV = (async () => {
    for (const [b, tt] of lista){
      const m = EV.medios[b]; if (!m || !m.el) continue;
      try {
        m.el.pause(); await buscarEV(m.el, Math.max(0, Math.min(tt - 0.04, (m.dur || tt) - 0.06)));
        const w = m.el.videoWidth, h = m.el.videoHeight; if (!w) continue;
        const k = Math.min(1, 1280 / Math.max(w, h)), c = document.createElement('canvas');
        c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d').drawImage(m.el, 0, 0, c.width, c.height);
        EV.snaps[claveSnap(b, tt)] = c;
      } catch (e) {}
    }
  })().finally(() => { prepSnapsEV = null; if (!EV.play && !EV.exportando) verEnEV(EV.t); });
  return prepSnapsEV;
}
const lienzosTr = [];
function lienzoTr(i, W0, H0){
  let c = lienzosTr[i]; if (!c) c = lienzosTr[i] = document.createElement('canvas');
  if (c.width !== W0 || c.height !== H0){ c.width = W0; c.height = H0; }
  const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'none'; x.fillStyle = '#000'; x.fillRect(0, 0, W0, H0);
  return c;
}
function componerTransEV(x, tipo, p, A, B, W, H){
  const e = suaveEV(p);
  x.save();
  const dib = (c, dx = 0, dy = 0) => x.drawImage(c, dx, dy);
  const escalado = (c, k, alfa, giro = 0) => { x.save(); x.globalAlpha = alfa; x.translate(W / 2, H / 2); if (giro) x.rotate(giro); x.scale(k, k); x.drawImage(c, -W / 2, -H / 2); x.restore(); };
  switch (tipo){
    case 'disolver': dib(A); x.globalAlpha = e; dib(B); break;
    case 'negro': case 'blanco':
      x.fillStyle = tipo === 'negro' ? '#000' : '#fff'; x.fillRect(0, 0, W, H);
      if (p < 0.5){ x.globalAlpha = 1 - suaveEV(p * 2); dib(A); } else { x.globalAlpha = suaveEV(p * 2 - 1); dib(B); }
      break;
    case 'deslizarIzq': dib(A); dib(B, (1 - e) * W, 0); break;
    case 'deslizarDer': dib(A); dib(B, -(1 - e) * W, 0); break;
    case 'deslizarArriba': dib(A); dib(B, 0, (1 - e) * H); break;
    case 'empujarIzq': dib(A, -e * W, 0); dib(B, (1 - e) * W, 0); break;
    case 'barrido': dib(A); x.beginPath(); x.rect(0, 0, e * W, H); x.clip(); dib(B); break;
    case 'circulo': dib(A); x.beginPath(); x.arc(W / 2, H / 2, Math.max(0.1, e * Math.hypot(W, H) / 2), 0, Math.PI * 2); x.clip(); dib(B); break;
    case 'zoom': escalado(A, 1 + e * 0.6, 1 - e); escalado(B, 0.7 + 0.3 * e, e); break;
    case 'desenfoque': { const bl = Math.sin(p * Math.PI) * Math.min(W, H) * 0.03; x.filter = 'blur(' + bl.toFixed(1) + 'px)'; dib(A); x.globalAlpha = e; dib(B); x.filter = 'none'; break; }
    case 'girar':
      if (p < 0.5){ const q = suaveEV(p * 2); escalado(A, 1 - q * 0.95, 1, q * Math.PI / 2); }
      else { const q = suaveEV(p * 2 - 1); escalado(B, 0.05 + q * 0.95, 1, -(1 - q) * Math.PI / 2); }
      break;
    default: dib(p < 0.5 ? A : B);
  }
  x.restore();
}
// acercamientos (zoom) dentro del clip: c.zooms = [{ ini, dur, x, y, k }] (tiempos del clip, punto 0-1, nivel)
function zoomEnEV(c, t){
  for (const z of c.zooms || []){
    if (t < z.ini || t > z.ini + z.dur) continue;
    const e = suaveEV(Math.max(0, Math.min(1, (t - z.ini) / 0.5, (z.ini + z.dur - t) / 0.5)));
    const k = 1 + (z.k - 1) * e, lim = 0.5 / k;
    return { k, x:Math.max(lim, Math.min(1 - lim, 0.5 + (z.x - 0.5) * e)), y:Math.max(lim, Math.min(1 - lim, 0.5 + (z.y - 0.5) * e)) };
  }
  return null;
}
function pintarClipEV(x, c, local, W0, H0, vivo){
  const L = largoClip(c);
  x.save();
  if (c.fundido) x.globalAlpha = Math.max(0, Math.min(1, local / 0.5, (L - local) / 0.5));
  const tm = c.ini + local * (c.vel || 1), f = fuenteEV(c.blob, tm, vivo);
  if (f){
    const zk = c.zoomLento ? 1 + 0.12 * (local / L) : 1, zf = zoomEnEV(c, local);
    x.save(); if (zf){ x.translate(W0 / 2, H0 / 2); x.scale(zf.k, zf.k); x.translate(-W0 * zf.x, -H0 * zf.y); }
    dibujarMedioEV(x, f.el, f.w, f.h, W0, H0, c.ajuste, zk); x.restore();
  }
  // burbuja de la cámara
  if (c.cam && c.cam.visible !== false){
    const fc = fuenteEV(c.cam.blob, Math.max(0, tm - (c.cam.desfase || 0)), vivo);
    if (fc && fc.w){
      const lado = Math.min(W0, H0) * c.cam.tam, cx = c.cam.x * W0, cy = c.cam.y * H0;
      x.save(); x.beginPath();
      if (c.cam.forma === 'cuadro') x.roundRect ? x.roundRect(cx - lado / 2, cy - lado / 2, lado, lado, lado * 0.12) : x.rect(cx - lado / 2, cy - lado / 2, lado, lado);
      else x.arc(cx, cy, lado / 2, 0, Math.PI * 2);
      x.closePath(); x.save(); x.clip();
      const k = Math.max(lado / fc.w, lado / fc.h);
      x.drawImage(fc.el, cx - fc.w * k / 2, cy - fc.h * k / 2, fc.w * k, fc.h * k);
      x.restore();
      x.lineWidth = Math.max(3, lado * 0.025); x.strokeStyle = c.cam.borde || '#ffffff'; x.stroke(); x.restore();
    }
  }
  x.restore();
}
function dibujarCuadroEV(t, x, W0, H0){
  const principal = x.canvas && x.canvas.id === 'evLienzo';
  if (principal) EV.cajasTexto = [];
  x.save(); x.fillStyle = '#000'; x.fillRect(0, 0, W0, H0);
  const r = clipEnEV(t);
  if (r){
    const tr = transicionEnEV(r);
    if (!tr) pintarClipEV(x, r.c, r.local, W0, H0, true);
    else {
      const cA = lienzoTr(0, W0, H0), cB = lienzoTr(1, W0, H0);
      pintarClipEV(cA.getContext('2d'), tr.A, tr.vivoA ? r.local : largoClip(tr.A), W0, H0, tr.vivoA);
      pintarClipEV(cB.getContext('2d'), tr.B, tr.vivoA ? 0 : r.local, W0, H0, !tr.vivoA);
      componerTransEV(x, tr.B.trans.tipo, Math.max(0, Math.min(1, tr.p)), cA, cB, W0, H0);
    }
    // espacio de plantilla: aviso solo en la vista previa (no sale en el video)
    if (r.c.hueco && principal && !EV.exportando){
      const tam = Math.round(Math.min(W0, H0) * 0.032), msg = '📷 Toca aquí para poner tu foto o video';
      x.save(); x.font = `600 ${tam}px Poppins, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
      const w = x.measureText(msg).width + tam * 1.4, h = tam * 2, y = H0 * 0.03;
      x.fillStyle = 'rgba(0,0,0,.55)'; x.beginPath(); x.roundRect ? x.roundRect(W0 / 2 - w / 2, y, w, h, h / 2) : x.rect(W0 / 2 - w / 2, y, w, h); x.fill();
      x.setLineDash([tam * 0.4, tam * 0.3]); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2; x.stroke();
      x.fillStyle = '#fff'; x.fillText(msg, W0 / 2, y + h / 2); x.restore();
    }
  }
  EV.p.textos.forEach(tx => dibujarTextoEV(x, tx, t, W0, H0, principal));
  x.restore();
}
/* ---------- textos encima (con animación de entrada) ---------- */
const FUENTES_EV = ['Poppins', 'Montserrat', 'Bebas Neue', 'Anton', 'Oswald', 'Raleway', 'Roboto', 'Playfair Display', 'Pacifico', 'Lobster', 'Dancing Script', 'Fredoka', 'Caveat', 'Permanent Marker'];
const ANIM_TEXTO_EV = { fade:'Aparecer', subir:'Subir', pop:'Rebotar (pop)', deslizar:'Deslizar', escribir:'Máquina de escribir', ninguna:'Sin animación' };
function dibujarTextoEV(x, tx, t, W0, H0, guardarCaja){
  if (t < tx.inicio || t > tx.inicio + tx.dur) return;
  const an = tx.anim || 'fade', ent = Math.min(1, (t - tx.inicio) / 0.4), sal = Math.min(1, (tx.inicio + tx.dur - t) / 0.25), eo = 1 - Math.pow(1 - ent, 3);
  let alfa = Math.min(ent, sal), dx = 0, dy = 0, esc = 1, frac = 1;
  if (an === 'subir') dy = (1 - eo) * H0 * 0.06;
  else if (an === 'pop'){ const s = 1.70158, q = ent - 1; esc = 0.5 + 0.5 * (1 + (s + 1) * q * q * q + s * q * q); alfa = Math.min(1, ent * 2, sal); }
  else if (an === 'deslizar') dx = -(1 - eo) * W0 * 0.25;
  else if (an === 'escribir'){ frac = Math.min(1, (t - tx.inicio) / Math.min(1.5, tx.dur * 0.6)); alfa = sal; }
  else if (an === 'ninguna') alfa = 1;
  let tam = Math.round(H0 * (tx.tam || 0.07));
  const letra = n => `${tx.cursiva ? 'italic ' : ''}${tx.negrita === false ? 400 : 700} ${n}px "${tx.fuente || 'Poppins'}", sans-serif`;
  x.save(); x.globalAlpha = Math.max(0, alfa); x.font = letra(tam); x.textAlign = 'center'; x.textBaseline = 'middle';
  const texto = tx.mayus ? String(tx.texto || '').toUpperCase() : String(tx.texto || '');
  let lineas = partirTextoEV(x, texto, W0 * 0.86), ancho = Math.max(1, ...lineas.map(l => x.measureText(l).width));
  // una palabra muy larga: se achica la letra hasta que quepa
  while (ancho > W0 * 0.9 && tam > 8){ tam = Math.floor(tam * 0.92); x.font = letra(tam); lineas = partirTextoEV(x, texto, W0 * 0.86); ancho = Math.max(1, ...lineas.map(l => x.measureText(l).width)); }
  const lh = tam * 1.25, alto = lh * lineas.length;
  const cx = (tx.x ?? 0.5) * W0;
  const cy = tx.y != null ? tx.y * H0 : tx.pos === 'arriba' ? H0 * 0.12 + alto / 2 : tx.pos === 'centro' ? H0 / 2 : H0 * 0.86 - alto / 2;
  if (guardarCaja) EV.cajasTexto.push({ id:tx.id, x0:cx - ancho / 2 - tam * 0.6, x1:cx + ancho / 2 + tam * 0.6, y0:cy - alto / 2 - tam * 0.35, y1:cy + alto / 2 + tam * 0.35 });
  x.translate(cx + dx, cy + dy); if (esc !== 1) x.scale(esc, esc);
  let vis = lineas;
  if (frac < 1){ let n = Math.ceil(lineas.join('').length * frac); vis = lineas.map(l => { const s = l.slice(0, Math.max(0, n)); n -= l.length; return s; }); }
  if (tx.fondo){
    x.fillStyle = tx.fondo; const rx = -ancho / 2 - tam * 0.6, ry = -alto / 2 - tam * 0.35;
    x.beginPath(); x.roundRect ? x.roundRect(rx, ry, ancho + tam * 1.2, alto + tam * 0.7, tam * 0.3) : x.rect(rx, ry, ancho + tam * 1.2, alto + tam * 0.7); x.fill();
  } else if (!tx.borde){ x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = tam * 0.25; }
  vis.forEach((l, i) => {
    const y = -alto / 2 + lh * (i + 0.5);
    if (tx.borde){ x.lineWidth = Math.max(2, tam * 0.14); x.lineJoin = 'round'; x.strokeStyle = tx.borde; x.strokeText(l, 0, y); }
    x.fillStyle = tx.color || '#ffffff'; x.fillText(l, 0, y);
  });
  x.restore();
}
function partirTextoEV(x, texto, max){
  const out = [];
  String(texto).split('\n').forEach(par => {
    let l = ''; par.split(' ').forEach(p => { const prueba = l ? l + ' ' + p : p; if (x.measureText(prueba).width > max && l){ out.push(l); l = p; } else l = prueba; });
    out.push(l);
  });
  return out;
}

/* ---------- reproducción ---------- */
function elementosEnUso(r){ const out = []; if (!r) return out; const m = EV.medios[r.c.blob]; if (m && m.el && m.tipo !== 'imagen') out.push([m.el, r.c, false]); if (r.c.cam){ const mc = EV.medios[r.c.cam.blob]; if (mc && mc.el) out.push([mc.el, r.c, true]); } return out; }
function pausarTodoEV(){ Object.values(EV.medios).forEach(m => { if (m.el && m.el.pause) m.el.pause(); }); }
let clipSonando = null, rafEV = 0, inicioPlay = 0, tInicioPlay = 0;
function sincronizarEV(r, reproduciendo){
  const usados = elementosEnUso(r);
  Object.values(EV.medios).forEach(m => { if (m.el && m.el.pause && m.tipo !== 'audio' && !usados.some(u => u[0] === m.el)) m.el.pause(); });
  usados.forEach(([el, c, esCam]) => {
    const quiero = Math.max(0, c.ini + r.local * (c.vel || 1) - (esCam ? (c.cam.desfase || 0) : 0));
    el.playbackRate = c.vel || 1;
    if (el._gain) el._gain.gain.value = (esCam && !c.cam.conAudio) || c.mute ? 0 : (c.vol ?? 1);
    if (reproduciendo){
      if (Math.abs(el.currentTime - quiero) > 0.35 || el.paused){ try { el.currentTime = quiero; } catch (e) {} }
      if (el.paused) el.play().catch(() => {});
    } else { el.pause(); try { if (Math.abs(el.currentTime - quiero) > 0.03) el.currentTime = quiero; } catch (e) {} }
  });
  // música
  const mu = EV.p.musica, mm = mu && EV.medios[mu.blob];
  if (mm && mm.el){
    if (mm.el._gain) mm.el._gain.gain.value = mu.vol ?? 0.35;
    const quiero = ((mu.desde || 0) + EV.t) % Math.max(0.5, mm.dur);
    if (reproduciendo){ if (Math.abs(mm.el.currentTime - quiero) > 0.4) mm.el.currentTime = quiero; if (mm.el.paused) mm.el.play().catch(() => {}); }
    else mm.el.pause();
  }
}
function cuadroEV(){
  const cv = $('evLienzo'); if (!cv) return;
  dibujarCuadroEV(EV.t, cv.getContext('2d'), cv.width, cv.height);
  pintarCabezalEV();
}
function verEnEV(t){
  EV.t = Math.max(0, Math.min(t, totalEV()));
  const r = clipEnEV(EV.t);
  sincronizarEV(r, EV.play);
  if (!EV.play){
    const us = elementosEnUso(r);
    Promise.all(us.map(([el]) => new Promise(ok => { if (el.seeking){ el.addEventListener('seeked', ok, { once:true }); setTimeout(ok, 800); } else ok(); }))).then(cuadroEV);
  }
  cuadroEV();
}
function reproducirEV(v){
  if (v === undefined) v = !EV.play;
  if (v && !EV.p.clips.length) return toast('Primero agrega un video, una imagen o una grabación');
  if (v && !EV.play && snapsNecesariosEV().length){ prepararSnapsEV().then(() => reproducirEV(true)); return; }
  audioEV();
  EV.play = v; $('evPlay').innerHTML = v ? '❚❚' : '▶'; $('evPlay').setAttribute('aria-label', v ? 'Pausa' : 'Reproducir');
  if (EV.t >= totalEV() - 0.05) EV.t = 0;
  cancelAnimationFrame(rafEV);
  if (!v){ EV.pararEn = null; pausarTodoEV(); verEnEV(EV.t); return; }
  inicioPlay = performance.now(); tInicioPlay = EV.t;
  const paso = () => {
    if (!EV.play) return;
    EV.t = tInicioPlay + (performance.now() - inicioPlay) / 1000;
    if (EV.pararEn != null && EV.t >= EV.pararEn){ EV.pararEn = null; reproducirEV(false); return; }
    if (EV.t >= totalEV()){ EV.t = totalEV(); cuadroEV(); if (EV.alTerminar){ const f = EV.alTerminar; EV.alTerminar = null; f(); } reproducirEV(false); return; }
    sincronizarEV(clipEnEV(EV.t), true); cuadroEV();
    rafEV = requestAnimationFrame(paso);
  };
  sincronizarEV(clipEnEV(EV.t), true);
  rafEV = requestAnimationFrame(paso);
}

/* ---------- interfaz ---------- */
(function(){
  const d = document.createElement('div'); d.id = 'estudioVideo'; d.className = 'modal'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Estudio de video');
  d.innerHTML = `
  <header class="evCab">
    <button class="pb" id="evVolver" title="Volver al diseño">‹ Volver al diseño</button>
    <b class="evTitulo">🎬 Estudio de video</b>
    <input id="evNombre" class="buscador" maxlength="60" aria-label="Nombre del video">
    <span class="evEsp"></span>
    <label class="evFmt">Formato <select id="evFormato">${Object.keys(FORMATOS_EV).map(k => `<option value="${k}">${{ '16:9':'16:9 horizontal (YouTube, clase)', '9:16':'9:16 vertical (Reels, TikTok)', '1:1':'1:1 cuadrado', '4:5':'4:5 (Instagram)' }[k]}</option>`).join('')}</select></label>
    <button class="pb" id="evDeshacer" title="Deshacer (Ctrl+Z)" aria-label="Deshacer">↶</button><button class="pb" id="evRehacer" title="Rehacer (Ctrl+Y)" aria-label="Rehacer">↷</button>
    <button class="btnP" id="evExportar">⬇ Exportar video</button>
  </header>
  <div class="evCuerpo">
    <aside class="evLado">
      <nav class="evTabs" role="tablist">
        <button data-et="plantillas">✨ Plantillas</button><button data-et="grabar" class="on">🎥 Grabar</button><button data-et="subir">⬆ Subir</button><button data-et="diseno">🖼 Mi diseño</button>
        <button data-et="texto">T Texto</button><button data-et="transiciones">🔀 Transiciones</button><button data-et="musica">♪ Música</button><button data-et="editar">✎ Editar</button>
      </nav>
      <div class="evPanel" id="etPlantillas" hidden>
        <p class="hint">Elige una plantilla, cambia los textos y pon tus fotos o videos en cada escena.</p>
        <div class="evChips" id="evPlCats"></div>
        <div class="evPlantillas" id="evPlLista"></div>
      </div>
      <div class="evPanel" id="etGrabar">
        <p class="hint">Graba y aparece en tu línea de tiempo, lista para editar.</p>
        <div class="evModos">
          <button class="evModo" data-m="pantalla"><span>🖥</span><b>Pantalla</b><small>Una ventana, pestaña o toda la pantalla</small></button>
          <button class="evModo" data-m="camara"><span>📷</span><b>Cámara</b><small>Solo tú</small></button>
          <button class="evModo" data-m="ambas"><span>🖥📷</span><b>Pantalla + cámara</b><small>Tú en una burbuja que puedes mover</small></button>
          <button class="evModo" data-m="presentacion"><span>▶📷</span><b>Mi presentación + cámara</b><small>Presenta tu diseño mientras te grabas</small></button>
        </div>
        <label class="filaCheck"><input type="checkbox" id="evMic" checked> Grabar mi voz (micrófono)</label>
        <label class="filaCheck"><input type="checkbox" id="evAudioPc" checked> Grabar el sonido de la computadora (si lo permites al compartir)</label>
        <label class="filaCheck"><input type="checkbox" id="evCuenta" checked> Cuenta regresiva de 3 segundos</label>
        <p class="hint" id="evSinPantalla" hidden>Este dispositivo no permite grabar la pantalla (en celulares solo se puede la cámara).</p>
      </div>
      <div class="evPanel" id="etSubir" hidden>
        <button class="bigbtn" id="evSubirBtn">⬆ Subir videos, imágenes o música</button>
        <input type="file" id="evArchivo" accept="video/*,image/*,audio/*" multiple hidden>
        <div class="drop" id="evDrop">o arrástralos aquí</div>
        <h4>Mis archivos</h4><div id="evBiblio" class="evBiblio"></div>
      </div>
      <div class="evPanel" id="etDiseno" hidden>
        <p class="hint">Convierte las páginas de tu diseño en diapositivas del video.</p>
        <label class="fila"><span>Segundos por página</span><input type="number" id="evSegPag" min="1" max="60" value="5"></label>
        <label class="fila"><span>Transición</span><select id="evPagTrans">${Object.entries(TRANS_EV).map(([k, n]) => `<option value="${k}"${k === 'disolver' ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="filaCheck"><input type="checkbox" id="evPagFundido"> Aparecer y desaparecer desde negro</label>
        <button class="bigbtn" id="evTodasPag">🖼 Agregar todas las páginas</button>
        <button class="bigbtn" id="evPagActual">Agregar solo la página actual</button>
      </div>
      <div class="evPanel" id="etTexto" hidden>
        <p class="hint">Se agrega en el punto donde está la línea roja.</p>
        <button class="bigbtn" data-txt="titulo" style="font-weight:800;font-size:18px">Título grande al centro</button>
        <button class="bigbtn" data-txt="subtitulo">Subtítulo abajo (con fondo)</button>
        <button class="bigbtn" data-txt="arriba">Texto arriba</button>
        <h4>Estilos para reels y TikTok</h4>
        <button class="bigbtn" data-txt="tiktok" style="font-family:'Anton';font-size:19px;letter-spacing:.5px;color:#fff;-webkit-text-stroke:1px #000;text-shadow:0 0 2px #000">TEXTO CON CONTORNO</button>
        <button class="bigbtn" data-txt="etiqueta"><span style="background:#ffd60a;color:#111;padding:2px 8px;border-radius:6px;font-weight:700">Etiqueta de color</span></button>
        <button class="bigbtn" data-txt="escribir" style="font-family:'Courier New',monospace">Texto que se escribe solo_</button>
        <button class="bigbtn" data-txt="elegante" style="font-family:'Playfair Display';font-style:italic;font-size:17px">Frase elegante</button>
        <button class="bigbtn" data-txt="divertido" style="font-family:'Pacifico';font-size:17px">Divertido</button>
      </div>
      <div class="evPanel" id="etTransiciones" hidden>
        <p class="hint" id="evTrInfo"></p>
        <div class="evTrans" id="evTransGrid"></div>
        <label class="fila"><span>Duración</span><input type="range" id="evTrDur" min="0.2" max="1.5" step="0.1" value="0.6"><b id="evTrDurTxt">0.6 s</b></label>
        <button class="bigbtn" id="evTrTodos">🔀 Usar esta transición en todos los cortes</button>
        <button class="bigbtn" id="evTrQuitar">Quitar todas las transiciones</button>
        <p class="hint">También puedes tocar el rombo ◆ entre dos clips en la línea de tiempo.</p>
      </div>
      <div class="evPanel" id="etMusica" hidden>
        <button class="bigbtn" id="evMusicaBtn">♪ Subir una canción o audio</button>
        <input type="file" id="evArchivoMusica" accept="audio/*" hidden>
        <p class="hint">Usa música libre de derechos (por ejemplo, la Biblioteca de audio de YouTube).</p>
        <div id="evMusicaInfo"></div>
      </div>
      <div class="evPanel" id="etEditar" hidden><div id="evInspector"><p class="hint">Toca un clip, un texto o la música en la línea de tiempo para editarlo.</p></div></div>
    </aside>
    <section class="evCentro">
      <div class="evVista"><canvas id="evLienzo" width="1280" height="720"></canvas>
        <div id="evVacio" class="evVacio"><b>Tu video empieza aquí</b><span>Graba tu pantalla o cámara, sube un video, agrega las páginas de tu diseño o empieza con una ✨ plantilla.</span></div></div>
      <div class="evControles">
        <button class="pb" id="evInicio" title="Ir al inicio" aria-label="Ir al inicio">⏮</button>
        <button class="btnP" id="evPlay" aria-label="Reproducir">▶</button>
        <span id="evTiempo">0:00.0 / 0:00.0</span>
        <span class="evEsp"></span>
        <button class="pb" id="evDividir" title="Dividir el clip en la línea roja (S)">✂ Dividir</button>
        <button class="pb" id="evBorrar" title="Borrar lo seleccionado (Supr)">🗑</button>
        <label class="evZoom">🔍 <input type="range" id="evZoomLinea" min="8" max="240" value="40" aria-label="Acercar la línea de tiempo"></label>
      </div>
    </section>
  </div>
  <div class="evLinea" id="evLinea">
    <div class="evRegla" id="evRegla"></div>
    <div class="evPista" id="evPistaVideo" data-nombre="Video"></div>
    <div class="evPista evPistaTexto" id="evPistaTexto" data-nombre="Textos"></div>
    <div class="evPista evPistaMusica" id="evPistaMusica" data-nombre="Música"></div>
    <div class="evCabezal" id="evCabezal"></div>
  </div>
  <div id="evGrabando" hidden><span class="punto"></span><b id="evGrabTiempo">0:00</b><span class="evNivel" id="evNivelMic" title="Tu voz (micrófono)" hidden>🎤<span class="pistaNivel"><i></i></span></span><span class="evNivel" id="evNivelPc" title="Sonido de la computadora" hidden>🔊<span class="pistaNivel"><i></i></span></span><button class="pb" id="evGrabPausa">❚❚ Pausa</button><button class="btnP" id="evGrabStop">■ Detener</button></div>
  <div id="evCuentaAtras" hidden></div>
  <div id="evPregunta" hidden><div class="caja"><h3></h3><div class="evPregCuerpo"></div><label class="filaCheck" hidden><input type="checkbox"> <span></span></label><div class="acciones"></div></div></div>
  <input type="file" id="evReemplazo" accept="video/*,image/*" hidden>
  <div id="evCamVivo" hidden><video autoplay muted playsinline></video></div>
  <div id="evExportando" hidden><div class="caja"><h3>⬇ Creando tu video…</h3><p class="hint">No cambies de pestaña mientras se crea (el navegador lo pausaría).</p><div class="evBarraProg"><i id="evProg"></i></div><p id="evProgTxt" class="hint"></p><div class="acciones"><button class="btnS" id="evCancelarExp">Cancelar</button></div></div></div>`;
  document.body.appendChild(d);
  // pestañas
  d.querySelectorAll('.evTabs button').forEach(b => b.onclick = () => tabEV(b.dataset.et));
  $('evVolver').onclick = cerrarEstudioVideo;
  $('evNombre').oninput = e => { EV.p.nombre = e.target.value; guardarProyectoEV(false); };
  $('evFormato').onchange = e => { EV.p.formato = e.target.value; ajustarLienzoEV(); guardarProyectoEV(); verEnEV(EV.t); };
  $('evDeshacer').onclick = () => deshacerEV(-1); $('evRehacer').onclick = () => deshacerEV(1);
  $('evPlay').onclick = () => reproducirEV(); $('evInicio').onclick = () => { reproducirEV(false); verEnEV(0); };
  $('evDividir').onclick = dividirEV; $('evBorrar').onclick = borrarSelEV;
  $('evZoomLinea').oninput = e => { EV.pps = +e.target.value; pintarLineaEV(); };
  $('evExportar').onclick = exportarEV; $('evCancelarExp').onclick = () => { EV.cancelado = true; };
  // subir
  $('evSubirBtn').onclick = () => $('evArchivo').click();
  $('evArchivo').onchange = async e => { for (const f of e.target.files) await agregarArchivoEV(f); e.target.value = ''; };
  $('evMusicaBtn').onclick = () => $('evArchivoMusica').click();
  $('evArchivoMusica').onchange = async e => { if (e.target.files[0]) await agregarArchivoEV(e.target.files[0]); e.target.value = ''; };
  const drop = $('evDrop');
  ['dragover', 'dragenter'].forEach(n => d.addEventListener(n, e => { if ([...(e.dataTransfer.types || [])].includes('Files')){ e.preventDefault(); drop.classList.add('sobre'); } }));
  ['dragleave', 'drop'].forEach(n => d.addEventListener(n, () => drop.classList.remove('sobre')));
  d.addEventListener('drop', async e => { if (!e.dataTransfer.files.length) return; e.preventDefault(); for (const f of e.dataTransfer.files) await agregarArchivoEV(f); });
  // diseño → diapositivas
  $('evTodasPag').onclick = () => paginasAClipsEV(true); $('evPagActual').onclick = () => paginasAClipsEV(false);
  // textos
  d.querySelectorAll('[data-txt]').forEach(b => b.onclick = () => agregarTextoEV(b.dataset.txt));
  // grabar
  d.querySelectorAll('.evModo').forEach(b => b.onclick = () => grabarEV(b.dataset.m));
  if (!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)){ d.querySelectorAll('.evModo[data-m="pantalla"], .evModo[data-m="ambas"], .evModo[data-m="presentacion"]').forEach(b => b.hidden = true); $('evSinPantalla').hidden = false; }
  $('evGrabStop').onclick = () => detenerGrabacionEV(); $('evGrabPausa').onclick = () => pausarGrabacionEV();
  // línea de tiempo: clic en la regla o en un espacio vacío mueve la línea roja
  $('evLinea').addEventListener('pointerdown', e => {
    if (e.target.closest('.clipEv, .textoEv, .musicaEv, .transEv')) return;
    const mover = ev => { const r = $('evLinea').getBoundingClientRect(); verEnEV((ev.clientX - r.left + $('evLinea').scrollLeft - 90) / EV.pps); };
    if (EV.play) reproducirEV(false);
    mover(e);
    const fin = () => { window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', fin); };
    window.addEventListener('pointermove', mover); window.addEventListener('pointerup', fin);
  });
  // mover la burbuja de la cámara con el mouse sobre la vista previa
  const cv = $('evLienzo');
  cv.addEventListener('pointerdown', e => {
    const r = clipEnEV(EV.t); if (!r || !r.c.cam) return;
    const b = cv.getBoundingClientRect(), fx = (e.clientX - b.left) / b.width, fy = (e.clientY - b.top) / b.height;
    const lado = Math.min(cv.width, cv.height) * r.c.cam.tam;
    if (Math.hypot((fx - r.c.cam.x) * cv.width, (fy - r.c.cam.y) * cv.height) > lado / 2) return;
    e.preventDefault(); cv.setPointerCapture(e.pointerId);
    const c = r.c, mover = ev => { c.cam.x = Math.max(0.05, Math.min(0.95, (ev.clientX - b.left) / b.width)); c.cam.y = Math.max(0.05, Math.min(0.95, (ev.clientY - b.top) / b.height)); cuadroEV(); };
    const fin = () => { cv.removeEventListener('pointermove', mover); cv.removeEventListener('pointerup', fin); guardarProyectoEV(); pintarInspectorEV(); };
    cv.addEventListener('pointermove', mover); cv.addEventListener('pointerup', fin);
  });
  cv.addEventListener('pointermove', e => {
    const r = clipEnEV(EV.t); if (!r || !r.c.cam){ cv.style.cursor = ''; return; }
    const b = cv.getBoundingClientRect(), lado = Math.min(cv.width, cv.height) * r.c.cam.tam;
    cv.style.cursor = Math.hypot(((e.clientX - b.left) / b.width - r.c.cam.x) * cv.width, ((e.clientY - b.top) / b.height - r.c.cam.y) * cv.height) <= lado / 2 ? 'move' : '';
  });
  // teclado dentro del estudio
  document.addEventListener('keydown', e => {
    if (!d.classList.contains('abierto')) return;
    const tag = (document.activeElement || {}).tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)){ e.stopImmediatePropagation(); return; }
    const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    let ok = true;
    if (k === ' ') reproducirEV();
    else if (ctrl && k === 'z' && !e.shiftKey) deshacerEV(-1);
    else if (ctrl && (k === 'y' || (k === 'z' && e.shiftKey))) deshacerEV(1);
    else if (k === 's' && !ctrl) dividirEV();
    else if (k === 'delete' || k === 'backspace') borrarSelEV();
    else if (k === 'arrowleft') verEnEV(EV.t - (e.shiftKey ? 1 : 1 / 30));
    else if (k === 'arrowright') verEnEV(EV.t + (e.shiftKey ? 1 : 1 / 30));
    else if (k === 'home') verEnEV(0);
    else if (k === 'escape'){ if (EV.play) reproducirEV(false); else ok = false; }
    else ok = !ctrl;      // en el estudio, las teclas no llegan al diseño
    if (ok) e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
})();
function tabEV(k){
  document.querySelectorAll('.evTabs button').forEach(b => b.classList.toggle('on', b.dataset.et === k));
  document.querySelectorAll('.evPanel').forEach(p => p.hidden = p.id !== 'et' + k[0].toUpperCase() + k.slice(1));
  if (k === 'editar') pintarInspectorEV();
  if (k === 'subir') pintarBibliotecaEV();
  if (k === 'transiciones') pintarTransEV();
  if (k === 'plantillas' && window.pintarPlantillasEV) pintarPlantillasEV();
}
function ajustarLienzoEV(){
  const [w, h] = FORMATOS_EV[EV.p.formato] || FORMATOS_EV['16:9'], cv = $('evLienzo');
  if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
  $('evFormato').value = EV.p.formato;
}
async function abrirEstudioVideo(){
  cerrarMenuCtx && cerrarMenuCtx();
  const d = $('estudioVideo'); d.classList.add('abierto');
  audioEV();
  if (!EV.cargado){
    EV.cargado = true;
    try { const j = await dbEVop('estado', 'readonly', st => st.get('proyecto')); if (j) EV.p = { ...EV.p, ...JSON.parse(j) }; } catch (e) {}
    const ids = new Set([...EV.p.clips.flatMap(c => [c.blob, c.cam && c.cam.blob]), EV.p.musica && EV.p.musica.blob].filter(Boolean));
    await Promise.all([...ids].map(id => cargarMedioEV(id).catch(() => { EV.p.clips = EV.p.clips.filter(c => c.blob !== id); })));
    EV.hist = [JSON.stringify(EV.p)]; EV.hi = 0;
  }
  $('evNombre').value = EV.p.nombre || 'Mi video';
  ajustarLienzoEV(); pintarTodoEV(); verEnEV(EV.t);
  prepararSnapsEV();
}
function cerrarEstudioVideo(){ reproducirEV(false); $('estudioVideo').classList.remove('abierto'); }
function pintarTodoEV(){
  $('evVacio').hidden = EV.p.clips.length > 0;
  pintarLineaEV(); pintarInspectorEV(); pintarMusicaInfoEV();
  verEnEV(Math.min(EV.t, totalEV()));
}
function pintarCabezalEV(){
  const cab = $('evCabezal'); if (cab) cab.style.left = (90 + EV.t * EV.pps) + 'px';
  const tt = $('evTiempo'); if (tt) tt.textContent = fmtT(EV.t) + ' / ' + fmtT(totalEV());
}
function pintarLineaEV(){
  const total = totalEV(), ancho = Math.max(600, (total + 8) * EV.pps);
  // regla
  const reg = $('evRegla'); let h = '';
  const paso = EV.pps > 120 ? 1 : EV.pps > 50 ? 2 : EV.pps > 20 ? 5 : 10;
  for (let s = 0; s <= total + 8; s += paso) h += `<span style="left:${90 + s * EV.pps}px">${fmtT(s).replace(/\.\d$/, '')}</span>`;
  reg.innerHTML = h; reg.style.width = (90 + ancho) + 'px';
  // clips
  let acc = 0;
  $('evPistaVideo').innerHTML = EV.p.clips.map((c, i) => {
    const L = largoClip(c), m = EV.medios[c.blob] || {}, x = 90 + acc * EV.pps; acc += L;
    const sel = EV.sel && EV.sel.tipo === 'clip' && EV.sel.id === c.id;
    return `<div class="clipEv${sel ? ' sel' : ''}${c.tipo === 'imagen' ? ' img' : ''}" data-id="${c.id}" data-i="${i}" style="left:${x}px;width:${Math.max(6, L * EV.pps - 2)}px;background-image:url('${m.thumb || ''}')" title="${esc(c.nombre)} · ${fmtT(L)}">
      ${(c.zooms || []).map(z => `<i class="zoomEv" style="left:${z.ini * EV.pps}px;width:${Math.max(4, z.dur * EV.pps)}px" title="Acercamiento ${z.k}×"></i>`).join('')}<span class="asaEv izq" data-asa="izq"></span><b>${c.cam ? '📷 ' : ''}${(c.zooms || []).length ? '🔍 ' : ''}${esc(c.nombre)}</b><small>${fmtT(L)}${c.vel !== 1 ? ' · ' + c.vel + '×' : ''}${c.mute ? ' · 🔇' : ''}</small><span class="asaEv der" data-asa="der"></span></div>`;
  }).join('');
  // rombos de transición entre clips
  acc = 0;
  $('evPistaVideo').insertAdjacentHTML('beforeend', EV.p.clips.map((c, i) => { const x = 90 + acc * EV.pps; acc += largoClip(c); if (!i) return '';
    const on = transActiva(c); return `<button class="transEv${on ? ' on' : ''}" data-i="${i}" style="left:${x - 11}px" title="${on ? 'Transición: ' + TRANS_EV[c.trans.tipo] : 'Poner una transición'}">${on ? '◆' : '◇'}</button>`; }).join(''));
  $('evPistaVideo').style.width = (90 + ancho) + 'px';
  // textos que se enciman van en carriles distintos
  const carriles = [], carril = {};
  EV.p.textos.slice().sort((a, b) => a.inicio - b.inicio).forEach(tx => { let k = carriles.findIndex(f => f <= tx.inicio + 0.01); if (k < 0){ k = carriles.length; carriles.push(0); } carriles[k] = tx.inicio + tx.dur; carril[tx.id] = k; });
  $('evPistaTexto').style.height = Math.max(34, carriles.length * 26 + 8) + 'px';
  $('evPistaTexto').innerHTML = EV.p.textos.map(tx => `<div class="textoEv${EV.sel && EV.sel.tipo === 'texto' && EV.sel.id === tx.id ? ' sel' : ''}" data-id="${tx.id}" style="left:${90 + tx.inicio * EV.pps}px;width:${Math.max(6, tx.dur * EV.pps - 2)}px;top:${4 + carril[tx.id] * 26}px;bottom:auto;height:22px" title="${esc(tx.texto)}">T ${esc(tx.texto.split('\n')[0])}<span class="asaEv der" data-asa="der"></span></div>`).join('');
  $('evPistaTexto').style.width = (90 + ancho) + 'px';
  const mu = EV.p.musica;
  $('evPistaMusica').innerHTML = mu ? `<div class="musicaEv${EV.sel && EV.sel.tipo === 'musica' ? ' sel' : ''}" style="left:90px;width:${Math.max(60, total * EV.pps - 2)}px">♪ ${esc(mu.nombre)} · volumen ${Math.round(mu.vol * 100)}%</div>` : '';
  $('evPistaMusica').style.width = (90 + ancho) + 'px';
  $('evCabezal').style.height = $('evLinea').scrollHeight + 'px';
  conectarLineaEV(); pintarCabezalEV();
}
function conectarLineaEV(){
  // clips: tocar = seleccionar; arrastrar = cambiar de lugar; orillas = recortar
  document.querySelectorAll('.clipEv').forEach(el => el.onpointerdown = e => {
    e.preventDefault(); e.stopPropagation(); if (EV.play) reproducirEV(false);
    const c = EV.p.clips.find(x => x.id === el.dataset.id), asa = e.target.dataset.asa, x0 = e.clientX;
    EV.sel = { tipo:'clip', id:c.id };
    document.querySelectorAll('.clipEv, .textoEv, .musicaEv').forEach(x => x.classList.toggle('sel', x === el));
    const iniO = c.ini, finO = c.fin, durMax = (EV.medios[c.blob] || {}).dur || 9999;
    let movido = false;
    const mover = ev => {
      const dx = (ev.clientX - x0) / EV.pps; if (Math.abs(ev.clientX - x0) > 3) movido = true;
      if (asa === 'izq'){ c.ini = Math.max(0, Math.min(c.fin - 0.1, iniO + dx * (c.vel || 1))); }
      else if (asa === 'der'){ c.fin = c.tipo === 'imagen' ? Math.max(c.ini + 0.3, finO + dx) : Math.max(c.ini + 0.1, Math.min(durMax, finO + dx * (c.vel || 1))); }
      else { el.style.transform = `translateX(${ev.clientX - x0}px)`; el.style.zIndex = 5; return; }
      pintarLineaEV(); verEnEV(asa === 'izq' ? inicioClipEV(c.id) : inicioClipEV(c.id) + largoClip(c) - 0.01);
    };
    const fin = ev => {
      window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', fin);
      if (!asa && movido){
        // nueva posición según dónde se soltó
        const r = $('evLinea').getBoundingClientRect(), t = (ev.clientX - r.left + $('evLinea').scrollLeft - 90) / EV.pps;
        const sin = EV.p.clips.filter(x => x !== c); let acc = 0, pos = sin.length;
        for (let i = 0; i < sin.length; i++){ const L = largoClip(sin[i]); if (t < acc + L / 2){ pos = i; break; } acc += L; }
        sin.splice(pos, 0, c); EV.p.clips = sin;
      } else if (!asa && !movido){ verEnEV(inicioClipEV(c.id) + 0.001); tabEV('editar'); }
      guardarProyectoEV(); pintarTodoEV();
    };
    window.addEventListener('pointermove', mover); window.addEventListener('pointerup', fin);
  });
  document.querySelectorAll('.textoEv').forEach(el => el.onpointerdown = e => {
    e.preventDefault(); e.stopPropagation(); if (EV.play) reproducirEV(false);
    const tx = EV.p.textos.find(x => x.id === el.dataset.id), asa = e.target.dataset.asa, x0 = e.clientX, i0 = tx.inicio, d0 = tx.dur;
    EV.sel = { tipo:'texto', id:tx.id };
    let movido = false;
    const mover = ev => { const dx = (ev.clientX - x0) / EV.pps; if (Math.abs(ev.clientX - x0) > 3) movido = true;
      if (asa === 'der') tx.dur = Math.max(0.3, d0 + dx); else tx.inicio = Math.max(0, i0 + dx);
      pintarLineaEV(); verEnEV(asa === 'der' ? tx.inicio + tx.dur - 0.01 : tx.inicio + 0.01); };
    const fin = () => { window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', fin); if (!movido){ verEnEV(tx.inicio + 0.3); tabEV('editar'); } guardarProyectoEV(); pintarTodoEV(); };
    window.addEventListener('pointermove', mover); window.addEventListener('pointerup', fin);
  });
  document.querySelectorAll('.transEv').forEach(b => { b.onpointerdown = e => e.stopPropagation(); b.onclick = e => {
    e.stopPropagation(); const c = EV.p.clips[+b.dataset.i]; if (!c) return; if (EV.play) reproducirEV(false);
    EV.sel = { tipo:'clip', id:c.id }; verEnEV(inicioClipEV(c.id)); pintarLineaEV(); tabEV('transiciones'); }; });
  const mu = document.querySelector('.musicaEv');
  if (mu) mu.onpointerdown = e => { e.stopPropagation(); EV.sel = { tipo:'musica' }; pintarLineaEV(); tabEV('editar'); };
}
// ---------- inspector (pestaña Editar) ----------
function pintarInspectorEV(){
  const box = $('evInspector'); if (!box) return;
  const s = EV.sel;
  if (s && s.tipo === 'clip'){
    const c = EV.p.clips.find(x => x.id === s.id); if (!c){ EV.sel = null; return pintarInspectorEV(); }
    const m = EV.medios[c.blob] || {}, video = c.tipo === 'video';
    const idx = EV.p.clips.indexOf(c);
    box.innerHTML = `<h4>${c.hueco ? '✨ Escena de plantilla' : video ? '🎞 Clip de video' : '🖼 Imagen'}</h4>
      ${c.hueco ? `<p class="hint">Este es un espacio para tu foto o video. Los textos se quedan.</p>` : ''}
      <button class="bigbtn" id="evInsReemplazar">🔁 ${c.hueco ? 'Poner mi foto o video aquí' : 'Cambiar por otra foto o video'}</button>
      <label class="fila"><span>Nombre</span><input class="buscador" data-c="nombre" value="${esc(c.nombre)}"></label>
      ${video ? `<label class="fila"><span>Empieza en</span><input type="number" step="0.1" min="0" data-c="ini" value="${c.ini.toFixed(1)}"> s</label>
      <label class="fila"><span>Termina en</span><input type="number" step="0.1" min="0" data-c="fin" value="${c.fin.toFixed(1)}"> s</label>
      <p class="hint">Duración original: ${fmtT(m.dur)}. También puedes recortar jalando las orillas del clip.</p>
      <label class="fila"><span>Velocidad</span><select data-c="vel">${[0.5, 0.75, 1, 1.25, 1.5, 2].map(v => `<option value="${v}"${v === c.vel ? ' selected' : ''}>${v}×</option>`).join('')}</select></label>
      <label class="fila"><span>Volumen</span><input type="range" min="0" max="2" step="0.05" data-c="vol" value="${c.vol}"></label>
      <label class="filaCheck"><input type="checkbox" data-c="mute"${c.mute ? ' checked' : ''}> Silenciar este clip</label>`
      : `<label class="fila"><span>Duración</span><input type="number" step="0.5" min="0.5" data-c="durImg" value="${(c.fin - c.ini).toFixed(1)}"> s</label>
      <label class="filaCheck"><input type="checkbox" data-c="zoomLento"${c.zoomLento ? ' checked' : ''}> Acercamiento lento (efecto documental)</label>`}
      <label class="fila"><span>Ajuste</span><select data-c="ajuste"><option value="cubrir"${c.ajuste === 'cubrir' ? ' selected' : ''}>Llenar toda la pantalla</option><option value="encajar"${c.ajuste === 'encajar' ? ' selected' : ''}>Que se vea completo</option></select></label>
      <label class="filaCheck"><input type="checkbox" data-c="fundido"${c.fundido ? ' checked' : ''}> Aparecer y desaparecer desde negro</label>
      ${idx > 0 ? `<label class="fila"><span>Transición al entrar</span><select data-c="trans">${Object.entries(TRANS_EV).map(([k, n]) => `<option value="${k}"${(c.trans && c.trans.tipo || 'ninguna') === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}
      <h4>🔍 Acercamientos</h4>
      <p class="hint" style="margin-top:0">Acércate a una parte (por ejemplo, donde das clic) durante unos segundos.</p>
      ${(c.zooms || []).map((z, j) => `<div class="evZoomItem" data-z="${j}">
        <label class="fila"><span>Empieza</span><input type="number" step="0.1" min="0" data-zk="ini" value="${z.ini.toFixed(1)}"> s</label>
        <label class="fila"><span>Dura</span><input type="number" step="0.1" min="0.6" data-zk="dur" value="${z.dur.toFixed(1)}"> s</label>
        <label class="fila"><span>Cuánto</span><input type="range" min="1.2" max="4" step="0.1" data-zk="k" value="${z.k}"><b>${z.k}×</b></label>
        <div class="filaPop"><button class="pb" data-zpunto>🎯 Elegir el punto en el video</button><button class="pb" data-zver>▶ Ver</button><button class="pb peligro" data-zquitar aria-label="Quitar acercamiento">🗑</button></div></div>`).join('')}
      <button class="bigbtn" id="evInsZoom">🔍 Acercar aquí (en la línea roja)</button>
      ${c.cam ? `<h4>📷 Burbuja de la cámara</h4>
        <label class="filaCheck"><input type="checkbox" data-cam="visible"${c.cam.visible !== false ? ' checked' : ''}> Mostrar</label>
        <label class="fila"><span>Tamaño</span><input type="range" min="0.12" max="0.6" step="0.01" data-cam="tam" value="${c.cam.tam}"></label>
        <label class="fila"><span>Forma</span><select data-cam="forma"><option value="circulo"${c.cam.forma !== 'cuadro' ? ' selected' : ''}>Círculo</option><option value="cuadro"${c.cam.forma === 'cuadro' ? ' selected' : ''}>Cuadro</option></select></label>
        <div class="gridPop evEsquinas">${[['↖', 0.15, 0.2], ['↗', 0.85, 0.2], ['↙', 0.15, 0.8], ['↘', 0.85, 0.8]].map(([n, x, y]) => `<button class="pb" data-esq="${x},${y}">${n}</button>`).join('')}</div>
        <p class="hint">También puedes arrastrar la burbuja sobre el video.</p>` : ''}
      <div class="filaPop" style="margin-top:12px"><button class="pb" id="evInsDividir">✂ Dividir aquí</button><button class="pb" id="evInsDup">⧉ Duplicar</button><button class="pb" id="evInsIzq">← Mover</button><button class="pb" id="evInsDer">Mover →</button><button class="pb peligro" id="evInsBorrar">🗑 Borrar</button></div>`;
    box.querySelectorAll('[data-c]').forEach(inp => {
      const k = inp.dataset.c;
      const aplicar = () => {
        if (k === 'mute' || k === 'fundido' || k === 'zoomLento') c[k] = inp.checked;
        else if (k === 'nombre') c.nombre = inp.value;
        else if (k === 'ajuste') c.ajuste = inp.value;
        else if (k === 'trans') c.trans = inp.value === 'ninguna' ? null : { tipo:inp.value, dur:(c.trans && c.trans.dur) || 0.6 };
        else if (k === 'vel' || k === 'vol') c[k] = +inp.value;
        else if (k === 'ini') c.ini = Math.max(0, Math.min(c.fin - 0.1, +inp.value || 0));
        else if (k === 'fin') c.fin = Math.max(c.ini + 0.1, Math.min(m.dur || 9999, +inp.value || 0));
        else if (k === 'durImg') c.fin = c.ini + Math.max(0.5, +inp.value || 5);
        pintarLineaEV(); verEnEV(EV.t);
      };
      inp.oninput = aplicar; inp.onchange = () => { aplicar(); guardarProyectoEV(); };
    });
    box.querySelectorAll('[data-cam]').forEach(inp => { const k = inp.dataset.cam;
      const ap = () => { c.cam[k] = k === 'visible' ? inp.checked : k === 'tam' ? +inp.value : inp.value; cuadroEV(); };
      inp.oninput = ap; inp.onchange = () => { ap(); guardarProyectoEV(); }; });
    box.querySelectorAll('[data-esq]').forEach(b => b.onclick = () => { const [x, y] = b.dataset.esq.split(',').map(Number); c.cam.x = x; c.cam.y = y; cuadroEV(); guardarProyectoEV(); });
    $('evInsDividir').onclick = dividirEV; $('evInsBorrar').onclick = borrarSelEV;
    $('evInsReemplazar').onclick = () => abrirReemplazoEV(c);
    $('evInsZoom').onclick = () => {
      const ini0 = Math.max(0, EV.t - inicioClipEV(c.id)), L = largoClip(c), dur = Math.min(3, Math.max(0.8, L - ini0));
      if (L - ini0 < 0.8) return toast('Mueve la línea roja un poco antes del final del clip');
      (c.zooms = c.zooms || []).push({ ini:+ini0.toFixed(2), dur:+dur.toFixed(2), x:0.5, y:0.5, k:2 });
      guardarProyectoEV(); pintarLineaEV(); pintarInspectorEV(); elegirPuntoZoomEV(c, c.zooms.length - 1);
    };
    box.querySelectorAll('.evZoomItem').forEach(div => {
      const j = +div.dataset.z, z = c.zooms[j];
      div.querySelectorAll('[data-zk]').forEach(inp => { const k = inp.dataset.zk;
        const ap = () => { const v = +inp.value; if (k === 'k'){ z.k = v; inp.nextElementSibling.textContent = v + '×'; } else if (k === 'ini') z.ini = Math.max(0, Math.min(largoClip(c) - 0.3, v || 0)); else z.dur = Math.max(0.6, v || 1); pintarLineaEV(); verEnEV(inicioClipEV(c.id) + z.ini + Math.min(z.dur / 2, 0.8)); };
        inp.oninput = ap; inp.onchange = () => { ap(); guardarProyectoEV(); }; });
      div.querySelector('[data-zpunto]').onclick = () => elegirPuntoZoomEV(c, j);
      div.querySelector('[data-zver]').onclick = () => { const b = inicioClipEV(c.id) + z.ini; reproducirEV(false); verEnEV(Math.max(0, b - 0.5)); EV.pararEn = b + z.dur + 0.5; const fin = EV.pararEn; reproducirEV(true); EV.pararEn = fin; };
      div.querySelector('[data-zquitar]').onclick = () => { c.zooms.splice(j, 1); guardarProyectoEV(); pintarLineaEV(); pintarInspectorEV(); verEnEV(EV.t); };
    });
    $('evInsDup').onclick = () => { const i = EV.p.clips.indexOf(c), n = JSON.parse(JSON.stringify(c)); n.id = nid(); EV.p.clips.splice(i + 1, 0, n); EV.sel = { tipo:'clip', id:n.id }; guardarProyectoEV(); pintarTodoEV(); };
    const mover = d => { const i = EV.p.clips.indexOf(c), j = i + d; if (j < 0 || j >= EV.p.clips.length) return; EV.p.clips.splice(i, 1); EV.p.clips.splice(j, 0, c); guardarProyectoEV(); pintarTodoEV(); };
    $('evInsIzq').onclick = () => mover(-1); $('evInsDer').onclick = () => mover(1);
    return;
  }
  if (s && s.tipo === 'texto'){
    const tx = EV.p.textos.find(x => x.id === s.id); if (!tx){ EV.sel = null; return pintarInspectorEV(); }
    box.innerHTML = `<h4>T Texto</h4>
      <textarea data-t="texto" rows="3" style="width:100%;box-sizing:border-box">${esc(tx.texto)}</textarea>
      <label class="fila"><span>Posición</span><select data-t="pos">${tx.y != null ? '<option value="" selected>Donde lo dejé</option>' : ''}<option value="arriba"${tx.y == null && tx.pos === 'arriba' ? ' selected' : ''}>Arriba</option><option value="centro"${tx.y == null && tx.pos === 'centro' ? ' selected' : ''}>Centro</option><option value="abajo"${tx.y == null && tx.pos === 'abajo' ? ' selected' : ''}>Abajo</option></select></label>
      <p class="hint">También puedes arrastrarlo sobre el video.</p>
      <label class="fila"><span>Animación</span><select data-t="anim">${Object.entries(ANIM_TEXTO_EV).map(([k, n]) => `<option value="${k}"${(tx.anim || 'fade') === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="fila"><span>Letra</span><select data-t="fuente">${FUENTES_EV.map(f => `<option style="font-family:'${f}'"${(tx.fuente || 'Poppins') === f ? ' selected' : ''}>${f}</option>`).join('')}</select></label>
      <label class="fila"><span>Tamaño</span><input type="range" min="0.03" max="0.16" step="0.005" data-t="tam" value="${tx.tam}"></label>
      <label class="fila"><span>Color</span><input type="color" data-t="color" value="${tx.color}"></label>
      <label class="filaCheck"><input type="checkbox" data-t="fondo"${tx.fondo ? ' checked' : ''}> Con fondo <input type="color" data-t="fondoColor" value="${/^#[0-9a-f]{6}/i.test(tx.fondo || '') ? tx.fondo.slice(0, 7) : '#000000'}" title="Color del fondo"></label>
      <label class="filaCheck"><input type="checkbox" data-t="borde"${tx.borde ? ' checked' : ''}> Contorno negro (estilo TikTok)</label>
      <label class="filaCheck"><input type="checkbox" data-t="negrita"${tx.negrita !== false ? ' checked' : ''}> Negrita</label>
      <label class="filaCheck"><input type="checkbox" data-t="mayus"${tx.mayus ? ' checked' : ''}> MAYÚSCULAS</label>
      <label class="fila"><span>Aparece en</span><input type="number" step="0.1" min="0" data-t="inicio" value="${tx.inicio.toFixed(1)}"> s</label>
      <label class="fila"><span>Dura</span><input type="number" step="0.1" min="0.3" data-t="dur" value="${tx.dur.toFixed(1)}"> s</label>
      <div class="filaPop"><button class="pb peligro" id="evInsBorrar">🗑 Borrar texto</button></div>`;
    box.querySelectorAll('[data-t]').forEach(inp => { const k = inp.dataset.t;
      const ap = () => { if (k === 'fondo') tx.fondo = inp.checked ? box.querySelector('[data-t="fondoColor"]').value + 'b3' : null;
        else if (k === 'fondoColor'){ tx.fondo = inp.value + 'b3'; box.querySelector('[data-t="fondo"]').checked = true; }
        else if (k === 'borde') tx.borde = inp.checked ? '#000000' : null;
        else if (k === 'mayus') tx.mayus = inp.checked;
        else if (k === 'pos'){ if (!inp.value) return; tx.pos = inp.value; delete tx.y; delete tx.x; }
        else if (k === 'fuente'){ tx.fuente = inp.value; document.fonts.load(`700 40px "${inp.value}"`).then(() => verEnEV(EV.t)).catch(() => {}); }
        else if (k === 'negrita') tx.negrita = inp.checked; else if (k === 'tam' || k === 'inicio' || k === 'dur') tx[k] = Math.max(k === 'dur' ? 0.3 : 0, +inp.value || 0); else tx[k] = inp.value; pintarLineaEV(); verEnEV(EV.t); };
      inp.oninput = ap; inp.onchange = () => { ap(); guardarProyectoEV(); }; inp.addEventListener('keydown', e => e.stopPropagation()); });
    $('evInsBorrar').onclick = borrarSelEV;
    return;
  }
  if (s && s.tipo === 'musica' && EV.p.musica){
    const mu = EV.p.musica;
    box.innerHTML = `<h4>♪ Música de fondo</h4><p><b>${esc(mu.nombre)}</b></p>
      <label class="fila"><span>Volumen</span><input type="range" min="0" max="1" step="0.05" data-mu="vol" value="${mu.vol}"></label>
      <label class="fila"><span>Empezar la canción en</span><input type="number" min="0" step="1" data-mu="desde" value="${mu.desde || 0}"> s</label>
      <div class="filaPop"><button class="pb peligro" id="evQuitarMusica">Quitar la música</button></div>`;
    box.querySelectorAll('[data-mu]').forEach(inp => { inp.oninput = () => { mu[inp.dataset.mu] = +inp.value; sincronizarEV(clipEnEV(EV.t), EV.play); pintarLineaEV(); }; inp.onchange = () => guardarProyectoEV(); });
    $('evQuitarMusica').onclick = () => { EV.p.musica = null; EV.sel = null; pausarTodoEV(); guardarProyectoEV(); pintarTodoEV(); };
    return;
  }
  box.innerHTML = '<p class="hint">Toca un clip, un texto o la música en la línea de tiempo para editarlo.</p>';
}
function pintarMusicaInfoEV(){ const i = $('evMusicaInfo'); if (i) i.innerHTML = EV.p.musica ? `<p class="hint">Ahora suena: <b>${esc(EV.p.musica.nombre)}</b>. Tócala en la línea de tiempo para cambiar el volumen.</p>` : ''; }
async function pintarBibliotecaEV(){
  const b = $('evBiblio'); if (!b) return;
  let ids = []; try { ids = await listarMediosEV(); } catch (e) {}
  const usados = new Set(EV.p.clips.map(c => c.cam && c.cam.blob).filter(Boolean));
  ids = ids.filter(id => !usados.has(id));
  if (!ids.length){ b.innerHTML = '<p class="hint">Aquí aparecen tus grabaciones y archivos.</p>'; return; }
  await Promise.all(ids.map(id => cargarMedioEV(id).catch(() => null)));
  ids = ids.filter(id => !(EV.medios[id] || {}).plantilla);
  if (!ids.length){ b.innerHTML = '<p class="hint">Aquí aparecen tus grabaciones y archivos.</p>'; return; }
  b.innerHTML = ids.map(id => { const m = EV.medios[id] || {}; return `<button class="evMedio" data-id="${id}" title="Agregar al final del video">${m.thumb ? `<img src="${m.thumb}" alt="">` : `<span>${m.tipo === 'audio' ? '♪' : '🎞'}</span>`}<small>${esc(m.nombre || '')}${m.dur && m.tipo !== 'imagen' ? ' · ' + fmtT(m.dur) : ''}</small><i class="evQuitarMedio" data-q="${id}" title="Borrar de mis archivos">✕</i></button>`; }).join('');
  b.querySelectorAll('.evMedio').forEach(x => x.onclick = async e => {
    const q = e.target.closest('[data-q]');
    if (q){ e.stopPropagation(); if (EV.p.clips.some(c => c.blob === q.dataset.q) || (EV.p.musica && EV.p.musica.blob === q.dataset.q)) return toast('Ese archivo se usa en tu video: quítalo primero de la línea de tiempo'); if (!confirm('¿Borrar este archivo?')) return; await borrarMedioEV(q.dataset.q); delete EV.medios[q.dataset.q]; pintarBibliotecaEV(); return; }
    const m = await cargarMedioEV(x.dataset.id);
    const hueco = EV.sel && EV.sel.tipo === 'clip' && EV.p.clips.find(c => c.id === EV.sel.id && c.hueco);
    if (m.tipo === 'audio') ponerMusicaEV(x.dataset.id, m); else if (hueco) reemplazarConMedioEV(hueco, x.dataset.id, m); else agregarClipEV(x.dataset.id, m);
  });
}
// ---------- editar ----------
function dividirEV(){
  const r = clipEnEV(EV.t); if (!r) return toast('Pon la línea roja sobre un clip');
  const c = r.c; if (r.local < 0.1 || largoClip(c) - r.local < 0.1) return toast('Mueve la línea roja un poco más adentro del clip');
  const corte = c.ini + r.local * (c.vel || 1), n = JSON.parse(JSON.stringify(c)); n.id = nid(); n.ini = corte; c.fin = corte;
  if (c.zooms){ n.zooms = c.zooms.map(z => ({ ...z, ini:z.ini - r.local })).filter(z => z.ini + z.dur > 0.2).map(z => z.ini < 0 ? { ...z, dur:z.dur + z.ini, ini:0 } : z); c.zooms = c.zooms.filter(z => z.ini < r.local - 0.2).map(z => ({ ...z, dur:Math.min(z.dur, r.local - z.ini) })); }
  n.trans = null;   // al partir un clip, el corte nuevo no lleva transición
  EV.p.clips.splice(r.i + 1, 0, n); EV.sel = { tipo:'clip', id:n.id };
  guardarProyectoEV(); pintarTodoEV(); toast('✂ Clip dividido');
}
function borrarSelEV(){
  const s = EV.sel; if (!s) return toast('Selecciona algo en la línea de tiempo');
  if (s.tipo === 'clip') EV.p.clips = EV.p.clips.filter(c => c.id !== s.id);
  else if (s.tipo === 'texto') EV.p.textos = EV.p.textos.filter(t => t.id !== s.id);
  else if (s.tipo === 'musica'){ EV.p.musica = null; pausarTodoEV(); }
  EV.sel = null; guardarProyectoEV(); pintarTodoEV();
}
function agregarTextoEV(tipo){
  const base = { id:nid(), texto:'Escribe tu texto', inicio:Math.min(EV.t, Math.max(0, totalEV() - 0.5)), dur:3, color:'#ffffff', fuente:'Poppins', negrita:true };
  const t = tipo === 'titulo' ? { ...base, texto:'Título de mi video', pos:'centro', tam:0.1, fondo:null, anim:'pop' }
    : tipo === 'arriba' ? { ...base, pos:'arriba', tam:0.055, fondo:null }
    : tipo === 'tiktok' ? { ...base, texto:'Escribe aquí', pos:'centro', tam:0.075, fondo:null, fuente:'Anton', mayus:true, borde:'#000000', anim:'pop' }
    : tipo === 'etiqueta' ? { ...base, texto:'Etiqueta', pos:'arriba', tam:0.05, fondo:'#ffd60ae6', color:'#111111', anim:'deslizar' }
    : tipo === 'escribir' ? { ...base, texto:'Esto se escribe solo…', pos:'abajo', tam:0.05, fondo:'#000000b3', anim:'escribir', dur:4 }
    : tipo === 'elegante' ? { ...base, texto:'Una frase bonita', pos:'centro', tam:0.07, fondo:null, fuente:'Playfair Display', cursiva:true, negrita:false, anim:'subir' }
    : tipo === 'divertido' ? { ...base, texto:'¡Hola!', pos:'centro', tam:0.09, fondo:null, fuente:'Pacifico', negrita:false, anim:'pop', color:'#ffd60a', borde:'#000000' }
    : { ...base, texto:'Subtítulo', pos:'abajo', tam:0.05, fondo:'rgba(0,0,0,.6)' };
  if (t.fuente !== 'Poppins') document.fonts.load(`700 40px "${t.fuente}"`).then(() => verEnEV(EV.t)).catch(() => {});
  EV.p.textos.push(t); EV.sel = { tipo:'texto', id:t.id }; guardarProyectoEV(); pintarTodoEV(); tabEV('editar');
  setTimeout(() => { const ta = document.querySelector('#evInspector textarea'); if (ta){ ta.focus(); ta.select(); } }, 50);
}
// páginas del diseño → imágenes del video
async function paginasAClipsEV(todas){
  cargando(true);
  try {
    guardarPaginaActual();
    const lista = todas ? paginas.map((p, i) => i) : [actual], seg = Math.max(1, +$('evSegPag').value || 5), fundido = $('evPagFundido').checked, trTipo = $('evPagTrans').value;
    const k = Math.min(2, 1920 / Math.max(W, H));   // la página a buena resolución (lado largo hasta 1920 px)
    for (const i of lista){
      const el = document.createElement('canvas'), sc = new fabric.StaticCanvas(el, { width:Math.round(W * k), height:Math.round(H * k), enableRetinaScaling:false });
      await new Promise(ok => sc.loadFromJSON(paginas[i] || PAGINA_VACIA(), ok)); sc.setZoom(k); sc.renderAll();
      const blob = await new Promise(ok => el.toBlob(ok, 'image/png'));
      const id = nid(); await guardarMedioEV(id, { blob, nombre:($('nombreDiseno').value || 'Diseño') + ' · página ' + (i + 1), tipo:'imagen' });
      const m = await cargarMedioEV(id);
      agregarClipEV(id, m, { fin:seg, fundido, ajuste:'encajar', trans:trTipo !== 'ninguna' && EV.p.clips.length ? { tipo:trTipo, dur:0.7 } : null });
      sc.dispose();
    }
    toast('🖼 ' + lista.length + ' página' + (lista.length > 1 ? 's agregadas' : ' agregada') + ' al video');
  } catch (e) { toast('No se pudieron agregar las páginas: ' + e.message); } finally { cargando(false); }
}

/* ---------- panel de transiciones ---------- */
EV.trElegida = 'disolver';
function destinoTransEV(){
  const cl = EV.p.clips; if (cl.length < 2) return null;
  const s = EV.sel && EV.sel.tipo === 'clip' && cl.find(c => c.id === EV.sel.id);
  if (s && cl.indexOf(s) > 0) return s;
  const r = clipEnEV(EV.t); if (r && r.i > 0) return r.c;
  return cl[1];
}
function pintarTransEV(){
  const g = $('evTransGrid'); if (!g) return;
  const c = destinoTransEV(), info = $('evTrInfo');
  if (!c){ info.textContent = 'Agrega al menos dos clips para poner transiciones entre ellos.'; g.innerHTML = ''; return; }
  const i = EV.p.clips.indexOf(c), actual = c.trans && c.trans.tipo || 'ninguna';
  info.innerHTML = `Entre <b>${esc(EV.p.clips[i - 1].nombre)}</b> y <b>${esc(c.nombre)}</b>. Toca una para verla.`;
  g.innerHTML = Object.entries(TRANS_EV).map(([k, n]) => `<button class="trTile${k === actual ? ' on' : ''}" data-tr="${k}"><span class="trCaja"><i class="trA">A</i><i class="trB">B</i></span><small>${n}</small></button>`).join('');
  $('evTrDur').value = (c.trans && c.trans.dur) || 0.6; $('evTrDurTxt').textContent = (+$('evTrDur').value).toFixed(1) + ' s';
  g.querySelectorAll('.trTile').forEach(b => b.onclick = () => {
    const k = b.dataset.tr; EV.trElegida = k;
    c.trans = k === 'ninguna' ? null : { tipo:k, dur:+$('evTrDur').value };
    guardarProyectoEV(); pintarLineaEV(); pintarTransEV(); verTransEV(c);
  });
}
function verTransEV(c){
  // muestra la transición: un poco antes del corte hasta un poco después
  const b = inicioClipEV(c.id), d = c.trans ? c.trans.dur : 0.6;
  if (EV.play) reproducirEV(false);
  verEnEV(Math.max(0, b - d / 2 - 0.6)); EV.pararEn = Math.min(totalEV(), b + d / 2 + 0.6);
  prepararSnapsEV().then(() => { const fin = EV.pararEn; reproducirEV(true); EV.pararEn = fin; });
}
(function(){
  $('evTrDur').oninput = e => {
    $('evTrDurTxt').textContent = (+e.target.value).toFixed(1) + ' s';
    const c = destinoTransEV(); if (c && c.trans){ c.trans.dur = +e.target.value; verEnEV(EV.t); }
  };
  $('evTrDur').onchange = () => { const c = destinoTransEV(); if (c && c.trans){ guardarProyectoEV(); verTransEV(c); } };
  $('evTrTodos').onclick = () => {
    if (EV.p.clips.length < 2) return toast('Agrega al menos dos clips');
    const k = EV.trElegida === 'ninguna' ? 'disolver' : EV.trElegida, d = +$('evTrDur').value;
    EV.p.clips.forEach((c, i) => { if (i) c.trans = { tipo:k, dur:d }; });
    guardarProyectoEV(); pintarLineaEV(); pintarTransEV(); toast('🔀 «' + TRANS_EV[k] + '» en todos los cortes');
  };
  $('evTrQuitar').onclick = () => { EV.p.clips.forEach(c => { c.trans = null; }); guardarProyectoEV(); pintarLineaEV(); pintarTransEV(); };
  $('evReemplazo').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; const c = EV.p.clips.find(x => x.id === EV.reemplazar); if (f && c) await reemplazarClipEV(c, f);
  };
})();
/* ---------- cambiar la foto o el video de un clip (espacios de plantilla) ---------- */
function abrirReemplazoEV(c){ EV.reemplazar = c.id; $('evReemplazo').click(); }
async function reemplazarClipEV(c, file){
  const tipo = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'imagen' : null;
  if (!tipo) return toast('Elige un video o una foto');
  cargando(true);
  try {
    const id = nid(); await guardarMedioEV(id, { blob:file, nombre:file.name.replace(/\.[^.]+$/, '').slice(0, 60), tipo });
    reemplazarConMedioEV(c, id, await cargarMedioEV(id));
  } catch (e) { toast('No se pudo usar ese archivo: ' + e.message); } finally { cargando(false); }
}
function reemplazarConMedioEV(c, id, m){
  const largo = largoClip(c);
  Object.assign(c, { blob:id, tipo:m.tipo, nombre:m.nombre || c.nombre, ini:0, vel:1, hueco:false, ajuste:'cubrir' });
  c.fin = m.tipo === 'imagen' ? largo : Math.min(m.dur || largo, largo);
  if (m.tipo === 'video' && m.dur > largo + 0.5) toast('🎞 Se usan los primeros ' + fmtT(largo).replace(/\.0$/, '') + ' s del video. Jala la orilla del clip para usar más.');
  EV.sel = { tipo:'clip', id:c.id }; guardarProyectoEV(); pintarTodoEV(); verEnEV(inicioClipEV(c.id) + 0.05);
}

/* ---------- elegir el punto del acercamiento tocando la vista previa ---------- */
function elegirPuntoZoomEV(c, j){
  EV.eligiendoZoom = { c, j }; $('evLienzo').style.cursor = 'crosshair'; $('evLienzo').classList.add('eligiendo');
  const z = c.zooms[j]; reproducirEV(false); verEnEV(inicioClipEV(c.id) + z.ini + 0.01);
  toast('🎯 Toca en el video el lugar al que quieres acercarte');
}
(function(){
  const cv = $('evLienzo');
  cv.addEventListener('pointerdown', e => {
    const el = EV.eligiendoZoom; if (!el) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const b = cv.getBoundingClientRect(), z = el.c.zooms[el.j];
    if (z){ z.x = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)); z.y = Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)); }
    EV.eligiendoZoom = null; cv.style.cursor = ''; cv.classList.remove('eligiendo');
    guardarProyectoEV(); pintarInspectorEV();
    if (z) verEnEV(inicioClipEV(el.c.id) + z.ini + Math.min(z.dur / 2, 1));
    toast('🔍 Listo. Toca «▶ Ver» para mirarlo en movimiento.');
  }, true);
})();

/* ---------- grabar ---------- */
const tiposGrabacion = ['video/mp4;codecs=avc1.42E01F,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1,opus', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/mp4', 'video/webm'];   // MP4 con H.264 primero (WhatsApp, Windows, celulares)
// ventana de pregunta dentro del estudio; devuelve {v, check}
function preguntaEV(titulo, html, botones, textoCheck){
  return new Promise(ok => {
    const d = $('evPregunta'), lab = d.querySelector('.filaCheck');
    d.querySelector('h3').textContent = titulo; d.querySelector('.evPregCuerpo').innerHTML = html;
    lab.hidden = !textoCheck; lab.querySelector('input').checked = false; lab.querySelector('span').textContent = textoCheck || '';
    const acc = d.querySelector('.acciones'); acc.innerHTML = '';
    botones.forEach(b => { const x = document.createElement('button'); x.className = b.clase || 'btnS'; x.textContent = b.t; x.onclick = () => { d.hidden = true; ok({ v:b.v, check:lab.querySelector('input').checked }); }; acc.appendChild(x); });
    d.hidden = false; acc.lastChild && acc.lastChild.focus();
  });
}
const esMacEV = /Mac/i.test(navigator.platform || navigator.userAgent);
function guiaAudioPcHTML(modo){
  if (modo === 'presentacion') return `<p>En la ventana de Chrome, deja elegida <b>esta pestaña</b> y deja activado <b>«Compartir también el audio de la pestaña»</b>.</p><p class="hint">Así se graban los videos o sonidos de tu presentación.</p>`;
  return `<ol class="evPasos">
    <li>En la ventana que abre Chrome elige <b>«Pantalla completa»</b> (o <b>«Pestaña de Chrome»</b> si lo que suena está en una pestaña).</li>
    <li>Activa el interruptor <b>«Compartir audio del sistema»</b>${esMacEV ? '' : ' (o «Compartir también el audio de la pestaña»)'} abajo a la izquierda.</li>
    <li>Toca <b>Compartir</b>.</li></ol>
    <p class="hint">⚠ Si eliges una <b>ventana</b> suelta, Chrome no comparte su sonido.${esMacEV ? ' En Mac, el audio de pantalla completa necesita Chrome actualizado y macOS 14 o más nuevo; con «Pestaña» siempre funciona.' : ''}</p>`;
}
function sinAudioPcHTML(sup){
  const que = sup === 'window' ? 'Elegiste una <b>ventana</b>: Chrome no comparte el sonido de las ventanas.' : sup === 'monitor' ? 'Elegiste la pantalla completa, pero el interruptor <b>«Compartir audio del sistema»</b> quedó apagado.' : 'El interruptor de audio quedó apagado al compartir.';
  return `<p>${que}</p><p>Vuelve a elegir <b>«Pantalla completa»</b> o una <b>pestaña</b> y activa el audio antes de tocar Compartir.</p><p class="hint">Tu voz con el micrófono sí se graba de todos modos.</p>`;
}
const mimeGrab = () => window.MediaRecorder ? tiposGrabacion.find(x => MediaRecorder.isTypeSupported(x)) || '' : '';
let GR = null;
async function grabarEV(modo, sinGuia){
  if (GR) return toast('Ya estás grabando');
  if (!window.MediaRecorder) return toast('Este navegador no puede grabar. Usa Chrome o Edge en computadora.');
  const quiereMic = $('evMic').checked, quierePc = $('evAudioPc').checked;
  const pistas = [];
  let pantalla = null, cam = null, mic = null;
  const usaPantalla = modo === 'pantalla' || modo === 'ambas' || modo === 'presentacion';
  // cámara del teléfono (si está conectado): graba allá con toda su calidad
  const tel = modo !== 'pantalla' && typeof telefonoListoEV === 'function' && telefonoListoEV();
  const vozTel = tel && (modo === 'camara' || TEL.vozDelTel);
  // guía: dónde activar el audio de la computadora en la ventana de Chrome
  if (usaPantalla && quierePc && !sinGuia && !leerLS('disenador_guiaAudioPc')){
    const r = await preguntaEV('🔊 Para grabar el sonido de tu computadora', guiaAudioPcHTML(modo), [{ t:'Cancelar', v:'no', clase:'btnS' }, { t:'Entendido, elegir pantalla', v:'si', clase:'btnP' }], 'No volver a mostrar');
    if (r.v !== 'si') return;
    if (r.check) guardarLS('disenador_guiaAudioPc', '1');
  }
  try {
    if (usaPantalla){
      pantalla = await navigator.mediaDevices.getDisplayMedia({ video:{ frameRate:30, width:{ ideal:1920 }, height:{ ideal:1080 } },
        audio:quierePc ? { echoCancellation:false, noiseSuppression:false, autoGainControl:false, suppressLocalAudioPlayback:false } : false,
        preferCurrentTab:modo === 'presentacion', selfBrowserSurface:modo === 'presentacion' ? 'include' : 'exclude', surfaceSwitching:'include',
        systemAudio:quierePc ? 'include' : 'exclude', windowAudio:quierePc ? 'system' : 'exclude' });
      pistas.push(pantalla);
      // pidió el audio de la compu pero no se compartió: avisar antes de empezar
      if (quierePc && !pantalla.getAudioTracks().length){
        const sup = (pantalla.getVideoTracks()[0].getSettings() || {}).displaySurface;
        const r = await preguntaEV('🔇 No se compartió el sonido de la computadora', sinAudioPcHTML(sup), [{ t:'Grabar sin ese sonido', v:'sigue', clase:'btnS' }, { t:'↺ Volver a elegir con sonido', v:'otra', clase:'btnP' }]);
        if (r.v === 'otra'){ pistas.forEach(st => st.getTracks().forEach(t => t.stop())); return grabarEV(modo, true); }
      }
    }
    if (!tel && (modo === 'camara' || modo === 'ambas' || modo === 'presentacion')){
      try { cam = await navigator.mediaDevices.getUserMedia({ video:{ width:{ ideal:1280 }, height:{ ideal:720 }, facingMode:'user' }, audio:false }); }
      catch (e) {
        if (!/NotFound|NotReadable|Overconstrained|DevicesNotFound/i.test(e.name)) throw e;
        // la compu no tiene cámara (o está ocupada): ofrecer la del teléfono
        pistas.forEach(st => st.getTracks().forEach(t => t.stop()));
        const r = await preguntaEV('📷 No encontré una cámara en esta compu', '<p>¿Quieres usar la cámara de tu <b>teléfono</b>? Escaneas un código y listo; el teléfono graba con toda su calidad.</p>', [{ t:'Cancelar', v:'no', clase:'btnS' }, { t:'📱 Usar mi teléfono', v:'tel', clase:'btnP' }]);
        if (r.v === 'tel') conectarTelefonoEV();
        return;
      }
      pistas.push(cam);
    }
    if (quiereMic && !vozTel){
      try { mic = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:true, noiseSuppression:true } }); pistas.push(mic); }
      catch (e) { toast('No se pudo usar el micrófono; se grabará sin tu voz.'); }
    }
  } catch (e) {
    pistas.forEach(s => s.getTracks().forEach(t => t.stop()));
    return toast(/NotAllowed|Permission/i.test(e.name + e.message) ? 'Necesitas dar permiso para grabar (pantalla, cámara o micrófono).' : 'No se pudo empezar a grabar: ' + e.message);
  }
  // sonido: computadora + micrófono en una sola pista
  const ctx = audioEV(), mezcla = ctx.createMediaStreamDestination();
  [pantalla, mic].forEach(s => { if (s && s.getAudioTracks().length){ try { ctx.createMediaStreamSource(s).connect(mezcla); } catch (e) {} } });
  const hayAudio = (pantalla && pantalla.getAudioTracks().length) || (mic && mic.getAudioTracks().length);
  const fuenteV = pantalla || cam;
  const principal = fuenteV ? new MediaStream([...fuenteV.getVideoTracks(), ...(hayAudio ? mezcla.stream.getAudioTracks() : [])]) : null;
  const mime = mimeGrab();
  const crearRec = (stream, bps) => new MediaRecorder(stream, mime ? { mimeType:mime, videoBitsPerSecond:bps } : {});
  GR = { modo, pistas, partes:[], partesCam:[], recP:principal ? crearRec(principal, 5e6) : null, recC:(pantalla && cam) ? crearRec(new MediaStream(cam.getVideoTracks()), 1.5e6) : null, segundos:0, pausado:false, tel, vozTel };
  if (GR.recP) GR.recP.ondataavailable = e => e.data.size && GR.partes.push(e.data);
  if (GR.recC) GR.recC.ondataavailable = e => e.data.size && GR.partesCam.push(e.data);
  // vista en vivo de la cámara (solo cámara)
  if (!pantalla && (cam || (tel && TEL.stream))){ const v = $('evCamVivo').querySelector('video'); v.srcObject = cam || TEL.stream; v.classList.toggle('sinEspejo', !cam && TEL.info.camara === 'trasera'); $('evCamVivo').hidden = false; }
  // si deja de compartir la pantalla desde el aviso del navegador, se detiene
  if (pantalla) pantalla.getVideoTracks()[0].addEventListener('ended', () => detenerGrabacionEV());
  if ($('evCuenta').checked) await cuentaRegresivaEV();
  if (!GR) return;
  if (GR.recP) GR.recP.start(1000); if (GR.recC) GR.recC.start(1000);
  if (tel){ GR.desfaseTel = 0; empezarTelEV().then(d => { if (GR) GR.desfaseTel = GR.recP ? d : 0; }); }
  GR.medidores = [];
  [['evNivelMic', mic], ['evNivelPc', pantalla]].forEach(([id, st]) => {
    const el = $(id); el.hidden = !(st && st.getAudioTracks().length); if (el.hidden) return;
    try { const an = ctx.createAnalyser(); an.fftSize = 512; ctx.createMediaStreamSource(st).connect(an); GR.medidores.push([el.querySelector('i'), an, new Uint8Array(an.fftSize)]); } catch (e) {}
  });
  const medir = () => { if (!GR) return; GR.medidores.forEach(([i, an, buf]) => { an.getByteTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v - 128)); i.style.width = Math.min(100, m / 128 * 160) + '%'; }); GR.rafNivel = requestAnimationFrame(medir); };
  medir();
  GR.inicio = Date.now();
  $('evGrabando').hidden = false;
  GR.reloj = setInterval(() => { if (!GR || GR.pausado) return; GR.segundos += 0.5; $('evGrabTiempo').textContent = fmtT(GR.segundos).replace(/\.\d$/, ''); }, 500);
  if (modo === 'presentacion'){
    // se cierra el estudio y empieza la presentación del diseño
    $('estudioVideo').classList.remove('abierto');
    $('evGrabando').classList.add('flotante'); document.body.appendChild($('evGrabando'));
    setTimeout(() => { try { presentar(0); } catch (e) {} }, 300);
    toast('● Grabando tu presentación. Al terminar, sal con Esc y toca «Detener».');
  }
}
function cuentaRegresivaEV(){
  return new Promise(ok => {
    const c = $('evCuentaAtras'); c.hidden = false; let n = 3; c.textContent = n;
    const iv = setInterval(() => { n--; if (n <= 0){ clearInterval(iv); c.hidden = true; ok(); } else c.textContent = n; }, 1000);
  });
}
function pausarGrabacionEV(){
  if (!GR) return;
  GR.pausado = !GR.pausado;
  [GR.recP, GR.recC].forEach(r => { if (!r) return; try { GR.pausado ? r.pause() : r.resume(); } catch (e) {} });
  if (GR.tel) enviarTel({ t:GR.pausado ? 'pausa' : 'seguir' });
  $('evGrabPausa').textContent = GR.pausado ? '● Seguir' : '❚❚ Pausa';
}
async function detenerGrabacionEV(){
  const g = GR; if (!g || g.parando) return; g.parando = true;
  clearInterval(g.reloj); cancelAnimationFrame(g.rafNivel);
  const parar = r => new Promise(ok => { if (!r || r.state === 'inactive') return ok(); r.onstop = ok; try { r.stop(); } catch (e) { ok(); } });
  await Promise.all([parar(g.recP), parar(g.recC)]);
  g.pistas.forEach(s => s.getTracks().forEach(t => t.stop()));
  $('evGrabando').hidden = true; $('evCamVivo').hidden = true;
  const deTel = g.tel ? await terminarTelEV() : null;
  $('evGrabando').hidden = true; $('evCamVivo').hidden = true; $('evCamVivo').querySelector('video').srcObject = null;
  const barra = $('evGrabando'); barra.classList.remove('flotante'); $('estudioVideo').appendChild(barra);
  GR = null;
  if (!$('estudioVideo').classList.contains('abierto')) await abrirEstudioVideo();
  if (!g.partes.length && !deTel) return toast(g.tel ? 'No llegó el video del teléfono. Guárdalo desde el teléfono con «Guardar en este teléfono» y súbelo en ⬆ Subir.' : 'La grabación quedó vacía');
  cargando(true);
  try {
    const nombreT = { pantalla:'Grabación de pantalla', camara:'Video de cámara', ambas:'Pantalla con cámara', presentacion:'Mi presentación' }[g.modo] + ' ' + new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
    // solo cámara del teléfono: el video del teléfono es el clip
    if (deTel && !g.partes.length){
      const id = nid(); await guardarMedioEV(id, { blob:deTel.blob, nombre:nombreT + ' (teléfono)', tipo:'video', dur:deTel.dur });
      const m = await cargarMedioEV(id), vertical = m.h > m.w, fmtVertical = (FORMATOS_EV[EV.p.formato] || [16, 9])[1] > (FORMATOS_EV[EV.p.formato] || [16, 9])[0];
      agregarClipEV(id, m, { ajuste:vertical === fmtVertical ? 'cubrir' : 'encajar' });
      return toast('✓ Video del teléfono listo (' + (m.w || '?') + '×' + (m.h || '?') + ', ' + fmtT(m.dur).replace(/\.\d$/, '') + ')');
    }
    if (g.tel && !deTel) toast('⚠ No llegó el video del teléfono: se guardó solo la pantalla. En el teléfono puedes usar «Guardar en este teléfono».');
    const tipo = (g.recP.mimeType || 'video/webm').split(';')[0];
    const nombre = { pantalla:'Grabación de pantalla', camara:'Video de cámara', ambas:'Pantalla con cámara', presentacion:'Mi presentación' }[g.modo] + ' ' + new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
    const id = nid(), dur = Math.max(0.5, g.segundos);
    await guardarMedioEV(id, { blob:new Blob(g.partes, { type:tipo }), nombre, tipo:'video', dur });
    const m = await cargarMedioEV(id);
    let camExtra = null;
    if (g.partesCam.length){
      const idc = nid(); await guardarMedioEV(idc, { blob:new Blob(g.partesCam, { type:tipo }), nombre:nombre + ' (cámara)', tipo:'video', dur });
      await cargarMedioEV(idc); camExtra = { blob:idc, x:0.86, y:0.8, tam:0.28, forma:'circulo', visible:true };
    }
    if (deTel){
      const idc = nid(); await guardarMedioEV(idc, { blob:deTel.blob, nombre:nombre + ' (teléfono)', tipo:'video', dur:deTel.dur });
      await cargarMedioEV(idc); camExtra = { blob:idc, x:0.86, y:0.8, tam:0.28, forma:'circulo', visible:true, desfase:g.desfaseTel || 0, conAudio:!!g.vozTel };
    }
    agregarClipEV(id, m, { fin:Math.min(m.dur || dur, dur + 0.5) || m.dur, cam:camExtra });
    toast('✓ Grabación lista en tu línea de tiempo (' + fmtT(dur).replace(/\.\d$/, '') + ').' + (camExtra ? ' Arrastra la burbuja para moverla.' : ''));
  } catch (e) { toast('No se pudo guardar la grabación: ' + e.message); } finally { cargando(false); }
}

/* ---------- exportar ---------- */
async function exportarEV(){
  if (!EV.p.clips.length) return toast('Tu video está vacío: graba o agrega algo primero');
  if (!window.MediaRecorder) return toast('Este navegador no puede crear videos. Usa Chrome o Edge.');
  const cv = $('evLienzo'), total = totalEV();
  reproducirEV(false); audioEV();
  await prepararSnapsEV();
  const stream = cv.captureStream(30);
  EV.recDest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
  const mime = mimeGrab(), rec = new MediaRecorder(stream, mime ? { mimeType:mime, videoBitsPerSecond:6e6, audioBitsPerSecond:160000 } : {});
  const partes = []; rec.ondataavailable = e => e.data.size && partes.push(e.data);
  EV.cancelado = false; EV.exportando = true; $('evExportando').hidden = false;
  const prog = setInterval(() => { $('evProg').style.width = Math.min(100, EV.t / total * 100) + '%'; $('evProgTxt').textContent = fmtT(EV.t) + ' de ' + fmtT(total); if (EV.cancelado && EV.play) reproducirEV(false); }, 200);
  // se cargan los primeros cuadros antes de empezar
  verEnEV(0); await new Promise(r => setTimeout(r, 400));
  rec.start(500);
  await new Promise(ok => { EV.alTerminar = ok; reproducirEV(true); const vigila = setInterval(() => { if (EV.cancelado || !EV.play){ clearInterval(vigila); setTimeout(ok, 300); } }, 200); });
  await new Promise(ok => { rec.onstop = ok; try { rec.stop(); } catch (e) { ok(); } });
  stream.getVideoTracks().forEach(t => t.stop());
  clearInterval(prog); EV.exportando = false; $('evExportando').hidden = true;
  if (EV.cancelado) return toast('Exportación cancelada');
  const tipo = (rec.mimeType || 'video/webm').split(';')[0], ext = tipo.includes('mp4') ? 'mp4' : 'webm';
  const blob = new Blob(partes, { type:tipo });
  bajarBlob(blob, (EV.p.nombre || 'Mi video').replace(/[\\/:*?"<>|]/g, '') + '.' + ext);
  toast('✓ Video descargado (' + (blob.size / 1048576).toFixed(1) + ' MB, ' + ext.toUpperCase() + ')' + (ext === 'webm' ? '. Si WhatsApp no lo acepta, créalo desde Chrome actualizado (sale en MP4).' : ''));
}
/* =========================================================
   PLANTILLAS DE VIDEO (Reels, TikTok, Instagram, YouTube y escuela)
   Cada plantilla arma escenas con fondo de color, textos animados y transiciones.
   Cada escena es un «espacio»: toca la vista previa (o «Poner mi foto o video») para cambiarla por tu foto o video.
   También: arrastrar los textos sobre el video y soltar un archivo sobre la vista previa para reemplazar la escena.
   ========================================================= */
const CATS_PLANTILLA_EV = { todas:'Todas', reels:'Reels y TikTok', insta:'Instagram', youtube:'YouTube', escuela:'Escuela' };
// atajos para escribir las plantillas
const TT = (texto, y, tam, extra = {}) => ({ texto, y, tam, ...extra });
const PLANTILLAS_EV = [
  { id:'tips', nombre:'3 tips', cats:['reels'], formato:'9:16', fuente:'Anton', estilo:{ mayus:true, borde:'#000000', anim:'pop' }, trans:'empujarIzq',
    escenas:[
      { dur:2.6, bg:['#ff3d7f', '#7b2ff7'], deco:'circulos', textos:[TT('3 tips para\nestudiar mejor', 0.42, 0.075), TT('(el #3 es el mejor) 👇', 0.6, 0.032, { fuente:'Poppins', mayus:false, borde:null, anim:'subir', desde:0.6 })] },
      { dur:3.2, bg:['#0f172a', '#1e293b'], deco:'puntos', textos:[TT('1', 0.2, 0.14, { color:'#ffd60a' }), TT('Haz resúmenes con tus propias palabras', 0.8, 0.042, { fuente:'Poppins', mayus:false, borde:null, fondo:'#000000b3', anim:'escribir', desde:0.3 })] },
      { dur:3.2, bg:['#052e2b', '#0f766e'], deco:'puntos', textos:[TT('2', 0.2, 0.14, { color:'#5eead4' }), TT('Estudia 25 minutos y descansa 5', 0.8, 0.042, { fuente:'Poppins', mayus:false, borde:null, fondo:'#000000b3', anim:'escribir', desde:0.3 })] },
      { dur:3.2, bg:['#3b0764', '#7e22ce'], deco:'puntos', textos:[TT('3', 0.2, 0.14, { color:'#f0abfc' }), TT('Explícaselo a alguien más', 0.8, 0.042, { fuente:'Poppins', mayus:false, borde:null, fondo:'#000000b3', anim:'escribir', desde:0.3 })] },
      { dur:2.6, bg:['#7b2ff7', '#ff3d7f'], deco:'circulos', trans:'zoom', textos:[TT('Sígueme\npara más', 0.44, 0.08), TT('❤  💬  ↗', 0.6, 0.05, { borde:null, anim:'subir', desde:0.5 })] }
    ] },
  { id:'antesdespues', nombre:'Antes y después', cats:['reels', 'insta'], formato:'9:16', fuente:'Bebas Neue', estilo:{ anim:'deslizar' }, trans:'barrido',
    escenas:[
      { dur:3, bg:['#374151', '#111827'], deco:'marco', textos:[TT('ANTES', 0.1, 0.06, { fondo:'#ef4444e6' })] },
      { dur:3.5, bg:['#065f46', '#10b981'], deco:'marco', trDur:1, textos:[TT('DESPUÉS', 0.1, 0.06, { fondo:'#22c55ee6' }), TT('✨ ¿Qué te parece? ✨', 0.86, 0.04, { fuente:'Poppins', anim:'subir', desde:0.8 })] }
    ] },
  { id:'vlog', nombre:'Un día en mi vida', cats:['reels'], formato:'9:16', fuente:'Poppins', estilo:{ anim:'deslizar', fondo:'#ffffffe6', color:'#111111' }, trans:'zoom',
    escenas:[
      { dur:2.2, bg:['#f59e0b', '#ef4444'], deco:'ondas', zoom:true, textos:[TT('UN DÍA EN\nMI VIDA', 0.45, 0.085, { fuente:'Bebas Neue', fondo:null, color:'#ffffff', anim:'pop' })] },
      { dur:1.7, bg:['#fde68a', '#f59e0b'], zoom:true, textos:[TT('7:00 am ☀️', 0.1, 0.04)] },
      { dur:1.7, bg:['#bfdbfe', '#3b82f6'], zoom:true, trans:'deslizarArriba', textos:[TT('9:00 am 📚', 0.1, 0.04)] },
      { dur:1.7, bg:['#fecaca', '#ef4444'], zoom:true, textos:[TT('2:00 pm 🍜', 0.1, 0.04)] },
      { dur:1.7, bg:['#bbf7d0', '#22c55e'], zoom:true, trans:'deslizarArriba', textos:[TT('6:00 pm 🏃', 0.1, 0.04)] },
      { dur:2.2, bg:['#312e81', '#0f172a'], zoom:true, textos:[TT('10:00 pm 🌙', 0.1, 0.04), TT('¿Cómo es tu día?', 0.82, 0.045, { fondo:null, color:'#ffffff', anim:'subir', desde:0.6 })] }
    ] },
  { id:'tutorial', nombre:'Tutorial paso a paso', cats:['reels', 'escuela'], formato:'9:16', fuente:'Montserrat', estilo:{ anim:'subir' }, trans:'deslizarIzq',
    escenas:[
      { dur:2.8, bg:['#0ea5e9', '#6366f1'], deco:'circulos', textos:[TT('CÓMO HACER\nUN MAPA MENTAL', 0.42, 0.06, { anim:'pop' }), TT('en 3 pasos', 0.57, 0.04, { negrita:false, desde:0.5 })] },
      { dur:3.2, bg:['#e0f2fe', '#bae6fd'], deco:'lineas', textos:[TT('PASO 1', 0.1, 0.045, { fondo:'#0ea5e9e6' }), TT('Escribe el tema al centro', 0.86, 0.04, { fondo:'#000000b3', desde:0.4 })] },
      { dur:3.2, bg:['#ede9fe', '#ddd6fe'], deco:'lineas', textos:[TT('PASO 2', 0.1, 0.045, { fondo:'#6366f1e6' }), TT('Saca ramas con las ideas principales', 0.86, 0.04, { fondo:'#000000b3', desde:0.4 })] },
      { dur:3.2, bg:['#fae8ff', '#f5d0fe'], deco:'lineas', textos:[TT('PASO 3', 0.1, 0.045, { fondo:'#c026d3e6' }), TT('Agrega dibujos y colores', 0.86, 0.04, { fondo:'#000000b3', desde:0.4 })] },
      { dur:2.5, bg:['#22c55e', '#0ea5e9'], deco:'confeti', trans:'circulo', textos:[TT('¡LISTO! ✅', 0.45, 0.08, { anim:'pop' })] }
    ] },
  { id:'evento', nombre:'Anuncio de evento', cats:['reels', 'escuela', 'insta'], formato:'9:16', fuente:'Anton', estilo:{ mayus:true, anim:'pop' }, trans:'blanco',
    escenas:[
      { dur:1.8, bg:['#facc15', '#f97316'], deco:'lineas', textos:[TT('¡ATENCIÓN!', 0.45, 0.1, { color:'#111111' })] },
      { dur:2.6, bg:['#1d4ed8', '#7c3aed'], deco:'circulos', textos:[TT('Feria de\nciencias', 0.45, 0.09)] },
      { dur:2.4, bg:['#0f172a', '#1e3a8a'], deco:'puntos', trans:'deslizarIzq', textos:[TT('📅 15 de noviembre', 0.42, 0.055), TT('📍 Patio principal · 10:00 am', 0.55, 0.035, { fuente:'Poppins', anim:'subir', desde:0.5 })] },
      { dur:2.4, bg:['#f97316', '#ef4444'], deco:'confeti', trans:'zoom', textos:[TT('¡No faltes!', 0.45, 0.1)] }
    ] },
  { id:'frase', nombre:'Frase del día', cats:['reels', 'insta'], formato:'9:16', fuente:'Playfair Display', estilo:{ negrita:false, cursiva:true, anim:'escribir' },
    escenas:[
      { dur:7, bg:['#1f2937', '#4b5563'], deco:'marco', zoom:true, textos:[TT('“El éxito es la suma de pequeños esfuerzos repetidos día tras día.”', 0.45, 0.05, { dura:6.6 }), TT('— Robert Collier', 0.62, 0.032, { fuente:'Poppins', cursiva:false, anim:'subir', desde:3.5 })] }
    ] },
  { id:'carrusel', nombre:'Carrusel de fotos', cats:['insta'], formato:'1:1', fuente:'Pacifico', estilo:{ negrita:false, anim:'subir' }, trans:'disolver',
    escenas:[
      { dur:2.6, bg:['#fb7185', '#f59e0b'], deco:'circulos', zoom:true, textos:[TT('Mis fotos favoritas', 0.5, 0.09, { anim:'pop' })] },
      { dur:2.4, bg:['#a78bfa', '#60a5fa'], zoom:true, textos:[] },
      { dur:2.4, bg:['#34d399', '#22d3ee'], zoom:true, textos:[] },
      { dur:2.4, bg:['#f472b6', '#c084fc'], zoom:true, textos:[] },
      { dur:2.6, bg:['#f59e0b', '#fb7185'], zoom:true, textos:[TT('Gracias por ver ❤', 0.85, 0.06)] }
    ] },
  { id:'promo', nombre:'Promoción / venta', cats:['insta', 'reels'], formato:'4:5', fuente:'Montserrat', estilo:{ mayus:true, anim:'pop' }, trans:'deslizarIzq',
    escenas:[
      { dur:2, bg:['#111827', '#374151'], deco:'lineas', textos:[TT('Nuevo', 0.45, 0.1, { color:'#facc15' })] },
      { dur:2.8, bg:['#fef3c7', '#fde68a'], deco:'marco', textos:[TT('Galletas caseras', 0.12, 0.05, { fondo:'#111827e6' })] },
      { dur:2.4, bg:['#dc2626', '#f97316'], deco:'confeti', trans:'zoom', textos:[TT('-20% hoy', 0.45, 0.12, { borde:'#000000' })] },
      { dur:2.6, bg:['#111827', '#1f2937'], deco:'puntos', textos:[TT('Pide las tuyas 📩', 0.45, 0.06), TT('@tu_usuario', 0.56, 0.035, { mayus:false, negrita:false, anim:'subir', desde:0.5 })] }
    ] },
  { id:'cumple', nombre:'Feliz cumpleaños', cats:['insta'], formato:'1:1', fuente:'Pacifico', estilo:{ negrita:false, anim:'pop', borde:'#000000' }, trans:'circulo',
    escenas:[
      { dur:3, bg:['#f472b6', '#a855f7'], deco:'confeti', textos:[TT('¡Feliz\ncumpleaños!', 0.45, 0.11)] },
      { dur:3, bg:['#fbbf24', '#f472b6'], deco:'confeti', zoom:true, textos:[TT('Nombre', 0.82, 0.08)] },
      { dur:3, bg:['#a855f7', '#6366f1'], deco:'confeti', textos:[TT('🎂 🎉 🎈', 0.45, 0.1, { borde:null }), TT('Que se cumplan tus deseos', 0.6, 0.05, { fuente:'Poppins', borde:null, anim:'subir', desde:0.5 })] }
    ] },
  { id:'intro', nombre:'Intro de YouTube', cats:['youtube'], formato:'16:9', fuente:'Bebas Neue', estilo:{ anim:'pop' }, trans:'circulo',
    escenas:[
      { dur:2.2, bg:['#ef4444', '#7f1d1d'], deco:'circulos', textos:[TT('NOMBRE DEL CANAL', 0.47, 0.14)] },
      { dur:2.6, bg:['#0f172a', '#1e293b'], deco:'lineas', textos:[TT('Video nuevo cada semana', 0.45, 0.08, { fuente:'Poppins', anim:'subir' }), TT('🔔 Suscríbete', 0.62, 0.06, { fuente:'Poppins', fondo:'#ef4444e6', anim:'deslizar', desde:0.6 })] }
    ] },
  { id:'expo', nombre:'Exposición de clase', cats:['escuela', 'youtube'], formato:'16:9', fuente:'Montserrat', estilo:{ anim:'subir' }, trans:'deslizarIzq',
    escenas:[
      { dur:3.5, bg:['#1e3a8a', '#0ea5e9'], deco:'marco', textos:[TT('Tema de la exposición', 0.42, 0.09, { anim:'pop' }), TT('Nombre · Grupo · Fecha', 0.6, 0.045, { negrita:false, desde:0.6 })] },
      { dur:4, bg:['#f8fafc', '#e2e8f0'], deco:'lineas', textos:[TT('Introducción', 0.1, 0.06, { fondo:'#1e3a8ae6' }), TT('¿De qué trata y por qué importa?', 0.86, 0.045, { fondo:'#000000b3', desde:0.5 })] },
      { dur:4, bg:['#f8fafc', '#e2e8f0'], deco:'lineas', textos:[TT('Punto 1', 0.1, 0.06, { fondo:'#0ea5e9e6' }), TT('Explica la primera idea', 0.86, 0.045, { fondo:'#000000b3', desde:0.5 })] },
      { dur:4, bg:['#f8fafc', '#e2e8f0'], deco:'lineas', textos:[TT('Punto 2', 0.1, 0.06, { fondo:'#0ea5e9e6' }), TT('Explica la segunda idea', 0.86, 0.045, { fondo:'#000000b3', desde:0.5 })] },
      { dur:4, bg:['#f8fafc', '#e2e8f0'], deco:'lineas', textos:[TT('Conclusión', 0.1, 0.06, { fondo:'#1e3a8ae6' }), TT('Lo más importante en una frase', 0.86, 0.045, { fondo:'#000000b3', desde:0.5 })] },
      { dur:3, bg:['#0ea5e9', '#1e3a8a'], deco:'confeti', trans:'desenfoque', textos:[TT('¡Gracias!', 0.47, 0.12, { anim:'pop' })] }
    ] },
  { id:'noticiero', nombre:'Noticiero escolar', cats:['escuela', 'youtube'], formato:'16:9', fuente:'Oswald', estilo:{ mayus:true, anim:'deslizar' }, trans:'empujarIzq',
    escenas:[
      { dur:3, bg:['#991b1b', '#111827'], deco:'lineas', textos:[TT('Noticiero escolar', 0.45, 0.13, { anim:'pop' }), TT('Edición de hoy', 0.62, 0.05, { fuente:'Poppins', mayus:false, negrita:false, anim:'subir', desde:0.6 })] },
      { dur:5, bg:['#1f2937', '#374151'], textos:[TT('Última hora', 0.74, 0.04, { fondo:'#dc2626f2', x:0.2 }), TT('Título de la noticia 1', 0.86, 0.05, { fondo:'#111827e6', desde:0.3 })] },
      { dur:5, bg:['#1f2937', '#374151'], textos:[TT('Deportes', 0.74, 0.04, { fondo:'#2563ebf2', x:0.2 }), TT('Título de la noticia 2', 0.86, 0.05, { fondo:'#111827e6', desde:0.3 })] },
      { dur:3, bg:['#111827', '#991b1b'], deco:'lineas', trans:'negro', textos:[TT('Hasta la próxima', 0.47, 0.1, { anim:'pop' })] }
    ] }
];

/* ---------- fondos de las escenas ---------- */
function azarEV(semilla){ let a = semilla >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function dibujarFondoPlantillaEV(x, W, H, es, semilla = 1){
  const [c1, c2] = es.bg || ['#7b2ff7', '#ff3d7f'], g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const rnd = azarEV(semilla * 9973 + 7), m = Math.min(W, H);
  x.save();
  switch (es.deco){
    case 'circulos':
      for (let i = 0; i < 5; i++){ const r = m * (0.18 + rnd() * 0.35); x.globalAlpha = 0.12 + rnd() * 0.1; x.fillStyle = '#ffffff'; x.beginPath(); x.arc(rnd() * W, rnd() * H, r, 0, Math.PI * 2); x.fill(); }
      break;
    case 'puntos':
      x.globalAlpha = 0.14; x.fillStyle = '#ffffff';
      for (let y = m * 0.04; y < H; y += m * 0.07) for (let xx = m * 0.04; xx < W; xx += m * 0.07){ x.beginPath(); x.arc(xx, y, m * 0.006, 0, Math.PI * 2); x.fill(); }
      break;
    case 'lineas':
      x.globalAlpha = 0.09; x.strokeStyle = '#ffffff'; x.lineWidth = m * 0.03;
      for (let i = -H; i < W + H; i += m * 0.12){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i + H, H); x.stroke(); }
      break;
    case 'ondas':
      x.globalAlpha = 0.18; x.fillStyle = '#ffffff';
      for (let k = 0; k < 3; k++){ x.beginPath(); x.moveTo(0, H); const base = H * (0.78 + k * 0.07);
        for (let xx = 0; xx <= W; xx += 8) x.lineTo(xx, base + Math.sin(xx / W * Math.PI * (2 + k) + k) * m * 0.035); x.lineTo(W, H); x.closePath(); x.fill(); }
      break;
    case 'marco':
      x.globalAlpha = 0.5; x.strokeStyle = '#ffffff'; x.lineWidth = m * 0.008; const p = m * 0.05;
      x.beginPath(); x.roundRect ? x.roundRect(p, p, W - 2 * p, H - 2 * p, m * 0.03) : x.rect(p, p, W - 2 * p, H - 2 * p); x.stroke();
      break;
    case 'confeti': {
      const cols = ['#facc15', '#22d3ee', '#f472b6', '#a3e635', '#ffffff', '#fb923c'];
      for (let i = 0; i < 70; i++){ x.save(); x.globalAlpha = 0.85; x.fillStyle = cols[i % cols.length]; x.translate(rnd() * W, rnd() * H); x.rotate(rnd() * Math.PI); x.fillRect(-m * 0.012, -m * 0.005, m * 0.024, m * 0.01); x.restore(); }
      break;
    }
  }
  x.restore();
}
function textosDeEscenaEV(pl, es, t0){
  return (es.textos || []).map(tx => {
    const desde = tx.desde ?? 0.15, o = { id:nid(), color:'#ffffff', fuente:pl.fuente || 'Poppins', negrita:true, pos:'centro', tam:0.07, fondo:null, anim:'subir', ...(pl.estilo || {}), ...tx };
    delete o.desde; delete o.dura; o.texto = tx.texto; o.inicio = t0 + desde; o.dur = tx.dura || Math.max(0.5, es.dur - desde - 0.1);
    Object.keys(o).forEach(k => { if (o[k] === null && k !== 'fondo') delete o[k]; });
    return o;
  });
}
const fuentesPlantillaEV = pl => [...new Set([pl.fuente || 'Poppins', ...pl.escenas.flatMap(e => (e.textos || []).map(t => t.fuente).filter(Boolean))])];
function cargarFuentesEV(lista){ return Promise.all(lista.map(f => Promise.all([document.fonts.load(`700 40px "${f}"`), document.fonts.load(`400 40px "${f}"`), document.fonts.load(`italic 400 40px "${f}"`)]).catch(() => {}))); }

/* ---------- miniaturas y lista ---------- */
const miniPlantillasEV = {};
function miniPlantillaEV(pl){
  if (miniPlantillasEV[pl.id]) return miniPlantillasEV[pl.id];
  const [w, h] = FORMATOS_EV[pl.formato], k = 220 / Math.max(w, h), W = Math.round(w * k), H = Math.round(h * k);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const es = pl.escenas[0]; dibujarFondoPlantillaEV(x, W, H, es, 1);
  textosDeEscenaEV(pl, es, 0).forEach(tx => dibujarTextoEV(x, { ...tx, anim:'ninguna' }, tx.inicio + 0.01, W, H, false));
  return (miniPlantillasEV[pl.id] = c.toDataURL('image/jpeg', 0.85));
}
let catPlantillaEV = 'todas', fuentesListasEV = false;
async function pintarPlantillasEV(){
  const cats = $('evPlCats'), lista = $('evPlLista'); if (!lista) return;
  cats.innerHTML = Object.entries(CATS_PLANTILLA_EV).map(([k, n]) => `<button class="chip${k === catPlantillaEV ? ' on' : ''}" data-cat="${k}">${n}</button>`).join('');
  cats.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { catPlantillaEV = b.dataset.cat; pintarPlantillasEV(); });
  if (!fuentesListasEV){
    lista.innerHTML = '<p class="hint">Cargando plantillas…</p>';
    await cargarFuentesEV([...new Set(PLANTILLAS_EV.flatMap(fuentesPlantillaEV))]); fuentesListasEV = true;
  }
  const vis = PLANTILLAS_EV.filter(p => catPlantillaEV === 'todas' || p.cats.includes(catPlantillaEV));
  lista.innerHTML = vis.map(p => { const dur = p.escenas.reduce((s, e) => s + e.dur, 0);
    return `<button class="evPlantilla f${p.formato.replace(':', 'x')}" data-pl="${p.id}" title="Usar «${esc(p.nombre)}»"><img src="${miniPlantillaEV(p)}" alt=""><b>${esc(p.nombre)}</b><small>${p.formato} · ${p.escenas.length} escena${p.escenas.length > 1 ? 's' : ''} · ${Math.round(dur)} s</small></button>`; }).join('');
  lista.querySelectorAll('[data-pl]').forEach(b => b.onclick = () => usarPlantillaEV(PLANTILLAS_EV.find(p => p.id === b.dataset.pl)));
}
async function usarPlantillaEV(pl){
  if (!pl) return;
  if (EV.p.clips.length && !confirm('¿Empezar con la plantilla «' + pl.nombre + '»?\nLo que tienes ahora en la línea de tiempo se reemplaza (puedes deshacer con Ctrl+Z).')) return;
  reproducirEV(false); cargando(true);
  try {
    await cargarFuentesEV(fuentesPlantillaEV(pl));
    const [W0, H0] = FORMATOS_EV[pl.formato], clips = [], textos = [];
    let t = 0;
    for (const [i, es] of pl.escenas.entries()){
      const c = document.createElement('canvas'); c.width = W0; c.height = H0;
      dibujarFondoPlantillaEV(c.getContext('2d'), W0, H0, es, i + 1);
      const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.9));
      const id = nid(); await guardarMedioEV(id, { blob, nombre:pl.nombre + ' · escena ' + (i + 1), tipo:'imagen', plantilla:true });
      await cargarMedioEV(id);
      const tr = es.trans || pl.trans;
      clips.push({ id:nid(), blob:id, tipo:'imagen', nombre:'Escena ' + (i + 1), ini:0, fin:es.dur, vol:1, mute:false, vel:1, ajuste:'cubrir', fundido:false, zoomLento:!!es.zoom, cam:null, hueco:true,
        trans:i && tr && tr !== 'ninguna' ? { tipo:tr, dur:es.trDur || 0.6 } : null });
      textos.push(...textosDeEscenaEV(pl, es, t));
      t += es.dur;
    }
    EV.p = { ...EV.p, formato:pl.formato, clips, textos, nombre:pl.nombre };
    EV.sel = { tipo:'clip', id:clips[0].id }; EV.t = 0;
    ajustarLienzoEV(); $('evNombre').value = EV.p.nombre;
    guardarProyectoEV(); pintarTodoEV(); verEnEV(0.6);
    toast('✨ Plantilla lista: toca cada texto para cambiarlo y cada escena para poner tu foto o video');
  } catch (e) { toast('No se pudo usar la plantilla: ' + e.message); } finally { cargando(false); }
}

/* ---------- vista previa: arrastrar textos, tocar un espacio para reemplazarlo, soltar archivos ---------- */
(function(){
  const cv = $('evLienzo');
  const punto = e => { const b = cv.getBoundingClientRect(); return { b, fx:(e.clientX - b.left) / b.width, fy:(e.clientY - b.top) / b.height }; };
  const textoEn = (fx, fy) => { const X = fx * cv.width, Y = fy * cv.height; const cajas = (EV.cajasTexto || []).slice().reverse(); return cajas.find(c => X >= c.x0 && X <= c.x1 && Y >= c.y0 && Y <= c.y1); };
  let arrastro = false;
  cv.addEventListener('pointerdown', e => {
    arrastro = false;
    const { b, fx, fy } = punto(e), caja = textoEn(fx, fy); if (!caja) return;
    const tx = EV.p.textos.find(t => t.id === caja.id); if (!tx) return;
    e.preventDefault(); e.stopImmediatePropagation(); if (EV.play) reproducirEV(false);
    EV.sel = { tipo:'texto', id:tx.id }; pintarLineaEV(); tabEV('editar');
    const cx0 = (caja.x0 + caja.x1) / 2 / cv.width, cy0 = (caja.y0 + caja.y1) / 2 / cv.height, x0 = e.clientX, y0 = e.clientY;
    cv.setPointerCapture(e.pointerId);
    const mover = ev => {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 3) arrastro = true; if (!arrastro) return;
      let nx = cx0 + (ev.clientX - x0) / b.width, ny = cy0 + (ev.clientY - y0) / b.height;
      if (Math.abs(nx - 0.5) < 0.02) nx = 0.5;     // se pega al centro
      tx.x = Math.max(0.05, Math.min(0.95, nx)); tx.y = Math.max(0.04, Math.min(0.96, ny)); cuadroEV();
    };
    const fin = () => { cv.removeEventListener('pointermove', mover); cv.removeEventListener('pointerup', fin); if (arrastro){ guardarProyectoEV(); pintarInspectorEV(); } else setTimeout(() => { const ta = document.querySelector('#evInspector textarea'); if (ta) ta.focus(); }, 30); };
    cv.addEventListener('pointermove', mover); cv.addEventListener('pointerup', fin);
  }, true);
  cv.addEventListener('click', e => {
    if (arrastro){ arrastro = false; return; }
    const { fx, fy } = punto(e); if (textoEn(fx, fy)) return;
    const r = clipEnEV(EV.t); if (!r || !r.c.hueco) return;
    if (r.c.cam && Math.hypot((fx - r.c.cam.x) * cv.width, (fy - r.c.cam.y) * cv.height) <= Math.min(cv.width, cv.height) * r.c.cam.tam / 2) return;
    if (EV.play) reproducirEV(false);
    abrirReemplazoEV(r.c);
  });
  cv.addEventListener('pointermove', e => {
    if (e.buttons) return; const { fx, fy } = punto(e);
    if (textoEn(fx, fy)) cv.style.cursor = 'move';
    else { const r = clipEnEV(EV.t); if (r && r.c.hueco && !r.c.cam) cv.style.cursor = 'pointer'; }
  });
  // soltar un video o foto sobre la vista previa = reemplazar la escena que se ve
  const vista = cv.parentElement;
  vista.addEventListener('dragover', e => { if ([...(e.dataTransfer.types || [])].includes('Files') && EV.p.clips.length){ e.preventDefault(); vista.classList.add('soltarAqui'); } });
  vista.addEventListener('dragleave', () => vista.classList.remove('soltarAqui'));
  vista.addEventListener('drop', async e => {
    vista.classList.remove('soltarAqui');
    const f = e.dataTransfer.files[0], r = clipEnEV(EV.t);
    if (!f || !r || !/^(video|image)\//.test(f.type)) return;
    e.preventDefault(); e.stopPropagation(); $('evDrop').classList.remove('sobre');
    await reemplazarClipEV(r.c, f);
  });
})();

/* ---------- acceso directo desde el panel de Plantillas del diseño ---------- */
async function abrirPlantillasDeVideo(){ await abrirEstudioVideo(); tabEV('plantillas'); }
/* =========================================================
   EL TELÉFONO COMO CÁMARA (para compus sin cámara)
   - La compu muestra un QR; el teléfono abre camara.html y se conectan directo (WebRTC).
     La nube (Firebase) solo sirve para que se encuentren: el video NO pasa por ningún servidor.
   - Mientras grabas, la compu ve una vista previa en vivo. El teléfono graba con toda su calidad
     y al terminar manda el archivo completo a la compu (por eso no se pierde calidad aunque el Wi-Fi sea lento).
   ========================================================= */
const TEL = { pc:null, dc:null, stream:null, conectado:false, codigo:null, info:{}, vozDelTel:true, recibiendo:null, unsub:null };
function telefonoListoEV(){ return !!(TEL.conectado && TEL.dc && TEL.dc.readyState === 'open'); }
function urlCamaraEV(c){
  const base = /^https?:$/.test(location.protocol) && !/script\.google|googleusercontent/.test(location.host) ? location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '') : 'https://gamerpc.github.io/disenador/';
  return base + 'camara.html#' + c;
}
const SENAL_TEL = window.__SENAL_PRUEBA || {
  async db(){ if (!window.NUBE_LISTA) throw new Error('La nube no está configurada'); await window.NUBE_LISTA; return firebase.firestore(); },
  async crear(c, offer){ await (await this.db()).collection('camaras').doc(c).set({ offer, creado:Date.now() }); },
  escuchar(c, cb){ let off = () => {}; this.db().then(db => { off = db.collection('camaras').doc(c).onSnapshot(s => cb(s.exists ? s.data() : null), () => {}); }); return () => off(); },
  async borrar(c){ try { await (await this.db()).collection('camaras').doc(c).delete(); } catch (e) {} }
};
const codigoAzarTel = () => { const a = new Uint8Array(18); crypto.getRandomValues(a); return [...a].map(b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''); };
function esperarICETel(p, ms){ return new Promise(ok => { if (p.iceGatheringState === 'complete') return ok(); const t = setTimeout(ok, ms); p.addEventListener('icegatheringstatechange', () => { if (p.iceGatheringState === 'complete'){ clearTimeout(t); ok(); } }); }); }
function qrSVGTel(texto){
  const qr = window.qrcode(0, 'M'); qr.addData(texto); qr.make();
  const n = qr.getModuleCount(); let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + 2} ${r + 2}h1v1h-1z`;
  return `<svg viewBox="0 0 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

/* ---------- conectar ---------- */
async function conectarTelefonoEV(){
  if (GR) return toast('Termina la grabación primero');
  desconectarTelefonoEV(true);
  const panel = $('evTelPanel'); panel.hidden = false;
  $('evTelQR').innerHTML = '<p class="hint">Creando el código…</p>'; $('evTelPaso').textContent = '';
  try {
    if (!window.RTCPeerConnection) throw new Error('Este navegador no puede conectarse con el teléfono');
    const codigo = codigoAzarTel(), pc = new RTCPeerConnection({ iceServers:[{ urls:['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] });
    Object.assign(TEL, { pc, codigo, conectado:false, info:{} });
    const dc = pc.createDataChannel('apik', { ordered:true }); configurarCanalTel(dc); TEL.dc = dc;
    pc.addTransceiver('video', { direction:'recvonly' });
    pc.ontrack = e => { TEL.stream = e.streams[0] || new MediaStream([e.track]); const v = $('evTelVivo'); v.srcObject = TEL.stream; v.play().catch(() => {}); };
    pc.onconnectionstatechange = () => {
      if (pc !== TEL.pc) return;
      if (pc.connectionState === 'failed') $('evTelPaso').innerHTML = '⚠ No se pudo conectar. Pon la compu y el teléfono en <b>la misma red Wi-Fi</b> y vuelve a intentar.';
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed') perdidaTelEV();
    };
    await pc.setLocalDescription(await pc.createOffer());
    await esperarICETel(pc, 2500);
    await SENAL_TEL.crear(codigo, pc.localDescription.sdp);
    const url = urlCamaraEV(codigo);
    await cargarQR();
    $('evTelQR').innerHTML = qrSVGTel(url);
    $('evTelLink').value = url;
    $('evTelPaso').textContent = 'Esperando al teléfono…';
    TEL.unsub = SENAL_TEL.escuchar(codigo, async d => {
      if (!d || !d.answer || pc.currentRemoteDescription || pc !== TEL.pc) return;
      $('evTelPaso').textContent = 'Teléfono encontrado, conectando…';
      try { await pc.setRemoteDescription({ type:'answer', sdp:d.answer }); } catch (e) { $('evTelPaso').textContent = 'No se pudo conectar: ' + e.message; }
    });
  } catch (e) {
    const sinPermiso = /permission|insufficient/i.test(e.message);
    $('evTelQR').innerHTML = `<p class="hint">⚠ ${sinPermiso ? 'La nube no dejó crear el código: hay que publicar las reglas nuevas de <b>firestore.rules</b> en Firebase.' : esc(e.message)}</p>`;
  }
}
function configurarCanalTel(dc){
  dc.binaryType = 'arraybuffer';
  dc.onopen = () => {
    TEL.conectado = true; if (TEL.unsub){ TEL.unsub(); TEL.unsub = null; } SENAL_TEL.borrar(TEL.codigo);
    $('evTelPanel').hidden = true; pintarTelEV(); toast('📱 Teléfono conectado: ya puedes grabar con su cámara');
  };
  dc.onclose = () => perdidaTelEV();
  dc.onmessage = e => {
    if (typeof e.data !== 'string'){ const r = TEL.recibiendo; if (r){ r.partes.push(e.data); r.llevo += e.data.byteLength; progresoTelEV(r.llevo / Math.max(1, r.tam)); } return; }
    let m; try { m = JSON.parse(e.data); } catch (x) { return; }
    if (m.t === 'info'){ TEL.info = m; pintarTelEV(); }
    else if (m.t === 'grabando' && TEL.alGrabar){ const f = TEL.alGrabar; TEL.alGrabar = null; f(); }
    else if (m.t === 'archivo'){ TEL.recibiendo = { ...m, partes:[], llevo:0 }; }
    else if (m.t === 'fin' && TEL.recibiendo){ const r = TEL.recibiendo; TEL.recibiendo = null; if (TEL.alArchivo){ const f = TEL.alArchivo; TEL.alArchivo = null; f({ blob:new Blob(r.partes, { type:r.tipo || 'video/webm' }), dur:r.dur, res:r.res }); } }
  };
}
function perdidaTelEV(){
  if (!TEL.conectado) return;
  TEL.conectado = false; pintarTelEV();
  if (TEL.alArchivo){ const f = TEL.alArchivo; TEL.alArchivo = null; f(null); }
  toast(GR ? '⚠ Se desconectó el teléfono. Su video quedó guardado allá: usa «Guardar en este teléfono».' : '📱 El teléfono se desconectó');
}
function desconectarTelefonoEV(silencio){
  if (TEL.unsub){ TEL.unsub(); TEL.unsub = null; }
  if (TEL.codigo && !TEL.conectado) SENAL_TEL.borrar(TEL.codigo);
  const estaba = TEL.conectado; TEL.conectado = false;
  try { TEL.dc && TEL.dc.close(); } catch (e) {} try { TEL.pc && TEL.pc.close(); } catch (e) {}
  Object.assign(TEL, { pc:null, dc:null, stream:null, codigo:null });
  if ($('evTelVivo')) $('evTelVivo').srcObject = null;
  pintarTelEV(); if (estaba && !silencio) toast('📱 Teléfono desconectado');
}
const enviarTel = m => { if (telefonoListoEV()) TEL.dc.send(JSON.stringify(m)); };
// empieza a grabar en el teléfono; devuelve cuánto tardó en arrancar (para emparejar con la pantalla)
function empezarTelEV(){
  return new Promise(ok => {
    const t0 = performance.now();
    TEL.alGrabar = () => ok(Math.max(0, (performance.now() - t0) / 2000));
    enviarTel({ t:'grabar' }); setTimeout(() => { if (TEL.alGrabar){ TEL.alGrabar = null; ok(0); } }, 5000);
  });
}
// detiene el teléfono y espera su archivo completo
function terminarTelEV(){
  return new Promise(ok => {
    TEL.alArchivo = ok; enviarTel({ t:'detener' });
    const caja = $('evTelRecibe'); caja.hidden = false; progresoTelEV(0);
  }).finally(() => { $('evTelRecibe').hidden = true; });
}
function progresoTelEV(p){ const i = $('evTelProg'); if (i) i.style.width = Math.round(p * 100) + '%'; const t = $('evTelProgTxt'); if (t) t.textContent = p ? Math.round(p * 100) + '% recibido' : 'Esperando al teléfono…'; }

/* ---------- interfaz ---------- */
function pintarTelEV(){
  const ok = telefonoListoEV(), est = $('evTelEstado'), btn = $('evTelConectar'); if (!est) return;
  btn.hidden = ok; est.hidden = !ok;
  if (ok) $('evTelInfo').innerHTML = `<b>📱 Teléfono conectado</b><small>Cámara ${esc(TEL.info.camara || '')} · ${esc(TEL.info.res || '')}</small>`;
  document.querySelectorAll('.evModo[data-m="camara"], .evModo[data-m="ambas"], .evModo[data-m="presentacion"]').forEach(b => b.classList.toggle('conTel', ok));
}
(function(){
  const g = $('etGrabar'); if (!g) return;
  g.querySelector('.evModos').insertAdjacentHTML('beforebegin', `
    <div class="evTel">
      <button class="evTelBtn" id="evTelConectar"><span>📱</span><b>Usar la cámara de mi teléfono</b><small>Si tu compu no tiene cámara, o para verte mejor. El teléfono graba con toda su calidad.</small></button>
      <div id="evTelEstado" class="evTelEstado" hidden>
        <video id="evTelVivo" autoplay muted playsinline></video>
        <div class="evTelTxt"><span id="evTelInfo"></span>
          <label class="filaCheck"><input type="checkbox" id="evTelVoz" checked> Usar también el micrófono del teléfono</label>
          <button class="pb" id="evTelDesc">Desconectar</button></div>
      </div>
    </div>`);
  $('estudioVideo').insertAdjacentHTML('beforeend', `
    <div id="evTelPanel" hidden><div class="caja">
      <h3>📱 Usa tu teléfono como cámara</h3>
      <div class="evTelPasos">
        <div id="evTelQR" class="evTelQR"></div>
        <ol><li>Abre la <b>cámara</b> de tu teléfono y apunta a este código (o abre el enlace).</li>
          <li>Permite usar la cámara y el micrófono.</li>
          <li>Listo: graba desde aquí, con los botones de siempre.</li></ol>
      </div>
      <label class="fila"><span>Enlace</span><input id="evTelLink" class="buscador" readonly onclick="this.select()"></label>
      <p class="hint" id="evTelPaso"></p>
      <p class="hint">💡 Funciona mejor con la compu y el teléfono en la <b>misma red Wi-Fi</b>. El video va directo a tu compu, no se sube a internet.</p>
      <div class="acciones"><button class="btnS" id="evTelCancelar">Cancelar</button></div>
    </div></div>
    <div id="evTelRecibe" hidden><div class="caja"><h3>📱 Recibiendo el video del teléfono…</h3><p class="hint">Llega completo, con toda su calidad. No cierres la página en el teléfono.</p><div class="evBarraProg"><i id="evTelProg"></i></div><p class="hint" id="evTelProgTxt"></p></div></div>`);
  $('evTelConectar').onclick = conectarTelefonoEV;
  $('evTelCancelar').onclick = () => { $('evTelPanel').hidden = true; desconectarTelefonoEV(true); };
  $('evTelDesc').onclick = () => desconectarTelefonoEV();
  $('evTelVoz').onchange = e => { TEL.vozDelTel = e.target.checked; };
})();
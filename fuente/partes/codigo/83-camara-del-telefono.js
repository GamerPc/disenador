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

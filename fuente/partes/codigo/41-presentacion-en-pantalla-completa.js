/* =========================================================
   PRESENTACIÓN EN PANTALLA COMPLETA
   ========================================================= */
let pres = null;
function iniciarPresentacion(conVista){
  const vistaOk = conVista ? abrirVentanaPresentador() : false;   // se abre aquí, justo con el clic, para que el navegador lo permita
  presConfig = { ...presConfig, transicion:$('pTrans').value, avance:$('pAvance').value, segundos:Math.max(1, +$('pSeg').value || 6) };
  guardarEstado();
  cerrarModal('mPresentar');
  presentar($('pDesde').value === 'actual' ? actual : 0, false, conVista && !vistaOk);
}
['pAvance'].forEach(id => $(id).addEventListener('change', () => $('filaSeg').style.display = $('pAvance').value === 'auto' ? 'flex' : 'none'));
document.querySelector('[onclick="abrirModal(\'mPresentar\')"]').addEventListener('click', () => {
  $('pTrans').value = presConfig.transicion; $('pAvance').value = presConfig.avance; $('pSeg').value = presConfig.segundos;
  $('filaSeg').style.display = presConfig.avance === 'auto' ? 'flex' : 'none';
});
async function presentar(desde, soloEsta, verNotas){
  if (activo() && activo().isEditing) activo().exitEditing();
  if (canvas.isDrawingMode) activarDibujo(null);
  canvas.discardActiveObject(); canvas.requestRenderAll();
  paginas[actual] = jsonPagina();
  pres = { i:-1, cur:null, timers:[], fin:false, lista: soloEsta ? [desde] : paginas.map((_, k) => k) };
  reiniciarTiempo(); pres.reloj = setInterval(pintarTiempo, 500); prepararImagenesPres();
  pres.verNotas = !!verNotas; $('presNotas').style.display = pres.verNotas ? 'block' : 'none';
  $('presentacion').style.display = 'block'; $('presFin').style.display = 'none';
  const yo = pres;
  try { if (!document.fullscreenElement){ await $('presentacion').requestFullscreen(); yo.fs = true; } } catch(e){}
  await new Promise(r => setTimeout(r, 120));
  irA(soloEsta ? 0 : desde, false, 1);
  bucleRender();
  mostrarControles();
}
function salirPresentacion(){
  if (!pres) return;
  pres.timers.forEach(clearTimeout); clearTimeout(pres.auto); clearInterval(pres.reloj);
  const v = ventanaAbierta(); if (v) try { v.close(); } catch(e){}
  ventanaPres = null;
  if (pres.cur) pres.cur.sc.dispose();
  $('presEscenario').innerHTML = ''; $('presentacion').style.display = 'none';
  pres = null;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
// si la persona sale de pantalla completa (por ejemplo con Esc del navegador) se cierra la presentación
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && pres && pres.fs) salirPresentacion(); });
function bucleRender(){
  if (!pres) return;
  if (pres.cur && pres.cur.animando > 0) pres.cur.sc.renderAll();
  requestAnimationFrame(bucleRender);
}
// Crea la diapositiva i ajustada a la pantalla
function construirDiapositiva(i, cb){
  const sw = window.innerWidth, sh = window.innerHeight, z = Math.min(sw / W, sh / H);
  const wrap = document.createElement('div'); wrap.className = 'diapo';
  const el = document.createElement('canvas'); wrap.appendChild(el);
  $('presEscenario').appendChild(wrap);
  const sc = new fabric.StaticCanvas(el, { width:Math.round(W * z), height:Math.round(H * z), renderOnAddRemove:false });
  sc.loadFromJSON(paginas[i] || PAGINA_VACIA(), () => {
    sc.setZoom(z);
    const d = { i, wrap, sc, pasos:prepararPasos(sc), paso:0, animando:0 };
    sc.renderAll();
    cb(d);
  });
}
// Arma la secuencia de animaciones de la página: pasos que empiezan con clic y su línea de tiempo
function prepararPasos(sc){
  const objs = sc.getObjects(), porIdP = {};
  objs.forEach(o => { if (o.id) porIdP[o.id] = o; });
  const animados = objs.filter(o => o.anim && o.anim.tipo && o.anim.tipo !== 'ninguna' && !o.esFondo)
    .sort((a, b) => ((a.anim.orden || 0) - (b.anim.orden || 0)) || (objs.indexOf(a) - objs.indexOf(b)));
  const pasos = []; let paso = null, prevIni = 0, prevFin = 0, ordenPrevio = null;
  animados.forEach(o => {
    const a = o.anim, dur = a.duracion || 700, ret = a.retraso || 0;
    let ini;
    const mismoGrupo = ordenPrevio !== null && a.orden === ordenPrevio;   // mismo número de orden = al mismo tiempo
    if (!paso || (a.inicio === 'clic' && !mismoGrupo)){ paso = { items:[], clic: a.inicio === 'clic' }; pasos.push(paso); ini = ret; }
    else if (a.inicio === 'con' || mismoGrupo) ini = prevIni + ret;
    else ini = prevFin + ret;
    paso.items.push({ o, a, ini, dur });
    if (!mismoGrupo) prevIni = ini;
    prevFin = Math.max(mismoGrupo ? prevFin : 0, ini + dur);
    ordenPrevio = a.orden;
  });
  const lider = new Map();
  pasos.forEach(p => p.items.forEach(it => lider.set(it.o, { p, it })));
  objs.forEach(t => {                                    // el texto de una forma aparece con su forma
    const f = t.textoDe && porIdP[t.textoDe];
    if (f && lider.has(f) && !lider.has(t)){ const L = lider.get(f); const it = { o:t, a:L.it.a, ini:L.it.ini, dur:L.it.dur }; L.p.items.push(it); lider.set(t, { p:L.p, it }); }
  });
  objs.forEach(c => {                                    // las líneas aparecen después de las formas que unen
    if (c.type !== 'conector' || lider.has(c)) return;
    const cand = [lider.get(porIdP[c.conA]), lider.get(porIdP[c.conB])].filter(Boolean);
    if (!cand.length) return;
    const ult = cand.reduce((m, x) => {
      const pm = pasos.indexOf(m.p), px = pasos.indexOf(x.p);
      return px > pm || (px === pm && x.it.ini + x.it.dur > m.it.ini + m.it.dur) ? x : m;
    });
    const it = { o:c, a:{ tipo:'aparecer' }, ini:ult.it.ini + ult.it.dur * 0.7, dur:450 };
    ult.p.items.push(it); lider.set(c, { p:ult.p, it });
  });
  pasos.forEach(p => p.items.forEach(it => {
    const o = it.o;
    if (o.originX !== 'center' || o.originY !== 'center'){ const c = o.getCenterPoint(); o.set({ originX:'center', originY:'center' }); o.setPositionByOrigin(c, 'center', 'center'); }
    it.fin = { left:o.left, top:o.top, opacity:o.opacity ?? 1, scaleX:o.scaleX, scaleY:o.scaleY, angle:o.angle || 0, text:o.text };
  }));
  return pasos;
}
// la forma de moverse de cada animación
const easeAnim = tipo => tipo === 'rebote' ? fabric.util.ease.easeOutBack : tipo === 'caer' ? fabric.util.ease.easeOutBounce : fabric.util.ease.easeOutCubic;
function estadoInicial(it){
  const { o, a, fin:f } = it, dx = W * 0.18, dy = H * 0.18;
  const base = { opacity:0 };
  switch (a.tipo){
    case 'arriba':    Object.assign(base, { top:f.top + dy }); break;
    case 'abajo':     Object.assign(base, { top:f.top - dy }); break;
    case 'izquierda': Object.assign(base, { left:f.left - dx }); break;
    case 'derecha':   Object.assign(base, { left:f.left + dx }); break;
    case 'zoom':      Object.assign(base, { scaleX:f.scaleX * 0.3, scaleY:f.scaleY * 0.3 }); break;
    case 'rebote':    Object.assign(base, { scaleX:f.scaleX * 0.05, scaleY:f.scaleY * 0.05 }); break;
    case 'girar':     Object.assign(base, { angle:f.angle - 200, scaleX:f.scaleX * 0.2, scaleY:f.scaleY * 0.2 }); break;
    case 'escribir':  if (typeof f.text === 'string' && f.text.length){ o.set({ text:'', opacity:f.opacity }); return; } break;
    case 'caer':      Object.assign(base, { top:f.top - H * 0.6, opacity:f.opacity }); break;
    case 'voltear':   Object.assign(base, { scaleX:f.scaleX * 0.02 }); break;
    case 'diagonal':  Object.assign(base, { left:f.left - dx, top:f.top + dy }); break;
    case 'encoger':   Object.assign(base, { scaleX:f.scaleX * 1.9, scaleY:f.scaleY * 1.9 }); break;
  }
  o.set(base);
}
function mostrarFinal(it){ const f = it.fin; it.o.set({ left:f.left, top:f.top, opacity:f.opacity, scaleX:f.scaleX, scaleY:f.scaleY, angle:f.angle }); if (typeof f.text === 'string' && it.o.text !== undefined) it.o.set('text', f.text); }
function animarItem(d, it){
  const { o, a, fin:f, dur } = it;
  d.animando++;
  const terminar = () => { mostrarFinal(it); d.animando = Math.max(0, d.animando - 1); if (d.sc.contextContainer) d.sc.renderAll(); };
  if (a.tipo === 'escribir' && typeof f.text === 'string' && f.text.length){
    fabric.util.animate({ startValue:0, endValue:f.text.length, duration:Math.max(dur, f.text.length * 35),
      onChange: v => o.set('text', f.text.slice(0, Math.round(v))), onComplete:terminar });
    return;
  }
  const ini = { left:o.left, top:o.top, opacity:o.opacity, scaleX:o.scaleX, scaleY:o.scaleY, angle:o.angle };
  const ease = easeAnim(a.tipo);
  fabric.util.animate({ startValue:0, endValue:1, duration:dur, easing:ease,
    onChange: t => {
      ['left','top','scaleX','scaleY','angle'].forEach(k => o.set(k, ini[k] + (f[k] - ini[k]) * t));
      o.set('opacity', Math.max(0, Math.min(1, ini.opacity + (f.opacity - ini.opacity) * Math.min(1, t * 1.4))));
    },
    onComplete: terminar });
}
function ejecutarPaso(d, k){
  const p = d.pasos[k]; if (!p) return 0;
  p.items.forEach(it => pres.timers.push(setTimeout(() => { if (pres && pres.cur === d) animarItem(d, it); }, it.ini)));
  d.paso = k + 1;
  return Math.max(0, ...p.items.map(it => it.ini + Math.max(it.dur, it.a.tipo === 'escribir' && typeof it.fin.text === 'string' ? it.fin.text.length * 35 : 0)));
}
function irA(i, final, dir){
  const n = pres.lista.length, idx = i;
  if (idx >= n){ pres.fin = true; $('presFin').style.display = 'flex'; actualizarPresentador(); return; }
  if (idx < 0) return;
  pres.fin = false; $('presFin').style.display = 'none';
  pres.timers.forEach(clearTimeout); pres.timers = []; clearTimeout(pres.auto);
  const pagina = pres.lista[idx];
  construirDiapositiva(pagina, d => {
    if (!pres){ d.sc.dispose(); return; }
    const viejo = pres.cur, tr = presConfig.transicion, w = d.wrap;
    if (final) d.pasos.forEach(p => p.items.forEach(mostrarFinal)), d.paso = d.pasos.length;
    else d.pasos.forEach(p => p.items.forEach(estadoInicial));
    d.sc.renderAll();
    if (viejo && tr !== 'ninguna'){
      w.style.transition = 'none'; w.style.opacity = 0;
      if (tr === 'deslizar') w.style.transform = `translateX(${dir * 100}%)`;
      if (tr === 'zoom') w.style.transform = 'scale(.82)';
      void w.offsetWidth; w.style.transition = '';
      requestAnimationFrame(() => {
        w.style.opacity = 1; w.style.transform = 'none';
        viejo.wrap.style.opacity = 0;
        if (tr === 'deslizar') viejo.wrap.style.transform = `translateX(${-dir * 100}%)`;
        if (tr === 'zoom') viejo.wrap.style.transform = 'scale(1.12)';
      });
      setTimeout(() => { viejo.wrap.remove(); viejo.sc.dispose(); }, 700);
    } else if (viejo){ viejo.wrap.remove(); viejo.sc.dispose(); }
    pres.cur = d; pres.i = idx; pres.pagina = pagina;
    $('presNum').textContent = (idx + 1) + ' / ' + n;
    actualizarPresentador();
    if (final) return;
    const espera = viejo && tr !== 'ninguna' ? 450 : 150;
    pres.timers.push(setTimeout(() => {
      if (!pres || pres.cur !== d) return;
      if (presConfig.avance === 'auto'){
        let t = 0;
        d.pasos.forEach((p, k) => { pres.timers.push(setTimeout(() => { if (pres && pres.cur === d) t = ejecutarPaso(d, k); }, t)); t += Math.max(0, ...p.items.map(it => it.ini + it.dur)) + 350; });
        pres.auto = setTimeout(() => { if (pres && pres.cur === d) irA(pres.i + 1, false, 1); }, t + presConfig.segundos * 1000);
      } else if (d.pasos.length && !d.pasos[0].clic) ejecutarPaso(d, 0);
    }, espera));
  });
}
function presSiguiente(){
  if (!pres) return;
  if (pres.fin){ salirPresentacion(); return; }
  const d = pres.cur; if (!d) return;
  if (d.paso < d.pasos.length){
    if (d.animando > 0) d.pasos.slice(0, d.paso).forEach(p => p.items.forEach(mostrarFinal));   // termina lo anterior al instante
    ejecutarPaso(d, d.paso);
  } else irA(pres.i + 1, false, 1);
}
function presAnterior(){
  if (!pres) return;
  if (pres.fin){ pres.fin = false; $('presFin').style.display = 'none'; actualizarPresentador(); return; }
  if (pres.i > 0) irA(pres.i - 1, true, -1);
}
$('presentacion').addEventListener('click', e => { if (!e.target.closest('#presControles,#presNotas')) presSiguiente(); });
function alternarPantallaCompleta(){
  if (!pres) return;
  if (document.fullscreenElement){ pres.fs = false; document.exitFullscreen().catch(() => {}); }
  else $('presentacion').requestFullscreen().then(() => { if (pres) pres.fs = true; }).catch(() => toast('Este navegador no permite pantalla completa aquí'));
}
window.addEventListener('keydown', e => {
  if (!pres) return;
  const k = e.key;
  if (['ArrowRight','PageDown',' ','Enter','ArrowDown'].includes(k)){ e.preventDefault(); presSiguiente(); }
  else if (['ArrowLeft','PageUp','ArrowUp','Backspace'].includes(k)){ e.preventDefault(); presAnterior(); }
  else if (k === 'Escape'){ e.preventDefault(); salirPresentacion(); }
  else if (k === 'n' || k === 'N'){ e.preventDefault(); alternarNotasPres(); }
  else if (k === 'Home'){ e.preventDefault(); irA(0, false, -1); }
  else if (k === 'End'){ e.preventDefault(); irA(pres.lista.length - 1, true, 1); }
  e.stopPropagation();
}, true);
let ocultarCtl;
function mostrarControles(){
  $('presControles').classList.remove('oculto');
  clearTimeout(ocultarCtl); ocultarCtl = setTimeout(() => $('presControles').classList.add('oculto'), 2500);
}
$('presentacion').addEventListener('mousemove', mostrarControles);
window.addEventListener('resize', () => { if (pres && pres.cur) irA(pres.i, true, 1); });


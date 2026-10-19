/* =========================================================
   TRABAJO EN EQUIPO: varias personas editan el mismo diseño al mismo tiempo, con comentarios
   Cada elemento del diseño se guarda como un documento en la nube; los cambios llegan a los demás en segundos.
   ========================================================= */
(function(){
  if (!window.NUBE) return;
  const N = window.NUBE;
  const esperarUsuario = async () => { for (let i = 0; i < 50 && !N.usuario; i++) await new Promise(r => setTimeout(r, 100)); return N.usuario; };
  const $e = id => document.getElementById(id);
  const COLORES = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
  const colorDe = uid => COLORES[[...String(uid)].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORES.length];
  const MAX_DOC = 950000;
  let S = null;   // sesión activa: { eid, ref, nombre, sync:[Map], fondos:{}, quitar:[], otros:{}, comentarios:[], paginasNube }

  const eqs = () => N.db.collection('equipos');
  const jsonObj = o => JSON.stringify(o.toObject(EXTRA));
  const fondoDe = () => typeof canvas.backgroundColor === 'string' || !canvas.backgroundColor ? (canvas.backgroundColor || '') : JSON.stringify(canvas.backgroundColor.toObject ? canvas.backgroundColor.toObject() : canvas.backgroundColor);
  const asegurarIds = () => canvas.getObjects().forEach(o => { if (!o.id) o.id = nuevoId(); });
  const idDoc = (p, id) => p + '_' + String(id).replace(/[\/.#$\[\]]/g, '_');

  // ---------- empezar o unirse ----------
  async function invitar(){
    if (!N.pedirCuenta()) return;
    if (S) return mostrarInvitacion();
    cargando(true);
    try {
      await N.listo; paginas[actual] = jsonPagina();
      const u = N.usuario, ref = eqs().doc();
      const fondos = {};
      paginas.forEach((pg, i) => { if (pg && pg.background) fondos[i] = typeof pg.background === 'string' ? pg.background : JSON.stringify(pg.background); });
      await ref.set({ nombre:$('nombreDiseno').value || 'Diseño en equipo', dueno:u.uid, duenoNombre:u.displayName || '', abierto:true, creado:N.ahora(), w:W, h:H, paginas:paginas.length, fondos });
      // cada elemento de cada página, como documento
      const tareas = [];
      paginas.forEach((pg, p) => ((pg && pg.objects) || []).forEach((ob, z) => {
        if (!ob.id) ob.id = nuevoId();
        tareas.push([idDoc(p, ob.id), { p, z, id:ob.id, j:JSON.stringify(ob), autor:u.uid, t:Date.now() }]);
      }));
      for (let i = 0; i < tareas.length; i += 20) await Promise.all(tareas.slice(i, i + 20).map(([k, v]) => v.j.length > MAX_DOC ? Promise.resolve() : ref.collection('objetos').doc(k).set(v)));
      cargarJSON(JSON.stringify({ v:2, w:W, h:H, p:paginas, i:actual, pres:presConfig }), true);
      await iniciar(ref.id);
      mostrarInvitacion();
    } catch (e) { console.error(e); toast('No se pudo iniciar el trabajo en equipo: ' + e.message); }
    finally { cargando(false); }
  }
  async function unirse(eid){
    await N.listo;
    if (!N.usuario){ abrirModal('mEquipo'); pintarModal(`<p class="hint" style="padding-top:0">Te invitaron a editar un diseño en equipo. Entra con tu cuenta de Google para entrar.</p><button class="bigbtn" id="eqEntrar" style="text-align:center;font-weight:700">Entrar con Google</button>`);
      $e('eqEntrar').onclick = async () => { await N.entrar(); if (await esperarUsuario()){ cerrarModal('mEquipo'); unirse(eid); } }; return; }
    cargando(true);
    try {
      const ref = eqs().doc(eid), d = await ref.get();
      if (!d.exists) throw new Error('Ese diseño en equipo ya no existe');
      const e = d.data(), objs = (await ref.collection('objetos').get()).docs.map(x => x.data());
      const pags = [];
      for (let p = 0; p < (e.paginas || 1); p++){
        const bg = e.fondos && e.fondos[p];
        pags.push({ version:fabric.version, objects:objs.filter(o => o.p === p).sort((a, b) => a.z - b.z).map(o => JSON.parse(o.j)), background:bg && bg[0] === '{' ? JSON.parse(bg) : (bg || '#ffffff') });
      }
      $('nombreDiseno').value = e.nombre; historial = []; hi = -1; miniaturas = [];
      await new Promise(ok => cargarJSON(JSON.stringify({ v:2, w:e.w, h:e.h, p:pags, i:0 }), true, ok));
      enDrive = false; indicadorGuardado('nuevo');
      await iniciar(eid);
      toast('👥 Estás editando «' + e.nombre + '» en equipo. Los cambios se comparten al momento.');
    } catch (er) { console.error(er); toast('No se pudo abrir el diseño en equipo: ' + er.message); }
    finally { cargando(false); }
  }
  async function iniciar(eid){
    terminar(true);
    const ref = eqs().doc(eid);
    S = { eid, ref, sync:[], fondos:{}, quitar:[], otros:{}, comentarios:[], paginasNube:paginas.length, yo:N.usuario.uid };
    paginas[actual] = jsonPagina();
    paginas.forEach((pg, p) => { S.sync[p] = new Map(((pg && pg.objects) || []).map((o, z) => [String(o.id), { j:JSON.stringify(o), z }])); S.fondos[p] = pg && pg.background ? (typeof pg.background === 'string' ? pg.background : JSON.stringify(pg.background)) : ''; });
    asegurarIds();
    S.quitar.push(ref.onSnapshot(d => alCambiarEquipo(d)));
    S.quitar.push(ref.collection('objetos').onSnapshot(sn => alCambiarObjetos(sn)));
    S.quitar.push(ref.collection('presencia').onSnapshot(sn => { S.otros = {}; sn.docs.forEach(d => { if (d.id !== S.yo) S.otros[d.id] = d.data(); }); pintarDock(); canvas.requestRenderAll(); }));
    S.quitar.push(ref.collection('comentarios').onSnapshot(sn => { S.comentarios = sn.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => a.t - b.t); pintarDock(); pintarComentarios(); canvas.requestRenderAll(); }));
    S.latido = setInterval(() => { if (!document.hidden) presencia(); }, 40000); presencia();
    const u = new URL(location.href); u.searchParams.set('equipo', eid); history.replaceState(null, '', u);
    pintarDock();
  }
  function terminar(silencio){
    if (!S) return;
    S.quitar.forEach(f => { try { f(); } catch (e) {} }); clearInterval(S.latido); clearTimeout(S.tSync);
    S.ref.collection('presencia').doc(S.yo).delete().catch(() => {});
    S = null; modoComentario = false; pintarDock(); canvas.requestRenderAll();
    const u = new URL(location.href); u.searchParams.delete('equipo'); history.replaceState(null, '', u);
    if (!silencio) toast('Saliste del trabajo en equipo. Tu copia sigue abierta aquí.');
  }
  window.trabajarEnEquipo = invitar;

  // ---------- mis cambios → nube ----------
  const guardarEstadoBaseEq = window.guardarEstado;
  window.guardarEstado = function(){ guardarEstadoBaseEq.apply(this, arguments); if (S && !restaurando && !generandoVista) programarSync(); };
  function programarSync(){ clearTimeout(S.tSync); S.tSync = setTimeout(sincronizar, 350); }
  async function sincronizar(){
    if (!S || restaurando) return;
    if (S.ultimaPag !== actual){ S.ultimaPag = actual; presenciaPronto(); pintarComentarios(); pintarDock(); }
    asegurarIds();
    const p = actual, mapa = S.sync[p] || (S.sync[p] = new Map()), vistos = new Set(), escrituras = [];
    canvas.getObjects().forEach((o, z) => {
      if (o.esTemporal || o.name === 'Recorte') return;
      const id = String(o.id); vistos.add(id);
      const j = jsonObj(o), prev = mapa.get(id);
      if (!prev || prev.j !== j || prev.z !== z){ mapa.set(id, { j, z }); escrituras.push([id, { p, z, id, j, autor:S.yo, t:Date.now() }]); }
    });
    const borrar = [...mapa.keys()].filter(id => !vistos.has(id));
    borrar.forEach(id => mapa.delete(id));
    const col = S.ref.collection('objetos');
    for (const [id, v] of escrituras){
      if (v.j.length > MAX_DOC){   // una foto muy pesada: se manda una copia más ligera (se ve igual)
        Promise.resolve(N.aligerarDiseno ? N.aligerarDiseno(v.j) : v.j).then(j2 => {
          if (j2.length > MAX_DOC){ avisoGrande(); return; }
          col.doc(idDoc(p, id)).set({ ...v, j:j2 }).catch(e => toast('No se pudo compartir un cambio: ' + e.message));
        });
        continue;
      }
      col.doc(idDoc(p, id)).set(v).catch(e => toast('No se pudo compartir un cambio: ' + e.message));
    }
    borrar.forEach(id => col.doc(idDoc(p, id)).delete().catch(() => {}));
    // páginas nuevas y fondo
    const cambiosEq = {};
    if (paginas.length > S.paginasNube){ S.paginasNube = paginas.length; cambiosEq.paginas = paginas.length; }
    const f = fondoDe(); if (f !== S.fondos[p]){ S.fondos[p] = f; cambiosEq['fondos.' + p] = f; }
    if (Object.keys(cambiosEq).length) S.ref.update(cambiosEq).catch(() => {});
  }
  let avisado = false;
  function avisoGrande(){ if (avisado) return; avisado = true; toast('Una imagen es demasiado grande para compartirse en equipo (más de 1 MB). Usa una imagen más pequeña.'); }

  // ---------- cambios de los demás → mi diseño ----------
  function alCambiarEquipo(d){
    if (!S || !d.exists) return;
    const e = d.data();
    let cambio = false;
    while (paginas.length < (e.paginas || 1)){ paginas.push(null); cambio = true; }
    S.paginasNube = Math.max(S.paginasNube, e.paginas || 1);
    Object.entries(e.fondos || {}).forEach(([p, f]) => {
      p = +p; if (S.fondos[p] === f) return; S.fondos[p] = f;
      const val = f && f[0] === '{' ? JSON.parse(f) : f;
      if (p === actual){ restaurando = true; if (typeof val === 'string' || !val) canvas.backgroundColor = val || '#ffffff'; else canvas.setBackgroundColor(val, () => canvas.requestRenderAll()); restaurando = false; canvas.requestRenderAll(); }
      else if (paginas[p]) paginas[p].background = val;
    });
    if (cambio){ miniaturas = []; renderPaginas(); }
  }
  function alCambiarObjetos(sn){
    if (!S) return;
    const porPagina = {};
    sn.docChanges().forEach(c => {
      const v = c.doc.data(); if (!v) return;
      const mapa = S.sync[v.p] || (S.sync[v.p] = new Map()), id = String(v.id), prev = mapa.get(id);
      if (c.type === 'removed'){ if (!prev) return; mapa.delete(id); }
      else { if (prev && prev.j === v.j && prev.z === v.z) return; mapa.set(id, { j:v.j, z:v.z }); }
      (porPagina[v.p] = porPagina[v.p] || []).push({ tipo:c.type, v });
    });
    Object.entries(porPagina).forEach(([p, cambios]) => { p = +p; if (p === actual) aplicarEnLienzo(cambios); else aplicarEnPagina(p, cambios); });
  }
  function aplicarEnPagina(p, cambios){
    while (paginas.length <= p) paginas.push(null);
    const pg = paginas[p] || (paginas[p] = { version:fabric.version, objects:[], background:'#ffffff' });
    cambios.forEach(({ tipo, v }) => {
      const i = pg.objects.findIndex(o => String(o.id) === String(v.id));
      if (tipo === 'removed'){ if (i >= 0) pg.objects.splice(i, 1); }
      else { const ob = JSON.parse(v.j); if (i >= 0) pg.objects[i] = ob; else pg.objects.push(ob); }
    });
    const z = S.sync[p]; pg.objects.sort((a, b) => ((z.get(String(a.id)) || {}).z ?? 0) - ((z.get(String(b.id)) || {}).z ?? 0));
    miniaturas[p] = null; renderPaginas();
  }
  function aplicarEnLienzo(cambios){
    const act = canvas.getActiveObject();
    const nuevos = cambios.filter(c => c.tipo !== 'removed').filter(c => !(act && String(act.id) === String(c.v.id) && act.isEditing));
    const quitar = cambios.filter(c => c.tipo === 'removed');
    fabric.util.enlivenObjects(nuevos.map(c => JSON.parse(c.v.j)), objs => {
      if (!S) return;
      restaurando = true;
      const sel = canvas.getActiveObjects().map(o => String(o.id));
      quitar.forEach(({ v }) => { const o = canvas.getObjects().find(x => String(x.id) === String(v.id)); if (o){ if (sel.includes(String(o.id))) canvas.discardActiveObject(); canvas.remove(o); } });
      objs.forEach(nuevo => {
        const viejo = canvas.getObjects().find(x => String(x.id) === String(nuevo.id));
        if (viejo){ const i = canvas.getObjects().indexOf(viejo); if (sel.includes(String(viejo.id))) canvas.discardActiveObject(); canvas.remove(viejo); canvas.insertAt(nuevo, i); }
        else canvas.add(nuevo);
      });
      const z = S.sync[actual];
      canvas._objects.sort((a, b) => ((z.get(String(a.id)) || {}).z ?? 1e9) - ((z.get(String(b.id)) || {}).z ?? 1e9));
      restaurando = false;
      canvas.requestRenderAll(); renderCapas(); miniaturas[actual] = null; renderPaginas();
    }, 'fabric');
  }

  // ---------- presencia: quién está y qué tiene seleccionado ----------
  function presencia(){
    if (!S) return;
    const u = N.usuario; if (!u) return;
    S.ref.collection('presencia').doc(S.yo).set({ nombre:u.displayName || u.email || 'Alguien', color:colorDe(S.yo), pagina:actual, sel:canvas.getActiveObjects().map(o => String(o.id)).slice(0, 30), t:Date.now() }).catch(() => {});
  }
  document.addEventListener('visibilitychange', () => { if (S && !document.hidden) presencia(); });
  let tPres = null; const presenciaPronto = () => { if (!S) return; clearTimeout(tPres); tPres = setTimeout(presencia, 300); };
  canvas.on('selection:created', presenciaPronto); canvas.on('selection:updated', presenciaPronto); canvas.on('selection:cleared', presenciaPronto);
  const activos = () => Object.values(S ? S.otros : {}).filter(o => Date.now() - (o.t || 0) < 95000);
  canvas.on('after:render', () => {
    if (!S || generandoVista) return;
    const ctx = canvas.contextContainer, v = canvas.viewportTransform;
    ctx.save();
    activos().filter(o => o.pagina === actual).forEach(o => (o.sel || []).forEach(id => {
      const ob = canvas.getObjects().find(x => String(x.id) === id); if (!ob) return;
      const r = ob.getBoundingRect();
      ctx.strokeStyle = o.color; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.strokeRect(r.left - 3, r.top - 3, r.width + 6, r.height + 6); ctx.setLineDash([]);
      ctx.font = '600 12px Inter, sans-serif'; const tw = ctx.measureText(o.nombre).width;
      ctx.fillStyle = o.color; ctx.fillRect(r.left - 3, r.top - 22, tw + 12, 18); ctx.fillStyle = '#fff'; ctx.fillText(o.nombre, r.left + 3, r.top - 9);
    }));
    // comentarios: pines numerados
    S.comentarios.filter(c => c.p === actual && !c.resuelto).forEach((c, i) => {
      const x = c.x * v[0] + v[4], y = c.y * v[3] + v[5];
      ctx.beginPath(); ctx.arc(x, y - 14, 13, 0, Math.PI * 2); ctx.fillStyle = '#facc15'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#111827'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 6, y - 4); ctx.lineTo(x, y + 4); ctx.lineTo(x + 6, y - 4); ctx.fillStyle = '#facc15'; ctx.fill();
      ctx.fillStyle = '#111827'; ctx.font = '800 12px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(S.comentarios.filter(k => k.p === actual).indexOf(c) + 1), x, y - 10); ctx.textAlign = 'start';
    });
    ctx.restore();
  });

  // ---------- comentarios ----------
  let modoComentario = false;
  function empezarComentario(){ if (!S) return; modoComentario = true; canvas.defaultCursor = 'crosshair'; canvas.discardActiveObject(); canvas.requestRenderAll(); toast('Toca en el diseño dónde quieres dejar el comentario'); }
  canvas.on('mouse:down', ev => {
    if (!S) return;
    const p = canvas.getPointer(ev.e);
    if (modoComentario){
      modoComentario = false; canvas.defaultCursor = 'default';
      setTimeout(() => { canvas.discardActiveObject(); canvas.requestRenderAll(); }, 0);
      const texto = prompt('Escribe tu comentario:'); if (!texto || !texto.trim()) return;
      const u = N.usuario;
      S.ref.collection('comentarios').doc().set({ texto:texto.trim().slice(0, 1000), autor:S.yo, autorNombre:u.displayName || u.email || 'Alguien', color:colorDe(S.yo), p:actual, x:p.x, y:p.y, t:Date.now(), resuelto:false })
        .then(() => { panelAbierto = true; pintarComentarios(); }).catch(e => toast('No se pudo guardar el comentario: ' + e.message));
      return;
    }
    const v = canvas.viewportTransform, r = 16 / v[0];
    const pin = S.comentarios.find(c => c.p === actual && !c.resuelto && Math.hypot(c.x - p.x, (c.y - 14 / v[0]) - p.y) < r);
    if (pin){ panelAbierto = true; pintarComentarios(pin.id); }
  });
  let panelAbierto = false;
  function pintarComentarios(resaltar){
    let pn = $e('panelComentarios');
    if (!S || !panelAbierto){ if (pn) pn.hidden = true; return; }
    if (!pn){ pn = document.createElement('div'); pn.id = 'panelComentarios'; ($e('area') || document.body).appendChild(pn); }
    pn.hidden = false;
    const lista = S.comentarios.filter(c => c.p === actual);
    pn.innerHTML = `<div class="cab"><b>💬 Comentarios · página ${actual + 1}</b><button class="pb" id="pcCerrar" aria-label="Cerrar comentarios">✕</button></div>
      <button class="bigbtn" id="pcNuevo" style="margin:6px 0">＋ Comentar en el diseño</button>
      ${lista.length ? lista.map((c, i) => `<div class="com${c.resuelto ? ' res' : ''}${c.id === resaltar ? ' sel' : ''}" data-c="${esc(c.id)}"><div><span class="num">${i + 1}</span><b style="color:${esc(c.color || '#19c8ff')}">${esc(c.autorNombre)}</b> <small>${new Date(c.t).toLocaleString('es-MX', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</small></div>
        <p>${esc(c.texto)}</p><div class="acc"><button class="pb" data-res>${c.resuelto ? '↺ Reabrir' : '✓ Resolver'}</button>${c.autor === S.yo ? '<button class="pb" data-del>Borrar</button>' : ''}</div></div>`).join('') : '<p class="hint">No hay comentarios en esta página.</p>'}`;
    $e('pcCerrar').onclick = () => { panelAbierto = false; pintarComentarios(); };
    $e('pcNuevo').onclick = empezarComentario;
    pn.querySelectorAll('.com').forEach(d => {
      const c = S.comentarios.find(x => x.id === d.dataset.c), r = S.ref.collection('comentarios').doc(c.id);
      d.querySelector('[data-res]').onclick = () => r.update({ resuelto:!c.resuelto }).catch(e => toast(e.message));
      const b = d.querySelector('[data-del]'); if (b) b.onclick = () => r.delete().catch(e => toast(e.message));
    });
    if (resaltar){ const s = pn.querySelector('.com.sel'); s && s.scrollIntoView({ block:'nearest' }); }
  }

  // ---------- barra del equipo (abajo a la derecha del lienzo) ----------
  function pintarDock(){
    let d = $e('dockEquipo');
    if (!S){ if (d) d.remove(); const pc = $e('panelComentarios'); if (pc) pc.hidden = true; $e('bEquipo') && $e('bEquipo').classList.remove('on'); return; }
    if (!d){ d = document.createElement('div'); d.id = 'dockEquipo'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Trabajo en equipo'); ($e('area') || document.body).appendChild(d); }
    $e('bEquipo') && $e('bEquipo').classList.add('on');
    const gente = activos(), abiertos = S.comentarios.filter(c => !c.resuelto).length;
    d.innerHTML = `<span class="av" style="background:${colorDe(S.yo)}" title="Tú">${esc((N.usuario.displayName || 'Tú')[0])}</span>` +
      gente.map(o => `<span class="av" style="background:${esc(o.color)}" title="${esc(o.nombre)}${o.pagina !== actual ? ' · página ' + (o.pagina + 1) : ''}">${esc((o.nombre || '?')[0])}</span>`).join('') +
      `<button class="pb" id="dqCom">💬 ${abiertos || ''}</button><button class="pb" id="dqInv">🔗 Invitar</button><button class="pb" id="dqSalir" title="Dejar de trabajar en equipo">Salir</button>`;
    $e('dqCom').title = 'Comentarios'; $e('dqCom').setAttribute('aria-label', 'Comentarios (' + abiertos + ' sin resolver)');
    $e('dqCom').onclick = () => { panelAbierto = !panelAbierto; pintarComentarios(); };
    $e('dqInv').onclick = mostrarInvitacion;
    $e('dqSalir').onclick = () => { if (confirm('¿Dejar de trabajar en equipo? Los demás podrán seguir editando.')) terminar(); };
  }
  const irPaginaBaseEq = window.irPagina;
  window.irPagina = function(){ const r = irPaginaBaseEq.apply(this, arguments); if (S){ presenciaPronto(); setTimeout(() => { pintarDock(); pintarComentarios(); }, 300); } return r; };

  // ---------- ventana ----------
  const modal = document.createElement('div'); modal.className = 'modal'; modal.id = 'mEquipo';
  modal.innerHTML = `<div class="caja"><h3>👥 Trabajar en equipo</h3><div id="eqCuerpo"></div><div class="acciones"><button class="btnS" onclick="cerrarModal('mEquipo')">Cerrar</button></div></div>`;
  document.body.appendChild(modal);
  const pintarModal = html => { $e('eqCuerpo').innerHTML = html; };
  function abrirEquipo(){
    abrirModal('mEquipo');
    if (S) return mostrarInvitacion();
    if (!N.usuario){ pintarModal(`<p class="hint" style="padding-top:0">Invita a tus compañeros a editar este diseño contigo al mismo tiempo, y dejen comentarios sobre el diseño.</p><button class="bigbtn" id="eqEntrar" style="text-align:center;font-weight:700">Entrar con Google</button>`);
      $e('eqEntrar').onclick = async () => { await N.entrar(); if (await esperarUsuario()) abrirEquipo(); }; return; }
    pintarModal(`<p class="hint" style="padding-top:0">Se creará un enlace. Quien lo abra (con su cuenta de Google) podrá <b>editar este diseño contigo al mismo tiempo</b> y dejar comentarios. Verán quién está conectado y qué está editando cada quien.</p>
      <button class="btnP" id="eqEmpezar">👥 Empezar a trabajar en equipo</button>
      <p class="hint" style="font-size:11.5px">Cada imagen debe pesar menos de 1 MB para poder compartirse.</p>`);
    $e('eqEmpezar').onclick = invitar;
  }
  function mostrarInvitacion(){
    if (!S) return;
    abrirModal('mEquipo');
    const enlace = location.origin + location.pathname + '?equipo=' + S.eid;
    pintarModal(`<p class="hint" style="padding-top:0">Comparte este enlace con tu equipo. Cualquiera que lo tenga puede editar.</p>
      <div class="filaBusca"><input class="buscador" id="eqEnlace" readonly value="${esc(enlace)}"><button class="pb" id="eqCopiar">Copiar</button></div>
      <p class="hint">También puedes mandarlo por WhatsApp: <a href="https://wa.me/?text=${encodeURIComponent('Editemos juntos este diseño: ' + enlace)}" target="_blank" rel="noopener">abrir WhatsApp</a></p>`);
    $e('eqCopiar').onclick = () => { const i = $e('eqEnlace'); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).then(() => toast('Enlace copiado'), () => { document.execCommand('copy'); toast('Enlace copiado'); }); };
  }
  const st = document.createElement('style');
  st.textContent = `#dockEquipo{position:absolute;right:12px;bottom:12px;z-index:21;display:flex;align-items:center;gap:6px;background:#0b1220;border:1px solid #2a3140;border-radius:999px;padding:5px 6px 5px 8px;box-shadow:0 8px 24px rgba(0,0,0,.35)}
  #dockEquipo .av{width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font:700 13px Inter,sans-serif;border:2px solid #0b1220;margin-left:-8px}
  #dockEquipo .av:first-child{margin-left:0}#dockEquipo .pb{border-radius:999px}
  #panelComentarios{position:absolute;right:12px;bottom:64px;z-index:21;width:min(320px,calc(100% - 24px));max-height:60%;overflow:auto;background:#10131b;color:var(--texto,#e5e7eb);border:1px solid #2a3140;border-radius:14px;padding:10px 12px;box-shadow:0 14px 40px rgba(0,0,0,.45)}
  #panelComentarios[hidden]{display:none}#panelComentarios .cab{display:flex;justify-content:space-between;align-items:center}
  #panelComentarios .com{border-top:1px solid #2a3140;padding:8px 0;font-size:13.5px}#panelComentarios .com p{margin:4px 0;white-space:pre-wrap}#panelComentarios .com small{color:#9ca3af}
  #panelComentarios .com.res{opacity:.55}#panelComentarios .com.sel{background:rgba(250,204,21,.08);border-radius:8px}
  #panelComentarios .num{display:inline-flex;width:20px;height:20px;border-radius:50%;background:#facc15;color:#111827;font-weight:800;font-size:11px;align-items:center;justify-content:center;margin-right:6px}
  #panelComentarios .acc{display:flex;gap:6px}#bEquipo.on{color:#19c8ff}
  @media (max-width:820px){#dockEquipo{bottom:auto;top:10px;right:10px}#panelComentarios{bottom:auto;top:58px}}`;
  document.head.appendChild(st);
  const b = document.createElement('button'); b.className = 'tb'; b.id = 'bEquipo'; b.title = 'Trabajar en equipo: editar al mismo tiempo y comentar';
  b.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7zM2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.3 3.3 0 0 1 0 6.3M18 14.8c2 .7 3.3 2.5 3.6 5.2"/></svg><span class="txtLargo"> Equipo</span>';
  b.onclick = abrirEquipo;
  const ref = document.querySelector('#barra .tb.donar'); if (ref) ref.before(b); else { const barra = $e('barra'); barra && barra.appendChild(b); }
  const eidURL = new URLSearchParams(location.search).get('equipo');
  if (eidURL) N.listo.then(() => setTimeout(() => unirse(eidURL), 900));
  window.addEventListener('nube-usuario', () => { if (!N.usuario && S) terminar(true); });
  window.addEventListener('beforeunload', () => { if (S) S.ref.collection('presencia').doc(S.yo).delete().catch(() => {}); });
})();

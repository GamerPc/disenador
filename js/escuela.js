/* =========================================================
   MODO ESCUELA: grupos, actividades y entregas (necesita la nube)
   Maestro: crea un grupo, comparte su código, deja actividades con una plantilla y califica.
   Alumno: se une con el código, hace la actividad en el Diseñador y la entrega.
   ========================================================= */
(function(){
  if (!window.NUBE) return;
  const N = window.NUBE;
  const esperarUsuario = async () => { for (let i = 0; i < 50 && !N.usuario; i++) await new Promise(r => setTimeout(r, 100)); return N.usuario; };
  const $e = id => document.getElementById(id);
  const aFecha = s => /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00') : new Date(s);
  const fecha = s => s ? aFecha(s).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' }) : '';
  const fechaHora = s => s ? new Date(s).toLocaleString('es-MX', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '';
  const codigoNuevo = () => { const L = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 6; i++) c += L[Math.floor(Math.random() * L.length)]; return c; };
  const grupos = () => N.db.collection('grupos');
  const misGrupos = () => N.db.collection('usuarios').doc(N.usuario.uid).collection('grupos');
  const miniatura = () => { try { canvas.discardActiveObject(); canvas.renderAll(); return canvas.toDataURL({ format:'jpeg', quality:0.6, multiplier:(360 / Math.max(W, H)) / zoom }); } catch (e) { return ''; } };
  window.ACTIVIDAD_ACTUAL = null;     // { gid, aid, titulo, grupo, limite }

  // ---------- ventana ----------
  const modal = document.createElement('div'); modal.className = 'modal'; modal.id = 'mEscuela';
  modal.innerHTML = `<div class="caja cajaEscuela"><div class="cabEscuela"><button class="pb" id="escAtras" aria-label="Atrás" hidden>‹</button><h3 id="escTitulo">🎓 Mi escuela</h3></div>
    <div id="escCuerpo"></div><div class="acciones"><button class="btnS" onclick="cerrarModal('mEscuela')">Cerrar</button></div></div>`;
  document.body.appendChild(modal);
  const st = document.createElement('style');
  st.textContent = `.cajaEscuela{width:min(760px,96vw);max-height:90vh;overflow:auto}.cabEscuela{display:flex;align-items:center;gap:8px}.cabEscuela h3{margin:0}
  .escLista{display:flex;flex-direction:column;gap:8px;margin:10px 0}.escItem{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--borde,#2a3140);border-radius:12px;background:var(--panel2,#151821);cursor:pointer;text-align:left;color:inherit;width:100%;font:inherit}
  .escItem:hover{border-color:var(--neon,#19c8ff)}.escItem .t{flex:1;min-width:0}.escItem b{display:block}.escItem small{color:var(--suave,#9ca3af)}
  .insig{font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:999px;white-space:nowrap}.i-maestro{background:#ede9fe;color:#5b21b6}.i-alumno{background:#dbeafe;color:#1e40af}
  .i-pend{background:#fef3c7;color:#92400e}.i-ok{background:#dcfce7;color:#166534}.i-cal{background:#dbeafe;color:#1e40af}.i-tarde{background:#fee2e2;color:#991b1b}
  .codigoGrande{font:800 34px/1 'Poppins',monospace;letter-spacing:.18em;color:var(--neon,#19c8ff);margin:6px 0}
  .gridEntregas{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin:10px 0}
  .entrega{border:1px solid var(--borde,#2a3140);border-radius:12px;overflow:hidden;background:var(--panel2,#151821)}.entrega img{width:100%;aspect-ratio:4/3;object-fit:contain;background:#fff;display:block}
  .entrega .pie{padding:8px 10px;font-size:13px}.entrega .pie b{display:block}.entrega .fila{display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap}.entrega .fila .pb{padding:6px 10px}.entrega input{width:64px;min-width:0;background:var(--panel,#10131b);color:inherit;border:1px solid var(--borde,#2a3140);border-radius:8px;padding:6px 8px}
  .entrega textarea,.escForm textarea{background:var(--panel,#10131b);color:inherit;border:1px solid var(--borde,#2a3140);border-radius:8px;padding:8px;font:13px/1.4 Inter,sans-serif;resize:vertical}
  .escForm label{display:block;font-size:13px;margin:10px 0 4px;color:var(--suave,#9ca3af)}.escForm input,.escForm textarea{width:100%;box-sizing:border-box}
  #bandaActividad{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:20;display:flex;align-items:center;gap:10px;background:#0b1220;color:#e8f6ff;border:1px solid #19c8ff;border-radius:999px;padding:6px 8px 6px 16px;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.35);max-width:calc(100% - 20px)}
  #bandaActividad span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#bandaActividad .btnP{padding:7px 14px;white-space:nowrap}#bandaActividad[hidden]{display:none}`;
  document.head.appendChild(st);
  const cuerpo = () => $e('escCuerpo');
  let pila = [];                           // para el botón «atrás»
  function ver(titulo, fn, sinPila){
    if (!sinPila && ver.actual) pila.push(ver.actual);
    ver.actual = [titulo, fn];
    $e('escTitulo').textContent = titulo; $e('escAtras').hidden = !pila.length;
    cuerpo().innerHTML = '<p class="hint">Cargando…</p>';
    Promise.resolve(fn()).catch(e => { console.error(e); cuerpo().innerHTML = `<p class="hint">No se pudo cargar: ${esc(e.message || e)}</p>`; });
  }
  $e('escAtras').onclick = () => { const p = pila.pop(); if (p) ver(p[0], p[1], true); };
  async function abrirEscuela(){
    abrirModal('mEscuela'); pila = []; ver.actual = null;
    if (!N.usuario){ ver('🎓 Mi escuela', () => { cuerpo().innerHTML = `<p class="hint" style="padding-top:0">Con el modo escuela, el maestro deja actividades con una plantilla y los alumnos las hacen y entregan aquí mismo.</p>
      <p class="hint">Para usarlo, entra con tu cuenta de Google.</p><button class="bigbtn" id="escEntrar" style="text-align:center;font-weight:700">Entrar con Google</button>`;
      $e('escEntrar').onclick = async () => { await N.entrar(); if (await esperarUsuario()) abrirEscuela(); }; }); return; }
    ver('🎓 Mi escuela', inicio);
  }
  window.abrirEscuela = abrirEscuela;

  // ---------- inicio: mis grupos ----------
  async function inicio(){
    await N.listo;
    const mios = (await misGrupos().get()).docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.unido || '').localeCompare(a.unido || ''));
    cuerpo().innerHTML = `<div class="grupoBtns"><button class="pb" id="escCrear">＋ Crear un grupo (soy maestro)</button><button class="pb" id="escUnirme">🔑 Unirme con un código</button></div>
      <div class="escLista">${mios.length ? mios.map(g => `<button class="escItem" data-g="${esc(g.id)}"><span class="t"><b>${esc(g.nombre)}</b><small>${g.rol === 'maestro' ? 'Código: ' + esc(g.codigo || '') : 'Maestro(a): ' + esc(g.maestroNombre || '')}</small></span>
        <span class="insig ${g.rol === 'maestro' ? 'i-maestro' : 'i-alumno'}">${g.rol === 'maestro' ? 'Maestro' : 'Alumno'}</span></button>`).join('')
        : '<p class="hint">Todavía no estás en ningún grupo. Si eres maestro, crea uno; si eres alumno, pide el código a tu maestro.</p>'}</div>`;
    $e('escCrear').onclick = () => ver('Crear grupo', formGrupo);
    $e('escUnirme').onclick = () => ver('Unirme a un grupo', () => formUnirme());
    cuerpo().querySelectorAll('[data-g]').forEach(b => b.onclick = () => { const g = mios.find(x => x.id === b.dataset.g); ver(g.nombre, () => g.rol === 'maestro' ? grupoMaestro(g.id) : grupoAlumno(g.id)); });
  }
  function formGrupo(){
    cuerpo().innerHTML = `<div class="escForm"><label for="escNomGrupo">Nombre del grupo</label><input id="escNomGrupo" class="buscador" placeholder="Ej. Derecho Penal · 6A · 2026-2" maxlength="80">
      <p class="hint">Al crearlo te damos un código de 6 letras para que tus alumnos se unan.</p><button class="btnP" id="escCrearOk">Crear grupo</button></div>`;
    $e('escNomGrupo').focus();
    $e('escCrearOk').onclick = async () => {
      const nombre = $e('escNomGrupo').value.trim(); if (!nombre) return toast('Escribe el nombre del grupo');
      cargando(true);
      try {
        let codigo; for (let i = 0; i < 5; i++){ codigo = codigoNuevo(); if (!(await grupos().where('codigo', '==', codigo).get()).docs.length) break; }
        const ref = grupos().doc(), u = N.usuario, ahora = N.ahora();
        await ref.set({ nombre, codigo, maestro:u.uid, maestroNombre:u.displayName || '', creado:ahora });
        await misGrupos().doc(ref.id).set({ nombre, codigo, rol:'maestro', maestroNombre:u.displayName || '', unido:ahora });
        toast('Grupo creado. Comparte el código ' + codigo + ' con tus alumnos.');
        pila = []; ver(nombre, () => grupoMaestro(ref.id), true); $e('escAtras').hidden = false; pila = [['🎓 Mi escuela', inicio]];
      } catch (e) { toast('No se pudo crear: ' + e.message); } finally { cargando(false); }
    };
  }
  function formUnirme(codigoInicial){
    cuerpo().innerHTML = `<div class="escForm"><label for="escCodigo">Código del grupo</label><input id="escCodigo" class="buscador" placeholder="Ej. K7P2QX" maxlength="6" style="text-transform:uppercase;letter-spacing:.2em;font-weight:700" value="${esc(codigoInicial || '')}">
      <button class="btnP" id="escUnirOk" style="margin-top:10px">Unirme</button></div>`;
    $e('escCodigo').focus();
    $e('escUnirOk').onclick = async () => {
      const codigo = $e('escCodigo').value.trim().toUpperCase(); if (codigo.length !== 6) return toast('El código tiene 6 letras o números');
      cargando(true);
      try {
        const d = (await grupos().where('codigo', '==', codigo).get()).docs[0];
        if (!d) throw new Error('No encontré un grupo con ese código. Revísalo con tu maestro.');
        const g = d.data(), u = N.usuario, ahora = N.ahora();
        if (g.maestro === u.uid) throw new Error('Tú eres el maestro de este grupo');
        await grupos().doc(d.id).collection('miembros').doc(u.uid).set({ nombre:u.displayName || u.email || 'Alumno', correo:u.email || '', foto:u.photoURL || '', unido:ahora });
        await misGrupos().doc(d.id).set({ nombre:g.nombre, rol:'alumno', maestroNombre:g.maestroNombre || '', unido:ahora });
        toast('¡Listo! Ya estás en «' + g.nombre + '».');
        pila = [['🎓 Mi escuela', inicio]]; ver(g.nombre, () => grupoAlumno(d.id), true); $e('escAtras').hidden = false;
      } catch (e) { toast(e.message); } finally { cargando(false); }
    };
  }

  // ---------- maestro ----------
  async function grupoMaestro(gid){
    const gref = grupos().doc(gid), g = (await gref.get()).data();
    const [miembros, acts] = await Promise.all([gref.collection('miembros').get(), gref.collection('actividades').get()]);
    const lista = acts.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.creada || '').localeCompare(a.creada || ''));
    await Promise.all(lista.map(async a => { a.entregas = (await gref.collection('actividades').doc(a.id).collection('entregas').get()).docs.length; }));
    const enlace = location.origin + location.pathname + '?grupo=' + g.codigo;
    cuerpo().innerHTML = `<p class="hint" style="padding-top:0">Código para tus alumnos:</p><div class="codigoGrande">${esc(g.codigo)}</div>
      <div class="grupoBtns"><button class="pb" id="escCopiar">🔗 Copiar enlace para unirse</button><button class="pb" id="escNuevaAct">＋ Nueva actividad con el diseño actual</button></div>
      <h4>Actividades</h4><div class="escLista">${lista.length ? lista.map(a => `<button class="escItem" data-a="${esc(a.id)}"><span class="t"><b>${esc(a.titulo)}</b><small>${a.limite ? 'Entrega: ' + fecha(a.limite) : 'Sin fecha límite'}</small></span><span class="insig i-cal">${a.entregas || 0} de ${miembros.size}</span></button>`).join('')
        : '<p class="hint">Aún no hay actividades. Abre o diseña la plantilla que usarán tus alumnos y pulsa «Nueva actividad».</p>'}</div>
      <h4>Alumnos (${miembros.size})</h4><p class="hint" style="padding-top:0">${miembros.docs.map(m => esc(m.data().nombre)).join(' · ') || 'Todavía no se une nadie.'}</p>`;
    $e('escCopiar').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(enlace) : Promise.reject()).then(() => toast('Enlace copiado: ' + enlace), () => prompt('Copia este enlace:', enlace)); };
    $e('escNuevaAct').onclick = () => ver('Nueva actividad', () => formActividad(gid));
    cuerpo().querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const a = lista.find(x => x.id === b.dataset.a); ver(a.titulo, () => actividadMaestro(gid, a.id)); });
  }
  function formActividad(gid){
    cuerpo().innerHTML = `<div class="escForm"><p class="hint" style="padding-top:0">La actividad usará como plantilla <b>el diseño que tienes abierto ahora</b> (${paginas.length} página${paginas.length > 1 ? 's' : ''}).</p>
      <label for="escTit">Título</label><input id="escTit" class="buscador" maxlength="100" placeholder="Ej. Mapa conceptual del proceso penal acusatorio">
      <label for="escInst">Instrucciones</label><textarea id="escInst" rows="4" maxlength="2000" placeholder="Qué deben hacer, cómo se evalúa…"></textarea>
      <label for="escLim">Fecha límite (opcional)</label><input id="escLim" type="date">
      <button class="btnP" id="escActOk" style="margin-top:12px">Publicar actividad</button></div>`;
    $e('escActOk').onclick = async () => {
      const titulo = $e('escTit').value.trim(); if (!titulo) return toast('Escribe el título');
      cargando(true);
      try {
        const ref = grupos().doc(gid).collection('actividades').doc();
        await N.escribirGrande(ref, { titulo, instrucciones:$e('escInst').value.trim(), limite:$e('escLim').value || '', creada:N.ahora(), mini:miniatura(), w:W, h:H }, serializar(), true);
        toast('Actividad publicada. Tus alumnos ya la ven en «Mi escuela».');
        $e('escAtras').click();
      } catch (e) { toast('No se pudo publicar: ' + e.message); } finally { cargando(false); }
    };
  }
  async function actividadMaestro(gid, aid){
    const gref = grupos().doc(gid), aref = gref.collection('actividades').doc(aid);
    const [a, ents, miembros] = await Promise.all([aref.get(), aref.collection('entregas').get(), gref.collection('miembros').get()]);
    const act = a.data(), lista = ents.docs.map(d => ({ id:d.id, ...d.data() })).sort((x, y) => (x.nombre || '').localeCompare(y.nombre || ''));
    const faltan = miembros.docs.filter(m => !lista.some(e => e.id === m.id)).map(m => m.data().nombre);
    cuerpo().innerHTML = `${act.instrucciones ? `<p class="hint" style="padding-top:0;white-space:pre-wrap">${esc(act.instrucciones)}</p>` : ''}
      <p class="hint">${act.limite ? 'Fecha límite: <b>' + fecha(act.limite) + '</b> · ' : ''}${lista.length} entrega${lista.length === 1 ? '' : 's'}</p>
      <div class="grupoBtns"><button class="pb" id="escVerPlantilla">👁 Abrir la plantilla</button><button class="pb peligro" id="escBorrarAct">🗑 Borrar actividad</button></div>
      <div class="gridEntregas">${lista.map(e => `<div class="entrega" data-e="${esc(e.id)}"><img alt="" src="${e.mini || ''}"><div class="pie"><b>${esc(e.nombre)}</b>
        <small class="hint" style="padding:0">${fechaHora(e.fecha)}${act.limite && e.fecha > act.limite + 'T23:59:59' ? ' · <span class="insig i-tarde">Tarde</span>' : ''}</small>
        <div class="fila"><button class="pb" data-abrir>Abrir</button><input type="number" min="0" max="10" step="0.1" placeholder="Cal." value="${e.calificacion ?? ''}" aria-label="Calificación"><button class="pb" data-cal>Guardar</button></div>
        <textarea rows="2" placeholder="Comentario para el alumno" style="width:100%;margin-top:6px;box-sizing:border-box" aria-label="Comentario">${esc(e.comentario || '')}</textarea></div></div>`).join('')}</div>
      ${faltan.length ? `<p class="hint">Sin entregar: ${faltan.map(esc).join(' · ')}</p>` : ''}`;
    $e('escVerPlantilla').onclick = () => abrirDeNube(aref, act.titulo + ' (plantilla)', null);
    $e('escBorrarAct').onclick = async () => {
      if (!confirm('¿Borrar la actividad «' + act.titulo + '» y todas sus entregas?')) return;
      cargando(true);
      try { for (const e of ents.docs) await N.borrarGrande(aref.collection('entregas').doc(e.id)); await N.borrarGrande(aref); toast('Actividad borrada'); $e('escAtras').click(); }
      catch (e) { toast('No se pudo borrar: ' + e.message); } finally { cargando(false); }
    };
    cuerpo().querySelectorAll('.entrega').forEach(div => {
      const id = div.dataset.e, e = lista.find(x => x.id === id), eref = aref.collection('entregas').doc(id);
      div.querySelector('[data-abrir]').onclick = () => abrirDeNube(eref, 'Entrega de ' + e.nombre + ' · ' + act.titulo, null);
      div.querySelector('[data-cal]').onclick = async () => {
        const v = div.querySelector('input').value, cal = v === '' ? null : Math.max(0, Math.min(10, +v));
        try { await eref.update({ calificacion:cal, comentario:div.querySelector('textarea').value.trim(), calificada:N.ahora() }); toast('Calificación guardada para ' + e.nombre); }
        catch (er) { toast('No se pudo guardar: ' + er.message); }
      };
    });
  }

  // ---------- alumno ----------
  async function grupoAlumno(gid){
    const gref = grupos().doc(gid), uid = N.usuario.uid;
    const acts = (await gref.collection('actividades').get()).docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.creada || '').localeCompare(a.creada || ''));
    const mias = {};
    await Promise.all(acts.map(async a => { const s = await gref.collection('actividades').doc(a.id).collection('entregas').doc(uid).get(); if (s.exists) mias[a.id] = s.data(); }));
    const estado = a => { const e = mias[a.id]; if (!e) return `<span class="insig ${a.limite && new Date() > new Date(a.limite + 'T23:59:59') ? 'i-tarde' : 'i-pend'}">${a.limite && new Date() > new Date(a.limite + 'T23:59:59') ? 'Vencida' : 'Pendiente'}</span>`;
      return e.calificacion != null ? `<span class="insig i-cal">Calificación: ${e.calificacion}</span>` : '<span class="insig i-ok">Entregada</span>'; };
    cuerpo().innerHTML = `<div class="escLista">${acts.length ? acts.map(a => `<button class="escItem" data-a="${esc(a.id)}">${a.mini ? `<img src="${a.mini}" alt="" style="width:64px;height:48px;object-fit:contain;background:#fff;border-radius:6px">` : ''}<span class="t"><b>${esc(a.titulo)}</b><small>${a.limite ? 'Entrega: ' + fecha(a.limite) : 'Sin fecha límite'}</small></span>${estado(a)}</button>`).join('')
      : '<p class="hint">Tu maestro todavía no publica actividades.</p>'}</div>`;
    cuerpo().querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const a = acts.find(x => x.id === b.dataset.a); ver(a.titulo, () => actividadAlumno(gid, a.id)); });
  }
  async function actividadAlumno(gid, aid){
    const gref = grupos().doc(gid), aref = gref.collection('actividades').doc(aid), uid = N.usuario.uid;
    const [g, a, e] = await Promise.all([gref.get(), aref.get(), aref.collection('entregas').doc(uid).get()]);
    const act = a.data(), ent = e.exists ? e.data() : null;
    cuerpo().innerHTML = `${act.mini ? `<img src="${act.mini}" alt="" style="max-width:100%;max-height:220px;display:block;margin:0 auto 10px;background:#fff;border-radius:8px">` : ''}
      ${act.instrucciones ? `<p style="white-space:pre-wrap;margin-top:0">${esc(act.instrucciones)}</p>` : ''}
      <p class="hint">${act.limite ? 'Fecha límite: <b>' + fecha(act.limite) + '</b>' : 'Sin fecha límite'}</p>
      ${ent ? `<div class="escItem" style="cursor:default"><span class="t"><b>✓ Entregaste el ${fechaHora(ent.fecha)}</b>${ent.calificacion != null ? `<small>Calificación: <b>${ent.calificacion}</b></small>` : '<small>Tu maestro aún no califica.</small>'}${ent.comentario ? `<small>Comentario: ${esc(ent.comentario)}</small>` : ''}</span></div>` : ''}
      <div class="grupoBtns" style="margin-top:10px"><button class="btnP" id="escEmpezar">${ent ? '✏ Abrir mi entrega para corregirla' : '✏ Empezar la actividad'}</button></div>`;
    const ctx = { gid, aid, titulo:act.titulo, grupo:g.data().nombre, limite:act.limite };
    $e('escEmpezar').onclick = () => ent ? abrirDeNube(aref.collection('entregas').doc(uid), act.titulo, ctx) : abrirDeNube(aref, act.titulo, ctx);
  }
  async function abrirDeNube(ref, nombre, ctxActividad){
    if (canvas.getObjects().length && !confirm('Se abrirá «' + nombre + '» en lugar de lo que tienes ahora. Si no lo has guardado, se perderá. ¿Continuar?')) return;
    cargando(true);
    try {
      const r = await N.leerGrande(ref);
      $('nombreDiseno').value = nombre; historial = []; hi = -1; miniaturas = [];
      await new Promise(ok => cargarJSON(r.texto, true, ok));
      enDrive = false; indicadorGuardado('nuevo');
      window.ACTIVIDAD_ACTUAL = ctxActividad; pintarBanda();
      cerrarModal('mEscuela');
      toast(ctxActividad ? 'Haz la actividad y pulsa «Entregar» (arriba) cuando termines.' : 'Abierto: ' + nombre);
    } catch (e) { toast('No se pudo abrir: ' + e.message); } finally { cargando(false); }
  }
  // ---------- banda de la actividad y entrega ----------
  const banda = document.createElement('div'); banda.id = 'bandaActividad'; banda.hidden = true; banda.setAttribute('role', 'status');
  banda.innerHTML = '<span id="bandaTxt"></span><button class="btnP" id="bEntregar">📤 Entregar</button><button class="pb" id="bSalirAct" title="Dejar de trabajar en la actividad" aria-label="Dejar la actividad">✕</button>';
  (document.getElementById('area') || document.body).appendChild(banda);
  function pintarBanda(){
    const a = window.ACTIVIDAD_ACTUAL; banda.hidden = !a;
    if (a) $e('bandaTxt').textContent = '🎓 ' + a.titulo + (a.limite ? ' · entrega: ' + fecha(a.limite) : '');
  }
  $e('bSalirAct').onclick = () => { window.ACTIVIDAD_ACTUAL = null; pintarBanda(); };
  $e('bEntregar').onclick = async () => {
    const a = window.ACTIVIDAD_ACTUAL; if (!a || !N.pedirCuenta()) return;
    if (!confirm('¿Entregar «' + a.titulo + '»? Podrás volver a entregarla después si necesitas corregir algo.')) return;
    cargando(true);
    try {
      const u = N.usuario, aref = grupos().doc(a.gid).collection('actividades').doc(a.aid), eref = aref.collection('entregas').doc(u.uid);
      const previo = await eref.get().catch(() => null), antes = previo && previo.exists ? previo.data() : null;
      const meta = { nombre:u.displayName || u.email || 'Alumno', correo:u.email || '', fecha:N.ahora(), mini:miniatura() };
      if (antes){ if ('calificacion' in antes) meta.calificacion = antes.calificacion; if ('comentario' in antes) meta.comentario = antes.comentario; }
      await N.escribirGrande(eref, meta, serializar(), true);
      toast('📤 ¡Entregado! Tu maestro ya puede verlo.');
    } catch (e) { toast('No se pudo entregar: ' + e.message); } finally { cargando(false); }
  };
  // ---------- botón de la barra y enlace ?grupo=CÓDIGO ----------
  const b = document.createElement('button'); b.className = 'tb'; b.id = 'bEscuela'; b.title = 'Mi escuela: grupos, actividades y entregas';
  b.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/></svg><span class="txtLargo"> Escuela</span>';
  b.onclick = abrirEscuela;
  const ref = document.querySelector('#barra .tb.donar'); if (ref) ref.before(b); else { const barra = $e('barra'); barra && barra.appendChild(b); }
  const codigoURL = new URLSearchParams(location.search).get('grupo');
  if (codigoURL) N.listo.then(() => setTimeout(() => {
    abrirModal('mEscuela'); pila = [];
    if (!N.usuario) { ver('Unirme a un grupo', () => { cuerpo().innerHTML = `<p class="hint" style="padding-top:0">Te invitaron a un grupo (código <b>${esc(codigoURL)}</b>). Entra con tu cuenta de Google para unirte.</p><button class="bigbtn" id="escEntrar2" style="text-align:center;font-weight:700">Entrar con Google</button>`;
      $e('escEntrar2').onclick = async () => { await N.entrar(); if (await esperarUsuario()) ver('Unirme a un grupo', () => formUnirme(codigoURL), true); }; }); }
    else ver('Unirme a un grupo', () => formUnirme(codigoURL));
  }, 1200));
  window.addEventListener('nube-usuario', () => { if (!N.usuario){ window.ACTIVIDAD_ACTUAL = null; pintarBanda(); } });
})();

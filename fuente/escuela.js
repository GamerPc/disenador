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
  const sinPermiso = () => ({ docs:[], size:0 });     // si aún no se publican las reglas nuevas de avisos/exámenes, la escuela sigue funcionando
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
  .alumnos{display:flex;flex-wrap:wrap;gap:6px}.alumno{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--borde,#2a3140);border-radius:999px;padding:4px 4px 4px 12px;font-size:13px}
  .alumno small{color:var(--suave,#9ca3af)}.alumno .pb{padding:2px 8px;min-height:0;border-radius:999px}
  .filaRub{display:flex;gap:6px;margin:4px 0}.filaRub input[type=number]{width:80px}.filaRub .buscador{flex:1;margin:0}
  .rub{display:flex;flex-direction:column;gap:4px;margin-top:6px;font-size:12.5px}.rub label{display:flex;align-items:center;gap:6px;justify-content:space-between;margin:0;color:inherit}
  .rub label span{color:var(--suave,#9ca3af);margin-left:auto;white-space:nowrap;flex:none}.rub input{width:56px}.totRub{font-size:13px;margin-top:2px}
  #bEscuela.avisoEsc{position:relative}#bEscuela.avisoEsc::after{content:attr(data-n);position:absolute;top:2px;right:2px;min-width:16px;height:16px;border-radius:8px;background:#ef4444;color:#fff;font:700 10px/16px Inter,sans-serif;text-align:center;padding:0 3px}
  #bandaActividad span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#bandaActividad .btnP{padding:7px 14px;white-space:nowrap}#bandaActividad[hidden]{display:none}
  #bandaActividad{flex-wrap:wrap;justify-content:center;border-radius:18px}#bandaActividad.corr{border-color:#f43f5e}#bandaHerr{display:flex;gap:4px}#bandaHerr[hidden],#bandaActividad [hidden]{display:none}
  #bandaHerr .pb{padding:6px 9px;min-height:0;font-size:15px}#bandaHerr .pb.on{background:#f43f5e;color:#fff;border-color:#f43f5e}
  .i-dev{background:#ffe4e6;color:#9f1239}.i-corr{background:#fae8ff;color:#86198f}.i-nuevo{background:#e0f2fe;color:#075985}
  .avisoEsc2{border:1px solid var(--borde,#2a3140);border-left:4px solid #0ea5e9;border-radius:10px;padding:10px 12px;margin:8px 0;background:var(--panel2,#151821);white-space:pre-wrap;font-size:14px}
  .avisoEsc2 small{display:block;color:var(--suave,#9ca3af);margin-top:4px}.avisoEsc2.nuevo{border-left-color:#f59e0b}.avisoEsc2 .pb{float:right;padding:2px 8px;min-height:0}
  .devueltaMsg{border:1px solid #fda4af;background:rgba(244,63,94,.08);border-radius:10px;padding:10px 12px;margin:8px 0;font-size:14px;white-space:pre-wrap}
  .pregEx{border:1px solid var(--borde,#2a3140);border-radius:12px;padding:12px;margin:10px 0;background:var(--panel2,#151821)}.pregEx b{display:block;margin-bottom:8px;white-space:pre-wrap}
  .pregEx label{display:flex;gap:8px;align-items:flex-start;padding:7px 9px;border-radius:8px;margin:3px 0;cursor:pointer;color:inherit;font-size:14px}.pregEx label:hover{background:rgba(25,200,255,.08)}
  .pregEx label.bien{background:rgba(34,197,94,.16);outline:1px solid #22c55e}.pregEx label.mal{background:rgba(244,63,94,.14);outline:1px solid #f43f5e}
  .opEx{display:flex;gap:6px;align-items:center;margin:4px 0}.opEx input[type=text]{flex:1;margin:0}.opEx input[type=radio]{width:auto}
  .resEx{font:800 30px/1 Poppins,sans-serif;color:var(--neon,#19c8ff);margin:8px 0}.barraEst{height:8px;border-radius:4px;background:var(--panel,#10131b);overflow:hidden;margin-top:4px}.barraEst i{display:block;height:100%;background:#22c55e}`;
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
    await Promise.all(mios.map(async g => {
      const d = await grupos().doc(g.id).get().catch(() => null);
      g.existe = !!(d && d.exists); g.archivado = !!(g.existe && d.data().archivado);
      if (g.rol === 'alumno' && g.existe && !g.archivado){ g.pend = await pendientesDe(g.id).catch(() => null); g.avisos = await avisosNuevos(g.id).catch(() => 0); }
    }));
    const item = g => `<button class="escItem" data-g="${esc(g.id)}"><span class="t"><b>${esc(g.nombre)}</b><small>${g.rol === 'maestro' ? 'Código: ' + esc(g.codigo || '') : 'Maestro(a): ' + esc(g.maestroNombre || '')}</small></span>
        ${g.avisos ? `<span class="insig i-nuevo">📢 ${g.avisos} aviso${g.avisos > 1 ? 's' : ''}</span>` : ''}${g.pend && g.pend.pronto ? `<span class="insig i-tarde">⏰ ${g.pend.pronto} vence${g.pend.pronto > 1 ? 'n' : ''} pronto</span>` : g.pend && g.pend.n ? `<span class="insig i-pend">${g.pend.n} pendiente${g.pend.n > 1 ? 's' : ''}</span>` : ''}
        <span class="insig ${g.rol === 'maestro' ? 'i-maestro' : 'i-alumno'}">${g.rol === 'maestro' ? 'Maestro' : 'Alumno'}</span></button>`;
    const activos = mios.filter(g => g.existe && !g.archivado), archivados = mios.filter(g => g.existe && g.archivado);
    cuerpo().innerHTML = `<div class="grupoBtns"><button class="pb" id="escCrear">＋ Crear un grupo (soy maestro)</button><button class="pb" id="escUnirme">🔑 Unirme con un código</button></div>
      <div class="escLista">${activos.length ? activos.map(item).join('')
        : '<p class="hint">Todavía no estás en ningún grupo. Si eres maestro, crea uno; si eres alumno, pide el código a tu maestro.</p>'}</div>
      ${archivados.length ? `<details><summary class="hint" style="cursor:pointer">🗄 Grupos archivados (${archivados.length})</summary><div class="escLista">${archivados.map(item).join('')}</div></details>` : ''}
      <p class="hint" style="margin-top:12px">📘 ¿Primera vez? <a href="https://gamerpc.github.io/disenador/guia.html" target="_blank" rel="noopener">Lee la guía para maestros y alumnos</a>.</p>`;
    marcarBoton(activos.reduce((t, g) => t + ((g.pend && g.pend.n) || 0), 0));
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
    const [miembros, acts, exs, avs] = await Promise.all([gref.collection('miembros').get(), gref.collection('actividades').get(), gref.collection('examenes').get().catch(sinPermiso), gref.collection('avisos').get().catch(sinPermiso)]);
    const lista = acts.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.creada || '').localeCompare(a.creada || ''));
    const examenes = exs.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.creado || '').localeCompare(a.creado || ''));
    const avisos = avs.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    await Promise.all(lista.map(async a => { a.entregas = (await gref.collection('actividades').doc(a.id).collection('entregas').get()).docs.length; }));
    await Promise.all(examenes.map(async x => { x.resp = (await gref.collection('examenes').doc(x.id).collection('respuestas').get()).docs.length; }));
    const enlace = location.origin + location.pathname + '?grupo=' + g.codigo;
    cuerpo().innerHTML = `<p class="hint" style="padding-top:0">Código para tus alumnos:</p><div class="codigoGrande">${esc(g.codigo)}</div>
      ${g.archivado ? '<p class="hint"><span class="insig i-pend">🗄 Grupo archivado</span> Los alumnos lo ven en «archivados» y ya no reciben actividades nuevas.</p>' : ''}
      <div class="grupoBtns"><button class="pb" id="escCopiar">🔗 Copiar enlace para unirse</button><button class="pb" id="escNuevaAct">＋ Nueva actividad con el diseño actual</button>
        <button class="pb" id="escNuevoEx">📝 Nuevo examen</button><button class="pb" id="escCalif">⬇ Calificaciones (Excel)</button><button class="pb" id="escArchivar">${g.archivado ? '♻ Reactivar grupo' : '🗄 Archivar grupo'}</button></div>
      <h4>Actividades</h4><div class="escLista">${lista.length ? lista.map(a => `<button class="escItem" data-a="${esc(a.id)}"><span class="t"><b>${esc(a.titulo)}</b><small>${a.limite ? 'Entrega: ' + fecha(a.limite) : 'Sin fecha límite'}</small></span><span class="insig i-cal">${a.entregas || 0} de ${miembros.size}</span></button>`).join('')
        : '<p class="hint">Aún no hay actividades. Abre o diseña la plantilla que usarán tus alumnos y pulsa «Nueva actividad».</p>'}</div>
      <h4>Exámenes</h4><div class="escLista">${examenes.length ? examenes.map(x => `<button class="escItem" data-x="${esc(x.id)}"><span class="t"><b>📝 ${esc(x.titulo)}</b><small>${x.preguntas.length} pregunta${x.preguntas.length > 1 ? 's' : ''}${x.limite ? ' · hasta ' + fecha(x.limite) : ''}</small></span><span class="insig i-cal">${x.resp || 0} de ${miembros.size}</span></button>`).join('')
        : '<p class="hint">Sin exámenes. Crea uno de opción múltiple: se califica solo.</p>'}</div>
      <h4>📢 Avisos para el grupo</h4>
      <div class="escForm"><textarea id="escAvisoTxt" rows="2" maxlength="1500" placeholder="Escribe un aviso: cambio de fecha, material para la clase, recordatorios…"></textarea><button class="pb" id="escAvisoOk" style="margin-top:6px">📢 Publicar aviso</button></div>
      ${avisos.map(v => `<div class="avisoEsc2"><button class="pb" data-borrarav="${esc(v.id)}" title="Borrar aviso" aria-label="Borrar aviso">✕</button>${esc(v.texto)}<small>${fechaHora(v.fecha)}</small></div>`).join('')}
      <h4>Alumnos (${miembros.size})</h4>${miembros.size ? `<div class="alumnos">${miembros.docs.map(m => `<span class="alumno">${esc(m.data().nombre)}<small>${esc(m.data().correo || '')}</small><button class="pb" data-sacar="${esc(m.id)}" title="Sacar del grupo" aria-label="Sacar a ${esc(m.data().nombre)} del grupo">✕</button></span>`).join('')}</div>` : '<p class="hint" style="padding-top:0">Todavía no se une nadie.</p>'}`;
    $e('escCalif').onclick = () => descargarCalificaciones(gid, g, miembros, lista);
    $e('escArchivar').onclick = async () => {
      const v = !g.archivado;
      if (v && !confirm('¿Archivar «' + g.nombre + '»? Se guarda todo; solo deja de aparecer entre los grupos activos.')) return;
      try { await gref.update({ archivado:v }); await misGrupos().doc(gid).update({ archivado:v }).catch(() => {}); toast(v ? 'Grupo archivado' : 'Grupo reactivado'); ver(g.nombre, () => grupoMaestro(gid), true); }
      catch (e) { toast('No se pudo: ' + e.message); }
    };
    cuerpo().querySelectorAll('[data-sacar]').forEach(b => b.onclick = async () => {
      const m = miembros.docs.find(x => x.id === b.dataset.sacar);
      if (!confirm('¿Sacar a ' + m.data().nombre + ' del grupo? Sus entregas se conservan.')) return;
      try { await gref.collection('miembros').doc(m.id).delete(); toast(m.data().nombre + ' ya no está en el grupo'); ver(g.nombre, () => grupoMaestro(gid), true); }
      catch (e) { toast('No se pudo: ' + e.message); }
    });
    $e('escCopiar').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(enlace) : Promise.reject()).then(() => toast('Enlace copiado: ' + enlace), () => prompt('Copia este enlace:', enlace)); };
    $e('escNuevaAct').onclick = () => ver('Nueva actividad', () => formActividad(gid));
    $e('escNuevoEx').onclick = () => ver('Nuevo examen', () => formExamen(gid));
    cuerpo().querySelectorAll('[data-x]').forEach(b => b.onclick = () => { const x = examenes.find(y => y.id === b.dataset.x); ver('📝 ' + x.titulo, () => examenMaestro(gid, x.id)); });
    $e('escAvisoOk').onclick = async () => {
      const texto = $e('escAvisoTxt').value.trim(); if (!texto) return toast('Escribe el aviso');
      try { await gref.collection('avisos').doc().set({ texto, fecha:N.ahora(), autor:N.usuario.displayName || '' }); toast('📢 Aviso publicado: tus alumnos lo verán al entrar'); ver(g.nombre, () => grupoMaestro(gid), true); }
      catch (e) { toast('No se pudo publicar: ' + e.message); }
    };
    cuerpo().querySelectorAll('[data-borrarav]').forEach(b => b.onclick = async () => {
      if (!confirm('¿Borrar este aviso?')) return;
      try { await gref.collection('avisos').doc(b.dataset.borrarav).delete(); ver(g.nombre, () => grupoMaestro(gid), true); } catch (e) { toast('No se pudo: ' + e.message); }
    });
    cuerpo().querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const a = lista.find(x => x.id === b.dataset.a); ver(a.titulo, () => actividadMaestro(gid, a.id)); });
  }
  function formActividad(gid){
    cuerpo().innerHTML = `<div class="escForm"><p class="hint" style="padding-top:0">La actividad usará como plantilla <b>el diseño que tienes abierto ahora</b> (${paginas.length} página${paginas.length > 1 ? 's' : ''}).</p>
      <label for="escTit">Título</label><input id="escTit" class="buscador" maxlength="100" placeholder="Ej. Mapa conceptual del proceso penal acusatorio">
      <label for="escInst">Instrucciones</label><textarea id="escInst" rows="4" maxlength="2000" placeholder="Qué deben hacer, cómo se evalúa…"></textarea>
      <label for="escLim">Fecha límite (opcional)</label><input id="escLim" type="date">
      <label style="display:flex;gap:8px;align-items:center;color:inherit;margin-top:14px"><input type="checkbox" id="escUsaRub"> Calificar con rúbrica</label>
      <div id="escRub" hidden><p class="hint" style="padding-top:0">Criterios y puntos máximos (la calificación es la suma):</p><div id="escRubFilas"></div><button class="pb" id="escRubMas">＋ Criterio</button> <span class="hint" id="escRubTotal"></span></div>
      <p class="hint" style="margin-top:12px">¿No tienes plantilla? <button class="pb" id="escListas">📚 Usar una actividad lista</button></p>
      <button class="btnP" id="escActOk" style="margin-top:6px">Publicar actividad</button></div>`;
    const filaRub = (n, p) => { const d = document.createElement('div'); d.className = 'filaRub'; d.innerHTML = `<input class="buscador" maxlength="60" value="${esc(n)}" aria-label="Criterio"><input type="number" min="0" max="100" step="0.5" value="${p}" aria-label="Puntos"><button class="pb" aria-label="Quitar criterio">✕</button>`;
      d.querySelector('button').onclick = () => { d.remove(); totalRub(); }; d.querySelectorAll('input').forEach(i => i.oninput = totalRub); $e('escRubFilas').appendChild(d); };
    const totalRub = () => { const t = [...document.querySelectorAll('#escRubFilas .filaRub')].reduce((s, f) => s + (+f.children[1].value || 0), 0); $e('escRubTotal').textContent = 'Total: ' + t + ' puntos'; };
    [['Contenido', 4], ['Organización', 2], ['Diseño y presentación', 2], ['Ortografía', 1], ['Entrega a tiempo', 1]].forEach(([n, p]) => filaRub(n, p)); totalRub();
    $e('escUsaRub').onchange = e => { $e('escRub').hidden = !e.target.checked; };
    $e('escRubMas').onclick = () => { filaRub('Nuevo criterio', 1); totalRub(); };
    $e('escListas').onclick = () => {
      cerrarModal('mEscuela'); abrirLateral && esTel && esTel() && abrirLateral(true);
      const tab = document.querySelector('#pestanas button[data-tab="tPlantillas"]'); tab && tab.click();
      const chip = [...document.querySelectorAll('#chipsCat .chip')].find(x => x.textContent.includes('Actividades')); chip && chip.click();
      toast('Elige una actividad lista, ajústala y vuelve a 🎓 Escuela → Nueva actividad.');
    };
    $e('escActOk').onclick = async () => {
      const titulo = $e('escTit').value.trim(); if (!titulo) return toast('Escribe el título');
      cargando(true);
      try {
        const ref = grupos().doc(gid).collection('actividades').doc();
        const rubrica = $e('escUsaRub').checked ? [...document.querySelectorAll('#escRubFilas .filaRub')].map(f => ({ c:f.children[0].value.trim(), p:+f.children[1].value || 0 })).filter(x => x.c && x.p > 0) : null;
        await N.escribirGrande(ref, { titulo, instrucciones:$e('escInst').value.trim(), limite:$e('escLim').value || '', creada:N.ahora(), mini:miniatura(), w:W, h:H, rubrica:rubrica && rubrica.length ? rubrica : null }, serializar(), true);
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
        <div class="fila" style="margin-top:4px">${e.devuelta ? '<span class="insig i-dev">↩ Devuelta</span>' : e.devueltaFecha && e.fecha > e.devueltaFecha ? '<span class="insig i-ok">✓ La corrigió</span>' : ''}${e.corregida ? '<span class="insig i-corr">✏ Con correcciones</span>' : ''}</div>
        ${act.rubrica ? `<div class="rub">${act.rubrica.map((k, i) => `<label>${esc(k.c)} <span>/ ${k.p}</span><input type="number" min="0" max="${k.p}" step="0.5" data-k="${i}" value="${e.rubrica && e.rubrica[i] != null ? e.rubrica[i] : ''}"></label>`).join('')}<b class="totRub">Total: ${e.calificacion ?? '—'} / ${maxRub(act)}</b></div>` : ''}
        <div class="fila"><button class="pb" data-corr title="Abre la entrega para marcar, encerrar y comentar encima">✏ Corregir</button><button class="pb" data-dev title="Pedir al alumno que la corrija y la vuelva a entregar">↩ Devolver</button></div>
        <div class="fila"><button class="pb" data-abrir>Abrir</button>${act.rubrica ? '' : `<input type="number" min="0" max="10" step="0.1" placeholder="Cal." value="${e.calificacion ?? ''}" aria-label="Calificación">`}<button class="pb" data-cal>Guardar</button></div>
        <textarea rows="2" placeholder="Comentario para el alumno" style="width:100%;margin-top:6px;box-sizing:border-box" aria-label="Comentario">${esc(e.comentario || '')}</textarea></div></div>`).join('')}</div>
      ${faltan.length ? `<p class="hint">Sin entregar: ${faltan.map(esc).join(' · ')}</p>` : ''}`;
    $e('escVerPlantilla').onclick = () => abrirDeNube(aref, act.titulo + ' (plantilla)', null);
    $e('escBorrarAct').onclick = async () => {
      if (!confirm('¿Borrar la actividad «' + act.titulo + '» y todas sus entregas?')) return;
      cargando(true);
      try { for (const e of ents.docs){ await N.borrarGrande(aref.collection('entregas').doc(e.id).collection('correccion').doc('ultima')).catch(() => {}); await N.borrarGrande(aref.collection('entregas').doc(e.id)); } await N.borrarGrande(aref); toast('Actividad borrada'); $e('escAtras').click(); }
      catch (e) { toast('No se pudo borrar: ' + e.message); } finally { cargando(false); }
    };
    cuerpo().querySelectorAll('.entrega').forEach(div => {
      const id = div.dataset.e, e = lista.find(x => x.id === id), eref = aref.collection('entregas').doc(id);
      div.querySelector('[data-abrir]').onclick = () => abrirDeNube(eref, 'Entrega de ' + e.nombre + ' · ' + act.titulo, null);
      div.querySelector('[data-corr]').onclick = () => abrirParaCorregir(gid, aid, e, act);
      div.querySelector('[data-dev]').onclick = async () => {
        const msg = prompt('¿Qué debe corregir ' + e.nombre + '? (le llega este mensaje y la actividad vuelve a sus pendientes)', e.devueltaMsg || '');
        if (msg === null) return;
        try { await eref.update({ devuelta:true, devueltaMsg:msg.trim(), devueltaFecha:N.ahora() }); toast('↩ Devuelta a ' + e.nombre); ver(act.titulo, () => actividadMaestro(gid, aid), true); }
        catch (er) { toast('No se pudo devolver: ' + er.message); }
      };
      const ins = [...div.querySelectorAll('[data-k]')];
      const sumar = () => ins.every(i => i.value === '') ? null : ins.reduce((s, i) => s + Math.max(0, Math.min(+i.max, +i.value || 0)), 0);
      ins.forEach(i => i.oninput = () => { const t = sumar(); div.querySelector('.totRub').textContent = 'Total: ' + (t == null ? '—' : t) + ' / ' + maxRub(act); });
      div.querySelector('[data-cal]').onclick = async () => {
        let cal, rub = null;
        if (act.rubrica){ rub = ins.map(i => i.value === '' ? null : Math.max(0, Math.min(+i.max, +i.value))); cal = sumar(); }
        else { const v = div.querySelector('.fila input').value; cal = v === '' ? null : Math.max(0, Math.min(10, +v)); }
        try { await eref.update({ calificacion:cal, rubrica:rub, comentario:div.querySelector('textarea').value.trim(), calificada:N.ahora() }); e.calificacion = cal; e.rubrica = rub; toast('Calificación guardada para ' + e.nombre); }
        catch (er) { toast('No se pudo guardar: ' + er.message); }
      };
    });
  }

  // ---------- avisos: cuáles ya vio el alumno (en este navegador) ----------
  const leerVisto = gid => { try { return localStorage.getItem('esc_aviso_' + gid) || ''; } catch (e) { return ''; } };
  const guardarVisto = (gid, f) => { try { localStorage.setItem('esc_aviso_' + gid, f || ''); } catch (e) {} };
  async function avisosNuevos(gid){
    const visto = leerVisto(gid);
    return (await grupos().doc(gid).collection('avisos').get()).docs.filter(d => (d.data().fecha || '') > visto).length;
  }

  // ---------- exámenes de opción múltiple ----------
  // examenes/{x}: preguntas sin respuestas · claves/{x}: respuestas correctas (solo el maestro; el alumno al terminar si así se eligió)
  // examenes/{x}/respuestas/{alumno}: lo que contestó (no se puede cambiar) · la calificación la guarda el maestro
  const calificar = (resp, clave) => { const t = clave.length, b = clave.reduce((s, c, i) => s + (resp[i] === c ? 1 : 0), 0); return { b, t, cal:Math.round(b / Math.max(1, t) * 100) / 10 }; };
  function formExamen(gid){
    cuerpo().innerHTML = `<div class="escForm"><label for="exTit">Título</label><input id="exTit" class="buscador" maxlength="100" placeholder="Ej. Examen parcial · Unidad 2">
      <label for="exInst">Instrucciones (opcional)</label><textarea id="exInst" rows="2" maxlength="1000" placeholder="Ej. Elige la respuesta correcta. Tienes una sola oportunidad."></textarea>
      <label for="exLim">Fecha límite (opcional)</label><input id="exLim" type="date">
      <label style="display:flex;gap:8px;align-items:center;color:inherit;margin-top:12px"><input type="checkbox" id="exMostrar" checked style="width:auto"> Al terminar, el alumno ve su calificación y las respuestas correctas</label>
      <div id="exPregs"></div><button class="pb" id="exMas">＋ Agregar pregunta</button>
      <p class="hint">Marca con el círculo la respuesta correcta de cada pregunta. La calificación es sobre 10.</p>
      <button class="btnP" id="exOk">Publicar examen</button></div>`;
    const caja = $e('exPregs');
    const pregunta = (txt = '', ops = ['', '', '', ''], ok = 0) => {
      const d = document.createElement('div'); d.className = 'pregEx';
      const n = caja.children.length + 1, nom = 'exok' + Math.random().toString(36).slice(2, 7);
      d.innerHTML = `<b>Pregunta <span class="nP">${n}</span> <button class="pb" data-q style="float:right;padding:2px 8px;min-height:0" aria-label="Quitar pregunta">✕</button></b><textarea rows="2" maxlength="600" placeholder="Escribe la pregunta" style="width:100%;box-sizing:border-box">${esc(txt)}</textarea><div class="ops"></div><button class="pb" data-mas style="margin-top:4px">＋ Opción</button>`;
      const opsDiv = d.querySelector('.ops');
      const opcion = (t, marcada) => {
        if (opsDiv.children.length >= 6) return toast('Máximo 6 opciones');
        const o = document.createElement('div'); o.className = 'opEx';
        o.innerHTML = `<input type="radio" name="${nom}" ${marcada ? 'checked' : ''} aria-label="Respuesta correcta"><input type="text" class="buscador" maxlength="200" placeholder="Opción" value="${esc(t)}"><button class="pb" aria-label="Quitar opción" style="padding:4px 8px;min-height:0">✕</button>`;
        o.querySelector('button').onclick = () => { if (opsDiv.children.length > 2) o.remove(); else toast('Cada pregunta necesita al menos 2 opciones'); };
        opsDiv.appendChild(o);
      };
      ops.forEach((t, i) => opcion(t, i === ok));
      d.querySelector('[data-mas]').onclick = () => opcion('', false);
      d.querySelector('[data-q]').onclick = () => { d.remove(); [...caja.children].forEach((x, i) => x.querySelector('.nP').textContent = i + 1); };
      caja.appendChild(d);
    };
    pregunta(); pregunta('', ['Verdadero', 'Falso'], 0);
    $e('exMas').onclick = () => pregunta();
    $e('exTit').focus();
    $e('exOk').onclick = async () => {
      const titulo = $e('exTit').value.trim(); if (!titulo) return toast('Escribe el título del examen');
      const preguntas = [], clave = [];
      for (const [i, d] of [...caja.children].entries()){
        const p = d.querySelector('textarea').value.trim(), filas = [...d.querySelectorAll('.opEx')];
        const ops = filas.map(f => f.querySelector('input[type=text]').value.trim()), ok = filas.findIndex(f => f.querySelector('input[type=radio]').checked);
        if (!p) return toast('Falta escribir la pregunta ' + (i + 1));
        if (ops.some(o => !o)) return toast('Hay una opción vacía en la pregunta ' + (i + 1));
        if (ok < 0) return toast('Marca la respuesta correcta de la pregunta ' + (i + 1));
        preguntas.push({ p, ops }); clave.push(ok);
      }
      if (!preguntas.length) return toast('Agrega al menos una pregunta');
      cargando(true);
      try {
        const gref = grupos().doc(gid), ref = gref.collection('examenes').doc();
        await gref.collection('claves').doc(ref.id).set({ resp:clave });
        await ref.set({ titulo, instrucciones:$e('exInst').value.trim(), limite:$e('exLim').value || '', mostrarResultados:$e('exMostrar').checked, preguntas, creado:N.ahora() });
        toast('📝 Examen publicado: tus alumnos ya lo ven en «Mi escuela».'); $e('escAtras').click();
      } catch (e) { toast('No se pudo publicar: ' + e.message); } finally { cargando(false); }
    };
  }
  async function examenMaestro(gid, xid){
    const gref = grupos().doc(gid), xref = gref.collection('examenes').doc(xid);
    const [x, cl, rs, miembros] = await Promise.all([xref.get(), gref.collection('claves').doc(xid).get(), xref.collection('respuestas').get(), gref.collection('miembros').get()]);
    const ex = x.data(), clave = cl.exists ? cl.data().resp : [], lista = rs.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    // la calificación se calcula aquí y se guarda (el alumno no puede escribirla)
    for (const r of lista){ const c = calificar(r.resp || [], clave); r.c = c; if (r.calificacion !== c.cal) await xref.collection('respuestas').doc(r.id).update({ calificacion:c.cal, aciertos:c.b }).catch(() => {}); }
    const faltan = miembros.docs.filter(m => !lista.some(r => r.id === m.id)).map(m => m.data().nombre);
    const prom = lista.length ? (lista.reduce((s, r) => s + r.c.cal, 0) / lista.length).toFixed(1) : '—';
    cuerpo().innerHTML = `${ex.instrucciones ? `<p class="hint" style="padding-top:0;white-space:pre-wrap">${esc(ex.instrucciones)}</p>` : ''}
      <p class="hint">${ex.limite ? 'Hasta el <b>' + fecha(ex.limite) + '</b> · ' : ''}${lista.length} respuesta${lista.length === 1 ? '' : 's'} · Promedio: <b>${prom}</b></p>
      <div class="grupoBtns"><button class="pb peligro" id="exBorrar">🗑 Borrar examen</button></div>
      <h4>Calificaciones</h4><div class="escLista">${lista.map(r => `<div class="escItem" style="cursor:default"><span class="t"><b>${esc(r.nombre)}</b><small>${fechaHora(r.fecha)} · ${r.c.b} de ${r.c.t} correctas</small></span><span class="insig i-cal">${r.c.cal}</span></div>`).join('') || '<p class="hint">Nadie ha respondido todavía.</p>'}</div>
      ${faltan.length ? `<p class="hint">Sin responder: ${faltan.map(esc).join(' · ')}</p>` : ''}
      <h4>Cómo le fue al grupo en cada pregunta</h4>${ex.preguntas.map((q, i) => { const bien = lista.filter(r => (r.resp || [])[i] === clave[i]).length, pc = lista.length ? Math.round(bien / lista.length * 100) : 0;
        return `<div class="pregEx"><b>${i + 1}. ${esc(q.p)}</b><small class="hint" style="padding:0">Correcta: ${esc(q.ops[clave[i]] || '')} · ${pc}% acertó</small><div class="barraEst"><i style="width:${pc}%;background:${pc >= 70 ? '#22c55e' : pc >= 40 ? '#f59e0b' : '#ef4444'}"></i></div></div>`; }).join('')}`;
    $e('exBorrar').onclick = async () => {
      if (!confirm('¿Borrar el examen «' + ex.titulo + '» y todas sus respuestas?')) return;
      cargando(true);
      try { for (const r of rs.docs) await xref.collection('respuestas').doc(r.id).delete(); await gref.collection('claves').doc(xid).delete(); await xref.delete(); toast('Examen borrado'); $e('escAtras').click(); }
      catch (e) { toast('No se pudo borrar: ' + e.message); } finally { cargando(false); }
    };
  }
  async function examenAlumno(gid, xid){
    const gref = grupos().doc(gid), xref = gref.collection('examenes').doc(xid), uid = N.usuario.uid;
    const [x, r] = await Promise.all([xref.get(), xref.collection('respuestas').doc(uid).get()]);
    const ex = x.data(), mia = r.exists ? r.data() : null;
    const vencido = ex.limite && new Date() > new Date(ex.limite + 'T23:59:59');
    if (mia) return resultadoAlumno(gid, xid, ex, mia);
    if (vencido){ cuerpo().innerHTML = '<p class="hint" style="padding-top:0">Este examen ya cerró (fecha límite: ' + fecha(ex.limite) + ').</p>'; return; }
    cuerpo().innerHTML = `${ex.instrucciones ? `<p style="white-space:pre-wrap;margin-top:0">${esc(ex.instrucciones)}</p>` : ''}<p class="hint">${ex.preguntas.length} preguntas${ex.limite ? ' · hasta el ' + fecha(ex.limite) : ''} · Solo puedes enviarlo una vez.</p>
      ${ex.preguntas.map((q, i) => `<div class="pregEx"><b>${i + 1}. ${esc(q.p)}</b>${q.ops.map((o, j) => `<label><input type="radio" name="exr${i}" value="${j}" style="width:auto"> ${esc(o)}</label>`).join('')}</div>`).join('')}
      <button class="btnP" id="exEnviar">📨 Enviar mis respuestas</button>`;
    $e('exEnviar').onclick = async () => {
      const resp = ex.preguntas.map((q, i) => { const m = cuerpo().querySelector(`input[name="exr${i}"]:checked`); return m ? +m.value : -1; });
      const sin = resp.filter(v => v < 0).length;
      if (!confirm(sin ? `Te faltan ${sin} pregunta${sin > 1 ? 's' : ''} sin contestar. ¿Enviar así? Ya no podrás cambiarlas.` : '¿Enviar tus respuestas? Ya no podrás cambiarlas.')) return;
      cargando(true);
      try {
        const u = N.usuario, datos = { resp, fecha:N.ahora(), nombre:u.displayName || u.email || 'Alumno', correo:u.email || '' };
        await xref.collection('respuestas').doc(uid).set(datos);
        toast('📨 ¡Enviado!'); revisarPendientes(); await resultadoAlumno(gid, xid, ex, datos);
      } catch (e) { toast('No se pudo enviar: ' + e.message); } finally { cargando(false); }
    };
  }
  async function resultadoAlumno(gid, xid, ex, mia){
    let clave = null;
    if (ex.mostrarResultados){ const c = await grupos().doc(gid).collection('claves').doc(xid).get().catch(() => null); if (c && c.exists) clave = c.data().resp; }
    const c = clave ? calificar(mia.resp || [], clave) : null;
    cuerpo().innerHTML = `<p class="hint" style="padding-top:0">Enviaste tus respuestas el ${fechaHora(mia.fecha)}.</p>
      ${c ? `<div class="resEx">${c.cal} / 10</div><p class="hint" style="padding-top:0">${c.b} de ${c.t} correctas</p>` : mia.calificacion != null ? `<div class="resEx">${mia.calificacion} / 10</div>` : '<p class="hint">Tu maestro te dará tu calificación.</p>'}
      ${ex.preguntas.map((q, i) => `<div class="pregEx"><b>${i + 1}. ${esc(q.p)}</b>${q.ops.map((o, j) => { const elegida = (mia.resp || [])[i] === j, cls = clave ? (j === clave[i] ? 'bien' : elegida ? 'mal' : '') : '';
        return `<label class="${cls}"><input type="radio" disabled ${elegida ? 'checked' : ''} style="width:auto"> ${esc(o)}${clave && j === clave[i] ? ' ✓' : ''}</label>`; }).join('')}</div>`).join('')}`;
  }

  // ---------- alumno ----------
  async function grupoAlumno(gid){
    const gref = grupos().doc(gid), uid = N.usuario.uid;
    const yo = await gref.collection('miembros').doc(uid).get().catch(() => null);
    if (!yo || !yo.exists){
      cuerpo().innerHTML = '<p class="hint" style="padding-top:0">Ya no formas parte de este grupo. Si es un error, pide a tu maestro el código para volver a unirte.</p><button class="pb" id="escQuitarGrupo">Quitarlo de mi lista</button>';
      $e('escQuitarGrupo').onclick = async () => { await misGrupos().doc(gid).delete().catch(() => {}); $e('escAtras').click(); };
      return;
    }
    const acts = (await gref.collection('actividades').get()).docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.creada || '').localeCompare(a.creada || ''));
    const exs = (await gref.collection('examenes').get().catch(sinPermiso)).docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.creado || '').localeCompare(a.creado || ''));
    const avisos = (await gref.collection('avisos').get().catch(sinPermiso)).docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    const mias = {}, misResp = {};
    await Promise.all(acts.map(async a => { const s = await gref.collection('actividades').doc(a.id).collection('entregas').doc(uid).get(); if (s.exists) mias[a.id] = s.data(); }));
    await Promise.all(exs.map(async x => { const s = await gref.collection('examenes').doc(x.id).collection('respuestas').doc(uid).get(); if (s.exists) misResp[x.id] = s.data(); }));
    const visto = leerVisto(gid);
    const estado = a => { const e = mias[a.id]; if (!e) return `<span class="insig ${a.limite && new Date() > new Date(a.limite + 'T23:59:59') ? 'i-tarde' : 'i-pend'}">${a.limite && new Date() > new Date(a.limite + 'T23:59:59') ? 'Vencida' : 'Pendiente'}</span>`;
      if (e.devuelta) return '<span class="insig i-dev">↩ Corrígela</span>';
      return e.calificacion != null ? `<span class="insig i-cal">Calificación: ${e.calificacion}</span>` : e.corregida ? '<span class="insig i-corr">✏ Con correcciones</span>' : '<span class="insig i-ok">Entregada</span>'; };
    const estadoEx = x => { const r = misResp[x.id]; if (!r) return `<span class="insig ${x.limite && new Date() > new Date(x.limite + 'T23:59:59') ? 'i-tarde' : 'i-pend'}">${x.limite && new Date() > new Date(x.limite + 'T23:59:59') ? 'Vencido' : 'Por responder'}</span>`;
      return r.calificacion != null ? `<span class="insig i-cal">Calificación: ${r.calificacion}</span>` : '<span class="insig i-ok">Respondido</span>'; };
    cuerpo().innerHTML = `${avisos.slice(0, 5).map(v => `<div class="avisoEsc2${(v.fecha || '') > visto ? ' nuevo' : ''}">📢 ${esc(v.texto)}<small>${fechaHora(v.fecha)}${(v.fecha || '') > visto ? ' · nuevo' : ''}</small></div>`).join('')}
      ${exs.length ? `<h4>Exámenes</h4><div class="escLista">${exs.map(x => `<button class="escItem" data-x="${esc(x.id)}"><span class="t"><b>📝 ${esc(x.titulo)}</b><small>${x.preguntas.length} pregunta${x.preguntas.length > 1 ? 's' : ''}${x.limite ? ' · hasta ' + fecha(x.limite) : ''}</small></span>${estadoEx(x)}</button>`).join('')}</div><h4>Actividades</h4>` : ''}
      <div class="escLista">${acts.length ? acts.map(a => `<button class="escItem" data-a="${esc(a.id)}">${a.mini ? `<img src="${a.mini}" alt="" style="width:64px;height:48px;object-fit:contain;background:#fff;border-radius:6px">` : ''}<span class="t"><b>${esc(a.titulo)}</b><small>${a.limite ? 'Entrega: ' + fecha(a.limite) : 'Sin fecha límite'}</small></span>${estado(a)}</button>`).join('')
      : '<p class="hint">Tu maestro todavía no publica actividades.</p>'}</div>`;
    cuerpo().querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const a = acts.find(x => x.id === b.dataset.a); ver(a.titulo, () => actividadAlumno(gid, a.id)); });
    cuerpo().querySelectorAll('[data-x]').forEach(b => b.onclick = () => { const x = exs.find(y => y.id === b.dataset.x); ver('📝 ' + x.titulo, () => examenAlumno(gid, x.id)); });
    if (avisos.length) guardarVisto(gid, avisos[0].fecha);
  }
  async function actividadAlumno(gid, aid){
    const gref = grupos().doc(gid), aref = gref.collection('actividades').doc(aid), uid = N.usuario.uid;
    const [g, a, e] = await Promise.all([gref.get(), aref.get(), aref.collection('entregas').doc(uid).get()]);
    const act = a.data(), ent = e.exists ? e.data() : null;
    cuerpo().innerHTML = `${act.mini ? `<img src="${act.mini}" alt="" style="max-width:100%;max-height:220px;display:block;margin:0 auto 10px;background:#fff;border-radius:8px">` : ''}
      ${act.instrucciones ? `<p style="white-space:pre-wrap;margin-top:0">${esc(act.instrucciones)}</p>` : ''}
      <p class="hint">${act.limite ? 'Fecha límite: <b>' + fecha(act.limite) + '</b>' : 'Sin fecha límite'}</p>
      ${act.rubrica ? `<p class="hint"><b>Se califica con:</b> ${act.rubrica.map(k => esc(k.c) + ' (' + k.p + ')').join(' · ')}</p>` : ''}
      ${ent && ent.devuelta ? `<div class="devueltaMsg">↩ <b>Tu maestro te la devolvió para que la corrijas.</b>${ent.devueltaMsg ? '\n' + esc(ent.devueltaMsg) : ''}</div>` : ''}
      ${ent ? `<div class="escItem" style="cursor:default"><span class="t"><b>✓ Entregaste el ${fechaHora(ent.fecha)}</b>${ent.calificacion != null ? `<small>Calificación: <b>${ent.calificacion}${act.rubrica ? ' / ' + maxRub(act) : ''}</b></small>` : '<small>Tu maestro aún no califica.</small>'}${act.rubrica && ent.rubrica ? `<small>${act.rubrica.map((k, i) => esc(k.c) + ': ' + (ent.rubrica[i] ?? '—') + '/' + k.p).join(' · ')}</small>` : ''}${ent.comentario ? `<small>Comentario: ${esc(ent.comentario)}</small>` : ''}</span></div>` : ''}
      <div class="grupoBtns" style="margin-top:10px">${ent && ent.corregida ? '<button class="btnP" id="escVerCorr">👁 Ver las correcciones de mi maestro</button>' : ''}<button class="${ent && ent.corregida ? 'pb' : 'btnP'}" id="escEmpezar">${ent ? '✏ Abrir mi entrega para corregirla' : '✏ Empezar la actividad'}</button></div>
      ${ent && ent.corregida ? '<p class="hint">Las marcas de tu maestro aparecen encima de tu trabajo. Corrige y vuelve a entregar; antes de entregar te preguntamos si quieres quitar las marcas.</p>' : ''}`;
    const ctx = { gid, aid, titulo:act.titulo, grupo:g.data().nombre, limite:act.limite };
    $e('escEmpezar').onclick = () => ent ? abrirDeNube(aref.collection('entregas').doc(uid), act.titulo, ctx) : abrirDeNube(aref, act.titulo, ctx);
    if ($e('escVerCorr')) $e('escVerCorr').onclick = () => abrirDeNube(aref.collection('entregas').doc(uid).collection('correccion').doc('ultima'), act.titulo + ' (con correcciones)', ctx);
  }
  async function abrirDeNube(ref, nombre, ctxActividad){
    if (canvas.getObjects().length && !confirm('Se abrirá «' + nombre + '» en lugar de lo que tienes ahora. Si no lo has guardado, se perderá. ¿Continuar?')) return false;
    cargando(true); terminarCorreccion();
    try {
      const r = await N.leerGrande(ref);
      $('nombreDiseno').value = nombre; historial = []; hi = -1; miniaturas = [];
      await new Promise(ok => cargarJSON(r.texto, true, ok));
      enDrive = false; indicadorGuardado('nuevo');
      window.ACTIVIDAD_ACTUAL = ctxActividad; pintarBanda();
      cerrarModal('mEscuela');
      toast(ctxActividad ? (hayMarcas() ? 'Aquí están las marcas de tu maestro. Corrige y pulsa «Entregar».' : 'Haz la actividad y pulsa «Entregar» (arriba) cuando termines.') : 'Abierto: ' + nombre);
      return true;
    } catch (e) { toast('No se pudo abrir: ' + e.message); return false; } finally { cargando(false); }
  }
  // ---------- banda de la actividad y entrega ----------
  const banda = document.createElement('div'); banda.id = 'bandaActividad'; banda.hidden = true; banda.setAttribute('role', 'status');
  banda.innerHTML = '<span id="bandaTxt"></span><span id="bandaHerr" hidden><button class="pb" data-h="marcador" title="Marcador rojo (dibuja encima)" aria-label="Marcador rojo">🖊</button><button class="pb" data-h="circulo" title="Encerrar en un círculo" aria-label="Círculo">⭕</button><button class="pb" data-h="nota" title="Nota o comentario" aria-label="Nota">💬</button><button class="pb" data-h="bien" title="Palomita: está bien" aria-label="Bien">✔</button><button class="pb" data-h="mal" title="Tache: revisar" aria-label="Revisar">✘</button></span>'
    + '<button class="btnP" id="bEntregar">📤 Entregar</button><button class="btnP" id="bGuardarCorr" hidden>💾 Guardar corrección</button><button class="pb" id="bQuitarMarcas" hidden title="Quita las marcas que dejó tu maestro">🧹 Quitar marcas</button><button class="pb" id="bSalirAct" title="Dejar de trabajar en la actividad" aria-label="Dejar la actividad">✕</button>';
  (document.getElementById('area') || document.body).appendChild(banda);
  function pintarBanda(){
    const a = window.ACTIVIDAD_ACTUAL, c = window.CORRECCION; banda.hidden = !a && !c;
    banda.classList.toggle('corr', !!c);
    $e('bandaHerr').hidden = !c; $e('bGuardarCorr').hidden = !c; $e('bEntregar').hidden = !a;
    $e('bQuitarMarcas').hidden = !(a && hayMarcas());
    if (c) $e('bandaTxt').textContent = '✏ Corrigiendo a ' + c.nombre;
    else if (a) $e('bandaTxt').textContent = '🎓 ' + a.titulo + (a.limite ? ' · entrega: ' + fecha(a.limite) : '');
  }
  $e('bSalirAct').onclick = () => { if (window.CORRECCION && !confirm('¿Dejar de corregir? Lo que no guardaste con «Guardar corrección» se queda solo aquí.')) return; window.ACTIVIDAD_ACTUAL = null; terminarCorreccion(); pintarBanda(); };
  // ---------- correcciones del maestro sobre la entrega ----------
  window.CORRECCION = null;
  if (typeof EXTRA !== 'undefined' && !EXTRA.includes('esCorreccion')) EXTRA.push('esCorreccion');
  const ROJO_C = '#e11d48';
  function hayMarcas(){
    try { const enLienzo = canvas.getObjects().some(o => o.esCorreccion);
      return enLienzo || paginas.some((p, i) => i !== actual && p && (p.objects || []).some(o => o.esCorreccion)); } catch (e) { return false; }
  }
  function terminarCorreccion(){
    if (canvas.isDrawingMode && window.CORRECCION) canvas.isDrawingMode = false;
    window.CORRECCION = null; document.querySelectorAll('#bandaHerr .pb').forEach(b => b.classList.remove('on'));
  }
  canvas.on('object:added', e => { const o = e.target; if (window.CORRECCION && o && !restaurando && !o.esFondo) o.esCorreccion = true; });
  async function abrirParaCorregir(gid, aid, e, act){
    const eref = grupos().doc(gid).collection('actividades').doc(aid).collection('entregas').doc(e.id), cref = eref.collection('correccion').doc('ultima');
    const prev = await cref.get().catch(() => null);
    // si ya la corregiste y el alumno no ha vuelto a entregar, se sigue sobre tu corrección
    const usar = prev && prev.exists && (prev.data().fecha || '') > (e.fecha || '') ? cref : eref;
    if (!(await abrirDeNube(usar, 'Corrección · ' + e.nombre + ' · ' + act.titulo, null))) return;
    window.CORRECCION = { gid, aid, uid:e.id, nombre:e.nombre, titulo:act.titulo }; pintarBanda();
    toast('✏ Marca, encierra o comenta con los botones de arriba (o con cualquier herramienta). Al terminar: «Guardar corrección».');
  }
  function herramientaCorr(h){
    const k = Math.max(W, H) / 1080, centro = { left:W / 2, top:H / 2, originX:'center', originY:'center', id:nuevoId() };
    const btn = document.querySelector(`#bandaHerr [data-h="${h}"]`);
    if (h === 'marcador'){
      const on = !canvas.isDrawingMode; canvas.isDrawingMode = on; btn.classList.toggle('on', on);
      if (on){ const br = new fabric.PencilBrush(canvas); br.color = ROJO_C; br.width = Math.max(3, 5 * k); canvas.freeDrawingBrush = br; toast('🖊 Dibuja encima. Toca otra vez 🖊 para dejar de dibujar.'); }
      return;
    }
    canvas.isDrawingMode = false; document.querySelector('#bandaHerr [data-h="marcador"]').classList.remove('on');
    let o;
    if (h === 'circulo') o = new fabric.Ellipse({ ...centro, rx:150 * k, ry:95 * k, fill:'rgba(0,0,0,0)', stroke:ROJO_C, strokeWidth:6 * k, name:'Corrección: círculo' });
    else if (h === 'nota') o = new fabric.Textbox('Escribe aquí tu comentario', { ...centro, width:380 * k, fontSize:30 * k, fontFamily:'Patrick Hand', fill:'#991b1b', backgroundColor:'#fef08a', textAlign:'left', name:'Corrección: nota' });
    else o = new fabric.Text(h === 'bien' ? '✔' : '✘', { ...centro, fontSize:110 * k, fontWeight:'700', fill:h === 'bien' ? '#16a34a' : ROJO_C, name:h === 'bien' ? 'Corrección: bien' : 'Corrección: revisar' });
    o.esCorreccion = true; canvas.add(o); canvas.setActiveObject(o);
    if (h === 'nota'){ o.enterEditing(); o.selectAll(); }
    canvas.requestRenderAll(); guardarEstado();
  }
  document.querySelectorAll('#bandaHerr [data-h]').forEach(b => b.onclick = () => herramientaCorr(b.dataset.h));
  $e('bGuardarCorr').onclick = async () => {
    const c = window.CORRECCION; if (!c || !N.pedirCuenta()) return;
    canvas.isDrawingMode = false; cargando(true);
    try {
      const eref = grupos().doc(c.gid).collection('actividades').doc(c.aid).collection('entregas').doc(c.uid);
      await N.escribirGrande(eref.collection('correccion').doc('ultima'), { fecha:N.ahora(), mini:miniatura(), maestro:N.usuario.displayName || '' }, serializar(), true);
      await eref.update({ corregida:N.ahora() });
      toast('💾 Corrección guardada: ' + c.nombre + ' ya puede verla en su actividad.');
    } catch (e) { toast('No se pudo guardar la corrección: ' + e.message); } finally { cargando(false); }
  };
  $e('bQuitarMarcas').onclick = () => quitarMarcas().then(() => toast('🧹 Marcas quitadas'));
  function quitarMarcas(){
    return new Promise(ok => recorrerPaginas(objs => { objs.filter(o => o.esCorreccion).forEach(o => canvas.remove(o)); }, () => setTimeout(() => { guardarEstado(); pintarBanda(); ok(); }, 50)));
  }
  $e('bEntregar').onclick = async () => {
    const a = window.ACTIVIDAD_ACTUAL; if (!a || !N.pedirCuenta()) return;
    if (hayMarcas() && confirm('Tu trabajo todavía tiene las marcas de tu maestro. ¿Quitarlas antes de entregar? (Aceptar = quitarlas)')) await quitarMarcas();
    if (!confirm('¿Entregar «' + a.titulo + '»? Podrás volver a entregarla después si necesitas corregir algo.')) return;
    cargando(true);
    try {
      const u = N.usuario, aref = grupos().doc(a.gid).collection('actividades').doc(a.aid), eref = aref.collection('entregas').doc(u.uid);
      const previo = await eref.get().catch(() => null), antes = previo && previo.exists ? previo.data() : null;
      const meta = { nombre:u.displayName || u.email || 'Alumno', correo:u.email || '', fecha:N.ahora(), mini:miniatura() };
      if (antes) ['calificacion', 'comentario', 'rubrica', 'calificada', 'corregida', 'devueltaMsg', 'devueltaFecha'].forEach(k => { if (k in antes) meta[k] = antes[k]; });
      meta.devuelta = false;
      await N.escribirGrande(eref, meta, serializar(), true);
      toast('📤 ¡Entregado! Tu maestro ya puede verlo.'); revisarPendientes();
    } catch (e) { toast('No se pudo entregar: ' + e.message); } finally { cargando(false); }
  };
  // ---------- pendientes del alumno y aviso en el botón ----------
  const maxRub = a => (a.rubrica || []).reduce((s, k) => s + (k.p || 0), 0);
  async function pendientesDe(gid){
    const gref = grupos().doc(gid), uid = N.usuario.uid, hoy = new Date();
    const acts = (await gref.collection('actividades').get()).docs.map(d => ({ id:d.id, ...d.data() }));
    let n = 0, pronto = 0;
    await Promise.all(acts.map(async a => {
      const fin = a.limite ? new Date(a.limite + 'T23:59:59') : null;
      if (fin && fin < hoy) return;
      const e = await gref.collection('actividades').doc(a.id).collection('entregas').doc(uid).get();
      if (e.exists && !e.data().devuelta) return;
      n++; if (fin && (fin - hoy) < 3 * 864e5) pronto++;
    }));
    const exs = (await gref.collection('examenes').get().catch(() => ({ docs:[] }))).docs.map(d => ({ id:d.id, ...d.data() }));
    await Promise.all(exs.map(async x => {
      const fin = x.limite ? new Date(x.limite + 'T23:59:59') : null; if (fin && fin < hoy) return;
      const r = await gref.collection('examenes').doc(x.id).collection('respuestas').doc(uid).get(); if (r.exists) return;
      n++; if (fin && (fin - hoy) < 3 * 864e5) pronto++;
    }));
    return { n, pronto };
  }
  function marcarBoton(n){ const bt = $e('bEscuela'); if (!bt) return; bt.classList.toggle('avisoEsc', n > 0); bt.dataset.n = n > 0 ? n : ''; bt.title = n > 0 ? 'Mi escuela: tienes ' + n + ' actividad' + (n > 1 ? 'es' : '') + ' pendiente' + (n > 1 ? 's' : '') : 'Mi escuela: grupos, actividades y entregas'; }
  async function revisarPendientes(){
    if (!N.usuario) return marcarBoton(0);
    try {
      const mios = (await misGrupos().get()).docs.map(d => ({ id:d.id, ...d.data() })).filter(g => g.rol === 'alumno');
      let n = 0, pronto = 0;
      for (const g of mios){ const d = await grupos().doc(g.id).get().catch(() => null); if (!d || !d.exists || d.data().archivado) continue; const p = await pendientesDe(g.id).catch(() => null); if (p){ n += p.n; pronto += p.pronto; } }
      marcarBoton(n);
      if (pronto && !revisarPendientes.avisado){ revisarPendientes.avisado = true; toast('⏰ Tienes ' + pronto + ' actividad' + (pronto > 1 ? 'es' : '') + ' de la escuela que vence' + (pronto > 1 ? 'n' : '') + ' pronto. Ábrelas en 🎓 Escuela.'); }
    } catch (e) {}
  }
  // ---------- calificaciones en Excel (archivo CSV que Excel y Google Sheets abren) ----------
  async function descargarCalificaciones(gid, g, miembros, actividades){
    cargando(true);
    try {
      const gref = grupos().doc(gid), acts = actividades.slice().sort((a, b) => (a.creada || '').localeCompare(b.creada || ''));
      const alumnos = new Map(miembros.docs.map(m => [m.id, { nombre:m.data().nombre, correo:m.data().correo || '' }]));
      const notas = {};
      for (const a of acts){
        const es = await gref.collection('actividades').doc(a.id).collection('entregas').get();
        es.docs.forEach(d => { const e = d.data(); if (!alumnos.has(d.id)) alumnos.set(d.id, { nombre:e.nombre + ' (salió del grupo)', correo:e.correo || '' }); (notas[d.id] = notas[d.id] || {})[a.id] = e; });
      }
      // exámenes: la calificación se calcula con la clave
      const exs = (await gref.collection('examenes').get().catch(sinPermiso)).docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (a.creado || '').localeCompare(b.creado || ''));
      for (const x of exs){
        const cl = await gref.collection('claves').doc(x.id).get(), clave = cl.exists ? cl.data().resp : [];
        (await gref.collection('examenes').doc(x.id).collection('respuestas').get()).docs.forEach(d => { const r = d.data(); if (!alumnos.has(d.id)) alumnos.set(d.id, { nombre:r.nombre + ' (salió del grupo)', correo:r.correo || '' });
          (notas[d.id] = notas[d.id] || {})['ex_' + x.id] = { calificacion:calificar(r.resp || [], clave).cal }; });
      }
      const cols = [...acts.map(a => ({ id:a.id, nom:a.titulo + (a.rubrica ? ' (/' + maxRub(a) + ')' : ' (/10)'), max:a.rubrica ? maxRub(a) || 10 : 10, falta:'Sin entregar', hecho:'Entregada' })),
        ...exs.map(x => ({ id:'ex_' + x.id, nom:'Examen: ' + x.titulo + ' (/10)', max:10, falta:'Sin responder', hecho:'Respondido' }))];
      const celda = v => { const t = String(v ?? ''); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
      const filas = [['Alumno', 'Correo', ...cols.map(c => c.nom), 'Promedio (0-10)']];
      [...alumnos.entries()].sort((a, b) => a[1].nombre.localeCompare(b[1].nombre)).forEach(([uid, al]) => {
        const vals = cols.map(c => { const e = (notas[uid] || {})[c.id]; return !e ? c.falta : e.calificacion == null ? c.hecho : e.calificacion; });
        const sobre10 = cols.map((c, i) => typeof vals[i] === 'number' ? vals[i] * 10 / c.max : null).filter(v => v != null);
        filas.push([al.nombre, al.correo, ...vals, sobre10.length ? (sobre10.reduce((s, v) => s + v, 0) / sobre10.length).toFixed(1) : '']);
      });
      const csv = '\ufeff' + filas.map(f => f.map(celda).join(',')).join('\r\n');
      bajarBlob(new Blob([csv], { type:'text/csv;charset=utf-8' }), 'Calificaciones - ' + g.nombre.replace(/[\\/:*?"<>|]/g, '') + '.csv');
      toast('Calificaciones descargadas. Ábrelas con Excel o Google Sheets.');
    } catch (e) { toast('No se pudieron descargar: ' + e.message); } finally { cargando(false); }
  }
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
  window.addEventListener('nube-usuario', () => { if (!N.usuario){ window.ACTIVIDAD_ACTUAL = null; pintarBanda(); marcarBoton(0); } else setTimeout(revisarPendientes, 1500); });
})();

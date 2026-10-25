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
  const hoyISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const sinReglas = e => /permission|insufficient/i.test((e && (e.code || e.message)) || '');
  const codigoNuevo = () => { const L = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 6; i++) c += L[Math.floor(Math.random() * L.length)]; return c; };
  const grupos = () => N.db.collection('grupos');
  const sinPermiso = () => ({ docs:[], size:0 });     // si aún no se publican las reglas nuevas de avisos/exámenes, la escuela sigue funcionando
  const maestrosDe = g => [g.maestro, ...(g.auxiliares || [])].filter(Boolean);       // titular y auxiliares
  const esTitular = g => !!(g && N.usuario && g.maestro === N.usuario.uid);
  // ---------- 🔔 notificaciones: cada quien tiene su buzón (buzon/{uid}/n) y los demás le dejan avisos ----------
  const buzon = uid => N.db.collection('buzon').doc(uid).collection('n');
  const cacheGrupo = {};
  const datosGrupo = async gid => cacheGrupo[gid] || (cacheGrupo[gid] = (await grupos().doc(gid).get()).data());
  function avisarA(uids, d){
    const yo = N.usuario && N.usuario.uid; if (!yo) return Promise.resolve();
    const datos = { ...d, texto:String(d.texto || '').slice(0, 280), de:yo, deNombre:N.usuario.displayName || '', fecha:N.ahora(), leida:false };
    return Promise.all([...new Set(uids)].filter(u => u && u !== yo).map(u => buzon(u).doc().set(datos).catch(() => {})));
  }
  async function avisarAlGrupo(gid, d){       // a todos los alumnos (y a los otros maestros)
    try { const g = await datosGrupo(gid), m = await miembrosDe(gid);
      await avisarA([...m.docs.map(x => x.id)], { ...d, grupo:gid, grupoNombre:g.nombre, para:'alumno' });
      await avisarA(maestrosDe(g), { ...d, grupo:gid, grupoNombre:g.nombre, para:'maestro' }); } catch (e) {}
  }
  async function avisarAMaestros(gid, d){
    try { const g = await datosGrupo(gid); await avisarA(maestrosDe(g), { ...d, grupo:gid, grupoNombre:g.nombre, para:'maestro' }); } catch (e) {}
  }
  async function avisarAlAlumno(gid, uid, d){
    try { const g = await datosGrupo(gid); await avisarA([uid], { ...d, grupo:gid, grupoNombre:g.nombre, para:'alumno' }); } catch (e) {}
  }
  // ---------- ahorrar lecturas de la nube (el plan gratis de Firebase da 50,000 al día para todos) ----------
  // lo que ya se leyó hace poco se reutiliza; «persistir» lo guarda también en este navegador
  const MEMO = {};
  async function memo(clave, ttl, fn, persistir){
    clave = (N.usuario ? N.usuario.uid : '') + ':' + clave;
    let m = MEMO[clave];
    if (!m && persistir) try { m = JSON.parse(localStorage.getItem('memo_' + clave) || 'null'); } catch (e) {}
    if (m && Date.now() - m.t < ttl) return m.v;
    const v = await fn(); MEMO[clave] = { t:Date.now(), v };
    if (persistir) try { localStorage.setItem('memo_' + clave, JSON.stringify(MEMO[clave])); } catch (e) {}
    return v;
  }
  function olvidar(pref){
    pref = (N.usuario ? N.usuario.uid : '') + ':' + pref;
    Object.keys(MEMO).forEach(k => { if (k.startsWith(pref)) delete MEMO[k]; });
    try { Object.keys(localStorage).forEach(k => { if (k.startsWith('memo_' + pref)) localStorage.removeItem(k); }); } catch (e) {}
  }
  const MIN = 60000;
  // la lista de alumnos: en el grupo y el pase de lista siempre fresca (alguien se pudo acabar de unir); dentro de una actividad se reutiliza 1 min
  const miembrosDe = (gid, fresca) => { if (fresca) olvidar('miembros:' + gid); return memo('miembros:' + gid, MIN, () => grupos().doc(gid).collection('miembros').get()); };
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
  .entrega .sinMini{aspect-ratio:4/3;display:grid;place-items:center;font-size:40px;background:var(--panel,#10131b)}.entrega .pie{padding:8px 10px;font-size:13px}.entrega .pie b{display:block}.entrega .fila{display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap}.entrega .fila .pb{padding:6px 10px}.entrega input{width:64px;min-width:0;background:var(--panel,#10131b);color:inherit;border:1px solid var(--borde,#2a3140);border-radius:8px;padding:6px 8px}
  .entrega textarea,.escForm textarea{background:var(--panel,#10131b);color:inherit;border:1px solid var(--borde,#2a3140);border-radius:8px;padding:8px;font:13px/1.4 Inter,sans-serif;resize:vertical}
  .escForm label{display:block;font-size:13px;margin:10px 0 4px;color:var(--suave,#9ca3af)}.escForm input,.escForm textarea{width:100%;box-sizing:border-box}
  #bandaActividad{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:20;display:flex;align-items:center;gap:10px;background:#0b1220;color:#e8f6ff;border:1px solid #19c8ff;border-radius:999px;padding:6px 8px 6px 16px;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.35);max-width:calc(100% - 20px)}
  .alumnos{display:flex;flex-wrap:wrap;gap:6px}.alumno{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--borde,#2a3140);border-radius:999px;padding:4px 4px 4px 12px;font-size:13px}
  .alumno small{color:var(--suave,#9ca3af)}.alumno .pb{padding:2px 8px;min-height:0;border-radius:999px}
  .filaRub{display:flex;gap:6px;margin:4px 0}.filaRub input[type=number]{width:80px}.filaRub .buscador{flex:1;margin:0}
  .rub{display:flex;flex-direction:column;gap:4px;margin-top:6px;font-size:12.5px}.rub label{display:flex;align-items:center;gap:6px;justify-content:space-between;margin:0;color:inherit}
  .rub label span{color:var(--suave,#9ca3af);margin-left:auto;white-space:nowrap;flex:none}.rub input{width:56px}.totRub{font-size:13px;margin-top:2px}
  #bAvisos[hidden]{display:none}#bEscuela.avisoEsc,#bAvisos.avisoEsc{position:relative}#bAvisos.avisoEsc::after,#bEscuela.avisoEsc::after{content:attr(data-n);position:absolute;top:2px;right:2px;min-width:16px;height:16px;border-radius:8px;background:#ef4444;color:#fff;font:700 10px/16px Inter,sans-serif;text-align:center;padding:0 3px}
  #bandaActividad span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#bandaActividad .btnP{padding:7px 14px;white-space:nowrap}#bandaActividad[hidden]{display:none}
  #bandaActividad{flex-wrap:nowrap;justify-content:center;border-radius:18px}@media (max-width:760px){#bandaActividad{flex-wrap:wrap}}.escItem .t small{display:block}#bandaActividad .pb{white-space:nowrap}#bandaActividad.corr{border-color:#f43f5e}#bandaHerr{display:flex;gap:4px}#bandaHerr[hidden],#bandaActividad [hidden]{display:none}
  #bandaHerr .pb{padding:6px 9px;min-height:0;font-size:15px}#bandaHerr .pb.on{background:#f43f5e;color:#fff;border-color:#f43f5e}
  .i-dev{background:#ffe4e6;color:#9f1239}.i-corr{background:#fae8ff;color:#86198f}.i-nuevo{background:#e0f2fe;color:#075985}
  .avisoEsc2{border:1px solid var(--borde,#2a3140);border-left:4px solid #0ea5e9;border-radius:10px;padding:10px 12px;margin:8px 0;background:var(--panel2,#151821);white-space:pre-wrap;font-size:14px}
  .avisoEsc2 small{display:block;color:var(--suave,#9ca3af);margin-top:4px}.avisoEsc2.nuevo{border-left-color:#f59e0b}.avisoEsc2 .pb{float:right;padding:2px 8px;min-height:0}
  .devueltaMsg{border:1px solid #fda4af;background:rgba(244,63,94,.08);border-radius:10px;padding:10px 12px;margin:8px 0;font-size:14px;white-space:pre-wrap}
  .pregEx{border:1px solid var(--borde,#2a3140);border-radius:12px;padding:12px;margin:10px 0;background:var(--panel2,#151821)}.pregEx b{display:block;margin-bottom:8px;white-space:pre-wrap}
  .pregEx label{display:flex;gap:8px;align-items:flex-start;padding:7px 9px;border-radius:8px;margin:3px 0;cursor:pointer;color:inherit;font-size:14px}.pregEx label:hover{background:rgba(25,200,255,.08)}
  .pregEx label.bien{background:rgba(34,197,94,.16);outline:1px solid #22c55e}.pregEx label.mal{background:rgba(244,63,94,.14);outline:1px solid #f43f5e}
  .opEx{display:flex;gap:6px;align-items:center;margin:4px 0}.opEx input[type=text]{flex:1;margin:0}.opEx input[type=radio]{width:auto}
  .resEx{font:800 30px/1 Poppins,sans-serif;color:var(--neon,#19c8ff);margin:8px 0}.barraEst{height:8px;border-radius:4px;background:var(--panel,#10131b);overflow:hidden;margin-top:4px}.barraEst i{display:block;height:100%;background:#22c55e}
  .filaPreg{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin:6px 0}.filaPreg label{display:flex;flex-direction:column;gap:4px;margin:0}.filaPreg select{background:var(--panel,#10131b);color:inherit;border:1px solid var(--borde,#2a3140);border-radius:8px;padding:7px}
  .escForm label.chk{display:flex;gap:8px;align-items:center;color:inherit;margin-top:10px}.escForm label.chk input{width:auto}
  .imgPreg{margin:6px 0}.imgPreg img,.imgEx{display:block;max-width:100%;max-height:320px;border-radius:8px;margin:6px 0;background:#fff}
  .respTxt{white-space:pre-wrap;background:var(--panel,#10131b);border:1px solid var(--borde,#2a3140);border-radius:8px;padding:8px 10px;margin:6px 0;font-size:14px}
  .respEx{border-radius:12px}.respEx>summary{list-style:none}.respEx>summary::-webkit-details-marker{display:none}.respEx[open]>summary{border-bottom-left-radius:0;border-bottom-right-radius:0}.revAb{border:1px solid var(--borde,#2a3140);border-top:0;border-radius:0 0 12px 12px;padding:4px 12px 12px}
  .relojEx{position:sticky;top:0;z-index:2;background:#0b1220;color:#e8f6ff;border:1px solid #19c8ff;border-radius:999px;padding:6px 14px;font:700 14px Inter,sans-serif;width:max-content;margin:0 0 8px auto}.relojEx.poco{border-color:#ef4444;color:#fecaca;background:#450a0a}
  .relojIntro{display:flex;flex-direction:column;gap:4px;border:1px solid var(--borde,#2a3140);border-left:4px solid #19c8ff;border-radius:10px;padding:12px 14px;margin:10px 0;font-size:14px}.relojIntro b{font-size:17px}
  .i-duda{background:#fef9c3;color:#854d0e}
  .cal{margin:6px 0 10px}.calCab{display:flex;align-items:center;gap:8px;margin-bottom:8px}.calCab b{flex:1;text-align:center;font:700 16px Poppins,Inter,sans-serif}.calCab .pb{padding:4px 12px;min-height:0}
  .calGrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}.calDia{min-height:64px;border:1px solid var(--borde,#2a3140);border-radius:8px;padding:3px;background:var(--panel2,#151821);font-size:11px;overflow:hidden;cursor:pointer;color:inherit;text-align:left;font-family:inherit;display:flex;flex-direction:column;gap:2px}
  .calDia.fuera{opacity:.35}.calDia.hoy{border-color:var(--neon,#19c8ff);box-shadow:inset 0 0 0 1px var(--neon,#19c8ff)}.calDia.sel{background:rgba(25,200,255,.12)}.calDia .n{font-weight:700;font-size:12px}.calSem{font-size:11px;text-align:center;color:var(--suave,#9ca3af);padding:2px 0}
  .calEv{display:block;border-radius:4px;padding:1px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10.5px;line-height:1.35}.ce-act{background:#dbeafe;color:#1e3a8a}.ce-ex{background:#ede9fe;color:#5b21b6}.ce-ev{background:#fef3c7;color:#92400e}
  .calLeyenda{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;margin:6px 0}.calLeyenda span{display:inline-flex;align-items:center;gap:4px}.calLeyenda i{width:10px;height:10px;border-radius:3px;display:inline-block}
  @media (max-width:560px){.calDia{min-height:46px}.calEv{font-size:0;height:6px;padding:0}.calDia .n{font-size:11px}}
  .lista{display:flex;flex-direction:column;gap:6px;margin:8px 0}.filaLista{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--borde,#2a3140);border-radius:10px;background:var(--panel2,#151821);flex-wrap:wrap}
  .filaLista .t{flex:1;min-width:140px}.estados{display:flex;gap:3px}.estados button{border:1px solid var(--borde,#2a3140);background:var(--panel,#10131b);color:inherit;border-radius:8px;padding:6px 10px;font:700 13px Inter,sans-serif;cursor:pointer;min-width:38px}
  .estados button.on[data-v=P]{background:#16a34a;border-color:#16a34a;color:#fff}.estados button.on[data-v=F]{background:#dc2626;border-color:#dc2626;color:#fff}.estados button.on[data-v=R]{background:#d97706;border-color:#d97706;color:#fff}.estados button.on[data-v=J]{background:#2563eb;border-color:#2563eb;color:#fff}
  .tablaAs{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0}.tablaAs th,.tablaAs td{padding:6px 8px;border-bottom:1px solid var(--borde,#2a3140);text-align:center}.tablaAs th:first-child,.tablaAs td:first-child{text-align:left}
  .chipsDias{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.chipsDias .pb{padding:4px 10px;min-height:0;font-size:12px}.chipsDias .pb.on{border-color:var(--neon,#19c8ff);color:var(--neon,#19c8ff)}
  .hilo{display:flex;flex-direction:column;gap:6px;max-height:340px;overflow:auto;padding:4px 2px;margin:6px 0}.msj{max-width:85%;border-radius:12px;padding:8px 11px;background:var(--panel2,#151821);border:1px solid var(--borde,#2a3140);white-space:pre-wrap;font-size:14px;align-self:flex-start}
  .msj.mio{align-self:flex-end;background:rgba(25,200,255,.12);border-color:rgba(25,200,255,.45)}.msj b{display:block;font-size:12px;margin-bottom:2px}.msj small{display:block;color:var(--suave,#9ca3af);font-size:11px;margin-top:3px}
  .miAsis{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:13px;margin:8px 0}
  .miFinal{display:flex;gap:14px;align-items:center;flex-wrap:wrap;border:1px solid var(--borde,#2a3140);border-radius:12px;padding:10px 14px;margin:8px 0;background:var(--panel2,#151821);font-size:13px}.miFinal div{display:flex;flex-direction:column}.miFinal div b{font:800 28px/1 Poppins,sans-serif;color:var(--neon,#19c8ff)}.miFinal small{color:var(--suave,#9ca3af)}.miFinal span{flex:1;min-width:200px}`;
  document.head.appendChild(st);
  const cuerpo = () => $e('escCuerpo');
  let pila = [];                           // para el botón «atrás»
  function ver(titulo, fn, sinPila){
    if (ver.limpiar){ try { ver.limpiar(); } catch (e) {} ver.limpiar = null; }
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
      <p class="hint">Para usarlo, entra con tu cuenta de Google.</p><button class="bigbtn" id="escEntrar" style="text-align:center;font-weight:700">Entrar con Google</button>${window.legalEntrar ? legalEntrar() : ''}`;
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
      if (g.rol === 'maestro' && g.existe && !g.archivado) g.dudas = await dudasSinResponder(g.id).catch(() => 0);
    }));
    const item = g => `<button class="escItem" data-g="${esc(g.id)}"><span class="t"><b>${esc(g.nombre)}</b><small>${g.rol === 'maestro' ? 'Código: ' + esc(g.codigo || '') : 'Maestro(a): ' + esc(g.maestroNombre || '')}</small></span>
        ${g.dudas ? `<span class="insig i-duda">💬 ${g.dudas} pregunta${g.dudas > 1 ? 's' : ''}</span>` : ''}${g.avisos ? `<span class="insig i-nuevo">📢 ${g.avisos} aviso${g.avisos > 1 ? 's' : ''}</span>` : ''}${g.pend && g.pend.pronto ? `<span class="insig i-tarde">⏰ ${g.pend.pronto} vence${g.pend.pronto > 1 ? 'n' : ''} pronto</span>` : g.pend && g.pend.n ? `<span class="insig i-pend">${g.pend.n} pendiente${g.pend.n > 1 ? 's' : ''}</span>` : ''}
        <span class="insig ${g.rol === 'maestro' ? 'i-maestro' : 'i-alumno'}">${g.rol === 'maestro' ? (g.aux ? 'Auxiliar' : 'Maestro') : 'Alumno'}</span></button>`;
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
      <p class="hint">Al crearlo te damos un código de 6 letras para que tus alumnos se unan.</p>
      <p class="hint">Si tus alumnos son menores de edad, verifica que tu escuela cuente con la autorización de sus madres, padres o tutores para usar herramientas en línea.</p><button class="btnP" id="escCrearOk">Crear grupo</button></div>`;
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
      <p class="hint">Al unirte, tu maestro verá tu nombre, tu correo y tu foto de Google, tus entregas y tus respuestas. <a href="https://gamerpc.github.io/disenador/privacidad.html#menores" target="_blank" rel="noopener">Aviso de privacidad</a>.</p>
      <label style="display:flex;gap:8px;align-items:center;color:inherit"><input type="checkbox" id="escComoAux" style="width:auto"> Soy maestro(a) auxiliar o adjunto de este grupo</label>
      <p class="hint" id="escAuxNota" hidden style="padding-top:0">El maestro titular recibe tu solicitud y te aprueba. Después podrás publicar, calificar, corregir y pasar lista en el grupo.</p>
      <button class="btnP" id="escUnirOk" style="margin-top:10px">Unirme</button></div>`;
    $e('escCodigo').focus();
    $e('escComoAux').onchange = e => { $e('escAuxNota').hidden = !e.target.checked; };
    $e('escUnirOk').onclick = async () => {
      const codigo = $e('escCodigo').value.trim().toUpperCase(); if (codigo.length !== 6) return toast('El código tiene 6 letras o números');
      cargando(true);
      try {
        const d = (await grupos().where('codigo', '==', codigo).get()).docs[0];
        if (!d) throw new Error('No encontré un grupo con ese código. Revísalo con tu maestro.');
        const g = d.data(), u = N.usuario, ahora = N.ahora();
        if (g.maestro === u.uid) throw new Error('Tú eres el maestro de este grupo');
        if ($e('escComoAux').checked){
          await grupos().doc(d.id).collection('auxSolicitudes').doc(u.uid).set({ nombre:u.displayName || u.email || 'Maestro(a)', correo:u.email || '', fecha:ahora });
          await misGrupos().doc(d.id).set({ nombre:g.nombre, codigo:g.codigo, rol:'maestro', aux:true, maestroNombre:g.maestroNombre || '', unido:ahora });
          avisarA([g.maestro], { tipo:'aux', grupo:d.id, grupoNombre:g.nombre, texto:(u.displayName || 'Alguien') + ' pidió ser maestro(a) auxiliar de «' + g.nombre + '»' });
          toast('Solicitud enviada. Cuando el maestro titular te apruebe, verás el grupo completo.');
          pila = [['🎓 Mi escuela', inicio]]; ver(g.nombre, () => grupoMaestro(d.id), true); $e('escAtras').hidden = false; return;
        }
        await grupos().doc(d.id).collection('miembros').doc(u.uid).set({ nombre:u.displayName || u.email || 'Alumno', correo:u.email || '', foto:u.photoURL || '', unido:ahora });
        await misGrupos().doc(d.id).set({ nombre:g.nombre, rol:'alumno', maestroNombre:g.maestroNombre || '', unido:ahora });
        toast('¡Listo! Ya estás en «' + g.nombre + '».');
        pila = [['🎓 Mi escuela', inicio]]; ver(g.nombre, () => grupoAlumno(d.id), true); $e('escAtras').hidden = false;
      } catch (e) { toast(e.message); } finally { cargando(false); }
    };
  }

  // ---------- maestro ----------
  async function grupoMaestro(gid){
    const gref = grupos().doc(gid), g = (await gref.get()).data(), titular = esTitular(g);
    if (!titular && !(g.auxiliares || []).includes(N.usuario.uid)){
      const sol = await gref.collection('auxSolicitudes').doc(N.usuario.uid).get().catch(() => null);
      cuerpo().innerHTML = sol && sol.exists ? `<p class="hint" style="padding-top:0">⏳ Pediste ser maestro(a) auxiliar de este grupo. En cuanto ${esc(g.maestroNombre || 'el maestro titular')} te apruebe, aquí verás todo.</p><button class="pb" id="escCancelarAux">Cancelar mi solicitud</button>`
        : '<p class="hint" style="padding-top:0">Ya no eres maestro(a) auxiliar de este grupo.</p><button class="pb" id="escCancelarAux">Quitarlo de mi lista</button>';
      $e('escCancelarAux').onclick = async () => { await gref.collection('auxSolicitudes').doc(N.usuario.uid).delete().catch(() => {}); await misGrupos().doc(gid).delete().catch(() => {}); $e('escAtras').click(); };
      return;
    }
    const [miembros, acts, exs, avs, sols] = await Promise.all([miembrosDe(gid, true), gref.collection('actividades').get(), gref.collection('examenes').get().catch(sinPermiso), gref.collection('avisos').get().catch(sinPermiso), titular ? gref.collection('auxSolicitudes').get().catch(sinPermiso) : sinPermiso()]);
    const solicitudes = sols.docs.map(d => ({ id:d.id, ...d.data() }));
    const lista = acts.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.creada || '').localeCompare(a.creada || ''));
    const examenes = exs.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.creado || '').localeCompare(a.creado || ''));
    const avisos = avs.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    // cuántos entregaron: de lo que ya cerró se guarda el conteo en la propia actividad (así no se vuelve a leer cada vez)
    const cerrado = o => vencida(o.limite) && o.conteo && (o.conteo.fecha || '') > o.limite + 'T23:59:59';
    const contar = async (o, col, tipo) => {
      if (cerrado(o)) return o.conteo;
      const c = await memo('cnt:' + gid + ':' + o.id, 3 * MIN, async () => { const docs = (await col.get()).docs; return { n:docs.length, kb:docs.reduce((t, d) => t + (d.data().tamKB || 0), 0), fecha:N.ahora() }; });
      if (vencida(o.limite)) gref.collection(tipo).doc(o.id).update({ conteo:c }).catch(() => {});
      return c;
    };
    await Promise.all(lista.map(async a => { const r = gref.collection('actividades').doc(a.id);
      const [c, du] = await Promise.all([contar(a, r.collection('entregas'), 'actividades'), memo('dudas:' + gid + ':' + a.id, 2 * MIN, () => r.collection('dudas').where('pendienteMaestro', '==', true).get().then(x => x.size).catch(() => 0))]);
      a.entregas = c.n; a.kb = c.kb || 0; a.dudas = du; }));
    await Promise.all(examenes.map(async x => { x.resp = (await contar(x, gref.collection('examenes').doc(x.id).collection('respuestas'), 'examenes')).n; }));
    const mbNube = lista.reduce((t, a) => t + (a.kb || 0), 0) / 1024;
    const enlace = location.origin + location.pathname + '?grupo=' + g.codigo;
    cuerpo().innerHTML = `<p class="hint" style="padding-top:0">Código para tus alumnos:</p><div class="codigoGrande">${esc(g.codigo)}</div>
      ${g.archivado ? '<p class="hint"><span class="insig i-pend">🗄 Grupo archivado</span> Los alumnos lo ven en «archivados» y ya no reciben actividades nuevas.</p>' : ''}
      <div class="grupoBtns"><button class="pb" id="escCopiar">🔗 Copiar enlace para unirse</button><button class="pb" id="escNuevaAct">＋ Nueva actividad con el diseño actual</button>
        <button class="pb" id="escNuevoEx">📝 Nuevo examen</button><button class="pb" id="escCalendario">📅 Calendario</button><button class="pb" id="escLista">✅ Pase de lista</button>${titular ? `<button class="pb" id="escPond">⚖ Ponderación${g.ponderacion ? ' ✓' : ''}</button>` : ''}<button class="pb" id="escCalif">⬇ Calificaciones (Excel)</button><button class="pb" id="escRespaldo">📦 Respaldo</button>${titular ? `<button class="pb" id="escArchivar">${g.archivado ? '♻ Reactivar grupo' : '🗄 Archivar grupo'}</button>` : ''}</div>
      ${mbNube >= 1 ? `<p class="hint" style="padding-top:0">☁ Los trabajos de este grupo ocupan unos <b>${mbNube.toFixed(0)} MB</b> en la nube${mbNube > 150 ? ' · al cerrar el semestre descarga el <b>📦 Respaldo</b> y libera espacio' : ''}.</p>` : ''}
      ${titular ? '' : `<p class="hint" style="padding-top:0"><span class="insig i-maestro">Auxiliar</span> Maestro(a) titular: ${esc(g.maestroNombre || '')}</p>`}
      <h4>Actividades</h4><div class="escLista">${lista.length ? lista.map(a => `<button class="escItem" data-a="${esc(a.id)}"><span class="t"><b>${esc(a.titulo)}</b><small>${a.limite ? 'Entrega: ' + fecha(a.limite) : 'Sin fecha límite'}</small></span>${a.dudas ? `<span class="insig i-duda">💬 ${a.dudas}</span>` : ''}<span class="insig i-cal">${a.entregas || 0} de ${miembros.size}</span></button>`).join('')
        : '<p class="hint">Aún no hay actividades. Abre o diseña la plantilla que usarán tus alumnos y pulsa «Nueva actividad».</p>'}</div>
      <h4>Exámenes</h4><div class="escLista">${examenes.length ? examenes.map(x => `<button class="escItem" data-x="${esc(x.id)}"><span class="t"><b>📝 ${esc(x.titulo)}</b><small>${x.preguntas.length} pregunta${x.preguntas.length > 1 ? 's' : ''}${x.limite ? ' · hasta ' + fecha(x.limite) : ''}</small></span><span class="insig i-cal">${x.resp || 0} de ${miembros.size}</span></button>`).join('')
        : '<p class="hint">Sin exámenes. Crea uno de opción múltiple: se califica solo.</p>'}</div>
      <h4>📢 Avisos para el grupo</h4>
      <div class="escForm"><textarea id="escAvisoTxt" rows="2" maxlength="1500" placeholder="Escribe un aviso: cambio de fecha, material para la clase, recordatorios…"></textarea><button class="pb" id="escAvisoOk" style="margin-top:6px">📢 Publicar aviso</button></div>
      ${avisos.map(v => `<div class="avisoEsc2"><button class="pb" data-borrarav="${esc(v.id)}" title="Borrar aviso" aria-label="Borrar aviso">✕</button>${esc(v.texto)}<small>${fechaHora(v.fecha)}</small></div>`).join('')}
      ${titular ? `<h4>👥 Maestros auxiliares</h4><div class="escLista">${(g.auxiliares || []).map(u => `<div class="escItem" style="cursor:default"><span class="t"><b>${esc((g.auxNombres || {})[u] || 'Maestro(a)')}</b><small>Puede publicar, calificar, corregir y pasar lista</small></span><button class="pb" data-quitaraux="${esc(u)}">Quitar</button></div>`).join('')}
        ${solicitudes.map(x => `<div class="escItem" style="cursor:default"><span class="t"><b>${esc(x.nombre)}</b><small>${esc(x.correo || '')} · pidió ser auxiliar</small></span><button class="btnP" data-aprobaraux="${esc(x.id)}">Aprobar</button><button class="pb" data-rechazaraux="${esc(x.id)}">Rechazar</button></div>`).join('')}
        ${!(g.auxiliares || []).length && !solicitudes.length ? '<p class="hint" style="padding-top:0">¿Das la materia con alguien más? Comparte el código: al unirse marca «Soy maestro(a) auxiliar» y aquí lo apruebas.</p>' : ''}</div>` : ''}
      <h4>Alumnos (${miembros.size})</h4>${miembros.size ? `<div class="alumnos">${miembros.docs.map(m => `<span class="alumno">${esc(m.data().nombre)}<small>${esc(m.data().correo || '')}</small><button class="pb" data-sacar="${esc(m.id)}" title="Sacar del grupo" aria-label="Sacar a ${esc(m.data().nombre)} del grupo">✕</button></span>`).join('')}</div>` : '<p class="hint" style="padding-top:0">Todavía no se une nadie.</p>'}`;
    $e('escCalif').onclick = () => descargarCalificaciones(gid, g, miembros, lista);
    $e('escRespaldo').onclick = () => ver('📦 Respaldo · ' + g.nombre, () => panelRespaldo(gid, g, miembros, lista));
    if ($e('escPond')) $e('escPond').onclick = () => ver('⚖ Ponderación · ' + g.nombre, () => formPonderacion(gid, g));
    $e('escCalendario').onclick = () => ver('📅 Calendario · ' + g.nombre, () => calendario(gid, true));
    $e('escLista').onclick = () => ver('✅ Pase de lista · ' + g.nombre, () => paseDeLista(gid));
    if ($e('escArchivar')) $e('escArchivar').onclick = async () => {
      const v = !g.archivado;
      if (v && !confirm('¿Archivar «' + g.nombre + '»? Se guarda todo; solo deja de aparecer entre los grupos activos.')) return;
      try { await gref.update({ archivado:v }); await misGrupos().doc(gid).update({ archivado:v }).catch(() => {}); toast(v ? 'Grupo archivado' : 'Grupo reactivado'); ver(g.nombre, () => grupoMaestro(gid), true); }
      catch (e) { toast('No se pudo: ' + e.message); }
    };
    const recargar = () => ver(g.nombre, () => grupoMaestro(gid), true);
    cuerpo().querySelectorAll('[data-aprobaraux]').forEach(b => b.onclick = async () => {
      const x = solicitudes.find(y => y.id === b.dataset.aprobaraux);
      try { await gref.update({ auxiliares:[...new Set([...(g.auxiliares || []), x.id])], auxNombres:{ ...(g.auxNombres || {}), [x.id]:x.nombre } });
        await gref.collection('auxSolicitudes').doc(x.id).delete().catch(() => {});
        avisarA([x.id], { tipo:'aux', grupo:gid, grupoNombre:g.nombre, texto:'Ya eres maestro(a) auxiliar de «' + g.nombre + '»' });
        toast('👥 ' + x.nombre + ' ya es maestro(a) auxiliar'); recargar(); } catch (e) { toast('No se pudo: ' + e.message); }
    });
    cuerpo().querySelectorAll('[data-rechazaraux]').forEach(b => b.onclick = async () => { try { await gref.collection('auxSolicitudes').doc(b.dataset.rechazaraux).delete(); recargar(); } catch (e) { toast('No se pudo: ' + e.message); } });
    cuerpo().querySelectorAll('[data-quitaraux]').forEach(b => b.onclick = async () => {
      const u = b.dataset.quitaraux; if (!confirm('¿Quitar a ' + ((g.auxNombres || {})[u] || 'este maestro') + ' como auxiliar?')) return;
      const nombres = { ...(g.auxNombres || {}) }; delete nombres[u];
      try { await gref.update({ auxiliares:(g.auxiliares || []).filter(x => x !== u), auxNombres:nombres }); recargar(); } catch (e) { toast('No se pudo: ' + e.message); }
    });
    cuerpo().querySelectorAll('[data-sacar]').forEach(b => b.onclick = async () => {
      const m = miembros.docs.find(x => x.id === b.dataset.sacar);
      if (!confirm('¿Sacar a ' + m.data().nombre + ' del grupo? Sus entregas se conservan.')) return;
      try { await gref.collection('miembros').doc(m.id).delete(); olvidar('miembros:'); toast(m.data().nombre + ' ya no está en el grupo'); ver(g.nombre, () => grupoMaestro(gid), true); }
      catch (e) { toast('No se pudo: ' + e.message); }
    });
    $e('escCopiar').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(enlace) : Promise.reject()).then(() => toast('Enlace copiado: ' + enlace), () => prompt('Copia este enlace:', enlace)); };
    $e('escNuevaAct').onclick = () => ver('Nueva actividad', () => formActividad(gid));
    $e('escNuevoEx').onclick = () => ver('Nuevo examen', () => formExamen(gid));
    cuerpo().querySelectorAll('[data-x]').forEach(b => b.onclick = () => { const x = examenes.find(y => y.id === b.dataset.x); ver('📝 ' + x.titulo, () => examenMaestro(gid, x.id)); });
    $e('escAvisoOk').onclick = async () => {
      const texto = $e('escAvisoTxt').value.trim(); if (!texto) return toast('Escribe el aviso');
      olvidar('dudas'); try { await gref.collection('avisos').doc().set({ texto, fecha:N.ahora(), autor:N.usuario.displayName || '' }); avisarAlGrupo(gid, { tipo:'aviso', texto:'📢 ' + texto }); toast('📢 Aviso publicado: tus alumnos lo verán al entrar'); ver(g.nombre, () => grupoMaestro(gid), true); }
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
        avisarAlGrupo(gid, { tipo:'actividad', act:ref.id, texto:'📄 Nueva actividad: ' + titulo + ($e('escLim').value ? ' (entrega: ' + fecha($e('escLim').value) + ')' : '') });
        toast('Actividad publicada. Tus alumnos ya la ven en «Mi escuela».');
        $e('escAtras').click();
      } catch (e) { toast('No se pudo publicar: ' + e.message); } finally { cargando(false); }
    };
  }
  async function actividadMaestro(gid, aid){
    const gref = grupos().doc(gid), aref = gref.collection('actividades').doc(aid);
    const [a, ents, miembros, dds] = await Promise.all([aref.get(), aref.collection('entregas').get(), miembrosDe(gid), aref.collection('dudas').get().catch(sinPermiso)]);
    const dudas = dds.docs.map(d => ({ id:d.id, ...d.data() })).sort((x, y) => (y.pendienteMaestro ? 1 : 0) - (x.pendienteMaestro ? 1 : 0) || (y.ultimo || '').localeCompare(x.ultimo || ''));
    const act = a.data(), lista = ents.docs.map(d => ({ id:d.id, ...d.data() })).sort((x, y) => (x.nombre || '').localeCompare(y.nombre || ''));
    if (vencida(act.limite)) aref.update({ conteo:{ n:ents.docs.length, kb:ents.docs.reduce((t, d) => t + (d.data().tamKB || 0), 0), fecha:N.ahora() } }).catch(() => {});   // el grupo usa este conteo sin volver a leer
    const faltan = miembros.docs.filter(m => !lista.some(e => e.id === m.id)).map(m => m.data().nombre);
    cuerpo().innerHTML = `${act.instrucciones ? `<p class="hint" style="padding-top:0;white-space:pre-wrap">${esc(act.instrucciones)}</p>` : ''}
      <p class="hint">${act.limite ? 'Fecha límite: <b>' + fecha(act.limite) + '</b> · ' : ''}${lista.length} entrega${lista.length === 1 ? '' : 's'}</p>
      <div class="grupoBtns"><button class="pb" id="escVerPlantilla">👁 Abrir la plantilla</button><button class="pb peligro" id="escBorrarAct">🗑 Borrar actividad</button></div>
      <div class="gridEntregas">${lista.map(e => `<div class="entrega" data-e="${esc(e.id)}">${e.mini ? `<img alt="" src="${e.mini}">` : '<div class="sinMini">📦</div>'}<div class="pie"><b>${esc(e.nombre)}</b>
        <small class="hint" style="padding:0">${fechaHora(e.fecha)}${act.limite && e.fecha > act.limite + 'T23:59:59' ? ' · <span class="insig i-tarde">Tarde</span>' : ''}</small>
        <div class="fila" style="margin-top:4px">${e.devuelta ? '<span class="insig i-dev">↩ Devuelta</span>' : e.devueltaFecha && e.fecha > e.devueltaFecha ? '<span class="insig i-ok">✓ La corrigió</span>' : ''}${e.corregida ? '<span class="insig i-corr">✏ Con correcciones</span>' : ''}</div>
        ${act.rubrica ? `<div class="rub">${act.rubrica.map((k, i) => `<label>${esc(k.c)} <span>/ ${k.p}</span><input type="number" min="0" max="${k.p}" step="0.5" data-k="${i}" value="${e.rubrica && e.rubrica[i] != null ? e.rubrica[i] : ''}"></label>`).join('')}<b class="totRub">Total: ${e.calificacion ?? '—'} / ${maxRub(act)}</b></div>` : ''}
        ${e.ligero ? '<div class="fila"><span class="insig i-cal">📦 El trabajo está en el respaldo</span></div>' : ''}<div class="fila"${e.ligero ? ' style="display:none"' : ''}><button class="pb" data-corr title="Abre la entrega para marcar, encerrar y comentar encima">✏ Corregir</button><button class="pb" data-dev title="Pedir al alumno que la corrija y la vuelva a entregar">↩ Devolver</button></div>
        <div class="fila"><button class="pb" data-abrir${e.ligero ? ' style="display:none"' : ''}>Abrir</button>${act.rubrica ? '' : `<input type="number" min="0" max="10" step="0.1" placeholder="Cal." value="${e.calificacion ?? ''}" aria-label="Calificación">`}<button class="pb" data-cal>Guardar</button></div>
        <textarea rows="2" placeholder="Comentario para el alumno" style="width:100%;margin-top:6px;box-sizing:border-box" aria-label="Comentario">${esc(e.comentario || '')}</textarea></div></div>`).join('')}</div>
      ${faltan.length ? `<p class="hint">Sin entregar: ${faltan.map(esc).join(' · ')}</p>` : ''}
      <h4>💬 Preguntas de tus alumnos</h4>${dudas.length ? `<div class="escLista">${dudas.map(d => `<button class="escItem" data-duda="${esc(d.id)}"><span class="t"><b>${esc(d.nombre || 'Alumno')}</b><small>${esc(d.ultimoTexto || '')}</small><small>${fechaHora(d.ultimo)}</small></span>${d.pendienteMaestro ? '<span class="insig i-duda">Sin responder</span>' : '<span class="insig i-ok">Respondida</span>'}</button>`).join('')}</div>`
        : '<p class="hint" style="padding-top:0">Nadie ha preguntado nada. Si un alumno tiene una duda sobre esta actividad, aquí la verás y podrás contestarle.</p>'}`;
    cuerpo().querySelectorAll('[data-duda]').forEach(b => b.onclick = () => { const d = dudas.find(x => x.id === b.dataset.duda); ver('💬 ' + (d.nombre || 'Alumno') + ' · ' + act.titulo, () => { cuerpo().innerHTML = '<div id="escHilo"></div>'; hiloDudas($e('escHilo'), gid, aid, d.id, true, d.nombre || 'Alumno'); }); });
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
        try { await eref.update({ devuelta:true, devueltaMsg:msg.trim(), devueltaFecha:N.ahora() }); avisarAlAlumno(gid, e.id, { tipo:'devuelta', act:aid, texto:'↩ Tu maestro te devolvió «' + act.titulo + '» para corregirla' }); toast('↩ Devuelta a ' + e.nombre); ver(act.titulo, () => actividadMaestro(gid, aid), true); }
        catch (er) { toast('No se pudo devolver: ' + er.message); }
      };
      const ins = [...div.querySelectorAll('[data-k]')];
      const sumar = () => ins.every(i => i.value === '') ? null : ins.reduce((s, i) => s + Math.max(0, Math.min(+i.max, +i.value || 0)), 0);
      ins.forEach(i => i.oninput = () => { const t = sumar(); div.querySelector('.totRub').textContent = 'Total: ' + (t == null ? '—' : t) + ' / ' + maxRub(act); });
      div.querySelector('[data-cal]').onclick = async () => {
        let cal, rub = null;
        if (act.rubrica){ rub = ins.map(i => i.value === '' ? null : Math.max(0, Math.min(+i.max, +i.value))); cal = sumar(); }
        else { const v = div.querySelector('.fila input').value; cal = v === '' ? null : Math.max(0, Math.min(10, +v)); }
        try { await eref.update({ calificacion:cal, rubrica:rub, comentario:div.querySelector('textarea').value.trim(), calificada:N.ahora() }); if (cal != null && cal !== e.calificacion) avisarAlAlumno(gid, e.id, { tipo:'calificacion', act:aid, texto:'✅ Ya tienes calificación en «' + act.titulo + '»: ' + cal }); e.calificacion = cal; e.rubrica = rub; toast('Calificación guardada para ' + e.nombre); }
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

  // ---------- exámenes ----------
  // examenes/{x}: preguntas (sin respuestas) · claves/{x}: respuestas correctas (solo el maestro; el alumno al terminar si así se eligió)
  // examenes/{x}/respuestas/{alumno}: lo que contestó (no se puede cambiar) · la calificación y los puntos de las abiertas los pone el maestro
  // examenes/{x}/inicios/{alumno}: a qué hora empezó (para el tiempo límite)
  // tipos de pregunta: 'opcion' (clave = número de la opción) o 'abierta' (el alumno escribe; el maestro le pone puntos)
  const ptsDe = q => +q.pts > 0 ? +q.pts : 1;
  const esAbierta = q => q.tipo === 'abierta';
  function calExamen(ex, r, clave){
    let total = 0, got = 0, b = 0, t = 0, pend = 0; const ab = (r && r.abiertas) || {}, resp = (r && r.resp) || [];
    ex.preguntas.forEach((q, i) => { const p = ptsDe(q); total += p;
      if (esAbierta(q)){ if (ab[i] == null || ab[i] === '') pend++; else got += Math.max(0, Math.min(p, +ab[i])); }
      else { t++; if (clave && resp[i] === clave[i]){ b++; got += p; } } });
    return { b, t, pts:Math.round(got * 100) / 100, total, pend, cal:Math.round(got / Math.max(1, total) * 100) / 10 };
  }
  // orden al azar, pero siempre el mismo para cada alumno (si recarga la página no cambia)
  function azar(sem){ let h = 1779033703 ^ sem.length; for (let i = 0; i < sem.length; i++){ h = Math.imul(h ^ sem.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
  const barajar = (n, rnd) => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function imagenChica(file){
    return new Promise((ok, mal) => { const im = new Image();
      im.onload = () => { const k = Math.min(1, 900 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        let q = 0.8, u = c.toDataURL('image/jpeg', q); while (u.length > 150000 && q > 0.35){ q -= 0.1; u = c.toDataURL('image/jpeg', q); }
        URL.revokeObjectURL(im.src); ok(u); };
      im.onerror = () => mal(new Error('No se pudo leer la imagen')); im.src = URL.createObjectURL(file); });
  }
  function formExamen(gid){
    cuerpo().innerHTML = `<div class="escForm"><label for="exTit">Título</label><input id="exTit" class="buscador" maxlength="100" placeholder="Ej. Examen parcial · Unidad 2">
      <label for="exInst">Instrucciones (opcional)</label><textarea id="exInst" rows="2" maxlength="1000" placeholder="Ej. Elige la respuesta correcta. Tienes una sola oportunidad."></textarea>
      <div class="filaPreg"><label>Fecha límite (opcional)<input id="exLim" type="date"></label><label>⏱ Tiempo para contestar<span style="display:flex;gap:6px;align-items:center"><input id="exTiempo" type="number" min="0" max="300" step="5" value="0" style="width:80px"> minutos (0 = sin límite)</span></label></div>
      <label class="chk"><input type="checkbox" id="exMostrar" checked> Al terminar, el alumno ve su calificación y las respuestas correctas</label>
      <label class="chk"><input type="checkbox" id="exMezclar"> 🔀 Cambiar el orden de las preguntas y de las opciones para cada alumno</label>
      <div id="exPregs"></div><div class="grupoBtns"><button class="pb" id="exMas">＋ Pregunta de opción múltiple</button><button class="pb" id="exMasAb">＋ Pregunta abierta</button></div>
      <p class="hint">En opción múltiple marca con el círculo la respuesta correcta; esas se califican solas. Las abiertas las calificas tú al revisar. Cada pregunta vale los puntos que pongas y la calificación es sobre 10.</p>
      <button class="btnP" id="exOk">Publicar examen</button></div>`;
    const caja = $e('exPregs');
    const renumerar = () => [...caja.children].forEach((x, i) => x.querySelector('.nP').textContent = i + 1);
    const pregunta = (txt = '', ops = ['', '', '', ''], ok = 0, tipo = 'opcion') => {
      const d = document.createElement('div'); d.className = 'pregEx'; d.dataset.img = '';
      const n = caja.children.length + 1, nom = 'exok' + Math.random().toString(36).slice(2, 7);
      d.innerHTML = `<b>Pregunta <span class="nP">${n}</span> <button class="pb" data-q style="float:right;padding:2px 8px;min-height:0" aria-label="Quitar pregunta">✕</button></b>
        <div class="filaPreg"><select data-tipo aria-label="Tipo de pregunta"><option value="opcion">Opción múltiple</option><option value="abierta">Respuesta abierta (la calificas tú)</option></select>
          <label style="flex-direction:row;align-items:center;gap:6px">Puntos <input type="number" data-pts min="0.5" max="100" step="0.5" value="1" style="width:70px"></label>
          <button class="pb" data-img>🖼 Imagen</button><input type="file" accept="image/*" hidden></div>
        <textarea rows="2" maxlength="600" placeholder="Escribe la pregunta" style="width:100%;box-sizing:border-box">${esc(txt)}</textarea>
        <div class="imgPreg" hidden><img alt=""><button class="pb" data-quitarimg>✕ Quitar imagen</button></div>
        <div class="ops"></div><button class="pb" data-mas style="margin-top:4px">＋ Opción</button><p class="hint notaAb" hidden style="padding:4px 0 0">El alumno escribe su respuesta. Tú le pones los puntos al revisar el examen.</p>`;
      const opsDiv = d.querySelector('.ops'), sel = d.querySelector('[data-tipo]'), file = d.querySelector('input[type=file]');
      const opcion = (t, marcada) => {
        if (opsDiv.children.length >= 6) return toast('Máximo 6 opciones');
        const o = document.createElement('div'); o.className = 'opEx';
        o.innerHTML = `<input type="radio" name="${nom}" ${marcada ? 'checked' : ''} aria-label="Respuesta correcta"><input type="text" class="buscador" maxlength="200" placeholder="Opción" value="${esc(t)}"><button class="pb" aria-label="Quitar opción" style="padding:4px 8px;min-height:0">✕</button>`;
        o.querySelector('button').onclick = () => { if (opsDiv.children.length > 2) o.remove(); else toast('Cada pregunta necesita al menos 2 opciones'); };
        opsDiv.appendChild(o);
      };
      ops.forEach((t, i) => opcion(t, i === ok));
      const ponerTipo = v => { sel.value = v; const ab = v === 'abierta'; opsDiv.hidden = ab; d.querySelector('[data-mas]').hidden = ab; d.querySelector('.notaAb').hidden = !ab; };
      sel.onchange = () => ponerTipo(sel.value); ponerTipo(tipo);
      d.querySelector('[data-mas]').onclick = () => opcion('', false);
      d.querySelector('[data-q]').onclick = () => { d.remove(); renumerar(); };
      d.querySelector('[data-img]').onclick = () => file.click();
      file.onchange = async () => { const f = file.files[0]; file.value = ''; if (!f) return;
        try { const u = await imagenChica(f); d.dataset.img = u; d.querySelector('.imgPreg img').src = u; d.querySelector('.imgPreg').hidden = false; } catch (e) { toast(e.message); } };
      d.querySelector('[data-quitarimg]').onclick = () => { d.dataset.img = ''; d.querySelector('.imgPreg').hidden = true; };
      caja.appendChild(d);
    };
    pregunta(); pregunta('', ['Verdadero', 'Falso'], 0);
    $e('exMas').onclick = () => pregunta();
    $e('exMasAb').onclick = () => pregunta('', ['', ''], 0, 'abierta');
    $e('exTit').focus();
    $e('exOk').onclick = async () => {
      const titulo = $e('exTit').value.trim(); if (!titulo) return toast('Escribe el título del examen');
      const preguntas = [], clave = [];
      for (const [i, d] of [...caja.children].entries()){
        const p = d.querySelector('textarea').value.trim(), tipo = d.querySelector('[data-tipo]').value, pts = Math.max(0.5, +d.querySelector('[data-pts]').value || 1);
        if (!p && !d.dataset.img) return toast('Falta escribir la pregunta ' + (i + 1));
        const q = { p, tipo, pts }; if (d.dataset.img) q.img = d.dataset.img;
        if (tipo === 'abierta'){ q.ops = []; preguntas.push(q); clave.push(null); continue; }
        const filas = [...d.querySelectorAll('.opEx')];
        const ops = filas.map(f => f.querySelector('input[type=text]').value.trim()), ok = filas.findIndex(f => f.querySelector('input[type=radio]').checked);
        if (ops.some(o => !o)) return toast('Hay una opción vacía en la pregunta ' + (i + 1));
        if (ok < 0) return toast('Marca la respuesta correcta de la pregunta ' + (i + 1));
        q.ops = ops; preguntas.push(q); clave.push(ok);
      }
      if (!preguntas.length) return toast('Agrega al menos una pregunta');
      if (JSON.stringify(preguntas).length > 900000) return toast('El examen pesa demasiado por las imágenes. Quita alguna o usa imágenes más sencillas.');
      cargando(true);
      try {
        const gref = grupos().doc(gid), ref = gref.collection('examenes').doc();
        await gref.collection('claves').doc(ref.id).set({ resp:clave });
        await ref.set({ titulo, instrucciones:$e('exInst').value.trim(), limite:$e('exLim').value || '', mostrarResultados:$e('exMostrar').checked,
          tiempo:Math.max(0, Math.min(300, Math.round(+$e('exTiempo').value || 0))), mezclar:$e('exMezclar').checked, preguntas, creado:N.ahora() });
        avisarAlGrupo(gid, { tipo:'examen', ex:ref.id, texto:'📝 Nuevo examen: ' + titulo });
        toast('📝 Examen publicado: tus alumnos ya lo ven en «Mi escuela».'); $e('escAtras').click();
      } catch (e) { toast('No se pudo publicar: ' + e.message); } finally { cargando(false); }
    };
  }
  const minutos = (a, b) => (new Date(b) - new Date(a)) / 60000;
  async function examenMaestro(gid, xid){
    const gref = grupos().doc(gid), xref = gref.collection('examenes').doc(xid);
    const [x, cl, rs, miembros] = await Promise.all([xref.get(), gref.collection('claves').doc(xid).get(), xref.collection('respuestas').get(), miembrosDe(gid)]);
    const ex = x.data(), clave = cl.exists ? cl.data().resp : [], lista = rs.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    const abiertas = ex.preguntas.map((q, i) => esAbierta(q) ? i : -1).filter(i => i >= 0);
    if (vencida(ex.limite)) xref.update({ conteo:{ n:lista.length, fecha:N.ahora() } }).catch(() => {});
    // la calificación se calcula aquí y se guarda (el alumno no puede escribirla); con abiertas sin revisar queda pendiente
    for (const r of lista){ const c = calExamen(ex, r, clave); r.c = c; const cal = c.pend ? null : c.cal;
      if ((r.calificacion ?? null) !== cal || r.aciertos !== c.b) await xref.collection('respuestas').doc(r.id).update({ calificacion:cal, aciertos:c.b }).catch(() => {}); }
    const faltan = miembros.docs.filter(m => !lista.some(r => r.id === m.id)).map(m => m.data().nombre);
    const listas = lista.filter(r => !r.c.pend), prom = listas.length ? (listas.reduce((s, r) => s + r.c.cal, 0) / listas.length).toFixed(1) : '—';
    const porRevisar = lista.filter(r => r.c.pend).length;
    const tarde = r => ex.tiempo && r.inicio && minutos(r.inicio, r.fecha) > ex.tiempo + 1;
    cuerpo().innerHTML = `${ex.instrucciones ? `<p class="hint" style="padding-top:0;white-space:pre-wrap">${esc(ex.instrucciones)}</p>` : ''}
      <p class="hint">${ex.limite ? 'Hasta el <b>' + fecha(ex.limite) + '</b> · ' : ''}${ex.tiempo ? '⏱ ' + ex.tiempo + ' min · ' : ''}${ex.mezclar ? '🔀 orden al azar · ' : ''}${lista.length} respuesta${lista.length === 1 ? '' : 's'} · Promedio: <b>${prom}</b>${porRevisar ? ` · <span class="insig i-pend">✏ ${porRevisar} por revisar</span>` : ''}</p>
      <div class="grupoBtns"><button class="pb peligro" id="exBorrar">🗑 Borrar examen</button></div>
      <h4>Calificaciones</h4><div class="escLista">${lista.map(r => `<details class="respEx" data-r="${esc(r.id)}"${r.c.pend && abiertas.length ? ' open' : ''}><summary class="escItem"><span class="t"><b>${esc(r.nombre)}</b><small>${fechaHora(r.fecha)}${r.inicio ? ' · tardó ' + Math.max(1, Math.round(minutos(r.inicio, r.fecha))) + ' min' : ''}${r.c.t ? ' · ' + r.c.b + ' de ' + r.c.t + ' correctas' : ''}${tarde(r) ? ' · <span class="insig i-tarde">fuera de tiempo</span>' : ''}</small></span>${r.c.pend ? `<span class="insig i-pend">✏ Por revisar (${r.c.pend})</span>` : `<span class="insig i-cal">${r.c.cal}</span>`}</summary>
        ${abiertas.length ? `<div class="revAb">${abiertas.map(i => `<div class="pregEx"><b>${i + 1}. ${esc(ex.preguntas[i].p)}</b><div class="respTxt">${esc((r.resp || [])[i] || '') || '<i>(sin respuesta)</i>'}</div>
          <label style="flex-direction:row;align-items:center;gap:6px;cursor:default">Puntos <input type="number" min="0" max="${ptsDe(ex.preguntas[i])}" step="0.5" data-ab="${i}" value="${(r.abiertas || {})[i] ?? ''}" style="width:70px"> / ${ptsDe(ex.preguntas[i])}</label></div>`).join('')}
          <button class="btnP" data-guardarab>💾 Guardar puntos</button></div>` : '<p class="hint" style="padding:6px 12px">Solo tiene preguntas de opción múltiple: se calificó sola.</p>'}</details>`).join('') || '<p class="hint">Nadie ha respondido todavía.</p>'}</div>
      ${faltan.length ? `<p class="hint">Sin responder: ${faltan.map(esc).join(' · ')}</p>` : ''}
      <h4>Cómo le fue al grupo en cada pregunta</h4>${ex.preguntas.map((q, i) => {
        if (esAbierta(q)){ const cal = lista.filter(r => (r.abiertas || {})[i] != null), pc = cal.length ? Math.round(cal.reduce((s, r) => s + +r.abiertas[i], 0) / cal.length / ptsDe(q) * 100) : 0;
          return `<div class="pregEx"><b>${i + 1}. ${esc(q.p)}</b><small class="hint" style="padding:0">Abierta · ${cal.length ? 'promedio ' + pc + '% de los puntos' : 'sin revisar'}</small><div class="barraEst"><i style="width:${pc}%;background:${pc >= 70 ? '#22c55e' : pc >= 40 ? '#f59e0b' : '#ef4444'}"></i></div></div>`; }
        const bien = lista.filter(r => (r.resp || [])[i] === clave[i]).length, pc = lista.length ? Math.round(bien / lista.length * 100) : 0;
        return `<div class="pregEx"><b>${i + 1}. ${esc(q.p)}</b><small class="hint" style="padding:0">Correcta: ${esc(q.ops[clave[i]] || '')} · ${pc}% acertó</small><div class="barraEst"><i style="width:${pc}%;background:${pc >= 70 ? '#22c55e' : pc >= 40 ? '#f59e0b' : '#ef4444'}"></i></div></div>`; }).join('')}`;
    cuerpo().querySelectorAll('.respEx').forEach(det => {
      const btn = det.querySelector('[data-guardarab]'); if (!btn) return;
      btn.onclick = async () => {
        const r = lista.find(y => y.id === det.dataset.r), ab = {};
        det.querySelectorAll('[data-ab]').forEach(inp => { if (inp.value !== '') ab[inp.dataset.ab] = Math.max(0, Math.min(+inp.max, +inp.value)); });
        const c = calExamen(ex, { ...r, abiertas:ab }, clave);
        try { await xref.collection('respuestas').doc(r.id).update({ abiertas:ab, calificacion:c.pend ? null : c.cal, aciertos:c.b });
          if (!c.pend) avisarAlAlumno(gid, r.id, { tipo:'calificacion', ex:xid, texto:'✅ Ya tienes calificación en «' + ex.titulo + '»: ' + c.cal });
          toast(c.pend ? 'Puntos guardados. Faltan ' + c.pend + ' por revisar.' : '✅ ' + r.nombre + ': ' + c.cal + ' / 10'); ver('📝 ' + ex.titulo, () => examenMaestro(gid, xid), true); }
        catch (e) { toast('No se pudo guardar: ' + e.message); }
      };
    });
    $e('exBorrar').onclick = async () => {
      if (!confirm('¿Borrar el examen «' + ex.titulo + '» y todas sus respuestas?')) return;
      cargando(true);
      try { for (const r of rs.docs) await xref.collection('respuestas').doc(r.id).delete();
        for (const d of (await xref.collection('inicios').get().catch(sinPermiso)).docs) await xref.collection('inicios').doc(d.id).delete().catch(() => {});
        await gref.collection('claves').doc(xid).delete(); await xref.delete(); toast('Examen borrado'); $e('escAtras').click(); }
      catch (e) { toast('No se pudo borrar: ' + e.message); } finally { cargando(false); }
    };
  }
  async function examenAlumno(gid, xid){
    const gref = grupos().doc(gid), xref = gref.collection('examenes').doc(xid), uid = N.usuario.uid;
    const [x, r] = await Promise.all([xref.get(), xref.collection('respuestas').doc(uid).get()]);
    const ex = x.data(), mia = r.exists ? r.data() : null;
    if (mia) return resultadoAlumno(gid, xid, ex, mia);
    if (vencida(ex.limite)){ cuerpo().innerHTML = '<p class="hint" style="padding-top:0">Este examen ya cerró (fecha límite: ' + fecha(ex.limite) + ').</p>'; return; }
    let inicio = null;
    if (ex.tiempo){
      const ini = await xref.collection('inicios').doc(uid).get().catch(() => null);
      if (ini && ini.exists) inicio = ini.data().fecha;
      else {
        cuerpo().innerHTML = `${ex.instrucciones ? `<p style="white-space:pre-wrap;margin-top:0">${esc(ex.instrucciones)}</p>` : ''}
          <div class="relojIntro"><b>⏱ Tienes ${ex.tiempo} minutos</b><span>${ex.preguntas.length} preguntas. El tiempo empieza a correr en cuanto toques «Empezar» y sigue corriendo aunque cierres la página. Al terminar el tiempo se envía solo lo que hayas contestado.</span></div>
          <button class="btnP" id="exEmpezar">▶ Empezar el examen</button>`;
        $e('exEmpezar').onclick = async () => {
          try { inicio = N.ahora(); await xref.collection('inicios').doc(uid).set({ fecha:inicio }); } catch (e) { if (!sinReglas(e)) return toast('No se pudo empezar: ' + e.message); }
          pintarExamen();
        };
        return;
      }
    }
    pintarExamen();
    function pintarExamen(){
      const n = ex.preguntas.length, orden = ex.mezclar ? barajar(n, azar(uid + xid)) : [...Array(n).keys()];
      const BORR = 'exb_' + xid, borr = (() => { try { return JSON.parse(localStorage.getItem(BORR) || '{}'); } catch (e) { return {}; } })();
      cuerpo().innerHTML = `${ex.tiempo ? '<div class="relojEx" id="exReloj" role="timer" aria-live="off"></div>' : ''}${ex.instrucciones ? `<p style="white-space:pre-wrap;margin-top:0">${esc(ex.instrucciones)}</p>` : ''}<p class="hint">${n} preguntas${ex.limite ? ' · hasta el ' + fecha(ex.limite) : ''} · Solo puedes enviarlo una vez.</p>
        ${orden.map((i, k) => { const q = ex.preguntas[i];
          const ops = esAbierta(q) ? [] : (ex.mezclar ? barajar(q.ops.length, azar(uid + xid + ':' + i)) : q.ops.map((_, j) => j));
          return `<div class="pregEx"><b>${k + 1}. ${esc(q.p)}${ptsDe(q) !== 1 ? ` <small class="hint" style="padding:0">(${ptsDe(q)} pts)</small>` : ''}</b>${q.img ? `<img class="imgEx" src="${q.img}" alt="Imagen de la pregunta ${k + 1}">` : ''}
            ${esAbierta(q) ? `<textarea data-abierta="${i}" rows="4" maxlength="3000" placeholder="Escribe tu respuesta" style="width:100%;box-sizing:border-box">${esc(borr[i] || '')}</textarea>`
              : ops.map(j => `<label><input type="radio" name="exr${i}" value="${j}" style="width:auto" ${borr[i] === j ? 'checked' : ''}> ${esc(q.ops[j])}</label>`).join('')}</div>`; }).join('')}
        <button class="btnP" id="exEnviar">📨 Enviar mis respuestas</button>`;
      const guardarBorr = () => { const b = {}; ex.preguntas.forEach((q, i) => { if (esAbierta(q)){ const t = cuerpo().querySelector(`[data-abierta="${i}"]`); if (t && t.value) b[i] = t.value; } else { const m = cuerpo().querySelector(`input[name="exr${i}"]:checked`); if (m) b[i] = +m.value; } });
        try { localStorage.setItem(BORR, JSON.stringify(b)); } catch (e) {} };
      cuerpo().addEventListener('input', guardarBorr); cuerpo().addEventListener('change', guardarBorr);
      let enviando = false, reloj = null;
      const enviar = async solo => {
        if (enviando) return;
        const resp = ex.preguntas.map((q, i) => esAbierta(q) ? ((cuerpo().querySelector(`[data-abierta="${i}"]`) || {}).value || '').trim().slice(0, 3000) : (m => m ? +m.value : -1)(cuerpo().querySelector(`input[name="exr${i}"]:checked`)));
        const sin = resp.filter(v => v === -1 || v === '').length;
        if (!solo && !confirm(sin ? `Te faltan ${sin} pregunta${sin > 1 ? 's' : ''} sin contestar. ¿Enviar así? Ya no podrás cambiarlas.` : '¿Enviar tus respuestas? Ya no podrás cambiarlas.')) return;
        enviando = true; if (reloj) clearInterval(reloj); cargando(true);
        try {
          const u = N.usuario, datos = { resp, fecha:N.ahora(), nombre:u.displayName || u.email || 'Alumno', correo:u.email || '' }; if (inicio) datos.inicio = inicio;
          await xref.collection('respuestas').doc(uid).set(datos);
          try { localStorage.removeItem(BORR); } catch (e) {}
          avisarAMaestros(gid, { tipo:'examenResp', ex:xid, texto:'📨 ' + datos.nombre + ' respondió «' + ex.titulo + '»' });
          olvidar('pend:');
          toast(solo ? '⏱ Se acabó el tiempo: tus respuestas se enviaron.' : '📨 ¡Enviado!'); revisarPendientes(); await resultadoAlumno(gid, xid, ex, datos);
        } catch (e) { enviando = false; toast('No se pudo enviar: ' + e.message); } finally { cargando(false); }
      };
      $e('exEnviar').onclick = () => enviar(false);
      if (ex.tiempo && inicio){
        const fin = new Date(inicio).getTime() + ex.tiempo * 60000;
        const tic = () => { const q = fin - Date.now(), el = $e('exReloj'); if (!el){ clearInterval(reloj); return; }
          if (q <= 0){ el.textContent = '⏱ Tiempo terminado'; return enviar(true); }
          const m = Math.floor(q / 60000), s = Math.floor(q % 60000 / 1000); el.textContent = '⏱ Te quedan ' + m + ':' + String(s).padStart(2, '0'); el.classList.toggle('poco', q < 120000); };
        reloj = setInterval(tic, 1000); tic(); ver.limpiar = () => clearInterval(reloj);
      }
    }
  }
  async function resultadoAlumno(gid, xid, ex, mia){
    let clave = null;
    if (ex.mostrarResultados){ const c = await grupos().doc(gid).collection('claves').doc(xid).get().catch(() => null); if (c && c.exists) clave = c.data().resp; }
    const c = clave ? calExamen(ex, mia, clave) : null, hayAb = ex.preguntas.some(esAbierta);
    cuerpo().innerHTML = `<p class="hint" style="padding-top:0">Enviaste tus respuestas el ${fechaHora(mia.fecha)}</p>
      ${mia.calificacion != null ? `<div class="resEx">${mia.calificacion} / 10</div>` : c && !c.pend ? `<div class="resEx">${c.cal} / 10</div>` : c ? `<p class="hint">Llevas ${c.pts} de ${c.total} puntos. Tu maestro está revisando ${c.pend} pregunta${c.pend > 1 ? 's' : ''} abierta${c.pend > 1 ? 's' : ''}.</p>` : '<p class="hint">Tu maestro te dará tu calificación.</p>'}
      ${c && c.t ? `<p class="hint" style="padding-top:0">${c.b} de ${c.t} de opción múltiple correctas</p>` : ''}
      ${ex.preguntas.map((q, i) => `<div class="pregEx"><b>${i + 1}. ${esc(q.p)}</b>${q.img ? `<img class="imgEx" src="${q.img}" alt="">` : ''}${esAbierta(q)
        ? `<div class="respTxt">${esc((mia.resp || [])[i] || '') || '<i>(sin respuesta)</i>'}</div><small class="hint" style="padding:0">${(mia.abiertas || {})[i] != null ? 'Puntos: ' + mia.abiertas[i] + ' / ' + ptsDe(q) : hayAb ? 'Pendiente de revisar' : ''}</small>`
        : q.ops.map((o, j) => { const elegida = (mia.resp || [])[i] === j, cls = clave ? (j === clave[i] ? 'bien' : elegida ? 'mal' : '') : '';
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
    const { mias, respondidas } = await memo('mias:' + gid + ':' + acts.map(a => a.id).join(','), 2 * MIN, async () => {
      const mias = {}, respondidas = {};
      await Promise.all(acts.map(async a => { const r = gref.collection('actividades').doc(a.id);
        const [s, d] = await Promise.all([r.collection('entregas').doc(uid).get(), r.collection('dudas').doc(uid).get().catch(() => null)]);
        if (s.exists) mias[a.id] = s.data(); if (d && d.exists && d.data().pendienteAlumno) respondidas[a.id] = true; }));
      return { mias, respondidas }; });
    const misResp = {};
    const asis = await gref.collection('asistenciaAlumno').doc(uid).get().catch(() => null), miAs = asis && asis.exists ? asis.data() : null;
    const gd = (await gref.get()).data(), p = pondDe(gd);

    await Promise.all(exs.map(async x => { const s = await gref.collection('examenes').doc(x.id).collection('respuestas').doc(uid).get(); if (s.exists) misResp[x.id] = s.data(); }));
    const visto = leerVisto(gid);
    const estado = a => { const e = mias[a.id]; if (!e) return `<span class="insig ${a.limite && new Date() > new Date(a.limite + 'T23:59:59') ? 'i-tarde' : 'i-pend'}">${a.limite && new Date() > new Date(a.limite + 'T23:59:59') ? 'Vencida' : 'Pendiente'}</span>`;
      if (e.devuelta) return '<span class="insig i-dev">↩ Corrígela</span>';
      return e.calificacion != null ? `<span class="insig i-cal">Calificación: ${e.calificacion}</span>` : e.corregida ? '<span class="insig i-corr">✏ Con correcciones</span>' : '<span class="insig i-ok">Entregada</span>'; };
    const estadoEx = x => { const r = misResp[x.id]; if (!r) return `<span class="insig ${x.limite && new Date() > new Date(x.limite + 'T23:59:59') ? 'i-tarde' : 'i-pend'}">${x.limite && new Date() > new Date(x.limite + 'T23:59:59') ? 'Vencido' : 'Por responder'}</span>`;
      return r.calificacion != null ? `<span class="insig i-cal">Calificación: ${r.calificacion}</span>` : '<span class="insig i-ok">Respondido</span>'; };
    let miFinal = null;
    if (p && p.verAlumno) miFinal = calificacionFinal(p, { act:acts.map(a => notaAct(p, a, mias[a.id])).filter(v => v != null), ex:exs.map(x => notaEx(p, x, misResp[x.id] ? misResp[x.id].calificacion : null, !!misResp[x.id])).filter(v => v != null), asis:miAs && miAs.total ? pctAsis(miAs) : null });
    cuerpo().innerHTML = `<div class="grupoBtns"><button class="pb" id="escCalendario">📅 Calendario del grupo</button></div>
      ${miFinal && miFinal.final != null ? `<div class="miFinal"><div><small>Tu calificación hasta ahora</small><b>${miFinal.final}</b></div><span>${[['act', '📄 Actividades'], ['ex', '📝 Exámenes'], ['asis', '✅ Asistencia']].filter(([k]) => p[k] > 0).map(([k, n]) => `${n}: <b>${miFinal[k] == null ? '—' : r1(miFinal[k])}</b> <small>(${p[k]}%)</small>`).join(' · ')}</span></div>` : ''}
      ${miAs && miAs.total ? `<div class="miAsis">✅ <b>Mi asistencia: ${pctAsis(miAs)}%</b><span class="insig i-ok">${miAs.P || 0} asistencia${miAs.P === 1 ? '' : 's'}</span>${miAs.R ? `<span class="insig i-pend">${miAs.R} retardo${miAs.R > 1 ? 's' : ''}</span>` : ''}${miAs.F ? `<span class="insig i-tarde">${miAs.F} falta${miAs.F > 1 ? 's' : ''}</span>` : ''}${miAs.J ? `<span class="insig i-cal">${miAs.J} justificada${miAs.J > 1 ? 's' : ''}</span>` : ''}</div>` : ''}
      ${avisos.slice(0, 5).map(v => `<div class="avisoEsc2${(v.fecha || '') > visto ? ' nuevo' : ''}">📢 ${esc(v.texto)}<small>${fechaHora(v.fecha)}${(v.fecha || '') > visto ? ' · nuevo' : ''}</small></div>`).join('')}
      ${exs.length ? `<h4>Exámenes</h4><div class="escLista">${exs.map(x => `<button class="escItem" data-x="${esc(x.id)}"><span class="t"><b>📝 ${esc(x.titulo)}</b><small>${x.preguntas.length} pregunta${x.preguntas.length > 1 ? 's' : ''}${x.limite ? ' · hasta ' + fecha(x.limite) : ''}</small></span>${estadoEx(x)}</button>`).join('')}</div><h4>Actividades</h4>` : ''}
      <div class="escLista">${acts.length ? acts.map(a => `<button class="escItem" data-a="${esc(a.id)}">${a.mini ? `<img src="${a.mini}" alt="" style="width:64px;height:48px;object-fit:contain;background:#fff;border-radius:6px">` : ''}<span class="t"><b>${esc(a.titulo)}</b><small>${a.limite ? 'Entrega: ' + fecha(a.limite) : 'Sin fecha límite'}</small></span>${respondidas[a.id] ? '<span class="insig i-duda">💬 Te respondió</span>' : ''}${estado(a)}</button>`).join('')
      : '<p class="hint">Tu maestro todavía no publica actividades.</p>'}</div>`;
    cuerpo().querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const a = acts.find(x => x.id === b.dataset.a); ver(a.titulo, () => actividadAlumno(gid, a.id)); });
    cuerpo().querySelectorAll('[data-x]').forEach(b => b.onclick = () => { const x = exs.find(y => y.id === b.dataset.x); ver('📝 ' + x.titulo, () => examenAlumno(gid, x.id)); });
    if (avisos.length) guardarVisto(gid, avisos[0].fecha);
    $e('escCalendario').onclick = () => ver('📅 Calendario', () => calendario(gid, false));
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
      <div class="grupoBtns" style="margin-top:10px">${ent && ent.corregida ? '<button class="btnP" id="escVerCorr">👁 Ver las correcciones de mi maestro</button>' : ''}<button class="${ent && ent.corregida ? 'pb' : 'btnP'}" id="escEmpezar">${ent && !ent.ligero ? '✏ Abrir mi entrega para corregirla' : '✏ Empezar la actividad'}</button></div>
      ${ent && ent.corregida ? '<p class="hint">Las marcas de tu maestro aparecen encima de tu trabajo. Corrige y vuelve a entregar; antes de entregar te preguntamos si quieres quitar las marcas.</p>' : ''}
      <h4>💬 ¿Tienes una duda? Pregúntale a tu maestro</h4><div id="escHilo"></div>`;
    hiloDudas($e('escHilo'), gid, aid, uid, false);
    const ctx = { gid, aid, titulo:act.titulo, grupo:g.data().nombre, limite:act.limite };
    $e('escEmpezar').onclick = () => ent && !ent.ligero ? abrirDeNube(aref.collection('entregas').doc(uid), act.titulo, ctx) : abrirDeNube(aref, act.titulo, ctx);
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
    + '<button class="pb" id="bPreguntar" title="Pregúntale a tu maestro sobre esta actividad">💬 Preguntar</button><button class="btnP" id="bEntregar">📤 Entregar</button><button class="btnP" id="bGuardarCorr" hidden>💾 Guardar corrección</button><button class="pb" id="bQuitarMarcas" hidden title="Quita las marcas que dejó tu maestro">🧹 Quitar marcas</button><button class="pb" id="bSalirAct" title="Dejar de trabajar en la actividad" aria-label="Dejar la actividad">✕</button>';
  (document.getElementById('area') || document.body).appendChild(banda);
  function pintarBanda(){
    const a = window.ACTIVIDAD_ACTUAL, c = window.CORRECCION; banda.hidden = !a && !c;
    banda.classList.toggle('corr', !!c);
    $e('bandaHerr').hidden = !c; $e('bGuardarCorr').hidden = !c; $e('bEntregar').hidden = !a; $e('bPreguntar').hidden = !a || !!c;
    $e('bQuitarMarcas').hidden = !(a && hayMarcas());
    if (c) $e('bandaTxt').textContent = '✏ Corrigiendo a ' + c.nombre;
    else if (a) $e('bandaTxt').textContent = '🎓 ' + a.titulo + (a.limite ? ' · entrega: ' + fecha(a.limite) : '');
  }
  $e('bPreguntar').onclick = () => {
    const a = window.ACTIVIDAD_ACTUAL; if (!a || !N.usuario) return;
    abrirModal('mEscuela'); pila = []; ver.actual = null;
    ver('💬 ' + a.titulo, () => { cuerpo().innerHTML = '<p class="hint" style="padding-top:0">Solo tu maestro ve estos mensajes. Tu trabajo sigue abierto detrás de esta ventana.</p><div id="escHilo"></div>'; hiloDudas($e('escHilo'), a.gid, a.aid, N.usuario.uid, false); });
  };
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
      avisarAlAlumno(c.gid, c.uid, { tipo:'correccion', act:c.aid, texto:'✏ Tu maestro dejó correcciones en «' + c.titulo + '»' });
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
      avisarAMaestros(a.gid, { tipo:'entrega', act:a.aid, alumno:u.uid, texto:'📤 ' + meta.nombre + (antes ? ' volvió a entregar «' : ' entregó «') + a.titulo + '»' });
      olvidar('mias:'); olvidar('pend:');
      toast('📤 ¡Entregado! Tu maestro ya puede verlo.'); revisarPendientes();
    } catch (e) { toast('No se pudo entregar: ' + e.message); } finally { cargando(false); }
  };
  // ---------- pendientes del alumno y aviso en el botón ----------
  const maxRub = a => (a.rubrica || []).reduce((s, k) => s + (k.p || 0), 0);
  function pendientesDe(gid, fresco){ if (fresco) olvidar('pend:'); return memo('pend:' + gid, 10 * MIN, () => pendientesDeNube(gid), true); }
  async function pendientesDeNube(gid){
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

  // ---------- 💬 preguntas del alumno dentro de una actividad (solo las ven él y su maestro) ----------
  // actividades/{a}/dudas/{alumno}: resumen (quién debe contestar) · …/mensajes/{m}: cada mensaje
  function dudasSinResponder(gid){ return memo('dudasG:' + gid, 3 * MIN, () => dudasSinResponderNube(gid)); }
  async function dudasSinResponderNube(gid){
    const acts = (await grupos().doc(gid).collection('actividades').get()).docs;
    const n = await Promise.all(acts.map(a => a.ref.collection('dudas').where('pendienteMaestro', '==', true).get().then(x => x.size).catch(() => 0)));
    return n.reduce((s, x) => s + x, 0);
  }
  function hiloDudas(cont, gid, aid, uid, soyMaestro, nombreAlumno){
    const dref = grupos().doc(gid).collection('actividades').doc(aid).collection('dudas').doc(uid), mref = dref.collection('mensajes'), yo = soyMaestro ? 'maestro' : 'alumno';
    cont.innerHTML = `<div class="hilo" role="log" aria-live="polite"><p class="hint">Cargando…</p></div>
      <div class="escForm"><textarea rows="2" maxlength="2000" aria-label="Mensaje" placeholder="${soyMaestro ? 'Responde a ' + esc(nombreAlumno || 'tu alumno') + '…' : 'Escribe tu pregunta (solo tu maestro la verá)…'}"></textarea>
      <button class="btnP" style="margin-top:6px">💬 Enviar</button></div>`;
    const caja = cont.querySelector('.hilo'), txt = cont.querySelector('textarea'), btn = cont.querySelector('button');
    const pintar = docs => {
      const ms = docs.map(d => d.data()).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
      caja.innerHTML = ms.length ? ms.map(m => `<div class="msj${m.de === yo ? ' mio' : ''}"><b>${m.de === yo ? 'Tú' : esc(m.nombre || (m.de === 'maestro' ? 'Maestro(a)' : 'Alumno'))}</b>${esc(m.texto)}<small>${fechaHora(m.fecha)}</small></div>`).join('')
        : `<p class="hint">${soyMaestro ? 'Todavía no hay mensajes.' : 'Si algo de la actividad no te queda claro, escríbele aquí a tu maestro. Cuando te conteste, lo verás en 🎓 Escuela.'}</p>`;
      caja.scrollTop = caja.scrollHeight;
    };
    // el alumno ya vio la respuesta: deja de salir «💬 Te respondió» (al maestro le sigue saliendo «sin responder» hasta que conteste)
    if (!soyMaestro) dref.get().then(d => { if (d.exists && d.data().pendienteAlumno) dref.update({ pendienteAlumno:false }).catch(() => {}); }).catch(() => {});
    const fallo = e => { caja.innerHTML = `<p class="hint">${sinReglas(e) ? 'Las preguntas todavía no están activadas: quien administra el Diseñador debe publicar las reglas nuevas de Firebase.' : 'No se pudieron cargar los mensajes: ' + esc(e.message || e)}</p>`; };
    try { ver.limpiar = mref.onSnapshot(s => pintar(s.docs), fallo); } catch (e) { fallo(e); }
    btn.onclick = async () => {
      const texto = txt.value.trim(); if (!texto) return toast(soyMaestro ? 'Escribe tu respuesta' : 'Escribe tu pregunta');
      btn.disabled = true;
      try {
        const u = N.usuario, ahora = N.ahora(), nombre = u.displayName || u.email || (soyMaestro ? 'Maestro(a)' : 'Alumno');
        await mref.doc().set({ de:yo, nombre, texto, fecha:ahora }); olvidar(soyMaestro ? 'dudas' : 'mias:');
        await dref.set({ nombre:soyMaestro ? (nombreAlumno || 'Alumno') : nombre, ultimo:ahora, ultimoTexto:texto.slice(0, 140), ultimoDe:yo, pendienteMaestro:!soyMaestro, pendienteAlumno:soyMaestro });
        if (soyMaestro) avisarAlAlumno(gid, uid, { tipo:'respuesta', act:aid, texto:'💬 Tu maestro te respondió: «' + texto.slice(0, 120) + '»' });
        else avisarAMaestros(gid, { tipo:'duda', act:aid, alumno:uid, alumnoNombre:nombre, texto:'💬 ' + nombre + ' pregunta: «' + texto.slice(0, 120) + '»' });
        txt.value = ''; toast(soyMaestro ? '💬 Respuesta enviada' : '💬 Pregunta enviada a tu maestro');
      } catch (e) { toast(sinReglas(e) ? 'Las preguntas todavía no están activadas (faltan las reglas nuevas de Firebase).' : 'No se pudo enviar: ' + e.message); }
      finally { btn.disabled = false; }
    };
  }

  // ---------- 📅 calendario del grupo: actividades, exámenes y fechas que pone el maestro ----------
  async function calendario(gid, soyMaestro, mesInicial){
    const gref = grupos().doc(gid), uid = N.usuario.uid;
    const [acts, exs, evs] = await Promise.all([gref.collection('actividades').get(), gref.collection('examenes').get().catch(sinPermiso), gref.collection('eventos').get().catch(sinPermiso)]);
    const items = [
      ...acts.docs.map(d => ({ id:d.id, tipo:'act', titulo:d.data().titulo, fecha:d.data().limite })),
      ...exs.docs.map(d => ({ id:d.id, tipo:'ex', titulo:d.data().titulo, fecha:d.data().limite })),
      ...evs.docs.map(d => ({ id:d.id, tipo:'ev', titulo:d.data().titulo, fecha:d.data().fecha, nota:d.data().nota || '' }))].filter(x => x.fecha && /^\d{4}-\d{2}-\d{2}$/.test(x.fecha)).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const hoy = hoyISO();
    let mes = mesInicial || hoy.slice(0, 7), sel = null;
    const ETQ = { act:'📄 Entrega', ex:'📝 Examen', ev:'📌' };
    const pintar = () => {
      const [y, m] = mes.split('-').map(Number), primero = new Date(y, m - 1, 1), dias = new Date(y, m, 0).getDate(), corr = (primero.getDay() + 6) % 7;
      const celdas = [];
      for (let i = 0; i < 42; i++){
        const d = new Date(y, m - 1, 1 - corr + i), iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        if (i >= 35 && d.getMonth() !== m - 1) break;
        const del = items.filter(x => x.fecha === iso);
        celdas.push(`<button class="calDia${d.getMonth() !== m - 1 ? ' fuera' : ''}${iso === hoy ? ' hoy' : ''}${iso === sel ? ' sel' : ''}" data-dia="${iso}" aria-label="${d.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long' })}${del.length ? ': ' + del.length + ' pendiente' + (del.length > 1 ? 's' : '') : ''}"><span class="n">${d.getDate()}</span>${del.slice(0, 3).map(x => `<span class="calEv ce-${x.tipo}">${esc(x.titulo)}</span>`).join('')}${del.length > 3 ? `<span class="calEv">+${del.length - 3}</span>` : ''}</button>`);
      }
      const delMes = items.filter(x => x.fecha.startsWith(mes)), delDia = sel ? items.filter(x => x.fecha === sel) : null;
      const fila = x => `<div class="filaLista"><span class="t"><b>${ETQ[x.tipo]} ${esc(x.titulo)}</b><small class="hint" style="padding:0;display:block">${fecha(x.fecha)}${x.nota ? ' · ' + esc(x.nota) : ''}</small></span>${x.tipo !== 'ev' ? `<button class="pb" data-ir="${x.tipo}:${esc(x.id)}">Abrir</button>` : soyMaestro ? `<button class="pb" data-borrarev="${esc(x.id)}" aria-label="Borrar fecha">✕</button>` : ''}</div>`;
      cuerpo().innerHTML = `<div class="cal"><div class="calCab"><button class="pb" id="calAnt" aria-label="Mes anterior">‹</button><b>${(t => t[0].toUpperCase() + t.slice(1))(primero.toLocaleDateString('es-MX', { month:'long', year:'numeric' }))}</b><button class="pb" id="calHoy">Hoy</button><button class="pb" id="calSig" aria-label="Mes siguiente">›</button></div>
        <div class="calGrid">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<div class="calSem">${x}</div>`).join('')}${celdas.join('')}</div>
        <div class="calLeyenda"><span><i class="ce-act"></i>Entregas</span><span><i class="ce-ex"></i>Exámenes</span><span><i class="ce-ev"></i>Fechas del grupo</span></div></div>
        <h4>${sel ? fecha(sel) : 'En este mes'}</h4><div class="lista">${(delDia || delMes).map(fila).join('') || `<p class="hint" style="padding-top:0">${sel ? 'Nada para este día.' : 'Nada programado este mes.'}</p>`}</div>
        ${soyMaestro ? `<h4>📌 Agregar una fecha para el grupo</h4><div class="escForm"><p class="hint" style="padding-top:0">Exposiciones, días sin clase, salidas, entrega de material… Tus alumnos la verán en su calendario.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap"><input id="evFecha" type="date" value="${sel || hoy}" style="width:auto"><input id="evTit" class="buscador" maxlength="100" placeholder="Ej. Exposición por equipos" style="flex:1;min-width:160px;margin:0"></div>
          <input id="evNota" class="buscador" maxlength="200" placeholder="Nota (opcional)" style="margin-top:6px"><button class="pb" id="evOk" style="margin-top:6px">📌 Agregar</button></div>` : ''}
        <p class="hint" style="margin-top:12px"><button class="pb" id="calIcs">📥 Pasar a mi calendario (Google, Outlook, celular)</button></p>`;
      $e('calAnt').onclick = () => { const d = new Date(y, m - 2, 1); mes = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); sel = null; pintar(); };
      $e('calSig').onclick = () => { const d = new Date(y, m, 1); mes = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); sel = null; pintar(); };
      $e('calHoy').onclick = () => { mes = hoy.slice(0, 7); sel = hoy; pintar(); };
      cuerpo().querySelectorAll('[data-dia]').forEach(b => b.onclick = () => { sel = sel === b.dataset.dia ? null : b.dataset.dia; if (sel && !sel.startsWith(mes)) mes = sel.slice(0, 7); pintar(); });
      cuerpo().querySelectorAll('[data-ir]').forEach(b => b.onclick = () => {
        const [t, id] = b.dataset.ir.split(':'), x = items.find(i => i.id === id && i.tipo === t);
        if (t === 'act') ver(x.titulo, () => soyMaestro ? actividadMaestro(gid, id) : actividadAlumno(gid, id));
        else ver('📝 ' + x.titulo, () => soyMaestro ? examenMaestro(gid, id) : examenAlumno(gid, id));
      });
      cuerpo().querySelectorAll('[data-borrarev]').forEach(b => b.onclick = async () => {
        if (!confirm('¿Borrar esta fecha del calendario?')) return;
        try { await gref.collection('eventos').doc(b.dataset.borrarev).delete(); const k = items.findIndex(i => i.tipo === 'ev' && i.id === b.dataset.borrarev); if (k >= 0) items.splice(k, 1); pintar(); } catch (e) { toast('No se pudo: ' + e.message); }
      });
      if ($e('evOk')) $e('evOk').onclick = async () => {
        const f = $e('evFecha').value, titulo = $e('evTit').value.trim(), nota = $e('evNota').value.trim();
        if (!f) return toast('Elige la fecha'); if (!titulo) return toast('Escribe qué pasa ese día');
        try { const r = gref.collection('eventos').doc(); await r.set({ titulo, fecha:f, nota, creado:N.ahora() });
          items.push({ id:r.id, tipo:'ev', titulo, fecha:f, nota }); items.sort((a, b) => a.fecha.localeCompare(b.fecha)); mes = f.slice(0, 7); sel = f; pintar(); toast('📌 Fecha agregada al calendario del grupo'); }
        catch (e) { toast(sinReglas(e) ? 'Para agregar fechas, publica las reglas nuevas de Firebase.' : 'No se pudo: ' + e.message); }
      };
      $e('calIcs').onclick = () => {
        if (!items.length) return toast('Todavía no hay fechas en el calendario');
        const t = s => String(s || '').replace(/[\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
        const sig = iso => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10).replace(/-/g, ''); };
        const sello = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
        const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Disenador Apik-Desing//Escuela//ES', 'CALSCALE:GREGORIAN',
          ...items.flatMap(x => ['BEGIN:VEVENT', 'UID:' + x.tipo + '-' + x.id + '@disenador', 'DTSTAMP:' + sello, 'DTSTART;VALUE=DATE:' + x.fecha.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + sig(x.fecha),
            'SUMMARY:' + t((x.tipo === 'act' ? 'Entrega: ' : x.tipo === 'ex' ? 'Examen: ' : '') + x.titulo), ...(x.nota ? ['DESCRIPTION:' + t(x.nota)] : []), 'END:VEVENT']), 'END:VCALENDAR'].join('\r\n');
        bajarBlob(new Blob([ics], { type:'text/calendar;charset=utf-8' }), 'Calendario del grupo.ics');
        toast('📥 Ábrelo y se agrega a tu calendario (Google Calendar, Outlook o el del celular).');
      };
    };
    pintar();
  }

  // ---------- ⚖ ponderación: cuánto vale cada parte en la calificación final ----------
  const POND0 = { act:50, ex:30, asis:20, cero:true, verAlumno:true };
  const pondDe = g => g && g.ponderacion ? { ...POND0, ...g.ponderacion } : null;
  const vencida = lim => !!lim && new Date() > new Date(lim + 'T23:59:59');
  const prom = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
  const r1 = v => v == null ? '' : Math.round(v * 10) / 10;
  // partes: { act:[0-10…], ex:[0-10…], asis:% o null }
  function calificacionFinal(p, partes){
    const c = { act:prom(partes.act), ex:prom(partes.ex), asis:partes.asis == null ? null : partes.asis / 10 };
    let w = 0, t = 0; ['act', 'ex', 'asis'].forEach(k => { if (c[k] != null && p[k] > 0){ w += p[k]; t += p[k] * c[k]; } });
    return { ...c, final:w ? Math.round(t / w * 10) / 10 : null };
  }
  // cada actividad o examen se pasa a escala de 10; lo vencido sin entregar cuenta 0 si así lo eligió el maestro
  const notaAct = (p, a, e) => e && e.calificacion != null ? e.calificacion * 10 / (a.rubrica ? maxRub(a) || 10 : 10) : (!e && p.cero && vencida(a.limite) ? 0 : null);
  const notaEx = (p, x, cal, respondio) => cal != null ? cal : (!respondio && p.cero && vencida(x.limite) ? 0 : null);
  function formPonderacion(gid, g){
    const p = pondDe(g) || POND0;
    cuerpo().innerHTML = `<div class="escForm"><p class="hint" style="padding-top:0">Elige cuánto vale cada parte. La calificación final es el promedio de cada parte (sobre 10) multiplicado por su porcentaje. Si una parte todavía no tiene calificaciones, no cuenta y las demás se reparten su peso.</p>
      <div class="lista">${[['act', '📄 Actividades'], ['ex', '📝 Exámenes'], ['asis', '✅ Asistencia']].map(([k, n]) => `<div class="filaLista"><span class="t"><b>${n}</b></span><input type="number" min="0" max="100" step="5" data-p="${k}" value="${p[k]}" style="width:80px" aria-label="Porcentaje de ${n}"> %</div>`).join('')}</div>
      <p class="hint" id="pondSuma" style="padding-top:0"></p>
      <label style="display:flex;gap:8px;align-items:center;color:inherit"><input type="checkbox" id="pondCero" style="width:auto" ${p.cero ? 'checked' : ''}> Lo que ya venció y no se entregó cuenta como 0</label>
      <label style="display:flex;gap:8px;align-items:center;color:inherit"><input type="checkbox" id="pondVer" style="width:auto" ${p.verAlumno ? 'checked' : ''}> Mis alumnos ven su calificación hasta ahora</label>
      <div class="grupoBtns" style="margin-top:12px"><button class="btnP" id="pondOk">💾 Guardar</button>${g.ponderacion ? '<button class="pb" id="pondQuitar">Quitar ponderación (promedio simple)</button>' : ''}</div></div>`;
    const ins = [...cuerpo().querySelectorAll('[data-p]')];
    const suma = () => { const t = ins.reduce((s, i) => s + (+i.value || 0), 0); $e('pondSuma').innerHTML = t === 100 ? '✓ Suma 100%' : `<b style="color:#ef4444">Suma ${t}%: debe sumar 100%</b>`; return t; };
    ins.forEach(i => i.oninput = suma); suma();
    $e('pondOk').onclick = async () => {
      if (suma() !== 100) return toast('Los porcentajes deben sumar 100%');
      const nueva = { cero:$e('pondCero').checked, verAlumno:$e('pondVer').checked }; ins.forEach(i => { nueva[i.dataset.p] = Math.max(0, +i.value || 0); });
      try { await grupos().doc(gid).update({ ponderacion:nueva }); delete cacheGrupo[gid]; toast('⚖ Ponderación guardada'); $e('escAtras').click(); } catch (e) { toast('No se pudo guardar: ' + e.message); }
    };
    if ($e('pondQuitar')) $e('pondQuitar').onclick = async () => { try { await grupos().doc(gid).update({ ponderacion:null }); delete cacheGrupo[gid]; toast('Se quitó la ponderación'); $e('escAtras').click(); } catch (e) { toast('No se pudo: ' + e.message); } };
  }

  // ---------- ✅ pase de lista ----------
  // asistencia/{AAAA-MM-DD}: lo que marcó el maestro ese día (solo él la ve)
  // asistenciaAlumno/{alumno}: el resumen de cada alumno (lo ven él y su maestro)
  const ESTADOS_AS = { P:'Presente', R:'Retardo', F:'Falta', J:'Justificada' };
  const pctAsis = r => { const base = (r.total || 0) - (r.J || 0); return base > 0 ? Math.round(((r.P || 0) + (r.R || 0)) / base * 100) : 100; };
  function resumenAsistencia(dias){
    const r = {};
    dias.forEach(d => Object.entries(d.estados || {}).forEach(([u, v]) => { const x = r[u] = r[u] || { P:0, R:0, F:0, J:0, total:0, registros:{} }; if (!ESTADOS_AS[v]) return; x[v]++; x.total++; x.registros[d.fecha] = v; }));
    return r;
  }
  async function paseDeLista(gid, diaInicial){
    const gref = grupos().doc(gid);
    const [miembros, as] = await Promise.all([miembrosDe(gid, true), gref.collection('asistencia').get().catch(e => { if (sinReglas(e)) return null; throw e; })]);
    if (!as){ cuerpo().innerHTML = '<p class="hint" style="padding-top:0">El pase de lista todavía no está activado: quien administra el Diseñador debe publicar las reglas nuevas de Firebase (archivo firestore.rules).</p>'; return; }
    const alumnos = miembros.docs.map(m => ({ id:m.id, nombre:m.data().nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const dias = as.docs.map(d => d.data()).filter(d => d.fecha).sort((a, b) => b.fecha.localeCompare(a.fecha));
    let dia = diaInicial || hoyISO();
    if (!alumnos.length){ cuerpo().innerHTML = '<p class="hint" style="padding-top:0">Todavía no hay alumnos en el grupo. Comparte el código para que se unan.</p>'; return; }
    const pintar = () => {
      const previo = dias.find(d => d.fecha === dia), est = { ...((previo && previo.estados) || {}) };
      const res = resumenAsistencia(dias);
      cuerpo().innerHTML = `<div class="escForm" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label for="asDia" style="margin:0">Día</label><input id="asDia" type="date" value="${dia}" style="width:auto">
          <button class="pb" id="asTodos">✔ Todos presentes</button><span class="hint" style="padding:0">${previo ? '✓ Ya pasaste lista este día; puedes cambiarla.' : 'Toca el estado de cada alumno.'}</span></div>
        <div class="lista">${alumnos.map(a => `<div class="filaLista" data-u="${esc(a.id)}"><span class="t"><b>${esc(a.nombre)}</b></span><span class="estados" role="radiogroup" aria-label="Asistencia de ${esc(a.nombre)}">${Object.entries(ESTADOS_AS).map(([k, v]) => `<button data-v="${k}" class="${est[a.id] === k ? 'on' : ''}" role="radio" aria-checked="${est[a.id] === k}" title="${v}">${k}</button>`).join('')}</span></div>`).join('')}</div>
        <p class="hint" style="padding-top:0">P = presente · R = retardo · F = falta · J = justificada (no cuenta en contra).</p>
        <button class="btnP" id="asGuardar">💾 Guardar el pase de lista</button>
        ${dias.length ? `<h4>Días registrados (${dias.length})</h4><div class="chipsDias">${dias.map(d => `<button class="pb${d.fecha === dia ? ' on' : ''}" data-dia="${d.fecha}">${fecha(d.fecha)}</button>`).join('')}</div>
        <h4>Resumen</h4><div style="overflow:auto"><table class="tablaAs"><thead><tr><th>Alumno</th><th>P</th><th>R</th><th>F</th><th>J</th><th>% asistencia</th></tr></thead><tbody>${alumnos.map(a => { const r = res[a.id] || { P:0, R:0, F:0, J:0, total:0 }; const pc = pctAsis(r);
          return `<tr><td>${esc(a.nombre)}</td><td>${r.P}</td><td>${r.R}</td><td>${r.F}</td><td>${r.J}</td><td><b style="color:${pc >= 80 ? '#22c55e' : pc >= 60 ? '#f59e0b' : '#ef4444'}">${r.total ? pc + '%' : '—'}</b></td></tr>`; }).join('')}</tbody></table></div>
        <p class="hint">% asistencia = (presentes + retardos) ÷ (días − justificadas). También sale en «⬇ Calificaciones (Excel)».</p>` : ''}`;
      cuerpo().querySelectorAll('.filaLista').forEach(f => f.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
        est[f.dataset.u] = b.dataset.v; f.querySelectorAll('[data-v]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); }));
      $e('asTodos').onclick = () => cuerpo().querySelectorAll('.filaLista').forEach(f => { const b = f.querySelector('[data-v=P]'); if (!est[f.dataset.u] || est[f.dataset.u] === 'F') b.click(); });
      $e('asDia').onchange = e => { if (e.target.value){ dia = e.target.value; pintar(); } };
      cuerpo().querySelectorAll('[data-dia]').forEach(b => b.onclick = () => { dia = b.dataset.dia; pintar(); });
      $e('asGuardar').onclick = async () => {
        const sin = alumnos.filter(a => !est[a.id]);
        if (sin.length && !confirm(`Faltan ${sin.length} alumno${sin.length > 1 ? 's' : ''} por marcar (${sin.slice(0, 3).map(a => a.nombre).join(', ')}${sin.length > 3 ? '…' : ''}). ¿Guardar así?`)) return;
        cargando(true);
        try {
          const estados = {}; alumnos.forEach(a => { if (est[a.id]) estados[a.id] = est[a.id]; });
          Object.keys(est).forEach(u => { if (!estados[u] && est[u]) estados[u] = est[u]; });     // alumnos que salieron del grupo
          const nombres = {}; alumnos.forEach(a => { if (estados[a.id]) nombres[a.id] = a.nombre; });
          const doc = { fecha:dia, estados, nombres, actualizada:N.ahora() };
          await gref.collection('asistencia').doc(dia).set(doc);
          const k = dias.findIndex(d => d.fecha === dia); if (k >= 0) dias[k] = doc; else { dias.push(doc); dias.sort((a, b) => b.fecha.localeCompare(a.fecha)); }
          // el resumen de cada alumno (para que vea su asistencia)
          const r = resumenAsistencia(dias);
          await Promise.all(Object.keys(r).map(u => gref.collection('asistenciaAlumno').doc(u).set({ P:r[u].P, R:r[u].R, F:r[u].F, J:r[u].J, total:r[u].total, registros:r[u].registros, actualizada:N.ahora() })));
          toast('✅ Lista guardada: ' + fecha(dia)); pintar();
        } catch (e) { toast(sinReglas(e) ? 'Para pasar lista, publica las reglas nuevas de Firebase.' : 'No se pudo guardar: ' + e.message); } finally { cargando(false); }
      };
    };
    pintar();
  }
  // ---------- calificaciones en Excel (archivo CSV que Excel y Google Sheets abren) ----------
  async function descargarCalificaciones(gid, g, miembros, actividades){
    cargando(true);
    try {
      const { csv } = await csvCalificaciones(gid, g, miembros, actividades);
      bajarBlob(new Blob([csv], { type:'text/csv;charset=utf-8' }), 'Calificaciones - ' + g.nombre.replace(/[\\/:*?"<>|]/g, '') + '.csv');
      toast('Calificaciones descargadas. Ábrelas con Excel o Google Sheets.');
    } catch (e) { toast('No se pudieron descargar: ' + e.message); } finally { cargando(false); }
  }
  async function csvCalificaciones(gid, g, miembros, actividades){
    {
      const gref = grupos().doc(gid), acts = actividades.slice().sort((a, b) => (a.creada || '').localeCompare(b.creada || ''));
      const alumnos = new Map(miembros.docs.map(m => [m.id, { nombre:m.data().nombre, correo:m.data().correo || '' }]));
      const notas = {};
      (await gref.collection('asistencia').get().catch(sinPermiso)).docs.forEach(d => Object.keys(d.data().estados || {}).forEach(u => { if (!alumnos.has(u)) alumnos.set(u, { nombre:((d.data().nombres || {})[u] || 'Alumno') + ' (salió del grupo)', correo:'' }); }));
      for (const a of acts){
        const es = await gref.collection('actividades').doc(a.id).collection('entregas').get();
        es.docs.forEach(d => { const e = d.data(); if (!alumnos.has(d.id)) alumnos.set(d.id, { nombre:e.nombre + ' (salió del grupo)', correo:e.correo || '' }); (notas[d.id] = notas[d.id] || {})[a.id] = e; });
      }
      // exámenes: la calificación se calcula con la clave
      const exs = (await gref.collection('examenes').get().catch(sinPermiso)).docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (a.creado || '').localeCompare(b.creado || ''));
      for (const x of exs){
        const cl = await gref.collection('claves').doc(x.id).get(), clave = cl.exists ? cl.data().resp : [];
        (await gref.collection('examenes').doc(x.id).collection('respuestas').get()).docs.forEach(d => { const r = d.data(); if (!alumnos.has(d.id)) alumnos.set(d.id, { nombre:r.nombre + ' (salió del grupo)', correo:r.correo || '' });
          (notas[d.id] = notas[d.id] || {})['ex_' + x.id] = (c => ({ calificacion:c.pend ? null : c.cal, pend:c.pend }))(calExamen(x, r, clave)); });
      }
      const cols = [...acts.map(a => ({ id:a.id, nom:a.titulo + (a.rubrica ? ' (/' + maxRub(a) + ')' : ' (/10)'), max:a.rubrica ? maxRub(a) || 10 : 10, falta:'Sin entregar', hecho:'Entregada' })),
        ...exs.map(x => ({ id:'ex_' + x.id, nom:'Examen: ' + x.titulo + ' (/10)', max:10, falta:'Sin responder', hecho:'Por revisar' }))];
      const celda = v => { const t = String(v ?? ''); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
      // asistencia (si el maestro pasa lista)
      const dias = (await gref.collection('asistencia').get().catch(sinPermiso)).docs.map(d => d.data());
      const asis = resumenAsistencia(dias);
      const colAs = dias.length ? ['Asistencias', 'Retardos', 'Faltas', 'Justificadas', '% asistencia'] : [];
      const p = pondDe(g);
      const colFin = p ? ['Prom. actividades (0-10)', 'Prom. exámenes (0-10)', 'Asistencia (0-10)', `Calificación final (${p.act}% act · ${p.ex}% ex · ${p.asis}% asist.)`] : ['Promedio (0-10)'];
      const filas = [['Alumno', 'Correo', ...cols.map(c => c.nom), ...colFin, ...colAs]];
      [...alumnos.entries()].sort((a, b) => a[1].nombre.localeCompare(b[1].nombre)).forEach(([uid, al]) => {
        const vals = cols.map(c => { const e = (notas[uid] || {})[c.id]; return !e ? c.falta : e.calificacion == null ? c.hecho : e.calificacion; });
        const sobre10 = cols.map((c, i) => typeof vals[i] === 'number' ? vals[i] * 10 / c.max : null).filter(v => v != null);
        const r = asis[uid] || { P:0, R:0, F:0, J:0, total:0 };
        let fin;
        if (p){
          const n = notas[uid] || {};
          const f = calificacionFinal(p, { act:acts.map(a => notaAct(p, a, n[a.id])).filter(v => v != null), ex:exs.map(x => notaEx(p, x, n['ex_' + x.id] ? n['ex_' + x.id].calificacion : null, !!n['ex_' + x.id])).filter(v => v != null), asis:r.total ? pctAsis(r) : null });
          fin = [r1(f.act), r1(f.ex), r1(f.asis), r1(f.final)];
        } else fin = [sobre10.length ? (sobre10.reduce((s, v) => s + v, 0) / sobre10.length).toFixed(1) : ''];
        filas.push([al.nombre, al.correo, ...vals, ...fin, ...(dias.length ? [r.P, r.R, r.F, r.J, r.total ? pctAsis(r) : ''] : [])]);
      });
      const csv = '\ufeff' + filas.map(f => f.map(celda).join(',')).join('\r\n');
      return { csv };
    }
  }
  // ---------- 📦 respaldo del grupo (.zip) y liberar espacio ----------
  const URL_ZIP = ['https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'];
  async function cargarZip(){
    if (window.JSZip) return;
    for (const u of URL_ZIP){ try { await new Promise((ok, mal) => { const sc = document.createElement('script'); sc.src = u; sc.onload = ok; sc.onerror = mal; document.head.appendChild(sc); }); if (window.JSZip) return; } catch (e) {} }
    throw new Error('No se pudo cargar la herramienta para hacer el .zip. Revisa tu internet e intenta otra vez.');
  }
  const nomArch = t => String(t || '').replace(/[\\/:*?"<>|\n\r\t]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'sin nombre';
  const celdaCSV = v => { const t = String(v ?? ''); return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  const aCSV = filas => '﻿' + filas.map(f => f.map(celdaCSV).join(',')).join('\r\n');
  function panelRespaldo(gid, g, miembros, actividades){
    const titular = esTitular(g);
    cuerpo().innerHTML = `<p class="hint" style="padding-top:0">Descarga todo el grupo en un solo archivo .zip para guardarlo en tu compu o en tu Drive:</p>
      <ul class="hint" style="margin:0 0 8px;padding-left:20px;line-height:1.6"><li>Calificaciones y asistencia (se abren con Excel)</li><li>Cada actividad con su plantilla y el trabajo de cada alumno (se abren en el Diseñador con <b>Archivo → Abrir</b>)</li><li>Las correcciones, las preguntas de los alumnos, los exámenes con sus respuestas, los avisos y el calendario</li></ul>
      <button class="btnP" id="resBajar">📦 Descargar respaldo (.zip)</button><p class="hint" id="resAvance" aria-live="polite"></p>
      ${titular ? `<h4>🧹 Liberar espacio en la nube</h4><p class="hint" style="padding-top:0">Al cerrar el semestre, borra de la nube los trabajos de los alumnos de este grupo (lo que más espacio ocupa). Se quedan las calificaciones, comentarios, exámenes, asistencia y la plantilla de cada actividad. <b>Primero descarga el respaldo</b>: los trabajos solo quedarán en tu .zip.</p>
        <button class="pb peligro" id="resLiberar" disabled>🧹 Borrar los trabajos de la nube</button>` : ''}`;
    let respaldado = false;
    $e('resBajar').onclick = async () => {
      const btn = $e('resBajar'), av = t => { const el = $e('resAvance'); if (el) el.textContent = t; };
      btn.disabled = true;
      try {
        const blob = await hacerRespaldo(gid, g, miembros, actividades, av);
        bajarBlob(blob, 'Respaldo - ' + nomArch(g.nombre) + ' - ' + hoyISO() + '.zip');
        av('✓ Listo: ' + (blob.size > 1048576 ? (blob.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(blob.size / 1024)) + ' KB') + '. Guárdalo en un lugar seguro.'); respaldado = true;
        if ($e('resLiberar')) $e('resLiberar').disabled = false;
      } catch (e) { av('⚠ ' + e.message); } finally { btn.disabled = false; }
    };
    if ($e('resLiberar')) $e('resLiberar').onclick = async () => {
      if (!respaldado) return toast('Primero descarga el respaldo');
      if (!confirm('¿Borrar de la nube los trabajos de los alumnos de «' + g.nombre + '»? Las calificaciones se conservan. Esto no se puede deshacer.')) return;
      const av = t => { const el = $e('resAvance'); if (el) el.textContent = t; };
      cargando(true);
      try {
        let n = 0, kb = 0; const gref = grupos().doc(gid);
        for (const a of actividades){
          const aref = gref.collection('actividades').doc(a.id);
          for (const d of (await aref.collection('entregas').get()).docs){
            const e = d.data(); if (e.ligero) continue;
            const eref = aref.collection('entregas').doc(d.id);
            for (let i = 0; i < (e.partes || 0); i++) await eref.collection('partes').doc(String(i)).delete().catch(() => {});
            await N.borrarGrande(eref.collection('correccion').doc('ultima')).catch(() => {});
            await eref.update({ partes:0, mini:'', tamKB:0, ligero:true, liberada:N.ahora() });
            n++; kb += e.tamKB || 0; av('Borrando… ' + n + ' trabajos');
          }
        }
        av('✓ Se liberaron ' + n + ' trabajos (' + (kb / 1024).toFixed(1) + ' MB).'); toast('🧹 Espacio liberado');
      } catch (e) { av('⚠ No se pudo terminar: ' + e.message); } finally { cargando(false); }
    };
  }
  async function hacerRespaldo(gid, g, miembros, actividades, av){
    av('Preparando…'); await cargarZip();
    const zip = new JSZip(), raiz = zip.folder('Respaldo - ' + nomArch(g.nombre)), gref = grupos().doc(gid);
    raiz.file('LEEME.txt', ['Respaldo del grupo «' + g.nombre + '» (código ' + (g.codigo || '') + ')', 'Descargado el ' + new Date().toLocaleString('es-MX') + ' desde el Diseñador · Apik-Desing', '',
      '· Calificaciones.csv y Asistencia.csv se abren con Excel o Google Sheets.',
      '· Los archivos .apik.json son diseños: ábrelos en el Diseñador con Archivo → Abrir archivo.',
      '· Cada carpeta de Actividades tiene la plantilla, el trabajo de cada alumno, las correcciones y las preguntas que hicieron.',
      '· Exámenes: un .csv con las respuestas de cada alumno y un .txt con las preguntas y las respuestas correctas.', '',
      'Este archivo tiene datos personales de tus alumnos: guárdalo en un lugar seguro y no lo compartas.'].join('\r\n'));
    av('Calificaciones…');
    raiz.file('Calificaciones.csv', (await csvCalificaciones(gid, g, miembros, actividades)).csv);
    // asistencia: una columna por día
    const dias = (await gref.collection('asistencia').get().catch(sinPermiso)).docs.map(d => d.data()).filter(d => d.fecha).sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (dias.length){
      const nombres = new Map(miembros.docs.map(m => [m.id, m.data().nombre])); dias.forEach(d => Object.entries(d.nombres || {}).forEach(([u, n]) => { if (!nombres.has(u)) nombres.set(u, n); }));
      const res = resumenAsistencia(dias);
      raiz.file('Asistencia.csv', aCSV([['Alumno', ...dias.map(d => d.fecha), 'P', 'R', 'F', 'J', '% asistencia'],
        ...[...nombres.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([u, n]) => { const r = res[u] || { P:0, R:0, F:0, J:0, total:0 }; return [n, ...dias.map(d => (d.estados || {})[u] || ''), r.P, r.R, r.F, r.J, r.total ? pctAsis(r) : '']; })]));
    }
    const [avs, evs] = await Promise.all([gref.collection('avisos').get().catch(sinPermiso), gref.collection('eventos').get().catch(sinPermiso)]);
    if (avs.size) raiz.file('Avisos.txt', avs.docs.map(d => d.data()).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '')).map(v => fechaHora(v.fecha) + '\r\n' + v.texto).join('\r\n\r\n---\r\n\r\n'));
    if (evs.size) raiz.file('Calendario.txt', evs.docs.map(d => d.data()).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '')).map(v => fecha(v.fecha) + ' · ' + v.titulo + (v.nota ? ' — ' + v.nota : '')).join('\r\n'));
    // actividades
    const acts = actividades.slice().sort((a, b) => (a.creada || '').localeCompare(b.creada || ''));
    for (const [k, a] of acts.entries()){
      const aref = gref.collection('actividades').doc(a.id), dir = raiz.folder('Actividades').folder(String(k + 1).padStart(2, '0') + ' ' + nomArch(a.titulo));
      av('Actividad ' + (k + 1) + ' de ' + acts.length + ': ' + a.titulo);
      dir.file('Instrucciones.txt', [a.titulo, a.limite ? 'Fecha límite: ' + fecha(a.limite) : 'Sin fecha límite', a.rubrica ? 'Rúbrica: ' + a.rubrica.map(r => r.c + ' (' + r.p + ')').join(' · ') : '', '', a.instrucciones || ''].join('\r\n'));
      try { dir.file('Plantilla.apik.json', (await N.leerGrande(aref)).texto); } catch (e) {}
      const usados = {};
      const nombreUnico = n => { const b = nomArch(n); usados[b] = (usados[b] || 0) + 1; return usados[b] > 1 ? b + ' (' + usados[b] + ')' : b; };
      for (const d of (await aref.collection('entregas').get()).docs){
        const e = d.data(), nom = nombreUnico(e.nombre || 'Alumno'), eref = aref.collection('entregas').doc(d.id);
        if (!e.ligero){ try { dir.folder('Entregas').file(nom + '.apik.json', (await N.leerGrande(eref)).texto); } catch (er) {} }
        const b64 = /^data:image\/\w+;base64,(.*)$/.exec(e.mini || ''); if (b64) dir.folder('Entregas').file(nom + '.jpg', b64[1], { base64:true });
        if (e.corregida && !e.ligero){ try { dir.folder('Correcciones').file(nom + '.apik.json', (await N.leerGrande(eref.collection('correccion').doc('ultima'))).texto); } catch (er) {} }
      }
      const dds = await aref.collection('dudas').get().catch(sinPermiso);
      if (dds.size){
        const txt = [];
        for (const d of dds.docs){
          const ms = (await aref.collection('dudas').doc(d.id).collection('mensajes').get().catch(sinPermiso)).docs.map(x => x.data()).sort((x, y) => (x.fecha || '').localeCompare(y.fecha || ''));
          txt.push('== ' + (d.data().nombre || 'Alumno') + ' ==\r\n' + ms.map(m => fechaHora(m.fecha) + ' · ' + (m.nombre || m.de) + ': ' + m.texto).join('\r\n'));
        }
        dir.file('Preguntas de los alumnos.txt', txt.join('\r\n\r\n'));
      }
    }
    // exámenes
    const exs = (await gref.collection('examenes').get().catch(sinPermiso)).docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (a.creado || '').localeCompare(b.creado || ''));
    for (const [k, x] of exs.entries()){
      av('Examen ' + (k + 1) + ' de ' + exs.length + ': ' + x.titulo);
      const cl = await gref.collection('claves').doc(x.id).get().catch(() => null), clave = cl && cl.exists ? cl.data().resp : [];
      const rs = (await gref.collection('examenes').doc(x.id).collection('respuestas').get()).docs.map(d => d.data()).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
      const base = String(k + 1).padStart(2, '0') + ' ' + nomArch(x.titulo), dir = raiz.folder('Exámenes');
      dir.file(base + ' - preguntas.txt', x.preguntas.map((q, i) => (i + 1) + '. ' + q.p + ' (' + ptsDe(q) + ' pts)' + (esAbierta(q) ? '\r\n   [Respuesta abierta]' : '\r\n' + q.ops.map((o, j) => '   ' + (j === clave[i] ? '✓ ' : '  ') + o).join('\r\n'))).join('\r\n\r\n'));
      dir.file(base + ' - respuestas.csv', aCSV([['Alumno', 'Correo', 'Empezó', 'Envió', ...x.preguntas.map((q, i) => 'P' + (i + 1)), 'Puntos', 'Calificación (0-10)'],
        ...rs.map(r => { const c = calExamen(x, r, clave); return [r.nombre, r.correo || '', r.inicio ? fechaHora(r.inicio) : '', fechaHora(r.fecha),
          ...x.preguntas.map((q, i) => esAbierta(q) ? ((r.resp || [])[i] || '') + ((r.abiertas || {})[i] != null ? ' [' + r.abiertas[i] + ' pts]' : ' [sin revisar]') : (q.ops[(r.resp || [])[i]] ?? '') + ((r.resp || [])[i] === clave[i] ? ' ✓' : '')),
          c.pts + ' / ' + c.total, c.pend ? 'Por revisar' : c.cal]; })]));
    }
    av('Comprimiendo…');
    return zip.generateAsync({ type:'blob', compression:'DEFLATE', compressionOptions:{ level:6 } }, m => av('Comprimiendo… ' + Math.round(m.percent) + '%'));
  }


  // ---------- 🔔 la campana: lo nuevo para ti ----------
  const campana = document.createElement('button'); campana.className = 'tb'; campana.id = 'bAvisos'; campana.hidden = true; campana.title = 'Notificaciones de la escuela';
  campana.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/></svg><span class="txtLargo"> Avisos</span>';
  campana.onclick = () => abrirNotificaciones();
  let sinLeer = [], quitarBuzon = null, primeraVez = true;
  function pintarCampana(){ campana.classList.toggle('avisoEsc', sinLeer.length > 0); campana.dataset.n = sinLeer.length || ''; campana.title = sinLeer.length ? 'Tienes ' + sinLeer.length + ' notificación' + (sinLeer.length > 1 ? 'es' : '') + ' nueva' + (sinLeer.length > 1 ? 's' : '') : 'Notificaciones de la escuela'; }
  async function avisoDelSistema(n){
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return false;
      const op = { body:n.texto, tag:'esc-' + n.id, icon:'icons/icono-192.png', badge:'icons/icono-192.png', data:{ aviso:n.id } };
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) await reg.showNotification(n.grupoNombre || 'Diseñador · Escuela', op);
      else new Notification(n.grupoNombre || 'Diseñador · Escuela', op);
      return true;
    } catch (e) { return false; }
  }
  function escucharBuzon(){
    if (quitarBuzon){ quitarBuzon(); quitarBuzon = null; } sinLeer = []; pintarCampana(); primeraVez = true;
    campana.hidden = !N.usuario; if (!N.usuario) return;
    try {
      quitarBuzon = buzon(N.usuario.uid).where('leida', '==', false).onSnapshot(sn => {
        sinLeer = sn.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
        pintarCampana();
        if (!primeraVez && sn.docChanges) sn.docChanges().filter(c => c.type === 'added').forEach(async c => {
          const n = { id:c.doc.id, ...c.doc.data() };
          if (document.hidden || !document.hasFocus()){ if (await avisoDelSistema(n)) return; }
          toast('🔔 ' + n.texto);
        });
        primeraVez = false;
      }, () => { campana.hidden = true; });
    } catch (e) {}
  }
  async function abrir(n){
    buzon(N.usuario.uid).doc(n.id).update({ leida:true }).catch(() => {});
    const g = n.grupo, maestro = n.para === 'maestro';
    pila = [['🎓 Mi escuela', inicio]];
    const nom = n.grupoNombre || 'Grupo';
    if (maestro) pila.push([nom, () => grupoMaestro(g)]); else pila.push([nom, () => grupoAlumno(g)]);
    if (n.tipo === 'duda' && n.act && n.alumno) return ver('💬 ' + (n.alumnoNombre || 'Alumno'), () => { cuerpo().innerHTML = '<div id="escHilo"></div>'; hiloDudas($e('escHilo'), g, n.act, n.alumno, true, n.alumnoNombre || 'Alumno'); }, true);
    if (n.act) return ver(nom, () => maestro ? actividadMaestro(g, n.act) : actividadAlumno(g, n.act), true);
    if (n.ex) return ver('📝 ' + nom, () => maestro ? examenMaestro(g, n.ex) : examenAlumno(g, n.ex), true);
    pila.pop(); ver(nom, () => maestro ? grupoMaestro(g) : grupoAlumno(g), true);
  }
  async function panelNotificaciones(){
    const todas = (await buzon(N.usuario.uid).get()).docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    // limpieza: lo leído de hace más de 30 días se borra solo
    const viejo = new Date(Date.now() - 30 * 864e5).toISOString();
    todas.filter(n => n.leida && (n.fecha || '') < viejo).forEach(n => buzon(N.usuario.uid).doc(n.id).delete().catch(() => {}));
    const lista = todas.filter(n => !n.leida || (n.fecha || '') >= viejo).slice(0, 60);
    const permiso = 'Notification' in window ? Notification.permission : 'no';
    cuerpo().innerHTML = `<div class="grupoBtns">${lista.some(n => !n.leida) ? '<button class="pb" id="notLeidas">✓ Marcar todo como leído</button>' : ''}
        ${permiso === 'default' ? '<button class="btnP" id="notPermiso">🔔 Avisarme también fuera de la app</button>' : ''}</div>
      ${permiso === 'granted' ? '<p class="hint" style="padding-top:0">🔔 Este dispositivo te avisa aunque estés en otra pestaña o en otra app (con el Diseñador abierto o instalado).</p>' : permiso === 'denied' ? '<p class="hint" style="padding-top:0">Bloqueaste los avisos para esta página. Puedes permitirlos en el candado 🔒 junto a la dirección.</p>' : ''}
      <div class="escLista">${lista.map(n => `<button class="escItem" data-not="${esc(n.id)}" style="${n.leida ? 'opacity:.7' : ''}"><span class="t"><b>${esc(n.texto)}</b><small>${esc(n.grupoNombre || '')} · ${fechaHora(n.fecha)}</small></span>${n.leida ? '' : '<span class="insig i-nuevo">Nueva</span>'}</button>`).join('') || '<p class="hint">No tienes notificaciones. Aquí te avisamos de actividades nuevas, entregas, calificaciones, preguntas y respuestas.</p>'}</div>`;
    cuerpo().querySelectorAll('[data-not]').forEach(b => b.onclick = () => abrir(lista.find(n => n.id === b.dataset.not)));
    if ($e('notLeidas')) $e('notLeidas').onclick = async () => { await Promise.all(lista.filter(n => !n.leida).map(n => buzon(N.usuario.uid).doc(n.id).update({ leida:true }).catch(() => {}))); ver('🔔 Notificaciones', panelNotificaciones, true); };
    if ($e('notPermiso')) $e('notPermiso').onclick = async () => { try { const r = await Notification.requestPermission(); if (r === 'granted') toast('🔔 Listo: te avisaremos aunque estés en otra pestaña.'); } catch (e) {} ver('🔔 Notificaciones', panelNotificaciones, true); };
  }
  function abrirNotificaciones(){
    if (!N.usuario) return abrirEscuela();
    abrirModal('mEscuela'); pila = []; ver.actual = null; ver('🔔 Notificaciones', panelNotificaciones);
  }
  window.abrirNotificaciones = abrirNotificaciones;
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.abrirAviso){ const n = sinLeer.find(x => x.id === e.data.abrirAviso); if (n && N.usuario){ abrirModal('mEscuela'); abrir(n); } else abrirNotificaciones(); } });
  // ---------- botón de la barra y enlace ?grupo=CÓDIGO ----------
  const b = document.createElement('button'); b.className = 'tb'; b.id = 'bEscuela'; b.title = 'Mi escuela: grupos, actividades y entregas';
  b.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/></svg><span class="txtLargo"> Escuela</span>';
  b.onclick = abrirEscuela;
  const ref = document.querySelector('#barra .tb.donar'); if (ref) ref.before(b); else { const barra = $e('barra'); barra && barra.appendChild(b); }
  b.after(campana);
  const codigoURL = new URLSearchParams(location.search).get('grupo');
  if (new URLSearchParams(location.search).has('aviso')) N.listo.then(() => setTimeout(() => { if (N.usuario) abrirNotificaciones(); }, 1500), () => {});
  if (codigoURL) N.listo.then(() => setTimeout(() => {
    abrirModal('mEscuela'); pila = [];
    if (!N.usuario) { ver('Unirme a un grupo', () => { cuerpo().innerHTML = `<p class="hint" style="padding-top:0">Te invitaron a un grupo (código <b>${esc(codigoURL)}</b>). Entra con tu cuenta de Google para unirte.</p><button class="bigbtn" id="escEntrar2" style="text-align:center;font-weight:700">Entrar con Google</button>${window.legalEntrar ? legalEntrar() : ''}`;
      $e('escEntrar2').onclick = async () => { await N.entrar(); if (await esperarUsuario()) ver('Unirme a un grupo', () => formUnirme(codigoURL), true); }; }); }
    else ver('Unirme a un grupo', () => formUnirme(codigoURL));
  }, 1200));
  window.addEventListener('nube-usuario', escucharBuzon);
  N.listo.then(escucharBuzon, () => {});
  window.addEventListener('nube-usuario', () => { if (!N.usuario){ window.ACTIVIDAD_ACTUAL = null; pintarBanda(); marcarBoton(0); } else setTimeout(revisarPendientes, 1500); });
})();

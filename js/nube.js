/* =========================================================
   NUBE (Firebase): entrar con Google y guardar en tu cuenta
   Solo se activa si en config.js pusiste los datos de tu proyecto de Firebase.
   Sin sesión, todo sigue guardándose en este navegador como antes.
   ========================================================= */
(function(){
  const cfg = window.APIK_CONFIG && window.APIK_CONFIG.firebase;
  if (!cfg || !cfg.apiKey || !cfg.projectId) return;
  const V = '10.14.1';
  const LIBS = ['app', 'auth', 'firestore'].map(n => `https://www.gstatic.com/firebasejs/${V}/firebase-${n}-compat.js`);
  const PARTE = 300000;                 // letras por pedazo (Firestore acepta hasta 1 MB por documento)
  const MIN_VERSIONES = 10, MAX_VERSIONES = 20;
  let db = null, auth = null, usuario = null;
  const cargarScript = u => new Promise((ok, mal) => { const s = document.createElement('script'); s.src = u; s.onload = ok; s.onerror = () => mal(new Error('No se pudo conectar con la nube')); document.head.appendChild(s); });
  const listo = (async () => {
    if (!window.firebase) for (const u of LIBS) await cargarScript(u);
    const app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
    auth = firebase.auth(); db = firebase.firestore();
    return app;
  })();
  listo.catch(e => console.warn('Nube no disponible:', e));
  window.NUBE_LISTA = listo;

  // ---------- Documentos grandes en pedazos ----------
  const trozos = t => { t = String(t || ''); const r = []; for (let i = 0; i < t.length; i += PARTE) r.push(t.slice(i, i + PARTE)); return r.length ? r : ['']; };
  const kb = t => Math.round(String(t || '').length / 1024);
  const ahora = () => new Date().toISOString();
  async function escribirGrande(ref, meta, texto, padreAntes){
    const ps = trozos(texto);
    const previo = await ref.get().catch(() => null);
    const nPrevio = previo && previo.exists ? (previo.data().partes || 0) : 0;
    if (padreAntes) await ref.set({ ...meta, partes:ps.length, tamKB:kb(texto) });
    for (let i = 0; i < ps.length; i++) await ref.collection('partes').doc(String(i)).set({ t:ps[i] });
    for (let i = ps.length; i < nPrevio; i++) await ref.collection('partes').doc(String(i)).delete().catch(() => {});
    if (!padreAntes) await ref.set({ ...meta, partes:ps.length, tamKB:kb(texto) });
  }
  async function leerGrande(ref){
    const s = await ref.get();
    if (!s.exists) throw new Error('No se encontró en la nube');
    const n = s.data().partes || 0, ps = [];
    for (let i = 0; i < n; i++){ const p = await ref.collection('partes').doc(String(i)).get(); ps.push(p.exists ? p.data().t : ''); }
    return { meta:s.data(), texto:ps.join('') };
  }
  async function borrarGrande(ref){
    const s = await ref.get().catch(() => null);
    const n = s && s.exists ? (s.data().partes || 0) : 0;
    for (let i = 0; i < n; i++) await ref.collection('partes').doc(String(i)).delete().catch(() => {});
    await ref.delete().catch(() => {});
  }
  const mio = () => { if (!usuario) throw new Error('Entra con tu cuenta para usar la nube'); return db.collection('usuarios').doc(usuario.uid); };
  const disenos = () => mio().collection('disenos');
  const limpiar = n => String(n || '').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 80);

  async function guardarVersion(ref, actual){
    const vs = (await ref.collection('versiones').get()).docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => a.creada < b.creada ? 1 : -1);
    if (vs.length && Date.now() - new Date(vs[0].creada).getTime() < MIN_VERSIONES * 60 * 1000) return;
    const previo = await leerGrande(ref).catch(() => null);
    if (!previo) return;
    await escribirGrande(ref.collection('versiones').doc(), { fecha:previo.meta.fecha || ahora(), creada:ahora() }, previo.texto);
    for (const v of vs.slice(MAX_VERSIONES - 1)) await borrarGrande(ref.collection('versiones').doc(v.id));
  }
  // id de una versión: "diseño~versión"; id de una plantilla: "pl_…"
  function refDe(id){
    if (id.startsWith('pl_')) return mio().collection('plantillas').doc(id.slice(3));
    const [p, v] = id.split('~');
    return v ? disenos().doc(p).collection('versiones').doc(v) : disenos().doc(p);
  }

  const FUNCIONES_NUBE = {
    async guardarProyecto(nombre, contenido){
      nombre = limpiar(nombre) || 'Sin título';
      const ex = (await disenos().where('nombre', '==', nombre).get()).docs[0];
      const ref = ex ? disenos().doc(ex.id) : disenos().doc();
      if (ex) await guardarVersion(ref);
      await escribirGrande(ref, { nombre, fecha:ahora() }, contenido);
      return { id:ref.id, nombre };
    },
    async listarProyectos(){
      return (await disenos().get()).docs.map(d => ({ id:d.id, nombre:d.data().nombre, fecha:d.data().fecha, tamKB:d.data().tamKB || 0 }))
        .sort((a, b) => a.fecha < b.fecha ? 1 : -1);
    },
    async cargarProyecto(id){ return (await leerGrande(refDe(id))).texto; },
    async eliminarProyecto(id){
      const ref = refDe(id);
      if (!id.startsWith('pl_') && !id.includes('~')) for (const v of (await ref.collection('versiones').get()).docs) await borrarGrande(ref.collection('versiones').doc(v.id));
      await borrarGrande(ref); return true;
    },
    async listarVersiones(id){
      return (await disenos().doc(id).collection('versiones').get()).docs.map(d => ({ id:id + '~' + d.id, fecha:d.data().fecha, creada:d.data().creada, tamKB:d.data().tamKB || 0 }))
        .sort((a, b) => a.creada < b.creada ? 1 : -1).map(({ creada, ...v }) => v);
    },
    async guardarPlantilla(nombre, contenido){
      nombre = limpiar(nombre) || 'Mi plantilla';
      const col = mio().collection('plantillas');
      for (const d of (await col.where('nombre', '==', nombre).get()).docs) await borrarGrande(col.doc(d.id));
      let vista = ''; try { vista = JSON.parse(contenido).vista || ''; } catch (e) {}
      const ref = col.doc();
      await escribirGrande(ref, { nombre, fecha:ahora(), vista:vista.length < 400000 ? vista : '' }, contenido);
      return { id:'pl_' + ref.id, nombre };
    },
    async listarPlantillas(){
      return (await mio().collection('plantillas').get()).docs.map(d => ({ id:'pl_' + d.id, nombre:d.data().nombre, vista:d.data().vista || '', fecha:d.data().fecha }))
        .sort((a, b) => a.fecha < b.fecha ? 1 : -1);
    },
    async guardarKit(contenido){ await escribirGrande(mio().collection('ajustes').doc('kit'), { fecha:ahora() }, contenido); return true; },
    async cargarKit(){ try { return (await leerGrande(mio().collection('ajustes').doc('kit'))).texto; } catch (e) { return ''; } },
    async compartirDiseno(nombre, contenido){
      const ref = db.collection('compartidos').doc();
      await escribirGrande(ref, { dueno:usuario.uid, nombre:limpiar(nombre) || 'Diseño', fecha:ahora() }, contenido, true);
      setTimeout(() => { const a = document.getElementById('cAviso'); if (a) a.textContent = 'Cualquier persona con el enlace podrá abrir una copia, sin necesidad de cuenta.'; }, 0);
      return { id:ref.id, url:location.origin + location.pathname + '?copia=' + ref.id, publico:true };
    }
  };
  // Si algo falla, el mensaje dice qué parte de la nube y con qué cuenta (para encontrar el problema rápido)
  Object.keys(FUNCIONES_NUBE).forEach(k => {
    const f = FUNCIONES_NUBE[k];
    FUNCIONES_NUBE[k] = async (...a) => {
      try { return await f(...a); }
      catch (e) {
        console.error('Nube', k, e);
        const permiso = e && (e.code === 'permission-denied' || /permission/i.test(e.message || ''));
        const extra = permiso ? ' — revisa que las reglas de Firestore estén publicadas (cuenta: ' + (usuario ? usuario.uid.slice(0, 6) + '…' : 'sin sesión') + ', paso: ' + k + ')' : ' (paso: ' + k + ')';
        throw new Error((e && e.message || String(e)) + extra);
      }
    };
  });
  // Abrir un diseño compartido funciona aunque no hayas entrado
  window.NUBE_PUBLICAS = {
    async cargarCompartido(id){
      await listo;
      const r = await leerGrande(db.collection('compartidos').doc(id));
      return { nombre:r.meta.nombre, contenido:r.texto };
    }
  };

  // ---------- Botón de la barra y ventana de la cuenta ----------
  const b = document.createElement('button');
  b.className = 'tb'; b.id = 'bNube'; b.title = 'Guarda tus diseños en tu cuenta para verlos en cualquier computadora o celular';
  b.innerHTML = '☁<span class="txtLargo"> Entrar</span>';
  const ref = document.querySelector('#barra .tb.donar');
  if (ref) ref.before(b); else { const barra = document.getElementById('barra'); barra && barra.appendChild(b); }
  const modal = document.createElement('div'); modal.className = 'modal'; modal.id = 'mNube';
  modal.innerHTML = `<div class="caja"><h3>☁ Tu nube</h3><div id="nubeCuerpo"></div>
    <div class="acciones"><button class="btnS" onclick="cerrarModal('mNube')">Cerrar</button></div></div>`;
  document.body.appendChild(modal);
  const st = document.createElement('style');
  st.textContent = '#bNube.conectado{color:#19c8ff}#nubeCuerpo .fila2{display:flex;gap:10px;align-items:center;margin:8px 0}#nubeCuerpo img{width:40px;height:40px;border-radius:50%}#nubeCuerpo .bigbtn{margin:6px 0}.conNube .soloWeb{display:none!important}';
  document.head.appendChild(st);
  function pintarCuenta(){
    const c = document.getElementById('nubeCuerpo');
    if (!usuario){
      c.innerHTML = `<p class="hint" style="padding-top:0">Entra con tu cuenta de Google para guardar tus diseños, plantillas y kit de marca en la nube. Así los abres en cualquier computadora o celular y puedes compartirlos con un enlace.</p>
        <button class="bigbtn" id="nubeEntrar" style="text-align:center;font-weight:700">Entrar con Google</button>
        <p class="hint" style="font-size:11.5px">Si no entras, todo se sigue guardando en este navegador, como siempre.</p>`;
      document.getElementById('nubeEntrar').onclick = entrar;
      return;
    }
    c.innerHTML = `<div class="fila2">${usuario.photoURL ? `<img src="${esc(usuario.photoURL)}" alt="">` : ''}<div><b>${esc(usuario.displayName || 'Tu cuenta')}</b><br><span class="hint" style="padding:0">${esc(usuario.email || '')}</span></div></div>
      <p class="hint" style="padding-top:0">✓ Tus diseños se guardan en tu cuenta. Ábrelos con 📂 Abrir desde cualquier dispositivo.</p>
      <button class="bigbtn" id="nubeSubir">⬆ Subir a la nube los diseños de este navegador</button>
      <button class="bigbtn" id="nubeSalir">Salir de la cuenta</button>`;
    document.getElementById('nubeSubir').onclick = subirLocales;
    document.getElementById('nubeSalir').onclick = () => { auth.signOut(); cerrarModal('mNube'); };
  }
  b.onclick = () => { pintarCuenta(); abrirModal('mNube'); };
  async function entrar(){
    try {
      await listo;
      const prov = new firebase.auth.GoogleAuthProvider(); prov.setCustomParameters({ prompt:'select_account' });
      try { await auth.signInWithPopup(prov); }
      catch (e) {
        if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) return auth.signInWithRedirect(prov);
        throw e;
      }
      cerrarModal('mNube');
    } catch (e) {
      const m = { 'auth/unauthorized-domain':'Falta autorizar esta página en Firebase (Authentication → Configuración → Dominios autorizados).',
        'auth/popup-closed-by-user':'Cerraste la ventana antes de terminar.', 'auth/network-request-failed':'Sin conexión a internet.' }[e && e.code];
      toast('No se pudo entrar: ' + (m || (e && e.message) || e));
    }
  }
  async function subirLocales(){
    const L = window.ALMACEN_LOCAL; if (!L) return;
    const lista = await L.listarProyectos();
    if (!lista.length) return toast('No hay diseños guardados en este navegador');
    if (!confirm('Se subirán ' + lista.length + ' diseño(s) de este navegador a tu nube. Los que tengan el mismo nombre se reemplazan (queda una versión anterior). ¿Continuar?')) return;
    cargando(true);
    let n = 0;
    try { for (const p of lista){ await FUNCIONES_NUBE.guardarProyecto(p.nombre, await L.cargarProyecto(p.id)); n++; } }
    catch (e) { toast('Se subieron ' + n + '. Error: ' + e.message); }
    finally { cargando(false); }
    if (n === lista.length) toast('Listo: ' + n + ' diseño(s) en tu nube');
  }

  // ---------- Cuando entras o sales ----------
  const TEXTO_LOCAL = /este navegador/g;
  let observador = null;
  function cambiarTextos(on){
    if (observador){ observador.disconnect(); observador = null; }
    if (!on) return;
    const cambiar = nodo => { if (nodo.nodeType === 3 && TEXTO_LOCAL.test(nodo.nodeValue)) nodo.nodeValue = nodo.nodeValue.replace(TEXTO_LOCAL, 'tu nube'); };
    const recorrer = raiz => { const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) cambiar(n); };
    recorrer(document.body);
    observador = new MutationObserver(ms => ms.forEach(m => { if (m.type === 'characterData') cambiar(m.target); else m.addedNodes.forEach(n => n.nodeType === 3 ? cambiar(n) : recorrer(n)); }));
    observador.observe(document.body, { childList:true, subtree:true, characterData:true });
  }
  listo.then(() => auth.onAuthStateChanged(u => {
    const antes = usuario && usuario.uid;
    usuario = u || null;
    window.NUBE_FUNCIONES = usuario ? FUNCIONES_NUBE : null;
    b.classList.toggle('conectado', !!usuario); document.body.classList.toggle('conNube', !!usuario);
    b.innerHTML = usuario ? '☁<span class="txtLargo"> ' + esc((usuario.displayName || 'Mi nube').split(' ')[0]) + '</span>' : '☁<span class="txtLargo"> Entrar</span>';
    cambiarTextos(!!usuario);
    if ((usuario && usuario.uid) !== antes){
      if (usuario) toast('☁ Conectado a tu nube. Lo que guardes se queda en tu cuenta.');
      try {
        CATALOGO.splice(0, CATALOGO.length, ...CATALOGO.filter(it => it.cat !== CAT_MIAS));
        cargarMisPlantillas(); renderCatalogo();
        typeof cargarKit === 'function' && cargarKit();
      } catch (e) {}
      if (enDrive && antes !== undefined){ enDrive = false; indicadorGuardado('cambios'); }
    }
  })).catch(() => {});
})();

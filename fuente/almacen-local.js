/* =========================================================
   VERSIÓN WEB (GitHub Pages u otro hosting)
   Reemplaza al servidor de Apps Script: los diseños, plantillas, versiones
   y el kit de marca se guardan en el navegador (IndexedDB), y las
   exportaciones se descargan directamente.
   ========================================================= */
(function(){
  window.MODO_WEB = true;
  const BD = 'apik-disenador', ALMACEN = 'archivos';
  let bdPromesa = null;
  const abrirBD = () => bdPromesa || (bdPromesa = new Promise((ok, mal) => {
    const r = indexedDB.open(BD, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ALMACEN, { keyPath:'id' });
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error || new Error('Este navegador no permite guardar datos'));
  }));
  const pedir = r => new Promise((ok, mal) => { r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); });
  const almacen = async modo => (await abrirBD()).transaction(ALMACEN, modo).objectStore(ALMACEN);
  const todos = async () => pedir((await almacen('readonly')).getAll());
  const leer = async id => pedir((await almacen('readonly')).get(id));
  const poner = async o => pedir((await almacen('readwrite')).put(o));
  const quitar = async id => pedir((await almacen('readwrite')).delete(id));
  const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const limpiar = n => String(n || '').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 80);
  const ahora = () => new Date().toISOString();
  const kb = t => Math.round((t || '').length / 1024);
  const MIN_VERSIONES = 10, MAX_VERSIONES = 20;
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch(e){}

  async function guardarVersion(p){
    const vs = (await todos()).filter(x => x.tipo === 'version' && x.padre === p.id).sort((a, b) => a.creada < b.creada ? 1 : -1);
    if (vs.length && Date.now() - new Date(vs[0].creada).getTime() < MIN_VERSIONES * 60 * 1000) return;
    await poner({ id:nuevoId(), tipo:'version', padre:p.id, nombre:p.nombre, contenido:p.contenido, fecha:p.fecha, creada:ahora() });
    for (const v of vs.slice(MAX_VERSIONES - 1)) await quitar(v.id);
  }
  function descargar(dataUrl, nombre){
    const m = String(dataUrl).match(/^data:([^;,]+)[^,]*,(.*)$/);
    const bin = atob(m[2]), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const blob = new Blob([u8], { type:m[1] }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    return a.href;
  }
  const EXT = { 'image/jpeg':'jpg', 'image/png':'png', 'application/pdf':'pdf', 'video/mp4':'mp4', 'video/webm':'webm', 'image/svg+xml':'svg',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':'pptx' };

  const FUNCIONES = {
    async guardarProyecto(nombre, contenido){
      nombre = limpiar(nombre) || 'Sin título';
      const ex = (await todos()).find(x => x.tipo === 'proyecto' && x.nombre === nombre);
      if (ex){ await guardarVersion(ex); ex.contenido = contenido; ex.fecha = ahora(); await poner(ex); return { id:ex.id, nombre }; }
      const p = { id:nuevoId(), tipo:'proyecto', nombre, contenido, fecha:ahora() };
      await poner(p); return { id:p.id, nombre };
    },
    async listarProyectos(){
      return (await todos()).filter(x => x.tipo === 'proyecto').sort((a, b) => a.fecha < b.fecha ? 1 : -1)
        .map(x => ({ id:x.id, nombre:x.nombre, fecha:x.fecha, tamKB:kb(x.contenido) }));
    },
    async cargarProyecto(id){ const o = await leer(id); if (!o) throw new Error('No se encontró el diseño'); return o.contenido; },
    async eliminarProyecto(id){
      for (const x of await todos()) if (x.id === id || x.padre === id) await quitar(x.id);
      return true;
    },
    async listarVersiones(id){
      return (await todos()).filter(x => x.tipo === 'version' && x.padre === id).sort((a, b) => a.creada < b.creada ? 1 : -1)
        .map(x => ({ id:x.id, fecha:x.fecha, tamKB:kb(x.contenido) }));
    },
    async guardarImagen(nombre, dataUrl){
      const mime = (String(dataUrl).match(/^data:([^;,]+)/) || [])[1];
      const archivo = (limpiar(nombre) || 'diseño') + '.' + (EXT[mime] || 'bin');
      return { url:descargar(dataUrl, archivo), nombre:archivo };
    },
    async guardarPlantilla(nombre, contenido){
      nombre = limpiar(nombre) || 'Mi plantilla';
      for (const x of await todos()) if (x.tipo === 'plantilla' && x.nombre === nombre) await quitar(x.id);
      const p = { id:nuevoId(), tipo:'plantilla', nombre, contenido, fecha:ahora() };
      await poner(p); return { id:p.id, nombre };
    },
    async listarPlantillas(){
      return (await todos()).filter(x => x.tipo === 'plantilla').sort((a, b) => a.fecha < b.fecha ? 1 : -1).map(x => {
        let vista = ''; try { vista = JSON.parse(x.contenido).vista || ''; } catch(e){}
        return { id:x.id, nombre:x.nombre, vista, fecha:x.fecha };
      });
    },
    async compartirDiseno(){ return { archivo:true }; },
    async cargarCompartido(){ throw new Error('En la versión web los diseños se comparten como archivo'); },
    async guardarKit(contenido){ await poner({ id:'kit', tipo:'kit', nombre:'kit', contenido, fecha:ahora() }); return true; },
    async cargarKit(){ const o = await leer('kit'); return o ? o.contenido : ''; }
  };

  // Imita google.script.run: withSuccessHandler(...).withFailureHandler(...).funcion(...)
  function llamada(){
    let ok = () => {}, mal = e => console.error(e);
    const p = new Proxy({}, { get(_, k){
      if (k === 'withSuccessHandler') return f => { ok = f; return p; };
      if (k === 'withFailureHandler') return f => { mal = f; return p; };
      if (k === 'withUserObject') return () => p;
      return (...args) => {
        const f = FUNCIONES[k];
        Promise.resolve().then(() => { if (!f) throw new Error('No disponible en la versión web: ' + String(k)); return f(...args); })
          .then(r => ok(r), e => mal(e instanceof Error ? e : new Error(String(e))));
      };
    }});
    return p;
  }
  window.google = window.google || {};
  window.google.script = {
    run: new Proxy({}, { get(_, k){ return llamada()[k]; } }),
    url: { getLocation(cb){ cb({ parameter:Object.fromEntries(new URLSearchParams(location.search)), hash:location.hash.slice(1) }); } }
  };
})();

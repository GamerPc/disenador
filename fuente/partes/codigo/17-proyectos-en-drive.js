/* =========================================================
   PROYECTOS EN DRIVE
   ========================================================= */
function guardarDrive(){
  cargando(true);
  clearTimeout(autoGuardado._t);
  indicadorGuardado('guardando');
  google.script.run
    .withSuccessHandler(r => { cargando(false); enDrive = true; indicadorGuardado('ok'); toast('Diseño “' + r.nombre + '” guardado en Drive'); })
    .withFailureHandler(e => { cargando(false); indicadorGuardado('error'); toast('Error al guardar: ' + e.message); })
    .guardarProyecto(nombreArchivo(), serializar());
}
function listar(){
  $('listaProy').innerHTML = 'Cargando…';
  google.script.run
    .withSuccessHandler(lista => {
      if (!lista.length){ $('listaProy').innerHTML = '<p class="hint">Aún no tienes diseños guardados.</p>'; return; }
      $('listaProy').innerHTML = '';
      lista.forEach(p => {
        const d = document.createElement('div'); d.className = 'proy';
        d.innerHTML = `<div class="n"><b>${esc(p.nombre)}</b><small>${new Date(p.fecha).toLocaleString('es-MX')} · ${p.tamKB} KB</small></div>
          <button class="btnP">Abrir</button><button class="btnS" title="Versiones anteriores">🕘</button><button class="btnS" title="Eliminar">🗑</button>`;
        const [ba, bv, be] = d.querySelectorAll('button');
        bv.onclick = () => verVersiones(p, d);
        ba.onclick = () => abrirProyecto(p);
        be.onclick = () => { if (confirm('¿Mandar “' + p.nombre + '” a la papelera de Drive?')) google.script.run.withSuccessHandler(listar).eliminarProyecto(p.id); };
        $('listaProy').appendChild(d);
      });
    })
    .withFailureHandler(e => $('listaProy').textContent = 'Error: ' + e.message)
    .listarProyectos();
}
// Muestra las versiones anteriores de un diseño (se guardan solas en Drive, una cada 10 minutos como máximo)
function verVersiones(p, fila){
  const sig = fila.nextElementSibling;
  if (sig && sig.classList.contains('versiones')){ sig.remove(); return; }
  const cont = document.createElement('div'); cont.className = 'versiones';
  cont.style.cssText = 'background:#f8f7fc;border-radius:8px;margin:4px 0 8px 12px;padding:6px 10px;font-size:12.5px';
  cont.textContent = 'Buscando versiones…';
  fila.after(cont);
  gs('listarVersiones', p.id).then(lista => {
    if (!lista || !lista.length){ cont.innerHTML = '<span class="hint">Todavía no hay versiones anteriores. Se crean solas cuando guardas cambios (máximo una cada 10 minutos).</span>'; return; }
    cont.innerHTML = '<b style="display:block;margin-bottom:4px">Versiones anteriores</b>';
    lista.forEach(v => {
      const r = document.createElement('div'); r.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 0;border-top:1px solid #ece9f6';
      r.innerHTML = `<span style="flex:1">${new Date(v.fecha).toLocaleString('es-MX')} · ${v.tamKB} KB</span><button class="btnS" style="padding:5px 10px">Abrir esta versión</button>`;
      r.querySelector('button').onclick = () => {
        if (!confirm('Se abrirá la versión del ' + new Date(v.fecha).toLocaleString('es-MX') + '.\nTu diseño en Drive no cambia hasta que pulses 💾 Guardar. ¿Abrir?')) return;
        abrirProyecto({ id:v.id, nombre:p.nombre }, true);
      };
      cont.appendChild(r);
    });
  }).catch(e => { cont.textContent = 'No se pudieron cargar las versiones: ' + e.message; });
}
function abrirProyecto(p, esVersion){
  cargando(true);
  google.script.run
    .withSuccessHandler(txt => {
      $('nombreDiseno').value = p.nombre;
      historial = []; hi = -1; miniaturas = [];
      cargarJSON(txt, true, () => { cargando(false); cerrarModal('mProyectos'); enDrive = !esVersion; indicadorGuardado(esVersion ? 'cambios' : 'ok'); toast(esVersion ? 'Versión anterior abierta. Pulsa 💾 Guardar para quedarte con ella.' : 'Diseño abierto'); });
    })
    .withFailureHandler(e => { cargando(false); toast('Error: ' + e.message); })
    .cargarProyecto(p.id);
}
function nuevoDiseno(){
  enDrive = false; setTimeout(() => indicadorGuardado('nuevo'), 50);
  if (canvas.getObjects().length && !confirm('¿Empezar un diseño nuevo? Lo que no hayas guardado en Drive se perderá.')) return;
  restaurando = true; canvas.clear(); canvas.backgroundColor = '#ffffff'; restaurando = false;
  $('nombreDiseno').value = 'Mi diseño'; historial = []; hi = -1;
  paginas = [null]; actual = 0; miniaturas = []; notaPagina = ''; mostrarNotas();
  canvas.requestRenderAll(); renderCapas(); actualizarPanel(); guardarEstado();
}


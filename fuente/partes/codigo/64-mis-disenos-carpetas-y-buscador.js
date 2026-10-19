/* =========================================================
   MIS DISEÑOS: CARPETAS Y BUSCADOR
   ========================================================= */
let listaProyCache = [], carpetaActiva = '';           // '' = todas · '__sin' = sin carpeta
(function(){
  const barra = document.createElement('div'); barra.id = 'barraProy';
  barra.innerHTML = `<input type="search" id="buscarProy" class="buscador" placeholder="🔎 Buscar por nombre…">
    <select id="filtroCarpeta" title="Ver solo una carpeta"></select>
    <button class="btnS" id="bNuevaCarpeta" title="Crea una carpeta y mueve ahí el diseño abierto">＋ Carpeta</button>`;
  $('listaProy').before(barra);
  $('buscarProy').addEventListener('input', pintarProyectos);
  $('buscarProy').addEventListener('keydown', e => e.stopPropagation());
  $('filtroCarpeta').addEventListener('change', e => { carpetaActiva = e.target.value; pintarProyectos(); });
  $('bNuevaCarpeta').onclick = async () => {
    const n = (prompt('Nombre de la carpeta nueva (por ejemplo: Derecho Penal, Clientes, Logos):') || '').trim();
    if (!n) return;
    const actual = listaProyCache.find(p => p.nombre === nombreArchivo().replace(/[\\/:*?"<>|]/g, '').trim());
    if (!actual) return toast('Guarda primero tu diseño (💾 Guardar) y luego usa 📁 en la lista para moverlo a “' + n + '”.');
    await moverDiseno(actual, n);
  };
})();
const nombreCarpeta = c => c || 'Sin carpeta';
async function moverDiseno(p, carpeta){
  try {
    await gs('moverACarpeta', p.id, carpeta);
    p.carpeta = carpeta; toast(carpeta ? '“' + p.nombre + '” ahora está en 📁 ' + carpeta : '“' + p.nombre + '” quedó sin carpeta');
    pintarProyectos();
  } catch (e) { toast('No se pudo mover: ' + e.message); }
}
function pedirCarpeta(p){
  const existentes = [...new Set(listaProyCache.map(x => x.carpeta).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const r = prompt('¿A qué carpeta mueves “' + p.nombre + '”?\n' + (existentes.length ? 'Tus carpetas: ' + existentes.join(' · ') + '\n' : '') +
    'Escribe el nombre (si no existe, se crea). Déjalo vacío para quitarlo de su carpeta.', p.carpeta || '');
  if (r === null) return;
  moverDiseno(p, r.trim().slice(0, 60));
}
listar = function(){
  $('listaProy').innerHTML = 'Cargando…';
  google.script.run
    .withSuccessHandler(lista => { listaProyCache = Array.isArray(lista) ? lista : []; pintarProyectos(); })
    .withFailureHandler(e => $('listaProy').textContent = 'Error: ' + e.message)
    .listarProyectos();
};
function pintarProyectos(){
  const lista = listaProyCache, cont = $('listaProy');
  const carpetas = [...new Set(lista.map(p => p.carpeta).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const sel = $('filtroCarpeta');
  if (carpetaActiva && carpetaActiva !== '__sin' && !carpetas.includes(carpetaActiva)) carpetaActiva = '';
  sel.innerHTML = `<option value="">📁 Todas (${lista.length})</option>` +
    carpetas.map(c => `<option value="${esc(c)}">📁 ${esc(c)} (${lista.filter(p => p.carpeta === c).length})</option>`).join('') +
    (carpetas.length ? `<option value="__sin">Sin carpeta (${lista.filter(p => !p.carpeta).length})</option>` : '');
  sel.value = carpetaActiva;
  if (!lista.length){ cont.innerHTML = '<p class="hint">Aún no tienes diseños guardados.</p>'; return; }
  const q = sinAcentos($('buscarProy').value.trim());
  const vista = lista.filter(p => (!q || sinAcentos(p.nombre).includes(q)) &&
    (!carpetaActiva || (carpetaActiva === '__sin' ? !p.carpeta : p.carpeta === carpetaActiva)));
  cont.innerHTML = '';
  if (!vista.length){ cont.innerHTML = '<p class="hint">No hay diseños con ese nombre en esta carpeta.</p>'; return; }
  // Agrupados por carpeta cuando se ven todas
  const grupos = carpetaActiva ? [[carpetaActiva === '__sin' ? '' : carpetaActiva, vista]]
    : [...carpetas, ''].map(c => [c, vista.filter(p => (p.carpeta || '') === c)]).filter(([, v]) => v.length);
  grupos.forEach(([c, items]) => {
    if (!carpetaActiva && carpetas.length){
      const h = document.createElement('div'); h.className = 'tituloCarpeta';
      h.innerHTML = `<span>${c ? '📁 ' + esc(c) : '📄 Sin carpeta'}</span><small>${items.length}</small>`;
      if (c) h.onclick = () => { carpetaActiva = c; pintarProyectos(); };
      cont.appendChild(h);
    }
    items.forEach(p => {
      const d = document.createElement('div'); d.className = 'proy';
      d.innerHTML = `<div class="n"><b>${esc(p.nombre)}</b><small>${new Date(p.fecha).toLocaleString('es-MX')} · ${p.tamKB} KB${p.carpeta && carpetaActiva !== p.carpeta && !carpetas.length ? '' : ''}</small></div>
        <button class="btnP">Abrir</button><button class="btnS" title="Mover a una carpeta">📁</button><button class="btnS" title="Versiones anteriores">🕘</button><button class="btnS" title="Eliminar">🗑</button>`;
      const [ba, bc, bv, be] = d.querySelectorAll('button');
      ba.onclick = () => abrirProyecto(p);
      bc.onclick = () => pedirCarpeta(p);
      bv.onclick = () => verVersiones(p, d);
      be.onclick = () => { if (confirm('¿Mandar “' + p.nombre + '” a la papelera de Drive?')) google.script.run.withSuccessHandler(listar).eliminarProyecto(p.id); };
      cont.appendChild(d);
    });
  });
}


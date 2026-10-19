/* =========================================================
   ARCHIVOS DEL EQUIPO Y DONACIONES
   ========================================================= */
const CONFIG = Object.assign({ donaciones:[], mensajeDonacion:'' }, window.APIK_CONFIG || {});
if (window.MODO_WEB) document.body.classList.add('modoWeb');
// Descargar el diseño como archivo (copia de seguridad, para pasarlo a otra computadora o compartirlo)
function descargarDisenoArchivo(){
  canvas.discardActiveObject(); canvas.requestRenderAll();
  bajarBlob(new Blob([serializar()], { type:'application/json' }), nombreArchivo() + '.apik.json');
  toast('Se descargó tu diseño. Para abrirlo: 📂 Abrir → “Abrir un archivo”.');
}
$('archivoDiseno').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const lector = new FileReader();
  lector.onload = () => {
    const txt = lector.result;
    try { const d = JSON.parse(txt); if (!d || !(d.p || d.c)) throw new Error('formato'); }
    catch (err) { toast('Ese archivo no es un diseño de esta app'); return; }
    $('nombreDiseno').value = f.name.replace(/\.apik\.json$|\.json$/i, '') || 'Mi diseño';
    historial = []; hi = -1; miniaturas = [];
    cargarJSON(txt, true, () => { cerrarModal('mProyectos'); enDrive = false; indicadorGuardado('nuevo'); toast('Diseño abierto desde tu archivo. Pulsa 💾 Guardar para conservarlo aquí.'); });
  };
  lector.readAsText(f);
});
// Ventana de donaciones (los enlaces se configuran en config.js)
function abrirDonaciones(){
  const lista = (CONFIG.donaciones || []).filter(d => d && /^https?:\/\//i.test(d.url || ''));
  $('textoDonacion').textContent = CONFIG.mensajeDonacion ||
    'Este diseñador es gratuito. Si te sirve para tus tareas, exposiciones o tu negocio, puedes apoyarnos con una donación para seguir agregando funciones y pagar el servidor.';
  $('listaDonaciones').innerHTML = lista.length
    ? lista.map(d => `<a class="donBtn" href="${esc(d.url)}" target="_blank" rel="noopener"><b>${esc(d.icono || '❤')} ${esc(d.nombre || 'Donar')}</b>${d.detalle ? `<span>${esc(d.detalle)}</span>` : ''}</a>`).join('')
    : '<p class="hint">Muy pronto podrás apoyar el proyecto desde aquí.</p>';
  abrirModal('mDonar');
}


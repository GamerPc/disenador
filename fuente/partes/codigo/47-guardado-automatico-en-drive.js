/* =========================================================
   GUARDADO AUTOMÁTICO EN DRIVE
   ========================================================= */
let enDrive = false, guardandoDrive = false, cambiosPendientes = false;
let autoDrive = true;
try { autoDrive = localStorage.getItem('disenador_autodrive') !== '0'; } catch(e){}
$('autoDrive').checked = autoDrive;
$('autoDrive').onchange = e => {
  autoDrive = e.target.checked;
  try { localStorage.setItem('disenador_autodrive', autoDrive ? '1' : '0'); } catch(_){}
  if (autoDrive && enDrive && cambiosPendientes) autoGuardado();
};
function indicadorGuardado(estado){
  const el = $('estadoGuardado'); if (!el) return;
  const hora = new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
  if (estado === 'ok'){ cambiosPendientes = false; el.textContent = '✓ Guardado ' + hora; }
  else if (estado === 'guardando') el.textContent = 'Guardando…';
  else if (estado === 'cambios') el.textContent = enDrive ? (autoDrive ? 'Cambios sin guardar…' : '● Cambios sin guardar') : 'No guardado en Drive';
  else if (estado === 'error') el.textContent = '⚠ No se pudo guardar';
  else el.textContent = 'No guardado en Drive';
}
// Se llama con cada cambio: si el diseño ya está en Drive, se guarda solo unos segundos después
function autoGuardado(){
  cambiosPendientes = true;
  indicadorGuardado('cambios');
  if (!autoDrive || !enDrive) return;
  clearTimeout(autoGuardado._t);
  autoGuardado._t = setTimeout(guardarDriveSilencioso, 15000);
}
function guardarDriveSilencioso(){
  if (!enDrive || !autoDrive || pres) return;
  if (guardandoDrive){ autoGuardado._t = setTimeout(guardarDriveSilencioso, 5000); return; }
  guardandoDrive = true; indicadorGuardado('guardando');
  gs('guardarProyecto', nombreArchivo(), serializar())
    .then(() => indicadorGuardado('ok'))
    .catch(() => indicadorGuardado('error'))
    .finally(() => { guardandoDrive = false; });
}
window.addEventListener('beforeunload', e => {
  if (enDrive && cambiosPendientes){ e.preventDefault(); e.returnValue = ''; }
});


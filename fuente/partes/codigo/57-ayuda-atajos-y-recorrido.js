/* =========================================================
   AYUDA, ATAJOS Y RECORRIDO
   ========================================================= */
const ATAJOS = [
  ['Ctrl + Z', 'Deshacer'], ['Ctrl + Y', 'Rehacer'], ['Ctrl + S', 'Guardar en Drive'], ['Ctrl + C / Ctrl + V', 'Copiar y pegar'],
  ['Ctrl + D', 'Duplicar'], ['Supr', 'Eliminar lo seleccionado'], ['Ctrl + A', 'Seleccionar todo'], ['Ctrl + G', 'Agrupar / desagrupar'],
  ['Ctrl + Alt + C / V', 'Copiar y pegar solo el estilo'], ['Flechas', 'Mover 1 px (con Shift, 10 px)'], ['Tab', 'Agregar una idea conectada (en mapas)'],
  ['C', 'Modo conector (unir formas)'], ['Ctrl + F', 'Buscar y reemplazar texto'], ['Doble clic', 'Editar un texto'], ['Esc', 'Salir del modo actual / quitar selección'],
  ['?', 'Abrir esta ayuda'], ['En la presentación: → ← Esc N', 'Avanzar, regresar, salir y ver tus notas'], ['Ctrl + rueda del mouse', 'Acercar / alejar']
];
$('listaAtajos').innerHTML = ATAJOS.map(([t, d]) => `<div class="atajo"><kbd>${esc(t)}</kbd><span>${esc(d)}</span></div>`).join('');
const PASOS_RECORRIDO = [
  ['#pestanas', 'Aquí está todo lo que puedes agregar: plantillas, textos, formas, elementos, dibujos, imágenes, diagramas, fondos y tu marca.'],
  ['#lateral', 'En este panel eliges lo que quieres agregar. Empieza con una plantilla o una presentación completa.'],
  ['#envoltura', 'Este es tu lienzo. Haz clic en algo para seleccionarlo, arrástralo para moverlo y usa las esquinas para cambiar su tamaño. Doble clic en un texto para escribir.'],
  ['#props', 'Cuando seleccionas algo, aquí cambias su color, letra, borde, animación y orden.'],
  ['#paginas', 'Tus páginas o diapositivas. Agrega, duplica o reordena. Arriba de ellas están tus notas del presentador.'],
  ['#tamTxt', 'Cambia el tamaño del diseño. Con “Acomodar el contenido”, todo se ajusta solo al nuevo tamaño.'],
  ['[onclick*="mPresentar"]', 'Presenta en pantalla completa con animaciones, o con la vista del presentador.'],
  ['[onclick*="mExportar"]', 'Descarga PNG, JPG, PDF para imprimir, PowerPoint o video.'],
  ['[onclick*="guardarDrive"]', 'Guarda en tu Google Drive. También se guarda solo mientras trabajas.'],
  ['[onclick*="mCompartir"]', 'Comparte una copia con tus compañeros por enlace o WhatsApp. ¡Listo, ya conoces lo básico!']
];
let pasoRec = -1;
function iniciarRecorrido(){ cerrarModal('mAyuda'); $('bienvenida').style.display = 'none'; try { localStorage.setItem('disenador_recorrido', '1'); } catch(e){} pasoRec = -1; siguientePaso(1); }
function siguientePaso(d){
  pasoRec += d;
  while (pasoRec >= 0 && pasoRec < PASOS_RECORRIDO.length){
    const el = document.querySelector(PASOS_RECORRIDO[pasoRec][0]);
    if (el && el.getBoundingClientRect().width > 0) break;
    pasoRec += d || 1;
  }
  if (pasoRec < 0) pasoRec = 0;
  if (pasoRec >= PASOS_RECORRIDO.length){ terminarRecorrido(); return; }
  const [sel, texto] = PASOS_RECORRIDO[pasoRec], el = document.querySelector(sel), r = el.getBoundingClientRect();
  const foco = $('recFoco'), caja = $('recCaja');
  $('recorrido').style.display = 'block';
  Object.assign(foco.style, { left:(r.left - 6) + 'px', top:(r.top - 6) + 'px', width:(r.width + 12) + 'px', height:(r.height + 12) + 'px' });
  $('recTexto').textContent = texto;
  $('recNum').textContent = (pasoRec + 1) + ' / ' + PASOS_RECORRIDO.length;
  $('recSig').textContent = pasoRec === PASOS_RECORRIDO.length - 1 ? 'Terminar' : 'Siguiente →';
  $('recAnt').style.visibility = pasoRec ? 'visible' : 'hidden';
  const cw = Math.min(340, window.innerWidth - 24), ch = caja.offsetHeight || 150;
  let x = r.right + 16, y = r.top;
  if (x + cw > window.innerWidth - 12) x = r.left - cw - 16;
  if (x < 12){ x = Math.max(12, Math.min(window.innerWidth - cw - 12, r.left + r.width / 2 - cw / 2)); y = r.bottom + 16; if (y + ch > window.innerHeight - 12) y = r.top - ch - 16; }
  y = Math.max(12, Math.min(window.innerHeight - ch - 12, y));
  Object.assign(caja.style, { left:x + 'px', top:y + 'px', width:cw + 'px' });
}
function terminarRecorrido(){ $('recorrido').style.display = 'none'; pasoRec = -1; }
window.addEventListener('resize', () => { if (pasoRec >= 0) siguientePaso(0); });
document.addEventListener('keydown', e => {
  const tag = (document.activeElement || {}).tagName, o = activo();
  if (pasoRec >= 0){
    if (e.key === 'Escape'){ e.preventDefault(); terminarRecorrido(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter'){ e.preventDefault(); siguientePaso(1); }
    else if (e.key === 'ArrowLeft'){ e.preventDefault(); siguientePaso(-1); }
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F' || e.key === 'h' || e.key === 'H')){ e.preventDefault(); abrirBuscar(); return; }
  if (['INPUT','SELECT','TEXTAREA'].includes(tag) || (o && o.isEditing)) return;
  if (e.key === '?'){ e.preventDefault(); abrirModal('mAyuda'); }
});
// Bienvenida para quien entra por primera vez (no estorba: se puede ignorar)
(function(){
  let visto = false; try { visto = localStorage.getItem('disenador_recorrido') === '1'; } catch(e){}
  if (!visto) setTimeout(() => { $('bienvenida').style.display = 'flex'; }, 1800);
})();
function cerrarBienvenida(){ $('bienvenida').style.display = 'none'; try { localStorage.setItem('disenador_recorrido', '1'); } catch(e){} }


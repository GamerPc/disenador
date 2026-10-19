/* =========================================================
   COMPARTIR CON COMPAÑEROS
   ========================================================= */
async function crearEnlaceCompartir(){
  canvas.discardActiveObject(); canvas.requestRenderAll();
  cargando(true);
  try {
    const nombre = $('nombreDiseno').value || 'Mi diseño';
    const r = await gs('compartirDiseno', nombre, serializar());
    if (r && r.archivo){
      cerrarModal('mCompartir'); descargarDisenoArchivo();
      toast('Se descargó tu diseño como archivo: mándalo a tu compañero y que lo abra con 📂 Abrir → “Abrir un archivo”.');
      return;
    }
    $('cLink').value = r.url; $('cResultado').hidden = false;
    $('cAviso').textContent = r.publico ? 'Cualquier persona con el enlace podrá abrir una copia (necesita entrar con su cuenta de Google).'
      : 'Tu cuenta no permite compartir con cualquiera: solo personas de tu misma escuela u organización podrán abrirlo.';
    $('cWhats').href = 'https://wa.me/?text=' + encodeURIComponent('Te comparto mi diseño “' + nombre + '”: ' + r.url);
  } catch (e) { toast('No se pudo crear el enlace: ' + e.message); }
  finally { cargando(false); }
}
function copiarEnlace(){
  const i = $('cLink'); i.focus(); i.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch(e){}
  if (!ok && navigator.clipboard) navigator.clipboard.writeText(i.value).then(() => toast('Enlace copiado'), () => toast('Selecciona el enlace y cópialo (Ctrl+C)'));
  else toast(ok ? 'Enlace copiado' : 'Selecciona el enlace y cópialo (Ctrl+C)');
}
// Si la app se abrió con ?copia=ID, carga esa copia
function abrirCompartidoSiHay(){
  return new Promise(ok => {
    try {
      if (!(window.google && google.script && google.script.url)) return ok(false);
      google.script.url.getLocation(loc => {
        const id = loc && loc.parameter && loc.parameter.copia;
        if (!id) return ok(false);
        ok(true); cargando(true);
        gs('cargarCompartido', id).then(r => {
          $('nombreDiseno').value = 'Copia de ' + r.nombre;
          historial = []; hi = -1; miniaturas = [];
          cargarJSON(r.contenido, true, () => {
            cargando(false); enDrive = false; indicadorGuardado('nuevo');
            toast('Abriste una copia de “' + r.nombre + '”. Pulsa 💾 Guardar para tenerla en tu Drive.');
          });
        }).catch(e => { cargando(false); ajustarZoom(); guardarEstado(); toast('No se pudo abrir el diseño compartido: ' + e.message); });
      });
    } catch (e) { ok(false); }
  });
}


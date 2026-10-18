/**
 * Diseñador Gratis — editor tipo Canva en Google Apps Script
 * Archivo: Code.gs  (lado del servidor)
 *
 * Funciones:
 *  - Sirve la aplicación web (Index.html + Codigo1, Codigo2 y Codigo3)
 *  - Guarda / abre / elimina proyectos (.json) en una carpeta de tu Google Drive
 *  - Guarda las exportaciones (PNG, JPG, PDF, PowerPoint o video MP4) en Drive
 *  - Guarda y lista tus plantillas propias
 *  - Guarda versiones anteriores de cada diseño (historial)
 *  - Crea enlaces para compartir una copia de un diseño
 *  - Guarda tu kit de marca (colores, letras y logo)
 */

const NOMBRE_CARPETA = 'Diseñador Gratis';
const SUBCARPETA_IMAGENES = 'Exportaciones';
const SUBCARPETA_PLANTILLAS = 'Mis plantillas';
const SUBCARPETA_VERSIONES = 'Versiones';
const MINUTOS_ENTRE_VERSIONES = 10;   // como máximo una versión cada 10 minutos
const MAX_VERSIONES = 20;             // versiones que se conservan por diseño
const SUBCARPETA_COMPARTIDOS = 'Compartidos';
const ARCHIVO_KIT = 'kit-de-marca.json';

function doGet() {
  // Index.html incluye los archivos Codigo1, Codigo2 y Codigo3 (el programa dividido en partes)
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Diseñador Gratis')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Inserta el contenido de otro archivo HTML del proyecto (se usa desde Index.html). */
function include(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

/* ---------- Utilidades internas ---------- */

function carpeta_() {
  const it = DriveApp.getFoldersByName(NOMBRE_CARPETA);
  return it.hasNext() ? it.next() : DriveApp.createFolder(NOMBRE_CARPETA);
}

function subcarpeta_(padre, nombre) {
  const it = padre.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : padre.createFolder(nombre);
}

function limpiarNombre_(nombre) {
  return String(nombre || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .substring(0, 80);
}

/* ---------- Proyectos ---------- */

/**
 * Guarda (o sobrescribe) un proyecto.
 * @param {string} nombre  Nombre del diseño
 * @param {string} contenido  JSON del diseño
 */
function guardarProyecto(nombre, contenido) {
  nombre = limpiarNombre_(nombre) || 'Sin título';
  const carpeta = carpeta_();
  const archivo = nombre + '.json';

  // Si ya existe uno con el mismo nombre se actualiza en su lugar (así el guardado automático
  // no llena la papelera); si es muy grande para actualizarse, se reemplaza el archivo.
  const existentes = carpeta.getFilesByName(archivo);
  if (existentes.hasNext()) {
    const file = existentes.next();
    while (existentes.hasNext()) existentes.next().setTrashed(true);
    try { guardarVersion_(file); } catch (e) {}   // copia de lo que había antes de este guardado
    if (contenido.length < 9 * 1024 * 1024) {
      file.setContent(contenido);
      return { id: file.getId(), nombre: nombre };
    }
    file.setTrashed(true);
  }
  const file = carpeta.createFile(Utilities.newBlob(contenido, 'application/json', archivo));
  return { id: file.getId(), nombre: nombre };
}

/** Lista los proyectos guardados, del más reciente al más antiguo. */
function listarProyectos() {
  const carpeta = carpeta_();
  const files = carpeta.getFiles();
  const lista = [];
  while (files.hasNext()) {
    const f = files.next();
    const n = f.getName();
    if (!/\.json$/i.test(n) || n === ARCHIVO_KIT) continue;
    lista.push({
      id: f.getId(),
      nombre: n.replace(/\.json$/i, ''),
      fecha: f.getLastUpdated().toISOString(),
      tamKB: Math.round(f.getSize() / 1024)
    });
  }
  lista.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  return lista;
}

/** Devuelve el contenido JSON de un proyecto. */
function cargarProyecto(id) {
  return DriveApp.getFileById(id).getBlob().getDataAsString();
}

/** Manda un proyecto a la papelera de Drive (se puede recuperar desde ahí). */
function eliminarProyecto(id) {
  DriveApp.getFileById(id).setTrashed(true);
  return true;
}

/* ---------- Historial de versiones ---------- */

function versionesDe_(id) {
  const destino = subcarpeta_(carpeta_(), SUBCARPETA_VERSIONES);
  const it = destino.searchFiles("title contains '" + id + "__' and trashed = false");
  const lista = [];
  while (it.hasNext()) {
    const f = it.next();
    const m = f.getName().match(/__(\d+)\.json$/);
    if (f.getName().indexOf(id + '__') === 0 && m) lista.push({ file: f, t: Number(m[1]) });
  }
  lista.sort((a, b) => b.t - a.t);
  return lista;
}

/** Antes de sobrescribir un diseño guarda una copia de cómo estaba (si la última copia tiene más de 10 minutos). */
function guardarVersion_(file) {
  const id = file.getId();
  const versiones = versionesDe_(id);
  if (versiones.length && Date.now() - versiones[0].file.getDateCreated().getTime() < MINUTOS_ENTRE_VERSIONES * 60 * 1000) return;
  const t = file.getLastUpdated().getTime();
  subcarpeta_(carpeta_(), SUBCARPETA_VERSIONES)
    .createFile(Utilities.newBlob(file.getBlob().getDataAsString(), 'application/json', id + '__' + t + '.json'));
  versiones.slice(MAX_VERSIONES - 1).forEach(v => v.file.setTrashed(true));
}

/** Lista las versiones anteriores de un diseño (la más reciente primero). */
function listarVersiones(id) {
  return versionesDe_(id).map(v => ({
    id: v.file.getId(),
    fecha: new Date(v.t).toISOString(),
    tamKB: Math.round(v.file.getSize() / 1024)
  }));
}

/* ---------- Compartir ---------- */

/** Guarda una copia del diseño y devuelve un enlace a la app que abre esa copia. */
function compartirDiseno(nombre, contenido) {
  nombre = limpiarNombre_(nombre) || 'Diseño';
  const destino = subcarpeta_(carpeta_(), SUBCARPETA_COMPARTIDOS);
  const file = destino.createFile(Utilities.newBlob(contenido, 'application/json', nombre + ' (compartido).json'));
  let publico = true;
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (e) {
    publico = false;
    try { file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); } catch (e2) {}
  }
  return { id: file.getId(), url: ScriptApp.getService().getUrl() + '?copia=' + file.getId(), publico: publico };
}

/** Lee un diseño compartido (para abrir una copia). */
function cargarCompartido(id) {
  if (!/^[\w-]{10,}$/.test(String(id))) throw new Error('El enlace no es válido');
  const file = DriveApp.getFileById(id);
  return { nombre: file.getName().replace(/ \(compartido\)\.json$/i, '').replace(/\.json$/i, ''), contenido: file.getBlob().getDataAsString() };
}

/* ---------- Kit de marca ---------- */

function guardarKit(contenido) {
  const it = carpeta_().getFilesByName(ARCHIVO_KIT);
  if (it.hasNext()) it.next().setContent(contenido);
  else carpeta_().createFile(Utilities.newBlob(contenido, 'application/json', ARCHIVO_KIT));
  return true;
}

function cargarKit() {
  const it = carpeta_().getFilesByName(ARCHIVO_KIT);
  return it.hasNext() ? it.next().getBlob().getDataAsString() : '';
}

/* ---------- Imágenes ---------- */

/**
 * Guarda en Drive una exportación: imagen (PNG/JPG), PDF, PowerPoint (PPTX) o video (MP4/WebM).
 * @param {string} nombre   Nombre del archivo (sin extensión)
 * @param {string} dataUrl  "data:image/png;base64,..." o "data:application/pdf;...;base64,..."
 */
function guardarImagen(nombre, dataUrl) {
  const m = String(dataUrl).match(/^data:([a-z]+\/[a-z0-9.+-]+)(?:;[^,;]*)*;base64,(.+)$/i);
  if (!m) throw new Error('Formato de archivo no válido');
  const mime = m[1].toLowerCase();
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'video/mp4': 'mp4', 'video/webm': 'webm' }[mime];
  if (!ext) throw new Error('Tipo de archivo no permitido: ' + mime);
  nombre = (limpiarNombre_(nombre) || 'diseño') + '.' + ext;

  const bytes = Utilities.base64Decode(m[2]);
  const blob = Utilities.newBlob(bytes, mime, nombre);
  const destino = subcarpeta_(carpeta_(), SUBCARPETA_IMAGENES);
  const file = destino.createFile(blob);
  return { url: file.getUrl(), nombre: nombre };
}

/* ---------- Mis plantillas ---------- */

/** Guarda (o reemplaza) una plantilla propia en la carpeta "Mis plantillas". */
function guardarPlantilla(nombre, contenido) {
  nombre = limpiarNombre_(nombre) || 'Mi plantilla';
  const destino = subcarpeta_(carpeta_(), SUBCARPETA_PLANTILLAS);
  const archivo = nombre + '.json';
  const existentes = destino.getFilesByName(archivo);
  while (existentes.hasNext()) existentes.next().setTrashed(true);
  const file = destino.createFile(Utilities.newBlob(contenido, 'application/json', archivo));
  return { id: file.getId(), nombre: nombre };
}

/** Lista tus plantillas con su miniatura (la más reciente primero). */
function listarPlantillas() {
  const destino = subcarpeta_(carpeta_(), SUBCARPETA_PLANTILLAS);
  const files = destino.getFiles();
  const lista = [];
  while (files.hasNext()) {
    const f = files.next();
    if (!/\.json$/i.test(f.getName())) continue;
    let vista = '';
    try { vista = JSON.parse(f.getBlob().getDataAsString()).vista || ''; } catch (e) {}
    lista.push({ id: f.getId(), nombre: f.getName().replace(/\.json$/i, ''), vista: vista, fecha: f.getLastUpdated().toISOString() });
  }
  lista.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  return lista;
}

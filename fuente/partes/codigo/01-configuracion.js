/* =========================================================
   CONFIGURACIÓN
   ========================================================= */
const $ = id => document.getElementById(id);
const FUENTES = ['Inter','Montserrat','Poppins','Roboto','Raleway','Oswald','Bebas Neue','Anton',
  'Playfair Display','Lobster','Pacifico','Dancing Script','Fredoka','Patrick Hand','Caveat','Gochi Hand','Amatic SC',
  'Permanent Marker','Shadows Into Light','Gloria Hallelujah','Orbitron','Audiowide','Exo 2','Righteous','UnifrakturMaguntia','Arial','Georgia','Times New Roman','Courier New','Verdana'];
const TAMANOS = [
  ['Publicación de Instagram', 1080, 1080],
  ['Historia de Instagram / TikTok', 1080, 1920],
  ['Publicación de Facebook', 1200, 630],
  ['Portada de Facebook', 1640, 624],
  ['Miniatura de YouTube', 1280, 720],
  ['Presentación 16:9', 1920, 1080],
  ['Hoja carta (300 dpi)', 2550, 3300],
  ['A4 (300 dpi)', 2480, 3508],
  ['Póster vertical', 1800, 2700],
  ['Logo', 500, 500],
  ['Tarjeta de presentación', 1050, 600],
  ['Invitación 5×7', 1500, 2100]
];
const COLORES = ['#ffffff','#000000','#f3f4f6','#9ca3af','#374151','#7c3aed','#a78bfa','#2563eb','#06b6d4','#10b981',
  '#84cc16','#facc15','#f59e0b','#f97316','#ef4444','#ec4899','#fde2e4','#e0f2fe'];
const DEGRADADOS = [['#7c3aed','#06b6d4'],['#f97316','#ec4899'],['#10b981','#3b82f6'],['#facc15','#f97316'],
  ['#0f172a','#334155'],['#fbc2eb','#a6c1ee'],['#ff9a9e','#fecfef'],['#43e97b','#38f9d7'],['#fa709a','#fee140'],
  ['#30cfd0','#330867'],['#a18cd1','#fbc2eb'],['#232526','#414345']];
const EXTRA = ['name','bloqueado','fx','selectable','evented','lockMovementX','lockMovementY',
  'lockScalingX','lockScalingY','lockRotation','hasControls','editable','esFondo',
  'id','formaTexto','textoDe','altoBase','anchoBase','anchoMax','conA','conB','flecha','perPixelTargetFind','objectCaching',
  'estilo','etiqueta','dir','forma','orient','horiz','ladoA','ladoB','modo','inicio','fin','patron','fijo','tabla','fila','col','sepTabla','esDeco','grafica','trazoLibre','marco','marcoVacio','anim','nombrePropio','curva','efectoTexto','rellenoOriginal'];

let W = 1080, H = 1080, zoom = 1;
let historial = [], hi = -1, restaurando = false;
let portapapeles = null;
let paginas = [null], actual = 0, miniaturas = [];
let generandoVista = false;
let presConfig = { transicion:'desvanecer', avance:'manual', segundos:6 };   // mientras se dibujan las miniaturas de plantillas no se toca el diseño
const PAGINA_VACIA = () => ({ version: fabric.version, objects: [], background: '#ffffff' });


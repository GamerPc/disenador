# Arma las dos versiones de la app a partir de la versión completa (fuente/Index.completo.html):
#   - apps-script/  → para Google Apps Script (guarda en Google Drive)
#   - index.html + js/  → versión web para GitHub Pages u otro hosting (guarda en el navegador)
# Uso:  python3 fuente/construir.py
import re, glob, os, json, shutil
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
FUENTE = RAIZ + 'fuente/'
base = RAIZ + 'apps-script/'
os.makedirs(base, exist_ok=True); os.makedirs(RAIZ + 'js', exist_ok=True)
h = open(FUENTE + 'Index.completo.html', encoding='utf-8').read()
h0 = h
cfg = open(RAIZ + 'config.js', encoding='utf-8').read()
assert '<?' not in cfg and '</script' not in cfg.lower()
m = list(re.finditer(r'<script>\n(.*?)</script>', h, re.S))[-1]
js = m.group(1)

# 0) revisión: no puede haber dos funciones o variables globales con el mismo nombre (una taparía a la otra)
from collections import Counter
nombres = re.findall(r'^(?:async\s+)?function\s+([\w$]+)', js, re.M) + re.findall(r'^(?:const|let|var)\s+([\w$]+)', js, re.M)
rep_ = [n for n, c in Counter(nombres).items() if c > 1]
assert not rep_, 'nombres repetidos: ' + ', '.join(rep_)
# 1) dividir el programa en partes: máximo ~55 KB, y algunas secciones van solas en su archivo
js = js.rstrip() + '\nwindow.__appLista = true;\n'
cabeceras = list(re.finditer(r'\n/\* =========================================================\n   ([^\n]*)', js))
SOLAS = ('EXPORTAR VIDEO', 'PESTAÑAS E INICIO')   # si una de estas falla, lo demás sigue funcionando
LIMITE = 55000
cortes = [(mm.start(), any(mm.group(1).startswith(x) for x in SOLAS)) for mm in cabeceras] + [(len(js), True)]
cortes = [(c, f or (k > 0 and cortes[k - 1][1])) for k, (c, f) in enumerate(cortes)]   # también se corta justo después
partes, inicio, ultimo = [], 0, 0
for c, forzar in cortes:
    if len(js[inicio:c].encode('utf-8')) > LIMITE and ultimo > inicio:
        partes.append(js[inicio:ultimo]); inicio = ultimo
    if forzar and c > inicio and c < len(js):
        partes.append(js[inicio:c]); inicio = c
    ultimo = c
partes.append(js[inicio:])
partes = [p for p in partes if p.strip()]
assert ''.join(partes) == js
for viejo in glob.glob(base + 'Codigo*.html'): os.remove(viejo)
esperado = {}
for i, p in enumerate(partes, 1):
    nombre = f'Codigo{i}'
    texto = f"\n/*@parte {nombre}*/ (window.__partes = window.__partes || {{}})['{nombre}'] = true;\n" + p + '\n'
    esperado[nombre] = { 'chars': len(texto.encode('utf-16-le')) // 2, 'lineas': texto.count('\n') }
    open(base + nombre + '.html', 'w', encoding='utf-8').write('<script>' + texto + '</script>\n')
N = len(partes)

# 2) aviso de errores al cargar (dice qué archivo falló, en qué línea y qué contiene esa línea)
aviso = '''<script>
// Si algo falla al cargar, se muestra aquí en vez de dejar la pantalla en blanco
window.__erroresCarga = []; window.__lineasError = [];
window.__esperado = ''' + json.dumps(esperado) + ''';
function __mostrarErrorCarga(msg){
  window.__erroresCarga.push(msg);
  var pintar = function(){
    var d = document.getElementById('avisoError');
    if (!d){ d = document.createElement('div'); d.id = 'avisoError';
      d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;background:#b91c1c;color:#fff;padding:12px 16px;border-radius:10px;font:13px/1.45 sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.3);white-space:pre-wrap;max-height:60vh;overflow:auto';
      var x = document.createElement('button'); x.textContent = 'Cerrar'; x.style.cssText = 'float:right;margin-left:10px;border:0;border-radius:6px;padding:3px 10px';
      x.onclick = function(){ d.style.display = 'none'; };
      d.appendChild(x); d.appendChild(document.createElement('span'));
      document.body.appendChild(d); }
    d.lastChild.textContent = '⚠ La aplicación no pudo cargar bien. Toma una captura de este mensaje:\\n\\n' + window.__erroresCarga.join('\\n');
  };
  if (document.body) pintar(); else document.addEventListener('DOMContentLoaded', pintar);
}
window.addEventListener('error', function(e){
  if (e.lineno) window.__lineasError.push(e.lineno);
  __mostrarErrorCarga((e.message || 'Error') + (e.lineno ? ' (línea ' + e.lineno + ')' : ''));
});
function __diagnostico(){
  var partes = window.__partes || {}, msgs = [];
  var scripts = Array.prototype.slice.call(document.getElementsByTagName('script'));
  Object.keys(window.__esperado).forEach(function(n){
    if (partes[n]) return;
    var esp = window.__esperado[n];
    var s = scripts.filter(function(x){ return (x.text || '').indexOf('/*@parte ' + n + '*/') >= 0; })[0];
    if (!s){ msgs.push('• ' + n + ': no se encontró (¿falta el archivo, está vacío o le falta el inicio?).'); return; }
    var t = s.text, lineas = t.split('\\n');
    var m = '• ' + n + ': no se pudo ejecutar. Tiene ' + t.length + ' caracteres y ' + (lineas.length - 1) + ' líneas (deberían ser ' + esp.chars + ' y ' + esp.lineas + ').';
    var errTotal = null;
    try { new Function(t); m += ' (el código se lee bien aquí)'; } catch (err){ errTotal = err.message; m += '\\n   Error: ' + err.message; }
    if (errTotal){                       // busca la primera línea donde aparece el error
      var bajo = 1, alto = lineas.length;
      var falla = function(k){ try { new Function(lineas.slice(0, k).join('\\n')); return false; } catch (e2){ return e2.message === errTotal; } };
      while (bajo < alto){ var med = (bajo + alto) >> 1; if (falla(med)) alto = med; else bajo = med + 1; }
      m += '\\n   Línea ' + bajo + ' del archivo ' + n + ': ' + (lineas[bajo - 1] || '').trim().slice(0, 200);
      if (lineas[bajo - 2] !== undefined) m += '\\n   (anterior: ' + lineas[bajo - 2].trim().slice(0, 120) + ')';
    }
    window.__lineasError.forEach(function(L){
      if (L > 0 && L <= lineas.length) m += '\\n   Línea ' + L + ' de ' + n + ': ' + lineas[L - 1].trim().slice(0, 160);
    });
    msgs.push(m);
  });
  return msgs;
}
window.addEventListener('load', function(){
  setTimeout(function(){
    if (typeof fabric === 'undefined'){ __mostrarErrorCarga('No se pudo descargar la librería de dibujo (fabric.js). Revisa tu conexión a internet y recarga la página.'); return; }
    var d = __diagnostico();
    if (d.length) __mostrarErrorCarga('Archivos con problema:\\n' + d.join('\\n'));
    else if (!window.__appLista && !window.__erroresCarga.length) __mostrarErrorCarga('El programa no terminó de cargar.');
  }, 1500);
});
</script>
'''
h = h.replace('<base target="_top">', '<base target="_top">\n' + aviso, 1)
# 3) respaldo para fabric.js si el primer servidor falla
fab = '<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>'
assert fab in h
h = h.replace(fab, fab + '\n<script>window.fabric || document.write(\'<script src="https://cdn.jsdelivr.net/npm/fabric@5.3.0/dist/fabric.min.js"><\\/script>\')</script>', 1)
# 3b) los estilos del tema van en su propio archivo (Estilo) para que Index no crezca demasiado
ini = h.find('  /* =========================================================\n     TEMA APIK-DESING')
if ini >= 0:
    fin = h.index('</style>', ini)
    open(base + 'Estilo.html', 'w', encoding='utf-8').write('<style>\n' + h[ini:fin] + '</style>\n')
    h = h[:ini] + h[fin:fin + len('</style>')] + "\n<?!= include('Estilo') ?>" + h[fin + len('</style>'):]

cfg_as = re.sub(r'firebase:\s*\{[^}]*\}', 'firebase: null', cfg)   # Apps Script guarda en Drive: no necesita la llave de Firebase
inc = '<script>\n' + cfg_as + '\n</script>\n' + ''.join(f"<?!= include('Codigo{i}') ?>\n" for i in range(1, N + 1))
m = list(re.finditer(r'<script>\n(.*?)</script>', h, re.S))[-1]
h = h[:m.start()] + inc + h[m.end():]
assert '<?' not in h.replace("<?!= include('Codigo", '').replace("<?!= include('Estilo') ?>", '')
open(base + 'Index.html', 'w', encoding='utf-8').write(h)
print('Index.html', len(h.encode('utf-8')), 'bytes;', ', '.join(f'Codigo{i}.html {len(p.encode("utf-8"))} bytes' for i, p in enumerate(partes, 1)))

# 5) versión web: un solo archivo de programa (js/app.js) y el almacén del navegador (js/almacen-local.js)
REEMPLAZOS_WEB = [('a la papelera de Drive', 'a la papelera (se borra de este navegador)'), ('papelera de Drive', 'papelera'),
  ('tu Google Drive', 'este navegador'), ('Google Drive', 'este navegador'), ('su propio Drive', 'su propio navegador'), ('tu Drive', 'este navegador'),
  ('en Drive', 'en este navegador'), ('a Drive', 'a este navegador'), ('de Drive', 'de este navegador'), ('Mis diseños en Drive', 'Mis diseños')]
def textosWeb(t):
    for a, b in REEMPLAZOS_WEB: t = t.replace(a, b)
    return t
w = h0.replace('<base target="_top">', '<base target="_top">\n' + aviso.replace(json.dumps(esperado), '{}'), 1)
# en el celular y la tablet: usar el ancho real de la pantalla (en Apps Script lo pone Code.gs)
w = w.replace('<head>', '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">', 1)
assert 'name="viewport"' in w
w = w.replace(fab, fab + '\n<script>window.fabric || document.write(\'<script src="https://cdn.jsdelivr.net/npm/fabric@5.3.0/dist/fabric.min.js"><\\/script>\')</script>', 1)
mw = list(re.finditer(r'<script>\n(.*?)</script>', w, re.S))[-1]
w = w[:mw.start()] + '<script src="config.js"></script>\n<script src="js/almacen-local.js"></script>\n<script src="js/app.js"></script>' + w[mw.end():]
# app instalable: manifiesto, íconos y service worker (solo en la versión web)
w = w.replace('<head>', '<head>\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#05070d">\n<link rel="icon" type="image/png" href="icons/favicon.png">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="Diseñador">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">', 1)
w = w.replace('<script src="js/app.js"></script>', '<script src="js/app.js"></script>\n<script src="js/nube.js"></script>\n<script src="js/pwa.js"></script>', 1)
open(RAIZ + 'index.html', 'w', encoding='utf-8').write(textosWeb(w))
open(RAIZ + 'js/app.js', 'w', encoding='utf-8').write(textosWeb(js))
shutil.copy(FUENTE + 'almacen-local.js', RAIZ + 'js/almacen-local.js')
for f in ('pwa.js', 'nube.js'): shutil.copy(FUENTE + f, RAIZ + 'js/' + f)
import hashlib
# cada archivo lleva su huella (?v=…): así el navegador nunca usa uno viejo
def huellaDe(x): return hashlib.sha1(open(RAIZ + x, 'rb').read()).hexdigest()[:8]
idx = open(RAIZ + 'index.html', encoding='utf-8').read()
for x in ('config.js', 'js/almacen-local.js', 'js/app.js', 'js/nube.js', 'js/pwa.js'):
    assert idx.count(f'src="{x}"') == 1, x
    idx = idx.replace(f'src="{x}"', f'src="{x}?v={huellaDe(x)}"')
open(RAIZ + 'index.html', 'w', encoding='utf-8').write(idx)
huella = hashlib.sha1(b''.join(open(RAIZ + x, 'rb').read() for x in ('index.html', 'config.js', 'js/app.js', 'js/almacen-local.js', 'js/pwa.js', 'js/nube.js'))).hexdigest()[:10]
open(RAIZ + 'sw.js', 'w', encoding='utf-8').write(open(FUENTE + 'sw.plantilla.js', encoding='utf-8').read().replace('__VERSION__', huella))
print('Service worker versión', huella)
print('Web: index.html', len(w.encode('utf-8')), 'bytes; js/app.js', len(js.encode('utf-8')), 'bytes')

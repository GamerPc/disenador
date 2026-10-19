# Prueba rápida: abre la versión web, revisa que cargue sin errores, que haya plantillas y que exporte una imagen.
# Uso: pip install playwright && python3 -m playwright install chromium && python3 pruebas/humo.py
import asyncio, os, subprocess, sys, time
from playwright.async_api import async_playwright
RAIZ = os.environ.get('HUMO_RAIZ') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8799'], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1); fallas = []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            for w, h in [(1440, 900), (390, 844)]:
                pg = await b.new_page(viewport={'width': w, 'height': h}); errs = []
                pg.on('pageerror', lambda e: errs.append(str(e)))
                await pg.goto('http://localhost:8799/index.html'); await pg.wait_for_timeout(4000)
                r = await pg.evaluate('''()=>({ ver: document.querySelector('.ver').textContent, plantillas: CATALOGO.length,
                  cabeBarra: document.getElementById('barra').scrollWidth <= innerWidth + 1,
                  png: (()=>{ canvas.add(new fabric.Rect({width:50,height:50,fill:'red'})); return canvas.toDataURL().length > 1000; })() })''')
                print(w, r, errs[:3])
                if errs: fallas.append(f'{w}px: errores {errs[:3]}')
                if r['plantillas'] < 50: fallas.append(f'{w}px: pocas plantillas')
                if not r['cabeBarra']: fallas.append(f'{w}px: la barra no cabe')
                if not r['png']: fallas.append(f'{w}px: no exporta')
            await b.close()
    finally:
        srv.terminate()
    print('TODO BIEN' if not fallas else 'FALLAS: ' + '; '.join(fallas)); sys.exit(1 if fallas else 0)
asyncio.run(main())

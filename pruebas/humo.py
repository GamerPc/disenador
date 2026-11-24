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
                if await pg.locator('#inicioApp').is_visible():
                    await pg.get_by_role('button', name='Ir al diseñador →').click()
                r = await pg.evaluate('''()=>({ ver: document.querySelector('.ver').textContent, plantillas: document.querySelectorAll('#catalogo .tarjetaPl').length,
                  cabeBarra: document.getElementById('barra').scrollWidth <= innerWidth + 1,
                  png: (()=>{ const c=document.querySelector('#lienzo'); return !!c && c.toDataURL().length > 1000; })(),
                  orientacion: document.getElementById('pestanas').getAttribute('aria-orientation'),
                  pestanas: document.querySelectorAll('#pestanas [role="tab"][data-tab]').length,   // la pestaña de Video abre el estudio y no tiene panel
                  ultima: [...document.querySelectorAll('#pestanas [role="tab"][data-tab]')].at(-1)?.dataset.tab,
                  seleccionInicial: document.querySelector('#pestanas [role="tab"][aria-selected="true"]')?.dataset.tab,
                  panelVinculado: document.querySelector('#tPlantillas[role="tabpanel"][aria-labelledby="tabPlantillas"]') !== null })''')
                print(w, r, errs[:3])
                if errs: fallas.append(f'{w}px: errores {errs[:3]}')
                if r['plantillas'] < 50: fallas.append(f'{w}px: pocas plantillas')
                if not r['cabeBarra']: fallas.append(f'{w}px: la barra no cabe')
                if not r['png']: fallas.append(f'{w}px: no exporta')
                orientacion = 'horizontal' if w <= 820 else 'vertical'
                if r['orientacion'] != orientacion: fallas.append(f'{w}px: orientacion de pestanas incorrecta')
                if r['pestanas'] < 7 or r['seleccionInicial'] != 'tPlantillas' or not r['panelVinculado']:
                    fallas.append(f'{w}px: semantica inicial de pestanas incompleta')
                await pg.locator('#pestanas [aria-selected="true"]').focus()
                await pg.keyboard.press('ArrowDown' if w > 820 else 'ArrowRight')
                activa = await pg.locator('#pestanas [aria-selected="true"]').get_attribute('data-tab')
                if activa != 'tTexto': fallas.append(f'{w}px: flecha no selecciona la siguiente pestana ({activa})')
                await pg.keyboard.press('End')
                ultima = await pg.locator('#pestanas [aria-selected="true"]').get_attribute('data-tab')
                if ultima != r['ultima']: fallas.append(f'{w}px: End no selecciona la ultima pestana ({ultima})')
                await pg.keyboard.press('Home')
                primera = await pg.locator('#pestanas [aria-selected="true"]').get_attribute('data-tab')
                if primera != 'tPlantillas': fallas.append(f'{w}px: Home no vuelve a la primera pestana ({primera})')
                abrir_exportar = pg.locator('#barra button[onclick*="mExportar"]')
                await abrir_exportar.focus(); await abrir_exportar.click()
                dialogo = pg.locator('#mDescargaFacil .caja')
                semantica = await dialogo.evaluate("e => ({role:e.getAttribute('role'),modal:e.getAttribute('aria-modal'),nombre:e.getAttribute('aria-labelledby')})")
                if semantica['role'] != 'dialog' or semantica['modal'] != 'true' or not semantica['nombre']:
                    fallas.append(f'{w}px: el dialogo de exportacion no tiene nombre accesible')
                await pg.evaluate('''()=>{
                  const d=document.querySelector('#mDescargaFacil .caja');
                  const s='a[href],area[href],button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
                  [...d.querySelectorAll(s)].filter(e=>!e.closest('[hidden],[inert],[aria-hidden="true"]')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').at(-1)?.focus();
                }''')
                await pg.keyboard.press('Tab')
                tab_envuelto = await pg.evaluate('''()=>{
                  const d=document.querySelector('#mDescargaFacil .caja');
                  const s='a[href],area[href],button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
                  const f=[...d.querySelectorAll(s)].filter(e=>!e.closest('[hidden],[inert],[aria-hidden="true"]')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'); return document.activeElement===f[0];
                }''')
                if not tab_envuelto: fallas.append(f'{w}px: Tab no permanece dentro del dialogo')
                await pg.keyboard.press('Shift+Tab')
                shift_envuelto = await pg.evaluate('''()=>{
                  const d=document.querySelector('#mDescargaFacil .caja');
                  const s='a[href],area[href],button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
                  const f=[...d.querySelectorAll(s)].filter(e=>!e.closest('[hidden],[inert],[aria-hidden="true"]')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'); return document.activeElement===f.at(-1);
                }''')
                if not shift_envuelto: fallas.append(f'{w}px: Shift+Tab no permanece dentro del dialogo')
                await pg.keyboard.press('Escape')
                await pg.wait_for_timeout(80)
                cerrado = await pg.evaluate("!document.getElementById('mDescargaFacil').classList.contains('abierto') && document.activeElement.matches('#barra button[onclick*=\"mExportar\"]')")
                if not cerrado: fallas.append(f'{w}px: Escape no cierra el dialogo o no devuelve el foco')
                archivo = pg.locator('#barra button[title^="Archivo:"]')
                await archivo.click()
                await pg.get_by_role('button', name='Preguntas frecuentes').click()
                await pg.locator('#ayReportar').click()
                reporte = await pg.locator('#mReporte .caja').evaluate("e => ({role:e.getAttribute('role'), modal:e.getAttribute('aria-modal'), nombre:e.getAttribute('aria-labelledby')})")
                if reporte['role'] != 'dialog' or reporte['modal'] != 'true' or not reporte['nombre']:
                    fallas.append(f'{w}px: el reporte no tiene semantica accesible de dialogo')
                await pg.locator('#rpQue').press('Escape')
                await pg.wait_for_timeout(80)
                regreso_anidado = await pg.evaluate("!document.getElementById('mReporte').classList.contains('abierto') && !document.getElementById('mPreguntas').classList.contains('abierto') && document.activeElement.matches('#barra button[title^=\"Archivo:\"]')")
                if not regreso_anidado: fallas.append(f'{w}px: al cerrar reporte desde Preguntas frecuentes, el foco no vuelve al menu visible')
                await archivo.click()
                await pg.get_by_role('button', name='Planifica publicaciones para tus redes').click()
                debug_plan = await pg.evaluate('''()=>{const m=document.getElementById('mPlanRedes'),b=document.getElementById('prNuevo'),bar=m?.querySelector('.prBarra'),plan=document.getElementById('bPlanRedes');return {modalExiste:!!m,modalAbierto:m?.classList.contains('abierto'),barraOculta:bar?.hidden,formularioOculto:document.getElementById('prFormulario')?.hidden,botonOculto:b?.hidden,botonVisible:!!b?.getClientRects().length,focus:document.activeElement?.id,menuOculto:document.getElementById('menuArchivo')?.hidden,handler:typeof plan?.onclick,handlerTexto:String(plan?.onclick),abrirPlan:typeof abrirPlanRedes,preparar:typeof prPreparar}}''')
                print('PLANDEBUG', w, debug_plan, 'PAGEERR', errs)
                if not debug_plan['modalAbierto']:
                    fallas.append(f'{w}px: el botón Archivo no abrió el calendario de contenido')
                    await pg.evaluate('abrirPlanRedes()')
                if await pg.locator('#prNuevo').is_visible():
                    await pg.locator('#prNuevo').click()
                await pg.locator('#prCampana').fill('Prueba automática')
                await pg.locator('#prPlataforma').select_option('Instagram')
                await pg.locator('#prTema').fill('Publicación de prueba')
                await pg.locator('#prTexto').fill('Texto de prueba')
                await pg.get_by_role('button', name='Guardar publicación').click()
                if await pg.locator('.prTarjeta').count() != 1:
                    fallas.append(f'{w}px: el calendario no guarda una publicación')
                await pg.locator('#prFiltro').select_option('TikTok')
                if await pg.locator('.prTarjeta').count() != 0:
                    fallas.append(f'{w}px: el filtro del calendario no funciona')
                await pg.locator('#prFiltro').select_option('')
                await pg.get_by_role('button', name='Ideas y revisión').click()
                if await pg.locator('.prTarjeta').count() != 1:
                    fallas.append(f'{w}px: la bandeja no muestra la publicación nueva')
                await pg.get_by_role('button', name='Enviar a revisión').click()
                if 'En revisión' not in await pg.locator('.prTarjeta').inner_text():
                    fallas.append(f'{w}px: no se pudo enviar la idea a revisión')
                await pg.get_by_role('button', name='Aprobar').click()
                if 'Aprobado' not in await pg.locator('.prTarjeta').inner_text():
                    fallas.append(f'{w}px: no se pudo aprobar la publicación')
                await pg.get_by_role('button', name='Programar').click()
                if 'Programado' not in await pg.locator('.prTarjeta').inner_text():
                    fallas.append(f'{w}px: no se pudo programar la publicación aprobada')
                await pg.locator('#prFiltroEstado').select_option('En revisión')
                if await pg.locator('.prTarjeta').count() != 0:
                    fallas.append(f'{w}px: el filtro de estado de la bandeja no funciona')
                await pg.locator('#prFiltroEstado').select_option('')
                async def aceptar_confirmacion(d): await d.accept()
                pg.on('dialog', aceptar_confirmacion)
                await pg.get_by_role('button', name='Eliminar Publicación de prueba').click()
                if await pg.locator('.prTarjeta').count() != 0:
                    fallas.append(f'{w}px: no se pudo limpiar la publicación temporal de prueba')
                await pg.evaluate("ponerModo('sencillo', false)")
                await pg.evaluate("ponerInterfaz(false, false)")
                if not await pg.locator('#bArchivo').is_visible():
                    fallas.append(f'{w}px: el menú Archivo no queda accesible en modo sencillo')
                else:
                    await pg.locator('#bArchivo').click()
                    await pg.get_by_role('button', name='Planifica publicaciones para tus redes').click()
                    if not await pg.locator('#mPlanRedes .prCaja').is_visible():
                        fallas.append(f'{w}px: no se puede abrir el calendario desde modo sencillo')
                    await pg.locator('#prCerrar').click()
                await pg.evaluate("ponerModo('completo', false)")
                if await pg.locator('#bArchivo').is_visible():
                    fallas.append(f'{w}px: al volver al modo completo la interfaz clásica cambia el menú inesperadamente')
                await pg.evaluate("ponerInterfaz(true, false)")
            await b.close()
    finally:
        srv.terminate()
    print('TODO BIEN' if not fallas else 'FALLAS: ' + '; '.join(fallas)); sys.exit(1 if fallas else 0)
asyncio.run(main())

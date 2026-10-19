/* =========================================================
   PANEL DE PROPIEDADES
   ========================================================= */
function aplicar(prop, valor, sinGuardar){
  objetivos().forEach(o => hojas(o).forEach(x => {
    if (prop === 'fill' && x.type === 'image') return;
    if (prop === 'fill' && x.textoDe && objetivos().includes(porId(x.textoDe))) return;   // no pintar el texto del mismo color que su forma
    if (prop === 'fill' && (esLinea(x) || x.trazoLibre)) { x.set('stroke', valor); return; }
    x.set(prop, valor);
    if (esTexto(x) && x.initDimensions) x.initDimensions();
  }));
  objetivos().forEach(o => { o.dirty = true; if (o.type === 'group' && o.addWithUpdate) o.addWithUpdate(); });
  const a = activo(); if (a && a.type === 'activeSelection') a.addWithUpdate();
  objetivos().flatMap(hojas).filter(x => x.textoDe).forEach(ajustarFormaATexto);
  canvas.requestRenderAll();
  if (!sinGuardar) guardarEstado();
}
function textos(){ return objetivos().flatMap(hojas).filter(esTexto); }

// Otras partes agregan lo suyo al panel con alActualizarPanel(función); se ejecutan en orden después del panel base
const GANCHOS_PANEL = [];
const alActualizarPanel = fn => GANCHOS_PANEL.push(fn);
function actualizarPanel(){
  actualizarPanelBase.apply(this, arguments);
  for (const f of GANCHOS_PANEL) f();
}
function actualizarPanelBase(){
  if (generandoVista) return;
  const o = activo();
  $('sinSel').hidden = !!o; $('propsCont').hidden = !o;
  if (!o) return;
  const hs = objetivos().flatMap(hojas);
  const ref = hs[0] || o;
  const hayTexto = hs.some(esTexto);
  const soloImagen = hs.every(x => x.type === 'image');
  $('secTexto').hidden = !hayTexto;
  $('secImagen').hidden = !(o.type === 'image');
  $('secEsquinas').hidden = !(o.type === 'rect');
  $('secRelleno').hidden = soloImagen;
  $('secBorde').hidden = false;

  if (!soloImagen) $('pRelleno').value = aHex(esLinea(ref) || ref.trazoLibre ? ref.stroke : ref.fill);
  $('pBorde').value = aHex(ref.stroke || '#000000');
  $('pGrosor').value = esLinea(ref) ? ref.strokeWidth : (ref.stroke ? ref.strokeWidth : 0);
  $('pOpac').value = Math.round((o.opacity ?? 1) * 100);
  $('pSombra').checked = !!ref.shadow;
  if (ref.shadow){ $('pSombraColor').value = aHex(ref.shadow.color); $('pSombraBlur').value = ref.shadow.blur; }
  if (o.type === 'rect') $('pRadio').value = o.rx || 0;

  if (hayTexto){
    const t = hs.find(esTexto);
    $('pFuente').value = t.fontFamily;
    $('pTam').value = Math.round(t.fontSize * (o === t ? t.scaleY : 1));
    $('bNegrita').classList.toggle('on', String(t.fontWeight) === 'bold' || +t.fontWeight >= 600);
    $('bCursiva').classList.toggle('on', t.fontStyle === 'italic');
    $('bSubrayado').classList.toggle('on', !!t.underline);
    $('bTachado').classList.toggle('on', !!t.linethrough);
    document.querySelectorAll('#alineaciones .pb').forEach(b => b.classList.toggle('on', b.dataset.al === t.textAlign));
    $('pInter').value = t.lineHeight; $('pEsp').value = t.charSpacing || 0;
    $('filaCurva').hidden = !(o === t && !t.textoDe && !t.tabla && !t.esDeco);
    $('pCurva').value = t.curva || 0;
    document.querySelectorAll('#efectosTexto .efectoBtn').forEach(b => b.classList.toggle('on', b.dataset.e === (t.efectoTexto || 'ninguno')));
  }
  if (o.type === 'image'){
    const fx = o.fx || {};
    $('fBrillo').value = fx.b || 0; $('fContraste').value = fx.c || 0; $('fSaturacion').value = fx.s || 0; $('fBlur').value = fx.bl || 0;
    $('fGris').classList.toggle('on', !!fx.gris); $('fSepia').classList.toggle('on', !!fx.sepia); $('fInvertir').classList.toggle('on', !!fx.inv);
  }
  $('bAgrupar').hidden = !(o.type === 'activeSelection' || o.type === 'group');
  $('bAgrupar').textContent = o.type === 'group' ? 'Desagrupar' : 'Agrupar';
  $('bBloquear').textContent = o.bloqueado ? '🔓 Desbloquear' : '🔒 Bloquear';
  $('bConectar').hidden = !(o.type === 'activeSelection' && candidatosConexion().length === 2);
  $('bFlecha').hidden = true;
  $('secConector').hidden = o.type !== 'conector';
  $('grupoMulti').hidden = o.type !== 'activeSelection' || !!o.esTabla;
  $('secTabla').hidden = !tablaActual();
  if (o.type !== 'activeSelection' && puedeTenerTexto(nodoBase(o))) $('pTipoForma').value = nodoBase(o).forma || '';
  $('secDiagrama').hidden = !(o.type !== 'activeSelection' && puedeTenerTexto(nodoBase(o)));
  if (o.type === 'conector'){
    document.querySelectorAll('#estilosCon .pb').forEach(b => b.classList.toggle('on', b.dataset.e === (o.estilo || 'recta')));
    $('pInicio').value = o.inicio || 'nada';
    $('pFin').value = o.fin || (o.flecha ? 'flecha' : 'nada');
    const pat = o.patron || (o.strokeDashArray ? 'guiones' : 'solida');
    document.querySelectorAll('#patronesCon .pb').forEach(b => b.classList.toggle('on', b.dataset.p === pat));
    if (document.activeElement !== $('pEtiqueta')) $('pEtiqueta').value = o.etiqueta || '';
  }
  $('bTextoDentro').hidden = !puedeTenerTexto(o);
  $('secGrafica').hidden = !o.grafica;
  const esMarco = !!(o.marco || o.marcoVacio);
  $('secMarco').hidden = !esMarco;
  if (esMarco){
    $('ajustesFoto').hidden = !o.marco;
    $('bSubirFoto').textContent = o.marco ? '📷 Cambiar foto' : '📷 Subir foto';
    if (o.marco){ $('mZoom').value = o.marco.zoom; $('mPx').value = o.marco.px; $('mPy').value = o.marco.py; $('mTipo').value = o.marco.tipo; $('secEsquinas').hidden = true; }
    if (o.marcoVacio){ ['secTexto','secRelleno','secBorde','secEsquinas'].forEach(id => $(id).hidden = true); $('bAgrupar').hidden = true; }
  }
  if (o.grafica){
    ['secTexto','secRelleno','secBorde','secEsquinas'].forEach(id => $(id).hidden = true);
    $('bAgrupar').hidden = true;
    const d = o.grafica;
    document.querySelectorAll('#tiposGraf .pb').forEach(b => b.classList.toggle('on', b.dataset.t === d.tipo));
    if (document.activeElement !== $('gTitulo')) $('gTitulo').value = d.titulo || '';
    if (document.activeElement !== $('gDatos')) $('gDatos').value = d.datos.map(x => `${x.e}, ${x.v}`).join('\n');
    $('gPaleta').value = d.paleta; $('gValores').checked = !!d.valores;
  }
}

// Fuentes
FUENTES.forEach(f => { const op = document.createElement('option'); op.value = f; op.textContent = f; op.style.fontFamily = f; $('pFuente').appendChild(op); });
$('pFuente').onchange = e => {
  const f = e.target.value;
  const fin = () => { fabric.util.clearFabricFontCache(f); textos().forEach(t => { t.set('fontFamily', f); t.initDimensions(); }); aplicar('dirty', true); };
  document.fonts.load(`700 40px "${f}"`).then(fin).catch(fin);
};
$('pTam').addEventListener('change', e => {
  const v = +e.target.value; if (!v) return;
  textos().forEach(t => t.set('fontSize', v / (t === activo() ? t.scaleY : 1)));
  aplicar('dirty', true);
});
$('bNegrita').onclick = () => { const on = !$('bNegrita').classList.contains('on'); textos().forEach(t => t.set('fontWeight', on ? '700' : '400')); aplicar('dirty', true); actualizarPanel(); };
$('bCursiva').onclick = () => { const on = !$('bCursiva').classList.contains('on'); textos().forEach(t => t.set('fontStyle', on ? 'italic' : 'normal')); aplicar('dirty', true); actualizarPanel(); };
$('bSubrayado').onclick = () => { const on = !$('bSubrayado').classList.contains('on'); textos().forEach(t => t.set('underline', on)); aplicar('dirty', true); actualizarPanel(); };
$('bTachado').onclick = () => { const on = !$('bTachado').classList.contains('on'); textos().forEach(t => t.set('linethrough', on)); aplicar('dirty', true); actualizarPanel(); };
$('bMayus').onclick = () => {
  textos().forEach(t => { const up = t.text === t.text.toUpperCase(); t.set('text', up ? t.text.toLowerCase().replace(/(^|[.!?]\s+)(\p{L})/gu, (m,a,b)=>a+b.toUpperCase()) : t.text.toUpperCase()); });
  aplicar('dirty', true);
};
document.querySelectorAll('#alineaciones .pb').forEach(b => b.onclick = () => { textos().forEach(t => t.set('textAlign', b.dataset.al)); aplicar('dirty', true); actualizarPanel(); });
$('pInter').addEventListener('input', e => { textos().forEach(t => { t.set('lineHeight', +e.target.value); t.initDimensions(); if (t.textoDe) ajustarFormaATexto(t); }); canvas.requestRenderAll(); });
$('pInter').addEventListener('change', guardarEstado);
$('pEsp').addEventListener('input', e => { textos().forEach(t => { t.set('charSpacing', +e.target.value); t.initDimensions(); if (t.textoDe) ajustarFormaATexto(t); }); canvas.requestRenderAll(); });
$('pEsp').addEventListener('change', guardarEstado);
$('pResalte').addEventListener('input', e => { textos().forEach(t => t.set('textBackgroundColor', e.target.value)); aplicar('dirty', true, true); });
$('pResalte').addEventListener('change', guardarEstado);
$('bSinResalte').onclick = () => { textos().forEach(t => t.set('textBackgroundColor', '')); aplicar('dirty', true); };

// Color, borde, esquinas, opacidad, sombra
$('pRelleno').addEventListener('input', e => aplicar('fill', e.target.value, true));
$('pRelleno').addEventListener('change', guardarEstado);
$('pBorde').addEventListener('input', e => { aplicar('stroke', e.target.value, true); });
$('pBorde').addEventListener('change', guardarEstado);
$('pGrosor').addEventListener('input', e => {
  const v = +e.target.value;
  objetivos().flatMap(hojas).forEach(x => { if (!x.stroke) x.set('stroke', $('pBorde').value); x.set({ strokeWidth:v, paintFirst: esTexto(x) ? 'stroke' : 'fill', strokeUniform: !esTexto(x) }); if (esTexto(x)) x.initDimensions(); });
  aplicar('dirty', true, true);
});
$('pGrosor').addEventListener('change', guardarEstado);
$('pRadio').addEventListener('input', e => { aplicar('rx', +e.target.value, true); aplicar('ry', +e.target.value, true); });
$('pRadio').addEventListener('change', guardarEstado);
$('pOpac').addEventListener('input', e => { objetivos().forEach(o => o.set('opacity', e.target.value/100)); canvas.requestRenderAll(); });
$('pOpac').addEventListener('change', guardarEstado);
function aplicarSombra(){
  const on = $('pSombra').checked, k = s();
  const sh = on ? new fabric.Shadow({ color: hexAlpha($('pSombraColor').value, 0.45), blur: +$('pSombraBlur').value * k, offsetX: 8*k, offsetY: 8*k }) : null;
  objetivos().forEach(o => o.set('shadow', sh)); canvas.requestRenderAll();
}
function hexAlpha(h, a){ const c = new fabric.Color(h); c.setAlpha(a); return c.toRgba(); }
$('pSombra').addEventListener('change', () => { aplicarSombra(); guardarEstado(); });
$('pSombraColor').addEventListener('input', aplicarSombra);
$('pSombraColor').addEventListener('change', guardarEstado);
$('pSombraBlur').addEventListener('input', aplicarSombra);
$('pSombraBlur').addEventListener('change', guardarEstado);


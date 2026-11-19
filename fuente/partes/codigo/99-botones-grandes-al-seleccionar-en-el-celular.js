/* =========================================================
   BOTONES GRANDES AL SELECCIONAR (CELULAR)
   Antes, al tocar algo en el celular solo salían «Borrar», «Copiar» y «Editar», y lo demás
   había que buscarlo en el panel. Ahora sale abajo una fila de botones grandes, con dibujo y
   nombre, que cambia según lo que tocaste: texto, foto, figura o varias cosas.
   Cada botón usa las mismas ventanas que la barra rápida de la computadora (77-…).
   ========================================================= */
Object.assign(ICONOS_UI, {
  capas:'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  centrarPag:'M4 4h16v16H4zM12 8v8M8 12h8',
  agrupar:'M3 3h8v8H3zM13 13h8v8h-8zM15 3h6v6M3 15v6h6',
  letra:'M5 20 11 4h2l6 16M8 14h8',
  aMas:'M4 20 9 6h1l5 14M6 15h7M18 5v6M15 8h6',
  aMenos:'M4 20 9 6h1l5 14M6 15h7M15 8h6',
  cuadro:'M4 4h16v16H4z',
  fijar:'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4'
});
function botonDedo(k, ico, txt, f, op = {}){ return { k, ico, txt, f, cls:op.cls || '', des:!!op.des }; }
function escribirEnTexto(){
  const t = activo(); if (!t || !/text/i.test(t.type || '') || t.bloqueado) return;
  t.enterEditing(); t.selectAll(); canvas.requestRenderAll();
  if (t.hiddenTextarea) t.hiddenTextarea.focus();          // abre el teclado del celular
}
function tamDedo(paso){
  const o = activo(); if (!o) return;
  if (/text/i.test(o.type || '') && $('pTam')){ disparar($('pTam'), Math.max(4, Math.round((+$('pTam').value || o.fontSize || 20) * (paso > 0 ? 1.15 : 1 / 1.15)))); return; }
  if (o.bloqueado) return;
  const c = o.getCenterPoint(), k = paso > 0 ? 1.12 : 1 / 1.12;
  o.scaleX *= k; o.scaleY *= k; o.setPositionByOrigin(c, 'center', 'center'); o.setCoords();
  canvas.requestRenderAll(); guardarEstado();
}
function botonesDedo(o){
  const tipo = tipoSeleccion(o), L = [];
  const color = (titulo, sec) => botonDedo('color', 'paleta', 'Color', btn => abrirPopRapido(btn, titulo, [$(sec)]));
  if (tipo === 'texto'){
    L.push(botonDedo('escribir', 'lapiz', 'Escribir', escribirEnTexto, { cls:'principal', des:o.bloqueado }));
    L.push(color('Color del texto', 'secRelleno'));
    L.push(botonDedo('fuente', 'letra', 'Letra', btn => abrirSelectorFuentes(btn)));
    L.push(botonDedo('masG', 'aMas', 'Más grande', () => tamDedo(1)));
    L.push(botonDedo('menosG', 'aMenos', 'Más chico', () => tamDedo(-1)));
    if ($('efectosTexto')) L.push(botonDedo('efectos', 'elementos', 'Efectos', btn => abrirPopRapido(btn, 'Efectos', [$('efectosTexto'), $('filaCurva') && seVe($('filaCurva')) ? $('filaCurva') : null])));
  } else if (tipo === 'imagen'){
    if (typeof abrirEditorFoto === 'function') L.push(botonDedo('editarFoto', 'pincel', 'Editar foto', () => abrirEditorFoto(), { cls:'principal' }));
    L.push(botonDedo('recortar', 'tijeras', 'Recortar', () => iniciarRecorteRect()));
    if (typeof quitarFondoIA === 'function') L.push(botonDedo('fondoIA', 'varita', 'Quitar fondo', () => quitarFondoIA()));
    L.push(botonDedo('voltear', 'ciclo', 'Voltear', () => voltear('flipX')));
  } else if (tipo === 'varios'){
    L.push(botonDedo('agrupar', 'agrupar', 'Agrupar', () => { agruparToggle(); setTimeout(armarBarraDedo, 30); }, { cls:'principal' }));
  } else if (tipo === 'linea'){
    L.push(botonDedo('color', 'paleta', 'Color', btn => abrirPopRapido(btn, 'Color y grosor', [$('secBorde')])));
    L.push(botonDedo('linea', 'diagramas', 'Tipo de línea', btn => abrirPopRapido(btn, 'Tipo de línea', [$('secConector')])));
  } else if (tipo === 'forma'){
    if (seVe($('secRelleno'))) L.push(color('Color', 'secRelleno'));
    L.push(botonDedo('borde', 'cuadro', 'Borde', btn => abrirPopRapido(btn, 'Borde', [$('secBorde')])));
  } else if (tipo === 'tabla'){
    L.push(botonDedo('filaMas', 'mas', 'Fila', () => tablaFila(1)));
    L.push(botonDedo('colMas', 'mas', 'Columna', () => tablaCol(1)));
    L.push(botonDedo('tablaOpc', 'paleta', 'Colores', btn => abrirPopRapido(btn, 'Tabla', [$('secTabla')])));
  }
  if (tipo === 'forma' || tipo === 'imagen' || tipo === 'varios'){
    L.push(botonDedo('masG', 'mas', 'Más grande', () => tamDedo(1)));
    L.push(botonDedo('menosG', 'menos', 'Más chico', () => tamDedo(-1)));
  }
  L.push(botonDedo('posicion', 'capas', 'Orden', btn => abrirPosicion(btn)));
  L.push(botonDedo('duplicar', 'duplicar', 'Copiar', () => duplicar()));
  L.push(botonDedo('bloquear', o.bloqueado ? 'candadoAbierto' : 'fijar', o.bloqueado ? 'Soltar' : 'Fijar', () => { bloquearSel(); setTimeout(armarBarraDedo, 30); }));
  L.push(botonDedo('eliminar', 'basura', 'Borrar', () => eliminar(), { cls:'peligro', des:o.bloqueado }));
  return L;
}
function armarBarraDedo(){
  const a = $('accMovil'); if (!a) return;
  const o = activo();
  if (!o || !esTel()){ a.classList.remove('dedo'); return; }
  const lista = botonesDedo(o);
  a.classList.add('dedo'); a.setAttribute('role', 'toolbar'); a.setAttribute('aria-label', 'Qué quieres hacer con lo que tocaste');
  const boton = b => `<button type="button" data-k="${b.k}" class="${b.cls}"${b.des ? ' disabled' : ''}>${svgIcono(b.ico)}<span>${esc(b.txt)}</span></button>`;
  // «Borrar» y «Todo» quedan fijos a la derecha; lo demás se desliza con el dedo
  a.innerHTML = `<div class="dedoDesliza">${lista.filter(b => b.k !== 'eliminar').map(boton).join('')}</div>`
    + `<div class="dedoFijo">${lista.filter(b => b.k === 'eliminar').map(boton).join('')}<button type="button" id="fabEditar" title="Todas las opciones">${svgIcono('engrane')}<span>Todo</span></button></div>`;
  const des = a.querySelector('.dedoDesliza'), marcar = () => a.classList.toggle('hayMas', des.scrollWidth - des.clientWidth - des.scrollLeft > 4);
  des.addEventListener('scroll', marcar, { passive:true }); requestAnimationFrame(marcar);
  a.querySelectorAll('button[data-k]').forEach(btn => { const it = lista.find(x => x.k === btn.dataset.k); btn.onclick = () => { if (!btn.disabled) it.f(btn); }; });
  $('fabEditar').onclick = () => { if (typeof popRapido !== 'undefined' && popRapido) cerrarPopRapido({ porPestana:true }); alternarProps(); };
  if ($('props').classList.contains('abierto')) $('fabEditar').classList.add('on');
}
['selection:created', 'selection:updated', 'selection:cleared'].forEach(ev => canvas.on(ev, () => setTimeout(armarBarraDedo, 0)));
// mientras escribes (sale el teclado), dibujas o mueves algo, la fila se esconde para no estorbar
canvas.on('text:editing:entered', () => $('accMovil').classList.add('escribiendo'));
canvas.on('text:editing:exited', () => { $('accMovil').classList.remove('escribiendo'); setTimeout(armarBarraDedo, 0); });
matchMedia('(max-width: 820px)').addEventListener('change', () => armarBarraDedo());
// la ayuda del modo sencillo ahora señala los botones de abajo
{ const antes = textoAyudaS;
  textoAyudaS = function(){
    const o = activo();
    if (o && !o.isEditing && esTel() && !canvas.isDrawingMode){
      if (/text/i.test(o.type || '')) return '✏ Toca «Escribir» para cambiar las palabras. Con los botones de abajo cambias el color, la letra y el tamaño. Arrástralo para moverlo.';
      if (o.type === 'image') return '🖼 Arrastra la foto para moverla. Abajo puedes editarla, recortarla, quitarle el fondo o hacerla más grande.';
      return '👆 Arrastra para moverlo. Con los botones de abajo cambias el color, el tamaño, lo copias o lo borras.';
    }
    return antes.apply(this, arguments);
  };
}

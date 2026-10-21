/* =========================================================
   ATAJOS DE TECLADO
   ========================================================= */
document.addEventListener('keydown', e => {
  const tag = (document.activeElement || {}).tagName;
  if (['INPUT','SELECT','TEXTAREA'].includes(tag)) return;
  const o = activo(); if (o && o.isEditing) return;
  const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (k === 'delete' || k === 'backspace'){ e.preventDefault(); eliminar(); }
  else if (ctrl && k === 'z' && !e.shiftKey){ e.preventDefault(); deshacer(); }
  else if (ctrl && (k === 'y' || (k === 'z' && e.shiftKey))){ e.preventDefault(); rehacer(); }
  else if (ctrl && k === 'd'){ e.preventDefault(); duplicar(); }
  else if (ctrl && e.altKey && k === 'c'){ e.preventDefault(); copiarEstilo(); }
  else if (ctrl && e.altKey && k === 'v'){ e.preventDefault(); pegarEstilo(); }
  else if (ctrl && k === 'c' && o){ clonar(o, c => portapapeles = c); }
  // Ctrl + V se resuelve en el evento «paste» (80-pegar…): así se puede pegar de Word, Excel o de aquí mismo
  else if (ctrl && k === 'g'){ e.preventDefault(); agruparToggle(); }
  else if (ctrl && k === 's'){ e.preventDefault(); guardarDrive(); }
  else if (ctrl && k === 'a'){ e.preventDefault(); const objs = canvas.getObjects().filter(x => x.selectable && x.visible); if (objs.length){ canvas.setActiveObject(new fabric.ActiveSelection(objs, { canvas })); canvas.requestRenderAll(); } }
  else if (o && k.startsWith('arrow')){
    e.preventDefault(); const p = e.shiftKey ? 10 : 1;
    if (k === 'arrowleft') o.left -= p; if (k === 'arrowright') o.left += p;
    if (k === 'arrowup') o.top -= p; if (k === 'arrowdown') o.top += p;
    o.setCoords(); canvas.requestRenderAll(); clearTimeout(canvas._ar); canvas._ar = setTimeout(guardarEstado, 400);
  }
  else if (k === 'tab' && o && o.type !== 'activeSelection' && puedeTenerTexto(nodoBase(o))){ e.preventDefault(); agregarHijo(e.shiftKey ? 'aba' : 'der'); }
  else if (k === 'escape'){ if (modoConector) activarModoConector(false); if (canvas.isDrawingMode) activarDibujo(null); canvas.discardActiveObject(); canvas.requestRenderAll(); }
  else if (k === 'c' && !ctrl){ activarModoConector(!modoConector); }
});


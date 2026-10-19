/* =========================================================
   RECORRER TODAS LAS PÁGINAS (para cambios en todo el diseño)
   ========================================================= */
// Carga cada página en el lienzo, aplica fn(objetos, i) y la guarda. Al final vuelve a la página actual.
async function recorrerPaginas(fn, alFinal){
  canvas.discardActiveObject();
  guardarPaginaActual();
  const orig = actual;
  restaurando = true;
  try {
    for (let i = 0; i < paginas.length; i++){
      const nt = paginas[i] && paginas[i].notas;
      await new Promise(ok => canvas.loadFromJSON(paginas[i] || PAGINA_VACIA(), ok));
      try { normalizarVinculos(); } catch(e){}
      await fn(canvas.getObjects(), i);
      paginas[i] = canvas.toJSON(EXTRA); if (nt) paginas[i].notas = nt;
    }
    if (alFinal) alFinal();
  } finally {
    restaurando = false;
    miniaturas = []; actual = orig;
    cargarPaginaActual(true);
  }
}


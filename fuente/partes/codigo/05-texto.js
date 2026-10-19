/* =========================================================
   TEXTO
   ========================================================= */
function agregarTexto(tipo, opciones){
  const cfg = {
    titulo:   { text:'Agrega un título', fontSize:96, fontWeight:'700', fontFamily:'Montserrat' },
    subtitulo:{ text:'Agrega un subtítulo', fontSize:56, fontWeight:'600', fontFamily:'Poppins' },
    cuerpo:   { text:'Agrega un poco de texto', fontSize:36, fontWeight:'400', fontFamily:'Inter' }
  }[tipo];
  const t = new fabric.Textbox(cfg.text, Object.assign({
    left:W/2, top:H/2, originX:'center', originY:'center', width:W*0.75,
    fontFamily:cfg.fontFamily, fontSize:cfg.fontSize*s(), fontWeight:cfg.fontWeight,
    fill:'#1f2330', textAlign:'center', lineHeight:1.15, splitByGrapheme:false
  }, opciones || {}));
  agregar(t, 'Texto');
  return t;
}
function agregarCombo(f1, f2){
  const a = agregarTexto('titulo', { fontFamily:f1, top:H/2 - 50*s(), text: f1 === 'Pacifico' || f1 === 'Playfair Display' ? 'Tu título aquí' : 'TU TÍTULO AQUÍ' });
  const b = agregarTexto('cuerpo', { fontFamily:f2, top:H/2 + 50*s(), text:'Escribe aquí un texto complementario' });
  const sel = new fabric.ActiveSelection([a, b], { canvas });
  canvas.setActiveObject(sel); canvas.requestRenderAll();
}


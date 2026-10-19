/* =========================================================
   EXPORTAR A POWERPOINT
   ========================================================= */
const URL_PPTX = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
function cargarScript(url){
  return new Promise((ok, mal) => {
    if (window.PptxGenJS) return ok();
    const sc = document.createElement('script'); sc.src = url; sc.onload = ok; sc.onerror = () => mal(new Error('No se pudo cargar la librería de PowerPoint'));
    document.head.appendChild(sc);
  });
}
// ¿Se puede pasar este texto como texto editable sin que cambie su aspecto?
const textoParaPPTX = o => esTexto(o) && o.visible !== false && !o.path && !o.group && !o.esDeco && typeof o.fill === 'string'
  && !(o.stroke && o.strokeWidth > 0) && !o.shadow && !o.textBackgroundColor && (o.text || '').trim();
// Fondo de la diapositiva (todo menos los textos editables) y la lista de textos con su posición
function prepararDiapositivaPPTX(json, escala, editable){
  return new Promise(ok => {
    const sc = new fabric.StaticCanvas(document.createElement('canvas'), { width:W, height:H, enableRetinaScaling:false, renderOnAddRemove:false });
    sc.loadFromJSON(json || PAGINA_VACIA(), () => {
      const textosP = [];
      if (editable) sc.getObjects().forEach(o => {
        if (!textoParaPPTX(o)) return;
        const c = o.getCenterPoint(), w = o.width * o.scaleX, hh = o.height * o.scaleY;
        textosP.push({ texto:o.text, x:c.x - w/2, y:c.y - hh/2, w, h:hh, px:o.fontSize * o.scaleY, fuente:o.fontFamily,
          color:aHex(o.fill).slice(1).toUpperCase(), bold: String(o.fontWeight) === 'bold' || +o.fontWeight >= 600, italic:o.fontStyle === 'italic',
          underline:!!o.underline, align: ['left','center','right','justify'].includes(o.textAlign) ? o.textAlign : 'left',
          valign: o.textoDe ? 'middle' : 'top', angle:o.angle || 0, lh:o.lineHeight || 1.16 });
        o.visible = false;
      });
      sc.renderAll();
      const fondo = sc.toDataURL({ format:'png', multiplier:escala });
      sc.dispose();
      ok({ fondo, textos:textosP });
    });
  });
}
async function crearPPTX(lista, escala, editable){
  await cargarScript(URL_PPTX);
  const pptx = new window.PptxGenJS();
  const mayor = Math.max(W, H), wIn = 13.333 * W / mayor, hIn = 13.333 * H / mayor, f = wIn / W;
  pptx.defineLayout({ name:'DISENO', width:wIn, height:hIn }); pptx.layout = 'DISENO';
  pptx.title = nombreArchivo();
  for (const it of lista){
    const { fondo, textos:ts } = await prepararDiapositivaPPTX(it.p, Math.max(1, escala), editable);
    const slide = pptx.addSlide();
    slide.addImage({ data:fondo, x:0, y:0, w:wIn, h:hIn });
    if (it.p && it.p.notas) slide.addNotes(it.p.notas);
    ts.forEach(t => slide.addText(t.texto, {
      x:t.x * f, y:t.y * f, w:Math.max(0.2, t.w * f), h:Math.max(0.2, t.h * f), margin:0,
      fontFace:t.fuente, fontSize:Math.max(6, Math.round(t.px * f * 72 * 10) / 10), color:t.color,
      bold:t.bold, italic:t.italic, underline: t.underline ? { style:'sng' } : undefined,
      align:t.align, valign:t.valign, rotate:t.angle, lineSpacingMultiple:t.lh, fit:'none', wrap:true }));
  }
  return pptx;
}
$('eFormato').addEventListener('change', () => {
  const f = $('eFormato').value;
  $('filaPptx').style.display = f === 'pptx' ? 'flex' : 'none';
  $('filaVideo').style.display = f === 'video' ? 'block' : 'none';
  $('filaImprimir').style.display = f === 'pdf' ? 'block' : 'none'; infoImpresion();
  $('eEscala').closest('.fila').style.display = f === 'video' ? 'none' : 'flex';
  $('eTransp').closest('.fila').style.display = f === 'video' ? 'none' : 'flex';
  $('eTransp').disabled = f !== 'png';
  if (f === 'video' && paginas.length > 1) $('ePaginas').value = 'todas';
});


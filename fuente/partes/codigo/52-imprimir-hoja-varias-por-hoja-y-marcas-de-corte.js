/* =========================================================
   IMPRIMIR: HOJA, VARIAS POR HOJA Y MARCAS DE CORTE
   ========================================================= */
const PAPELES = { carta:[215.9, 279.4], a4:[210, 297], oficio:[216, 340] };
function anchoRealCm(){ return Math.round(W / 300 * 2.54 * 10) / 10; }   // a 300 puntos por pulgada
function acomodoHojas(){
  const [a, b] = PAPELES[$('iPapel').value] || PAPELES.carta;
  const m = Math.max(0, Math.min(40, +$('iMargen').value || 0)), marcas = $('iMarcas').checked, r = H / W;
  const prueba = (pw, ph) => {
    const aw = pw - 2 * m, ah = ph - 2 * m;
    if ($('iAcomodo').value === 'una'){
      const w = Math.min(aw, ah / r), h = w * r;
      return { pw, ph, cols:1, filas:1, w, h, gap:0 };
    }
    let w = Math.max(5, (+$('iAncho').value || anchoRealCm()) * 10), h = w * r;
    const gap = marcas ? 10 : 4;
    let cols = Math.floor((aw + gap) / (w + gap)), filas = Math.floor((ah + gap) / (h + gap));
    if (cols < 1 || filas < 1){ w = Math.min(aw, ah / r); h = w * r; cols = filas = 1; }
    return { pw, ph, cols, filas, w, h, gap };
  };
  const v = prueba(Math.min(a, b), Math.max(a, b)), hz = prueba(Math.max(a, b), Math.min(a, b));
  let L = v.cols * v.filas > hz.cols * hz.filas ? v : hz.cols * hz.filas > v.cols * v.filas ? hz : (W > H ? hz : v);
  const anchoGrid = L.cols * L.w + (L.cols - 1) * L.gap, altoGrid = L.filas * L.h + (L.filas - 1) * L.gap;
  const x0 = (L.pw - anchoGrid) / 2, y0 = (L.ph - altoGrid) / 2, lugares = [];
  for (let f = 0; f < L.filas; f++) for (let c = 0; c < L.cols; c++) lugares.push({ x:x0 + c * (L.w + L.gap), y:y0 + f * (L.h + L.gap), w:L.w, h:L.h });
  return { ...L, lugares, marcas };
}
function infoImpresion(){
  const pdfHoja = $('eFormato').value === 'pdf' && $('iPapel').value !== 'diseno';
  $('filaHoja').style.display = pdfHoja ? 'block' : 'none';
  if (!pdfHoja) return;
  const varias = $('iAcomodo').value === 'varias';
  $('filaAncho').style.display = varias ? 'flex' : 'none';
  if (varias && !+$('iAncho').value) $('iAncho').value = anchoRealCm();
  const L = acomodoHojas(), n = paginasAExportar().length * Math.max(1, +$('iCopias').value || 1);
  $('iInfo').textContent = 'Cada una mide ' + (L.w / 10).toFixed(1) + ' × ' + (L.h / 10).toFixed(1) + ' cm · caben ' + L.lugares.length + ' por hoja · ' +
    Math.ceil(n / L.lugares.length) + (Math.ceil(n / L.lugares.length) === 1 ? ' hoja' : ' hojas') + (L.pw > L.ph ? ' (horizontal)' : ' (vertical)');
}
function marcasDeCorte(pdf, r){
  const l = 4, s = 1.2;
  pdf.setDrawColor(40); pdf.setLineWidth(0.2);
  [[r.x, r.y, -1, -1], [r.x + r.w, r.y, 1, -1], [r.x, r.y + r.h, -1, 1], [r.x + r.w, r.y + r.h, 1, 1]].forEach(([x, y, dx, dy]) => {
    pdf.line(x + dx * s, y, x + dx * (s + l), y);
    pdf.line(x, y + dy * s, x, y + dy * (s + l));
  });
}
['iPapel', 'iAcomodo', 'iAncho', 'iCopias', 'iMargen', 'iMarcas', 'ePaginas'].forEach(id => { $(id).addEventListener('change', infoImpresion); $(id).addEventListener('input', infoImpresion); });
$('iAcomodo').addEventListener('change', () => { if ($('iAcomodo').value === 'varias') $('iMarcas').checked = true; infoImpresion(); });
async function crearPDFHojas(lista){
  await cargarJsPDF();
  const { jsPDF } = window.jspdf, L = acomodoHojas(), copias = Math.max(1, Math.min(200, +$('iCopias').value || 1));
  const items = []; lista.forEach(it => { for (let k = 0; k < copias; k++) items.push(it); });
  const pdf = new jsPDF({ orientation:L.pw > L.ph ? 'landscape' : 'portrait', unit:'mm', format:[L.pw, L.ph], compress:true });
  const escala = Math.max(0.5, Math.min(4, (L.w / 25.4 * 300) / W)), imgs = {};
  for (let k = 0; k < items.length; k++){
    const lugar = k % L.lugares.length;
    if (k && !lugar) pdf.addPage([L.pw, L.ph], L.pw > L.ph ? 'landscape' : 'portrait');
    const it = items[k], r = L.lugares[lugar];
    if (!imgs[it.i]) imgs[it.i] = await renderPagina(it.p, 'jpeg', escala, false);
    pdf.addImage(imgs[it.i], 'JPEG', r.x, r.y, r.w, r.h, 'pag' + it.i, 'FAST');
    if (L.marcas) marcasDeCorte(pdf, r);
  }
  return pdf;
}
// Vista previa de las hojas tal como saldrán impresas
async function vistaHojas(lista){
  const L = acomodoHojas(), copias = Math.max(1, +$('iCopias').value || 1), k = 2.2;   // pixeles por mm en la vista
  const items = []; lista.forEach(it => { for (let c = 0; c < copias; c++) items.push(it); });
  const hojas = Math.min(6, Math.ceil(items.length / L.lugares.length)), urls = [], cache = {};
  for (let hj = 0; hj < hojas; hj++){
    const cv = document.createElement('canvas'); cv.width = L.pw * k; cv.height = L.ph * k;
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    for (let s = 0; s < L.lugares.length; s++){
      const it = items[hj * L.lugares.length + s]; if (!it) break;
      if (!cache[it.i]){ const im = new Image(); im.src = await renderPagina(it.p, 'jpeg', Math.min(1, L.w * k * 1.5 / W), false); await new Promise(r => im.onload = r); cache[it.i] = im; }
      const r = L.lugares[s]; g.drawImage(cache[it.i], r.x * k, r.y * k, r.w * k, r.h * k);
      if (L.marcas){ g.strokeStyle = '#333'; g.lineWidth = 1; g.beginPath();
        [[r.x, r.y, -1, -1], [r.x + r.w, r.y, 1, -1], [r.x, r.y + r.h, -1, 1], [r.x + r.w, r.y + r.h, 1, 1]].forEach(([x, y, dx, dy]) => {
          g.moveTo((x + dx * 1.2) * k, y * k); g.lineTo((x + dx * 5.2) * k, y * k); g.moveTo(x * k, (y + dy * 1.2) * k); g.lineTo(x * k, (y + dy * 5.2) * k); });
        g.stroke(); }
    }
    urls.push(cv.toDataURL('image/jpeg', 0.85));
  }
  return urls;
}


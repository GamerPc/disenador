/* =========================================================
   TAMAÑOS
   ========================================================= */
TAMANOS.forEach(([n, w, h]) => {
  const b = document.createElement('button'); b.className = 'bigbtn';
  b.innerHTML = `${esc(n)} <span style="float:right;color:#6b7280">${w} × ${h}</span>`;
  b.onclick = () => aplicarTamano(w, h);
  $('listaTamanos').appendChild(b);
});
function aplicarTamanoPers(){
  const w = +$('tamW').value, h = +$('tamH').value;
  if (w < 50 || h < 50 || w > 8000 || h > 8000) return toast('Usa medidas entre 50 y 8000 px');
  aplicarTamano(w, h);
}


/* =========================================================
   MIS COLORES
   ========================================================= */
let misColores = [];
try { misColores = JSON.parse(localStorage.getItem('disenador_colores') || '[]'); } catch(e){}
if (!misColores.length) misColores = ['#7c3aed', '#06b6d4', '#1f2330', '#ffffff'];
function guardarColores(){
  try { localStorage.setItem('disenador_colores', JSON.stringify(misColores)); } catch(e){}
  renderMisColores();
}
function renderMisColores(){
  const c = $('misColores'); c.innerHTML = '';
  misColores.forEach((col, i) => {
    const d = document.createElement('div'); d.className = 'sw'; d.style.background = col; d.title = col;
    d.onclick = () => { $('pRelleno').value = col; aplicar('fill', col); };
    d.ondblclick = () => { misColores.splice(i, 1); guardarColores(); };
    c.appendChild(d);
  });
  const mas = document.createElement('button'); mas.className = 'pb'; mas.textContent = '+'; mas.title = 'Guardar el color actual';
  mas.onclick = () => { const v = $('pRelleno').value; if (!misColores.includes(v)){ misColores.push(v); guardarColores(); } };
  c.appendChild(mas);
}
renderMisColores();


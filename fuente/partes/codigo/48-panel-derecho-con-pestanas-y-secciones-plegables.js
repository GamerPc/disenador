/* =========================================================
   PANEL DERECHO CON PESTAÑAS Y SECCIONES PLEGABLES
   ========================================================= */
(function reorganizarPanel(){
  const props = $('props'), cont = $('propsCont');
  const barra = document.createElement('div'); barra.className = 'tabsProps';
  barra.innerHTML = [['diseno','Diseño'],['organizar','Organizar'],['animar','Animar'],['capas','Capas']]
    .map(([k, n]) => `<button data-pt="${k}">${n}</button>`).join('');
  const nueva = id => { const d = document.createElement('div'); d.className = 'ptab'; d.id = id; return d; };
  const tD = nueva('ptDiseno'), tO = nueva('ptOrganizar'), tA = nueva('ptAnimar'), tC = nueva('ptCapas');
  // Organizar: todo lo que va desde el título "Organizar" hasta el final
  const hOrg = [...cont.children].find(x => x.tagName === 'H4' && x.textContent.trim() === 'Organizar');
  const reqO = document.createElement('div'); reqO.className = 'reqSel';
  for (let n = hOrg; n; ){ const sig = n.nextElementSibling; reqO.appendChild(n); n = sig; }
  tO.appendChild(reqO);
  tO.insertAdjacentHTML('beforeend', '<p class="hint hintSel">Selecciona un elemento para alinearlo, ordenarlo, duplicarlo o eliminarlo.</p>');
  // Animar
  const reqA = document.createElement('div'); reqA.className = 'reqSel'; reqA.appendChild($('secAnim'));
  tA.appendChild(reqA);
  tA.insertAdjacentHTML('beforeend', '<p class="hint hintSel">Selecciona un elemento para animarlo, o usa <b>▶ Presentar → Animar esta página</b> para animar todo de una vez.</p>');
  // Capas
  const hC = [...props.children].find(x => x.tagName === 'H4' && x.textContent.trim() === 'Capas');
  hC.innerHTML = 'Capas <span id="numCapas" style="font-weight:400"></span>';
  tC.appendChild(hC); tC.appendChild($('capas'));
  tC.insertAdjacentHTML('beforeend', '<p class="hint" style="font-size:11px">Arrastra para cambiar el orden · doble clic en un nombre para renombrarlo.</p>');
  // Diseño
  tD.appendChild($('sinSel')); tD.appendChild(cont);
  const cierre = props.querySelector('.cerrarHoja');
  props.innerHTML = ''; props.append(...(cierre ? [cierre] : []), barra, tD, tO, tA, tC);
  // Agrupa títulos sueltos con sus controles para poder plegarlos
  let grupo = null;
  [...cont.children].forEach(el => {
    if (el.tagName === 'H4'){ grupo = document.createElement('div'); grupo.className = 'secGen'; cont.insertBefore(grupo, el); grupo.appendChild(el); }
    else if (el.tagName === 'DIV' && el.id) grupo = null;
    else if (grupo) grupo.appendChild(el);
  });
  let plegados = [];
  try { plegados = JSON.parse(localStorage.getItem('disenador_plegados') || '[]'); } catch(e){}
  cont.querySelectorAll('h4').forEach(h4 => {
    const sec = h4.parentElement;
    if (sec.firstElementChild !== h4 || sec === cont) return;
    h4.classList.add('plegable');
    const clave = h4.textContent.trim();
    if (plegados.includes(clave)) sec.classList.add('plegado');
    h4.onclick = () => {
      sec.classList.toggle('plegado');
      plegados = plegados.filter(x => x !== clave); if (sec.classList.contains('plegado')) plegados.push(clave);
      try { localStorage.setItem('disenador_plegados', JSON.stringify(plegados)); } catch(e){}
    };
  });
  // Pestañas
  let tab = 'diseno';
  try { tab = localStorage.getItem('disenador_tabProps') || 'diseno'; } catch(e){}
  const mostrar = k => {
    barra.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.pt === k));
    [['diseno', tD], ['organizar', tO], ['animar', tA], ['capas', tC]].forEach(([n, el]) => el.classList.toggle('on', n === k));
    try { localStorage.setItem('disenador_tabProps', k); } catch(e){}
    if (k === 'capas') renderCapas();
  };
  barra.querySelectorAll('button').forEach(b => b.onclick = () => mostrar(b.dataset.pt));
  mostrar(tab);
})();
// Muestra u oculta lo que necesita algo seleccionado en las pestañas Organizar y Animar
function actualizarPestanas(){
  const hay = !!activo();
  document.querySelectorAll('.reqSel').forEach(x => x.hidden = !hay);
  document.querySelectorAll('.hintSel').forEach(x => x.hidden = hay);
}
['selection:created','selection:updated','selection:cleared'].forEach(ev => canvas.on(ev, actualizarPestanas));
actualizarPestanas();


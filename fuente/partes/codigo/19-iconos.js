/* =========================================================
   ÍCONOS
   ========================================================= */
const ICONOS = {
  'Palomita':   'M9 16.2 L4.8 12 L3.4 13.4 L9 19 L21 7 L19.6 5.6 Z',
  'Tache':      'M6.4 5 L5 6.4 L10.6 12 L5 17.6 L6.4 19 L12 13.4 L17.6 19 L19 17.6 L13.4 12 L19 6.4 L17.6 5 L12 10.6 Z',
  'Flecha':     'M4 11 L16.2 11 L10.6 5.4 L12 4 L20 12 L12 20 L10.6 18.6 L16.2 13 L4 13 Z',
  'Ubicación':  'M12 2 C8.1 2 5 5.1 5 9 C5 14.2 12 22 12 22 C12 22 19 14.2 19 9 C19 5.1 15.9 2 12 2 Z M12 6.5 A2.5 2.5 0 1 1 12 11.5 A2.5 2.5 0 1 1 12 6.5 Z',
  'Correo':     'M2 5 L22 5 L22 19 L2 19 Z M4 7.5 L4 17 L20 17 L20 7.5 L12 13 Z',
  'Calendario': 'M3 4 L21 4 L21 21 L3 21 Z M5 9 L19 9 L19 19 L5 19 Z M7 1.5 L9 1.5 L9 4 L7 4 Z M15 1.5 L17 1.5 L17 4 L15 4 Z',
  'Reloj':      'M12 2 A10 10 0 1 0 12 22 A10 10 0 1 0 12 2 Z M12 4 A8 8 0 1 1 12 20 A8 8 0 1 1 12 4 Z M11 6 L13 6 L13 11.4 L16.8 13.6 L15.8 15.3 L11 12.5 Z',
  'Información':'M12 2 A10 10 0 1 0 12 22 A10 10 0 1 0 12 2 Z M11 10 L13 10 L13 17 L11 17 Z M11 6.5 L13 6.5 L13 8.5 L11 8.5 Z',
  'Persona':    'M12 3 A4 4 0 1 1 12 11 A4 4 0 1 1 12 3 Z M4 21 C4 16.6 7.6 13.5 12 13.5 C16.4 13.5 20 16.6 20 21 Z',
  'Libro':      'M3 4.5 L10 4.5 C11 4.5 11.5 5.2 11.5 6 L11.5 20 C11.5 19.2 11 18.5 10 18.5 L3 18.5 Z M21 4.5 L14 4.5 C13 4.5 12.5 5.2 12.5 6 L12.5 20 C12.5 19.2 13 18.5 14 18.5 L21 18.5 Z',
  'Birrete':    'M12 3 L1 9 L12 15 L21 10.1 L21 17 L23 17 L23 9 Z M5 13.2 L5 17 C5 18.7 8.1 20 12 20 C15.9 20 19 18.7 19 17 L19 13.2 L12 17 Z',
  'Balanza':    'M11 2 L13 2 L13 5 L19 5 L19 7 L18.2 7 L21 13.5 C21 15.2 19.7 16.5 18 16.5 C16.3 16.5 15 15.2 15 13.5 L17.8 7 L13 7 L13 20 L17 20 L17 22 L7 22 L7 20 L11 20 L11 7 L6.2 7 L9 13.5 C9 15.2 7.7 16.5 6 16.5 C4.3 16.5 3 15.2 3 13.5 L5.8 7 L5 7 L5 5 L11 5 Z',
  'Foco':       'M12 2 C8.1 2 5 5.1 5 9 C5 11.4 6.2 13.5 8 14.7 L8 17 L16 17 L16 14.7 C17.8 13.5 19 11.4 19 9 C19 5.1 15.9 2 12 2 Z M9 18 L15 18 L15 20 L9 20 Z M10 21 L14 21 L14 22 L10 22 Z',
  'Advertencia':'M12 2 L1 21 L23 21 Z M11 9 L13 9 L13 15 L11 15 Z M11 17 L13 17 L13 19 L11 19 Z',
  'Diálogo':    'M3 3 L21 3 L21 16 L9 16 L4 20.5 L4 16 L3 16 Z'
};
function agregarIcono(nombre, d){
  const p = new fabric.Path(d, { fill: $('colorForma').value, fillRule:'evenodd', strokeWidth:0, stroke:null,
    originX:'center', originY:'center', left:W/2, top:H/2 });
  p.scaleToWidth(200 * s());
  agregar(p, nombre);
}
Object.entries(ICONOS).forEach(([n, d]) => {
  const b = document.createElement('button'); b.className = 'forma'; b.title = n;
  b.innerHTML = `<svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="${d}"/></svg>`;
  b.onclick = () => agregarIcono(n, d);
  $('gridIconos').appendChild(b);
});


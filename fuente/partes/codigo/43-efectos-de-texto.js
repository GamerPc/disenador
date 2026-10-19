/* =========================================================
   EFECTOS DE TEXTO
   ========================================================= */
const EFECTOS_TEXTO = {
  ninguno:  { n:'Ninguno',  css:'' },
  sombra:   { n:'Sombra',   css:'text-shadow:2px 3px 5px rgba(0,0,0,.35)' },
  retro:    { n:'Retro',    css:'text-shadow:3px 3px 0 #f472b6' },
  contorno: { n:'Contorno', css:'-webkit-text-stroke:1.2px #1f2330' },
  hueco:    { n:'Hueco',    css:'color:transparent;-webkit-text-stroke:1.2px #7c3aed' },
  sticker:  { n:'Sticker',  css:'text-shadow:0 0 0 #fff,2px 0 #fff,-2px 0 #fff,0 2px #fff,0 -2px #fff,2px 2px #fff,-2px -2px #fff,2px -2px #fff,-2px 2px #fff,1px 3px 4px rgba(0,0,0,.4)' },
  neon:     { n:'Neón',     css:'text-shadow:0 0 6px #a855f7,0 0 12px #a855f7' },
  fondo:    { n:'Fondo',    css:'background:#fde047;padding:0 4px' }
};
function aplicarEfectoTexto(t, efecto){
  const fs = t.fontSize;
  if (t.efectoTexto === 'hueco' && t.rellenoOriginal) t.set('fill', t.rellenoOriginal);
  t.set({ shadow:null, stroke:null, strokeWidth:0, paintFirst:'fill', textBackgroundColor:'' });
  t.rellenoOriginal = null;
  const color = typeof t.fill === 'string' ? t.fill : '#7c3aed';
  switch (efecto){
    case 'sombra':   t.set('shadow', new fabric.Shadow({ color:'rgba(0,0,0,.35)', blur:fs * 0.22, offsetX:fs * 0.05, offsetY:fs * 0.07 })); break;
    case 'retro':    t.set('shadow', new fabric.Shadow({ color: esOscuro(color) ? '#f472b6' : '#1f2330', blur:0, offsetX:fs * 0.06, offsetY:fs * 0.06 })); break;
    case 'contorno': t.set({ stroke:'#1f2330', strokeWidth:Math.max(1, fs * 0.07), paintFirst:'stroke' }); break;
    case 'hueco':    t.rellenoOriginal = color; t.set({ fill:'rgba(0,0,0,0)', stroke:color, strokeWidth:Math.max(1, fs * 0.04) }); break;
    case 'sticker':  t.set({ stroke:'#ffffff', strokeWidth:Math.max(2, fs * 0.2), paintFirst:'stroke', strokeLineJoin:'round',
                       shadow:new fabric.Shadow({ color:'rgba(0,0,0,.28)', blur:fs * 0.14, offsetX:fs * 0.03, offsetY:fs * 0.05 }) }); break;
    case 'neon':     t.set('shadow', new fabric.Shadow({ color, blur:fs * 0.55, offsetX:0, offsetY:0 })); break;
    case 'fondo':    t.set('textBackgroundColor', '#fde047'); break;
  }
  t.efectoTexto = efecto === 'ninguno' ? null : efecto;
  t.initDimensions && t.initDimensions();
  t.dirty = true;
}
Object.entries(EFECTOS_TEXTO).forEach(([k, e]) => {
  const b = document.createElement('button'); b.className = 'efectoBtn'; b.dataset.e = k; b.title = e.n;
  b.innerHTML = `<b style="${e.css}">Aa</b>${e.n}`;
  b.onclick = () => { textos().forEach(t => aplicarEfectoTexto(t, k)); canvas.requestRenderAll(); actualizarPanel(); guardarEstado(); };
  $('efectosTexto').appendChild(b);
});


/* =========================================================
   EMOJIS Y LISTAS
   ========================================================= */
const EMOJIS = ['📚','✏️','📝','📌','📎','🔍','💡','⭐','✨','🎓','🧠','📊','📈','📅','⏰','✅','❌','⚠️','❓','❗','💬','👍','👏','🙌',
  '🎯','🏆','🌱','🌎','♻️','⚖️','🏛️','🔬','🧪','🧮','💻','📱','🎨','🎵','❤️','💜','💙','💚','💛','🧡','🌸','🌼','🍎','☀️'];
EMOJIS.forEach(em => {
  const b = document.createElement('button'); b.className = 'emojiBtn'; b.textContent = em; b.title = 'Agregar';
  b.onclick = () => {
    const t = new fabric.Text(em, { fontSize:140 * s(), fontFamily:'"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif',
      originX:'center', originY:'center', left:W/2, top:H/2, esDeco:true });
    agregar(t, 'Emoji');
  };
  $('gridEmojis').appendChild(b);
});
// Pone o quita viñetas / números al inicio de cada renglón
function hacerLista(tipo){
  const quitar = l => l.replace(/^\s*(•|–|-|\d+[.)])\s+/, '');
  textos().forEach(t => {
    const lineas = t.text.split('\n');
    const ya = lineas.every(l => !l.trim() || (tipo === 'v' ? /^\s*•\s/.test(l) : /^\s*\d+[.)]\s/.test(l)));
    let n = 0;
    t.set('text', lineas.map(l => !l.trim() ? l : ya ? quitar(l) : (tipo === 'v' ? '• ' : (++n) + '. ') + quitar(l)).join('\n'));
    if (!ya) t.set('textAlign', 'left');
    t.initDimensions(); if (t.textoDe) ajustarFormaATexto(t);
  });
  canvas.requestRenderAll(); guardarEstado();
}


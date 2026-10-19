# Arma fuente/Index.completo.html a partir de fuente/partes/ (pagina.html + estilos.css + codigo/*.js en orden de nombre).
# Para cambiar algo, edita el archivo de la parte que corresponda y corre construir.py (que llama a esto primero).
import os
F = os.path.dirname(os.path.abspath(__file__)) + '/'
P = F + 'partes/'
def ensamblar():
    pagina = open(P + 'pagina.html', encoding='utf-8').read()
    css = open(P + 'estilos.css', encoding='utf-8').read()
    partes = sorted(x for x in os.listdir(P + 'codigo') if x.endswith('.js'))
    assert partes[-1].startswith('99-'), 'la última parte debe ser 99-pestanas-e-inicio.js'
    js = ''.join(open(P + 'codigo/' + x, encoding='utf-8').read() for x in partes)
    assert pagina.count('{{ESTILOS}}') == 1 and pagina.count('{{CODIGO}}') == 1
    h = pagina.replace('{{ESTILOS}}', css).replace('{{CODIGO}}', js)
    open(F + 'Index.completo.html', 'w', encoding='utf-8').write(h)
    return len(partes), len(h)
if __name__ == '__main__':
    print('Index.completo.html armado: %d partes, %d caracteres' % ensamblar())

# Diseñador · Apik-Desing

**Página de presentación:** https://gamerpc.github.io/disenador/inicio.html · **App:** https://gamerpc.github.io/disenador/

Editor de diseño **gratuito** para la escuela y el trabajo: carteles, mapas mentales y conceptuales, diagramas de flujo, infografías, presentaciones con animaciones, plantillas de Derecho, logos, **páginas web y pantallas de apps** (con modelos 3D) y más. Exporta a PNG, JPG, PDF (con marcas de corte), PowerPoint, SVG, video MP4 y **página web HTML** con animaciones al hacer scroll, efectos al pasar el mouse y modelos 3D.

La carpeta `modelos/` tiene los modelos 3D de ejemplo (audífonos que se desarman y lata). Se cargan desde `https://gamerpc.github.io/disenador/modelos/`, así que deben quedar publicados en GitHub Pages.

El sistema tiene **dos versiones** que salen del mismo código:

| Versión | Dónde vive | Dónde se guardan los diseños |
|---|---|---|
| **Web** (`index.html`, `js/`, `config.js`) | GitHub Pages o cualquier hosting | En el navegador de cada persona (y como archivo descargable) |
| **Apps Script** (`apps-script/`) | script.google.com | En el Google Drive de cada persona |

---

## 1. Publicar la versión web en GitHub Pages (gratis)

### Opción fácil (sin instalar nada)
1. Crea una cuenta en **github.com** (o entra con la tuya).
2. Arriba a la derecha: **＋ → New repository**.
   - Nombre: por ejemplo `disenador`
   - Marca **Public** (GitHub Pages gratis necesita que sea público)
   - Pulsa **Create repository**.
3. En la página del repositorio pulsa **uploading an existing file**.
4. Arrastra **todo el contenido** de esta carpeta (los archivos `index.html`, `config.js`, `README.md`, `.nojekyll` y las carpetas `js`, `apps-script`, `fuente` y `.github`). Pulsa **Commit changes**.
   > Si tu explorador no muestra los archivos que empiezan con punto (`.nojekyll`, `.github`), activa “mostrar archivos ocultos”. Si no, no pasa nada: la app funciona sin ellos.
5. Ve a **Settings → Pages**.
   - En **Source** elige **Deploy from a branch**.
   - En **Branch** elige **main** y la carpeta **/ (root)** → **Save**.
6. Espera 1–2 minutos y recarga la página: aparecerá tu dirección, algo como
   `https://TU-USUARIO.github.io/disenador/`

### Opción con git (si ya lo usas)
```bash
git remote add origin https://github.com/TU-USUARIO/disenador.git
git branch -M main
git push -u origin main
```
Después activa **Settings → Pages** igual que en el paso 5.

### Cuando compren su propio hosting o dominio
La versión web son archivos estáticos: solo copia `index.html`, `config.js` y la carpeta `js/` a tu hosting (por FTP o el administrador de archivos) y listo. También puedes conectar un dominio propio a GitHub Pages en **Settings → Pages → Custom domain**.

---

## 2. Recibir donaciones

### Botón ❤ Apoyar dentro de la app
Abre **`config.js`** y pon tus enlaces en `url` (deben empezar con `https://`). Los que dejes vacíos no se muestran:

```js
{ nombre: 'Mercado Pago', icono: '💳', detalle: 'Tarjeta, OXXO o saldo', url: 'https://link.mercadopago.com.mx/tunombre' },
{ nombre: 'PayPal',       icono: '🅿', detalle: 'Desde cualquier país',  url: 'https://paypal.me/tunombre' },
```

Ideas de dónde sacar los enlaces (revisa los requisitos y comisiones de cada uno):
- **Mercado Pago**: crea un *link de pago* o una página de cobro desde tu cuenta.
- **PayPal**: crea tu enlace en **paypal.me**.
- **Ko-fi** (ko-fi.com): página para recibir “cafés”.
- **GitHub Sponsors**: se solicita desde tu perfil de GitHub; requiere aprobación.

En GitHub puedes editar `config.js` directamente: abre el archivo → ✏️ → cambia los enlaces → **Commit changes**. La página se actualiza sola en 1–2 minutos.

> **No pongas datos bancarios (CLABE, número de tarjeta) en el código**: el repositorio es público.

### Botón “Sponsor” en el repositorio
Edita **`.github/FUNDING.yml`**, quita el `#` de la línea que uses y pon tu usuario o enlace. GitHub mostrará un botón ❤ **Sponsor** en tu repositorio.

### En la versión de Apps Script
Los enlaces están al final de `apps-script/Index.html`, en el bloque `window.APIK_CONFIG = { ... }`. Cámbialos igual que en `config.js`.

---

## 3. Guardar en la nube (opcional, gratis con Firebase)

Sin esto, la versión web guarda los diseños **en el navegador** de cada persona. Con Firebase aparece el botón **☁ Entrar**: cada quien entra con su cuenta de Google y sus diseños, plantillas y kit de marca quedan en la nube (los ve en cualquier computadora o celular), y **Compartir** crea un enlace que cualquiera puede abrir.

1. Entra a **console.firebase.google.com** → **Crear un proyecto** (por ejemplo `disenador-apik`). Google Analytics no es necesario.
2. **Compilación → Authentication → Comenzar → Google → Habilitar** → elige tu correo de asistencia → **Guardar**.
3. En **Authentication → Configuración → Dominios autorizados** agrega `gamerpc.github.io` (y tu dominio propio, si lo conectas).
4. **Compilación → Firestore Database → Crear base de datos** → ubicación `nam5` o la más cercana → **modo de producción**.
5. En **Firestore → Reglas**, borra lo que hay, pega el contenido del archivo **`firestore.rules`** de este repositorio y pulsa **Publicar**. Cada vez que este archivo cambie (por ejemplo, al agregar el modo escuela y el trabajo en equipo), vuelve a copiarlo y publicarlo.
6. **⚙ Configuración del proyecto → Tus apps → `</>` (Web)** → ponle un nombre → **Registrar app**. Copia los datos que aparecen en `firebaseConfig`.
7. Abre **`config.js`** y cambia `firebase: null,` por tus datos, por ejemplo:
   ```js
   firebase: { apiKey: 'AIza…', authDomain: 'disenador-apik.firebaseapp.com', projectId: 'disenador-apik', appId: '1:…:web:…' },
   ```
   Estos datos **no son secretos** (Google los diseñó para ir en la página); lo que protege los diseños son las reglas del paso 5: cada persona solo puede ver y cambiar lo suyo.
8. Guarda el cambio (commit). En 1–2 minutos aparece **☁ Entrar** en la barra.

El plan gratuito (Spark) alcanza para empezar: 1 GB de almacenamiento y 50,000 lecturas al día. Firebase no pide tarjeta para este plan.

---

### Funciones que usan la nube
- **🎓 Escuela** (`fuente/escuela.js`): grupos con código, actividades con plantilla, entregas y calificaciones. Datos en `grupos/…`.
- **👥 Equipo** (`fuente/equipo.js`): edición al mismo tiempo (cada elemento del diseño es un documento en `equipos/{id}/objetos`), quién está conectado y comentarios.
- Solo existen en la versión web (la de Apps Script guarda en Drive).

## 4. App instalable

La versión web se puede **instalar** como app (botón **📲 Instalar**, o en el celular: menú ⋮ → *Instalar app*; en iPhone: Compartir → *Agregar a inicio*). Abre aunque no haya internet y avisa cuando hay una versión nueva.

---

## 5. Importante sobre la versión web

- Sin la nube (sección 3), los diseños se guardan **en el navegador** de cada persona. Si borra los datos del navegador o cambia de computadora, no los verá.
- Por eso en **📂 Abrir** están los botones **⬇ Descargar este diseño** (archivo `.apik.json`) y **📂 Abrir un archivo**: sirven como copia de seguridad y para pasar diseños a otra computadora.
- **Compartir** en la versión web descarga el diseño como archivo para mandarlo por WhatsApp o correo.
- Las exportaciones (PNG, PDF, PowerPoint, video) se descargan directo a la computadora.

---

## 6. Versión de Google Apps Script (con Google Drive)

1. En **script.google.com** crea un proyecto.
2. Pega `apps-script/Code.gs` en `Código.gs`.
3. Crea un archivo HTML por cada archivo de `apps-script/` (`Index`, `Estilo`, `Codigo1`, `Codigo2`… todos los que haya) con **exactamente** ese nombre y pega su contenido.
4. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Usuario que accede a la aplicación web**
   - Quién tiene acceso: **Cualquier persona con una cuenta de Google**

---

## 7. Cómo se actualiza el sistema (para quien programa)

El código está ordenado por partes en **`fuente/partes/`**:

| Archivo | Qué tiene |
|---|---|
| `pagina.html` | El esqueleto de la pantalla: barra, pestañas, paneles y ventanas |
| `estilos.css` | Todos los estilos (colores, tamaños, modo celular) |
| `codigo/01-….js` a `codigo/99-pestanas-e-inicio.js` | El programa, una parte por tema: lienzo, texto, plantillas, exportar, presentaciones, 3D, etc. Se juntan en orden de número. `99` siempre va al final porque arranca la app |

Para cambiar algo, edita la parte que corresponde. Para agregar una función nueva, crea `codigo/NN-mi-funcion.js` con un número antes del 99.

Después de cambiar algo:
```bash
python3 fuente/construir.py
```
Eso junta las partes en `fuente/Index.completo.html` y genera **las dos versiones** (`index.html` + `js/` y la carpeta `apps-script/`). Luego sube los cambios (commit) y GitHub Pages se actualiza solo.

Para que una parte nueva se conecte con lo que ya existe, sin tapar código de otras partes:
- **Panel de propiedades:** `alActualizarPanel(function(){ … })` se ejecuta cada vez que cambia lo seleccionado.
- **Nuevo formato para exportar:** `FORMATO('miFormato').descargar = async function(){ … }` (también `.vista` y `.drive`), y agrega su opción al menú `eFormato`.

`construir.py` también revisa que no haya funciones con el mismo nombre (una taparía a la otra), parte el código en archivos pequeños para Apps Script y pone una huella (`?v=…`) a cada archivo para que el navegador siempre cargue el más nuevo.

Prueba rápida (necesita Python con Playwright): `python3 pruebas/humo.py` abre la app sin internet de por medio, revisa que no haya errores y que las plantillas y la exportación funcionen.

---

## Licencia

Aún no se ha elegido una licencia. Mientras no agreguen un archivo `LICENSE`, el código es de sus autores y nadie más puede reutilizarlo legalmente. Si quieren que otros puedan usarlo y mejorarlo, pueden agregar una (por ejemplo MIT o GPL) desde GitHub: **Add file → Create new file → `LICENSE` → Choose a license template**.

## v36: guías, cuidado de la nube, modo claro y primeros pasos
- `guia.html` (+ `guia-maestros.pdf`, `guia-alumnos.pdf`, `img/guia/`): guías del modo escuela para imprimir o compartir.
- `fuente/nube.js`: antes de subir, las fotos pesadas se re-comprimen (WebP/JPEG, máx. 1800 px) sin cambiar cómo se ven; límite de 12 MB por diseño; los errores de la nube (límite diario, sin conexión, permisos) se explican con palabras sencillas.
- `fuente/equipo.js`: la presencia se actualiza cada 40 s y solo con la pestaña visible (menos escrituras).
- `74-modo-claro-atajos-y-primeros-pasos.js`: botón ☀/☾ (se recuerda), atajos nuevos (T, R, O, L, I, Ctrl+E, Ctrl+↑/↓, Ctrl+B/I/U, Ctrl+Shift+L) visibles en botones, menú «Más» y ayuda; práctica guiada «Primeros pasos» que avanza cuando el usuario hace cada cosa.

## v38: interfaz limpia
- `76-interfaz-limpia.js`: menú «Archivo» (nuevo, abrir, buscar, ayuda, modo claro, apoyar…), panel izquierdo que se oculta (flecha o clic en la pestaña activa), panel derecho flotante que solo aparece con algo seleccionado (o con «Capas»), barra flotante junto a lo seleccionado, pie con notas · páginas (ocultables) · zoom, y modo enfoque (Ctrl + \). Se puede volver a la interfaz clásica desde Archivo.
- `75-menu-de-clic-derecho.js`: menú contextual (clic derecho, dedo presionado o Shift + F10).
- `69`: los elementos con `data-fuera` viven fuera de la barra (menú Archivo o pie) y la barra adaptable los respeta.

## v40: barra rápida, medidas y conectores a mano
- `77-barra-rapida-medidas-y-conectores-a-mano.js`: barra arriba del lienzo según lo seleccionado (texto, forma, imagen, línea, varios). Cada botón abre una ventanita que usa los controles reales del panel (se prestan y se regresan). «Posición» trae orden, alinear y medidas exactas; la brocha copia el estilo al siguiente elemento que tocas.
- Aviso «ancho / alto» (y grados al girar) mientras cambias el tamaño.
- Conectores: los extremos se pueden soltar en el vacío (`libreA`/`libreB`) o en el lado exacto de una forma (`ladoA`/`ladoB` fijos); punto de en medio para doblar la línea (`desvio`); doble clic lo endereza.
- Con la interfaz limpia, el panel derecho completo solo se abre con ⚙ o «Capas».

## v41: de imagen a diagrama editable
- `78-imagen-a-diagrama.js`: sube o pega una imagen de un diagrama; Gemini (clave del usuario, en su navegador) devuelve JSON con cajas, textos, colores, líneas y conexiones (coordenadas 0-1000) y se arma con `nodo()`, `fabric.Textbox`, conectores libres y `unir()`. Opción de dejar la imagen original atrás como guía. Accesos: pestañas Diagramas e Imágenes, clic derecho y barra rápida sobre una imagen.

## v42: opciones a la izquierda, más colores y más fuentes
- Las opciones de la barra rápida (color, borde, efectos, animar, posición, fuentes, ⚙ todas las opciones y Capas) se abren en el panel izquierdo (`#tOpciones`), como Canva; los controles reales del panel se prestan y se regresan.
- `79-mas-colores-y-fuentes.js`: paleta de colores sólidos (de tu diseño, frecuentes, 150 tonos y código #hex) en Relleno y Borde; más de 170 fuentes de Google por categorías, con buscador y vista de cada nombre en su letra; se descargan solo al usarlas (y al abrir diseños que las usan).
- Arreglo: tocar dos veces «Posición», «Lista» o «Alinear» ya no da error.

## v46: pegar tablas y texto de Word, Excel y Google Docs
- `80-pegar-tablas-de-word-y-excel.js`: Ctrl+V con una tabla copiada (HTML del portapapeles) arma una tabla editable con filas, columnas, anchos proporcionales, color de cada celda, color de letra, negritas, alineación, saltos de línea y viñetas; celdas combinadas se respetan (texto en la primera). Texto con tabuladores (Excel/Sheets) también; texto normal crea un cuadro de texto. Si la página está vacía y la tabla es larga, la página se alarga.
- Copiar dentro del Diseñador deja una marca en el portapapeles: Ctrl+V pega lo interno solo si fue lo último copiado (antes bloqueaba pegar de otras apps).
- Celdas con `alinV:'arriba'` ponen el texto arriba (como Word).

## v48: Estudio de video
- `81-estudio-de-video.js`: botón 🎬 Video (barra y riel izquierdo) abre un editor de video a pantalla completa.
- Grabar: pantalla, cámara, pantalla + cámara (burbuja movible, círculo o cuadro) y «Mi presentación + cámara»; micrófono y audio del sistema se mezclan; cuenta regresiva, pausa y detener. MediaRecorder graba MP4 (H.264) si el navegador puede, si no WebM.
- Editar: subir videos, fotos y música; páginas de tu diseño como clips; línea de tiempo con recortar, dividir (S), reordenar, velocidad, volumen, silenciar, fundido, acercamiento lento; textos encima con fondo; música con volumen; deshacer/rehacer.
- Exportar: se reproduce en tiempo real a un lienzo (`captureStream`) con el audio mezclado (Web Audio) y se descarga «Mi video.mp4». Formatos 16:9, 9:16, 1:1 y 4:3.
- Todo se guarda en el navegador (IndexedDB `disenador_video`), no en la nube.

## v49: transiciones y plantillas de video
- Transiciones entre clips (`c.trans = {tipo, dur}` en el clip que entra, centradas en el corte, sin cambiar la duración): disolver, pasar por negro, destello blanco, deslizar (← → ↑), empujar, barrido, círculo, zoom, desenfoque y girar. Pestaña 🔀 Transiciones con muestras animadas, rombo ◆ entre clips en la línea de tiempo, «usar en todos los cortes» y opción en Editar. El clip que no suena se dibuja con una foto de su primer/último cuadro (`EV.snaps`), así funciona aunque los dos pedazos sean del mismo video.
- Textos con animación de entrada (aparecer, subir, rebotar, deslizar, máquina de escribir), 14 letras, color de fondo, contorno estilo TikTok y mayúsculas; se arrastran sobre la vista previa y se achican solos si una palabra no cabe. Nuevos estilos en la pestaña Texto.
- `82-plantillas-de-video.js`: 12 plantillas (3 tips, antes y después, un día en mi vida, tutorial, anuncio de evento, frase del día, carrusel de fotos, promoción, cumpleaños, intro de YouTube, exposición de clase, noticiero escolar) por categoría: Reels y TikTok (9:16), Instagram (1:1 y 4:5), YouTube y escuela (16:9). Cada escena es un espacio: tocar la vista previa, soltar un archivo encima o elegir uno de «Mis archivos» la cambia por tu foto o video sin perder textos ni transiciones.
- Las páginas de tu diseño se agregan con la transición que elijas.

## v51: sonido de la computadora al grabar
- Antes de elegir la pantalla, una guía explica dónde activar «Compartir audio del sistema» (pantalla completa) o el audio de la pestaña; se puede ocultar.
- Si se pidió el sonido de la computadora y Chrome no lo compartió (por ejemplo, al elegir una ventana), avisa antes de grabar y ofrece volver a elegir o seguir sin ese sonido.
- El audio de la pantalla se pide sin cancelación de eco ni supresión de ruido (suena tal cual) y con `systemAudio`/`windowAudio`.
- Mientras se graba, la barra muestra dos medidores en vivo: 🎤 tu voz y 🔊 el sonido de la computadora.

## v52: el teléfono como cámara
- `camara.html` (página para el teléfono) + `83-camara-del-telefono.js`: en Grabar, «📱 Usar la cámara de mi teléfono» muestra un QR; el teléfono abre la página y se conecta directo con la compu (WebRTC). Firestore (`camaras/{código}`) solo guarda los datos de conexión y se borra al conectar; el video nunca pasa por un servidor.
- La compu ve una vista previa en vivo; el teléfono graba con MediaRecorder a su máxima calidad (720p, 1080p o 4K; MP4 en iPhone) y al detener manda el archivo completo por el canal de datos, con barra de avance. Si se corta la conexión, el teléfono puede guardar el video ahí mismo.
- Funciona con «Cámara», «Pantalla + cámara» y «Mi presentación + cámara» (burbuja con el video del teléfono, su micrófono opcional y el desfase de arranque compensado). Si la compu no tiene cámara, el estudio ofrece usar el teléfono.
- **Hay que publicar las reglas nuevas de `firestore.rules`** (sección `camaras`).

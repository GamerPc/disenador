# Diseñador · Apik-Desing

Editor de diseño **gratuito** para la escuela y el trabajo: carteles, mapas mentales y conceptuales, diagramas de flujo, infografías, presentaciones con animaciones, plantillas de Derecho y más. Exporta a PNG, JPG, PDF (con marcas de corte), PowerPoint y video MP4.

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

## 3. Importante sobre la versión web

- Los diseños se guardan **en el navegador** de cada persona. Si borra los datos del navegador o cambia de computadora, no los verá.
- Por eso en **📂 Abrir** están los botones **⬇ Descargar este diseño** (archivo `.apik.json`) y **📂 Abrir un archivo**: sirven como copia de seguridad y para pasar diseños a otra computadora.
- **Compartir** en la versión web descarga el diseño como archivo para mandarlo por WhatsApp o correo.
- Las exportaciones (PNG, PDF, PowerPoint, video) se descargan directo a la computadora.

---

## 4. Versión de Google Apps Script (con Google Drive)

1. En **script.google.com** crea un proyecto.
2. Pega `apps-script/Code.gs` en `Código.gs`.
3. Crea un archivo HTML por cada archivo de `apps-script/` (`Index`, `Estilo`, `Codigo1`, `Codigo2`… todos los que haya) con **exactamente** ese nombre y pega su contenido.
4. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Usuario que accede a la aplicación web**
   - Quién tiene acceso: **Cualquier persona con una cuenta de Google**

---

## 5. Cómo se actualiza el sistema (para quien programa)

Todo el programa vive en **`fuente/Index.completo.html`** (un solo archivo con HTML, estilos y código).
`fuente/almacen-local.js` es la pieza que permite a la versión web guardar en el navegador.

Después de cambiar algo:
```bash
python3 fuente/construir.py
```
Eso vuelve a generar **las dos versiones** (`index.html` + `js/` y la carpeta `apps-script/`). Luego sube los cambios (commit) y GitHub Pages se actualiza solo.

`construir.py` también revisa que no haya funciones con el mismo nombre (una taparía a la otra) y parte el código en archivos pequeños para Apps Script.

---

## Licencia

Aún no se ha elegido una licencia. Mientras no agreguen un archivo `LICENSE`, el código es de sus autores y nadie más puede reutilizarlo legalmente. Si quieren que otros puedan usarlo y mejorarlo, pueden agregar una (por ejemplo MIT o GPL) desde GitHub: **Add file → Create new file → `LICENSE` → Choose a license template**.

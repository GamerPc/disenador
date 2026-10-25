/* =========================================================
   CONFIGURACIÓN DE LA APP
   Aquí pones tus enlaces para recibir donaciones.
   - Deja la "url" vacía ('') en las que no uses: no se mostrarán.
   - La url debe empezar con https://
   ========================================================= */
window.APIK_CONFIG = {
  /* NUBE (opcional): pega aquí los datos de tu proyecto de Firebase (Configuración del proyecto → Tus apps → Web).
     Estos datos NO son secretos: la seguridad la ponen las reglas de firestore.rules.
     Déjalo en null para que todo se guarde solo en el navegador. */
  firebase: {
    apiKey: 'AIzaSyCSo7IBo6Vyw0X6YPkL239LFFjP6iwZJ_g',
    authDomain: 'apik-desing-disenador.firebaseapp.com',
    projectId: 'apik-desing-disenador',
    storageBucket: 'apik-desing-disenador.firebasestorage.app',
    messagingSenderId: '152552696779',
    appId: '1:152552696779:web:f8e166b9e9b4ea4e57244e'
  },
  // firebase: { apiKey: 'AIza...', authDomain: 'tu-proyecto.firebaseapp.com', projectId: 'tu-proyecto', appId: '1:...:web:...' },
  /* DATOS LEGALES: aparecen en el Aviso de privacidad y en los Términos de uso (privacidad.html y terminos.html).
     - responsable: quien decide sobre los datos (persona física o, si registras la empresa, su razón social)
     - correo: correo para dudas y solicitudes de privacidad (derechos ARCO). Crea uno solo para la app y escríbelo aquí.
     - domicilio: dónde se te puede notificar. Mientras no tengas oficina, la ciudad; después una oficina virtual o apartado postal. */
  legal: {
    responsable: 'Brenda Paola Cisneros Álvarez',
    marca: 'Diseñador · Apik-Desing',
    correo: 'apik.desing@gmail.com',
    domicilio: 'Ciudad de México, México',
    actualizado: '25 de octubre de 2026'
  },
  mensajeDonacion: 'Este diseñador es gratuito. Si te sirve para tus tareas, exposiciones o tu negocio, puedes apoyarnos con una donación para seguir agregando funciones y pagar el servidor.',
  donaciones: [
    { nombre: 'Mercado Pago', icono: '💳', detalle: 'Tarjeta, OXXO o saldo de Mercado Pago', url: 'https://link.mercadopago.com.mx/apikdesing' },
    { nombre: 'PayPal',       icono: '🅿', detalle: 'Tarjeta o cuenta PayPal, desde cualquier país', url: 'https://paypal.me/apikdesing' },
    { nombre: 'Ko-fi',        icono: '☕', detalle: 'Invítanos un café (PayPal o tarjeta)',   url: 'https://ko-fi.com/apikdesing' },
    { nombre: 'GitHub Sponsors', icono: '💜', detalle: 'Apoyo mensual',                     url: '' }    // ej. https://github.com/sponsors/tunombre
  ]
};

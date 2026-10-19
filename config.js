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
  firebase: null,
  // firebase: { apiKey: 'AIza...', authDomain: 'tu-proyecto.firebaseapp.com', projectId: 'tu-proyecto', appId: '1:...:web:...' },
  mensajeDonacion: 'Este diseñador es gratuito. Si te sirve para tus tareas, exposiciones o tu negocio, puedes apoyarnos con una donación para seguir agregando funciones y pagar el servidor.',
  donaciones: [
    { nombre: 'Mercado Pago', icono: '💳', detalle: 'Tarjeta, OXXO o saldo de Mercado Pago', url: 'https://link.mercadopago.com.mx/apikdesing' },
    { nombre: 'PayPal',       icono: '🅿', detalle: 'Tarjeta o cuenta PayPal, desde cualquier país', url: '' },   // pendiente: https://paypal.me/apikdesing (activar cuando PayPal quite la limitación)
    { nombre: 'Ko-fi',        icono: '☕', detalle: 'Invítanos un café',                     url: '' },   // ej. https://ko-fi.com/tunombre
    { nombre: 'GitHub Sponsors', icono: '💜', detalle: 'Apoyo mensual',                     url: '' }    // ej. https://github.com/sponsors/tunombre
  ]
};

/* =========================================================
   CONFIGURACIÓN DE LA APP
   Aquí pones tus enlaces para recibir donaciones.
   - Deja la "url" vacía ('') en las que no uses: no se mostrarán.
   - La url debe empezar con https://
   ========================================================= */
window.APIK_CONFIG = {
  mensajeDonacion: 'Este diseñador es gratuito. Si te sirve para tus tareas, exposiciones o tu negocio, puedes apoyarnos con una donación para seguir agregando funciones y pagar el servidor.',
  donaciones: [
    { nombre: 'Mercado Pago', icono: '💳', detalle: 'Tarjeta, OXXO o saldo de Mercado Pago', url: 'https://link.mercadopago.com.mx/apikdesing' },
    { nombre: 'PayPal',       icono: '🅿', detalle: 'Tarjeta o cuenta PayPal, desde cualquier país', url: '' },   // ej. https://paypal.me/tunombre
    { nombre: 'Ko-fi',        icono: '☕', detalle: 'Invítanos un café',                     url: '' },   // ej. https://ko-fi.com/tunombre
    { nombre: 'GitHub Sponsors', icono: '💜', detalle: 'Apoyo mensual',                     url: '' }    // ej. https://github.com/sponsors/tunombre
  ]
};

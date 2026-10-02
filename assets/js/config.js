/* =========================================================================
   EVEREST AIRES Y FRÍO — CONFIGURACIÓN CENTRAL
   -------------------------------------------------------------------------
   Cambia aquí los datos de la empresa y se actualizan en TODO el sitio:
   botones de WhatsApp y llamada, correo, horario, garantía, marcas y
   datos estructurados para Google.

   REGLA: cualquier valor en "PENDIENTE" (o vacío) NO se muestra.
   - Promesas (garantía, años, horario, urgencias 24/7, marcas, misión…)
     desaparecen del sitio hasta que tengan un valor real.
   - Si WhatsApp o teléfono están en "PENDIENTE", los botones siguen
     visibles pero llevan a la página de contacto.
   ========================================================================= */

window.EVEREST_CONFIG = {
  NOMBRE_EMPRESA: "Everest Aires y Frío",
  CIUDAD: "Bogotá",

  // WhatsApp en formato internacional, SOLO dígitos. Colombia = 57 + 10 dígitos.
  // Ej: "573101234567"
  WHATSAPP: "PENDIENTE",

  // Teléfono para los botones "Llamar", SOLO dígitos con indicativo. Ej: "573101234567"
  TELEFONO: "PENDIENTE",
  // Cómo se muestra el número en pantalla. Ej: "310 123 4567"
  TELEFONO_VISIBLE: "PENDIENTE",

  EMAIL: "PENDIENTE",

  // Ej: "Lunes a viernes 7:00 a.m. – 6:00 p.m. · Sábados 8:00 a.m. – 2:00 p.m."
  HORARIO: "PENDIENTE",

  // Ej: "10" → "más de 10 años de experiencia"
  ANOS_EXPERIENCIA: "PENDIENTE",

  // Ej: "6" → "garantía de 6 meses"
  MESES_GARANTIA: "PENDIENTE",

  // true solo si de verdad atienden urgencias. Con false no se muestra ninguna promesa de urgencias.
  ATENCION_URGENTE: false,

  // Marcas con las que trabajan. Si la lista está vacía, la sección de marcas no aparece.
  // Ej: ["LG", "Samsung", "Carrier"]
  MARCAS: [],

  // Textos de Nosotros. En "PENDIENTE" no se muestran.
  TEXTO_MISION: "PENDIENTE",
  TEXTO_VISION: "PENDIENTE",

  // Mensaje por defecto al abrir WhatsApp (cada botón puede tener el suyo).
  WHATSAPP_MENSAJE: "Hola, vengo de la página web de Everest y quiero información.",

  // Dominio definitivo (sin "/" al final). Se usa en los datos para Google.
  SITE_URL: "https://www.everestairesyfrio.com",

  // Envío del formulario (después de enviarlo se abre gracias.html):
  //  - Vacío ("")  → se abre WhatsApp con los datos ya escritos (requiere WHATSAPP).
  //  - Con URL     → se envía por POST, ej. Formspree "https://formspree.io/f/xxxxxx"
  //                  o el PHP incluido: "enviar.php"
  FORM_ENDPOINT: "",

  // Google Ads. ID de la etiqueta (ej. "AW-123456789"). Vacío = no se carga nada.
  GOOGLE_TAG_ID: "",
  // Etiqueta de cada conversión (la parte después de la "/" en "AW-123456789/AbCdEf").
  CONVERSIONES: {
    whatsapp: "",
    llamada: "",
    formulario: ""
  }
};

// Utilidades para preparar el formulario oculto de EmailJS antes de disparar el envío.

// Identificadores de EmailJS usados en el proyecto original. Modificar aquí si cambian en el futuro.
const EMAILJS_USER_ID = 'OWz7S5XdzeoJHUqeL';
const EMAILJS_SERVICE_ID = 'default_service';
const EMAILJS_TEMPLATE_ID = 'template_wjv86i4';

/**
 * Rellena los campos del formulario de EmailJS con la información preparada.
 * @param {HTMLFormElement | null} form - Formulario oculto que será enviado mediante emailjs.sendForm.
 * @param {{ subject?: string; name?: string; email?: string; phone?: string; description?: string }} payload - Datos que se inyectan en los campos del formulario.
 */
export function fillEmailJsForm(form, payload) {
  if (!form) return;
  const assign = (selector, value) => {
    const field = form.querySelector(selector);
    if (field && 'value' in field) {
      field.value = value ?? '';
    }
  };

  assign('#emailjs_asunto4', payload.subject ?? '');
  assign('#emailjs_nombre4', payload.name ?? '');
  assign('#emailjs_correo4', payload.email ?? '');
  assign('#emailjs_phone4', payload.phone ?? '');
  assign('#emailjs_Descripcion4', payload.description ?? '');
}

export { EMAILJS_USER_ID, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID };

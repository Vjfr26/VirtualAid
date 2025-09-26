export const EMAIL_TEMPLATES = {
  recordatorio: {
    asunto: (fecha: string) => `🔔 Recordatorio activado - Cita médica el ${fecha}`,
    contenido: {
      titulo: '🔔 Recordatorio de Cita Médica Activado',
      subtitulo: 'VirtualAid - Tu asistente médico virtual',
      mensaje: 'Has activado exitosamente el recordatorio por correo electrónico para tu cita médica:',
      recomendaciones: [
        'Llega 15 minutos antes de tu cita',
        'Trae tu documento de identidad',
        'Prepara una lista de tus síntomas o dudas',
        'Si necesitas cancelar, hazlo con al menos 24 horas de anticipación'
      ],
      footer: 'Recibirás otro recordatorio 24 horas antes de tu cita'
    }
  },
  desactivacion: {
    asunto: (fecha: string) => `🔕 Recordatorio desactivado - Cita médica el ${fecha}`,
    contenido: {
      titulo: '🔕 Recordatorio Desactivado',
      subtitulo: 'VirtualAid - Confirmación',
      mensaje: 'Has desactivado el recordatorio por correo electrónico para tu cita médica:',
      recomendaciones: [
        'Puedes reactivar el recordatorio en cualquier momento desde tu panel de usuario',
        'Te recomendamos anotar la cita en tu calendario personal',
        'Recuerda la fecha y hora de tu cita'
      ],
      footer: 'Ya no recibirás recordatorios automáticos para esta cita'
    }
  },
  recordatorio24h: {
    asunto: (fecha: string) => `⏰ Recordatorio: Tu cita médica es mañana - ${fecha}`,
    contenido: {
      titulo: '⏰ ¡Tu Cita Médica es Mañana!',
      subtitulo: 'VirtualAid - Recordatorio 24 horas',
      mensaje: 'Te recordamos que tienes una cita médica programada para mañana:',
      recomendaciones: [
        'Confirma que tienes disponible el tiempo necesario',
        'Prepara tu documento de identidad',
        'Si tomas medicamentos, trae la lista actualizada',
        'Llega 15 minutos antes de la hora programada'
      ],
      footer: 'Si necesitas reprogramar, contacta con nosotros lo antes posible'
    }
  }
};

export const EMAIL_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 0;
    background-color: #f8f9fa;
  }
  
  .container {
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin: 20px;
  }
  
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px 20px;
    text-align: center;
  }
  
  .header h1 {
    margin: 0 0 10px 0;
    font-size: 24px;
    font-weight: 600;
  }
  
  .header p {
    margin: 0;
    font-size: 16px;
    opacity: 0.9;
  }
  
  .content {
    padding: 30px 20px;
  }
  
  .message {
    font-size: 16px;
    margin-bottom: 25px;
    color: #495057;
  }
  
  .appointment-details {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
    border-left: 4px solid #667eea;
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  }
  
  .detail-row:last-child {
    border-bottom: none;
  }
  
  .label {
    font-weight: 600;
    color: #495057;
    font-size: 14px;
  }
  
  .value {
    color: #212529;
    font-weight: 500;
    text-align: right;
  }
  
  .recommendations {
    margin: 25px 0;
  }
  
  .recommendations h3 {
    color: #495057;
    font-size: 18px;
    margin-bottom: 15px;
  }
  
  .recommendations ul {
    list-style: none;
    padding: 0;
  }
  
  .recommendations li {
    background: #e7f3ff;
    padding: 10px 15px;
    margin: 8px 0;
    border-radius: 6px;
    border-left: 3px solid #007bff;
    font-size: 14px;
  }
  
  .recommendations li::before {
    content: "✓ ";
    color: #28a745;
    font-weight: bold;
    margin-right: 8px;
  }
  
  .footer {
    background: #343a40;
    color: white;
    padding: 20px;
    text-align: center;
    font-size: 14px;
  }
  
  .footer-note {
    margin: 10px 0 0 0;
    opacity: 0.8;
    font-size: 12px;
  }
  
  .button {
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    margin: 15px 0;
  }
  
  .button:hover {
    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  }
  
  @media only screen and (max-width: 600px) {
    .container {
      margin: 10px;
    }
    
    .header, .content, .footer {
      padding: 20px 15px;
    }
    
    .detail-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 5px;
    }
    
    .value {
      text-align: left;
      font-size: 16px;
    }
  }
`;

export function generarHTMLCorreo(
  tipo: keyof typeof EMAIL_TEMPLATES,
  datos: {
    fechaCita: Date;
    horaCita: string;
    medico: string;
    especialidad?: string;
  }
): { asunto: string; html: string } {
  
  const template = EMAIL_TEMPLATES[tipo];
  const fechaFormateada = datos.fechaCita.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const asunto = template.asunto(fechaFormateada);
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${asunto}</title>
      <style>${EMAIL_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${template.contenido.titulo}</h1>
          <p>${template.contenido.subtitulo}</p>
        </div>
        
        <div class="content">
          <p class="message">${template.contenido.mensaje}</p>
          
          <div class="appointment-details">
            <div class="detail-row">
              <span class="label">📅 Fecha:</span>
              <span class="value">${fechaFormateada}</span>
            </div>
            <div class="detail-row">
              <span class="label">🕒 Hora:</span>
              <span class="value">${datos.horaCita}</span>
            </div>
            <div class="detail-row">
              <span class="label">👨‍⚕️ Médico:</span>
              <span class="value">Dr. ${datos.medico}</span>
            </div>
            ${datos.especialidad ? `
            <div class="detail-row">
              <span class="label">🏥 Especialidad:</span>
              <span class="value">${datos.especialidad}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="recommendations">
            <h3>📋 Recomendaciones importantes:</h3>
            <ul>
              ${template.contenido.recomendaciones.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>${template.contenido.footer}</strong></p>
          <p class="footer-note">
            Este es un recordatorio automático de VirtualAid.<br>
            Si tienes alguna pregunta, no dudes en contactarnos.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { asunto, html };
}
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { 
      destinatario, 
      asunto, 
      contenidoHTML,
      fechaCita, 
      horaCita, 
      medico, 
      especialidad,
      tipoRecordatorio 
    } = await request.json();

    // Validar datos requeridos
    if (!destinatario || !fechaCita || !horaCita || !medico) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos para el recordatorio' },
        { status: 400 }
      );
    }

    // Formatear la fecha de la cita
    const fechaFormateada = new Date(fechaCita).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Solo enviamos correos cuando el recordatorio se activa explícitamente
    if (tipoRecordatorio && tipoRecordatorio !== 'activacion') {
      return NextResponse.json({
        success: true,
        message: 'Recordatorio actualizado sin envío de correo (desactivación u otra acción)'
      });
    }

    const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
    const fromAddress = process.env.EMAIL_FROM || gmailUser;

    if (!gmailUser || !gmailPass || !fromAddress) {
      console.error('Credenciales SMTP no configuradas correctamente.');
      return NextResponse.json(
        { error: 'Configuración de correo no disponible. Define GMAIL_USER y GMAIL_APP_PASSWORD en las variables de entorno.' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });

    const htmlFallback = contenidoHTML || `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Recordatorio de cita médica</h2>
          <p>Hola, este es un recordatorio de tu cita programada.</p>
          <ul>
            <li><strong>Fecha:</strong> ${fechaFormateada}</li>
            <li><strong>Hora:</strong> ${horaCita}</li>
            <li><strong>Médico:</strong> Dr. ${medico}</li>
            ${especialidad ? `<li><strong>Especialidad:</strong> ${especialidad}</li>` : ''}
          </ul>
          <p>¡Te esperamos!</p>
        </body>
      </html>
    `;

    const mailOptions = {
      from: fromAddress,
      to: destinatario,
      subject: asunto || `Recordatorio: Cita médica - ${fechaFormateada}`,
      html: htmlFallback
    };

    const resultadoEnvio = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Recordatorio enviado por correo electrónico exitosamente',
      emailId: resultadoEnvio.messageId
    });

  } catch (error) {
    console.error('Error al enviar recordatorio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al enviar recordatorio' },
      { status: 500 }
    );
  }
}

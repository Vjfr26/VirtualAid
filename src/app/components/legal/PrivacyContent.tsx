import styles from './legalContent.module.css';

export default function PrivacyContent() {
  return (
    <div className={styles.modalBody}>
      <h1 className={styles.sectionTitle}>Política de Privacidad</h1>
      <p className={styles.highlight}>
        En VirtualAid protegemos tu información personal con el máximo cuidado. A continuación
        encontrarás un resumen claro de cómo recopilamos, utilizamos y resguardamos tus datos.
      </p>
      <div className={styles.contentCard}>
        <h2>1. Introducción</h2>
        <p>
          Valoramos tu privacidad y nos comprometemos a garantizar la seguridad de tus datos
          personales. Esta política describe las medidas que aplicamos para proteger tu información
          y la forma en que la utilizamos dentro de la plataforma.
        </p>

        <h2>2. Información que Recopilamos</h2>
        <ul className={styles.contentList}>
          <li>Datos de registro como nombre, correo electrónico y contraseña cifrada.</li>
          <li>Información de uso relacionada con tus citas, especialidades consultadas y mensajes.</li>
          <li>Datos técnicos como dirección IP, tipo de dispositivo y navegador empleado.</li>
        </ul>

        <h2>3. Uso de la Información</h2>
        <ul className={styles.contentList}>
          <li>Gestionar tu cuenta, tus citas médicas y recordatorios asociados.</li>
          <li>Mejorar nuestros servicios y personalizar la experiencia de la plataforma.</li>
          <li>Enviar comunicaciones relevantes sobre tu actividad o cambios en VirtualAid.</li>
        </ul>

        <h2>4. Compartir Información</h2>
        <p>
          No compartimos tus datos personales con terceros excepto cuando sea imprescindible para
          prestar el servicio (por ejemplo, con profesionales sanitarios vinculados a tu cita) o
          cuando exista una obligación legal.
        </p>

        <h2>5. Seguridad</h2>
        <p>
          Implementamos medidas técnicas y organizativas —incluyendo cifrado, controles de acceso y
          auditorías periódicas— para prevenir accesos no autorizados, pérdidas o usos indebidos de
          la información.
        </p>

        <h2>6. Tus Derechos</h2>
        <p>
          Puedes solicitar acceso, rectificación o eliminación de tus datos personales en cualquier
          momento. Escríbenos a nuestro canal de soporte y atenderemos tu solicitud con prioridad.
        </p>

        <h2>7. Cambios en la Política</h2>
        <p>
          Podremos actualizar esta política cuando incorporemos nuevos servicios o por exigencias
          regulatorias. Si realizamos cambios relevantes, te lo notificaremos antes de que entren en
          vigor.
        </p>
      </div>
    </div>
  );
}

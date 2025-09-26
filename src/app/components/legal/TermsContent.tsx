import styles from './legalContent.module.css';

export default function TermsContent() {
  return (
    <div className={styles.modalBody}>
      <h1 className={styles.sectionTitle}>Términos de Uso</h1>
      <p className={styles.highlight}>
        Al utilizar VirtualAid aceptas estas condiciones que buscan garantizar un servicio seguro
        y confiable tanto para pacientes como para profesionales de la salud.
      </p>
      <div className={styles.contentCard}>
        <h2>1. Aceptación de los Términos</h2>
        <p>
          El acceso o uso de la plataforma implica la aceptación íntegra de estos términos. Si no
          estás de acuerdo con alguna de las condiciones descritas, deberás abstenerte de usar
          VirtualAid.
        </p>

        <h2>2. Uso de la Plataforma</h2>
        <ul className={styles.contentList}>
          <li>Debes proporcionar información veraz, completa y actualizada en tu cuenta.</li>
          <li>Está prohibido el uso fraudulento, abusivo o que afecte a otros usuarios.</li>
          <li>Podemos suspender o limitar el acceso ante detección de actividades irregulares.</li>
        </ul>

        <h2>3. Propiedad Intelectual</h2>
        <p>
          El contenido, las marcas y los desarrollos tecnológicos de VirtualAid pertenecen a la
          plataforma o a sus licenciantes. Queda prohibida su reproducción sin autorización previa por
          escrito.
        </p>

        <h2>4. Responsabilidad</h2>
        <p>
          VirtualAid actúa como intermediario tecnológico y no se responsabiliza de decisiones
          clínicas ni de información proporcionada directamente por los profesionales sanitarios.
        </p>

        <h2>5. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de actualizar estos términos para reflejar mejoras del servicio o
          cambios regulatorios. Notificaremos las modificaciones sustanciales con antelación razonable.
        </p>

        <h2>6. Ley Aplicable</h2>
        <p>
          Estos términos se rigen por la legislación vigente en tu país de residencia y cualquier
          conflicto será sometido a los tribunales competentes según corresponda.
        </p>
      </div>
    </div>
  );
}

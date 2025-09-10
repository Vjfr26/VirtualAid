import Link from 'next/link';
import HeaderLogo from '../../components/HeaderLogo';
import './styles.css';

export default function TermsOfUse() {
  return (
    <div className="pageContainer">
      <header className="header">
        <nav className="nav">
          <div className="logo"><HeaderLogo variant="horizontal" /></div>
          <div className="navLinks">
            <Link href="/" className="navLink">Inicio</Link>
            <Link href="/login" className="navLink">Iniciar Sesión</Link>
            <Link href="/registro" className="navLink">Registro</Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="contentSection">
          <div className="sectionContainer">
            <h1 className="sectionTitle">Términos de Uso</h1>
            <div className="policyContent">
              <h2>1. Aceptación de los Términos</h2>
              <p>Al utilizar VirtualAid, aceptas estos términos y condiciones. Si no estás de acuerdo, por favor no utilices la plataforma.</p>
              <h2>2. Uso de la Plataforma</h2>
              <ul>
                <li>Debes proporcionar información veraz y actualizada.</li>
                <li>No está permitido el uso indebido o fraudulento del servicio.</li>
                <li>El acceso puede ser suspendido si se detecta un uso inapropiado.</li>
              </ul>
              <h2>3. Propiedad Intelectual</h2>
              <p>Todo el contenido, marcas y logotipos son propiedad de VirtualAid o de sus licenciantes.</p>
              <h2>4. Responsabilidad</h2>
              <p>VirtualAid no se hace responsable por daños derivados del uso de la plataforma o de la información proporcionada por terceros.</p>
              <h2>5. Modificaciones</h2>
              <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados oportunamente.</p>
              <h2>6. Ley Aplicable</h2>
              <p>Estos términos se rigen por la legislación vigente en tu país de residencia.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

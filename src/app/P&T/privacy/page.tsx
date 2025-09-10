import Link from 'next/link';
import HeaderLogo from '../../components/HeaderLogo';
import './styles.css';

export default function PrivacyPolicy() {
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
            <h1 className="sectionTitle">Política de Privacidad</h1>
            <div className="policyContent">
              <h2>1. Introducción</h2>
              <p>En VirtualAid, valoramos tu privacidad y nos comprometemos a proteger tus datos personales. Esta política explica cómo recopilamos, usamos y protegemos tu información.</p>
              <h2>2. Información que Recopilamos</h2>
              <ul>
                <li>Datos de registro: nombre, correo electrónico, contraseña.</li>
                <li>Información de uso: citas, especialidades consultadas, mensajes enviados.</li>
                <li>Datos técnicos: dirección IP, tipo de dispositivo, navegador.</li>
              </ul>
              <h2>3. Uso de la Información</h2>
              <ul>
                <li>Gestionar tu cuenta y citas médicas.</li>
                <li>Mejorar nuestros servicios y personalizar tu experiencia.</li>
                <li>Comunicaciones importantes sobre tu cuenta o cambios en la plataforma.</li>
              </ul>
              <h2>4. Compartir Información</h2>
              <p>No compartimos tu información personal con terceros, salvo cuando sea necesario para la prestación del servicio o por requerimiento legal.</p>
              <h2>5. Seguridad</h2>
              <p>Implementamos medidas de seguridad para proteger tus datos contra accesos no autorizados.</p>
              <h2>6. Tus Derechos</h2>
              <p>Puedes acceder, corregir o eliminar tus datos personales contactándonos en cualquier momento.</p>
              <h2>7. Cambios en la Política</h2>
              <p>Nos reservamos el derecho de modificar esta política. Te notificaremos sobre cambios importantes.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

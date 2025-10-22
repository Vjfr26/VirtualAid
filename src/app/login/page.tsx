

"use client";
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import './login.css';
import TopActions from '../components/TopActions';
import HeaderLogo from '../components/HeaderLogo';
import Footer from '../components/Footer';

export default function LoginPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Attempting login');
    
    try {
      const email = emailRef.current?.value || '';
      const password = passwordRef.current?.value || '';
      
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        // Guardar sesión básica para consumir API del dashboard
        try {
          const session = { tipo: data.tipo as 'admin' | 'medico' | 'usuario', email: data.email as string, nombre: data.nombre as string };
          localStorage.setItem('session', JSON.stringify(session));
        } catch (err) {
          console.error("Error al guardar la sesión:", err);
        }
        // Redirigir según el tipo de usuario
        if (data.tipo === 'admin') {
          router.push('/admin');
        } else if (data.tipo === 'medico') {
          router.push('/medico');
        } else if (data.tipo === 'usuario') {
          router.push('/usuario');
        } else {
          alert('Login exitoso, pero tipo de usuario desconocido');
          setIsLoading(false); // Asegurarse de restablecer el estado en caso de tipo desconocido
        }
      } else {
        // En caso de respuesta de error del servidor
        alert(data.message || 'Credenciales incorrectas');
        setIsLoading(false); // Restablecer el estado porque no redirigiremos
      }
    } catch (error) {
      // Capturar cualquier error inesperado (red, servidor caído, etc.)
      console.error('Error durante el inicio de sesión:', error);
      alert('Ocurrió un error al intentar iniciar sesión. Por favor intenta nuevamente.');
      setIsLoading(false); // Garantizar que el botón vuelva a su estado normal
    }
  };

  return (
    <div className="loginPageLayout">
      <div className="loginContainer">
      <Link href="/" className="homeLink" aria-label={t('back_home', 'Back to Home')}>{t('back_home', 'Back to Home')}</Link>
        <div className="loginTopActions">
          <TopActions />
        </div>

        <div className="loginContent">
          <div className="loginCard">
          <div className="logo">
            <HeaderLogo variant="horizontal" />
          </div>
          <div className="subtitle">{t('signin', 'Sign In')}</div>
          <form className="form" onSubmit={handleLogin}>
            <div className="inputGroup">
              <input ref={emailRef} type="email" id="email" name="email" required className="input" placeholder={t('your_email', 'Email')} />
            </div>
            <div className="inputGroup">
              <input ref={passwordRef} type="password" id="password" name="password" required className="input" placeholder={t('your_password', 'Password')} />
            </div>
            <div className="forgotPassword">
              <Link href="/recuperar" className="forgotPasswordLink">{t('forgot_password', 'Forgot password?')}</Link>
            </div>
            <button 
              type="submit" 
              className={`loginButton ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? t('signing_in', 'Signing in...') : t('signin', 'Sign In')}
            </button>
            <div className="divider">o</div>
            <div className="registerLink">
              {t('no_account', 'No account?')}
              <Link href="/registro">{t('signup', 'Sign Up')}</Link>
            </div>
          </form>
          </div>
        </div>
      </div>
      <Footer
        className="loginPage-footer"
        color="oklch(12.9% 0.042 264.695)"
        background="rgba(255,255,255,0.92)"
        borderColor="rgba(37,99,235,0.12)"
        padding="18px 32px"
      />
    </div>
  );
}

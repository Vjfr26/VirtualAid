'use client';


import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Footer from '@/app/components/Footer';

import { useTranslation } from 'react-i18next';
import './styles.css';
import Chatbot from './components/Chatbot';
import TopActions from './components/TopActions';
import HeaderLogo from './components/HeaderLogo';


export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation('common');
  // Estado para el pathname
  const [pathname, setPathname] = useState('');
  // Obtener pathname solo en cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

useEffect(() => {
  setIsMenuOpen(false);
}, [t]);

  // Suscribirse al cambio de idioma para forzar re-render (ya no necesario; Next/SSR reenrendea)

  // ---- Contact form state & submit ----
  const [sending, setSending] = useState(false);
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  // Carga bajo demanda del reproductor de YouTube para evitar llamadas bloqueadas en la carga inicial
  const [showVideo, setShowVideo] = useState(false);

  const handleContactSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (sending) return;
    setContactMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      message: String(formData.get('message') || ''),
    };
    // Simple validation
    if (!payload.name || !payload.email || !payload.message) {
      setContactMessage('Por favor completa los campos requeridos.');
      return;
    }
    try {
      setSending(true);
      const res = await fetch('/api/contacto/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al enviar el mensaje');
      }
      setContactMessage('Correo enviado. Revisa tu bandeja.');
      form.reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo enviar.';
      setContactMessage(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pageContainer">
      <style>{`
        .navLinkDark {
          color: #222 !important;
          font-weight: 600;
          transition: color 0.2s;
        }
        .navLinkDark:hover {
          color: #2563eb !important;
        }
        .navLinkDark.selected, .navLinkDark:active {
          color: #2563eb !important;
        }
        /* Aquí solo se mantiene el ajuste del botón de idiomas si corresponde */
  .videoPlaceholder { position: relative; width: 100%; height: 315px; background: #000; border-radius: 12px; overflow: hidden; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .videoPlaceholder img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7); }
  .videoPlaceholder .playBtn { position: absolute; display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.9); color: #111; padding: 10px 14px; border-radius: 9999px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
      `}</style>
      {/* Header */}
      <header className="header">
        <nav className="nav">
          <div className="logo">
            <HeaderLogo variant="icon" />
            <span className="logoText opacity: 1 visibility: visible; display: inline-block; background: linear-gradient(135deg, rgb(37, 99, 235), rgb(16, 185, 129)) text; -webkit-text-fill-color: transparent; color: rgb(37, 99, 235); min-width: 100px; min-height: 1.5rem; font-weight: inherit; text-decoration: none; position: relative;">VirtualAid</span>
          </div>
          <div className={`navLinks ${isMenuOpen ? 'navLinksOpen' : ''}`}>
            <Link href="/" className={`navLink navLinkDark${pathname === '/' ? ' selected' : ''}`} onClick={closeMenu}>
              {t('home', 'Home')}
            </Link>
            <Link href="#especialidades" className="navLink navLinkDark" onClick={closeMenu}>
              {t('specialties', 'Specialties')}
            </Link>
            <Link href="#acerca" className="navLink navLinkDark" onClick={closeMenu}>
              {t('about', 'About Us')}
            </Link>
            <Link href="#contact" className="navLink navLinkDark" onClick={closeMenu}>
              {t('contact', 'Contact')}
            </Link>
            <Link href="/login" className={`navLink loginBtn navLinkDark${pathname === '/login' ? ' selected' : ''}`} onClick={closeMenu}>
              {t('signin', 'Sign In')}
            </Link>
            <Link href="/registro" className={`navLink registerBtn navLinkDark${pathname === '/registro' ? ' selected' : ''}`} onClick={closeMenu}>
              {t('signup', 'Sign Up')}
            </Link>
            <TopActions />
          </div>
          <div className="mobileMenuToggle">
            <button className="mobileMenuButton" onClick={toggleMenu}>
              <svg className={`menuIcon ${isMenuOpen ? 'menuIconOpen' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
              </svg>
            </button>
          </div>
        </nav>
        {isMenuOpen && <div className="mobileMenuOverlay" onClick={closeMenu}></div>}
      </header>

      {/* Hero Section */}
      <main>
        <section className="heroSection" style={{backgroundImage: "url('/imagenes/fondo_principal.png')"}}>
          <div className="heroOverlay">
            <div className="heroContent">
              <div className="heroText">
                <span className="heroBadge">✨ {t('badge', '#1 Medical Platform')}</span>
                <h1 className="heroTitle">
                  {t('title', 'Schedule your medical appointment')} 
                  <span className="heroTitleAccent"> {t('today', 'today')}</span>
                </h1>
                <p className="heroSubtitle">
                  {t('description', 'Connect with certified healthcare professionals and receive the medical care you need from the comfort of your home.')}
                </p>
                {/* Floating Cards - Mobile Version */}
                <div className="floatingCardsMobile">
                  <div className="floatingCard">
                    <div className="cardIcon">👩‍⚕️</div>
                    <div className="cardText">
                      <div className="cardTitle">{t('card_doctor_name', 'Dr. Sarah Menacho')}</div>
                      <div className="cardSubtitle">{t('card_doctor_specialty', 'Surgeon')}</div>
                    </div>
                  </div>
                  <div className="floatingCard">
                    <div className="cardIcon">📊</div>
                    <div className="cardText">
                      <div className="cardTitle">{t('card_diagnosis', 'Diagnosis')}</div>
                      <div className="cardSubtitle">{t('card_diagnosis_result', 'Results in 24h')}</div>
                    </div>
                  </div>
                  <div className="floatingCard">
                    <div className="cardIcon">💊</div>
                    <div className="cardText">
                      <div className="cardTitle">{t('card_treatment', 'Treatment')}</div>
                      <div className="cardSubtitle">{t('card_treatment_personalized', 'Personalized')}</div>
                    </div>
                  </div>
                </div>

                <div className="heroButtons">
                  <Link href="#especialidades" className="button buttonPrimary">
                    <span className="buttonIcon">🔍</span>
                    {t('view_specialties', 'View Specialties')}
                  </Link>
                  <Link href="/registro" className="button buttonSecondary">
                    <span className="buttonIcon">📅</span>
                    {t('book_appointment', 'Book Appointment')}
                  </Link>
                </div>
                <div className="heroStats">
                  <div className="statItem">
                    <span className="statNumber">500+</span>
                    <span className="statLabel">{t('doctors', 'Doctors')}</span>
                  </div>
                  <div className="statItem">
                    <span className="statNumber">10k+</span>
                    <span className="statLabel">{t('patients', 'Patients')}</span>
                  </div>
                  <div className="statItem">
                    <span className="statNumber">50+</span>
                    <span className="statLabel">{t('specialties', 'Specialties')}</span>
                  </div>
                </div>
              </div>
              <div className="heroImage">
                <div className="heroImageContainer">
                  <div className="floatingCard card1">
                    <div className="cardIcon">👩‍⚕️</div>
                    <div className="cardText">
                      <div className="cardTitle">{t('card_doctor_name', 'Dr. Sarah Menacho')}</div>
                      <div className="cardSubtitle">{t('card_doctor_specialty', 'Surgeon')}</div>
                    </div>
                  </div>
                  <div className="floatingCard card2">
                    <div className="cardIcon">📊</div>
                    <div className="cardText">
                      <div className="cardTitle">{t('card_diagnosis', 'Diagnosis')}</div>
                      <div className="cardSubtitle">{t('card_diagnosis_result', 'Results in 24h')}</div>
                    </div>
                  </div>
                  <div className="floatingCard card3">
                    <div className="cardIcon">💊</div>
                    <div className="cardText">
                      <div className="cardTitle">{t('card_treatment', 'Treatment')}</div>
                      <div className="cardSubtitle">{t('card_treatment_personalized', 'Personalized')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="contentSection">
          <div className="sectionContainer">
            <div className="featuresHeader">
              <h2 className="sectionTitle">{t('how_it_works', 'How does it work?')}</h2>
              <p className="sectionSubtitle">{t('steps_subtitle', 'Schedule your medical appointment in 3 simple steps')}</p>
            </div>
            <div className="gridContainer">
              <div className="featureCard">
                <div className="featureIconWrapper">
                  <div className="featureIcon">🔍</div>
                  <div className="featureNumber">1</div>
                </div>
                <h3 className="featureTitle">{t('choose_specialty', 'Choose Specialty')}</h3>
                <p className="featureText">{t('choose_specialty_text', 'Find the perfect specialist for your specific medical needs.')}</p>
                <div className="featureArrow">→</div>
              </div>
              <div className="featureCard">
                <div className="featureIconWrapper">
                  <div className="featureIcon">📅</div>
                  <div className="featureNumber">2</div>
                </div>
                <h3 className="featureTitle">{t('select_date', 'Select Date and Time')}</h3>
                <p className="featureText">{t('select_date_text', 'Choose the schedule that best fits your personal agenda.')}</p>
                <div className="featureArrow">→</div>
              </div>
              <div className="featureCard">
                <div className="featureIconWrapper">
                  <div className="featureIcon">✅</div>
                  <div className="featureNumber">3</div>
                </div>
                <h3 className="featureTitle">{t('confirm_booking', 'Confirm Booking')}</h3>
                <p className="featureText">{t('confirm_booking_text', 'Your appointment will be scheduled instantly, without complications or delays.')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="aboutSection" id="acerca">
          <div className="sectionContainer">
            <div className="aboutContent">
              <div className="aboutText">
                <h2 className="sectionTitle">{t('about_us', 'About Us')}</h2>
                <p className="sectionText">{t('about_us_text', 'We are an innovative platform dedicated to facilitating access to quality healthcare services. We connect patients with the best medical professionals quickly and securely.')}
                </p>
                <div className="aboutFeatures">
                  <div className="aboutFeature">
                    <span className="aboutFeatureIcon">🛡️</span>
                    <span className="aboutFeatureText">{t('about_safe', '100% Safe and Reliable')}</span>
                  </div>
                  <div className="aboutFeature">
                    <span className="aboutFeatureIcon">⚡</span>
                    <span className="aboutFeatureText">{t('about_response', 'Immediate Response')}</span>
                  </div>
                  <div className="aboutFeature">
                    <span className="aboutFeatureIcon">🎯</span>
                    <span className="aboutFeatureText">{t('about_personalized', 'Personalized Care')}</span>
                  </div>
                </div>
              </div>
              <div className="aboutVideo">
                <h3 className="videoTitle">{t('about_video', 'See how our platform works')}</h3>
                <div className="videoContainer">
                  {!showVideo ? (
                    <div className="videoPlaceholder" onClick={() => setShowVideo(true)} title={t('play_video', 'Play video')}>
                      <Image src="https://i.ytimg.com/vi/TB2VgsHxWrI/hqdefault.jpg" alt="Video preview" fill priority sizes="(max-width: 768px) 100vw, 50vw" />
                      <span className="playBtn">▶ {t('play_video', 'Play video')}</span>
                    </div>
                  ) : (
                    <iframe
                      width="100%"
                      height="315"
                      src="https://www.youtube-nocookie.com/embed/TB2VgsHxWrI?rel=0&modestbranding=1"
                      title="Cómo usar VirtualAid - Tutorial completo"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      frameBorder="0"
                      sandbox="allow-same-origin allow-scripts allow-presentation"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="responsiveVideo"
                    ></iframe>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="whyChooseUsSection">
          <div className="sectionContainer">
            <h2 className="sectionTitle">{t('why_choose', 'Why Choose Our Platform?')}</h2>
            <p className="sectionSubtitle">{t('why_choose_sub', 'Discover the advantages that make us unique')}</p>
            <div className="gridContainer">
              <div className="whyChooseUsItem">
                <div className="whyChooseUsIcon">💻</div>
                <h4 className="whyChooseUsItemTitle">{t('why_online', 'Convenient Online Booking')}</h4>
                <p className="whyChooseUsItemText">{t('why_online_text', 'Schedule appointments anytime and anywhere, with just a few clicks.')}</p>
              </div>
              <div className="whyChooseUsItem">
                <div className="whyChooseUsIcon">👨‍⚕️</div>
                <h4 className="whyChooseUsItemTitle">{t('why_professionals', 'Qualified Professionals')}</h4>
                <p className="whyChooseUsItemText">{t('why_professionals_text', 'Access a network of experienced and certified healthcare professionals.')}</p>
              </div>
              <div className="whyChooseUsItem">
                <div className="whyChooseUsIcon">📊</div>
                <h4 className="whyChooseUsItemTitle">{t('why_management', 'Efficient Appointment Management')}</h4>
                <p className="whyChooseUsItemText">{t('why_management_text', 'View, reschedule or cancel your appointments easily from your user panel.')}</p>
              </div>
              <div className="whyChooseUsItem">
                <div className="whyChooseUsIcon">💬</div>
                <h4 className="whyChooseUsItemTitle">{t('why_support', '24/7 Support')}</h4>
                <p className="whyChooseUsItemText">{t('why_support_text', 'Our team is available 24 hours a day to resolve any questions.')}</p>
              </div>
              <div className="whyChooseUsItem">
                <div className="whyChooseUsIcon">🔒</div>
                <h4 className="whyChooseUsItemTitle">{t('why_protected', 'Protected Data')}</h4>
                <p className="whyChooseUsItemText">{t('why_protected_text', 'Your medical information is completely secure with hospital-grade encryption.')}</p>
              </div>
              <div className="whyChooseUsItem">
                <div className="whyChooseUsIcon">💰</div>
                <h4 className="whyChooseUsItemTitle">{t('why_pricing', 'Transparent Pricing')}</h4>
                <p className="whyChooseUsItemText">{t('why_pricing_text', 'No surprises. Know the exact cost before confirming your medical appointment.')}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Especialties Section */}
      <section className="especialtiesSection" id="especialidades">
        <div className="sectionContainer">
          <h2 className="sectionTitle">{t('our_specialties', 'Our Specialties')}</h2>
          <p className="sectionText">{t('our_specialties_text', 'We have a team of experts in various areas of healthcare.')}</p>
        </div>
        <div className="especialtiesGrid">
          <div className="especialtyCard">
            <div className="especialtyIconWrapper">
              <div className="especialtyLogo">❤️</div>
            </div>
            <h3 className="especialtyTitle">{t('cardiology', 'Cardiology')}</h3>
            <p className="especialtyDescription">{t('cardiology_text', 'Specialized care for heart and cardiovascular system problems.')}</p>
            <div className="especialtyInfo">
              <span className="especialtyDoctors">15+ Doctors</span>
              <span className="especialtyPrice">From $80</span>
            </div>
          </div>
          <div className="especialtyCard">
            <div className="especialtyIconWrapper">
              <div className="especialtyLogo">🧴</div>
            </div>
            <h3 className="especialtyTitle">{t('dermatology', 'Dermatology')}</h3>
            <p className="especialtyDescription">{t('dermatology_text', 'Skin care and treatment of dermatological diseases.')}</p>
            <div className="especialtyInfo">
              <span className="especialtyDoctors">12+ Doctors</span>
              <span className="especialtyPrice">From $60</span>
            </div>
          </div>
          <div className="especialtyCard">
            <div className="especialtyIconWrapper">
              <div className="especialtyLogo">👶</div>
            </div>
            <h3 className="especialtyTitle">{t('pediatrics', 'Pediatrics')}</h3>
            <p className="especialtyDescription">{t('pediatrics_text', 'Specialized medical care for children and adolescents.')}</p>
            <div className="especialtyInfo">
              <span className="especialtyDoctors">20+ Doctors</span>
              <span className="especialtyPrice">From $50</span>
            </div>
          </div>
          <div className="especialtyCard">
            <div className="especialtyIconWrapper">
              <div className="especialtyLogo">♀️</div>
            </div>
            <h3 className="especialtyTitle">{t('gynecology', 'Gynecology')}</h3>
            <p className="especialtyDescription">{t('gynecology_text', 'Women\'s health and comprehensive gynecological care.')}</p>
            <div className="especialtyInfo">
              <span className="especialtyDoctors">18+ Doctors</span>
              <span className="especialtyPrice">From $70</span>
            </div>
          </div>
          <div className="especialtyCard">
            <div className="especialtyIconWrapper">
              <div className="especialtyLogo">🦴</div>
            </div>
            <h3 className="especialtyTitle">{t('traumatology', 'Traumatology')}</h3>
            <p className="especialtyDescription">{t('traumatology_text', 'Treatment of injuries to bones, muscles and joints.')}</p>
            <div className="especialtyInfo">
              <span className="especialtyDoctors">10+ Doctors</span>
              <span className="especialtyPrice">From $90</span>
            </div>
          </div>
          <div className="especialtyCard">
            <div className="especialtyIconWrapper">
              <div className="especialtyLogo">🧠</div>
            </div>
            <h3 className="especialtyTitle">{t('neurology', 'Neurology')}</h3>
            <p className="especialtyDescription">{t('neurology_text', 'Diagnosis and treatment of nervous system disorders.')}</p>
            <div className="especialtyInfo">
              <span className="especialtyDoctors">8+ Doctors</span>
              <span className="especialtyPrice">From $100</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contactSection" id="contact">
        <div className="sectionContainer">
          <div className="contactContent">
            <div className="contactInfo">
              <h2 className="sectionTitle">{t('contact_us', 'Contact Us')}</h2>
              <p className="contactDescription">{t('contact_us_text', "Do you have any questions? We're here to help you. Send us a message and we'll get back to you as soon as possible.")}
              </p>
              <div className="contactDetails">
                <div className="contactDetail">
                  <span className="contactIcon">📧</span>
                  <span className="contactText">info@virtualaid.com</span>
                </div>
                <div className="contactDetail">
                  <span className="contactIcon">📞</span>
                  <span className="contactText">+1 (555) 123-4567</span>
                </div>
                <div className="contactDetail">
                  <span className="contactIcon">🕒</span>
                  <span className="contactText">Mon - Fri: 8:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>
            <form className="contactForm" onSubmit={handleContactSubmit}>
              <div className="formGroup">
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder={t('your_full_name', 'Your full name')}
                  className="contactInput"
                  required
                />
              </div>
              <div className="formGroup">
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder={t('your_email', 'Your email address')}
                  className="contactInput"
                  required
                />
              </div>
              <div className="formGroup">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder={t('your_phone', 'Your phone (optional)')}
                  className="contactInput"
                />
              </div>
              <div className="formGroup">
                <textarea
                  id="message"
                  name="message"
                  placeholder={t('your_message', 'Your message')}
                  rows={4}
                  className="contactInput"
                  required
                ></textarea>
              </div>
              {contactMessage && (
                <p style={{ marginBottom: 8, color: '#2563eb' }}>{contactMessage}</p>
              )}
              <button type="submit" className="contactButton" disabled={sending}>
                <span className="buttonIcon">{sending ? '⏳' : '📨'}</span>
                {sending ? t('sending', 'Sending...') : t('send_message', 'Send Message')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footerContainer">
          <div className="footerContent">
            <div className="footerSection">
              <div className="footerLogo">
                <div className="bg-radial from-teal-500/10 to-90% to-slate-900/10">
                  <HeaderLogo variant="icon"/>
                </div>
                <span
                  className="logoText opacity: 1 visibility: visible; display: inline-block; background: linear-gradient(135deg, rgb(37, 99, 235), rgb(16, 185, 129)) text; -webkit-text-fill-color: transparent; color: rgb(37, 99, 235); min-width: 100px; min-height: 1.5rem; font-weight: inherit; text-decoration: none; position: relative;"
                  style={{ textShadow: '0 2px 8px rgba(255,255,255,0.20)'}}
                >
                  VirtualAid
                </span>
              </div>
              <p className="footerDescription">
                {t('footer_desc', 'Your trusted platform to connect with the best healthcare professionals.')}
              </p>
              <div className="socialLinks">
                <Link href="#" className="socialLink">
                  <span className="socialIcon">📘</span>
                  {t('facebook', 'Facebook')}
                </Link>
                <Link href="#" className="socialLink">
                  <span className="socialIcon">🐦</span>
                  {t('twitter', 'Twitter')}
                </Link>
                <Link href="#" className="socialLink">
                  <span className="socialIcon">📷</span>
                  {t('instagram', 'Instagram')}
                </Link>
              </div>
            </div>
            <div className="footerSection">
              <h4 className="footerTitle">{t('quick_links', 'Quick Links')}</h4>
              <ul className="footerLinks">
                <li><Link href="#especialidades" className="footerLink">{t('specialties', 'Specialties')}</Link></li>
                <li><Link href="#acerca" className="footerLink">{t('about', 'About Us')}</Link></li>
                <li><Link href="#contact" className="footerLink">{t('contact', 'Contact')}</Link></li>
                <li><Link href="/login" className="footerLink">{t('signin', 'Sign In')}</Link></li>
              </ul>
            </div>
            <div className="footerSection">
              <h4 className="footerTitle">{t('services', 'Services')}</h4>
              <ul className="footerLinks">
                <li><Link href="#" className="footerLink">{t('online_consult', 'Online Consultations')}</Link></li>
                <li><Link href="#" className="footerLink">{t('in_person', 'In-Person Appointments')}</Link></li>
                <li><Link href="#" className="footerLink">{t('preventive', 'Preventive Medicine')}</Link></li>
                <li><Link href="#" className="footerLink">{t('emergencies', 'Emergencies')}</Link></li>
              </ul>
            </div>
            <div className="footerSection">
              <h4 className="footerTitle">{t('contact', 'Contact')}</h4>
              <div className="footerContact">
                <p className="footerContactItem">📧 info@virtualaid.com</p>
                <p className="footerContactItem">📞 +1 (555) 123-4567</p>
                <p className="footerContactItem">📍 123 Medical Center Dr.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Chatbot */}
      <Chatbot />
      <Footer background="#1f2937" />
    </div>
  );
}
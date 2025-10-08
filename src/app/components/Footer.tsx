"use client";

import { CSSProperties, MouseEvent, ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './footer.module.css';
import LegalModal from './legal/LegalModal';
import PrivacyContent from './legal/PrivacyContent';
import TermsContent from './legal/TermsContent';

type FooterLink = {
    href: string;
    label: string;
    target?: string;
    rel?: string;
    icon?: string; // emoji o icono
};

export interface FooterProps {
    className?: string;
    style?: CSSProperties;
    background?: string; // fondo del footer
    color?: string; // color de texto general
    linkColor?: string; // color de los enlaces
    borderColor?: string; // color del borde superior
    padding?: string; // padding del contenedor
    justify?: CSSProperties['justifyContent']; // alineación horizontal
    sticky?: boolean; // si se desea que quede pegado abajo
    leftContent?: ReactNode; // contenido del lado izquierdo
    links?: FooterLink[]; // enlaces del lado derecho
    variant?: 'default' | 'gradient' | 'medical'; // variantes de diseño
}

const currentYear = new Date().getFullYear();

export default function Footer({
    className,
    style,
    background = 'rgba(255,255,255,0.95)',
    color = '#64748b',
    linkColor,
    borderColor = '#e2e8f0',
    padding = '20px 32px',
    justify = 'space-between',
    sticky = false,
    leftContent,
    links,
    variant = 'medical',
}: FooterProps) {
    const { t } = useTranslation('common');
    const privacyLabel = t('footer.links.privacy');
    const termsLabel = t('footer.links.terms');
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const legalHoverBackground = variant === 'gradient' ? 'rgba(255,255,255,0.1)' : 'rgba(59, 130, 246, 0.1)';

    const translatedDefaultLinks = useMemo<FooterLink[]>(() => ([
        { href: '/P&T/privacy', label: privacyLabel, icon: '🔒' },
        { href: '/P&T/terms', label: termsLabel, icon: '📋' },
    ]), [privacyLabel, termsLabel]);
    
    // Configuración de variantes
    const getVariantStyles = (): CSSProperties => {
        switch (variant) {
            case 'gradient':
                return {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#ffffff',
                    borderTop: 'none',
                    boxShadow: '0 -4px 20px rgba(102, 126, 234, 0.15)',
                };
            case 'medical':
                return {
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
                    color: '#475569',
                    borderTop: `2px solid transparent`,
                    borderImage: 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981) 1',
                    boxShadow: '0 -4px 25px rgba(59, 130, 246, 0.08)',
                };
            default:
                return {
                    background,
                    color,
                    borderTop: `1px solid ${borderColor}`,
                };
        }
    };

    const baseStyle: CSSProperties = {
        width: '100%',
        display: 'flex',
        justifyContent: justify,
        alignItems: 'center',
        fontSize: '0.9rem',
        padding,
        position: sticky ? 'fixed' : 'static',
        bottom: sticky ? 0 : undefined,
        left: sticky ? 0 : undefined,
        zIndex: sticky ? 50 : 10,
        backdropFilter: background.includes('rgba') && !sticky ? 'saturate(180%) blur(10px)' : undefined,
        transition: 'all 0.3s ease',
        marginTop: sticky ? 0 : 'auto',
        ...getVariantStyles(),
        ...style,
    };

    const computeLinkStyle = (idx: number, asButton = false): CSSProperties => ({
        color: linkColor ?? (variant === 'gradient' ? '#ffffff' : '#3b82f6'),
        textDecoration: 'none',
        marginLeft: idx > 0 ? '20px' : '0px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 500,
        transition: 'all 0.2s ease',
        borderRadius: '6px',
        fontSize: '0.85rem',
        backgroundColor: 'transparent',
        padding: '6px 10px',
        cursor: 'pointer',
        border: asButton ? 'none' : '1px solid transparent',
    });

    const handleMouseEnter = (event: MouseEvent<HTMLElement>) => {
        event.currentTarget.style.transform = 'translateY(-1px)';
        event.currentTarget.style.backgroundColor = legalHoverBackground;
    };

    const handleMouseLeave = (event: MouseEvent<HTMLElement>) => {
        event.currentTarget.style.transform = 'translateY(0)';
        event.currentTarget.style.backgroundColor = 'transparent';
    };

    const renderedLinks = (links ?? translatedDefaultLinks).map((l, idx) => {
        const normalizedHref = (l.href ?? '').toLowerCase();
        const isPrivacyLink = normalizedHref === '/p&t/privacy';
        const isTermsLink = normalizedHref === '/p&t/terms';

        if (isPrivacyLink || isTermsLink) {
            const openModal = () => (isPrivacyLink ? setShowPrivacyModal(true) : setShowTermsModal(true));
            const expanded = isPrivacyLink ? showPrivacyModal : showTermsModal;
            return (
                <button
                    key={`${normalizedHref}-${idx}`}
                    type="button"
                    style={computeLinkStyle(idx, true)}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={openModal}
                    aria-haspopup="dialog"
                    aria-expanded={expanded}
                    aria-controls={isPrivacyLink ? 'privacy-legal-modal' : 'terms-legal-modal'}
                >
                    {l.icon && <span style={{ fontSize: '0.85rem' }}>{l.icon}</span>}
                    {l.label}
                </button>
            );
        }

        return (
            <a
                key={`${l.href}-${idx}`}
                href={l.href}
                target={l.target}
                rel={l.rel}
                style={computeLinkStyle(idx)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {l.icon && <span style={{ fontSize: '0.85rem' }}>{l.icon}</span>}
                {l.label}
            </a>
        );
    });

    const leftContentStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: '500',
        fontSize: '0.85rem',
    };

    const brandSection = leftContent ?? (
        <div style={leftContentStyle}>
            <span style={{ 
                fontSize: '1.2rem', 
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '600'
            }}>
                🏥
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{t('footer.copy', { year: currentYear })}</span>
                    <span style={{ 
                        fontWeight: '700', 
                        color: variant === 'gradient' ? '#ffffff' : '#1e293b',
                        background: variant !== 'gradient' ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : undefined,
                        WebkitBackgroundClip: variant !== 'gradient' ? 'text' : undefined,
                        WebkitTextFillColor: variant !== 'gradient' ? 'transparent' : undefined,
                    }}>
                        {t('footer.brand')}
                    </span>
                </div>
                <div style={{ 
                    fontSize: '0.75rem', 
                    opacity: 0.9,
                    color: variant === 'gradient' ? '#ffffff' : '#64748b',
                    fontWeight: '500'
                }}>
                    <span>{t('footer.powered_prefix')}</span>
                    <span style={{ 
                        fontWeight: '700',
                        color: variant === 'gradient' ? '#2468fbff' : '#0b5df5ff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        {t('footer.powered_company')}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <footer className={`${styles.footer} ${className ?? ''}`} style={baseStyle}>
                <div className={styles.left} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    {brandSection}
                </div>
                <div className={styles.links} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {renderedLinks}
                </div>
            </footer>

            <LegalModal
                open={showPrivacyModal}
                onClose={() => setShowPrivacyModal(false)}
                title={t('legal.privacy.title')}
                dialogId="privacy-legal-modal"
            >
                <PrivacyContent />
            </LegalModal>

            <LegalModal
                open={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                title={t('legal.terms.title')}
                dialogId="terms-legal-modal"
            >
                <TermsContent />
            </LegalModal>
        </>
    );
}
import Image from 'next/image';

interface HeaderLogoProps {
  style?: React.CSSProperties;
  className?: string;
  variant?: 'horizontal' | 'icon' | 'vertical' | 'tipografia';
}

const logoMap = {
  horizontal: '/imagenes/Logo/Logo Transparente/Logo sin fondo Horizontal.png',
  icon: '/imagenes/Logo/Logo Transparente/Icono sin fondo.png',
  vertical: '/imagenes/Logo/Logo Transparente/Logo son fondo.png',
  tipografia: '/imagenes/Logo/Logo Transparente/tipografia sin fondo.png',
};

export default function HeaderLogo({ style, className = '', variant = 'horizontal' }: HeaderLogoProps) {
  return (
    <Image
      src={logoMap[variant]}
      alt="Logo VirtualAid"
      width={variant === 'icon' ? 48 : 180}
      height={variant === 'icon' ? 48 : 60}
      priority
      style={style}
      className={className}
    />
  );
}

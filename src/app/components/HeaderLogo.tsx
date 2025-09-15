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
  // Nota: Next/Image lanza warning si se altera sólo width o height vía CSS externo.
  // Para layouts responsivos, conviene envolver con un contenedor y usar sizes o fill.
  // Aquí añadimos style defensivo para preservar aspecto si el consumidor cambia solo un lado.
  const baseWidth = variant === 'icon' ? 48 : 180;
  const baseHeight = variant === 'icon' ? 48 : 60;
  return (
    <Image
      src={logoMap[variant]}
      alt="Logo VirtualAid"
      width={baseWidth}
      height={baseHeight}
      priority
      style={{
        height: 'auto',
        width: 'auto',
        maxWidth: baseWidth,
        maxHeight: baseHeight,
        ...style,
      }}
      className={className}
    />
  );
}

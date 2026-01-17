import { getFlagUrl } from '@/utils/flags';

interface FlagIconProps {
  languageCode: string;
  size?: number;
  className?: string;
}

export function FlagIcon({ languageCode, size = 32, className = '' }: FlagIconProps) {
  const flagUrl = getFlagUrl(languageCode, size);
  
  return (
    <img
      src={flagUrl}
      alt={`${languageCode} flag`}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size * 0.75}px`,
        objectFit: 'cover',
        borderRadius: '2px',
      }}
      loading="lazy"
    />
  );
}

import interLogoPath from "@assets/Inter_1749349499208.webp";

interface InterLogoProps {
  size?: number;
  className?: string;
}

export function InterLogo({ size = 40, className = "" }: InterLogoProps) {
  return (
    <img 
      src={interLogoPath} 
      alt="Inter Milan Logo" 
      width={size} 
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
import type { SVGProps } from 'react';

interface SigmaLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  showStar?: boolean;
}

export function SigmaLogo({ size = 40, showStar = true, className = '', ...rest }: SigmaLogoProps) {
  const viewBoxW = showStar ? 240 : 200;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxW} 200`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <defs>
        <linearGradient id="sigma-swoosh" x1="0" y1="0" x2="1" y2="1" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="45%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="sigma-fill" x1="0" y1="0" x2="1" y2="1" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.92" />
          <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#047857" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <g stroke="url(#sigma-swoosh)" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeWidth="22">
        <path
          d="M36 42 L116 42 C156 42 170 64 170 92 C170 120 156 142 116 142 L64 142"
          strokeWidth="26"
        />
        <path
          d="M70 66 C110 66 134 78 142 100 C134 122 110 134 70 134"
          stroke="url(#sigma-fill)"
          strokeWidth="38"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.12"
        />
      </g>

      <g fill="url(#sigma-swoosh)" transform="translate(28 28)">
        <polygon points="16,0 22,12 34,18 22,24 16,36 10,24 -2,18 10,12" />
      </g>

      <path
        d="M130 160 L188 56 L210 78 L152 182 Z"
        fill="url(#sigma-swoosh)"
        transform="translate(2 0)"
      />

      {showStar && (
        <g transform="translate(178 12)">
          <polygon
            points="24,0 30,18 48,24 30,30 24,48 18,30 0,24 18,18"
            fill="url(#sigma-swoosh)"
            transform="scale(0.85)"
          />
        </g>
      )}
    </svg>
  );
}

export function SigmaMark(props: SigmaLogoProps) {
  return <SigmaLogo showStar {...props} />;
}

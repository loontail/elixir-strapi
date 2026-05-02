import type { SVGAttributes } from 'react';
import { SvgIcon } from './styles';

type IconProps = SVGAttributes<SVGSVGElement> & { size?: number; color?: string };

export const MoveIcon = ({ size = 16, color = 'currentColor', ...props }: IconProps) => (
  <SvgIcon
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    {...props}
  >
    <path
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 12h14M13 6l6 6-6 6"
    />
  </SvgIcon>
);

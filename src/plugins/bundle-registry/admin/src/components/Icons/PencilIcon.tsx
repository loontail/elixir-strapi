import type { SVGAttributes } from 'react';
import { SvgIcon } from './styles';

type IconProps = SVGAttributes<SVGSVGElement> & { size?: number; color?: string };

export const PencilIcon = ({ size = 14, color = '#666687', ...props }: IconProps) => (
  <SvgIcon
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    {...props}
  >
    <path
      fill={color}
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
    />
  </SvgIcon>
);

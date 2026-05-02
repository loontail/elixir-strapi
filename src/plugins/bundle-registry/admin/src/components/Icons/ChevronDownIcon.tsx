import type { SVGAttributes } from 'react';
import { SvgIcon } from './styles';

type IconProps = SVGAttributes<SVGSVGElement> & { size?: number; color?: string };

export const ChevronDownIcon = ({ size = 13, color = 'currentColor', ...props }: IconProps) => (
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
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 9l6 6 6-6"
    />
  </SvgIcon>
);

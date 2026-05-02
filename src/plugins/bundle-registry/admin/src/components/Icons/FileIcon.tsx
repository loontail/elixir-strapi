import type { SVGAttributes } from 'react';
import { SvgIcon } from './styles';

type IconProps = SVGAttributes<SVGSVGElement> & { size?: number; color?: string };

export const FileIcon = ({ size = 14, color = '#4945ff', ...props }: IconProps) => (
  <SvgIcon
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    {...props}
  >
    <path fill={color} opacity={0.8} d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z" />
    <path fill="none" stroke={color} strokeWidth={2} opacity={0.5} d="M13 2v7h7" />
  </SvgIcon>
);

import type { SVGAttributes } from 'react';
import { SvgIcon } from './styles';

type IconProps = SVGAttributes<SVGSVGElement> & { size?: number; color?: string };

export const FolderOpenIcon = ({ size = 16, color = '#c4754a', ...props }: IconProps) => (
  <SvgIcon
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    {...props}
  >
    <path
      fill={color}
      d="M2 7a2 2 0 012-2h4.586a1 1 0 01.707.293L10.707 6.707A1 1 0 0011.414 7H20a2 2 0 012 2v1H2V7z"
    />
    <path
      fill={color}
      d="M2 10h20l-2.4 8.4A2 2 0 0117.66 20H6.34a2 2 0 01-1.94-1.6L2 10z"
    />
  </SvgIcon>
);

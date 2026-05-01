import type { SVGAttributes } from 'react';
import { SvgIcon } from './styles';

type IconProps = SVGAttributes<SVGSVGElement> & { size?: number; color?: string };

export const FolderIcon = ({ size = 16, color = '#c4754a', ...props }: IconProps) => (
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
      d="M3 7a2 2 0 012-2h4.586a1 1 0 01.707.293L11.414 6.5A1 1 0 0012.121 6.793H19a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
    />
  </SvgIcon>
);

import { Typography } from '@strapi/design-system';
import type { BuildStatus } from '../../../../shared/types/entities';
import { BadgePill } from './styles';

interface StatusConfig {
  bg: string;
  text: string;
}

const STATUS: Record<BuildStatus, StatusConfig> = {
  draft: { bg: 'neutral150', text: 'neutral600' },
  processing: { bg: 'warning200', text: 'warning700' },
  ready: { bg: 'success200', text: 'success700' },
  failed: { bg: 'danger200', text: 'danger600' },
};

const DEFAULT_STATUS: StatusConfig = { bg: 'neutral150', text: 'neutral600' };

interface StatusBadgeProps {
  status?: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const cfg = STATUS[status as BuildStatus] ?? DEFAULT_STATUS;

  return (
    <BadgePill $bg={cfg.bg}>
      <Typography variant="pi" fontWeight="bold" textColor={cfg.text}>
        {(status || 'unknown').toUpperCase()}
      </Typography>
    </BadgePill>
  );
};

export default StatusBadge;

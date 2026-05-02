import { Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import type { BuildStatus } from '../../../../shared/types/entities';
import { getTranslation } from '../../utils/getTranslation';
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
  const { formatMessage } = useIntl();
  const translate = (id: string) =>
    formatMessage({ id: getTranslation(id), defaultMessage: id });

  const statusConfig = STATUS[status as BuildStatus] ?? DEFAULT_STATUS;
  const statusKey = STATUS[status as BuildStatus] ? `status.${status}` : 'status.unknown';

  return (
    <BadgePill $bg={statusConfig.bg}>
      <Typography variant="pi" fontWeight="bold" textColor={statusConfig.text}>
        {translate(statusKey)}
      </Typography>
    </BadgePill>
  );
};

export default StatusBadge;

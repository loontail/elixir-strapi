import { memo } from 'react';
import { Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import StatusBadge from '../../../../components/StatusBadge';
import { formatBytes } from '../../../../utils/formatBytes';
import { getTranslation } from '../../../../utils/getTranslation';
import type { Build } from '../../../../../../shared/types/entities';
import { StatsBarRow, StatCard, StatLabel } from './styles';

interface StatsBarProps {
  build: Build;
}

const StatsBar = memo(({ build }: StatsBarProps) => {
  const { formatMessage } = useIntl();
  const t = (id: string) => formatMessage({ id: getTranslation(id), defaultMessage: id });

  return (
    <StatsBarRow>
      {[
        {
          label: t('buildDetail.stats.status'),
          content: <StatusBadge status={build.status} />,
        },
        {
          label: t('buildDetail.stats.files'),
          content: (
            <Typography variant="beta" textColor="neutral800">
              {build.filesCount ?? 0}
            </Typography>
          ),
        },
        {
          label: t('buildDetail.stats.totalSize'),
          content: (
            <Typography variant="beta" textColor="neutral800">
              {formatBytes(build.totalSize)}
            </Typography>
          ),
        },
        {
          label: t('buildDetail.stats.lastGenerated'),
          content: (
            <Typography variant="omega" textColor="neutral600">
              {build.lastGeneratedAt ? new Date(build.lastGeneratedAt).toLocaleString() : '—'}
            </Typography>
          ),
        },
      ].map(({ label, content }) => (
        <StatCard key={label}>
          <StatLabel>
            <Typography variant="sigma" textColor="neutral500">
              {label}
            </Typography>
          </StatLabel>
          {content}
        </StatCard>
      ))}
    </StatsBarRow>
  );
});

StatsBar.displayName = 'StatsBar';

export { StatsBar };

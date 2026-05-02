import { memo, useState, useEffect } from 'react';
import { Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import StatusBadge from '../../../../components/StatusBadge';
import { formatBytes } from '../../../../utils/formatBytes';
import { getTranslation } from '../../../../utils/getTranslation';
import { buildsApi } from '../../../../api/builds';
import type { Build } from '../../../../../../shared/types/entities';
import { StatsBarRow, StatCard, StatLabel } from './styles';

interface StatsBarProps {
  build: Build;
}

const StatsBar = memo(({ build }: StatsBarProps) => {
  const { formatMessage } = useIntl();
  const translate = (id: string) => formatMessage({ id: getTranslation(id), defaultMessage: id });

  const [diskFree, setDiskFree] = useState<number | null>(null);
  useEffect(() => {
    buildsApi.diskSpace().then((r) => setDiskFree(r.free)).catch(() => {});
  }, []);

  return (
    <StatsBarRow>
      {[
        {
          label: translate('buildDetail.stats.status'),
          content: <StatusBadge status={build.status} />,
        },
        {
          label: translate('buildDetail.stats.files'),
          content: (
            <Typography variant="beta" textColor="neutral800">
              {build.filesCount ?? 0}
            </Typography>
          ),
        },
        {
          label: translate('buildDetail.stats.totalSize'),
          content: (
            <Typography variant="beta" textColor="neutral800">
              {formatBytes(build.totalSize)}
              {diskFree !== null && (
                <Typography
                  as="span"
                  variant="omega"
                  textColor={diskFree < 1024 * 1024 * 1024 ? 'danger600' : 'neutral500'}
                >
                  {' / '}{formatBytes(diskFree)} {translate('buildDetail.stats.diskFree.suffix')}
                </Typography>
              )}
            </Typography>
          ),
        },
        {
          label: translate('buildDetail.stats.lastGenerated'),
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

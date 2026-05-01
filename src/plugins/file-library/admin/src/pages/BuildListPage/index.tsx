import { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import {
  ContentLayout,
  HeaderLayout,
  Main,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Typography,
  Loader,
  EmptyStateLayout,
  Dialog,
  DialogBody,
  DialogFooter,
} from '@strapi/design-system';
import { Plus, Trash } from '@strapi/icons';
import { useNotification } from '@strapi/helper-plugin';
import { useIntl } from 'react-intl';
import pluginId from '../../pluginId';
import { buildsApi } from '../../api/builds';
import StatusBadge from '../../components/StatusBadge';
import { formatBytes } from '../../utils/formatBytes';
import { getTranslation } from '../../utils/getTranslation';
import type { Build } from '../../../../shared/types/entities';
import { ClickableTr } from './styles';

const BuildListPage = () => {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const history = useHistory();
  const toggleNotification = useNotification();
  const { formatMessage } = useIntl();

  const t = (id: string, values?: Record<string, string>) =>
    formatMessage({ id: getTranslation(id), defaultMessage: id }, values);

  const load = useCallback(() => {
    setLoading(true);
    buildsApi
      .findMany()
      .then((data) => setBuilds(Array.isArray(data) ? data : []))
      .catch((err: Error) => toggleNotification({ type: 'warning', message: err.message }))
      .finally(() => setLoading(false));
  }, [toggleNotification]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await buildsApi.delete(confirmDelete);
      toggleNotification({
        type: 'success',
        message: t('buildList.toast.deleted', { slug: confirmDelete }),
      });
      setConfirmDelete(null);
      load();
    } catch (err) {
      toggleNotification({ type: 'warning', message: (err as Error).message });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Main>
        <HeaderLayout title={t('buildList.title')} subtitle={t('buildList.subtitle')} />
        <ContentLayout>
          <Loader>{t('buildList.loading')}</Loader>
        </ContentLayout>
      </Main>
    );
  }

  return (
    <Main>
      <HeaderLayout
        title={t('buildList.title')}
        subtitle={t('buildList.subtitle')}
        primaryAction={
          <Button startIcon={<Plus />} onClick={() => history.push(`/plugins/${pluginId}/new`)}>
            {t('buildList.newBuild')}
          </Button>
        }
      />
      <ContentLayout>
        {builds.length === 0 ? (
          <EmptyStateLayout
            icon={<span>📦</span>}
            content={t('buildList.empty')}
            action={
              <Button
                variant="secondary"
                startIcon={<Plus />}
                onClick={() => history.push(`/plugins/${pluginId}/new`)}
              >
                {t('buildList.newBuild')}
              </Button>
            }
          />
        ) : (
          <Table colCount={7} rowCount={builds.length}>
            <Thead>
              <Tr>
                <Th>
                  <Typography variant="sigma">{t('buildList.column.name')}</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">{t('buildList.column.slug')}</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">{t('buildList.column.version')}</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">{t('buildList.column.status')}</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">{t('buildList.column.files')}</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">{t('buildList.column.size')}</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">{t('buildList.column.actions')}</Typography>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {builds.map((build) => (
                <ClickableTr
                  key={build.id}
                  onClick={() => history.push(`/plugins/${pluginId}/${build.slug}`)}
                >
                  <Td>
                    <Typography fontWeight="semiBold">{build.name}</Typography>
                  </Td>
                  <Td>
                    <Typography textColor="neutral600">{build.slug}</Typography>
                  </Td>
                  <Td>
                    <Typography>{build.version || '—'}</Typography>
                  </Td>
                  <Td>
                    <StatusBadge status={build.status} />
                  </Td>
                  <Td>
                    <Typography>{build.filesCount ?? 0}</Typography>
                  </Td>
                  <Td>
                    <Typography>{formatBytes(build.totalSize)}</Typography>
                  </Td>
                  <Td>
                    <Button
                      variant="danger-light"
                      size="S"
                      startIcon={<Trash />}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setConfirmDelete(build.slug);
                      }}
                    >
                      {t('buildList.delete')}
                    </Button>
                  </Td>
                </ClickableTr>
              ))}
            </Tbody>
          </Table>
        )}
      </ContentLayout>

      {confirmDelete && (
        <Dialog
          onClose={() => setConfirmDelete(null)}
          title={t('buildList.deleteConfirm.title')}
          isOpen
        >
          <DialogBody>
            <Typography>
              Delete build <strong>{confirmDelete}</strong>? This will remove all files and the
              manifest.
            </Typography>
          </DialogBody>
          <DialogFooter
            startAction={
              <Button variant="tertiary" onClick={() => setConfirmDelete(null)}>
                {t('buildList.deleteConfirm.cancel')}
              </Button>
            }
            endAction={
              <Button variant="danger-light" onClick={handleDeleteConfirm} loading={deleting}>
                {t('buildList.deleteConfirm.confirm')}
              </Button>
            }
          />
        </Dialog>
      )}
    </Main>
  );
};

export default BuildListPage;

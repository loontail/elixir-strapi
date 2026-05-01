import React, { useEffect, useState, useCallback } from 'react';
import { Link, useHistory } from 'react-router-dom';
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
import pluginId from '../../pluginId';
import { buildsApi } from '../../api/builds';
import StatusBadge from '../../components/StatusBadge';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const b = Number(bytes);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const BuildListPage = () => {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null); // slug to delete
  const [deleting, setDeleting] = useState(false);
  const history = useHistory();
  const toggleNotification = useNotification();

  const load = useCallback(() => {
    setLoading(true);
    buildsApi
      .findMany()
      .then((data) => setBuilds(Array.isArray(data) ? data : []))
      .catch((err) => toggleNotification({ type: 'warning', message: err.message }))
      .finally(() => setLoading(false));
  }, [toggleNotification]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await buildsApi.delete(confirmDelete);
      toggleNotification({ type: 'success', message: `Build "${confirmDelete}" deleted.` });
      setConfirmDelete(null);
      load();
    } catch (err) {
      toggleNotification({ type: 'warning', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Main>
        <HeaderLayout title="File Library" subtitle="Manage Minecraft build file sets" />
        <ContentLayout>
          <Loader>Loading builds…</Loader>
        </ContentLayout>
      </Main>
    );
  }

  return (
    <Main>
      <HeaderLayout
        title="File Library"
        subtitle="Manage Minecraft build file sets"
        primaryAction={
          <Button
            startIcon={<Plus />}
            onClick={() => history.push(`/plugins/${pluginId}/new`)}
          >
            New Build
          </Button>
        }
      />
      <ContentLayout>
        {builds.length === 0 ? (
          <EmptyStateLayout
            icon={<span>📦</span>}
            content="No builds yet. Create your first file build."
            action={
              <Button
                variant="secondary"
                startIcon={<Plus />}
                onClick={() => history.push(`/plugins/${pluginId}/new`)}
              >
                New Build
              </Button>
            }
          />
        ) : (
          <Table colCount={6} rowCount={builds.length}>
            <Thead>
              <Tr>
                <Th><Typography variant="sigma">Name</Typography></Th>
                <Th><Typography variant="sigma">Slug</Typography></Th>
                <Th><Typography variant="sigma">Version</Typography></Th>
                <Th><Typography variant="sigma">Status</Typography></Th>
                <Th><Typography variant="sigma">Files</Typography></Th>
                <Th><Typography variant="sigma">Size</Typography></Th>
                <Th><Typography variant="sigma">Actions</Typography></Th>
              </Tr>
            </Thead>
            <Tbody>
              {builds.map((build) => (
                <Tr
                  key={build.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => history.push(`/plugins/${pluginId}/${build.slug}`)}
                >
                  <Td><Typography fontWeight="semiBold">{build.name}</Typography></Td>
                  <Td><Typography textColor="neutral600">{build.slug}</Typography></Td>
                  <Td><Typography>{build.version || '—'}</Typography></Td>
                  <Td><StatusBadge status={build.status} /></Td>
                  <Td><Typography>{build.filesCount ?? 0}</Typography></Td>
                  <Td><Typography>{formatBytes(build.totalSize)}</Typography></Td>
                  <Td>
                    <Button
                      variant="danger-light"
                      size="S"
                      startIcon={<Trash />}
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(build.slug); }}
                    >
                      Delete
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </ContentLayout>

      {confirmDelete && (
        <Dialog onClose={() => setConfirmDelete(null)} title="Delete build" isOpen>
          <DialogBody>
            <Typography>
              Delete build <strong>{confirmDelete}</strong>? This will remove all files and the manifest.
            </Typography>
          </DialogBody>
          <DialogFooter
            startAction={<Button variant="tertiary" onClick={() => setConfirmDelete(null)}>Cancel</Button>}
            endAction={<Button variant="danger-light" onClick={handleDeleteConfirm} loading={deleting}>Delete</Button>}
          />
        </Dialog>
      )}
    </Main>
  );
};

export default BuildListPage;

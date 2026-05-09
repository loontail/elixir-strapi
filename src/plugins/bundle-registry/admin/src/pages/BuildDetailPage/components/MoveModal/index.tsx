import { useState, useMemo } from 'react';
import {
  Modal,
  Button,
  Typography,
} from '@strapi/design-system';
import { useNotification } from '@strapi/strapi/admin';
import { useBuildsApi } from '../../../../api/builds';
import { useTranslate } from '../../../../hooks/useTranslate';
import { FolderIcon } from '../../../../components/Icons';
import { DirList, DirItem, MovingLabel } from './styles';
import type { Artifact } from '../../../../../../shared/types/entities';

interface MoveModalProps {
  entry: Artifact;
  dirs: Artifact[];
  slug: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const MoveModal = ({ entry, dirs, slug, onClose, onSuccess }: MoveModalProps) => {
  const { toggleNotification } = useNotification();
  const translate = useTranslate();
  const buildsApi = useBuildsApi();

  const currentParent = entry.relativePath.includes('/')
    ? entry.relativePath.substring(0, entry.relativePath.lastIndexOf('/'))
    : '';

  const [selectedDir, setSelectedDir] = useState(currentParent);
  const [saving, setSaving] = useState(false);

  const availableDirs = useMemo(() => {
    return dirs
      .filter((d) => {
        if (entry.isDir) return !d.relativePath.startsWith(entry.relativePath);
        return true;
      })
      .sort((a: Artifact, b: Artifact) => a.relativePath.localeCompare(b.relativePath));
  }, [dirs, entry]);

  const handleConfirm = async () => {
    const newPath = selectedDir ? `${selectedDir}/${entry.name}` : entry.name;
    if (newPath === entry.relativePath) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await buildsApi.renameFile(slug, entry.id, newPath);
      onSuccess(translate('modal.move.toast.success', { path: newPath }));
      onClose();
    } catch (err) {
      toggleNotification({ type: 'warning', message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal.Root open onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>
            {translate(entry.isDir ? 'modal.move.title.folder' : 'modal.move.title.file')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <MovingLabel>{translate('modal.move.moving', { name: entry.relativePath })}</MovingLabel>
          <Typography variant="pi" textColor="neutral600">
            {translate('modal.move.title.file')}
          </Typography>
          <DirList>
            <DirItem
              type="button"
              $active={selectedDir === ''}
              onClick={() => setSelectedDir('')}
            >
              <FolderIcon size={14} color={selectedDir === '' ? '#4945ff' : '#d9822f'} />
              {translate('modal.move.root')}
            </DirItem>
            {availableDirs.length === 0 ? (
              <Typography variant="pi" textColor="neutral400">
                {translate('modal.move.empty')}
              </Typography>
            ) : (
              availableDirs.map((dir: Artifact) => (
                <DirItem
                  key={dir.relativePath}
                  type="button"
                  $active={selectedDir === dir.relativePath}
                  onClick={() => setSelectedDir(dir.relativePath)}
                >
                  <FolderIcon
                    size={14}
                    color={selectedDir === dir.relativePath ? '#4945ff' : '#d9822f'}
                  />
                  {dir.relativePath}
                </DirItem>
              ))
            )}
          </DirList>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onClick={onClose}>
            {translate('modal.move.cancel')}
          </Button>
          <Button onClick={handleConfirm} loading={saving}>
            {translate('modal.move.confirm')}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export { MoveModal };

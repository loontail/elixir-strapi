import { useState } from 'react';
import {
  Modal,
  Button,
  Typography,
  TextInput,
} from '@strapi/design-system';
import { useNotification } from '@strapi/strapi/admin';
import { useBuildsApi } from '../../../../api/builds';
import { useTranslate } from '../../../../hooks/useTranslate';
import type { Artifact } from '../../../../../../shared/types/entities';

interface RenameModalProps {
  entry: Artifact;
  slug: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const RenameModal = ({ entry, slug, onClose, onSuccess }: RenameModalProps) => {
  const { toggleNotification } = useNotification();
  const translate = useTranslate();
  const buildsApi = useBuildsApi();

  const parentDir = entry.relativePath.includes('/')
    ? entry.relativePath.substring(0, entry.relativePath.lastIndexOf('/'))
    : '';

  const [newName, setNewName] = useState(entry.name);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toggleNotification({ type: 'warning', message: translate('modal.rename.validation.required') });
      return;
    }
    if (trimmed.includes('/')) {
      toggleNotification({ type: 'warning', message: translate('modal.rename.validation.noSlash') });
      return;
    }
    if (trimmed === entry.name) {
      onClose();
      return;
    }
    const newPath = parentDir ? `${parentDir}/${trimmed}` : trimmed;
    setSaving(true);
    try {
      await buildsApi.renameFile(slug, entry.id, newPath);
      onSuccess(translate('modal.rename.toast.success'));
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
            <Typography fontWeight="bold" textColor="neutral800">
              {translate(entry.isDir ? 'modal.rename.title.folder' : 'modal.rename.title.file')}
            </Typography>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TextInput
            label={translate('modal.rename.field.label')}
            name="newName"
            value={newName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
            hint={translate('modal.rename.field.hint', { name: entry.name })}
            required
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onClick={onClose}>
            {translate('modal.rename.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {translate('modal.rename.save')}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export { RenameModal };

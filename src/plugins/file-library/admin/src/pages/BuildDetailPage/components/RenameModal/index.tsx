import { useState } from 'react';
import {
  ModalLayout,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Typography,
  TextInput,
} from '@strapi/design-system';
import { useNotification } from '@strapi/helper-plugin';
import { useIntl } from 'react-intl';
import { buildsApi } from '../../../../api/builds';
import { getTranslation } from '../../../../utils/getTranslation';
import type { FileEntry } from '../../../../../../shared/types/entities';

interface RenameModalProps {
  entry: FileEntry;
  slug: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const RenameModal = ({ entry, slug, onClose, onSuccess }: RenameModalProps) => {
  const toggleNotification = useNotification();
  const { formatMessage } = useIntl();
  const t = (id: string, values?: Record<string, string | number>) =>
    formatMessage({ id: getTranslation(id), defaultMessage: id }, values);

  const [newPath, setNewPath] = useState(entry.relativePath);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmed = newPath.trim();
    if (!trimmed) {
      toggleNotification({ type: 'warning', message: t('modal.rename.validation.required') });
      return;
    }
    if (trimmed === entry.relativePath) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await buildsApi.renameFile(slug, entry.id, trimmed);
      onSuccess(t('modal.rename.toast.success'));
      onClose();
    } catch (err) {
      toggleNotification({ type: 'warning', message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalLayout onClose={onClose} labelledBy="rename-title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="rename-title">
          {t(entry.isDir ? 'modal.rename.title.folder' : 'modal.rename.title.file')}
        </Typography>
      </ModalHeader>
      <ModalBody>
        <TextInput
          label={t('modal.rename.field.label')}
          name="newPath"
          value={newPath}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPath(e.target.value)}
          hint={t('modal.rename.field.hint', { path: entry.relativePath })}
          required
        />
      </ModalBody>
      <ModalFooter
        startActions={
          <Button variant="tertiary" onClick={onClose}>
            {t('modal.rename.cancel')}
          </Button>
        }
        endActions={
          <Button onClick={handleSubmit} loading={saving}>
            {t('modal.rename.save')}
          </Button>
        }
      />
    </ModalLayout>
  );
};

export { RenameModal };

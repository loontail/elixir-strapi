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
  const translate = (id: string, values?: Record<string, string | number>) =>
    formatMessage({ id: getTranslation(id), defaultMessage: id }, values);

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
    <ModalLayout onClose={onClose} labelledBy="rename-title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="rename-title">
          {translate(entry.isDir ? 'modal.rename.title.folder' : 'modal.rename.title.file')}
        </Typography>
      </ModalHeader>
      <ModalBody>
        <TextInput
          label={translate('modal.rename.field.label')}
          name="newName"
          value={newName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
          hint={translate('modal.rename.field.hint', { name: entry.name })}
          required
        />
      </ModalBody>
      <ModalFooter
        startActions={
          <Button variant="tertiary" onClick={onClose}>
            {translate('modal.rename.cancel')}
          </Button>
        }
        endActions={
          <Button onClick={handleSubmit} loading={saving}>
            {translate('modal.rename.save')}
          </Button>
        }
      />
    </ModalLayout>
  );
};

export { RenameModal };

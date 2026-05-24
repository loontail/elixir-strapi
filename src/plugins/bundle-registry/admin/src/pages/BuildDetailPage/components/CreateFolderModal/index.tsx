import { useState } from 'react';
import { Modal, Button, TextInput } from '@strapi/design-system';
import { useNotification } from '@strapi/strapi/admin';
import { useBuildsApi } from '../../../../api/builds';
import { useTranslate } from '../../../../hooks/useTranslate';

interface CreateFolderModalProps {
  slug: string;
  initialPath?: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const CreateFolderModal = ({ slug, initialPath, onClose, onSuccess }: CreateFolderModalProps) => {
  const { toggleNotification } = useNotification();
  const translate = useTranslate();
  const buildsApi = useBuildsApi();

  const [relativePath, setRelativePath] = useState(initialPath ?? '');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async () => {
    const trimmed = relativePath.trim().replace(/^\/+|\/+$/g, '');
    if (!trimmed) {
      toggleNotification({
        type: 'warning',
        message: translate('modal.createFolder.validation.required'),
      });
      return;
    }
    setCreating(true);
    try {
      await buildsApi.createFolder(slug, trimmed);
      onSuccess(translate('modal.createFolder.toast.success'));
      onClose();
    } catch (err) {
      toggleNotification({ type: 'warning', message: (err as Error).message });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal.Root
      open
      onOpenChange={(open: boolean) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>{translate('modal.createFolder.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TextInput
            label={translate('modal.createFolder.field.label')}
            name="relativePath"
            value={relativePath}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRelativePath(e.target.value)}
            placeholder={translate('modal.createFolder.field.placeholder')}
            hint={translate('modal.createFolder.field.hint')}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && !creating) handleSubmit();
            }}
            required
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onClick={onClose}>
            {translate('modal.createFolder.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={creating} disabled={!relativePath.trim()}>
            {translate('modal.createFolder.create')}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export { CreateFolderModal };

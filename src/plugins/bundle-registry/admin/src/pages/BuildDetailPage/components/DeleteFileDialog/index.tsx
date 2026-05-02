import { useState } from 'react';
import {
  Modal,
  Button,
  Typography,
} from '@strapi/design-system';
import { useNotification } from '@strapi/strapi/admin';
import { useIntl, FormattedMessage } from 'react-intl';
import { buildsApi } from '../../../../api/builds';
import { getTranslation } from '../../../../utils/getTranslation';
import type { FileEntry } from '../../../../../../shared/types/entities';

interface DeleteFileDialogProps {
  entry: FileEntry;
  slug: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const DeleteFileDialog = ({ entry, slug, onClose, onSuccess }: DeleteFileDialogProps) => {
  const { toggleNotification } = useNotification();
  const { formatMessage } = useIntl();
  const translate = (id: string) => formatMessage({ id: getTranslation(id), defaultMessage: id });
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await buildsApi.deleteFile(slug, entry.id);
      onSuccess('');
      onClose();
    } catch (err) {
      toggleNotification({ type: 'warning', message: (err as Error).message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal.Root open onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>{translate('modal.deleteFile.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Typography>
            <FormattedMessage
              id={getTranslation(
                entry.isDir ? 'modal.deleteFile.body.folder' : 'modal.deleteFile.body.file',
              )}
              values={{ path: <strong>{entry.relativePath}</strong> }}
            />
          </Typography>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onClick={onClose}>
            {translate('modal.deleteFile.cancel')}
          </Button>
          <Button variant="danger-light" onClick={handleConfirm} loading={deleting}>
            {translate('modal.deleteFile.confirm')}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export { DeleteFileDialog };

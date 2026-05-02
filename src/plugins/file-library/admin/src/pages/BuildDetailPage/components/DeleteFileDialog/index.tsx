import { useState } from 'react';
import { Dialog, DialogBody, DialogFooter, Button, Typography } from '@strapi/design-system';
import { useNotification } from '@strapi/helper-plugin';
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
  const toggleNotification = useNotification();
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
    <Dialog onClose={onClose} title={translate('modal.deleteFile.title')} isOpen>
      <DialogBody>
        <Typography>
          <FormattedMessage
            id={getTranslation(
              entry.isDir ? 'modal.deleteFile.body.folder' : 'modal.deleteFile.body.file',
            )}
            values={{ path: <strong>{entry.relativePath}</strong> }}
          />
        </Typography>
      </DialogBody>
      <DialogFooter
        startAction={
          <Button variant="tertiary" onClick={onClose}>
            {translate('modal.deleteFile.cancel')}
          </Button>
        }
        endAction={
          <Button variant="danger-light" onClick={handleConfirm} loading={deleting}>
            {translate('modal.deleteFile.confirm')}
          </Button>
        }
      />
    </Dialog>
  );
};

export { DeleteFileDialog };

import { useState } from 'react';
import {
  Modal,
  Button,
  Typography,
} from '@strapi/design-system';
import { useNotification } from '@strapi/strapi/admin';
import { FormattedMessage } from 'react-intl';
import { buildsApi } from '../../../../api/builds';
import { getTranslation } from '../../../../utils/getTranslation';
import { useTranslate } from '../../../../hooks/useTranslate';

interface BulkDeleteDialogProps {
  ids: number[];
  slug: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const BulkDeleteDialog = ({ ids, slug, onClose, onSuccess }: BulkDeleteDialogProps) => {
  const { toggleNotification } = useNotification();
  const translate = useTranslate();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await buildsApi.bulkDeleteFiles(slug, ids);
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
          <Modal.Title>{translate('modal.bulkDelete.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Typography>
            <FormattedMessage
              id={getTranslation('modal.bulkDelete.body')}
              values={{ count: <strong>{ids.length}</strong> }}
            />
          </Typography>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onClick={onClose}>
            {translate('modal.bulkDelete.cancel')}
          </Button>
          <Button variant="danger-light" onClick={handleConfirm} loading={deleting}>
            {translate('modal.bulkDelete.confirm', { count: ids.length })}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export { BulkDeleteDialog };

import { useState } from 'react';
import { Dialog, DialogBody, DialogFooter, Button, Typography } from '@strapi/design-system';
import { useNotification } from '@strapi/helper-plugin';
import { useIntl, FormattedMessage } from 'react-intl';
import { buildsApi } from '../../../../api/builds';
import { getTranslation } from '../../../../utils/getTranslation';

interface BulkDeleteDialogProps {
  ids: number[];
  slug: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const BulkDeleteDialog = ({ ids, slug, onClose, onSuccess }: BulkDeleteDialogProps) => {
  const toggleNotification = useNotification();
  const { formatMessage } = useIntl();
  const t = (id: string, values?: Record<string, string | number>) =>
    formatMessage({ id: getTranslation(id), defaultMessage: id }, values);
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
    <Dialog onClose={onClose} title={t('modal.bulkDelete.title')} isOpen>
      <DialogBody>
        <Typography>
          <FormattedMessage
            id={getTranslation('modal.bulkDelete.body')}
            values={{ count: <strong>{ids.length}</strong> }}
          />
        </Typography>
      </DialogBody>
      <DialogFooter
        startAction={
          <Button variant="tertiary" onClick={onClose}>
            {t('modal.bulkDelete.cancel')}
          </Button>
        }
        endAction={
          <Button variant="danger-light" onClick={handleConfirm} loading={deleting}>
            {t('modal.bulkDelete.confirm', { count: ids.length })}
          </Button>
        }
      />
    </Dialog>
  );
};

export { BulkDeleteDialog };

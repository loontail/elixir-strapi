import { memo } from 'react';
import { Button, Flex } from '@strapi/design-system';
import { Refresh, Upload, Plus } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../../../utils/getTranslation';

interface ToolbarProps {
  uploading: boolean;
  regenerating: boolean;
  validating: boolean;
  onValidate: () => void;
  onRegenerate: () => void;
  onAddFile: () => void;
  onUploadZip: () => void;
}

const Toolbar = memo(
  ({
    uploading,
    regenerating,
    validating,
    onValidate,
    onRegenerate,
    onAddFile,
    onUploadZip,
  }: ToolbarProps) => {
    const { formatMessage } = useIntl();
    const translate = (id: string) => formatMessage({ id: getTranslation(id), defaultMessage: id });

    return (
      <Flex gap={2}>
        <Button
          variant="secondary"
          startIcon={<Refresh />}
          loading={validating}
          disabled={uploading || regenerating}
          onClick={onValidate}
        >
          {translate('buildDetail.toolbar.validate')}
        </Button>
        <Button
          variant="secondary"
          startIcon={<Refresh />}
          loading={regenerating}
          disabled={uploading || validating}
          onClick={onRegenerate}
        >
          {translate('buildDetail.toolbar.regenerate')}
        </Button>
        <Button
          variant="secondary"
          startIcon={<Plus />}
          disabled={uploading || regenerating}
          onClick={onAddFile}
        >
          {translate('buildDetail.toolbar.addFile')}
        </Button>
        <Button
          startIcon={<Upload />}
          loading={uploading}
          disabled={regenerating}
          onClick={onUploadZip}
        >
          {translate('buildDetail.toolbar.uploadZip')}
        </Button>
      </Flex>
    );
  },
);

Toolbar.displayName = 'Toolbar';

export { Toolbar };

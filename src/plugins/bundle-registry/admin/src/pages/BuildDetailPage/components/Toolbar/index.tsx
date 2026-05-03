import { memo } from 'react';
import { Button, Flex } from '@strapi/design-system';
import { ArrowClockwise, Upload, Plus } from '@strapi/icons';
import { useTranslate } from '../../../../hooks/useTranslate';

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
  function Toolbar({
    uploading,
    regenerating,
    validating,
    onValidate,
    onRegenerate,
    onAddFile,
    onUploadZip,
  }: ToolbarProps) {
    const translate = useTranslate();

    return (
      <Flex gap={2}>
        <Button
          variant="secondary"
          startIcon={<ArrowClockwise />}
          loading={validating}
          disabled={uploading || regenerating}
          onClick={onValidate}
        >
          {translate('buildDetail.toolbar.validate')}
        </Button>
        <Button
          variant="secondary"
          startIcon={<ArrowClockwise />}
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

export { Toolbar };

import { useRef, useState } from 'react';
import {
  Modal,
  Button,
  Typography,
  Box,
  TextInput,
} from '@strapi/design-system';
import { useTheme } from 'styled-components';
import { useNotification } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { UploadIcon, FileIcon } from '../../../../components/Icons';
import { uploadFile } from '../../../../api/builds';
import { formatBytes } from '../../../../utils/formatBytes';
import { getTranslation } from '../../../../utils/getTranslation';
import {
  DropZone,
  DropZoneIconRow,
  DropZoneFileName,
  DropZoneFileSize,
  DropZonePrompt,
  MonoHint,
  HiddenFileInput,
} from './styles';

interface AddFileModalProps {
  slug: string;
  initialPath?: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const AddFileModal = ({ slug, initialPath, onClose, onSuccess }: AddFileModalProps) => {
  const theme = useTheme();
  const colors = theme.colors;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toggleNotification } = useNotification();
  const { formatMessage } = useIntl();
  const translate = (id: string, values?: Record<string, string | number>) =>
    formatMessage({ id: getTranslation(id), defaultMessage: id }, values);

  const [file, setFile] = useState<File | null>(null);
  const [targetPath, setTargetPath] = useState(initialPath || '');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const isReplace = !!initialPath;

  const pickFile = (f: File | null | undefined) => {
    if (!f) return;
    setFile(f);
    if (!targetPath || targetPath === initialPath) setTargetPath(initialPath || f.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      toggleNotification({ type: 'warning', message: translate('modal.addFile.validation.noFile') });
      return;
    }
    if (!targetPath.trim()) {
      toggleNotification({ type: 'warning', message: translate('modal.addFile.validation.noPath') });
      return;
    }
    setUploading(true);
    try {
      await uploadFile(slug, file, targetPath.trim());
      onSuccess(translate('modal.addFile.toast.success'));
      onClose();
    } catch (err) {
      toggleNotification({ type: 'warning', message: (err as Error).message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal.Root open onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>
            {translate(isReplace ? 'modal.addFile.title.replace' : 'modal.addFile.title.add')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Box paddingBottom={5}>
            <HiddenFileInput
              ref={fileInputRef}
              type="file"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => pickFile(e.target.files?.[0])}
            />
            <DropZone
              $dragging={dragOver}
              $filled={!!file}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <div>
                  <DropZoneIconRow>
                    <FileIcon size={32} color={colors.success600} />
                  </DropZoneIconRow>
                  <Typography
                    variant="omega"
                    fontWeight="bold"
                    textColor="success700"
                    as={DropZoneFileName}
                  >
                    {file.name}
                  </Typography>
                  <Typography variant="pi" textColor="success600" as={DropZoneFileSize}>
                    {formatBytes(file.size)}
                  </Typography>
                  <Typography variant="pi" textColor="neutral500">
                    {translate('modal.addFile.dropzone.change')}
                  </Typography>
                </div>
              ) : (
                <div>
                  <DropZoneIconRow>
                    <UploadIcon size={32} color={dragOver ? colors.primary500 : colors.neutral400} />
                  </DropZoneIconRow>
                  <Typography
                    variant="omega"
                    fontWeight="semiBold"
                    textColor={dragOver ? 'primary600' : 'neutral700'}
                    as={DropZonePrompt}
                  >
                    {translate(dragOver ? 'modal.addFile.dropzone.active' : 'modal.addFile.dropzone.idle')}
                  </Typography>
                  {isReplace && initialPath && (
                    <Typography variant="pi" textColor="neutral500" as={MonoHint}>
                      {translate('modal.addFile.replacing', { path: initialPath })}
                    </Typography>
                  )}
                </div>
              )}
            </DropZone>
          </Box>
          <TextInput
            label={translate('modal.addFile.targetPath.label')}
            name="targetPath"
            value={targetPath}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetPath(e.target.value)}
            placeholder={translate('modal.addFile.targetPath.placeholder')}
            hint={translate(
              isReplace
                ? 'modal.addFile.targetPath.hint.replace'
                : 'modal.addFile.targetPath.hint.add',
            )}
            required
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onClick={onClose}>
            {translate('modal.addFile.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={uploading} disabled={!file}>
            {translate('modal.addFile.upload')}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export { AddFileModal };

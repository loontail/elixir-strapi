import { useRef, useState } from 'react';
import {
  useTheme,
  ModalLayout,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Typography,
  Box,
  TextInput,
} from '@strapi/design-system';
import { useNotification } from '@strapi/helper-plugin';
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
  const c = theme.colors;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toggleNotification = useNotification();
  const { formatMessage } = useIntl();
  const t = (id: string, values?: Record<string, string | number>) =>
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
      toggleNotification({ type: 'warning', message: t('modal.addFile.validation.noFile') });
      return;
    }
    if (!targetPath.trim()) {
      toggleNotification({ type: 'warning', message: t('modal.addFile.validation.noPath') });
      return;
    }
    setUploading(true);
    try {
      await uploadFile(slug, file, targetPath.trim());
      onSuccess(t('modal.addFile.toast.success'));
      onClose();
    } catch (err) {
      toggleNotification({ type: 'warning', message: (err as Error).message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <ModalLayout onClose={onClose} labelledBy="add-file-title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="add-file-title">
          {t(isReplace ? 'modal.addFile.title.replace' : 'modal.addFile.title.add')}
        </Typography>
      </ModalHeader>
      <ModalBody>
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
                  <FileIcon size={32} color={c.success600} />
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
                  {t('modal.addFile.dropzone.change')}
                </Typography>
              </div>
            ) : (
              <div>
                <DropZoneIconRow>
                  <UploadIcon size={32} color={dragOver ? c.primary500 : c.neutral400} />
                </DropZoneIconRow>
                <Typography
                  variant="omega"
                  fontWeight="semiBold"
                  textColor={dragOver ? 'primary600' : 'neutral700'}
                  as={DropZonePrompt}
                >
                  {t(dragOver ? 'modal.addFile.dropzone.active' : 'modal.addFile.dropzone.idle')}
                </Typography>
                {isReplace && initialPath && (
                  <Typography variant="pi" textColor="neutral500" as={MonoHint}>
                    {t('modal.addFile.replacing', { path: initialPath })}
                  </Typography>
                )}
              </div>
            )}
          </DropZone>
        </Box>
        <TextInput
          label={t('modal.addFile.targetPath.label')}
          name="targetPath"
          value={targetPath}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetPath(e.target.value)}
          placeholder={t('modal.addFile.targetPath.placeholder')}
          hint={t(
            isReplace
              ? 'modal.addFile.targetPath.hint.replace'
              : 'modal.addFile.targetPath.hint.add',
          )}
          required
        />
      </ModalBody>
      <ModalFooter
        startActions={
          <Button variant="tertiary" onClick={onClose}>
            {t('modal.addFile.cancel')}
          </Button>
        }
        endActions={
          <Button onClick={handleSubmit} loading={uploading} disabled={!file}>
            {t('modal.addFile.upload')}
          </Button>
        }
      />
    </ModalLayout>
  );
};

export { AddFileModal };

import { useCallback } from 'react';
import { useNotification } from '@strapi/helper-plugin';
import { buildsApi, uploadArchive as uploadArchiveApi } from '../../../api/builds';
import type { FileEntry } from '../../../../../shared/types/entities';
import type { ValidateResult } from '../../../../../shared/types/api';

interface UseFileOperationsOptions {
  slug: string;
  load: () => void;
  setUploading: (v: boolean) => void;
  setRegenerating: (v: boolean) => void;
  setValidating: (v: boolean) => void;
  setValidation: (v: ValidateResult | null) => void;
  validation: ValidateResult | null;
  onOpenModal: (modal: ModalState) => void;
}

export type ModalState =
  | { type: 'add' }
  | { type: 'replace'; entry: FileEntry }
  | { type: 'rename'; entry: FileEntry }
  | { type: 'delete'; entry: FileEntry }
  | { type: 'bulkDelete' };

interface UseFileOperationsResult {
  handleArchiveUpload: (file: File) => Promise<void>;
  handleRegenerate: () => Promise<void>;
  handleValidate: () => Promise<void>;
  handleRemoveMissing: () => Promise<void>;
  handleToggleDownloadOnce: (entry: FileEntry) => Promise<void>;
  handleRehash: (entry: FileEntry) => Promise<void>;
  handleContextAction: (type: string, entry: FileEntry) => void;
}

const useFileOperations = ({
  slug,
  load,
  setUploading,
  setRegenerating,
  setValidating,
  setValidation,
  validation,
  onOpenModal,
}: UseFileOperationsOptions): UseFileOperationsResult => {
  const toggleNotification = useNotification();

  const notify = useCallback(
    (type: 'success' | 'warning', message: string) => toggleNotification({ type, message }),
    [toggleNotification],
  );

  const handleArchiveUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        await uploadArchiveApi(slug, file);
        notify('success', 'Archive uploaded.');
        load();
      } catch (err) {
        notify('warning', (err as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [slug, load, setUploading, notify],
  );

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    try {
      await buildsApi.regenerate(slug);
      notify('success', 'Manifest regenerated.');
      load();
    } catch (err) {
      notify('warning', (err as Error).message);
    } finally {
      setRegenerating(false);
    }
  }, [slug, load, setRegenerating, notify]);

  const handleValidate = useCallback(async () => {
    setValidating(true);
    try {
      const result = await buildsApi.validate(slug);
      setValidation(result);
      if (result.missing.length === 0 && result.orphaned.length === 0) {
        notify('success', 'All files present — no issues found.');
      } else {
        if (result.missing.length > 0) {
          notify(
            'warning',
            `${result.missing.length} file${result.missing.length !== 1 ? 's' : ''} missing from disk — highlighted in red.`,
          );
        }
        if (result.orphaned.length > 0) {
          notify(
            'warning',
            `${result.orphaned.length} orphaned file${result.orphaned.length !== 1 ? 's' : ''} on disk — use Regenerate to add them.`,
          );
        }
      }
    } catch (err) {
      notify('warning', (err as Error).message);
    } finally {
      setValidating(false);
    }
  }, [slug, setValidating, setValidation, notify]);

  const handleRemoveMissing = useCallback(async () => {
    if (!validation?.missing?.length) return;
    try {
      await buildsApi.bulkDeleteFiles(
        slug,
        validation.missing.map((f) => f.id),
      );
      notify('success', `Removed ${validation.missing.length} missing entry(s).`);
      setValidation(null);
      load();
    } catch (err) {
      notify('warning', (err as Error).message);
    }
  }, [slug, validation, load, setValidation, notify]);

  const handleToggleDownloadOnce = useCallback(
    async (entry: FileEntry) => {
      try {
        await buildsApi.updateFile(slug, entry.id, { downloadOnce: !entry.downloadOnce });
        load();
      } catch (err) {
        notify('warning', (err as Error).message);
      }
    },
    [slug, load, notify],
  );

  const handleRehash = useCallback(
    async (entry: FileEntry) => {
      try {
        await buildsApi.rehashFile(slug, entry.id);
        notify('success', `Hash regenerated for ${entry.name}.`);
        load();
      } catch (err) {
        notify('warning', (err as Error).message);
      }
    },
    [slug, load, notify],
  );

  const handleContextAction = useCallback(
    (type: string, entry: FileEntry) => {
      if (type === 'rehash') {
        handleRehash(entry);
        return;
      }
      onOpenModal({ type: type as ModalState['type'], entry } as ModalState);
    },
    [handleRehash, onOpenModal],
  );

  return {
    handleArchiveUpload,
    handleRegenerate,
    handleValidate,
    handleRemoveMissing,
    handleToggleDownloadOnce,
    handleRehash,
    handleContextAction,
  };
};

export { useFileOperations };

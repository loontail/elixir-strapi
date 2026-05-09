import { useCallback } from 'react';
import { useNotification } from '@strapi/strapi/admin';
import { useBuildsApi } from '../../../api/builds';
import { useTranslate } from '../../../hooks/useTranslate';
import type { Artifact } from '../../../../../shared/types/entities';
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
  | { type: 'replace'; entry: Artifact }
  | { type: 'rename'; entry: Artifact }
  | { type: 'move'; entry: Artifact }
  | { type: 'delete'; entry: Artifact }
  | { type: 'bulkDelete' };

interface UseFileOperationsResult {
  handleArchiveUpload: (file: File) => Promise<void>;
  handleRegenerate: () => Promise<void>;
  handleValidate: () => Promise<void>;
  handleRemoveMissing: () => Promise<void>;
  handleToggleDownloadOnce: (entry: Artifact) => Promise<void>;
  handleRehash: (entry: Artifact) => Promise<void>;
  handleMove: (entry: Artifact, newPath: string) => Promise<void>;
  handleContextAction: (type: string, entry: Artifact) => void;
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
  const { toggleNotification } = useNotification();
  const translate = useTranslate();
  const buildsApi = useBuildsApi();

  const notify = useCallback(
    (type: 'success' | 'warning', message: string) => toggleNotification({ type, message }),
    [toggleNotification],
  );

  const handleArchiveUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        await buildsApi.uploadArchive(slug, file);
        notify('success', translate('buildDetail.toast.archive.success'));
        load();
      } catch (err) {
        notify('warning', (err as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [buildsApi, slug, load, setUploading, notify, translate],
  );

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    try {
      await buildsApi.regenerate(slug);
      notify('success', translate('buildDetail.toast.regenerate.success'));
      load();
    } catch (err) {
      notify('warning', (err as Error).message);
    } finally {
      setRegenerating(false);
    }
  }, [buildsApi, slug, load, setRegenerating, notify, translate]);

  const handleValidate = useCallback(async () => {
    setValidating(true);
    try {
      const result = await buildsApi.validate(slug);
      setValidation(result);
      if (result.missing.length === 0 && result.orphaned.length === 0) {
        notify('success', translate('buildDetail.toast.validate.success'));
      } else {
        if (result.missing.length > 0) {
          notify('warning', translate('buildDetail.toast.validate.missing', { count: result.missing.length }));
        }
        if (result.orphaned.length > 0) {
          notify('warning', translate('buildDetail.toast.validate.orphaned', { count: result.orphaned.length }));
        }
      }
    } catch (err) {
      notify('warning', (err as Error).message);
    } finally {
      setValidating(false);
    }
  }, [buildsApi, slug, setValidating, setValidation, notify, translate]);

  const handleRemoveMissing = useCallback(async () => {
    if (!validation?.missing?.length) return;
    try {
      await buildsApi.bulkDeleteFiles(
        slug,
        validation.missing.map((f) => f.id),
      );
      notify('success', translate('buildDetail.toast.removeMissing.success', { count: validation.missing.length }));
      setValidation(null);
      load();
    } catch (err) {
      notify('warning', (err as Error).message);
    }
  }, [buildsApi, slug, validation, load, setValidation, notify, translate]);


  const handleToggleDownloadOnce = useCallback(
    async (entry: Artifact) => {
      try {
        await buildsApi.updateFile(slug, entry.id, { downloadOnce: !entry.downloadOnce });
        load();
      } catch (err) {
        notify('warning', (err as Error).message);
      }
    },
    [buildsApi, slug, load, notify],
  );

  const handleRehash = useCallback(
    async (entry: Artifact) => {
      try {
        await buildsApi.rehashFile(slug, entry.id);
        notify('success', translate('buildDetail.toast.rehash.success', { name: entry.name }));
        load();
      } catch (err) {
        notify('warning', (err as Error).message);
      }
    },
    [buildsApi, slug, load, notify, translate],
  );

  const handleMove = useCallback(
    async (entry: Artifact, newPath: string) => {
      try {
        await buildsApi.renameFile(slug, entry.id, newPath);
        notify('success', translate('modal.move.toast.success', { path: newPath }));
        load();
      } catch (err) {
        notify('warning', (err as Error).message);
      }
    },
    [buildsApi, slug, load, notify, translate],
  );

  const handleContextAction = useCallback(
    (type: string, entry: Artifact) => {
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
    handleMove,
    handleContextAction,
  };
};

export { useFileOperations };

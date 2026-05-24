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
  | { type: 'createFolder' }
  | { type: 'replace'; entry: Artifact }
  | { type: 'rename'; entry: Artifact }
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

  // Common shape for action handlers: optional busy flag, optional success
  // toast, reload-on-success, warn-toast on error. The validate/removeMissing
  // flows have custom success branches and stay outside.
  const runAction = useCallback(
    async (
      action: () => Promise<unknown>,
      opts: { setBusy?: (b: boolean) => void; successMessage?: string },
    ): Promise<void> => {
      opts.setBusy?.(true);
      try {
        await action();
        if (opts.successMessage) notify('success', opts.successMessage);
        load();
      } catch (err) {
        notify('warning', (err as Error).message);
      } finally {
        opts.setBusy?.(false);
      }
    },
    [notify, load],
  );

  const handleArchiveUpload = useCallback(
    (file: File) =>
      runAction(() => buildsApi.uploadArchive(slug, file), {
        setBusy: setUploading,
        successMessage: translate('buildDetail.toast.archive.success'),
      }),
    [buildsApi, slug, runAction, setUploading, translate],
  );

  const handleRegenerate = useCallback(
    () =>
      runAction(() => buildsApi.regenerate(slug), {
        setBusy: setRegenerating,
        successMessage: translate('buildDetail.toast.regenerate.success'),
      }),
    [buildsApi, slug, runAction, setRegenerating, translate],
  );

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
    (entry: Artifact) =>
      runAction(
        () => buildsApi.updateFile(slug, entry.id, { downloadOnce: !entry.downloadOnce }),
        {},
      ),
    [buildsApi, slug, runAction],
  );

  const handleRehash = useCallback(
    (entry: Artifact) =>
      runAction(() => buildsApi.rehashFile(slug, entry.id), {
        successMessage: translate('buildDetail.toast.rehash.success', { name: entry.name }),
      }),
    [buildsApi, slug, runAction, translate],
  );

  const handleMove = useCallback(
    (entry: Artifact, newPath: string) =>
      runAction(() => buildsApi.renameFile(slug, entry.id, newPath), {
        successMessage: translate('modal.move.toast.success', { path: newPath }),
      }),
    [buildsApi, slug, runAction, translate],
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

import { useRef, useMemo, useCallback, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  ContentLayout,
  HeaderLayout,
  Main,
  Button,
  Box,
  Typography,
  Loader,
  Flex,
} from '@strapi/design-system';
import { ArrowLeft, Trash } from '@strapi/icons';
import { useIntl, FormattedMessage } from 'react-intl';
import pluginId from '../../pluginId';
import { getTranslation } from '../../utils/getTranslation';
import { formatBytes } from '../../utils/formatBytes';
import { useBuildDetail } from './hooks/useBuildDetail';
import { useFileTree } from './hooks/useFileTree';
import { useFileOperations } from './hooks/useFileOperations';
import type { ModalState } from './hooks/useFileOperations';
import { Toolbar } from './components/Toolbar';
import { StatsBar } from './components/StatsBar';
import { FileTreeTable } from './components/FileTreeTable';
import { AddFileModal } from './components/AddFileModal';
import { RenameModal } from './components/RenameModal';
import { DeleteFileDialog } from './components/DeleteFileDialog';
import { BulkDeleteDialog } from './components/BulkDeleteDialog';
import {
  LoadingBarContainer,
  LoadingBarFill,
  HiddenInput,
  ManifestFlexGrow,
  MonoUrl,
  CopyButtonWrap,
  TablePanel,
  FilesToolbar,
  ToolbarInner,
  ToolbarLeft,
  CounterBox,
  NoWrapP,
  ZeroMarginP,
  SelectionPill,
  ToolbarActions,
  EmptyStateBox,
  SearchWrapper,
  SearchIcon,
  SearchInput,
  SearchClearButton,
} from './styles';
import type { FileEntry } from '../../../../shared/types/entities';

const BuildDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const history = useHistory();
  const archiveInputRef = useRef<HTMLInputElement>(null);
  const { formatMessage } = useIntl();
  const translate = (id: string, values?: Record<string, string | number>) =>
    formatMessage({ id: getTranslation(id), defaultMessage: id }, values);

  const {
    build,
    loading,
    uploading,
    regenerating,
    validating,
    validation,
    load,
    setUploading,
    setRegenerating,
    setValidating,
    setValidation,
  } = useBuildDetail(slug);

  const [modal, setModal] = useState<ModalState | null>(null);
  const closeModal = useCallback(() => setModal(null), []);

  const fileEntries: FileEntry[] = useMemo(() => build?.fileEntries ?? [], [build]);

  const {
    rows,
    expanded,
    selected,
    search,
    allSelected,
    someSelected,
    filteredFiles,
    files,
    setSearch,
    toggleExpand,
    toggleFile,
    toggleDir,
    toggleAll,
    resetSelected,
  } = useFileTree(fileEntries);

  const handleLoad = useCallback(() => {
    resetSelected();
    load();
  }, [resetSelected, load]);

  const onSuccess = useCallback(
    (_msg: string) => {
      handleLoad();
    },
    [handleLoad],
  );

  const {
    handleArchiveUpload,
    handleRegenerate,
    handleValidate,
    handleRemoveMissing,
    handleToggleDownloadOnce,
    handleMove,
    handleContextAction,
  } = useFileOperations({
    slug,
    load: handleLoad,
    setUploading,
    setRegenerating,
    setValidating,
    setValidation,
    validation,
    onOpenModal: setModal,
  });

  const handleArchiveInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await handleArchiveUpload(file);
      e.target.value = '';
    },
    [handleArchiveUpload],
  );

  const missingIds = useMemo(
    () => new Set((validation?.missing ?? []).map((f) => f.id)),
    [validation],
  );

  const selectedIds = useMemo(() => [...selected], [selected]);

  if (loading && !build) {
    return (
      <Main>
        <HeaderLayout title="" />
        <ContentLayout>
          <Loader>{translate('buildDetail.loading')}</Loader>
        </ContentLayout>
      </Main>
    );
  }

  if (!build) {
    return (
      <Main>
        <HeaderLayout title="" />
        <ContentLayout>
          <Box background="danger100" padding={5} hasRadius>
            <Typography textColor="danger600">
              {translate('buildDetail.notFound', { slug })}
            </Typography>
          </Box>
        </ContentLayout>
      </Main>
    );
  }

  const manifestUrl = `/api/file-library/builds/${slug}/manifest`;

  return (
    <Main>
      {loading && build && (
        <LoadingBarContainer>
          <LoadingBarFill />
        </LoadingBarContainer>
      )}

      <HiddenInput
        ref={archiveInputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={handleArchiveInput}
      />

      <HeaderLayout
        title={build.name}
        subtitle={`${build.slug}${build.version ? ` · v${build.version}` : ''}`}
        navigationAction={
          <Button
            variant="tertiary"
            startIcon={<ArrowLeft />}
            onClick={() => history.push(`/plugins/${pluginId}`)}
          >
            {translate('buildDetail.back')}
          </Button>
        }
        primaryAction={
          <Toolbar
            uploading={uploading}
            regenerating={regenerating}
            validating={validating}
            onValidate={handleValidate}
            onRegenerate={handleRegenerate}
            onAddFile={() => setModal({ type: 'add' })}
            onUploadZip={() => archiveInputRef.current?.click()}
          />
        }
      />

      <ContentLayout>
        <StatsBar build={build} />

        {build.processingError && (
          <Box background="danger100" padding={4} hasRadius marginBottom={4}>
            <Typography variant="omega" textColor="danger600">
              {build.processingError}
            </Typography>
          </Box>
        )}

        {build.status === 'ready' && (
          <Box background="success100" padding={4} hasRadius marginBottom={6}>
            <Flex gap={3} alignItems="flex-start" justifyContent="space-between">
              <ManifestFlexGrow>
                <Typography variant="sigma" textColor="success700">
                  {translate('buildDetail.manifest.label')}
                </Typography>
                <Box paddingTop={1} paddingBottom={2}>
                  <Typography variant="omega" textColor="neutral800" as={MonoUrl}>
                    {manifestUrl}
                  </Typography>
                </Box>
                <Typography variant="pi" textColor="neutral600">
                  <FormattedMessage
                    id={getTranslation('buildDetail.manifest.hint')}
                    values={{ metadataUrl: <strong>metadataUrl</strong> }}
                  />
                </Typography>
              </ManifestFlexGrow>
              <CopyButtonWrap>
                <Button
                  variant="secondary"
                  size="S"
                  onClick={() => navigator.clipboard.writeText(manifestUrl)}
                >
                  {translate('buildDetail.manifest.copy')}
                </Button>
              </CopyButtonWrap>
            </Flex>
          </Box>
        )}

        <TablePanel>
          <FilesToolbar>
            <ToolbarInner>
              <ToolbarLeft>
                <SearchWrapper>
                  <SearchIcon>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </SearchIcon>
                  <SearchInput
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={translate('buildDetail.search.placeholder')}
                    hasClear={!!search}
                  />
                  {search && (
                    <SearchClearButton type="button" onClick={() => setSearch('')}>
                      ×
                    </SearchClearButton>
                  )}
                </SearchWrapper>
                <CounterBox>
                  <Typography
                    as={NoWrapP}
                    variant="omega"
                    fontWeight="semiBold"
                    textColor="neutral800"
                  >
                    {search.trim()
                      ? translate('buildDetail.fileCount.filtered', {
                          filtered: filteredFiles.length,
                          total: files.length,
                        })
                      : translate('buildDetail.fileCount', { count: files.length })}
                  </Typography>
                  {!search.trim() && build.totalSize ? (
                    <Typography as={ZeroMarginP} variant="pi" textColor="neutral500">
                      {formatBytes(build.totalSize)}
                    </Typography>
                  ) : null}
                </CounterBox>
                {selected.size > 0 && (
                  <SelectionPill>
                    <Typography variant="pi" fontWeight="bold" textColor="primary600">
                      {translate('buildDetail.selected', { count: selected.size })}
                    </Typography>
                  </SelectionPill>
                )}
              </ToolbarLeft>

              <ToolbarActions>
                {(validation?.missing?.length ?? 0) > 0 && (
                  <Button variant="danger-light" size="S" onClick={handleRemoveMissing}>
                    {translate('buildDetail.action.removeMissing', { count: validation!.missing.length })}
                  </Button>
                )}
                {selected.size > 0 && (
                  <Button
                    variant="danger-light"
                    size="S"
                    startIcon={<Trash />}
                    onClick={() => setModal({ type: 'bulkDelete' })}
                  >
                    {translate('buildDetail.action.deleteSelected', { count: selected.size })}
                  </Button>
                )}
              </ToolbarActions>
            </ToolbarInner>
          </FilesToolbar>

          {files.length === 0 ? (
            <EmptyStateBox>
              <Box paddingBottom={2}>
                <Typography variant="beta" textColor="neutral400">
                  {translate('buildDetail.empty.title')}
                </Typography>
              </Box>
              <Typography variant="omega" textColor="neutral400">
                {translate('buildDetail.empty.subtitle')}
              </Typography>
            </EmptyStateBox>
          ) : filteredFiles.length === 0 ? (
            <EmptyStateBox>
              <Typography variant="omega" textColor="neutral400">
                {translate('buildDetail.empty.search', { query: search })}
              </Typography>
            </EmptyStateBox>
          ) : (
            <FileTreeTable
              rows={rows}
              expanded={expanded}
              selected={selected}
              missingIds={missingIds}
              slug={slug}
              buildName={build.name}
              totalFiles={files.length}
              allSelected={allSelected}
              someSelected={someSelected}
              onToggleAll={toggleAll}
              onToggleExpand={toggleExpand}
              onToggleFile={toggleFile}
              onToggleDir={toggleDir}
              onContextAction={handleContextAction}
              onToggleDownloadOnce={handleToggleDownloadOnce}
              onMove={handleMove}
            />
          )}
        </TablePanel>
      </ContentLayout>

      {modal?.type === 'add' && (
        <AddFileModal slug={slug} onClose={closeModal} onSuccess={onSuccess} />
      )}
      {modal?.type === 'replace' && 'entry' in modal && (
        <AddFileModal
          slug={slug}
          initialPath={modal.entry.relativePath}
          onClose={closeModal}
          onSuccess={onSuccess}
        />
      )}
      {modal?.type === 'rename' && 'entry' in modal && (
        <RenameModal entry={modal.entry} slug={slug} onClose={closeModal} onSuccess={onSuccess} />
      )}
      {modal?.type === 'delete' && 'entry' in modal && (
        <DeleteFileDialog
          entry={modal.entry}
          slug={slug}
          onClose={closeModal}
          onSuccess={onSuccess}
        />
      )}
      {modal?.type === 'bulkDelete' && (
        <BulkDeleteDialog
          ids={selectedIds}
          slug={slug}
          onClose={closeModal}
          onSuccess={onSuccess}
        />
      )}
    </Main>
  );
};

export default BuildDetailPage;

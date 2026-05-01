import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  useTheme,
  ContentLayout,
  HeaderLayout,
  Main,
  Button,
  Box,
  Typography,
  Loader,
  Flex,
  TextInput,
  Dialog,
  DialogBody,
  DialogFooter,
  ModalLayout,
  ModalHeader,
  ModalBody,
  ModalFooter,
  IconButton,
  SimpleMenu,
  MenuItem,
  BaseCheckbox,
} from '@strapi/design-system';
import {
  ArrowLeft,
  Refresh,
  Upload,
  Trash,
  Plus,
  More,
  ChevronRight,
  ChevronDown,
  Pencil,
  Hashtag,
} from '@strapi/icons';
import { useNotification } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';
import { buildsApi, uploadArchive, uploadFile } from '../../api/builds';
import StatusBadge from '../../components/StatusBadge';
import { PencilIcon, UploadIcon, HashIcon, TrashIcon, FolderIcon, FileIcon } from '../../components/Icons';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  const b = Number(bytes);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildFileTree(files, dirEntriesMap = new Map()) {
  const nodeMap = new Map();
  files.forEach((file) => {
    const parts = file.relativePath.split('/');
    for (let i = 1; i < parts.length; i++) {
      const dirPath = parts.slice(0, i).join('/');
      if (!nodeMap.has(dirPath)) {
        nodeMap.set(dirPath, { key: dirPath, name: parts[i - 1], isDir: true, entry: dirEntriesMap.get(dirPath) || null, children: [] });
      }
    }
    nodeMap.set(file.relativePath, { key: file.relativePath, name: file.name, isDir: false, entry: file, children: [] });
  });
  const roots = [];
  nodeMap.forEach((node, nodePath) => {
    const parts = nodePath.split('/');
    if (parts.length === 1) roots.push(node);
    else {
      const parent = nodeMap.get(parts.slice(0, -1).join('/'));
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  });
  function sort(nodes) {
    nodes.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sort(n.children));
  }
  sort(roots);
  return roots;
}

function flattenTree(nodes, depth, expanded, hasMore = []) {
  const rows = [];
  nodes.forEach((node, idx) => {
    const isLast = idx === nodes.length - 1;
    const lineFlags = [...hasMore, !isLast]; // true = line continues past this row
    rows.push({ node, depth, lineFlags });
    if (node.isDir && expanded.has(node.key))
      rows.push(...flattenTree(node.children, depth + 1, expanded, lineFlags));
  });
  return rows;
}

function getFileIds(node) {
  if (!node.isDir) return node.entry ? [node.entry.id] : [];
  return node.children.flatMap(getFileIds);
}

// ─── Column widths ────────────────────────────────────────────────────────────

const COL = {
  check: { width: 48,  minWidth: 48,  paddingLeft: 16, paddingRight: 8, flexShrink: 0 },
  name:  { flex: '1 1 0', minWidth: 180, overflow: 'hidden' },
  size:  { width: 90,  minWidth: 80,  textAlign: 'right', paddingRight: 16, flexShrink: 0 },
  mod:   { width: 140, minWidth: 120, paddingLeft: 16, flexShrink: 0 },
  hash:  { width: 160, minWidth: 140, paddingLeft: 16, flexShrink: 0 },
  dl:    { width: 120, minWidth: 100, paddingLeft: 12, flexShrink: 0 },
  act:   { width: 48,  minWidth: 48,  textAlign: 'center', flexShrink: 0 },
};

// ─── File tree ────────────────────────────────────────────────────────────────

const FileTree = ({ rows, expanded, selected, slug, missingIds = new Set(), onToggleExpand, onToggleFile, onToggleDir, onContextAction, onToggleDownloadOnce }) => {
  const theme = useTheme();
  const c = theme.colors;

  if (rows.length === 0) return null;

  const rowBase = {
    display: 'flex',
    alignItems: 'center',
    borderBottom: `1px solid ${c.neutral150}`,
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header row */}
      <div style={{
        ...rowBase,
        background: c.neutral100,
        height: 36,
        borderBottom: `1px solid ${c.neutral200}`,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: c.neutral500,
      }}>
        <div style={COL.check} />
        <div style={{ ...COL.name, paddingLeft: 8 }}>Name</div>
        <div style={COL.size}>Size</div>
        <div style={COL.mod}>Modified</div>
        <div style={COL.hash}>SHA-256</div>
        <div style={COL.dl}>Once</div>
        <div style={COL.act} />
      </div>

      {rows.map(({ node, depth, lineFlags }) => {
        // Tree connector lines (VS Code style):
        // - Ancestor levels (i < depth-1): draw full-height vertical ONLY if that ancestor
        //   has more siblings below (lineFlags[i]=true). If it's the last child, skip entirely.
        // - Immediate parent (i = depth-1): ALWAYS draw ├ (full) or └ (half) + horizontal arm.
        // Spine X is aligned to the center of the expand-arrow button at each level:
        //   paddingLeft(D) = D*20+4, button width = 21px, center = D*20+14.5 ≈ D*20+14
        // Arm width 10px ends exactly at paddingLeft = depth*20+4.
        // Vertical lines always span the full row height (top:0, bottom:0).
        const guideLines = depth === 0 ? null : Array.from({ length: depth }, (_, i) => {
          const isImmediate = i === depth - 1;
          // non-immediate: "does the depth-i ancestor have more children after us?" = lineFlags[i+1]
          // immediate: "does this node have more siblings?" = lineFlags[depth]
          const continues = isImmediate ? lineFlags[depth] : lineFlags[i + 1];
          if (!isImmediate && !continues) return null; // ancestor's subtree ends here — skip stub
          const spineX = i * 20 + 14; // expand-button center; folder icon (+33) is always inside child button range so spine must stay left of button
          return (
            <React.Fragment key={i}>
              <span style={{
                position: 'absolute',
                left: spineX,
                top: 0,
                // ├ goes full height; └ (last child) stops at the horizontal arm
                bottom: (isImmediate && !continues) ? '50%' : 0,
                width: 1,
                background: c.neutral300,
                pointerEvents: 'none',
              }} />
              {isImmediate && (
                <span style={{
                  position: 'absolute',
                  left: spineX,
                  top: '50%',
                  width: 10, // spine(i*20+14) → button left edge((i+1)*20+4): diff = 10
                  height: 1,
                  background: c.neutral300,
                  pointerEvents: 'none',
                }} />
              )}
            </React.Fragment>
          );
        });

        if (node.isDir) {
          const dirIds = getFileIds(node);
          const allSel = dirIds.length > 0 && dirIds.every((id) => selected.has(id));
          const someSel = !allSel && dirIds.some((id) => selected.has(id));
          const isOpen = expanded.has(node.key);
          return (
            <div key={node.key} style={{
              ...rowBase,
              background: c.neutral0,
              borderLeft: `3px solid ${isOpen ? c.primary600 : 'transparent'}`,
              minHeight: 48,
            }}>
              <div style={{ ...COL.check, paddingLeft: 13 }}>
                {dirIds.length > 0 && (
                  <BaseCheckbox
                    aria-label={`Select all in ${node.name}`}
                    checked={someSel ? 'indeterminate' : allSel}
                    onChange={() => onToggleDir(node)}
                  />
                )}
              </div>
              <div style={{ ...COL.name, position: 'relative', display: 'flex', alignItems: 'center', alignSelf: 'stretch', gap: 8, paddingLeft: depth * 20 + 4 }}>
                {guideLines}
                <button
                  type="button"
                  onClick={() => onToggleExpand(node.key)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 21, height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.neutral400, flexShrink: 0, zIndex: 1 }}
                  aria-expanded={isOpen}
                >
                  {isOpen ? <ChevronDown width="13px" height="13px" /> : <ChevronRight width="13px" height="13px" />}
                </button>
                <FolderIcon size={16} color={isOpen ? c.primary600 : c.warning600} />
                <span style={{ fontWeight: 600, fontSize: 14, color: c.neutral800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', zIndex: 1 }}>
                  {node.name}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: c.neutral500, background: c.neutral150, borderRadius: 20, padding: '2px 8px', flexShrink: 0, zIndex: 1 }}>
                  {dirIds.length}
                </span>
              </div>
              <div style={COL.size} /><div style={COL.mod} /><div style={COL.hash} /><div style={COL.dl} />
              <div style={COL.act}>
                {node.entry && (
                  <SimpleMenu label="Folder actions" as={IconButton} icon={<More />}>
                    <MenuItem onClick={() => onContextAction('rename', node.entry)}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PencilIcon />
                        Rename / Move
                      </span>
                    </MenuItem>
                    <MenuItem onClick={() => onContextAction('delete', node.entry)}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrashIcon />
                        <span style={{ color: '#D02B20' }}>Delete folder</span>
                      </span>
                    </MenuItem>
                  </SimpleMenu>
                )}
              </div>
            </div>
          );
        }

        const entry = node.entry;
        const isSel = selected.has(entry.id);
        const isMissing = missingIds.has(entry.id);
        return (
          <div key={entry.id} style={{
            ...rowBase,
            background: isMissing ? c.danger100 : (isSel ? c.primary100 : c.neutral0),
            transition: 'background 0.1s',
            borderLeft: `3px solid ${isMissing ? c.danger600 : (isSel ? c.primary600 : 'transparent')}`,
            minHeight: 48,
          }}>
            <div style={{ ...COL.check, paddingLeft: 13 }}>
              <BaseCheckbox
                aria-label={`Select ${entry.name}`}
                checked={isSel}
                onChange={() => onToggleFile(entry.id)}
              />
            </div>
            <div style={{ ...COL.name, position: 'relative', display: 'flex', alignItems: 'center', alignSelf: 'stretch', gap: 8, paddingLeft: depth * 20 + 4 }}>
              {guideLines}
              {/* spacer matches expand-button width so file icon aligns with folder icon */}
              <span style={{ width: 21, flexShrink: 0, display: 'inline-block' }} />
              <FileIcon size={14} color={c.primary500} />
              {isMissing && (
                <span style={{ fontSize: 10, fontWeight: 700, color: c.danger600, background: c.danger100, border: `1px solid ${c.danger200}`, borderRadius: 4, padding: '1px 6px', flexShrink: 0, zIndex: 1, whiteSpace: 'nowrap' }}>
                  missing
                </span>
              )}
              <div style={{ overflow: 'hidden', zIndex: 1 }}>
                <a
                  href={`${window.location.origin}/file-library/builds/${slug}/files/${entry.relativePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={entry.relativePath}
                  style={{
                    fontSize: 14, fontWeight: 500, color: c.neutral800,
                    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  {entry.name}
                </a>
              </div>
            </div>
            <div style={{ ...COL.size, fontSize: 13, color: c.neutral600, fontVariantNumeric: 'tabular-nums' }}>
              {formatBytes(entry.size)}
            </div>
            <div style={{ ...COL.mod, fontSize: 12, color: c.neutral500, fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace, monospace' }}>
              {formatDate(entry.fileModifiedAt)}
            </div>
            <div style={COL.hash}>
              {entry.sha256 ? (
                <span
                  title={`Click to copy: ${entry.sha256}`}
                  onClick={() => navigator.clipboard.writeText(entry.sha256)}
                  style={{
                    fontFamily: 'ui-monospace, monospace', fontSize: 11, color: c.neutral600,
                    background: c.neutral100, border: `1px solid ${c.neutral150}`,
                    borderRadius: 4, padding: '3px 7px', cursor: 'pointer',
                    display: 'inline-block', maxWidth: '100%',
                  }}
                >
                  …{entry.sha256.slice(-12)}
                </span>
              ) : (
                <Typography variant="omega" textColor="neutral400">—</Typography>
              )}
            </div>
            <div style={COL.dl}>
              <button
                type="button"
                aria-label={`Download once: ${entry.downloadOnce ? 'on' : 'off'}`}
                onClick={() => onToggleDownloadOnce(entry)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                <span style={{
                  display: 'inline-block', position: 'relative',
                  width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                  background: entry.downloadOnce ? c.primary600 : c.neutral300,
                  transition: 'background 0.2s',
                }}>
                  <span style={{
                    position: 'absolute', top: 3,
                    left: entry.downloadOnce ? 21 : 3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: c.neutral0,
                    transition: 'left 0.2s',
                  }} />
                </span>
              </button>
            </div>
            <div style={COL.act}>
              <SimpleMenu label="Actions" as={IconButton} icon={<More />}>
                <MenuItem onClick={() => onContextAction('rename', entry)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PencilIcon />
                    Rename / Move
                  </span>
                </MenuItem>
                <MenuItem onClick={() => onContextAction('replace', entry)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UploadIcon />
                    Replace file
                  </span>
                </MenuItem>
                <MenuItem onClick={() => onContextAction('rehash', entry)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HashIcon />
                    Regenerate hash
                  </span>
                </MenuItem>
                <MenuItem onClick={() => onContextAction('delete', entry)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrashIcon />
                    <span style={{ color: '#D02B20' }}>Delete</span>
                  </span>
                </MenuItem>
              </SimpleMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Modals ───────────────────────────────────────────────────────────────────

const AddFileModal = ({ slug, initialPath, onClose, onSuccess }) => {
  const theme = useTheme();
  const c = theme.colors;
  const fileInputRef = useRef(null);
  const toggleNotification = useNotification();

  const [file, setFile] = useState(null);
  const [targetPath, setTargetPath] = useState(initialPath || '');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const isReplace = !!initialPath;

  const pickFile = (f) => {
    if (!f) return;
    setFile(f);
    if (!targetPath || targetPath === initialPath) setTargetPath(initialPath || f.name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) { toggleNotification({ type: 'warning', message: 'Select a file first' }); return; }
    if (!targetPath.trim()) { toggleNotification({ type: 'warning', message: 'Target path is required' }); return; }
    setUploading(true);
    try { await uploadFile(slug, file, targetPath.trim()); onSuccess('File uploaded.'); onClose(); }
    catch (err) { toggleNotification({ type: 'warning', message: err.message }); }
    finally { setUploading(false); }
  };

  const dropZoneStyle = {
    border: `2px dashed ${dragOver ? c.primary500 : file ? c.success500 : c.neutral300}`,
    borderRadius: 8,
    padding: '28px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    background: dragOver ? c.primary100 : file ? c.success100 : c.neutral100,
    transition: 'border-color 0.15s, background 0.15s',
    userSelect: 'none',
  };

  return (
    <ModalLayout onClose={onClose} labelledBy="add-file-title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="add-file-title">
          {isReplace ? 'Replace File' : 'Add File'}
        </Typography>
      </ModalHeader>
      <ModalBody>
        {/* Drop zone */}
        <Box paddingBottom={5}>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={(e) => pickFile(e.target.files[0])} />
          <div
            style={dropZoneStyle}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <FileIcon size={32} color={c.success600} />
                </div>
                <Typography variant="omega" fontWeight="bold" textColor="success700" as="p" style={{ margin: '0 0 4px' }}>
                  {file.name}
                </Typography>
                <Typography variant="pi" textColor="success600" as="p" style={{ margin: '0 0 10px' }}>
                  {formatBytes(file.size)}
                </Typography>
                <Typography variant="pi" textColor="neutral500">
                  Click or drop to choose a different file
                </Typography>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <UploadIcon size={32} color={dragOver ? c.primary500 : c.neutral400} />
                </div>
                <Typography variant="omega" fontWeight="semiBold" textColor={dragOver ? 'primary600' : 'neutral700'} as="p" style={{ margin: '0 0 4px' }}>
                  {dragOver ? 'Drop to select' : 'Drop file here or click to browse'}
                </Typography>
                {isReplace && (
                  <Typography variant="pi" textColor="neutral500" as="p" style={{ margin: '6px 0 0', fontFamily: 'ui-monospace, monospace' }}>
                    Replacing: {initialPath}
                  </Typography>
                )}
              </div>
            )}
          </div>
        </Box>

        <TextInput
          label="Target path" name="targetPath" value={targetPath}
          onChange={(e) => setTargetPath(e.target.value)}
          placeholder="mods/mymod.jar"
          hint={isReplace ? 'Change to move to a different location.' : 'Relative path inside the build.'}
          required
        />
      </ModalBody>
      <ModalFooter
        startActions={<Button variant="tertiary" onClick={onClose}>Cancel</Button>}
        endActions={<Button onClick={handleSubmit} loading={uploading} disabled={!file}>Upload</Button>}
      />
    </ModalLayout>
  );
};

const RenameModal = ({ entry, slug, onClose, onSuccess }) => {
  const toggleNotification = useNotification();
  const [newPath, setNewPath] = useState(entry.relativePath);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmed = newPath.trim();
    if (!trimmed) { toggleNotification({ type: 'warning', message: 'Path is required' }); return; }
    if (trimmed === entry.relativePath) { onClose(); return; }
    setSaving(true);
    try { await buildsApi.renameFile(slug, entry.id, trimmed); onSuccess('File renamed.'); onClose(); }
    catch (err) { toggleNotification({ type: 'warning', message: err.message }); }
    finally { setSaving(false); }
  };

  return (
    <ModalLayout onClose={onClose} labelledBy="rename-title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="rename-title">
          {entry.isDir ? 'Rename / Move Folder' : 'Rename / Move File'}
        </Typography>
      </ModalHeader>
      <ModalBody>
        <TextInput label="New path" name="newPath" value={newPath} onChange={(e) => setNewPath(e.target.value)} hint={`Current: ${entry.relativePath}`} required />
      </ModalBody>
      <ModalFooter
        startActions={<Button variant="tertiary" onClick={onClose}>Cancel</Button>}
        endActions={<Button onClick={handleSubmit} loading={saving}>Save</Button>}
      />
    </ModalLayout>
  );
};

const DeleteFileDialog = ({ entry, slug, onClose, onSuccess }) => {
  const toggleNotification = useNotification();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try { await buildsApi.deleteFile(slug, entry.id); onSuccess('File deleted.'); onClose(); }
    catch (err) { toggleNotification({ type: 'warning', message: err.message }); }
    finally { setDeleting(false); }
  };

  return (
    <Dialog onClose={onClose} title="Delete file" isOpen>
      <DialogBody>
        <Typography>
          Delete <strong>{entry.relativePath}</strong>?{' '}
          {entry.isDir
            ? 'This will permanently delete the folder and all files inside it.'
            : 'This removes the file from disk.'}{' '}
          The manifest will be regenerated.
        </Typography>
      </DialogBody>
      <DialogFooter
        startAction={<Button variant="tertiary" onClick={onClose}>Cancel</Button>}
        endAction={<Button variant="danger-light" onClick={handleConfirm} loading={deleting}>Delete</Button>}
      />
    </Dialog>
  );
};

const BulkDeleteDialog = ({ ids, slug, onClose, onSuccess }) => {
  const toggleNotification = useNotification();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try { await buildsApi.bulkDeleteFiles(slug, ids); onSuccess(`${ids.length} file(s) deleted.`); onClose(); }
    catch (err) { toggleNotification({ type: 'warning', message: err.message }); }
    finally { setDeleting(false); }
  };

  return (
    <Dialog onClose={onClose} title="Delete selected files" isOpen>
      <DialogBody>
        <Typography>Delete <strong>{ids.length}</strong> selected file(s)? This removes them from disk and regenerates the manifest.</Typography>
      </DialogBody>
      <DialogFooter
        startAction={<Button variant="tertiary" onClick={onClose}>Cancel</Button>}
        endAction={<Button variant="danger-light" onClick={handleConfirm} loading={deleting}>Delete {ids.length}</Button>}
      />
    </Dialog>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const BuildDetailPage = () => {
  const { slug } = useParams();
  const history = useHistory();
  const theme = useTheme();
  const c = theme.colors;

  const toggleNotification = useNotification();
  const archiveInputRef = useRef(null);

  const [build, setBuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [expanded, setExpanded] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setSelected(new Set());
    buildsApi.findOne(slug)
      .then((data) => { setBuild(data); })
      .catch((err) => toggleNotification({ type: 'warning', message: err.message }))
      .finally(() => setLoading(false));
  }, [slug, toggleNotification]);

  useEffect(() => { load(); }, [load]);

  const files = useMemo(() => (build?.fileEntries || []).filter((e) => !e.isDir), [build]);

  const dirEntriesMap = useMemo(() => {
    const map = new Map();
    (build?.fileEntries || []).filter((e) => e.isDir).forEach((e) => map.set(e.relativePath, e));
    return map;
  }, [build]);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.relativePath.toLowerCase().includes(q) || f.name.toLowerCase().includes(q));
  }, [files, search]);

  const tree = useMemo(() => buildFileTree(filteredFiles, dirEntriesMap), [filteredFiles, dirEntriesMap]);

  const effectiveExpanded = useMemo(() => {
    if (!search.trim()) return expanded;
    const allDirs = new Set();
    function collect(nodes) { nodes.forEach((n) => { if (n.isDir) { allDirs.add(n.key); collect(n.children); } }); }
    collect(tree);
    return allDirs;
  }, [search, tree, expanded]);

  const rows = useMemo(() => flattenTree(tree, 0, effectiveExpanded), [tree, effectiveExpanded]);

  const allFileIds  = useMemo(() => files.map((f) => f.id), [files]);
  const allSelected = allFileIds.length > 0 && allFileIds.every((id) => selected.has(id));
  const someSelected = !allSelected && allFileIds.some((id) => selected.has(id));

  const toggleExpand = (key) => setExpanded((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const toggleFile   = (id)  => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleDir    = (node) => {
    const ids = getFileIds(node);
    const allIn = ids.every((id) => selected.has(id));
    setSelected((p) => { const n = new Set(p); ids.forEach((id) => allIn ? n.delete(id) : n.add(id)); return n; });
  };
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allFileIds));

  const notify = (type, message) => toggleNotification({ type, message });

  const handleArchiveInput = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { await uploadArchive(slug, file); notify('success', 'Archive uploaded.'); load(); }
    catch (err) { notify('warning', err.message); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try { await buildsApi.regenerate(slug); notify('success', 'Manifest regenerated.'); load(); }
    catch (err) { notify('warning', err.message); }
    finally { setRegenerating(false); }
  };

  const handleToggleDownloadOnce = async (entry) => {
    try { await buildsApi.updateFile(slug, entry.id, { downloadOnce: !entry.downloadOnce }); load(); }
    catch (err) { notify('warning', err.message); }
  };

  const handleRehash = async (entry) => {
    try { await buildsApi.rehashFile(slug, entry.id); notify('success', `Hash regenerated for ${entry.name}.`); load(); }
    catch (err) { notify('warning', err.message); }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const result = await buildsApi.validate(slug);
      setValidation(result);
      if (result.missing.length === 0 && result.orphaned.length === 0) {
        notify('success', 'All files present — no issues found.');
      } else {
        if (result.missing.length > 0)
          notify('warning', `${result.missing.length} file${result.missing.length !== 1 ? 's' : ''} missing from disk — highlighted in red.`);
        if (result.orphaned.length > 0)
          notify('warning', `${result.orphaned.length} orphaned file${result.orphaned.length !== 1 ? 's' : ''} on disk — use Regenerate to add them.`);
      }
    }
    catch (err) { notify('warning', err.message); }
    finally { setValidating(false); }
  };

  const handleRemoveMissing = async () => {
    if (!validation?.missing?.length) return;
    try {
      await buildsApi.bulkDeleteFiles(slug, validation.missing.map((f) => f.id));
      notify('success', `Removed ${validation.missing.length} missing entry(s).`);
      setValidation(null);
      load();
    } catch (err) { notify('warning', err.message); }
  };

  const missingIds = useMemo(() => new Set((validation?.missing || []).map((f) => f.id)), [validation]);

  const handleContextAction = (type, entry) => {
    if (type === 'rehash') { handleRehash(entry); return; }
    setModal({ type, entry });
  };

  const closeModal = () => setModal(null);
  const onSuccess  = (msg) => { notify('success', msg); load(); };

  if (loading && !build) return (
    <Main><HeaderLayout title="Build Detail" /><ContentLayout><Loader>Loading…</Loader></ContentLayout></Main>
  );

  if (!build) return (
    <Main><HeaderLayout title="Build Not Found" /><ContentLayout>
      <Box background="danger100" padding={5} hasRadius>
        <Typography textColor="danger600">Build &quot;{slug}&quot; was not found.</Typography>
      </Box>
    </ContentLayout></Main>
  );

  const manifestUrl = `/api/file-library/builds/${slug}/manifest`;
  const selectedIds = [...selected];

  return (
    <Main>
      {/* Indeterminate progress bar for background refreshes */}
      {loading && build && (
        <>
          <style>{`@keyframes fl-loading{0%{left:-60%}100%{left:110%}}`}</style>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 9999, background: c.neutral200, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, height: '100%', width: '60%', background: c.primary600, animation: 'fl-loading 1.2s linear infinite' }} />
          </div>
        </>
      )}

      {/* Hidden archive file input triggered via ref */}
      <input
        ref={archiveInputRef}
        type="file"
        accept=".zip,application/zip"
        style={{ display: 'none' }}
        onChange={handleArchiveInput}
      />

      <HeaderLayout
        title={build.name}
        subtitle={`${build.slug}${build.version ? ` · v${build.version}` : ''}`}
        navigationAction={
          <Button variant="tertiary" startIcon={<ArrowLeft />} onClick={() => history.push(`/plugins/${pluginId}`)}>
            Back
          </Button>
        }
        primaryAction={
          <Flex gap={2}>
            <Button
              variant="secondary"
              startIcon={<Refresh />}
              loading={validating}
              disabled={uploading || regenerating}
              onClick={handleValidate}
            >
              Validate
            </Button>
            <Button
              variant="secondary"
              startIcon={<Refresh />}
              loading={regenerating}
              disabled={uploading || validating}
              onClick={handleRegenerate}
            >
              Regenerate
            </Button>
            <Button
              variant="secondary"
              startIcon={<Plus />}
              disabled={uploading || regenerating}
              onClick={() => setModal({ type: 'add' })}
            >
              Add file
            </Button>
            <Button
              startIcon={<Upload />}
              loading={uploading}
              disabled={regenerating}
              onClick={() => archiveInputRef.current?.click()}
            >
              Upload ZIP
            </Button>
          </Flex>
        }
      />

      <ContentLayout>
        {/* Stats */}
        <Flex gap={4} marginBottom={6} style={{ flexWrap: 'wrap' }}>
          {[
            { label: 'Status',         content: <StatusBadge status={build.status} /> },
            { label: 'Files',          content: <Typography variant="beta" textColor="neutral800">{build.filesCount ?? 0}</Typography> },
            { label: 'Total size',     content: <Typography variant="beta" textColor="neutral800">{formatBytes(build.totalSize)}</Typography> },
            { label: 'Last generated', content: <Typography variant="omega" textColor="neutral600">{build.lastGeneratedAt ? new Date(build.lastGeneratedAt).toLocaleString() : '—'}</Typography> },
          ].map(({ label, content }) => (
            <Box key={label} background="neutral0" padding={5} hasRadius style={{ flex: '1 1 0', minWidth: 140, border: `1px solid ${c.neutral150}` }}>
              <Typography variant="sigma" textColor="neutral500">{label}</Typography>
              <Box paddingTop={2}>{content}</Box>
            </Box>
          ))}
        </Flex>

        {/* Processing error */}
        {build.processingError && (
          <Box background="danger100" padding={4} hasRadius marginBottom={4}>
            <Typography variant="omega" textColor="danger600">{build.processingError}</Typography>
          </Box>
        )}

        {/* Manifest URL */}
        {build.status === 'ready' && (
          <Box background="success100" padding={4} hasRadius marginBottom={6}>
            <Flex gap={3} alignItems="flex-start" justifyContent="space-between">
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Typography variant="sigma" textColor="success700">Manifest URL</Typography>
                <Box paddingTop={1} paddingBottom={2}>
                  <Typography
                    variant="omega"
                    textColor="neutral800"
                    style={{ fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}
                  >
                    {manifestUrl}
                  </Typography>
                </Box>
                <Typography variant="pi" textColor="neutral600">
                  Set as <strong>metadataUrl</strong> on the Client, or use the File Library Build custom field.
                </Typography>
              </Box>
              <Button
                variant="secondary"
                size="S"
                onClick={() => { navigator.clipboard.writeText(manifestUrl); notify('success', 'URL copied.'); }}
                style={{ flexShrink: 0, marginTop: 2 }}
              >
                Copy
              </Button>
            </Flex>
          </Box>
        )}

        {/* File manager card */}
        <Box background="neutral0" hasRadius style={{ overflow: 'hidden', border: `1px solid ${c.neutral150}` }}>
          {/* Toolbar */}
          <Box background="neutral100" padding={3} style={{ borderBottom: `1px solid ${c.neutral150}` }}>
            <Flex justifyContent="space-between" alignItems="center" gap={3}>
              {/* Left: checkbox + search + count */}
              <Flex alignItems="center" gap={3} style={{ flex: 1, minWidth: 0 }}>
                <BaseCheckbox
                  aria-label="Select all files"
                  checked={someSelected ? 'indeterminate' : allSelected}
                  onChange={toggleAll}
                />
                {/* Search input */}
                <div style={{ position: 'relative', flex: '1 1 0', maxWidth: 320, minWidth: 80 }}>
                  <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', color: c.neutral400 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search files…"
                    style={{
                      width: '100%', height: 32, boxSizing: 'border-box',
                      paddingLeft: 30, paddingRight: search ? 28 : 10,
                      border: `1px solid ${c.neutral200}`, borderRadius: 4,
                      fontSize: 14, color: c.neutral800, background: c.neutral0,
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.neutral400, fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
                  )}
                </div>
                {/* File count */}
                <Box style={{ flexShrink: 0 }}>
                  <Typography as="p" variant="omega" fontWeight="semiBold" textColor="neutral800" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                    {search.trim()
                      ? <>{filteredFiles.length}{' '}<Typography as="span" variant="omega" textColor="neutral500">of {files.length}</Typography></>
                      : files.length
                    }{' '}file{files.length !== 1 ? 's' : ''}
                  </Typography>
                  {!search.trim() && build.totalSize
                    ? <Typography as="p" variant="pi" textColor="neutral500" style={{ margin: 0 }}>{formatBytes(build.totalSize)}</Typography>
                    : null}
                </Box>
                {selected.size > 0 && (
                  <Box background="primary100" hasRadius style={{ padding: '3px 10px', border: `1px solid ${c.primary200}`, flexShrink: 0 }}>
                    <Typography variant="pi" fontWeight="bold" textColor="primary600">
                      {selected.size} selected
                    </Typography>
                  </Box>
                )}
              </Flex>

              {/* Right: missing + bulk delete */}
              <Flex gap={2} alignItems="center" style={{ flexShrink: 0 }}>
                {validation?.missing?.length > 0 && (
                  <Button variant="danger-light" size="S" onClick={handleRemoveMissing}>
                    Remove missing ({validation.missing.length})
                  </Button>
                )}
                {selected.size > 0 && (
                  <Button variant="danger-light" size="S" startIcon={<Trash />} onClick={() => setModal({ type: 'bulkDelete' })}>
                    Delete {selected.size}
                  </Button>
                )}
              </Flex>
            </Flex>
          </Box>

          {/* Tree / empty states */}
          {files.length === 0 ? (
            <Box padding={8} background="neutral0" style={{ textAlign: 'center' }}>
              <Box paddingBottom={2}><Typography variant="beta" textColor="neutral400">No files yet</Typography></Box>
              <Typography variant="omega" textColor="neutral400">Upload a ZIP archive or add files individually.</Typography>
            </Box>
          ) : filteredFiles.length === 0 ? (
            <Box padding={8} background="neutral0" style={{ textAlign: 'center' }}>
              <Typography variant="omega" textColor="neutral400">No files match &quot;{search}&quot;</Typography>
            </Box>
          ) : (
            <FileTree
              rows={rows}
              expanded={expanded}
              selected={selected}
              slug={slug}
              missingIds={missingIds}
              onToggleExpand={toggleExpand}
              onToggleFile={toggleFile}
              onToggleDir={toggleDir}
              onContextAction={handleContextAction}
              onToggleDownloadOnce={handleToggleDownloadOnce}
            />
          )}
        </Box>
      </ContentLayout>

      {modal?.type === 'add'        && <AddFileModal  slug={slug} onClose={closeModal} onSuccess={onSuccess} />}
      {modal?.type === 'replace'    && <AddFileModal  slug={slug} initialPath={modal.entry.relativePath} onClose={closeModal} onSuccess={onSuccess} />}
      {modal?.type === 'rename'     && <RenameModal   entry={modal.entry} slug={slug} onClose={closeModal} onSuccess={onSuccess} />}
      {modal?.type === 'delete'     && <DeleteFileDialog entry={modal.entry} slug={slug} onClose={closeModal} onSuccess={onSuccess} />}
      {modal?.type === 'bulkDelete' && <BulkDeleteDialog ids={selectedIds} slug={slug} onClose={closeModal} onSuccess={onSuccess} />}
    </Main>
  );
};

export default BuildDetailPage;

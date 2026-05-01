export const PLUGIN_ID = 'file-library' as const;

export const PERMISSIONS = {
  read: `plugin::${PLUGIN_ID}.read`,
  create: `plugin::${PLUGIN_ID}.create`,
  update: `plugin::${PLUGIN_ID}.update`,
  delete: `plugin::${PLUGIN_ID}.delete`,
} as const;

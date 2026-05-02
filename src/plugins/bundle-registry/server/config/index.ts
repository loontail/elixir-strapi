export interface PluginConfig {
  publicUrl: string;
  maxZipSize: number;
  maxZipEntries: number;
}

const config = {
  default: (): PluginConfig => ({
    publicUrl: '',
    maxZipSize: 10 * 1024 * 1024 * 1024, // 10 GB
    maxZipEntries: 100_000,
  }),
  validator() {},
};

export default config;

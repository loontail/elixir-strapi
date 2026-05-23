import type { ComponentType } from 'react';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import PluginIcon from './components/PluginIcon';
import MinecraftVersionPickerInput from './components/MinecraftVersionPickerInput';
import ForgeVersionPickerInput from './components/ForgeVersionPickerInput';
import FabricVersionPickerInput from './components/FabricVersionPickerInput';
import RuntimeVersionPickerInput from './components/RuntimeVersionPickerInput';

const name: string = pluginPkg.strapi.name;

const prefixPluginTranslations = (
  trad: Record<string, string>,
  id: string,
): Record<string, string> =>
  Object.fromEntries(Object.entries(trad).map(([key, value]) => [`${id}.${key}`, value]));

interface CustomFieldRegistration {
  name: string;
  pluginId: string;
  type: string;
  intlLabel: { id: string; defaultMessage: string };
  intlDescription: { id: string; defaultMessage: string };
  icon: ComponentType;
  components: { Input: () => Promise<{ default: ComponentType }> };
  options: { base: unknown[]; advanced: unknown[]; validator: () => void };
}

interface AppApi {
  registerPlugin: (config: { id: string; isReady: boolean; name: string }) => void;
  customFields: {
    register: (config: CustomFieldRegistration) => void;
  };
}

const customFields: ReadonlyArray<{
  name: string;
  labelKey: string;
  descriptionKey: string;
  Input: ComponentType;
}> = [
  {
    name: 'minecraft-version-picker',
    labelKey: 'minecraft-version-picker.label',
    descriptionKey: 'minecraft-version-picker.description',
    Input: MinecraftVersionPickerInput as ComponentType,
  },
  {
    name: 'forge-version-picker',
    labelKey: 'forge-version-picker.label',
    descriptionKey: 'forge-version-picker.description',
    Input: ForgeVersionPickerInput as ComponentType,
  },
  {
    name: 'fabric-version-picker',
    labelKey: 'fabric-version-picker.label',
    descriptionKey: 'fabric-version-picker.description',
    Input: FabricVersionPickerInput as ComponentType,
  },
  {
    name: 'runtime-version-picker',
    labelKey: 'runtime-version-picker.label',
    descriptionKey: 'runtime-version-picker.description',
    Input: RuntimeVersionPickerInput as ComponentType,
  },
];

export default {
  register(app: AppApi) {
    app.registerPlugin({
      id: pluginId,
      isReady: true,
      name,
    });

    for (const cf of customFields) {
      app.customFields.register({
        name: cf.name,
        pluginId,
        type: 'string',
        intlLabel: {
          id: `${pluginId}.${cf.labelKey}`,
          defaultMessage: cf.name,
        },
        intlDescription: {
          id: `${pluginId}.${cf.descriptionKey}`,
          defaultMessage: '',
        },
        icon: PluginIcon,
        components: {
          Input: async () => ({ default: cf.Input }),
        },
        options: {
          base: [],
          advanced: [],
          validator: () => {},
        },
      });
    }
  },

  bootstrap() {},

  async registerTrads({ locales }: { locales: string[] }) {
    const importedTrads = await Promise.all(
      locales.map((locale) =>
        import(`./translations/${locale}.json`)
          .then(({ default: data }: { default: Record<string, string> }) => ({
            data: prefixPluginTranslations(data, pluginId),
            locale,
          }))
          .catch(() => ({ data: {}, locale })),
      ),
    );
    return importedTrads;
  },
};

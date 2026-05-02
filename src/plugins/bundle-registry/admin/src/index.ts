import type { ComponentType } from 'react';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';
import BuildPickerInput from './components/BuildPickerInput';

const name: string = pluginPkg.strapi.name;

const prefixPluginTranslations = (trad: Record<string, string>, id: string): Record<string, string> =>
  Object.fromEntries(Object.entries(trad).map(([key, value]) => [`${id}.${key}`, value]));

export default {
  register(app: {
    addMenuLink: (config: {
      to: string;
      icon: ComponentType;
      intlLabel: { id: string; defaultMessage: string };
      Component: () => Promise<{ default: ComponentType }>;
      permissions: unknown[];
    }) => void;
    registerPlugin: (config: {
      id: string;
      initializer: ComponentType<{ setPlugin: (id: string) => void }>;
      isReady: boolean;
      name: string;
    }) => void;
    customFields: {
      register: (config: {
        name: string;
        pluginId: string;
        type: string;
        intlLabel: { id: string; defaultMessage: string };
        intlDescription: { id: string; defaultMessage: string };
        icon: ComponentType;
        components: { Input: () => Promise<{ default: ComponentType }> };
        options: { base: unknown[]; advanced: unknown[]; validator: () => void };
      }) => void;
    };
  }) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'Bundle Registry',
      },
      Component: async () => {
        const component = await import('./pages/App');
        return component;
      },
      permissions: [],
    });

    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });

    app.customFields.register({
      name: 'build-picker',
      pluginId,
      type: 'string',
      intlLabel: {
        id: `${pluginId}.build-picker.label`,
        defaultMessage: 'Bundle Registry Build',
      },
      intlDescription: {
        id: `${pluginId}.build-picker.description`,
        defaultMessage: 'Select a Bundle Registry build to link to this entry',
      },
      icon: PluginIcon,
      components: {
        Input: async () => ({ default: BuildPickerInput as ComponentType }),
      },
      options: {
        base: [],
        advanced: [],
        validator: () => {},
      },
    });
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

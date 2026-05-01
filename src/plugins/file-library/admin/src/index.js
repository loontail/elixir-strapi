import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';
import BuildPickerInput from './components/BuildPickerInput';

const name = pluginPkg.strapi.name;

export default {
  register(app) {
    // Admin panel menu entry
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'File Library',
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

    // Register custom field — allows adding "File Library Build" field
    // to any content-type via the Content-Type Builder
    app.customFields.register({
      name: 'build-picker',
      pluginId,
      type: 'string',
      intlLabel: {
        id: `${pluginId}.build-picker.label`,
        defaultMessage: 'File Library Build',
      },
      intlDescription: {
        id: `${pluginId}.build-picker.description`,
        defaultMessage: 'Select a File Library build to link to this entry',
      },
      icon: PluginIcon,
      components: {
        Input: async () => ({ default: BuildPickerInput }),
      },
      options: {
        base: [],
        advanced: [],
        validator: () => {},
      },
    });
  },

  bootstrap() {},

  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map((locale) =>
        import(`./translations/${locale}.json`)
          .then(({ default: data }) => ({
            data: prefixPluginTranslations(data, pluginId),
            locale,
          }))
          .catch(() => ({ data: {}, locale }))
      )
    );
    return importedTrads;
  },
};

import pluginPkg from '../../package.json';

const pluginId: string = pluginPkg.name.replace(/^(@[^-,.][\w,-]+\/|strapi-)plugin-/i, '');

export default pluginId;

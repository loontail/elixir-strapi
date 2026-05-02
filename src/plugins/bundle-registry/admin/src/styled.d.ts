import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: Record<string, string>;
    borderRadius: string;
    borderRadiusSm: string;
    borderRadiusMd: string;
    fontSizes: Record<string, string>;
    fontWeights: Record<string, number>;
    lineHeights: Record<string, number | string>;
    spaces: Record<string, string>;
    shadows: Record<string, string>;
    zIndices: Record<string, number>;
  }
}

import { unstable_useContentManagerContext } from '@strapi/content-manager/strapi-admin';

interface FormState {
  values?: Record<string, unknown>;
}

interface ContentManagerContext {
  form?: FormState;
}

export const useSiblingFieldValue = (fieldName: string): string => {
  let ctx: ContentManagerContext | null = null;
  try {
    ctx = unstable_useContentManagerContext() as ContentManagerContext;
  } catch {
    ctx = null;
  }

  const value = ctx?.form?.values?.[fieldName];
  return typeof value === 'string' ? value : '';
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Main,
  Button,
  Box,
  Grid,
  TextInput,
  Textarea,
} from '@strapi/design-system';
import { ArrowLeft, Check } from '@strapi/icons';
import { useNotification, Layouts } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import pluginId from '../../pluginId';
import { buildsApi } from '../../api/builds';
import { getTranslation } from '../../utils/getTranslation';

interface BuildForm {
  name: string;
  slug: string;
  description: string;
  version: string;
}

const autoSlug = (name: string): string =>
  (name || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 64);

const BuildCreatePage = () => {
  const navigate = useNavigate();
  const { toggleNotification } = useNotification();
  const { formatMessage } = useIntl();
  const [form, setForm] = useState<BuildForm>({ name: '', slug: '', description: '', version: '' });
  const [submitting, setSubmitting] = useState(false);

  const translate = (id: string) => formatMessage({ id: getTranslation(id), defaultMessage: id });

  const handleChange =
    (field: keyof BuildForm) =>
    (eventOrValue: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
      const value = typeof eventOrValue === 'string' ? eventOrValue : eventOrValue.target.value;
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        if (field === 'name' && prev.slug === autoSlug(prev.name)) {
          next.slug = autoSlug(value);
        }
        return next;
      });
    };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toggleNotification({ type: 'warning', message: translate('buildCreate.validation.required') });
      return;
    }
    setSubmitting(true);
    try {
      await buildsApi.create(form);
      navigate(`/plugins/${pluginId}/${form.slug}`);
    } catch (err) {
      toggleNotification({ type: 'warning', message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Main>
      <Layouts.Header
        title={translate('buildCreate.title')}
        subtitle={translate('buildCreate.subtitle')}
        navigationAction={
          <Button
            variant="tertiary"
            startIcon={<ArrowLeft />}
            onClick={() => navigate(`/plugins/${pluginId}`)}
          >
            {translate('buildCreate.back')}
          </Button>
        }
        primaryAction={
          <Button startIcon={<Check />} loading={submitting} onClick={handleSubmit}>
            {translate('buildCreate.submit')}
          </Button>
        }
      />
      <Layouts.Content>
        <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
          <Grid.Root gap={4}>
            <Grid.Item col={6}>
              <TextInput
                label={translate('buildCreate.field.name')}
                name="name"
                value={form.name}
                onChange={handleChange('name')}
                required
                placeholder={translate('buildCreate.field.name.placeholder')}
              />
            </Grid.Item>
            <Grid.Item col={6}>
              <TextInput
                label={translate('buildCreate.field.slug')}
                name="slug"
                value={form.slug}
                onChange={handleChange('slug')}
                required
                placeholder={translate('buildCreate.field.slug.placeholder')}
                hint={translate('buildCreate.field.slug.hint')}
              />
            </Grid.Item>
            <Grid.Item col={6}>
              <TextInput
                label={translate('buildCreate.field.version')}
                name="version"
                value={form.version}
                onChange={handleChange('version')}
                placeholder={translate('buildCreate.field.version.placeholder')}
              />
            </Grid.Item>
            <Grid.Item col={12}>
              <Textarea
                label={translate('buildCreate.field.description')}
                name="description"
                value={form.description}
                onChange={handleChange('description')}
                placeholder={translate('buildCreate.field.description.placeholder')}
              />
            </Grid.Item>
          </Grid.Root>
        </Box>
      </Layouts.Content>
    </Main>
  );
};

export default BuildCreatePage;

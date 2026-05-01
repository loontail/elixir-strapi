import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  ContentLayout,
  HeaderLayout,
  Main,
  Button,
  Box,
  Grid,
  GridItem,
  TextInput,
  Textarea,
} from '@strapi/design-system';
import { ArrowLeft, Check } from '@strapi/icons';
import { useNotification } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';
import { buildsApi } from '../../api/builds';

const BuildCreatePage = () => {
  const history = useHistory();
  const toggleNotification = useNotification();
  const [form, setForm] = useState({ name: '', slug: '', description: '', version: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    const value = e.target ? e.target.value : e;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from name if slug is untouched
      if (field === 'name' && prev.slug === autoSlug(prev.name)) {
        next.slug = autoSlug(value);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toggleNotification({ type: 'warning', message: 'Name and slug are required' });
      return;
    }
    setSubmitting(true);
    try {
      await buildsApi.create(form);
      history.push(`/plugins/${pluginId}/${form.slug}`);
    } catch (err) {
      toggleNotification({ type: 'warning', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Main>
      <HeaderLayout
        title="New Build"
        subtitle="Create a new file library build"
        navigationAction={
          <Button
            variant="tertiary"
            startIcon={<ArrowLeft />}
            onClick={() => history.push(`/plugins/${pluginId}`)}
          >
            Back
          </Button>
        }
        primaryAction={
          <Button
            startIcon={<Check />}
            loading={submitting}
            onClick={handleSubmit}
          >
            Create Build
          </Button>
        }
      />
      <ContentLayout>
        <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
          <Grid gap={4}>
            <GridItem col={6}>
              <TextInput
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange('name')}
                required
                placeholder="My Minecraft Pack"
              />
            </GridItem>
            <GridItem col={6}>
              <TextInput
                label="Slug"
                name="slug"
                value={form.slug}
                onChange={handleChange('slug')}
                required
                placeholder="my-minecraft-pack"
                hint="Used in URLs. Lowercase letters, numbers and hyphens only."
              />
            </GridItem>
            <GridItem col={6}>
              <TextInput
                label="Version"
                name="version"
                value={form.version}
                onChange={handleChange('version')}
                placeholder="1.0.0"
              />
            </GridItem>
            <GridItem col={12}>
              <Textarea
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange('description')}
                placeholder="Optional description"
              />
            </GridItem>
          </Grid>
        </Box>
      </ContentLayout>
    </Main>
  );
};

function autoSlug(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 64);
}

export default BuildCreatePage;

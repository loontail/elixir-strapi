import { useEffect, useState } from 'react';
import {
  Select,
  Option,
  Field,
  FieldLabel,
  FieldError,
  FieldHint,
  Loader,
} from '@strapi/design-system';
import { request } from '@strapi/helper-plugin';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import type { Build } from '../../../../shared/types/entities';

interface BuildPickerInputProps {
  attribute: { type: string };
  description?: { defaultMessage?: string } | null;
  disabled?: boolean;
  error?: string | null;
  intlLabel: { defaultMessage?: string };
  labelAction?: React.ReactElement | null;
  name: string;
  onChange: (event: { target: { name: string; value: string; type: string } }) => void;
  required?: boolean;
  value?: string;
}

const BuildPickerInput = ({
  attribute,
  description,
  disabled,
  error,
  intlLabel,
  labelAction,
  name,
  onChange,
  required,
  value,
}: BuildPickerInputProps) => {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatMessage } = useIntl();

  const translate = (id: string) =>
    formatMessage({ id: getTranslation(id), defaultMessage: id });

  useEffect(() => {
    (request('/bundle-registry/builds', { method: 'GET' }) as Promise<Build[]>)
      .then((data) => setBuilds(Array.isArray(data) ? data : []))
      .catch(() => setBuilds([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (selected: string) => {
    onChange({ target: { name, value: selected || '', type: attribute.type } });
  };

  return (
    <Field name={name} id={name} error={error} hint={description?.defaultMessage}>
      <FieldLabel action={labelAction} required={required}>
        {intlLabel?.defaultMessage || translate('build-picker.label')}
      </FieldLabel>
      {loading ? (
        <Loader small />
      ) : (
        <Select
          id={name}
          name={name}
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          placeholder={translate('build-picker.placeholder')}
          clearLabel={translate('build-picker.clear')}
          onClear={() => handleChange('')}
        >
          {builds.map((build) => (
            <Option key={build.slug} value={build.slug}>
              {build.name} ({build.slug}) — {build.status}
            </Option>
          ))}
        </Select>
      )}
      <FieldError />
      <FieldHint />
    </Field>
  );
};

export default BuildPickerInput;

import { useEffect, useState } from 'react';
import {
  SingleSelect,
  SingleSelectOption,
  Field,
  Loader,
} from '@strapi/design-system';
import { buildsApi } from '../../api/builds';
import { useTranslate } from '../../hooks/useTranslate';
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
  const translate = useTranslate();

  useEffect(() => {
    buildsApi
      .findMany()
      .then((data) => setBuilds(Array.isArray(data) ? data : []))
      .catch(() => setBuilds([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (selected: string | number) => {
    onChange({ target: { name, value: String(selected || ''), type: attribute.type } });
  };

  return (
    <Field.Root name={name} id={name} error={error ?? undefined} hint={description?.defaultMessage} required={required}>
      <Field.Label action={labelAction}>
        {intlLabel?.defaultMessage || translate('build-picker.label')}
      </Field.Label>
      {loading ? (
        <Loader small />
      ) : (
        <SingleSelect
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
            <SingleSelectOption key={build.slug} value={build.slug}>
              {build.name} ({build.slug}) — {build.status}
            </SingleSelectOption>
          ))}
        </SingleSelect>
      )}
      <Field.Error />
      <Field.Hint />
    </Field.Root>
  );
};

export default BuildPickerInput;

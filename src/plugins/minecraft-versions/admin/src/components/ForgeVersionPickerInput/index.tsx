import { useEffect, useState } from 'react';
import { SingleSelect, SingleSelectOption, Field, Loader } from '@strapi/design-system';
import { useVersionsApi } from '../../api/versions';
import { useTranslate } from '../../hooks/useTranslate';
import { useSiblingFieldValue } from '../../hooks/useSiblingFieldValue';

const MINECRAFT_FIELD_NAME = 'minecraftVersion';

interface PickerInputProps {
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

const ForgeVersionPickerInput = ({
  description,
  disabled,
  error,
  intlLabel,
  labelAction,
  name,
  onChange,
  required,
  value,
}: PickerInputProps) => {
  const [versions, setVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const translate = useTranslate();
  const api = useVersionsApi();
  const minecraftVersion = useSiblingFieldValue(MINECRAFT_FIELD_NAME);

  useEffect(() => {
    if (!minecraftVersion) {
      setVersions([]);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .fetchForge(minecraftVersion)
      .then((data) => {
        if (cancelled) return;
        setVersions(data);
        setLoadError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setVersions([]);
        setLoadError(translate('forge-version-picker.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, minecraftVersion, translate]);

  const handleChange = (selected: string | number) => {
    onChange({ target: { name, value: selected ? String(selected) : '', type: 'string' } });
  };

  const noMc = !minecraftVersion;
  const placeholder = noMc
    ? translate('forge-version-picker.placeholder.requireMc')
    : translate('forge-version-picker.placeholder');

  return (
    <Field.Root
      name={name}
      id={name}
      error={error ?? loadError ?? undefined}
      hint={description?.defaultMessage}
      required={required}
    >
      <Field.Label action={labelAction}>
        {intlLabel?.defaultMessage || translate('forge-version-picker.label')}
      </Field.Label>
      {loading ? (
        <Loader small />
      ) : (
        <SingleSelect
          id={name}
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          disabled={disabled || noMc}
          placeholder={placeholder}
          clearLabel={translate('forge-version-picker.clear')}
          onClear={() => handleChange('')}
        >
          {versions.map((v) => (
            <SingleSelectOption key={v} value={v}>
              {v}
            </SingleSelectOption>
          ))}
        </SingleSelect>
      )}
      <Field.Error />
      <Field.Hint />
    </Field.Root>
  );
};

export default ForgeVersionPickerInput;

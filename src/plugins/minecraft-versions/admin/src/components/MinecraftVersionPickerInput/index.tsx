import { useEffect, useState } from 'react';
import { SingleSelect, SingleSelectOption, Field, Loader } from '@strapi/design-system';
import { useVersionsApi, type MinecraftVersionEntry } from '../../api/versions';
import { useTranslate } from '../../hooks/useTranslate';

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

const MinecraftVersionPickerInput = ({
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
  const [versions, setVersions] = useState<MinecraftVersionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const translate = useTranslate();
  const api = useVersionsApi();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .fetchMinecraft('release')
      .then((data) => {
        if (cancelled) return;
        setVersions(data);
        setLoadError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setVersions([]);
        setLoadError(translate('minecraft-version-picker.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, translate]);

  const handleChange = (selected: string | number) => {
    onChange({ target: { name, value: selected ? String(selected) : '', type: 'string' } });
  };

  const selected = value ?? '';

  return (
    <Field.Root
      name={name}
      id={name}
      error={error ?? loadError ?? undefined}
      hint={description?.defaultMessage}
      required={required}
    >
      <Field.Label action={labelAction}>
        {intlLabel?.defaultMessage || translate('minecraft-version-picker.label')}
      </Field.Label>
      {loading ? (
        <Loader small />
      ) : (
        <SingleSelect
          id={name}
          name={name}
          value={selected}
          onChange={handleChange}
          disabled={disabled}
          placeholder={translate('minecraft-version-picker.placeholder')}
          clearLabel={translate('minecraft-version-picker.clear')}
          onClear={() => handleChange('')}
        >
          {versions.map((v) => (
            <SingleSelectOption key={v.id} value={v.id}>
              {v.id}
            </SingleSelectOption>
          ))}
        </SingleSelect>
      )}
      <Field.Error />
      <Field.Hint />
    </Field.Root>
  );
};

export default MinecraftVersionPickerInput;

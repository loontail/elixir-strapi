import { useEffect, useState } from 'react';
import { SingleSelect, SingleSelectOption, Field, Loader } from '@strapi/design-system';
import { useVersionsApi, type FabricVersionsResponse } from '../../api/versions';
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

const FabricVersionPickerInput = ({
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
  const [data, setData] = useState<FabricVersionsResponse>({ loaderVersions: [], gameVersions: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const translate = useTranslate();
  const api = useVersionsApi();
  const minecraftVersion = useSiblingFieldValue(MINECRAFT_FIELD_NAME);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .fetchFabric()
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoadError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setData({ loaderVersions: [], gameVersions: [] });
        setLoadError(translate('fabric-version-picker.loadError'));
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

  const noMc = !minecraftVersion;
  const mcSupported = !noMc && data.gameVersions.includes(minecraftVersion);
  const showSelect = !noMc && mcSupported;

  let placeholder = translate('fabric-version-picker.placeholder');
  if (noMc) placeholder = translate('fabric-version-picker.placeholder.requireMc');
  else if (!mcSupported) placeholder = translate('fabric-version-picker.unsupported');

  return (
    <Field.Root
      name={name}
      id={name}
      error={error ?? loadError ?? undefined}
      hint={description?.defaultMessage}
      required={required}
    >
      <Field.Label action={labelAction}>
        {intlLabel?.defaultMessage || translate('fabric-version-picker.label')}
      </Field.Label>
      {loading ? (
        <Loader small />
      ) : (
        <SingleSelect
          id={name}
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          disabled={disabled || !showSelect}
          placeholder={placeholder}
          clearLabel={translate('fabric-version-picker.clear')}
          onClear={() => handleChange('')}
        >
          {showSelect
            ? data.loaderVersions.map((v) => (
                <SingleSelectOption key={v.version} value={v.version}>
                  {v.version} (
                  {v.stable
                    ? translate('fabric-version-picker.stableSuffix')
                    : translate('fabric-version-picker.unstableSuffix')}
                  )
                </SingleSelectOption>
              ))
            : null}
        </SingleSelect>
      )}
      <Field.Error />
      <Field.Hint />
    </Field.Root>
  );
};

export default FabricVersionPickerInput;

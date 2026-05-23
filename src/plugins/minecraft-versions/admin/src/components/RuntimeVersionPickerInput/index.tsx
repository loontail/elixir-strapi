import { useEffect, useMemo, useState } from 'react';
import { SingleSelect, SingleSelectOption, Field, Loader } from '@strapi/design-system';
import {
  type RuntimeEntry,
  type RuntimeRecommendation,
  useVersionsApi,
} from '../../api/versions';
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

const EMPTY_RECOMMENDATION: RuntimeRecommendation = { component: null, majorVersion: null };

const RuntimeVersionPickerInput = ({
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
  const [runtimes, setRuntimes] = useState<RuntimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recommendation, setRecommendation] =
    useState<RuntimeRecommendation>(EMPTY_RECOMMENDATION);
  const translate = useTranslate();
  const api = useVersionsApi();
  const minecraftVersion = useSiblingFieldValue(MINECRAFT_FIELD_NAME);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .fetchRuntime()
      .then((data) => {
        if (cancelled) return;
        setRuntimes(data);
        setLoadError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setRuntimes([]);
        setLoadError(translate('runtime-version-picker.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, translate]);

  useEffect(() => {
    if (!minecraftVersion) {
      setRecommendation(EMPTY_RECOMMENDATION);
      return;
    }
    let cancelled = false;
    api
      .recommendRuntime(minecraftVersion)
      .then((rec) => {
        if (!cancelled) setRecommendation(rec);
      })
      .catch(() => {
        if (!cancelled) setRecommendation(EMPTY_RECOMMENDATION);
      });
    return () => {
      cancelled = true;
    };
  }, [api, minecraftVersion]);

  const handleChange = (selected: string | number) => {
    onChange({ target: { name, value: selected ? String(selected) : '', type: 'string' } });
  };

  const unsupportedSuffix = translate('runtime-version-picker.unsupported');
  const recommendedSuffix = translate('runtime-version-picker.recommendedSuffix');

  // Sort so the recommended option floats to the top, otherwise stable order.
  const orderedRuntimes = useMemo(() => {
    const recComponent = recommendation.component;
    if (!recComponent) return runtimes;
    const recIndex = runtimes.findIndex((r) => r.component === recComponent);
    if (recIndex <= 0) return runtimes;
    const next = [...runtimes];
    const [picked] = next.splice(recIndex, 1);
    if (picked) next.unshift(picked);
    return next;
  }, [runtimes, recommendation.component]);

  const hintText = useMemo(() => {
    if (!recommendation.component) return description?.defaultMessage;
    const javaMajor = recommendation.majorVersion;
    const javaLabel = javaMajor ? `Java ${javaMajor}` : recommendation.component;
    return translate('runtime-version-picker.recommendedHint')
      .replace('{component}', recommendation.component)
      .replace('{java}', javaLabel)
      .replace('{minecraft}', minecraftVersion || '');
  }, [
    description?.defaultMessage,
    minecraftVersion,
    recommendation.component,
    recommendation.majorVersion,
    translate,
  ]);

  return (
    <Field.Root
      name={name}
      id={name}
      error={error ?? loadError ?? undefined}
      hint={hintText}
      required={required}
    >
      <Field.Label action={labelAction}>
        {intlLabel?.defaultMessage || translate('runtime-version-picker.label')}
      </Field.Label>
      {loading ? (
        <Loader small />
      ) : (
        <SingleSelect
          id={name}
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          disabled={disabled}
          placeholder={translate('runtime-version-picker.placeholder')}
          clearLabel={translate('runtime-version-picker.clear')}
          onClear={() => handleChange('')}
        >
          {orderedRuntimes.map((r) => {
            const isRecommended = r.component === recommendation.component;
            const baseLabel = r.version
              ? `${r.component} (${r.version})`
              : `${r.component} ${unsupportedSuffix}`;
            const label = isRecommended ? `${baseLabel} — ${recommendedSuffix}` : baseLabel;
            return (
              <SingleSelectOption key={r.component} value={r.component}>
                {label}
              </SingleSelectOption>
            );
          })}
        </SingleSelect>
      )}
      <Field.Error />
      <Field.Hint />
    </Field.Root>
  );
};

export default RuntimeVersionPickerInput;

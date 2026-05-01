import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '@strapi/helper-plugin';
import { buildsApi } from '../../../api/builds';
import type { Build } from '../../../../../shared/types/entities';
import type { ValidateResult } from '../../../../../shared/types/api';

interface UseBuildDetailResult {
  build: Build | null;
  loading: boolean;
  uploading: boolean;
  regenerating: boolean;
  validating: boolean;
  validation: ValidateResult | null;
  load: () => void;
  setUploading: (v: boolean) => void;
  setRegenerating: (v: boolean) => void;
  setValidating: (v: boolean) => void;
  setValidation: (v: ValidateResult | null) => void;
}

const useBuildDetail = (slug: string): UseBuildDetailResult => {
  const [build, setBuild] = useState<Build | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidateResult | null>(null);
  const toggleNotification = useNotification();

  const load = useCallback(() => {
    setLoading(true);
    buildsApi
      .findOne(slug)
      .then((data) => setBuild(data))
      .catch((err: Error) => toggleNotification({ type: 'warning', message: err.message }))
      .finally(() => setLoading(false));
  }, [slug, toggleNotification]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    build,
    loading,
    uploading,
    regenerating,
    validating,
    validation,
    load,
    setUploading,
    setRegenerating,
    setValidating,
    setValidation,
  };
};

export { useBuildDetail };

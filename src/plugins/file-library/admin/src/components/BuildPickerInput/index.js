import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Select, Option, Field, FieldLabel, FieldError, FieldHint, Loader } from '@strapi/design-system';
import { request } from '@strapi/helper-plugin';

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
}) => {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request('/file-library/builds', { method: 'GET' })
      .then((data) => setBuilds(Array.isArray(data) ? data : []))
      .catch(() => setBuilds([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (selected) => {
    onChange({ target: { name, value: selected || '', type: attribute.type } });
  };

  return (
    <Field name={name} id={name} error={error} hint={description?.defaultMessage}>
      <FieldLabel action={labelAction} required={required}>
        {intlLabel?.defaultMessage || 'File Library Build'}
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
          placeholder="Select a build..."
          clearLabel="Clear"
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

BuildPickerInput.defaultProps = {
  description: null,
  disabled: false,
  error: null,
  labelAction: null,
  required: false,
  value: '',
};

BuildPickerInput.propTypes = {
  attribute: PropTypes.shape({ type: PropTypes.string }).isRequired,
  description: PropTypes.shape({ defaultMessage: PropTypes.string }),
  disabled: PropTypes.bool,
  error: PropTypes.string,
  intlLabel: PropTypes.shape({ defaultMessage: PropTypes.string }).isRequired,
  labelAction: PropTypes.element,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  value: PropTypes.string,
};

export default BuildPickerInput;

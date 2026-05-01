import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@strapi/design-system';

const STATUS = {
  draft:      { bg: 'neutral150', text: 'neutral600' },
  processing: { bg: 'warning200', text: 'warning700' },
  ready:      { bg: 'success200', text: 'success700' },
  failed:     { bg: 'danger200', text: 'danger600'  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS[status] || { bg: 'neutral150', text: 'neutral600' };
  return (
    <Box
      background={cfg.bg}
      hasRadius
      style={{ display: 'inline-flex', padding: '3px 10px' }}
    >
      <Typography variant="pi" fontWeight="bold" textColor={cfg.text}>
        {(status || 'unknown').toUpperCase()}
      </Typography>
    </Box>
  );
};

StatusBadge.propTypes = { status: PropTypes.string };

export default StatusBadge;

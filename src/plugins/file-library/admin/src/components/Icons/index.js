import React from 'react';

const iconStyle = { flexShrink: 0 };

export const PencilIcon = ({ size = 14, color = '#666687' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
    <path style={{ fill: color }} d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

export const UploadIcon = ({ size = 14, color = '#666687' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
    <path style={{ fill: color }} d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
  </svg>
);

export const HashIcon = ({ size = 14, color = '#666687' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
    <path style={{ fill: color }} d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C13 5.06 12.51 5 12 5s-1 .06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-4 4v3c0 2.21-1.79 4-4 4s-4-1.79-4-4v-3c0-2.21 1.79-4 4-4s4 1.79 4 4z" />
  </svg>
);

export const TrashIcon = ({ size = 14, color = '#D02B20' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
    <path style={{ fill: color }} d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);

export const FolderIcon = ({ size = 16, color = '#c4754a' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={iconStyle}>
    <path style={{ fill: color }} d="M3 7a2 2 0 012-2h4.586a1 1 0 01.707.293L11.414 6.5A1 1 0 0012.121 6.793H19a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);

export const FileIcon = ({ size = 14, color = '#4945ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={iconStyle}>
    <path style={{ fill: color, opacity: 0.8 }} d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z" />
    <path style={{ fill: 'none', stroke: color, strokeWidth: 2, opacity: 0.5 }} d="M13 2v7h7" />
  </svg>
);

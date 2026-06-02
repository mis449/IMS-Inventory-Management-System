import React from 'react';

const getStatusColor = (status) => {
  const colors = {
    'Active': 'bg-sky-100 text-sky-700',
    'Accepted': 'bg-emerald-100 text-emerald-700',
    'Rejected': 'bg-rose-100 text-rose-700',
    // Fallbacks just in case
    'Draft': 'bg-slate-100 text-slate-700',
    'Pending': 'bg-amber-100 text-amber-700',
    'Approved': 'bg-emerald-100 text-emerald-700',
    'Converted to Sales Order': 'bg-blue-100 text-blue-700'
  };
  return colors[status] || 'bg-slate-100 text-slate-700';
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${getStatusColor(status)}`}>
      {status || 'Draft'}
    </span>
  );
}

// Named export for use in table lists as well
export { getStatusColor };

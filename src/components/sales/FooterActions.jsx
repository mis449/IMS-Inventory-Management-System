import React from 'react';

export default function FooterActions() {
  return (
    <div className="flex gap-4 items-center pt-6 pb-2 text-xs font-bold text-slate-700">
      <button type="button" className="hover:text-sky-600 transition-colors">
        Send Message
      </button>
      <button type="button" className="hover:text-sky-600 transition-colors">
        Log Note
      </button>
      <button type="button" className="hover:text-sky-600 transition-colors">
        Activities
      </button>
    </div>
  );
}

import React from 'react';
import { X } from 'lucide-react';

/**
 * ModalView Component - Premium Redesigned Edition
 */
const ModalView = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  zIndex = 'z-[100]'
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 lg:left-56 2xl:left-60 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center ${zIndex} p-4 animate-in fade-in duration-200 overflow-hidden`}>
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Clean with Close Button */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0 z-20">
          <h2 className="text-sm md:text-base font-bold text-slate-800 uppercase tracking-wider">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 text-slate-450 hover:text-slate-700 rounded-lg transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
          {children}
        </div>

        {/* Footer Action */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all font-bold uppercase tracking-wider"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalView;
import React from 'react';
import { XCircle, Save, Check } from 'lucide-react';

/**
 * TabSwitcher Component - Standardized Tabs for Pending/History
 */
export const TabSwitcher = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="flex flex-wrap md:flex-nowrap gap-2 md:gap-1 p-1 bg-slate-100/80 rounded-xl w-full lg:w-max mb-4 border border-slate-200/50 shadow-inner">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-none py-2 px-4 transition-all duration-300 text-xs md:text-sm rounded-lg whitespace-nowrap capitalize flex items-center justify-center gap-2 font-semibold ${
            activeTab === tab.id 
              ? 'bg-white text-sky-600 shadow-sm scale-[1.01] transform' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          {tab.icon && <tab.icon size={15} className={activeTab === tab.id ? 'text-sky-600' : 'text-slate-450'} />}
          <span>{tab.label}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-sky-50 text-sky-700' : 'bg-slate-200 text-slate-600'}`}>
            {tab.count || 0}
          </span>
        </button>
      ))}
    </div>
  );
};

/**
 * FormActionButtons Component - Standardized Save/Cancel Buttons
 */
export const FormActionButtons = ({ 
  onCancel, 
  onSubmit, 
  cancelText = 'Cancel', 
  submitText = 'Save Changes',
  loading = false,
  className = "",
  formId = null,
  extraButton = null,
  hideSubmit = false
}) => {
  return (
    <div className={`flex gap-3 items-center ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-4 py-2.5 border border-slate-250 rounded-xl text-slate-550 font-bold hover:bg-slate-50 hover:text-slate-800 transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
      >
        <XCircle size={16} className="block md:hidden text-slate-500" />
        <span className="hidden md:block">{cancelText}</span>
      </button>

      {extraButton && (
        <div className="flex-1 flex w-full justify-center">
          {extraButton}
        </div>
      )}

      {!hideSubmit && (
        <button
          type={onSubmit ? "button" : "submit"}
          form={formId}
          onClick={onSubmit}
          disabled={loading}
          className="flex-[1.5] bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-sky-100 text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="hidden md:block">Processing...</span>
            </>
          ) : (
            <>
              <Save size={16} className="block md:hidden" />
              <span className="hidden md:block">{submitText}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

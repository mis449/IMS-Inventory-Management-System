import React from 'react';

export default function SalesTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex gap-2 border-b border-slate-200">
      <button 
        type="button" 
        onClick={() => setActiveTab('ItemLines')} 
        className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'ItemLines' ? 'text-sky-600 border-sky-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
      >
        Item Lines
      </button>
      <button 
        type="button" 
        onClick={() => setActiveTab('OtherInfo')} 
        className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'OtherInfo' ? 'text-sky-600 border-sky-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
      >
        Other Information
      </button>
      <button 
        type="button" 
        onClick={() => setActiveTab('Notes')} 
        className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'Notes' ? 'text-sky-600 border-sky-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
      >
        Notes
      </button>
    </div>
  );
}

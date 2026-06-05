import React from 'react';

export default function OtherInformationTab({ otherInfo, setOtherInfo, quotationStatus, setQuotationStatus, supplyStatus, setSupplyStatus }) {
  const handleChange = (field, value) => {
    if (setOtherInfo) {
      setOtherInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const info = otherInfo || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-2 py-4">
      
      {/* Ship to */}
      <div className="space-y-1.5">
        <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">
          Ship to
        </label>
        <input 
          type="text" 
          value={info.shipTo || ''} 
          onChange={(e) => handleChange('shipTo', e.target.value)} 
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none shadow-sm transition-all" 
        />
      </div>

      {/* Project */}
      <div className="space-y-1.5">
        <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">
          Project
        </label>
        <input 
          type="text" 
          value={info.project || ''} 
          onChange={(e) => handleChange('project', e.target.value)} 
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none shadow-sm transition-all" 
        />
      </div>

      {/* Cust.Ref.Number */}
      <div className="space-y-1.5">
        <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">
          Cust.Ref.Number
        </label>
        <input 
          type="text" 
          value={info.customerReference || ''} 
          onChange={(e) => handleChange('customerReference', e.target.value)} 
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none shadow-sm transition-all" 
        />
      </div>

      {/* Sales Person */}
      <div className="space-y-1.5">
        <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">
          Sales Person
        </label>
        <input 
          type="text" 
          value={info.salesPerson || ''} 
          onChange={(e) => handleChange('salesPerson', e.target.value)} 
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none shadow-sm transition-all" 
        />
      </div>

      {/* Ref.Source Type */}
      <div className="space-y-1.5">
        <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">
          Ref.Source Type
        </label>
        <input 
          type="text" 
          value={info.refSourceType || ''} 
          onChange={(e) => handleChange('refSourceType', e.target.value)} 
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none shadow-sm transition-all" 
        />
      </div>

      {/* Main Agent */}
      <div className="space-y-1.5">
        <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">
          Main Agent
        </label>
        <input 
          type="text" 
          value={info.mainAgent || ''} 
          onChange={(e) => handleChange('mainAgent', e.target.value)} 
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none shadow-sm transition-all" 
        />
      </div>

      {/* Architect Name */}
      <div className="space-y-1.5">
        <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">
          Architect Name
        </label>
        <input 
          type="text" 
          value={info.architectName || ''} 
          onChange={(e) => handleChange('architectName', e.target.value)} 
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none shadow-sm transition-all" 
        />
      </div>

      {/* Sales Number */}
      <div className="space-y-1.5">
        <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">
          Sales Number
        </label>
        <input 
          type="text" 
          value={info.salesNumber || ''} 
          onChange={(e) => handleChange('salesNumber', e.target.value)} 
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none shadow-sm transition-all" 
        />
      </div>

    </div>
  );
}

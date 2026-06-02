import React, { useState } from 'react';
import { X, Calendar, Search, FileInput } from 'lucide-react';

export default function MaterialReceivedModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    vendor: '',
    address: '',
    materialReceivedDate: '',
    vendorBillNumber: '',
    vendorBillDate: ''
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 px-6 py-4 border-b border-teal-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-teal-100/50 text-teal-600">
              <FileInput size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">Material Received</h2>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Process incoming vendor materials</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Vendor</label>
                <div className="relative">
                  <Search className="absolute left-3 top-[10px] text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Select Vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] transition-all shadow-sm outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Address</label>
                <textarea 
                  rows="2"
                  placeholder="Vendor Address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm transition-all shadow-sm outline-none resize-none"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Material Received Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-[10px] text-slate-400" size={14} />
                  <input 
                    type="date" 
                    value={formData.materialReceivedDate}
                    onChange={(e) => setFormData({...formData, materialReceivedDate: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] transition-all shadow-sm outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Vendor Bill Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. INV-2026-001"
                  value={formData.vendorBillNumber}
                  onChange={(e) => setFormData({...formData, vendorBillNumber: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] transition-all shadow-sm outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Vendor Bill Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-[10px] text-slate-400" size={14} />
                  <input 
                    type="date" 
                    value={formData.vendorBillDate}
                    onChange={(e) => setFormData({...formData, vendorBillDate: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] transition-all shadow-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white flex justify-between items-center border-t border-slate-100">
          <button 
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md shadow-teal-100 transition-all flex items-center gap-2 active:scale-95"
          >
            Get Pending Order
          </button>
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-rose-50 border border-rose-100 rounded-xl text-sm font-bold text-rose-600 flex items-center gap-2 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            <X size={16} /> Discard
          </button>
        </div>
      </div>
    </div>
  );
}

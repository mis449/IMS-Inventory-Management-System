import React, { useEffect } from 'react';
import { Calendar, Users } from 'lucide-react';
import useDataStore from '../../store/dataStore';
import SearchableDropdown from '../SearchableDropdown';

export default function CustomerDetailsSection({ 
  basicInfo, 
  setBasicInfo, 
  onOpenCustomerModal,
  onCustomerSelect
}) {
  const { customers, fetchCustomers } = useDataStore();

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  return (
    <div className="bg-sky-50/40 p-5 rounded-2xl border border-sky-100">
      <div className="flex justify-between items-center mb-4 border-b border-sky-100 pb-2">
        <h3 className="text-sm font-bold text-sky-800 uppercase tracking-wider">Basic Information</h3>
        <div className="flex gap-2">
          <button type="button" onClick={onOpenCustomerModal} className="text-xs font-bold bg-white text-sky-600 border border-sky-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-sky-50 transition">
            <Users size={14} /> New Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Customer / Vendor *</label>
          <SearchableDropdown
            options={(customers || []).map(c => ({ value: c.name, label: c.name }))}
            value={basicInfo.customer || ''}
            onChange={(val) => {
              setBasicInfo({...basicInfo, customer: val});
              
              const matchedCustomer = customers.find(c => c.name === val);
              if (matchedCustomer && onCustomerSelect) {
                onCustomerSelect(matchedCustomer);
              }
            }}
            onAdd={onOpenCustomerModal}
            placeholder="-- Select Customer --"
            className="w-full"
            height="h-[38px]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Address</label>
          <input type="text" value={basicInfo.address} onChange={(e) => setBasicInfo({...basicInfo, address: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] bg-white outline-none" placeholder="Billing Address" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Validity/Due Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-[12px] text-slate-400" size={14} />
            <input type="date" value={basicInfo.validityDate} onChange={(e) => setBasicInfo({...basicInfo, validityDate: e.target.value})} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] bg-white outline-none" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Price List</label>
          <select value={basicInfo.priceList} onChange={(e) => setBasicInfo({...basicInfo, priceList: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] bg-white outline-none">
            <option value="Standard">Standard</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Retail">Retail</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Payment Terms</label>
          <select value={basicInfo.paymentTerms} onChange={(e) => setBasicInfo({...basicInfo, paymentTerms: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] bg-white outline-none">
            <option value="">-- Select --</option>
            <option value="100% AGAINST DELIVERY">100% AGAINST DELIVERY</option>
            <option value="Against 50% Advance and rest on Delivery">Against 50% Advance and rest on Delivery</option>
            <option value="Against L/C">Against L/C</option>
            <option value="AS ABOVE">AS ABOVE</option>
            <option value="AS USUAL">AS USUAL</option>
            <option value="Collection Thru Bank">Collection Thru Bank</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Area / PIN Code<span className="text-red-500">*</span></label>
          <input type="text" value={basicInfo.areaPinCode || ''} onChange={(e) => setBasicInfo({...basicInfo, areaPinCode: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] bg-white outline-none" placeholder="Area / PIN Code" required />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">City / State</label>
          <input type="text" value={basicInfo.cityState || ''} onChange={(e) => setBasicInfo({...basicInfo, cityState: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] bg-white outline-none" placeholder="City / State" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Email</label>
          <input type="email" value={basicInfo.email || ''} onChange={(e) => setBasicInfo({...basicInfo, email: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] bg-white outline-none" placeholder="Email Address" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Mobile<span className="text-red-500">*</span></label>
          <input type="text" value={basicInfo.mobile || ''} onChange={(e) => setBasicInfo({...basicInfo, mobile: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] bg-white outline-none" placeholder="Mobile Number" required />
        </div>
      </div>
    </div>
  );
}

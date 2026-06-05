import React from 'react';
import { Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import useDataStore from '../../store/dataStore';
import SearchableDropdown from '../SearchableDropdown';

export default function VendorDetailsSection({ 
  basicInfo, 
  setBasicInfo, 
  onOpenVendorModal,
  onVendorSelect 
}) {
  const { vendors, fetchVendors } = useDataStore();

  React.useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return (
    <div className="bg-teal-50/40 p-5 rounded-2xl border border-teal-100">
      <div className="flex justify-between items-center mb-4 border-b border-teal-100 pb-2">
        <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider">Vendor Information</h3>
        <div className="flex gap-2">
          <button type="button" onClick={onOpenVendorModal} className="text-xs font-bold bg-white text-teal-600 border border-teal-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-teal-50 transition">
            <Users size={14} /> New Vendor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Customer/Vendor *</label>
          <SearchableDropdown
            options={(vendors || []).map(v => ({ value: v.name, label: v.name }))}
            value={basicInfo.vendor || ''}
            onChange={(val) => {
              setBasicInfo({...basicInfo, vendor: val});
              
              const matchedVendor = vendors.find(v => v.name === val);
              if (matchedVendor) {
                setBasicInfo({
                  ...basicInfo,
                  vendor: val,
                  address: matchedVendor.address || basicInfo.address,
                  areaPinCode: matchedVendor.areaPinCode || basicInfo.areaPinCode,
                  cityState: matchedVendor.cityState || basicInfo.cityState,
                  state: matchedVendor.state || matchedVendor.cityState || basicInfo.state,
                  email: matchedVendor.email || basicInfo.email,
                  mobile: matchedVendor.mobile || basicInfo.mobile,
                  priceList: matchedVendor.priceList || basicInfo.priceList
                });
                if (onVendorSelect) {
                  onVendorSelect(matchedVendor);
                }
              }
            }}
            onAdd={onOpenVendorModal}
            placeholder="-- Select Vendor --"
            className="w-full"
            height="h-[38px]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Address</label>
          <input type="text" value={basicInfo.address} onChange={(e) => setBasicInfo({...basicInfo, address: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none" placeholder="Billing Address" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Area / PIN Code<span className="text-rose-500">*</span></label>
          <input type="text" value={basicInfo.areaPinCode || ''} onChange={(e) => setBasicInfo({...basicInfo, areaPinCode: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none" required />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">State</label>
          <input type="text" value={basicInfo.state || ''} onChange={(e) => setBasicInfo({...basicInfo, state: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none" placeholder="State" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Email</label>
          <input type="email" value={basicInfo.email || ''} onChange={(e) => setBasicInfo({...basicInfo, email: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Mobile<span className="text-rose-500">*</span></label>
          <input type="tel" value={basicInfo.mobile || ''} onChange={(e) => setBasicInfo({...basicInfo, mobile: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none" required />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Validity/Due Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-[12px] text-slate-400" size={14} />
            <input type="date" value={basicInfo.validityDate} onChange={(e) => setBasicInfo({...basicInfo, validityDate: e.target.value})} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Price List</label>
          <select value={basicInfo.priceList} onChange={(e) => setBasicInfo({...basicInfo, priceList: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none">
            <option value="Standard">Standard</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Retail">Retail</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Payment Terms</label>
          <select value={basicInfo.paymentTerms} onChange={(e) => setBasicInfo({...basicInfo, paymentTerms: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm h-[38px] bg-white outline-none">
            <option value="">-- Select --</option>
            <option value="100% AGAINST DELIVERY">100% AGAINST DELIVERY</option>
            <option value="Against 50% Advance and rest on Delivery">Against 50% Advance and rest on Delivery</option>
            <option value="Against L/C">Against L/C</option>
            <option value="AS ABOVE">AS ABOVE</option>
            <option value="AS USUAL">AS USUAL</option>
            <option value="Collection Thru Bank">Collection Thru Bank</option>
          </select>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import useDataStore from '../../store/dataStore';

const INITIAL_STATE = {
  salutation: 'Mr.',
  fullName: '',
  company: '',
  gstin: '',
  pan: '',
  address: '',
  areaPinCode: '',
  cityState: '',
  email: '',
  mobile: '',
  salesPerson: '',
  gstTreatment: 'Regular_OR_UnRegd',
  gstType: 'CGST + SGST',
  priceList: 'MRP'
};

export default function NewVendorModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addVendor } = useDataStore();

  const fetchCityState = async (pinCode) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
      const data = await response.json();
      if (data && data[0] && data[0].Status === 'Success') {
        const postOffice = data[0].PostOffice[0];
        const area = postOffice.Name;
        const cityState = `${postOffice.District} / ${postOffice.State}`;
        
        setFormData(prev => ({ 
          ...prev, 
          areaPinCode: `${area} - ${pinCode}`,
          cityState: cityState 
        }));
        toast.success(`Auto-filled details for PIN: ${pinCode}`);
      }
    } catch (error) {
      console.error('Error fetching PIN details:', error);
    }
  };

  const handleAddressBlur = async () => {
    if (!formData.address || formData.address.length < 3) return;
    
    // If it already contains a PIN code, our other logic handled it
    if (/\b[1-9][0-9]{5}\b/.test(formData.address)) return;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.address)}&format=json&addressdetails=1&countrycodes=in&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const addressDetails = data[0].address;
        const pinCode = addressDetails.postcode || '';
        const city = addressDetails.city || addressDetails.town || addressDetails.state_district || addressDetails.county || '';
        const state = addressDetails.state || '';
        const area = addressDetails.suburb || addressDetails.neighbourhood || city;
        
        const newAreaPin = pinCode ? `${area} - ${pinCode}` : area;
        const newCityState = (city && state) ? `${city} / ${state}` : (city || state);

        if (newAreaPin || newCityState) {
          setFormData(prev => ({ 
            ...prev, 
            areaPinCode: prev.areaPinCode || newAreaPin,
            cityState: prev.cityState || newCityState 
          }));
          toast.success('Auto-filled location details from address');
        }
      }
    } catch (error) {
      console.error('Error fetching address details:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-fill logic
    if (field === 'address') {
      const pinMatch = value.match(/\b[1-9][0-9]{5}\b/);
      if (pinMatch) {
        if (!formData.areaPinCode.includes(pinMatch[0])) {
          fetchCityState(pinMatch[0]);
        }
      }
    } else if (field === 'areaPinCode') {
      const pinMatch = value.match(/\b[1-9][0-9]{5}\b/);
      if (pinMatch && pinMatch[0].length === 6) {
        if (!formData.areaPinCode.includes(pinMatch[0]) || formData.cityState === '') {
          fetchCityState(pinMatch[0]);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobile || !formData.gstType || !formData.areaPinCode) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const vendorName = `${formData.salutation} ${formData.fullName}`.trim();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const finalData = { ...formData, vendorName };
      addVendor(finalData);

      toast.success('Vendor added successfully!');
      if (onSave) {
        onSave(finalData);
      }
      setFormData(INITIAL_STATE);
      onClose();
    } catch (error) {
      toast.error('Failed to add vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="New Vendor Master"
      onSubmit={handleSubmit}
      submitText={isSubmitting ? 'Saving...' : 'Save New'}
      maxWidth="max-w-4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        
        {/* Left Column */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700">Vendor<span className="text-red-500">*</span></label>
            <div className="flex-1 flex gap-2 min-w-0">
              <select 
                value={formData.salutation} 
                onChange={(e) => handleChange('salutation', e.target.value)}
                className="w-20 shrink-0 px-2 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
              >
                <option>Mr.</option>
                <option>Mrs.</option>
                <option>Ms.</option>
                <option>Dr.</option>
              </select>
              <input 
                type="text" 
                placeholder="Full Name"
                value={formData.fullName} 
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="flex-1 min-w-0 w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700">Company</label>
            <input 
              type="text" 
              value={formData.company} 
              onChange={(e) => handleChange('company', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700">GSTIN</label>
            <input 
              type="text" 
              value={formData.gstin} 
              onChange={(e) => handleChange('gstin', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700">PAN</label>
            <input 
              type="text" 
              value={formData.pan} 
              onChange={(e) => handleChange('pan', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700 pt-2">Address</label>
            <textarea 
              rows="2"
              value={formData.address} 
              onChange={(e) => handleChange('address', e.target.value)}
              onBlur={handleAddressBlur}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none resize-none"
            ></textarea>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700">Area / PIN Code<span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={formData.areaPinCode} 
              onChange={(e) => handleChange('areaPinCode', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700">City / State</label>
            <input 
              type="text" 
              value={formData.cityState} 
              onChange={(e) => handleChange('cityState', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700">Email</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => handleChange('email', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700">Mobile<span className="text-red-500">*</span></label>
            <input 
              type="tel" 
              value={formData.mobile} 
              onChange={(e) => handleChange('mobile', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700">Sales Person</label>
            <select 
              value={formData.salesPerson} 
              onChange={(e) => handleChange('salesPerson', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            >
              <option value="">Select</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Sales Executive">Sales Executive</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700">GST Treatment</label>
            <select 
              value={formData.gstTreatment} 
              onChange={(e) => handleChange('gstTreatment', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            >
              <option value="Regular_OR_UnRegd">Regular_OR_UnRegd</option>
              <option value="Registered">Registered</option>
              <option value="Unregistered">Unregistered</option>
              <option value="Consumer">Consumer</option>
              <option value="Overseas">Overseas</option>
              <option value="SEZ">SEZ</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700">GST Type<span className="text-red-500">*</span></label>
            <select 
              value={formData.gstType} 
              onChange={(e) => handleChange('gstType', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
              required
            >
              <option value="CGST + SGST">CGST + SGST</option>
              <option value="IGST">IGST</option>
              <option value="Exempt">Exempt</option>
              <option value="Nil Rated">Nil Rated</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/3 text-sm font-bold text-slate-700">Price List</label>
            <select 
              value={formData.priceList} 
              onChange={(e) => handleChange('priceList', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            >
              <option value="MRP">MRP</option>
              <option value="Standard">Standard</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Retail">Retail</option>
            </select>
          </div>
        </div>

      </div>
    </ModalForm>
  );
}

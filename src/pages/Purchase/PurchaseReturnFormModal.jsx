import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import useDataStore from '../../store/dataStore';
import { createPurchaseReturn, updatePurchaseReturn } from '../../services/PurchaseReturnService';
import VendorDetailsSection from '../../components/purchase/VendorDetailsSection';
import NewVendorModal from '../../components/purchase/NewVendorModal';
import SalesTabs from '../../components/sales/SalesTabs';
import ItemLinesTable from '../../components/sales/ItemLinesTable';
import SummaryCard from '../../components/sales/SummaryCard';
import OtherInformationTab from '../../components/OtherInformationTab';
import CatalogModal from '../QuotationForm/CatalogModal';
import { MessageSquare, StickyNote, Activity } from 'lucide-react';

export default function PurchaseReturnFormModal({ isOpen, onClose, onSave, initialData, isConversion = false }) {
  const [activeTab, setActiveTab] = useState('ItemLines');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  
  const { items: inventoryItems, fetchItems } = useDataStore();

  useEffect(() => {
    if (isOpen) fetchItems(true);
  }, [isOpen, fetchItems]);

  const [headerInfo, setHeaderInfo] = useState({
    returnDate: ''
  });

  const [basicInfo, setBasicInfo] = useState({
    vendor: '',
    address: '',
    areaPinCode: '',
    cityState: '',
    state: '',
    email: '',
    mobile: '',
    validityDate: '',
    priceList: 'Standard',
    paymentTerms: 'Net 30'
  });

  const getEmptyItem = (type = 'item') => ({ id: Date.now() + Math.random(), type, itemCode: '', description: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0, netAmount: 0 });
  const [items, setItems] = useState([getEmptyItem()]);

  const [otherInfo, setOtherInfo] = useState({
    internalNotes: ''
  });

  const [notes, setNotes] = useState({
    remarks: '',
    termsAndConditions: ''
  });

  const [summary, setSummary] = useState({
    grossAmount: 0,
    discountAmount: 0,
    taxAmount: 0,
    roundOffAmount: 0,
    totalAmount: 0
  });

  useEffect(() => {
    if (initialData) {
      // Map flat structure back to component state (handling backward compatibility)
      const details = initialData.details || {};
      const initialBasic = details.basicInfo || details.vendorBasicInfo || {};
      
      setBasicInfo({
        vendor: initialData.vendorName || initialData.vendor_name || initialData.vendor || initialBasic.vendor || '',
        address: initialData.vendor_address || initialBasic.address || '',
        areaPinCode: initialData.vendor_area_pin_code || initialBasic.areaPinCode || '',
        cityState: initialData.vendor_city_state || initialBasic.cityState || '',
        state: initialData.vendor_state || initialBasic.state || '',
        email: initialData.vendor_email || initialBasic.email || '',
        mobile: initialData.vendor_mobile || initialBasic.mobile || '',
        validityDate: initialData.validity_date || initialBasic.validityDate || '',
        priceList: initialData.price_list || initialBasic.priceList || 'Standard',
        paymentTerms: initialData.payment_terms || initialBasic.paymentTerms || 'Net 30'
      });

      setOtherInfo({
        internalNotes: initialData.internal_notes || details.otherInfo?.internalNotes || ''
      });

      setNotes({
        remarks: initialData.remarks || details.notes?.remarks || '',
        termsAndConditions: initialData.terms_conditions || details.notes?.termsAndConditions || ''
      });

      if (initialData.items && initialData.items.length > 0) {
        setItems(initialData.items.map(item => ({...item, id: Date.now() + Math.random()})));
      } else if (details.items && details.items.length > 0) {
        setItems(details.items.map(item => ({...item, id: Date.now() + Math.random()})));
      }
      
      if (initialData.date || initialData.docDate) {
         setHeaderInfo(prev => ({...prev, returnDate: initialData.date || initialData.docDate}));
      }
    }
  }, [initialData]);

  useEffect(() => {
    let gross = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const newItems = items.map(item => {
      if (item.type && item.type !== 'item') return { ...item, netAmount: 0 };
      const rowGross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      const rowDiscount = rowGross * ((Number(item.discountPercent) || 0) / 100);
      const afterDiscount = rowGross - rowDiscount;
      const rowTax = afterDiscount * ((Number(item.taxPercent) || 0) / 100);
      const net = afterDiscount + rowTax;
      
      gross += rowGross;
      totalDiscount += rowDiscount;
      totalTax += rowTax;

      return { ...item, netAmount: net };
    });

    const total = gross - totalDiscount + totalTax;
    const roundedTotal = Math.round(total);
    const roundOff = roundedTotal - total;

    setSummary(prev => ({
      ...prev,
      grossAmount: gross,
      discountAmount: totalDiscount,
      taxAmount: totalTax,
      roundOffAmount: roundOff,
      totalAmount: roundedTotal
    }));
  }, [items]);

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) return { ...item, [field]: value };
      return item;
    }));
  };

  const handleItemCodeSelect = (code, rowId) => {
    const item = inventoryItems.find(i => (i.ItemCode || i.code) === code);
    if (item) {
      setItems(prev => {
        const newItems = prev.map(p => p.id === rowId ? {
          ...p,
          itemCode: code,
          description: item.ItemName || item.name || '',
          unitPrice: Number(item.MRP || item.price || 0)
        } : p);
        if (prev[prev.length - 1].id === rowId) {
          newItems.push(getEmptyItem('item'));
        }
        return newItems;
      });
    }
  };

  const addItemLine = () => setItems(prev => [...prev, getEmptyItem('item')]);
  const addSection = () => setItems(prev => [...prev, getEmptyItem('section')]);
  const addSubSection = () => setItems(prev => [...prev, getEmptyItem('subsection')]);
  const removeItemLine = (id) => {
    if (items.length > 1) setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCatalogSubmit = (cartItems) => {
    const newLines = cartItems.map(ci => ({
      ...getEmptyItem('item'),
      itemCode: ci.ItemCode || ci.code,
      description: ci.ItemName || ci.name || '',
      quantity: ci.selectedQty || 1,
      unitPrice: Number(ci.MRP || ci.price || 0)
    }));
    setItems(prev => {
      const filtered = prev.filter(i => i.itemCode !== '');
      return [...filtered, ...newLines, getEmptyItem('item')];
    });
    toast.success(`${cartItems.length} item(s) added from Catalog!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!basicInfo.vendor) {
      toast.error('Vendor name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        return_no: `PR-${Math.floor(1000 + Math.random() * 9000)}`,
        date: headerInfo.returnDate || new Date().toISOString().split('T')[0],
        vendor_name: basicInfo.vendor,
        status: 'Active',
        vendor_address: basicInfo.address || '',
        vendor_area_pin_code: basicInfo.areaPinCode || '',
        vendor_city_state: basicInfo.cityState || '',
        vendor_state: basicInfo.state || '',
        vendor_email: basicInfo.email || '',
        vendor_mobile: basicInfo.mobile || '',
        validity_date: basicInfo.validityDate || '',
        price_list: basicInfo.priceList || '',
        payment_terms: basicInfo.paymentTerms || '',
        internal_notes: otherInfo.internalNotes || '',
        remarks: notes.remarks || '',
        terms_conditions: notes.termsAndConditions || '',
        gross_amount: summary.grossAmount || 0,
        discount_amount: summary.discountAmount || 0,
        tax_amount: summary.taxAmount || 0,
        round_off_amount: summary.roundOffAmount || 0,
        total_amount: summary.totalAmount || 0,
        ref_purchase: initialData?.docNo || initialData?.ref_purchase || '-',
        items: items.filter(i => i.itemCode !== '' || i.type !== 'item') // Filter out empty blank lines
      };
      
      let saved;
      if (initialData && initialData.id && !isConversion) {
        saved = await updatePurchaseReturn(initialData.id, data);
      } else {
        saved = await createPurchaseReturn(data);
      }
      onSave(saved);
    } catch (error) {
      toast.error('Failed to save purchase return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={initialData && initialData.id && !isConversion ? "Edit Purchase Return" : (isConversion ? "New Purchase Return (From Purchase)" : "New Purchase Return")}
      onSubmit={handleSubmit}
      submitText={isSubmitting ? 'Saving...' : (initialData && initialData.id && !isConversion ? 'Update Purchase Return' : 'Save Purchase Return')}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-6">
        
        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
          <div className="flex gap-4 items-center">
            <span className="text-xs font-bold text-slate-700">Return Date</span>
            <input type="date" value={headerInfo.returnDate} onChange={e => setHeaderInfo({...headerInfo, returnDate: e.target.value})} className="px-2 py-1 border border-slate-200 rounded text-xs outline-none" />
          </div>
        </div>

        <VendorDetailsSection 
          basicInfo={basicInfo} 
          setBasicInfo={setBasicInfo} 
          onOpenVendorModal={() => setIsVendorModalOpen(true)} 
        />

        <div className="min-h-[250px] py-4">
          <ItemLinesTable 
            items={items}
            inventoryItems={inventoryItems}
            handleItemChange={handleItemChange}
            handleItemCodeSelect={handleItemCodeSelect}
            removeItemLine={removeItemLine}
            addItemLine={addItemLine}
            addSection={addSection}
            addSubSection={addSubSection}
            setIsCatalogOpen={setIsCatalogOpen}
            showUploadAndRemark={true}
          />
          <SummaryCard 
            summary={summary} 
            onFinalAmountChange={(val) => setSummary(prev => ({ ...prev, finalAmount: val }))} 
          />
        </div>

        {/* Footer Actions */}
        <div className="flex gap-6 border-t border-slate-100 pt-4 mt-4">
          <button type="button" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition">
            <MessageSquare size={16} /> Send Message
          </button>
          <button type="button" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition">
            <StickyNote size={16} /> Log Note
          </button>
          <button type="button" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition">
            <Activity size={16} /> Activities
          </button>
        </div>
      </div>
    </ModalForm>
    <CatalogModal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} onSubmitCart={handleCatalogSubmit} />
    <NewVendorModal
      isOpen={isVendorModalOpen}
      onClose={() => setIsVendorModalOpen(false)}
      onSave={(vendor) => {
        setBasicInfo(prev => ({ ...prev, vendor: vendor.vendorName }));
        toast.success(`Vendor "${vendor.vendorName}" added!`);
      }}
    />
    </>
  );
}
